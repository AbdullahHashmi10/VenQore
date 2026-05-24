<?php

namespace App\Jobs;

use App\Models\EcommerceChannel;
use App\Models\Tenant;
use App\Services\VenSynQ\Platforms\AmazonClient;
use App\Services\VenSynQ\Platforms\TikTokClient;
use App\Services\VenSynQ\Platforms\EbayClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TokenRefreshJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(
        AmazonClient $amazon,
        TikTokClient $tiktok,
        EbayClient $ebay
    ): void {
        Log::info('VenSynQ: TokenRefreshJob Started.');

        // Find connected channels whose access token is expiring within the next 15 minutes or already expired
        $expiringChannels = EcommerceChannel::where('is_connected', true)
            ->where(function ($query) {
                $query->where('access_token_expires_at', '<=', now()->addMinutes(15))
                      ->orWhereNull('access_token_expires_at');
            })
            ->get();

        if ($expiringChannels->isEmpty()) {
            Log::info('VenSynQ: No expiring tokens found. TokenRefreshJob finished.');
            return;
        }

        foreach ($expiringChannels as $channel) {
            try {
                // Scope tenant container instance to support Eloquent decrypting or custom traits
                $tenant = Tenant::find($channel->tenant_id);
                if ($tenant) {
                    app()->instance('current.tenant', $tenant);
                }

                $refreshToken = $channel->oauth_refresh_token;
                if (empty($refreshToken)) {
                    Log::warning("VenSynQ: Expiring channel {$channel->name} has no refresh token. Disconnecting.");
                    $channel->update([
                        'is_connected' => false,
                        'sync_status'  => 'error',
                        'sync_error_message' => 'Token refresh failed: No refresh token present. Please reconnect.',
                    ]);
                    continue;
                }

                Log::info("VenSynQ: Rotating access token for channel {$channel->name} ({$channel->platform})");

                $tokens = [];
                switch ($channel->platform) {
                    case 'amazon':
                        $tokens = $amazon->refreshAccessToken($refreshToken);
                        break;
                    case 'tiktok':
                        $tokens = $tiktok->refreshAccessToken($refreshToken);
                        break;
                    case 'ebay':
                        $tokens = $ebay->refreshAccessToken($refreshToken);
                        break;
                }

                if (!empty($tokens['access_token'])) {
                    $channel->update([
                        'oauth_access_token'      => $tokens['access_token'],
                        'access_token_expires_at' => isset($tokens['expires_in']) ? now()->addSeconds((int)$tokens['expires_in']) : null,
                        'sync_error_message'      => null,
                    ]);
                    Log::info("VenSynQ: Successfully rotated token for channel {$channel->name}");
                }
            } catch (\Exception $e) {
                Log::error("VenSynQ: Token rotation failed for channel {$channel->name}: " . $e->getMessage());
                $channel->update([
                    'sync_status'        => 'error',
                    'sync_error_message' => 'Token refresh failed: ' . $e->getMessage(),
                ]);
            }
        }

        Log::info('VenSynQ: TokenRefreshJob Finished.');
    }
}
