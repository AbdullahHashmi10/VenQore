<?php

namespace App\Services\SmartCapture;

use App\Models\Party;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

/**
 * Matches what the AI read against THIS store's catalog using multi-strategy SQL search (T1-2, T1-3).
 */
class FuzzyMatchService
{
    public function __construct(
        private LearningService $learning,
        private ProductSearchIndexService $indexer
    ) {}

    /**
     * Match an extracted product name against the live catalog.
     * Returns up to 5 candidates with confidence scores (0–100), best first.
     *
     * @param string      $itemName Raw item name from AI extraction
     * @param string|null $partyId  Optional party ID (for supplier item code lookup)
     * @return array<int, array{product:Product, confidence:int, learned:bool, reason:string}>
     */
    public function matchProduct(string $itemName, ?string $partyId = null): array
    {
        $tenantId = app('current.tenant')->id;
        $normName = $this->indexer->normalizeText($itemName);

        // ── 1. Learned alias — this store already confirmed this wording ─────
        $learnedProduct = null;
        $learnedHit = $this->learning->resolveProduct($itemName);

        if ($learnedHit) {
            $learnedProduct = Product::where('tenant_id', $tenantId)
                ->whereKey($learnedHit['target_id'])
                ->first(['id', 'name', 'sku', 'price', 'cost_price']);
        }

        // ── 2. Supplier item code match (T1-3) ───────────────────────────────
        $supplierCodeProduct = null;
        if ($partyId) {
            $supplierCodeId = DB::table('supplier_product_codes')
                ->where('tenant_id', $tenantId)
                ->where('party_id', $partyId)
                ->where('supplier_code', $normName)
                ->value('product_id');

            if ($supplierCodeId) {
                $supplierCodeProduct = Product::where('tenant_id', $tenantId)->find($supplierCodeId);
            }
        }

        // ── 3. Multi-strategy product_search_index SQL lookups (T1-2) ────────
        $matchedIds = [];

        // Exact barcode or SKU or normalized name
        $exactMatches = DB::table('product_search_index')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($normName) {
                $q->where('barcode', $normName)
                  ->orWhere('sku_norm', $normName)
                  ->orWhere('name_norm', $normName);
            })
            ->pluck('product_id')
            ->toArray();

        $matchedIds = array_merge($matchedIds, $exactMatches);

        // Metaphone and Soundex matches
        if (count($matchedIds) < 5 && !empty($normName)) {
            $soundex = soundex($normName);
            $metaphone = metaphone($normName);

            $phoneticMatches = DB::table('product_search_index')
                ->where('tenant_id', $tenantId)
                ->whereNotIn('product_id', $matchedIds)
                ->where(function ($q) use ($soundex, $metaphone) {
                    $q->where('name_soundex', $soundex)
                      ->orWhere('name_metaphone', $metaphone);
                })
                ->pluck('product_id')
                ->toArray();

            $matchedIds = array_merge($matchedIds, $phoneticMatches);
        }

        // ── 3b. Strategy 6: Shared Catalog Knowledge Base lookup (T7-1) ───────────
        if (count($matchedIds) < 5 && !empty($normName)) {
            $sharedMatch = app(\App\Services\SharedCatalogService::class)->lookup($normName);
            if ($sharedMatch) {
                $sharedProductIds = Product::where('tenant_id', $tenantId)
                    ->where('name', 'like', '%' . $sharedMatch->canonical_name . '%')
                    ->pluck('id')
                    ->toArray();
                $matchedIds = array_merge($matchedIds, $sharedProductIds);
            }
        }

        // Fetch products for candidates
        $products = Product::where('tenant_id', $tenantId)
            ->whereIn('id', array_filter($matchedIds))
            ->get(['id', 'name', 'sku', 'price', 'cost_price']);

        // Fallback to token LIKE search if candidates < 5
        if ($products->count() < 5) {
            $words = array_filter(explode(' ', $normName));
            $fallbackQuery = Product::where('tenant_id', $tenantId);
            if (!empty($words)) {
                $fallbackQuery->where(function ($q) use ($words) {
                    foreach ($words as $w) {
                        if (mb_strlen($w) >= 2) {
                            $q->orWhere('name', 'like', '%' . $w . '%');
                        }
                    }
                });
            }
            $extra = $fallbackQuery->take(10)->get(['id', 'name', 'sku', 'price', 'cost_price']);
            foreach ($extra as $item) {
                if (!$products->contains('id', $item->id)) {
                    $products->push($item);
                }
            }
        }

        foreach ([$supplierCodeProduct, $learnedProduct] as $forced) {
            if ($forced && !$products->contains('id', $forced->id)) {
                $products->push($forced);
            }
        }

        // ── 4. Rank candidates ───────────────────────────────────────────────
        $ranked = $products->map(function ($product) use ($itemName, $normName, $supplierCodeProduct, $learnedProduct, $learnedHit) {
            $confidence = $this->similarity($itemName, $product->name);
            $learned    = false;
            $reason     = 'similar name';

            if ($supplierCodeProduct && $product->id === $supplierCodeProduct->id) {
                $confidence = 98;
                $reason     = 'matched supplier item code';
            }

            if ($learnedProduct && $product->id === $learnedProduct->id) {
                $confidence = 100;
                $learned    = true;
                $hits       = $learnedHit['hits'] ?? 1;
                $reason     = $hits > 1
                    ? "you chose this for \"{$learnedHit['source_text']}\" {$hits} times"
                    : "you chose this for \"{$learnedHit['source_text']}\" before";
            }

            return [
                'product'    => $product,
                'confidence' => $confidence,
                'learned'    => $learned,
                'reason'     => $reason,
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
     */
    public function matchParty(string $partyName, string $type): array
    {
        $tenantId = app('current.tenant')->id;

        $learnedHit = $this->learning->resolveParty($partyName, $type);
        $learnedId  = $learnedHit['target_id'] ?? null;

        $words = $this->tokens($partyName);

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

        if ($learnedId && !$parties->contains('id', $learnedId)) {
            $learnedParty = Party::where('tenant_id', $tenantId)
                ->where('type', $type)
                ->whereKey($learnedId)
                ->first(['id', 'name', 'type']);

            if ($learnedParty) {
                $parties->push($learnedParty);
            }
        }

        return $parties->map(function ($party) use ($partyName, $learnedId) {
                $isLearned = $learnedId && (string) $party->id === (string) $learnedId;

                return [
                    'id'         => $party->id,
                    'name'       => $party->name,
                    'type'       => $party->type,
                    'confidence' => $isLearned ? 100 : $this->similarity($partyName, $party->name),
                    'learned'    => (bool) $isLearned,
                ];
            })
            ->sortByDesc('confidence')
            ->take(5)
            ->values()
            ->toArray();
    }

    private function tokens(string $text): array
    {
        return array_values(array_filter(explode(' ', preg_replace('/[^\w\s]/u', ' ', $text))));
    }

    private function similarity(string $str1, string $str2): int
    {
        $s1 = mb_strtolower(trim($str1));
        $s2 = mb_strtolower(trim($str2));

        if ($s1 === $s2) {
            return 100;
        }

        similar_text($s1, $s2, $percent);
        $lev = levenshtein($s1, $s2);
        $maxLen = max(strlen($s1), strlen($s2));

        $levScore = $maxLen > 0 ? (1 - ($lev / $maxLen)) * 100 : 0;

        return (int) round(($percent * 0.5) + ($levScore * 0.5));
    }
}
