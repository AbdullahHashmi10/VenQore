<?php

namespace App\Services\VenSynQ;

use App\Models\EcommerceChannel;
use App\Models\WooConnection;
use Illuminate\Support\Collection;

/**
 * IntegrationHealthService — computes the Green / Yellow / Red badges shown on
 * the VenSynQ dashboard for API connection, webhook status and token expiry.
 *
 * Deliberately does NO network I/O. The dashboard must paint instantly from
 * local state (T16 §3 "Instant Local Feedback"); a live probe would block the
 * Inertia response on a third-party API. Live probing happens only when the
 * merchant explicitly presses "Test Connection".
 */
class IntegrationHealthService
{
    public const OK    = 'green';
    public const WARN  = 'yellow';
    public const ERROR = 'red';

    public function __construct(private PlatformRegistry $registry)
    {
    }

    /**
     * Build the full health payload for a set of channels.
     *
     * @param  Collection<int, EcommerceChannel>  $channels
     */
    public function summarize(Collection $channels): array
    {
        $perChannel = $channels->map(fn (EcommerceChannel $c) => $this->forChannel($c))->values()->all();

        // Overall badge is the worst individual badge — a merchant should never
        // see "all good" while one channel is silently broken.
        $overall = self::OK;
        foreach ($perChannel as $health) {
            if ($health['status'] === self::ERROR) {
                $overall = self::ERROR;
                break;
            }
            if ($health['status'] === self::WARN) {
                $overall = self::WARN;
            }
        }

        return [
            'overall'          => $channels->isEmpty() ? self::WARN : $overall,
            'channels'         => $perChannel,
            'connected_count'  => $channels->where('is_connected', true)->count(),
            'error_count'      => collect($perChannel)->where('status', self::ERROR)->count(),
            'warning_count'    => collect($perChannel)->where('status', self::WARN)->count(),
            'computed_at'      => now()->toIso8601String(),
        ];
    }

    /**
     * Three independent signals per channel, plus a rolled-up status.
     */
    public function forChannel(EcommerceChannel $channel): array
    {
        $api     = $this->apiSignal($channel);
        $token   = $this->tokenSignal($channel);
        $webhook = $this->webhookSignal($channel);

        $signals = [$api, $token, $webhook];

        $status = self::OK;
        foreach ($signals as $signal) {
            if ($signal['status'] === self::ERROR) {
                $status = self::ERROR;
                break;
            }
            if ($signal['status'] === self::WARN) {
                $status = self::WARN;
            }
        }

        return [
            'channel_id'     => $channel->id,
            'channel_name'   => $channel->name,
            'platform'       => $channel->platform,
            'platform_label' => $this->registry->label($channel->platform),
            'status'         => $status,
            'api'            => $api,
            'token'          => $token,
            'webhook'        => $webhook,
            'last_synced_at' => $channel->last_synced_at?->toIso8601String(),
            'sync_status'    => $channel->sync_status,
            'error_message'  => $channel->sync_error_message,
        ];
    }

    // ─── Signals ──────────────────────────────────────────────────────────────

    private function apiSignal(EcommerceChannel $channel): array
    {
        if (!$channel->is_connected) {
            return $this->signal(self::ERROR, 'Disconnected', 'This channel is not connected.');
        }

        if ($channel->sync_status === 'error') {
            return $this->signal(self::ERROR, 'Last sync failed', $channel->sync_error_message ?: 'Unknown sync error.');
        }

        if ((int) ($channel->consecutive_failures ?? 0) >= 3) {
            return $this->signal(self::ERROR, 'Repeated failures', "{$channel->consecutive_failures} consecutive sync failures.");
        }

        // Never synced yet is a warning, not an error — a freshly connected
        // channel is legitimately in this state until the first run.
        if (!$channel->last_synced_at) {
            return $this->signal(self::WARN, 'Never synced', 'Run Sync Now to pull the first batch of orders.');
        }

        if ($channel->last_synced_at->lt(now()->subHours(24))) {
            return $this->signal(self::WARN, 'Stale', 'No successful sync in over 24 hours.');
        }

        return $this->signal(self::OK, 'Healthy', 'API responding on the last sync.');
    }

    private function tokenSignal(EcommerceChannel $channel): array
    {
        // Woo uses a non-expiring consumer key/secret pair — flagging it as
        // "expiring" would be a permanent false alarm.
        if (!$this->registry->rotatesTokens($channel->platform)) {
            return $this->signal(self::OK, 'Not applicable', 'WooCommerce keys do not expire.');
        }

        if (!$channel->is_connected) {
            return $this->signal(self::ERROR, 'No token', 'Reconnect this channel.');
        }

        $refreshExpiry = $channel->refresh_token_expires_at;

        if ($refreshExpiry && $refreshExpiry->isPast()) {
            return $this->signal(self::ERROR, 'Refresh token expired', 'Reconnect the channel to re-authorize.');
        }

        if ($refreshExpiry && $refreshExpiry->lt(now()->addDays(14))) {
            return $this->signal(
                self::WARN,
                'Re-authorization due',
                'Refresh token expires ' . $refreshExpiry->diffForHumans() . '.'
            );
        }

        $accessExpiry = $channel->access_token_expires_at;

        // An expired ACCESS token is only a warning: TokenRefreshJob rotates it
        // automatically every 10 minutes. Only the REFRESH token needs a human.
        if ($accessExpiry && $accessExpiry->isPast()) {
            return $this->signal(self::WARN, 'Access token stale', 'Automatic rotation will refresh it on the next run.');
        }

        return $this->signal(self::OK, 'Valid', $accessExpiry
            ? 'Access token valid until ' . $accessExpiry->toDayDateTimeString() . '.'
            : 'Token active.');
    }

    private function webhookSignal(EcommerceChannel $channel): array
    {
        // Only WooCommerce pushes webhooks to us today; the marketplace adapters
        // are pull-based, so "no webhook" is the correct healthy state for them.
        if ($channel->platform !== 'woocommerce') {
            return $this->signal(self::OK, 'Polling', 'This platform is polled on a schedule.');
        }

        $connection = WooConnection::withoutTenantScope()
            ->where('uuid', $channel->external_seller_id)
            ->first();

        if (!$connection) {
            return $this->signal(self::ERROR, 'Not linked', 'No WooCommerce site is bound to this channel.');
        }

        if ($connection->status === 'error') {
            return $this->signal(self::ERROR, 'Webhook failing', 'The WooCommerce site reported a delivery error.');
        }

        if ($connection->status === 'pending') {
            return $this->signal(self::WARN, 'Handshake pending', 'Finish plugin setup on the WordPress site.');
        }

        if ($connection->status === 'paused') {
            return $this->signal(self::WARN, 'Paused', 'Sync is paused for this site.');
        }

        return $this->signal(self::OK, 'Active', 'Webhooks registered and delivering.');
    }

    private function signal(string $status, string $label, string $detail): array
    {
        return ['status' => $status, 'label' => $label, 'detail' => $detail];
    }
}
