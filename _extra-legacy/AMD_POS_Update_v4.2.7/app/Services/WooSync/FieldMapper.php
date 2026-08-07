<?php

namespace App\Services\WooSync;

use App\Models\Product;

/**
 * FieldMapper — Translates between VenQore product fields and WooCommerce REST API payload.
 *
 * This is the only place where field-level mapping logic lives.
 * SyncEngine calls this; it never does field translation itself.
 */
class FieldMapper
{
    /**
     * Convert a VenQore Product model into a WooCommerce product payload.
     *
     * @param  Product  $product
     * @param  array    $activeSyncFields  Which fields are enabled for this connection
     * @param  array    $wooCategories     Existing WooCommerce categories (name => id map)
     * @return array
     */
    public function venqoreToWoo(Product $product, array $activeSyncFields = [], array $wooCategories = []): array
    {
        $payload = [];

        if ($this->isActive($activeSyncFields, 'name')) {
            $payload['name'] = $product->name;
        }

        // SKU is always included — it's the binding key
        $payload['sku'] = $product->sku;

        if ($this->isActive($activeSyncFields, 'price')) {
            $payload['regular_price'] = (string) ($product->price ?? '');
        }

        if ($this->isActive($activeSyncFields, 'sale_price')) {
            $payload['sale_price'] = $product->sale_price ? (string) $product->sale_price : '';
        }

        if ($this->isActive($activeSyncFields, 'stock_quantity')) {
            $payload['manage_stock']    = true;
            $payload['stock_quantity']  = (int) ($product->stock_quantity ?? 0);
        }

        if ($this->isActive($activeSyncFields, 'stock_status')) {
            $payload['stock_status'] = ($product->stock_quantity > 0) ? 'instock' : 'outofstock';
        }

        if ($this->isActive($activeSyncFields, 'description')) {
            $payload['description'] = $product->description ?? '';
        }

        if ($this->isActive($activeSyncFields, 'short_description')) {
            $payload['short_description'] = $product->short_description ?? '';
        }

        if ($this->isActive($activeSyncFields, 'status')) {
            $payload['status'] = $this->mapVenqoreStatusToWoo($product->status ?? 'active');
        }

        if ($this->isActive($activeSyncFields, 'weight')) {
            $payload['weight'] = (string) ($product->weight ?? '');
        }

        if ($this->isActive($activeSyncFields, 'dimensions')) {
            $dimensions = $product->dimensions ?? [];
            if (is_string($dimensions)) {
                $dimensions = json_decode($dimensions, true) ?? [];
            }
            $payload['dimensions'] = [
                'length' => (string) ($dimensions['length'] ?? ''),
                'width'  => (string) ($dimensions['width'] ?? ''),
                'height' => (string) ($dimensions['height'] ?? ''),
            ];
        }

        if ($this->isActive($activeSyncFields, 'barcode') && $product->barcode) {
            $payload['meta_data'][] = [
                'key'   => '_venqore_barcode',
                'value' => $product->barcode,
            ];
        }

        // Categories — match by name, use WooCommerce ID
        if ($this->isActive($activeSyncFields, 'categories') && $product->category) {
            $catName = $product->category->name ?? null;
            if ($catName) {
                $catId = $wooCategories[$catName] ?? null;
                if ($catId) {
                    $payload['categories'] = [['id' => $catId]];
                }
            }
        }

        // Images — sync as URLs
        if ($this->isActive($activeSyncFields, 'images')) {
            $images = $product->images ?? [];
            $payload['images'] = $images->map(fn ($img) => ['src' => $img->url])->toArray();
        }

        return $payload;
    }

    /**
     * Convert a WooCommerce product payload into VenQore product update data.
     *
     * Returns an associative array of VenQore column => value.
     * Only returns fields that are active in syncFields.
     */
    public function wooToVenqore(array $wooProduct, array $activeSyncFields = []): array
    {
        $data = [];

        if ($this->isActive($activeSyncFields, 'name')) {
            $data['name'] = $wooProduct['name'] ?? null;
        }

        if ($this->isActive($activeSyncFields, 'price')) {
            $data['price'] = $wooProduct['regular_price'] ? (float) $wooProduct['regular_price'] : null;
        }

        if ($this->isActive($activeSyncFields, 'sale_price')) {
            $data['sale_price'] = $wooProduct['sale_price'] ? (float) $wooProduct['sale_price'] : null;
        }

        if ($this->isActive($activeSyncFields, 'stock_quantity')) {
            $data['stock_quantity'] = (int) ($wooProduct['stock_quantity'] ?? 0);
        }

        if ($this->isActive($activeSyncFields, 'description')) {
            $data['description'] = strip_tags($wooProduct['description'] ?? '');
        }

        if ($this->isActive($activeSyncFields, 'short_description')) {
            $data['short_description'] = strip_tags($wooProduct['short_description'] ?? '');
        }

        if ($this->isActive($activeSyncFields, 'status')) {
            $data['status'] = $this->mapWooStatusToVenqore($wooProduct['status'] ?? 'publish');
        }

        if ($this->isActive($activeSyncFields, 'weight')) {
            $data['weight'] = $wooProduct['weight'] ? (float) $wooProduct['weight'] : null;
        }

        if ($this->isActive($activeSyncFields, 'dimensions')) {
            $dims = $wooProduct['dimensions'] ?? [];
            $data['dimensions'] = [
                'length' => $dims['length'] ?? null,
                'width'  => $dims['width'] ?? null,
                'height' => $dims['height'] ?? null,
            ];
        }

        return $data;
    }

    /**
     * Build a diff between two field snapshots.
     * Returns only the fields that changed, with [old, new] pairs.
     */
    public function buildDiff(array $snapshotA, array $snapshotB): array
    {
        $diff = [];

        foreach ($snapshotB as $field => $newValue) {
            $oldValue = $snapshotA[$field] ?? null;
            if ($oldValue != $newValue) {
                $diff[$field] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }

        return $diff;
    }

    /**
     * Build a field snapshot from a VenQore product (for change detection).
     */
    public function venqoreSnapshot(Product $product, array $activeSyncFields = []): array
    {
        $snap = [];

        if ($this->isActive($activeSyncFields, 'name'))              $snap['name'] = $product->name;
        if ($this->isActive($activeSyncFields, 'price'))             $snap['price'] = (float) ($product->price ?? 0);
        if ($this->isActive($activeSyncFields, 'sale_price'))        $snap['sale_price'] = (float) ($product->sale_price ?? 0);
        if ($this->isActive($activeSyncFields, 'stock_quantity'))    $snap['stock_quantity'] = (int) ($product->stock_quantity ?? 0);
        if ($this->isActive($activeSyncFields, 'description'))       $snap['description'] = $product->description ?? '';
        if ($this->isActive($activeSyncFields, 'short_description')) $snap['short_description'] = $product->short_description ?? '';
        if ($this->isActive($activeSyncFields, 'status'))            $snap['status'] = $product->status ?? 'active';
        if ($this->isActive($activeSyncFields, 'weight'))            $snap['weight'] = (float) ($product->weight ?? 0);

        return $snap;
    }

    /**
     * Build a field snapshot from a WooCommerce product payload.
     */
    public function wooSnapshot(array $wooProduct, array $activeSyncFields = []): array
    {
        $snap = [];

        if ($this->isActive($activeSyncFields, 'name'))              $snap['name'] = $wooProduct['name'] ?? '';
        if ($this->isActive($activeSyncFields, 'price'))             $snap['price'] = (float) ($wooProduct['regular_price'] ?? 0);
        if ($this->isActive($activeSyncFields, 'sale_price'))        $snap['sale_price'] = (float) ($wooProduct['sale_price'] ?? 0);
        if ($this->isActive($activeSyncFields, 'stock_quantity'))    $snap['stock_quantity'] = (int) ($wooProduct['stock_quantity'] ?? 0);
        if ($this->isActive($activeSyncFields, 'description'))       $snap['description'] = strip_tags($wooProduct['description'] ?? '');
        if ($this->isActive($activeSyncFields, 'short_description')) $snap['short_description'] = strip_tags($wooProduct['short_description'] ?? '');
        if ($this->isActive($activeSyncFields, 'status'))            $snap['status'] = $this->mapWooStatusToVenqore($wooProduct['status'] ?? 'publish');
        if ($this->isActive($activeSyncFields, 'weight'))            $snap['weight'] = (float) ($wooProduct['weight'] ?? 0);

        return $snap;
    }

    // ─── Status mapping ───────────────────────────────────────────────────────

    protected function mapVenqoreStatusToWoo(string $venqoreStatus): string
    {
        return match ($venqoreStatus) {
            'active'   => 'publish',
            'inactive' => 'draft',
            'archived' => 'private',
            default    => 'publish',
        };
    }

    protected function mapWooStatusToVenqore(string $wooStatus): string
    {
        return match ($wooStatus) {
            'publish'  => 'active',
            'draft'    => 'inactive',
            'private'  => 'archived',
            'pending'  => 'inactive',
            default    => 'active',
        };
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Check if a field is enabled in the sync fields config.
     * Empty config = all fields active (first-sync or unconfigured).
     */
    protected function isActive(array $syncFields, string $field): bool
    {
        if (empty($syncFields)) {
            return true;
        }
        return !empty($syncFields[$field]);
    }
}
