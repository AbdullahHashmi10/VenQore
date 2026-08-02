<?php

namespace App\Jobs;

use App\Models\EcommerceChannel;
use App\Models\Tenant;
use App\Services\VenSynQ\PlatformRegistry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * TokenRefreshJob — rotates short-lived marketplace access tokens.
 *
 * ══ T16 AUDIT: five defects fixed ═════════════════════════════════════════════
 *
 * 1. SILENT TOTAL FAILURE (critical, same root cause as VenSynQSyncJob).
 *    EcommerceChannel uses HasTenant. With no tenant bound and no authenticated
 *    user — the normal state inside a queue worker — the global scope degrades to
 *    `whereRaw('1 = 0')`. Every run found zero expiring channels and logged
 *    success while tokens quietly expired and syncs began failing 401. Fixed with
 *    withoutTenantScope().
 *
 * 2. UNCATCHABLE ERROR ON UNKNOWN PLATFORM.
 *    The switch had no default, so $tokens stayed [] for an unrecognised platform
 *    and the channel was skipped with no error recorded — invisible breakage.
 *    Resolution now runs through PlatformRegistry.
 *
 * 3. WOOCOMMERCE FALSE POSITIVE.
 *    Woo authenticates with a non-expiring consumer key/secret pair and stores no
 *    refresh token. Under the old logic every Woo channel matched the
 *    "expiring" filter (access_token_expires_at IS NULL), hit the empty-refresh-
 *    token branch, and was force-disconnected on the first run. Woo is now
 *    excluded via PlatformRegistry::rotatesTokens().
 *
 * 4. REFRESH TOKEN ROTATION DROPPED.
 *    Amazon and eBay may return a NEW refresh token alongside the access token.
 *    The old code persisted only access_token, so the next rotation used a
 *    revoked refresh token and the channel died. Now persisted when returned.
 *
 * 5. NO OVERLAP PROTECTION / SILENT NO-OP.
 *    Concurrent runs could race the same channel, and a response with no
 *    access_token was ignored without recording an error. Both fixed.
 */
class TokenRefreshJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 3;

    public array $backoff = [30, 120];

    public int $uniqueFor = 600;

    public function uniqueId(): string
    {
        return 'vensynq-token-refresh';
    }

    public function handle(PlatformRegistry $registry): void
    {
        if (!config('vensynq.enabled', false)) {
            return;
        }

        Log::info('[VenSynQ] Token rotation started.');

        $previousTenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        $rotated = 0;
        $failed  = 0;

        try {
            EcommerceChannel::withoutTenantScope()
                ->where('is_connected', true)
                // Only platforms that actually rotate tokens. Keeps WooCommerce
                // out of the result set entirely rather than filtering later.
                ->whereIn('platform', array_values(array_filter(
                    $registry->supported(),
                    fn (string $p) => $registry->rotatesTokens($p)
                )))
                ->where(function ($query) {
                    $query->where('access_token_expires_at', '<=', now()->addMinutes(15))
                          ->orWhereNull('access_token_expires_at');
                })
                ->orderBy('id')
                ->chunkById(50, function ($channels) use ($registry, &$rotated, &$failed) {
                    foreach ($channels as $channel) {
                        $this->rotate($channel, $registry) ? $rotated++ : $failed++;
                    }
                });
        } finally {
            if ($previousTenant) {
                app()->instance('current.tenant', $previousTenant);
            } else {
                app()->forgetInstance('current.tenant');
            }
        }

        Log::info('[VenSynQ] Token rotation finished.', ['rotated' => $rotated, 'failed' => $failed]);
    }

    /**
     * Rotate one channel. Catches Throwable so a single bad channel can never
     * abort the sweep for everyone else.
     */
    private function rotate(EcommerceChannel $channel, PlatformRegistry $registry): bool
    {
        try {
            $tenant = Tenant::find($channel->tenant_id);

            if ($tenant) {
                // Needed so the model's encrypt/decrypt accessors and any
                // tenant-scoped side effects resolve against the right store.
                app()->instance('current.tenant', $tenant);
            }

            $refreshToken = $channel->oauth_refresh_token;

            if (empty($refreshToken)) {
                Log::warning('[VenSynQ] Channel has no refresh token; disconnecting.', [
                    'channel_id' => $channel->id,
                    'platform'   => $channel->platform,
                ]);

                $channel->forceFill([
                    'is_connected'       => false,
                    'sync_status'        => 'error',
                    'sync_error_message' => 'No refresh token stored. Reconnect this channel to re-authorize.',
                    'last_error_at'      => now(),
                ])->save();

                return false;
            }

            // Catchable InvalidArgumentException, unlike the previous silent skip.
            $client = $registry->resolve($channel->platform);
            $tokens = $client->refreshAccessToken($refreshToken);

            if (empty($tokens['access_token'])) {
                // Previously this branch did nothing at all — the channel looked
                // healthy while holding a dead token. Now it is recorded.
                $channel->forceFill([
                    'sync_status'          => 'error',
                    'sync_error_message'   => 'Token rotation returned no access token. Reconnect this channel.',
                    'last_error_at'        => now(),
                    'consecutive_failures' => (int) ($channel->consecutive_failures ?? 0) + 1,
                ])->save();

                return false;
            }

            $updates = [
                'oauth_access_token'      => $tokens['access_token'],
                'access_token_expires_at' => isset($tokens['expires_in'])
                    ? now()->addSeconds((int) $tokens['expires_in'])
                    : null,
                'sync_error_message'      => null,
                'consecutive_failures'    => 0,
            ];

            // Persist a rotated refresh token when the platform issues one.
            // Dropping this was defect #4 — the next rotation would 401.
            if (!empty($tokens['refresh_token']) && $tokens['refresh_token'] !== $refreshToken) {
                $updates['oauth_refresh_token'] = $tokens['refresh_token'];
                $updates['refresh_token_expires_at'] = match ($channel->platform) {
                    'amazon' => now()->addYear(),
                    'ebay'   => now()->addMonths(18),
                    default  => now()->addDays(90),
                };
            }

            // Clear a stale error state so the health badge goes green again.
            if ($channel->sync_status === 'error') {
                $updates['sync_status'] = 'idle';
            }

            $channel->forceFill($updates)->save();

            Log::info('[VenSynQ] Access token rotated.', [
                'channel_id' => $channel->id,
                'platform'   => $channel->platform,
            ]);

            return true;
        } catch (Throwable $e) {
            Log::error('[VenSynQ] Token rotation failed.', [
                'channel_id' => $channel->id,
                'platform'   => $channel->platform,
                'error'      => $e->getMessage(),
            ]);

            $channel->forceFill([
                'sync_status'          => 'error',
                'sync_error_message'   => 'Token refresh failed: ' . $e->getMessage(),
                'last_error_at'        => now(),
                'consecutive_failures' => (int) ($channel->consecutive_failures ?? 0) + 1,
            ])->save();

            return false;
        }
    }
}
