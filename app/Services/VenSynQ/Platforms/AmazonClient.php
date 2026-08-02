<?php

namespace App\Services\VenSynQ\Platforms;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AmazonClient implements PlatformClient
{
    public function platformKey(): string
    {
        return 'amazon';
    }

    /**
     * Resolve the correct SP-API base URL depending on sandbox mode.
     */
    private function baseUrl(): string
    {
        return config('vensynq.sandbox_mode')
            ? config('vensynq.platforms.amazon.sandbox_url')
            : config('vensynq.platforms.amazon.base_url');
    }

    /**
     * T16 — Test Connection for the 3-step credential wizard.
     *
     * Contractually MUST NOT throw: the wizard renders whatever comes back, and
     * an exception here would 500 the whole setup screen instead of showing the
     * merchant a fixable error message.
     */
    public function testConnection(string $accessToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return ['ok' => true, 'message' => 'Simulation mode — connection assumed healthy.', 'latency_ms' => 0];
        }

        if (trim($accessToken) === '') {
            return ['ok' => false, 'message' => 'No access token stored. Re-run the connection wizard.'];
        }

        $startedAt = microtime(true);

        try {
            $response = Http::withHeaders(['x-amz-access-token' => $accessToken])
                ->timeout(15)
                ->get($this->baseUrl() . '/orders/v0/orders', [
                    'MarketplaceIds'   => config('vensynq.platforms.amazon.marketplace_id'),
                    'CreatedAfter'     => now()->subDay()->toIso8601String(),
                    'MaxResultsPerPage' => 1,
                ]);
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Could not reach Amazon SP-API: ' . $e->getMessage()];
        }

        $latency = (int) round((microtime(true) - $startedAt) * 1000);

        if ($response->successful()) {
            return ['ok' => true, 'message' => 'Amazon SP-API responded successfully.', 'latency_ms' => $latency];
        }

        return [
            'ok'         => false,
            'message'    => match ($response->status()) {
                401, 403 => 'Amazon rejected the credentials. Check the LWA Client ID/Secret and Refresh Token.',
                404      => 'Marketplace ID looks wrong for this SP-API region endpoint.',
                429      => 'Amazon is rate limiting this application. Wait a minute and retry.',
                default  => 'Amazon SP-API returned HTTP ' . $response->status() . '.',
            },
            'latency_ms' => $latency,
        ];
    }

    /**
     * Amazon inventory is managed via the Listings/FBA Inventory APIs, which
     * require separate role approval most sellers do not hold. Rather than fail
     * loudly on every sale, report "not supported" and let the caller skip.
     */
    public function pushStock(string $accessToken, string $sku, float $quantity): bool
    {
        Log::info('[VenSynQ:Amazon] pushStock skipped — Listings API role not provisioned', [
            'sku' => $sku,
            'qty' => $quantity,
        ]);

        return false;
    }

    /**
     * Validate a raw credential set from the 3-step wizard BEFORE persisting it,
     * by performing a real LWA refresh-token grant.
     *
     * @return array{ok: bool, message: string, access_token?: string, expires_in?: int}
     */
    public function validateCredentials(string $clientId, string $clientSecret, string $refreshToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'ok'           => true,
                'message'      => 'Simulation mode — credentials accepted without contacting Amazon.',
                'access_token' => 'sim_amazon_access_token_' . bin2hex(random_bytes(16)),
                'expires_in'   => 3600,
            ];
        }

        try {
            $response = Http::asForm()->timeout(15)->post('https://api.amazon.com/auth/o2/token', [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $refreshToken,
                'client_id'     => $clientId,
                'client_secret' => $clientSecret,
            ]);
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Could not reach Amazon LWA: ' . $e->getMessage()];
        }

        if ($response->failed()) {
            $error = $response->json('error_description') ?? $response->json('error') ?? $response->body();

            Log::warning('[VenSynQ:Amazon] Credential validation failed', ['error' => $error]);

            return ['ok' => false, 'message' => 'Amazon rejected these credentials: ' . $error];
        }

        return [
            'ok'           => true,
            'message'      => 'Credentials verified — Amazon issued an access token.',
            'access_token' => $response->json('access_token'),
            'expires_in'   => (int) ($response->json('expires_in') ?? 3600),
        ];
    }

    /**
     * Build the Amazon SP-API Authorization URL.
     * In sandbox mode, uses the platform-level refresh token instead of OAuth flow.
     */
    public function getAuthorizationUrl(): string
    {
        if (config('vensynq.simulation_mode')) {
            return route('store.vensynq.callback', [
                'platform'   => 'amazon',
                'store_slug' => app('current.tenant')->slug,
                'code'       => 'simulated_amazon_auth_code_xyz',
            ]);
        }

        // In sandbox mode we skip the OAuth screen entirely and use the
        // platform-level refresh token that Amazon Developer Console provides.
        if (config('vensynq.sandbox_mode')) {
            return route('store.vensynq.callback', [
                'platform'   => 'amazon',
                'store_slug' => app('current.tenant')->slug,
                'code'       => 'sandbox_bypass',
            ]);
        }

        $clientId    = config('vensynq.platforms.amazon.client_id');
        $redirectUri = url(config('vensynq.platforms.amazon.redirect_uri'));

        return 'https://sellercentral.amazon.co.uk/apps/authorize/consent'
             . '?application_id=' . urlencode($clientId)
             . '&state='          . urlencode(csrf_token())
             . '&redirect_uri='   . urlencode($redirectUri);
    }

    /**
     * Swap authorization code for Access & Refresh Tokens.
     * In sandbox mode, uses the platform-level refresh token directly.
     */
    public function handleCallback(string $code): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'access_token'  => 'sim_amazon_access_token_' . bin2hex(random_bytes(16)),
                'refresh_token' => 'sim_amazon_refresh_token_' . bin2hex(random_bytes(16)),
                'expires_in'    => 3600,
            ];
        }

        if (config('vensynq.sandbox_mode') || $code === 'sandbox_bypass') {
            $platformRefreshToken = config('vensynq.platforms.amazon.refresh_token') ?? 'Atzr|IwEBI_sandbox_default_refresh_token';
            return [
                'access_token'  => 'sim_amazon_sandbox_access_token_' . bin2hex(random_bytes(16)),
                'refresh_token' => $platformRefreshToken,
                'expires_in'    => 3600,
            ];
        }

        $clientId     = config('vensynq.platforms.amazon.client_id');
        $clientSecret = config('vensynq.platforms.amazon.client_secret');

        $response = Http::asForm()->post('https://api.amazon.com/auth/o2/token', [
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
        ]);

        if ($response->failed()) {
            Log::error('Amazon SP-API Callback Token Exchange Failed', ['response' => $response->body()]);
            throw new \Exception('Failed to exchange authorization code for Amazon tokens.');
        }

        return $response->json();
    }

    /**
     * Exchange a refresh token for a fresh access token.
     * Caches the result for 55 minutes to respect Amazon rate limits.
     */
    public function getAccessToken(string $refreshToken): string
    {
        $cacheKey = 'amazon_access_token_' . md5($refreshToken);

        return Cache::remember($cacheKey, now()->addMinutes(55), function () use ($refreshToken) {
            $clientId     = config('vensynq.platforms.amazon.client_id');
            $clientSecret = config('vensynq.platforms.amazon.client_secret');

            $response = Http::asForm()->post('https://api.amazon.com/auth/o2/token', [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $refreshToken,
                'client_id'     => $clientId,
                'client_secret' => $clientSecret,
            ]);

            if ($response->failed()) {
                Log::error('Amazon SP-API Token Refresh Failed', ['response' => $response->body()]);
                throw new \Exception('Failed to refresh Amazon access token: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }

    /**
     * Refresh access token using stored refresh token (legacy alias).
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return [
                'access_token' => 'sim_amazon_access_token_' . bin2hex(random_bytes(16)),
                'expires_in'   => 3600,
            ];
        }

        return [
            'access_token' => $this->getAccessToken($refreshToken),
            'expires_in'   => 3300, // 55 min cache
        ];
    }

    /**
     * Retrieve recent Amazon orders and return in standardized NormalizedOrderItem format.
     */
    public function fetchOrders(string $accessToken): array
    {
        if (config('vensynq.simulation_mode')) {
            return $this->getSimulatedOrders();
        }

        // SP-API orders endpoint — resolves sandbox or production automatically
        $response = Http::withHeaders([
            'x-amz-access-token' => $accessToken,
        ])->get($this->baseUrl() . '/orders/v0/orders', [
            'MarketplaceIds'   => config('vensynq.platforms.amazon.marketplace_id'),
            'LastUpdatedAfter' => now()->subHours(25)->toIso8601String(),
            'OrderStatuses'    => 'Shipped,Unshipped',
        ]);

        if ($response->failed()) {
            Log::error('Amazon SP-API Order Fetch Failed', ['body' => $response->body()]);
            throw new \Exception('Failed to fetch orders from Amazon SP-API.');
        }

        $orders = $response->json('payload.Orders') ?? [];
        $normalized = [];

        foreach ($orders as $order) {
            $orderId = $order['AmazonOrderId'];
            $fulfillmentChannel = $order['FulfillmentChannel']; // AFN = FBA, MFN = FBM
            
            // Get order line items
            $itemsResponse = Http::withHeaders([
                'x-amz-access-token' => $accessToken,
            ])->get($this->baseUrl() . "/orders/v0/orders/{$orderId}/orderItems");

            if ($itemsResponse->failed()) {
                continue;
            }

            $lineItems = $itemsResponse->json('payload.OrderItems') ?? [];

            foreach ($lineItems as $line) {
                // Determine item price and tax
                $price = ($line['ItemPrice']['Amount'] ?? 0) / ($line['QuantityOrdered'] ?? 1);
                
                // Amazon fees are fetched per order via SP-API finances endpoint, default fallback here
                $normalized[] = [
                    'sku'              => $line['SellerSKU'] ?? '',
                    'quantity'         => $line['QuantityOrdered'] ?? 1,
                    'sale_price'       => $price,
                    'platform_fee'     => null, // Will use estimated fee_percentage fallback
                    'channel_order_id' => $orderId,
                    'fulfillment_type' => $fulfillmentChannel === 'AFN' ? 'fba' : 'fbm',
                    'currency'         => $order['OrderTotal']['CurrencyCode'] ?? 'GBP',
                ];
            }
        }

        return $normalized;
    }

    /**
     * Push dispatch shipment and tracking credentials back to Amazon SP-API.
     */
    public function pushTracking(string $accessToken, string $orderId, string $trackingNumber, string $carrier): bool
    {
        if (config('vensynq.simulation_mode')) {
            Log::info("Amazon Client Simulated Tracking Push. Order={$orderId}, Tracking={$trackingNumber}, Carrier={$carrier}");
            return true;
        }

        $response = Http::withHeaders([
            'x-amz-access-token' => $accessToken,
        ])->post($this->baseUrl() . "/orders/v0/orders/{$orderId}/shipment", [
            'marketplaceId' => config('vensynq.platforms.amazon.marketplace_id'),
            'carrierCode' => $this->mapCarrierToAmazonCode($carrier),
            'carrierName' => $carrier,
            'shipperTrackingNumber' => $trackingNumber,
            'fulfillmentDate' => now()->toIso8601String(),
        ]);

        if ($response->failed()) {
            Log::error("Amazon SP-API Tracking Push Failed for order {$orderId}", ['body' => $response->body()]);
            return false;
        }

        return true;
    }

    private function mapCarrierToAmazonCode(string $carrier): string
    {
        $carrier = strtolower(trim($carrier));
        $map = [
            'royal mail'  => 'Royal Mail',
            'evri'        => 'Hermes', // Amazon registers Evri as Hermes
            'dpd'         => 'DPD',
            'dhl'         => 'DHL',
            'ups'         => 'UPS',
            'fedex'       => 'FedEx',
            'parcelforce' => 'Parcelforce',
        ];
        return $map[$carrier] ?? 'Other';
    }

    /**
     * Provide realistic mock orders representing mixed fulfillment types for simulation.
     */
    private function getSimulatedOrders(): array
    {
        return [
            [
                'sku'              => 'PROD-A101', // FBM Stock deduction test (Standard item in catalog)
                'quantity'         => 1,
                'sale_price'       => 150.00,
                'platform_fee'     => 22.50,
                'channel_order_id' => '102-1234567-9876541',
                'fulfillment_type' => 'fbm',
                'currency'         => 'GBP',
            ],
            [
                'sku'              => 'PROD-B202', // JIT Shortfall test (A non-stocked dropshipped item)
                'quantity'         => 2,
                'sale_price'       => 45.00,
                'platform_fee'     => 13.50,
                'channel_order_id' => '203-9876543-1234562',
                'fulfillment_type' => 'jit',
                'currency'         => 'GBP',
            ],
            [
                'sku'              => 'PROD-C303', // FBA test (Warehouse ignores stock deductions)
                'quantity'         => 3,
                'sale_price'       => 25.00,
                'platform_fee'     => 11.25,
                'channel_order_id' => '704-1122334-5566773',
                'fulfillment_type' => 'fba',
                'currency'         => 'GBP',
            ]
        ];
    }
}
