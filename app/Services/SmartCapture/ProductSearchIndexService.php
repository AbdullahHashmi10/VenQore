<?php

namespace App\Services\SmartCapture;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductSearchIndexService
{
    /**
     * Normalizes a product name or query string into clean tokens for matching.
     */
    public function normalizeText(string $text): string
    {
        $clean = mb_strtolower($text, 'UTF-8');

        // Convert Urdu/Arabic-Indic and Devanagari numerals to Western digits
        $eastern = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩','०','१','२','३','४','५','६','७','८','९'];
        $western = ['0','1','2','3','4','5','6','7','8','9','0','1','2','3','4','5','6','7','8','9'];
        $clean = str_replace($eastern, $western, $clean);

        // Normalize units (1.5l -> 1.5l, 1500ml -> 1.5l, ltr -> l)
        $clean = preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:ltr|litres?|liter?|l)\b/i', '$1l', $clean);
        $clean = preg_replace('/\b(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)\b/i', '$1kg', $clean);

        // Strip non-alphanumeric punctuation except decimal numbers
        $clean = preg_replace('/[^\w\s\.]+/u', ' ', $clean);
        $clean = preg_replace('/\s+/', ' ', $clean);

        return trim($clean);
    }

    /**
     * Updates or creates the product_search_index entry for a given Product.
     */
    public function indexProduct(Product $product): void
    {
        $tenantId = $product->tenant_id;
        $productId = $product->id;
        $normName = $this->normalizeText($product->name ?? '');

        $soundex = soundex($normName);
        $metaphone = metaphone($normName);
        $skuNorm = $product->sku ? mb_strtolower(trim($product->sku)) : null;
        $barcode = $product->barcode ? trim($product->barcode) : null;

        $tokens = implode(' ', array_unique(array_filter(explode(' ', $normName))));

        DB::table('product_search_index')->updateOrInsert(
            ['tenant_id' => $tenantId, 'product_id' => $productId],
            [
                'name_norm'      => $normName,
                'name_soundex'   => $soundex,
                'name_metaphone' => $metaphone,
                'sku_norm'       => $skuNorm,
                'barcode'        => $barcode,
                'tokens'         => $tokens,
            ]
        );
    }

    /**
     * Removes a product from the search index.
     */
    public function removeProduct(int $tenantId, int $productId): void
    {
        DB::table('product_search_index')
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->delete();
    }
}
