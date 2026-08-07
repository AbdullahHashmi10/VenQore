<?php

namespace App\Services\SmartCapture;

use App\Models\Product;
use Illuminate\Support\Collection;

class FuzzyMatchService
{
    /**
     * Match an extracted product name against the live catalog.
     * Returns top 3 candidate products with confidence scores.
     */
    public function matchProduct(string $itemName): array
    {
        $tenantId = app('current.tenant')->id;

        // 1. Tokenize query words to filter DB rows (protects memory/perf)
        $words = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $itemName)));
        
        $query = Product::where('tenant_id', $tenantId);

        if (!empty($words)) {
            $query->where(function($q) use ($words) {
                // If any word matches, pull it as a candidate
                foreach ($words as $word) {
                    if (strlen($word) >= 2) {
                        $q->orWhere('name', 'like', '%' . $word . '%')
                          ->orWhere('sku', 'like', '%' . $word . '%');
                    }
                }
            });
        }

        // If no keyword matches, fallback to returning recent products so we have some fallback candidates
        $products = $query->take(30)->get(['id', 'name', 'sku', 'price', 'cost_price']);
        if ($products->isEmpty()) {
            $products = Product::where('tenant_id', $tenantId)->latest()->take(10)->get(['id', 'name', 'sku', 'price', 'cost_price']);
        }

        // 2. Perform Levenshtein re-ranking
        $ranked = $products->map(function ($product) use ($itemName) {
            $distance = levenshtein(strtolower($itemName), strtolower($product->name));
            $maxLen = max(strlen($itemName), strlen($product->name));
            
            // Calculate confidence percent (0 - 100)
            $confidence = $maxLen > 0 ? (int) round((1 - ($distance / $maxLen)) * 100) : 0;
            
            return [
                'product' => $product,
                'confidence' => $confidence
            ];
        })
        ->sortByDesc('confidence')
        ->take(3)
        ->values();

        return $ranked->toArray();
    }
}
