<?php

namespace App\Services\VenSynQ\Platforms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TikTokClient implements PlatformClient
{
    public function platformKey(): string
    {
        return 'tiktok';
    }

    /**
     * T16 — health check. Never throws; returns a structured result.
     */
    public function testConnection(string $accessToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return ['ok' => true, 'message' => 'Simulation mode — connection assumed healthy.', 'latency_ms' => 0];
        }

        if (trim($accessToken) === '') {
            return ['ok' => false, 'message' => 'No access token stored. Reconnect the TikTok Shop channel.'];
        }

        $base = config('vensynq.platforms.tiktok.base_url', 'https://open-api.tiktokglobalshop.com');
        $startedAt = microtime(true);

        try {
            $response = Http::withHeaders(['x-tts-access-token' => $accessToken])
                ->timeout(15)
                ->get(rtrim($base, '/') . '/authorization/202309/shops');
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Could not reach TikTok Shop: ' . $e->getMessage()];
        }

        $latency = (int) round((microtime(true) - $startedAt) * 1000);

        if ($response->successful()) {
            return ['ok' => true, 'message' => 'TikTok Shop API responded successfully.', 'latency_ms' => $latency];
        }

        return [
            'ok'         => false,
            'message'    => in_array($response->status(), [401, 403], true)
                ? 'TikTok rejected the token. Reconnect the channel to re-authorize.'
                : 'TikTok Shop returned HTTP ' . $response->status() . '.',
            'latency_ms' => $latency,
        ];
    }

    /**
     * TikTok Shop stock updates require the Product API with seller approval.
     * Not wired yet — report unsupported rather than failing the sale.
     */
    public function pushStock(string $accessToken, string $sku, float $quantity): bool
    {
        Log::info('[VenSynQ:TikTok] pushStock skipped — Product API not wired', [
            'sku' => $sku,
            'qty' => $quantity,
        ]);

        return false;
    }

    /**
     * Build the TikTok Shop Partner Authorization URL.
     */
    public function getAuthorizationUrl(): string
    {
        if (config('vensynq.simulation_mode')) {
            return route('store.vensynq.callback', [
                'platform' => 'tiktok',
                'store_slug' => app('current.tenant')->slug,
                'code' => 'simulated_tiktok_auth_code_abc',
            ]);
        }

        $appKey = config('vensynq.platforms.tiktok.app_key');
        $redirectUri = url(config('vensynq.platforms.tiktok.redirect_uri'));

        return "https://services.tiktokshop.com/open/authorize" .
               "?app_key=" . urlencode($appKey) .
               "&state=" . urlencode(csrf_token()) .
               "&redirect_uri=" . urlencode($redirectUri);
    }

    /**
     * Swap TikTok auth code for Access & Refresh Tokens.
     */
    public function handleCallback(string $code): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'access_token' => 'sim_tiktok_access_token_' . bin2hex(random_bytes(16)),
                'refresh_token' => 'sim_tiktok_refresh_token_' . bin2hex(random_bytes(16)),
                'expires_in' => 2592000, // 30 days
            ];
        }

        $appKey = config('vensynq.platforms.tiktok.app_key');
        $appSecret = config('vensynq.platforms.tiktok.app_secret');

        $response = Http::get('https://auth.tiktokshop.com/api/v2/token/get', [
            'app_key' => $appKey,
            'app_secret' => $appSecret,
            'auth_code' => $code,
            'grant_type' => 'authorized_code',
        ]);

        if ($response->failed()) {
            Log::error('TikTok Shop Callback Exchange Failed', ['response' => $response->body()]);
            throw new \Exception('Failed to exchange authorization code for TikTok tokens.');
        }

        return $response->json('data') ?? [];
    }

    /**
     * Refresh access token using TikTok Refresh Token.
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'access_token' => 'sim_tiktok_access_token_' . bin2hex(random_bytes(16)),
                'expires_in' => 2592000,
            ];
        }

        $appKey = config('vensynq.platforms.tiktok.app_key');
        $appSecret = config('vensynq.platforms.tiktok.app_secret');

        $response = Http::get('https://auth.tiktokshop.com/api/v2/token/refresh', [
            'app_key' => $appKey,
            'app_secret' => $appSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            Log::error('TikTok Shop Token Refresh Failed', ['response' => $response->body()]);
            throw new \Exception('Failed to refresh TikTok access token.');
        }

        return $response->json('data') ?? [];
    }

    /**
     * Fetch TikTok Shop Orders and return in standardized format.
     */
    public function fetchOrders(string $accessToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return $this->getSimulatedOrders();
        }

        $appKey = config('vensynq.platforms.tiktok.app_key');

        // TikTok Shop API call for orders
        $response = Http::post('https://open-api.tiktokshop.com/api/v2/order/list', [
            'app_key' => $appKey,
            'access_token' => $accessToken,
            'timestamp' => time(),
            'order_status' => 111, // Shipped / Fulfillable
            'update_time_from' => now()->subHours(25)->timestamp,
        ]);

        if ($response->failed()) {
            Log::error('TikTok Shop Order Fetch Failed', ['body' => $response->body()]);
            throw new \Exception('Failed to fetch orders from TikTok Shop.');
        }

        $orderIds = collect($response->json('data.order_list') ?? [])->pluck('order_id')->toArray();
        if (empty($orderIds)) {
            return [];
        }

        // Get detailed line items
        $detailsResponse = Http::post('https://open-api.tiktokshop.com/api/v2/order/detail', [
            'app_key' => $appKey,
            'access_token' => $accessToken,
            'timestamp' => time(),
            'order_id_list' => $orderIds,
        ]);

        if ($detailsResponse->failed()) {
            return [];
        }

        $orders = $detailsResponse->json('data.order_list') ?? [];
        $normalized = [];

        foreach ($orders as $order) {
            $orderId = $order['order_id'];
            $items = $order['item_list'] ?? [];

            foreach ($items as $line) {
                // Determine price: subtotal after discounts divided by quantity
                $price = ($line['sku_sale_price'] ?? 0);

                $normalized[] = [
                    'sku'              => $line['seller_sku'] ?? '',
                    'quantity'         => $line['quantity'] ?? 1,
                    'sale_price'       => $price,
                    'platform_fee'     => null, // use channel percentage estimate
                    'channel_order_id' => $orderId,
                    'fulfillment_type' => 'fbm', // TikTok Shop UK is predominantly seller-fulfilled (FBM)
                    'currency'         => $order['currency'] ?? 'GBP',
                ];
            }
        }

        return $normalized;
    }

    /**
     * Push dispatch tracking details back to TikTok Shop API.
     */
    public function pushTracking(string $accessToken, string $orderId, string $trackingNumber, string $carrier): bool
    {
        if (config('vensynq.simulation_mode')) {
            Log::info("TikTok Client Simulated Tracking Push. Order={$orderId}, Tracking={$trackingNumber}, Carrier={$carrier}");
            return true;
        }

        $appKey = config('vensynq.platforms.tiktok.app_key');

        $response = Http::post('https://open-api.tiktokshop.com/api/v2/logistics/shipping/update', [
            'app_key' => $appKey,
            'access_token' => $accessToken,
            'timestamp' => time(),
            'order_id' => $orderId,
            'tracking_number' => $trackingNumber,
            'shipping_provider_id' => $this->mapCarrierToTikTokProviderId($carrier),
        ]);

        if ($response->failed()) {
            Log::error("TikTok Shop Tracking Push Failed for order {$orderId}", ['body' => $response->body()]);
            return false;
        }

        return true;
    }

    private function mapCarrierToTikTokProviderId(string $carrier): string
    {
        $carrier = strtolower(trim($carrier));
        $map = [
            'royal mail'  => '100021', // Example TikTok Provider IDs
            'evri'        => '100022',
            'dpd'         => '100023',
            'dhl'         => '100024',
        ];
        return $map[$carrier] ?? '100000'; // Fallback mapping provider ID
    }

    /**
     * Mock TikTok Shop orders.
     */
    private function getSimulatedOrders(): array
    {
        return [
            [
                'sku'              => 'PROD-A101', // Standard stock item
                'quantity'         => 2,
                'sale_price'       => 145.00,
                'platform_fee'     => 14.50,
                'channel_order_id' => '57929496739202029',
                'fulfillment_type' => 'fbm',
                'currency'         => 'GBP',
            ],
            [
                'sku'              => 'PROD-B202', // JIT Shortfall item
                'quantity'         => 1,
                'sale_price'       => 49.99,
                'platform_fee'     => 5.00,
                'channel_order_id' => '57929496739202058',
                'fulfillment_type' => 'jit',
                'currency'         => 'GBP',
            ]
        ];
    }
}
