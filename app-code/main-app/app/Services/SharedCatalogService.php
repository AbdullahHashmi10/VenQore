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
        if ($tenant && (bool) $tenant->shared_catalog_opt_out) {
            return false;
        }

        $cleanBarcode = trim($barcode);
        $cleanName    = trim($data['canonical_name'] ?? $data['name'] ?? '');

        if (empty($cleanBarcode) || empty($cleanName)) {
            return false;
        }

        $product = SharedProduct::where('barcode', $cleanBarcode)->first();

        if (!$product) {
            SharedProduct::create([
                'barcode'        => $cleanBarcode,
                'canonical_name' => $cleanName,
                'brand'          => $data['brand'] ?? null,
                'pack_size'      => $data['pack_size'] ?? null,
                'category'       => $data['category'] ?? null,
                'description'    => $data['description'] ?? null,
                'confirmations'  => 1,
                'is_published'   => false,
            ]);
            return true;
        }

        $newConfirmations = $product->confirmations + 1;
        $isPublished      = $newConfirmations >= 3;

        $product->update([
            'confirmations' => $newConfirmations,
            'is_published'  => $isPublished || $product->is_published,
        ]);

        return true;
    }
}
