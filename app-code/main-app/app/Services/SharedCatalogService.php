<?php

namespace App\Services;

use App\Models\SharedProduct;
use App\Models\Tenant;

class SharedCatalogService
{
    /**
     * Lookup a barcode in the shared catalog (published records only).
     */
    public function lookup(string $barcode): ?SharedProduct
    {
        $cleanBarcode = trim($barcode);
        if (empty($cleanBarcode)) {
            return null;
        }

        return SharedProduct::published()
            ->where('barcode', $cleanBarcode)
            ->first();
    }

    /**
     * Contribute a product barcode and name to the anonymous shared knowledge base.
     * Respects tenant's shared_catalog_opt_out flag.
     * Never stores prices, costs, stock, margins, or tenant identifiers.
     */
    public function contribute(?Tenant $tenant, string $barcode, array $data): bool
    {
        if (!$tenant || (bool) $tenant->shared_catalog_opt_out) {
            return false;
        }

        $cleanBarcode = trim($barcode);
        $cleanName    = trim($data['canonical_name'] ?? $data['name'] ?? '');

        if (empty($cleanBarcode) || empty($cleanName)) {
            return false;
        }

        $salt = (string) (config('app.shared_catalog_salt') ?: (config('app.key') ?: 'venqore_shared_catalog_salt'));
        $tenantHash = hash_hmac('sha256', (string) $tenant->id, $salt);

        $product = SharedProduct::where('barcode', $cleanBarcode)->first();

        if (!$product) {
            $product = SharedProduct::create([
                'barcode'        => $cleanBarcode,
                'canonical_name' => $cleanName,
                'brand'          => $data['brand'] ?? null,
                'pack_size'      => $data['pack_size'] ?? null,
                'category'       => $data['category'] ?? null,
                'description'    => $data['description'] ?? null,
                'confirmations'  => 1,
                'is_published'   => false,
            ]);
        }

        \App\Models\SharedProductContribution::firstOrCreate([
            'shared_product_id' => $product->id,
            'tenant_hash'       => $tenantHash,
        ]);

        $distinctCount = \App\Models\SharedProductContribution::where('shared_product_id', $product->id)->count();
        $threshold = (int) config('smartcapture.shared_catalog_threshold', 3);
        $isPublished = $distinctCount >= $threshold;

        $product->update([
            'confirmations' => $distinctCount,
            'is_published'  => $isPublished || $product->is_published,
        ]);

        return true;
    }
}
