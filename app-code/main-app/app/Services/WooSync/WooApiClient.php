<?php

namespace App\Services\WooSync;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\WooConnection;

/**
 * WooApiClient — Thin wrapper around the WooCommerce REST API v3.
 *
 * All intelligence about WHAT to sync lives in SyncEngine.
 * This class only handles HOW to talk to WooCommerce.
 */
class WooApiClient
{
    protected WooConnection $connection;
    protected string $baseUrl;

    // WooCommerce REST API rate limit: ~200 requests/min (varies by host)
    protected int $requestsPerMinute = 120;
    protected int $requestCount = 0;
    protected float $windowStart;

    public function __construct(WooConnection $connection)
    {
        $this->connection = $connection;
        $this->baseUrl    = rtrim($connection->site_url, '/') . '/wp-json/wc/v3';
        $this->windowStart = microtime(true);
    }

    // ─── Products ─────────────────────────────────────────────────────────────

    /**
     * Fetch a paginated list of all products from WooCommerce.
     * Handles pagination internally and returns a flat array.
     */
    public function getProducts(int $perPage = 100): array
    {
        $products = [];
        $page     = 1;

        do {
            $response = $this->get('/products', [
                'per_page' => $perPage,
                'page'     => $page,
                'status'   => 'any',
            ]);

            if (empty($response)) {
                break;
            }

            $products = array_merge($products, $response);
            $page++;
        } while (count($response) === $perPage);

        return $products;
    }

    public function getCustomers(int $perPage = 100): array
    {
        $customers = [];
        $page      = 1;

        do {
            $response = $this->get('/customers', [
                'per_page' => $perPage,
                'page'     => $page,
            ]);

            if (empty($response)) {
                break;
            }

            $customers = array_merge($customers, $response);
            $page++;
        } while (count($response) === $perPage);

        return $customers;
    }

    /**
     * Fetch a single product by WooCommerce product ID.
     */
    public function getProduct(int $wooProductId): ?array
    {
        return $this->get("/products/{$wooProductId}");
    }

    /**
     * Create a new product in WooCommerce.
     */
    public function createProduct(array $data): ?array
    {
        return $this->post('/products', $data);
    }

    /**
     * Update an existing WooCommerce product.
     */
    public function updateProduct(int $wooProductId, array $data): ?array
    {
        return $this->put("/products/{$wooProductId}", $data);
    }

    /**
     * Delete a WooCommerce product (moves to trash by default).
     */
    public function deleteProduct(int $wooProductId, bool $force = false): bool
    {
        $result = $this->delete("/products/{$wooProductId}", ['force' => $force]);
        return !is_null($result);
    }

    /**
     * Batch update multiple products in one API call (max 100 per batch).
     */
    public function batchUpdateProducts(array $updates): ?array
    {
        return $this->post('/products/batch', ['update' => $updates]);
    }

    // ─── Product Variations ───────────────────────────────────────────────────

    /**
     * Get all variations for a variable WooCommerce product.
     */
    public function getVariations(int $wooProductId): array
    {
        return $this->get("/products/{$wooProductId}/variations") ?? [];
    }

    /**
     * Create a variation under a variable product.
     */
    public function createVariation(int $wooProductId, array $data): ?array
    {
        return $this->post("/products/{$wooProductId}/variations", $data);
    }

    /**
     * Update a variation.
     */
    public function updateVariation(int $wooProductId, int $variationId, array $data): ?array
    {
        return $this->put("/products/{$wooProductId}/variations/{$variationId}", $data);
    }

    // ─── Orders (T16 — VenSynQ order ingestion) ───────────────────────────────

    /**
     * Fetch orders. Used by VenSynQ\Platforms\WooCommerceClient::fetchOrders().
     *
     * @param  array  $params  status / after / per_page etc.
     * @return array<int, array<string, mixed>>
     */
    public function getOrders(array $params = []): array
    {
        $params = array_merge([
            'per_page' => 100,
            'page'     => 1,
            'orderby'  => 'date',
            'order'    => 'desc',
        ], $params);

        $orders  = [];
        $page    = (int) $params['page'];
        $perPage = (int) $params['per_page'];

        do {
            $params['page'] = $page;
            $response = $this->get('/orders', $params);

            if (empty($response) || !is_array($response)) {
                break;
            }

            $orders = array_merge($orders, $response);
            $page++;

            // Hard stop at 10 pages (1,000 orders) so a misconfigured `after`
            // window can never spin the queue worker forever.
            if ($page > 10) {
                Log::warning('[WooApiClient] getOrders hit the 10-page safety ceiling', [
                    'site' => $this->connection->site_url,
                ]);
                break;
            }
        } while (count($response) === $perPage);

        return $orders;
    }

    /**
     * Update a WooCommerce order (status, meta, etc.).
     */
    public function updateOrder(int $wooOrderId, array $data): ?array
    {
        return $this->put("/orders/{$wooOrderId}", $data);
    }

    /**
     * Attach a note to an order — how we surface tracking numbers to the buyer.
     */
    public function createOrderNote(int $wooOrderId, string $note, bool $customerNote = false): ?array
    {
        return $this->post("/orders/{$wooOrderId}/notes", [
            'note'          => $note,
            'customer_note' => $customerNote,
        ]);
    }

    // ─── Stock (T16 — bidirectional stock sync) ───────────────────────────────

    /**
     * Push an absolute stock level to Woo for a given SKU.
     *
     * Resolves the SKU to a product (or variation) id first, because the Woo REST
     * API has no "update by SKU" endpoint. Returns false rather than throwing so
     * the caller can queue the SKU into the Action Required list.
     */
    public function updateStockBySku(string $sku, float $quantity): bool
    {
        $matches = $this->get('/products', ['sku' => $sku, 'per_page' => 1]);

        if (empty($matches) || !isset($matches[0]['id'])) {
            Log::warning('[WooApiClient] updateStockBySku: SKU not found in WooCommerce', [
                'sku'  => $sku,
                'site' => $this->connection->site_url,
            ]);
            return false;
        }

        $product = $matches[0];
        $payload = [
            'manage_stock'   => true,
            'stock_quantity' => (int) round($quantity),
            'stock_status'   => $quantity > 0 ? 'instock' : 'outofstock',
        ];

        // A variation carries its own stock record and must be patched on the
        // /variations sub-resource, not on the parent product.
        if (($product['type'] ?? '') === 'variation' && !empty($product['parent_id'])) {
            $result = $this->updateVariation((int) $product['parent_id'], (int) $product['id'], $payload);
        } else {
            $result = $this->updateProduct((int) $product['id'], $payload);
        }

        return $result !== null;
    }

    /**
     * Lightweight authenticated round-trip for health checks / Test Connection.
     */
    public function ping(): bool
    {
        $response = $this->get('/system_status/tools', ['per_page' => 1]);

        // Some hardened hosts block system_status for non-admin keys; fall back
        // to a 1-item product read, which any read-capable key can perform.
        if ($response === null) {
            $response = $this->get('/products', ['per_page' => 1]);
        }

        return $response !== null;
    }

    // ─── Categories ───────────────────────────────────────────────────────────

    /**
     * Get all product categories from WooCommerce.
     */
    public function getCategories(): array
    {
        return $this->get('/products/categories', ['per_page' => 100]) ?? [];
    }

    /**
     * Create a category in WooCommerce, return its ID.
     */
    public function createCategory(string $name): ?int
    {
        $result = $this->post('/products/categories', ['name' => $name]);
        return $result['id'] ?? null;
    }

    // ─── Webhooks ─────────────────────────────────────────────────────────────

    /**
     * Register the three product webhooks pointing at this connection's receiver URL.
     */
    public function registerWebhooks(string $receiverUrl, string $webhookSecret): array
    {
        $topics = [
            'product.created',
            'product.updated',
            'product.deleted',
        ];

        $registered = [];

        foreach ($topics as $topic) {
            $result = $this->post('/webhooks', [
                'name'          => "VenQore Sync — {$topic}",
                'topic'         => $topic,
                'delivery_url'  => $receiverUrl,
                'secret'        => $webhookSecret,
                'status'        => 'active',
            ]);

            if ($result) {
                $registered[] = $result;
            }
        }

        return $registered;
    }

    /**
     * List all registered webhooks.
     */
    public function getWebhooks(): array
    {
        return $this->get('/webhooks') ?? [];
    }

    /**
     * Delete a webhook by ID.
     */
    public function deleteWebhook(int $webhookId): bool
    {
        $result = $this->delete("/webhooks/{$webhookId}", ['force' => true]);
        return !is_null($result);
    }

    // ─── HTTP Methods (with rate limiting) ───────────────────────────────────

    protected function get(string $endpoint, array $params = []): ?array
    {
        $this->throttle();

        try {
            $response = Http::withBasicAuth(
                $this->connection->consumer_key,
                $this->connection->consumer_secret
            )->get($this->baseUrl . $endpoint, $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('[WooApiClient] GET failed', [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('[WooApiClient] GET exception', [
                'endpoint' => $endpoint,
                'error'    => $e->getMessage(),
            ]);
            return null;
        }
    }

    protected function post(string $endpoint, array $data = []): ?array
    {
        $this->throttle();

        try {
            $response = Http::withBasicAuth(
                $this->connection->consumer_key,
                $this->connection->consumer_secret
            )->post($this->baseUrl . $endpoint, $data);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('[WooApiClient] POST failed', [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('[WooApiClient] POST exception', [
                'endpoint' => $endpoint,
                'error'    => $e->getMessage(),
            ]);
            return null;
        }
    }

    protected function put(string $endpoint, array $data = []): ?array
    {
        $this->throttle();

        try {
            $response = Http::withBasicAuth(
                $this->connection->consumer_key,
                $this->connection->consumer_secret
            )->put($this->baseUrl . $endpoint, $data);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('[WooApiClient] PUT failed', [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('[WooApiClient] PUT exception', [
                'endpoint' => $endpoint,
                'error'    => $e->getMessage(),
            ]);
            return null;
        }
    }

    protected function delete(string $endpoint, array $params = []): ?array
    {
        $this->throttle();

        try {
            $response = Http::withBasicAuth(
                $this->connection->consumer_key,
                $this->connection->consumer_secret
            )->delete($this->baseUrl . $endpoint, $params);

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('[WooApiClient] DELETE exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Simple rate limiter — stay under $requestsPerMinute per 60-second window.
     */
    protected function throttle(): void
    {
        $elapsed = microtime(true) - $this->windowStart;

        if ($elapsed >= 60) {
            $this->requestCount = 0;
            $this->windowStart  = microtime(true);
        }

        $this->requestCount++;

        if ($this->requestCount >= $this->requestsPerMinute) {
            $sleepMs = (int) ((60 - $elapsed) * 1000);
            if ($sleepMs > 0) {
                usleep($sleepMs * 1000);
            }
            $this->requestCount = 0;
            $this->windowStart  = microtime(true);
        }
    }
}
