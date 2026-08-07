<?php

namespace App\Services\VenSynQ\Platforms;

use App\Models\WooConnection;
use App\Services\WooSync\WooApiClient;
use Illuminate\Support\Facades\Log;

/**
 * WooCommerceClient — T16: WooCommerce promoted to a first-class VenSynQ platform.
 *
 * ── Why an adapter and not a rewrite ──────────────────────────────────────────
 * The WooSync module (SyncEngine / WooApiClient / FieldMapper) is a mature,
 * working *catalogue* sync: products, variations, categories, webhooks, conflict
 * resolution. VenSynQ is an *order + fulfillment* engine. They were never joined,
 * so a merchant had two disconnected screens and Woo never appeared on the
 * VenSynQ health dashboard.
 *
 * This adapter makes an `EcommerceChannel` row the VenSynQ face of an existing
 * `WooConnection`, joined by:
 *
 *     ecommerce_channels.external_seller_id  ===  woo_connections.uuid
 *
 * Credentials are NOT duplicated. They stay encrypted on WooConnection exactly
 * where SyncEngine already expects them. The `$accessToken` argument required by
 * the PlatformClient contract therefore carries the WooConnection **uuid**, not a
 * bearer token — Woo authenticates with a consumer key/secret pair that never
 * expires, so there is nothing to rotate.
 *
 * Consequence for TokenRefreshJob: shouldRotateTokens() returns false, so a Woo
 * channel is skipped rather than being marked "expired" and force-disconnected.
 */
class WooCommerceClient implements PlatformClient
{
    public function platformKey(): string
    {
        return 'woocommerce';
    }

    /**
     * Woo has no OAuth consent screen in our flow — the merchant installs the
     * VenQore plugin, which performs the handshake. Send them to the existing
     * zero-config connection wizard.
     */
    public function getAuthorizationUrl(): string
    {
        return route('store.woo.connections.index', [
            'store_slug' => app('current.tenant')->slug,
        ]);
    }

    /**
     * The "code" here is the WooConnection uuid produced by the plugin handshake.
     * We return it as the access token so the channel row can bind to it.
     */
    public function handleCallback(string $code): array
    {
        $connection = $this->resolveConnection($code);

        if (!$connection) {
            throw new \RuntimeException(
                'No active WooCommerce connection found. Install the VenQore Sync plugin on your WordPress site first.'
            );
        }

        return [
            'access_token'  => $connection->uuid,
            'refresh_token' => null,
            'expires_in'    => null,
            'seller_id'     => $connection->uuid,
        ];
    }

    /**
     * Woo credentials do not expire. Echo the value back so callers that blindly
     * persist the result do not null out a working connection.
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        return [
            'access_token' => $refreshToken,
            'expires_in'   => null,
        ];
    }

    /**
     * Pull recent WooCommerce orders and normalize to NormalizedOrderItem[].
     *
     * WooCommerce is always merchant-fulfilled, so every line is 'fbm' — local
     * stock IS deducted and a full sales journal IS posted. There is no
     * marketplace commission, so platform_fee is a hard 0.0 rather than null
     * (null would make SmartFulfillmentService apply the channel's estimated
     * fee_percentage and invent an expense that does not exist).
     */
    public function fetchOrders(string $accessToken): array
    {
        $connection = $this->resolveConnection($accessToken);

        if (!$connection) {
            throw new \RuntimeException('WooCommerce connection is missing or inactive. Reconnect the site.');
        }

        $api    = new WooApiClient($connection);
        $orders = $api->getOrders([
            'status'   => 'processing,completed',
            'after'    => now()->subHours(25)->toIso8601String(),
            'per_page' => 100,
        ]);

        $normalized = [];

        foreach ($orders as $order) {
            $orderId  = (string) ($order['id'] ?? '');
            $currency = $order['currency'] ?? 'GBP';

            if ($orderId === '') {
                continue;
            }

            foreach (($order['line_items'] ?? []) as $line) {
                $sku = trim((string) ($line['sku'] ?? ''));
                $qty = (int) ($line['quantity'] ?? 0);

                // Unmapped SKU / zero-qty lines are skipped here and surfaced by
                // SmartFulfillmentService in the Action Required queue instead of
                // being silently dropped into an orphan sale.
                if ($sku === '' || $qty <= 0) {
                    Log::warning('[VenSynQ:Woo] Skipping order line with missing SKU or quantity', [
                        'connection_id' => $connection->id,
                        'order_id'      => $orderId,
                    ]);
                    continue;
                }

                // Woo reports line totals, not unit price. Derive the unit price
                // and prefer the explicit `price` field when Woo supplies it.
                $lineTotal = (float) ($line['total'] ?? 0);
                $unitPrice = isset($line['price'])
                    ? (float) $line['price']
                    : ($qty > 0 ? $lineTotal / $qty : 0.0);

                $normalized[] = [
                    'sku'              => $sku,
                    'quantity'         => $qty,
                    'sale_price'       => round($unitPrice, 4),
                    'platform_fee'     => 0.0,
                    'channel_order_id' => 'WC-' . $orderId,
                    'fulfillment_type' => 'fbm',
                    'currency'         => $currency,
                ];
            }
        }

        return $normalized;
    }

    /**
     * Woo has no native tracking field, so we mark the order completed and
     * attach a customer-visible order note carrying the carrier + tracking id.
     */
    public function pushTracking(string $accessToken, string $orderId, string $trackingNumber, string $carrier): bool
    {
        $connection = $this->resolveConnection($accessToken);

        if (!$connection) {
            return false;
        }

        // Strip the WC- prefix we added in fetchOrders() to get Woo's numeric id.
        $wooOrderId = (int) preg_replace('/^WC-/', '', $orderId);

        if ($wooOrderId <= 0) {
            return false;
        }

        $api = new WooApiClient($connection);

        $updated = $api->updateOrder($wooOrderId, [
            'status'     => 'completed',
            'meta_data'  => [
                ['key' => '_venqore_tracking_number', 'value' => $trackingNumber],
                ['key' => '_venqore_tracking_carrier', 'value' => $carrier],
            ],
        ]);

        if ($updated === null) {
            return false;
        }

        $api->createOrderNote($wooOrderId, "Shipped via {$carrier}. Tracking: {$trackingNumber}", true);

        return true;
    }

    /**
     * Bidirectional stock sync — push an absolute local stock level up to Woo.
     * Called whenever a POS sale changes on-hand quantity for a mapped SKU.
     */
    public function pushStock(string $accessToken, string $sku, float $quantity): bool
    {
        $connection = $this->resolveConnection($accessToken);

        if (!$connection) {
            return false;
        }

        $api = new WooApiClient($connection);

        return $api->updateStockBySku($sku, $quantity);
    }

    /**
     * Cheap authenticated round-trip for the Test Connection button + health badge.
     */
    public function testConnection(string $accessToken): array
    {
        $connection = $this->resolveConnection($accessToken);

        if (!$connection) {
            return ['ok' => false, 'message' => 'No active WooCommerce connection is bound to this channel.'];
        }

        $startedAt = microtime(true);

        try {
            $ok = (new WooApiClient($connection))->ping();
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'WooCommerce unreachable: ' . $e->getMessage()];
        }

        $latency = (int) round((microtime(true) - $startedAt) * 1000);

        return $ok
            ? ['ok' => true, 'message' => "Connected to {$connection->site_url}", 'latency_ms' => $latency]
            : ['ok' => false, 'message' => 'WooCommerce rejected the API credentials. Regenerate the key pair.', 'latency_ms' => $latency];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Resolve the WooConnection behind a channel.
     *
     * withoutTenantScope() is deliberate: this runs from queue workers where no
     * tenant is bound, and HasTenant would otherwise degrade to whereRaw('1 = 0')
     * and return nothing. The uuid is a unique, unguessable key, and every caller
     * has already been tenant-authorized upstream.
     */
    private function resolveConnection(string $uuid): ?WooConnection
    {
        if (trim($uuid) === '') {
            return null;
        }

        return WooConnection::withoutTenantScope()
            ->where('uuid', $uuid)
            ->whereIn('status', ['active', 'pending'])
            ->first();
    }
}
