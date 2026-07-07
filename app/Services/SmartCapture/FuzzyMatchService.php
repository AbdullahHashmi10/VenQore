<?php

namespace App\Services\SmartCapture;

use App\Models\Party;
use App\Models\Product;

class FuzzyMatchService
{

    /**
     * Match an extracted product name against the live catalog.
     * Returns top 5 candidate products with confidence scores (0–100).
     *
     * Scoring blends Levenshtein similarity, PHP similar_text and token overlap,
     * which handles word-order differences ("500ml Water Bottle" vs "Water Bottle 500ml")
     * and partial names much better than raw Levenshtein alone.
     *
     * @param string      $itemName   Raw item name from AI extraction
     * @param string|null $matchedSku SKU the AI claims to have matched (verified, not trusted)
     */
    public function matchProduct(string $itemName, ?string $matchedSku = null): array
    {
        $tenantId = app('current.tenant')->id;

        // 0. If the AI supplied a catalog SKU, verify it against THIS tenant's catalog.
        //    A verified SKU match is the strongest possible signal.
        $skuProduct = null;
        if (!empty($matchedSku)) {
            $skuProduct = Product::where('tenant_id', $tenantId)
                ->where('sku', $matchedSku)
                ->first(['id', 'name', 'sku', 'price', 'cost_price']);
        }

        // 1. Tokenize query words to filter DB rows (protects memory/perf)
        $words = array_filter(explode(' ', preg_replace('/[^\w\s]/u', '', $itemName)));

        $query = Product::where('tenant_id', $tenantId);

        if (!empty($words)) {
            $query->where(function ($q) use ($words) {
                foreach ($words as $word) {
                    if (mb_strlen($word) >= 2) {
                        $q->orWhere('name', 'like', '%' . $word . '%')
                          ->orWhere('sku', 'like', '%' . $word . '%');
                    }
                }
            });
        }

        $products = $query->take(50)->get(['id', 'name', 'sku', 'price', 'cost_price']);

        // Fallback candidates so the picker is never empty
        if ($products->isEmpty()) {
            $products = Product::where('tenant_id', $tenantId)
                ->latest()->take(10)
                ->get(['id', 'name', 'sku', 'price', 'cost_price']);
        }

        if ($skuProduct && !$products->contains('id', $skuProduct->id)) {
            $products->push($skuProduct);
        }

        // 2. Blended similarity re-ranking
        $ranked = $products->map(function ($product) use ($itemName, $skuProduct) {
            $confidence = $this->similarity($itemName, $product->name);

            // Verified AI SKU match dominates
            if ($skuProduct && $product->id === $skuProduct->id) {
                $confidence = max($confidence, 97);
            }

            return [
                'product'    => $product,
                'confidence' => $confidence,
            ];
        })
        ->sortByDesc('confidence')
        ->unique(fn ($m) => $m['product']->id)
        ->take(5)
        ->values();

        return $ranked->toArray();
    }

    /**
     * Match an extracted party name against tenant customers/suppliers.
     * Returns top 5 candidates: [ ['id','name','type','confidence'], ... ]
     *
     * @param string $type 'customer' | 'supplier'
     */
    public function matchParty(string $partyName, string $type): array
    {
        $tenantId = app('current.tenant')->id;

        $words = array_filter(explode(' ', preg_replace('/[^\w\s]/u', '', $partyName)));

        $query = Party::where('tenant_id', $tenantId)->where('type', $type);

        if (!empty($words)) {
            $query->where(function ($q) use ($words) {
                foreach ($words as $word) {
                    if (mb_strlen($word) >= 2) {
                        $q->orWhere('name', 'like', '%' . $word . '%');
                    }
                }
            });
        }

        $parties = $query->take(30)->get(['id', 'name', 'type']);

        if ($parties->isEmpty()) {
            $parties = Party::where('tenant_id', $tenantId)
                ->where('type', $type)
                ->take(10)
                ->get(['id', 'name', 'type']);
        }

        return $parties->map(fn ($party) => [
                'id'         => $party->id,
                'name'       => $party->name,
                'type'       => $party->type,
                'confidence' => $this->similarity($partyName, $party->name),
            ])
            ->sortByDesc('confidence')
            ->take(5)
            ->values()
            ->toArray();
    }

    /**
     * Blended string similarity score 0–100.
     */
    private function similarity(string $a, string $b): int
    {
        $a = mb_strtolower(trim($a));
        $b = mb_strtolower(trim($b));

        if ($a === '' || $b === '') {
            return 0;
        }

        if ($a === $b) {
            return 100;
        }

        // Levenshtein similarity
        $maxLen = max(strlen($a), strlen($b));
        $lev = $maxLen > 0 ? (1 - (levenshtein($a, $b) / $maxLen)) * 100 : 0;

        // similar_text percentage
        similar_text($a, $b, $pct);

        // Token overlap (order-insensitive)
        $tokensA = array_filter(explode(' ', preg_replace('/[^\w\s]/u', '', $a)));
        $tokensB = array_filter(explode(' ', preg_replace('/[^\w\s]/u', '', $b)));
        $overlap = 0;
        if (!empty($tokensA) && !empty($tokensB)) {
            $common = 0;
            foreach ($tokensA as $token) {
                foreach ($tokensB as $tb) {
                    if ($token === $tb || (mb_strlen($token) >= 3 && (str_contains($tb, $token) || str_contains($token, $tb)))) {
                        $common++;
                        break;
                    }
                }
            }
            $overlap = ($common / max(count($tokensA), count($tokensB))) * 100;
        }

        // Substring containment bonus (e.g. "coke" inside "Coca Cola Coke 1.5L")
        $containment = (str_contains($b, $a) || str_contains($a, $b)) ? 85 : 0;

        return (int) round(min(100, max($lev * 0.35 + $pct * 0.25 + $overlap * 0.40, $containment)));
    }
}
