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
