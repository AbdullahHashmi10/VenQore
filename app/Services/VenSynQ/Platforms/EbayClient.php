<?php

namespace App\Services\VenSynQ\Platforms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EbayClient
{
    /**
     * Build the eBay User Authorization URL.
     */
    public function getAuthorizationUrl(): string
    {
        if (config('vensynq.simulation_mode')) {
            return route('store.vensynq.callback', [
                'platform' => 'ebay',
                'store_slug' => app('current.tenant')->slug,
                'code' => 'simulated_ebay_auth_code_efg',
            ]);
        }

        $clientId = config('vensynq.platforms.ebay.client_id');
        $redirectUri = url(config('vensynq.platforms.ebay.redirect_uri'));

        return "https://auth.ebay.com/oauth2/authorize" .
               "?client_id=" . urlencode($clientId) .
               "&response_type=code" .
               "&state=" . urlencode(csrf_token()) .
               "&redirect_uri=" . urlencode($redirectUri) .
               "&scope=" . urlencode('https://api.ebay.com/oauth/api_scope/sell.fulfillment');
    }

    /**
     * Swap eBay auth code for Access & Refresh Tokens.
     */
    public function handleCallback(string $code): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'access_token' => 'sim_ebay_access_token_' . bin2hex(random_bytes(16)),
                'refresh_token' => 'sim_ebay_refresh_token_' . bin2hex(random_bytes(16)),
                'expires_in' => 7200, // 2 hours
            ];
        }

        $clientId = config('vensynq.platforms.ebay.client_id');
        $clientSecret = config('vensynq.platforms.ebay.client_secret');
        $redirectUri = url(config('vensynq.platforms.ebay.redirect_uri'));

        $response = Http::asForm()
            ->withHeaders([
                'Authorization' => 'Basic ' . base64_encode($clientId . ':' . $clientSecret),
            ])
            ->post('https://api.ebay.com/identity/v1/oauth2/token', [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $redirectUri,
            ]);

        if ($response->failed()) {
            Log::error('eBay OAuth Callback Token Exchange Failed', ['response' => $response->body()]);
            throw new \Exception('Failed to exchange authorization code for eBay tokens.');
        }

        return $response->json();
    }

    /**
     * Refresh access token using stored eBay Refresh Token.
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'access_token' => 'sim_ebay_access_token_' . bin2hex(random_bytes(16)),
                'expires_in' => 7200,
            ];
        }

        $clientId = config('vensynq.platforms.ebay.client_id');
        $clientSecret = config('vensynq.platforms.ebay.client_secret');

        $response = Http::asForm()
            ->withHeaders([
                'Authorization' => 'Basic ' . base64_encode($clientId . ':' . $clientSecret),
            ])
            ->post('https://api.ebay.com/identity/v1/oauth2/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
                'scope' => 'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
            ]);

        if ($response->failed()) {
            Log::error('eBay Token Refresh Failed', ['response' => $response->body()]);
            throw new \Exception('Failed to refresh eBay access token.');
        }

        return $response->json();
    }

    /**
     * Fetch eBay Orders and return in standardized format.
     */
    public function fetchOrders(string $accessToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return $this->getSimulatedOrders();
        }

        // eBay Fulfillment API endpoint for Orders
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $accessToken,
        ])->get('https://api.ebay.com/sell/fulfillment/v1/order', [
            'filter' => 'orderfulfillmentstatus:{FULFILLED|IN_PROGRESS}',
            'limit' => 50,
        ]);

        if ($response->failed()) {
            Log::error('eBay Order Fetch Failed', ['body' => $response->body()]);
            throw new \Exception('Failed to fetch orders from eBay.');
        }

        $orders = $response->json('orders') ?? [];
        $normalized = [];

        foreach ($orders as $order) {
            $orderId = $order['orderId'];
            $lineItems = $order['lineItems'] ?? [];

            foreach ($lineItems as $line) {
                // Determine item price and mapping (uses Custom label as SKU)
                $sku = $line['sku'] ?? $line['legacyItemId'] ?? '';
                $price = ($line['lineItemPaymentSummary']['priceSubtotal']['value'] ?? 0) / ($line['quantity'] ?? 1);

                $normalized[] = [
                    'sku'              => $sku,
                    'quantity'         => $line['quantity'] ?? 1,
                    'sale_price'       => $price,
                    'platform_fee'     => null, // fallback to estimate
                    'channel_order_id' => $orderId,
                    'fulfillment_type' => 'fbm', // eBay has no local FBA-like warehouse. Standard FBM
                    'currency'         => $order['totalAmount']['currency'] ?? 'GBP',
                ];
            }
        }

        return $normalized;
    }

    /**
     * Push dispatch tracking details back to eBay Fulfillment API.
     */
    public function pushTracking(string $accessToken, string $orderId, string $trackingNumber, string $carrier): bool
    {
        if (config('vensynq.simulation_mode')) {
            Log::info("eBay Client Simulated Tracking Push. Order={$orderId}, Tracking={$trackingNumber}, Carrier={$carrier}");
            return true;
        }

        // eBay registers fulfillment via custom POST
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $accessToken,
        ])->post("https://api.ebay.com/sell/fulfillment/v1/order/{$orderId}/shippingFulfillment", [
            'trackingNumber' => $trackingNumber,
            'shippingCarrierCode' => $this->mapCarrierToEbayCode($carrier),
            'shippedDate' => now()->toIso8601String(),
        ]);

        if ($response->failed()) {
            Log::error("eBay Tracking Push Failed for order {$orderId}", ['body' => $response->body()]);
            return false;
        }

        return true;
    }

    private function mapCarrierToEbayCode(string $carrier): string
    {
        $carrier = strtolower(trim($carrier));
        $map = [
            'royal mail'  => 'RoyalMail',
            'evri'        => 'Hermes',
            'dpd'         => 'DPD',
            'dhl'         => 'DHL',
            'ups'         => 'UPS',
            'fedex'       => 'FedEx',
        ];
        return $map[$carrier] ?? 'Other';
    }

    /**
     * Mock eBay orders.
     */
    private function getSimulatedOrders(): array
    {
        return [
            [
                'sku'              => 'PROD-A101', // Standard stock item
                'quantity'         => 1,
                'sale_price'       => 160.00,
                'platform_fee'     => 19.20,
                'channel_order_id' => '11-09876-54321',
                'fulfillment_type' => 'fbm',
                'currency'         => 'GBP',
            ],
            [
                'sku'              => 'PROD-B202', // JIT Shortfall item
                'quantity'         => 3,
                'sale_price'       => 42.00,
                'platform_fee'     => 15.12,
                'channel_order_id' => '22-01234-56789',
                'fulfillment_type' => 'jit',
                'currency'         => 'GBP',
            ]
        ];
    }
}
