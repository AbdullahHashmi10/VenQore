<?php

namespace App\Services\WooSync;

use App\Models\Product;
use App\Models\WooConnection;
use App\Models\WooProductLink;
use App\Models\WooSyncQueue;
use App\Models\WooSyncLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * SyncEngine — All sync intelligence lives here.
 *
 * Responsibilities:
 *  - Priority resolution (VenQore wins / WooCommerce wins / manual review)
 *  - Conflict detection and flagging
 *  - SKU matching for initial import
 *  - Queuing push/pull operations
 *  - Webhook event processing
 *  - Initial full import from WooCommerce
 */
class SyncEngine
{
    protected FieldMapper $mapper;
    protected WooApiClient $client;
    protected WooConnection $connection;

    public function __construct(WooConnection $connection)
    {
        $this->connection = $connection;
        $this->mapper     = new FieldMapper();
        $this->client     = new WooApiClient($connection);
    }

    // ─── Initial Import ───────────────────────────────────────────────────────

    /**
     * Run the initial full import when a connection is first set up.
     *
     * 1. Fetches all WooCommerce products.
     * 2. Attempts SKU match against VenQore products for this tenant.
     * 3. Creates woo_product_links for matched pairs (status = synced).
     * 4. Stages unmatched WooCommerce products for user review (status = staged).
     * 5. Stages VenQore products not on WooCommerce (status = staged) if auto_stage = true.
     */
    public function runInitialImport(): array
    {
        $stats = [
            'woo_products'   => 0,
            'matched'        => 0,
            'staged_from_woo' => 0,
            'staged_to_woo'  => 0,
        ];

        Log::info('[SyncEngine] Starting initial import', ['connection' => $this->connection->id]);

        // Step 1: Fetch all WooCommerce products
        $wooProducts = $this->client->getProducts();
        $stats['woo_products'] = count($wooProducts);

        // Build SKU → woo_product map for quick lookup
        $wooProductsBySku = [];
        foreach ($wooProducts as $wp) {
            if (!empty($wp['sku'])) {
                $wooProductsBySku[$wp['sku']] = $wp;
            }
        }

        // Step 2: Match against VenQore products by SKU
        $tenantProducts = Product::where('tenant_id', $this->connection->tenant_id)
            ->whereNotNull('sku')
            ->where('sku', '!=', '')
            ->get();

        $matchedSkus = [];

        foreach ($tenantProducts as $product) {
            $sku = $product->sku;

            if (isset($wooProductsBySku[$sku])) {
                // Match found — create a link and mark as synced
                $wooProduct = $wooProductsBySku[$sku];
                $this->createLink($product, $wooProduct['id'], $sku, 'synced');
                $matchedSkus[] = $sku;
                $stats['matched']++;
            } elseif ($this->connection->auto_stage_new_products) {
                // VenQore product not on WooCommerce — stage it
                $this->stageForPush($product);
                $stats['staged_to_woo']++;
            }
        }

        // Step 3: Stage unmatched WooCommerce products
        foreach ($wooProducts as $wp) {
            if (!empty($wp['sku']) && !in_array($wp['sku'], $matchedSkus)) {
                $this->stageIncomingProduct($wp);
                $stats['staged_from_woo']++;
            } elseif (empty($wp['sku'])) {
                // WooCommerce product has no SKU — log and skip
                Log::warning('[SyncEngine] WooCommerce product has no SKU, cannot match.', [
                    'woo_id' => $wp['id'],
                    'name'   => $wp['name'],
                ]);
            }
        }

        // Mark connection active
        $this->connection->update([
            'status'         => 'active',
            'last_synced_at' => now(),
        ]);

        WooSyncLog::record(
            $this->connection->id,
            'initial_import_complete',
            'internal',
            null,
            $stats
        );

        return $stats;
    }

    // ─── Webhook Processing ───────────────────────────────────────────────────

    /**
     * Process an incoming WooCommerce webhook payload.
     *
     * Called by ProcessWebhookJob after signature verification.
     */
    public function processWebhook(string $topic, array $payload): void
    {
        $wooProductId = $payload['id'] ?? null;
        $sku          = $payload['sku'] ?? null;

        if (!$wooProductId) {
            Log::warning('[SyncEngine] Webhook payload missing product ID');
            return;
        }

        Log::info('[SyncEngine] Processing webhook', [
            'topic'  => $topic,
            'woo_id' => $wooProductId,
            'sku'    => $sku,
        ]);

        switch ($topic) {
            case 'product.created':
                $this->handleWooProductCreated($payload);
                break;

            case 'product.updated':
                $this->handleWooProductUpdated($payload);
                break;

            case 'product.deleted':
                $this->handleWooProductDeleted($wooProductId);
                break;
        }
    }

    protected function handleWooProductCreated(array $wooProduct): void
    {
        $sku = $wooProduct['sku'] ?? null;

        if (!$sku) {
            Log::warning('[SyncEngine] New WooCommerce product has no SKU', ['id' => $wooProduct['id']]);
            return;
        }

        // Check if we already have a link
        $link = WooProductLink::where('connection_id', $this->connection->id)
            ->where('woo_product_id', $wooProduct['id'])
            ->first();

        if ($link) {
            return; // Already linked
        }

        // Check if a VenQore product with this SKU exists
        $venqoreProduct = Product::where('tenant_id', $this->connection->tenant_id)
            ->where('sku', $sku)
            ->first();

        if ($venqoreProduct) {
            // Auto-link — SKU match
            $this->createLink($venqoreProduct, $wooProduct['id'], $sku, 'synced');
            WooSyncLog::record($this->connection->id, 'auto_linked_on_create', 'from_woo');
        } else {
            // Stage for user review
            $this->stageIncomingProduct($wooProduct);
        }
    }

    protected function handleWooProductUpdated(array $wooProduct): void
    {
        $link = WooProductLink::where('connection_id', $this->connection->id)
            ->where('woo_product_id', $wooProduct['id'])
            ->first();

        if (!$link) {
            // Unknown product — treat as new
            $this->handleWooProductCreated($wooProduct);
            return;
        }

        $venqoreProduct = $link->product;
        if (!$venqoreProduct) {
            return;
        }

        $syncFields = $this->connection->sync_fields ?? WooConnection::defaultSyncFields();

        // Build snapshots for comparison
        $venqoreSnap = $this->mapper->venqoreSnapshot($venqoreProduct, $syncFields);
        $wooSnap     = $this->mapper->wooSnapshot($wooProduct, $syncFields);
        $diff        = $this->mapper->buildDiff($venqoreSnap, $wooSnap);

        if (empty($diff)) {
            return; // No changes
        }

        $priority = $this->connection->priority_source;

        if ($priority === 'venqore') {
            // VenQore wins — re-push VenQore data to WooCommerce
            $this->queuePush($link, 'webhook', $venqoreSnap);
            WooSyncLog::record(
                $this->connection->id,
                'venqore_overrides_woo_update',
                'to_woo',
                $wooSnap,
                $venqoreSnap,
                $link->id
            );
        } elseif ($priority === 'woocommerce') {
            // WooCommerce wins — pull changes into VenQore
            $venqoreUpdate = $this->mapper->wooToVenqore($wooProduct, $syncFields);
            $venqoreProduct->update($venqoreUpdate);
            $link->markSynced($wooSnap);
            WooSyncLog::record(
                $this->connection->id,
                'woo_update_applied_to_venqore',
                'from_woo',
                $venqoreSnap,
                $wooSnap,
                $link->id
            );
        } else {
            // Manual — flag conflict
            $link->flagConflict($venqoreSnap, $wooSnap);
            WooSyncLog::record(
                $this->connection->id,
                'conflict_flagged',
                'from_woo',
                $venqoreSnap,
                $wooSnap,
                $link->id
            );
        }
    }

    protected function handleWooProductDeleted(int $wooProductId): void
    {
        $link = WooProductLink::where('connection_id', $this->connection->id)
            ->where('woo_product_id', $wooProductId)
            ->first();

        if ($link) {
            WooSyncLog::record($this->connection->id, 'woo_product_deleted', 'from_woo', null, null, $link->id);
            $link->update(['sync_status' => 'ignored']);
        }
    }

    // ─── Push / Pull ──────────────────────────────────────────────────────────

    /**
     * Push a VenQore product to WooCommerce. Can create or update.
     */
    public function pushToWoo(WooProductLink $link): bool
    {
        $product = $link->product;
        if (!$product) {
            return false;
        }

        $syncFields  = $this->connection->sync_fields ?? WooConnection::defaultSyncFields();
        $wooCategories = $this->getWooCategories();
        $payload     = $this->mapper->venqoreToWoo($product, $syncFields, $wooCategories);

        if ($link->woo_product_id) {
            $result = $this->client->updateProduct($link->woo_product_id, $payload);
        } else {
            $result = $this->client->createProduct($payload);
            if ($result) {
                $link->update(['woo_product_id' => $result['id']]);
            }
        }

        if ($result) {
            $snapshot = $this->mapper->venqoreSnapshot($product, $syncFields);
            $link->markSynced($snapshot);

            WooSyncLog::record(
                $this->connection->id,
                $link->woo_product_id ? 'product_pushed' : 'product_created_on_woo',
                'to_woo',
                null,
                $payload,
                $link->id
            );

            return true;
        }

        return false;
    }

    /**
     * Pull a WooCommerce product into VenQore.
     * Either creates a new VenQore product or updates an existing linked one.
     */
    public function pullFromWoo(WooSyncQueue $queueEntry): bool
    {
        $payload = $queueEntry->payload;
        $sku     = $payload['sku'] ?? null;

        if (!$sku) {
            return false;
        }

        $syncFields = $this->connection->sync_fields ?? WooConnection::defaultSyncFields();
        $venqoreData = $this->mapper->wooToVenqore($payload, $syncFields);

        if ($queueEntry->productLink) {
            // Update existing VenQore product
            $product = $queueEntry->productLink->product;
            if ($product) {
                $product->update($venqoreData);
                $snapshot = $this->mapper->wooSnapshot($payload, $syncFields);
                $queueEntry->productLink->markSynced($snapshot);

                WooSyncLog::record(
                    $this->connection->id,
                    'product_pulled_from_woo',
                    'from_woo',
                    null,
                    $venqoreData,
                    $queueEntry->productLink->id
                );
                return true;
            }
        } else {
            // Create a new VenQore product from WooCommerce data
            $venqoreData['tenant_id'] = $this->connection->tenant_id;
            $venqoreData['sku']       = $sku;
            $venqoreData['name']      = $venqoreData['name'] ?? $payload['name'] ?? 'Imported from WooCommerce';

            $product = Product::create($venqoreData);

            // Create the link
            $link = $this->createLink($product, $payload['id'], $sku, 'synced');

            WooSyncLog::record(
                $this->connection->id,
                'product_created_from_woo',
                'from_woo',
                null,
                $venqoreData,
                $link->id
            );

            return true;
        }

        return false;
    }

    // ─── Conflict Resolution ──────────────────────────────────────────────────

    /**
     * Resolve a conflict by choosing VenQore's version.
     * Pushes VenQore data to WooCommerce and marks synced.
     */
    public function resolveConflictUseVenqore(WooProductLink $link, string $performedBy = 'system'): bool
    {
        $result = $this->pushToWoo($link);

        if ($result) {
            WooSyncLog::record(
                $this->connection->id,
                'conflict_resolved_use_venqore',
                'to_woo',
                $link->conflict_data['woocommerce'] ?? null,
                $link->conflict_data['venqore'] ?? null,
                $link->id,
                $performedBy
            );
        }

        return $result;
    }

    /**
     * Resolve a conflict by choosing WooCommerce's version.
     * Pulls WooCommerce data into VenQore and marks synced.
     */
    public function resolveConflictUseWoo(WooProductLink $link, string $performedBy = 'system'): bool
    {
        $wooData = $this->client->getProduct($link->woo_product_id);

        if (!$wooData) {
            return false;
        }

        $syncFields  = $this->connection->sync_fields ?? WooConnection::defaultSyncFields();
        $venqoreData = $this->mapper->wooToVenqore($wooData, $syncFields);

        $product = $link->product;
        if (!$product) {
            return false;
        }

        $product->update($venqoreData);
        $snapshot = $this->mapper->wooSnapshot($wooData, $syncFields);
        $link->markSynced($snapshot);

        WooSyncLog::record(
            $this->connection->id,
            'conflict_resolved_use_woo',
            'from_woo',
            $link->conflict_data['venqore'] ?? null,
            $venqoreData,
            $link->id,
            $performedBy
        );

        return true;
    }

    // ─── Scheduler Polling ────────────────────────────────────────────────────

    /**
     * Full polling comparison — run every 15 minutes as a safety net.
     * Fetches all WooCommerce products and compares against linked VenQore products.
     * Only queues changes that webhooks might have missed.
     */
    public function runSchedulerPoll(): array
    {
        $stats = ['checked' => 0, 'queued' => 0, 'new_staged' => 0];

        $wooProducts  = $this->client->getProducts();
        $wooById      = collect($wooProducts)->keyBy('id');

        $links = WooProductLink::where('connection_id', $this->connection->id)
            ->with('product')
            ->get();

        $syncFields = $this->connection->sync_fields ?? WooConnection::defaultSyncFields();

        foreach ($links as $link) {
            $stats['checked']++;

            if (!isset($wooById[$link->woo_product_id])) {
                continue;
            }

            $wooProduct  = $wooById[$link->woo_product_id];
            $product     = $link->product;

            if (!$product) {
                continue;
            }

            $venqoreSnap = $this->mapper->venqoreSnapshot($product, $syncFields);
            $wooSnap     = $this->mapper->wooSnapshot($wooProduct->toArray(), $syncFields);
            $diff        = $this->mapper->buildDiff($venqoreSnap, $wooSnap);

            if (!empty($diff) && $link->sync_status !== 'conflict') {
                $this->handleWooProductUpdated($wooProduct->toArray());
                $stats['queued']++;
            }
        }

        // Check for new WooCommerce products not yet in our system
        $linkedWooIds = $links->pluck('woo_product_id')->toArray();
        foreach ($wooProducts as $wp) {
            if (!in_array($wp['id'], $linkedWooIds)) {
                $this->handleWooProductCreated($wp);
                $stats['new_staged']++;
            }
        }

        $this->connection->update(['last_synced_at' => now()]);

        return $stats;
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Create a woo_product_links record.
     */
    protected function createLink(Product $product, int $wooProductId, string $sku, string $status = 'pending'): WooProductLink
    {
        return WooProductLink::create([
            'connection_id'       => $this->connection->id,
            'venqore_product_id'  => $product->id,
            'woo_product_id'      => $wooProductId,
            'sku'                 => $sku,
            'sync_status'         => $status,
            'last_synced_at'      => $status === 'synced' ? now() : null,
        ]);
    }

    /**
     * Stage a VenQore product to be pushed to WooCommerce.
     */
    protected function stageForPush(Product $product): WooSyncQueue
    {
        $syncFields = $this->connection->sync_fields ?? WooConnection::defaultSyncFields();
        $snapshot   = $this->mapper->venqoreSnapshot($product, $syncFields);

        return WooSyncQueue::create([
            'connection_id' => $this->connection->id,
            'direction'     => 'to_woo',
            'payload'       => array_merge($snapshot, [
                'sku'  => $product->sku,
                'name' => $product->name,
                '_venqore_product_id' => $product->id,
            ]),
            'status'        => 'staged',
            'triggered_by'  => 'scheduler',
        ]);
    }

    /**
     * Stage an incoming WooCommerce product for user review.
     */
    protected function stageIncomingProduct(array $wooProduct): WooSyncQueue
    {
        return WooSyncQueue::create([
            'connection_id' => $this->connection->id,
            'direction'     => 'from_woo',
            'payload'       => $wooProduct,
            'status'        => 'staged',
            'triggered_by'  => 'webhook',
        ]);
    }

    /**
     * Queue a push operation for an existing linked product.
     */
    protected function queuePush(WooProductLink $link, string $triggeredBy, array $payload): WooSyncQueue
    {
        return WooSyncQueue::create([
            'connection_id'  => $this->connection->id,
            'direction'      => 'to_woo',
            'product_link_id' => $link->id,
            'payload'        => $payload,
            'status'         => 'approved', // auto-approve for priority-resolved pushes
            'triggered_by'   => $triggeredBy,
        ]);
    }

    /**
     * Get WooCommerce categories as name → id map.
     */
    protected function getWooCategories(): array
    {
        $categories = $this->client->getCategories();
        $map = [];
        foreach ($categories as $cat) {
            $map[$cat['name']] = $cat['id'];
        }
        return $map;
    }
}
