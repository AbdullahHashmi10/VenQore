<?php

namespace App\Services\VenSynQ\Platforms;

/**
 * PlatformClient — the shared contract every VenSynQ marketplace adapter implements.
 *
 * T16: Extracted so that VenSynQController / VenSynQSyncJob / TokenRefreshJob can
 * resolve ANY platform (amazon, tiktok, ebay, woocommerce) through one uniform
 * interface instead of hand-rolled match() expressions that silently blow up with
 * \UnhandledMatchError the moment a new platform row lands in the database.
 *
 * ── NormalizedOrderItem ───────────────────────────────────────────────────────
 * fetchOrders() must return a flat array of associative arrays shaped exactly:
 *
 *   [
 *     'sku'              => string,   // Seller SKU as known to the marketplace
 *     'quantity'         => int,
 *     'sale_price'       => float,    // Unit price (NOT line total)
 *     'platform_fee'     => ?float,   // null => fall back to channel fee_percentage
 *     'channel_order_id' => string,   // Marketplace order id — the dedupe key
 *     'fulfillment_type' => 'fbm'|'fba'|'jit',
 *     'currency'         => string,   // ISO-4217, 3 chars
 *   ]
 *
 * SmartFulfillmentService groups by channel_order_id and decides inventory
 * treatment from fulfillment_type:
 *   fbm → deduct local stock + post sales journal
 *   fba → post revenue/fee journal ONLY (stock already sits in the marketplace's
 *         warehouse; deducting locally would double-count)
 *   jit → raise a draft purchase invoice for day-of procurement
 */
interface PlatformClient
{
    /**
     * Stable machine key for this platform, matching ecommerce_channels.platform.
     */
    public function platformKey(): string;

    /**
     * URL the merchant is redirected to in order to grant access.
     */
    public function getAuthorizationUrl(): string;

    /**
     * Exchange the authorization code for credentials.
     *
     * @return array{access_token?: string, refresh_token?: string, expires_in?: int, seller_id?: string}
     */
    public function handleCallback(string $code): array;

    /**
     * Rotate a short-lived access token using the long-lived refresh token.
     *
     * @return array{access_token?: string, refresh_token?: string, expires_in?: int}
     */
    public function refreshAccessToken(string $refreshToken): array;

    /**
     * Pull recent orders and normalize them (see NormalizedOrderItem above).
     *
     * @return array<int, array<string, mixed>>
     */
    public function fetchOrders(string $accessToken): array;

    /**
     * Push dispatch + tracking details back to the marketplace.
     */
    public function pushTracking(string $accessToken, string $orderId, string $trackingNumber, string $carrier): bool;

    /**
     * Cheap round-trip used by the "Test Connection" button and the health badge.
     * MUST NOT throw — return a structured result instead.
     *
     * @return array{ok: bool, message: string, latency_ms?: int}
     */
    public function testConnection(string $accessToken): array;

    /**
     * Push an absolute stock level for a SKU back to the marketplace.
     * Returns false (never throws) when the platform has no stock endpoint or
     * the SKU is unmapped — the caller flags it in the Action Required queue.
     */
    public function pushStock(string $accessToken, string $sku, float $quantity): bool;
}
