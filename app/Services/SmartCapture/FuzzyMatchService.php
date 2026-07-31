<?php

namespace App\Services\SmartCapture;

use App\Models\Party;
use App\Models\Product;

/**
 * Matches what the AI read against THIS store's catalog.
 *
 * Resolution order, strongest first:
 *   1. Learned alias  — the store previously confirmed this exact wording.
 *                       Pinned at 100% and marked `learned`, so nobody has to
 *                       correct the same reading twice.
 *   2. Verified SKU   — the model returned a SKU that really exists in this
 *                       tenant's catalog (the claim is checked, never trusted).
 *   3. Blended fuzzy  — Levenshtein + similar_text + token overlap + size/unit
 *                       agreement.
 *
 * Every query is explicitly scoped to the current tenant.
 */
class FuzzyMatchService
{
    public function __construct(private LearningService $learning) {}

    /**
     * Match an extracted product name against the live catalog.
     * Returns up to 5 candidates with confidence scores (0–100), best first.
     *
     * @param string      $itemName   Raw item name from AI extraction
     * @param string|null $matchedSku SKU the AI claims to have matched (verified, not trusted)
     * @return array<int, array{product:Product, confidence:int, learned:bool, reason:string}>
     */
    public function matchProduct(string $itemName, ?string $matchedSku = null): array
    {
        $tenantId = app('current.tenant')->id;

        // ── 1. Learned alias — this store already told us what this means ────
        $learnedProduct = null;
        $learnedHit = $this->learning->resolveProduct($itemName);

        if ($learnedHit) {
            $learnedProduct = Product::where('tenant_id', $tenantId)
                ->whereKey($learnedHit['target_id'])
                ->first(['id', 'name', 'sku', 'price', 'cost_price']);
        }

        // ── 2. Verify any SKU the model claimed, against THIS tenant only ────
        $skuProduct = null;
        if (!empty($matchedSku)) {
            $skuProduct = Product::where('tenant_id', $tenantId)
                ->where('sku', $matchedSku)
                ->first(['id', 'name', 'sku', 'price', 'cost_price']);
        }

        // ── 3. Candidate pool ────────────────────────────────────────────────
        $words = $this->tokens($itemName);

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

        foreach ([$skuProduct, $learnedProduct] as $forced) {
            if ($forced && !$products->contains('id', $forced->id)) {
                $products->push($forced);
            }
        }

        // ── 4. Rank ──────────────────────────────────────────────────────────
        $ranked = $products->map(function ($product) use ($itemName, $skuProduct, $learnedProduct, $learnedHit) {
            $confidence = $this->similarity($itemName, $product->name);
            $learned    = false;
            $reason     = 'similar name';

            if ($skuProduct && $product->id === $skuProduct->id && $confidence < 97) {
                $confidence = 97;
                $reason = 'AI matched catalog SKU';
            }

            // A confirmed lesson from this store beats everything else.
            if ($learnedProduct && $product->id === $learnedProduct->id) {
                $confidence = 100;
                $learned = true;
                $hits = $learnedHit['hits'] ?? 1;
                $reason = $hits > 1
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
     *
     * @param string $type 'customer' | 'supplier'
     * @return array<int, array{id:string, name:string, type:string, confidence:int, learned:bool}>
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

    /**
     * @return array<int, string>
     */
    private function tokens(string $text): array
    {
        return array_values(array_filter(explode(' ', preg_replace('/[^\w\s]/u', ' ', $text))));
    }

    /**
     * Blended string similarity score 0–100.
     *
     * Includes a size/unit guard: "Coke 1.5L" and "Coke 500ml" share almost
     * every letter, so pure string distance rates them as near-identical. On a
     * POS catalogue that is the single most expensive kind of mismatch, so a
     * disagreeing measurement is penalised hard.
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

        // Levenshtein similarity (guard: levenshtein() is limited to 255 bytes)
        $la = mb_substr($a, 0, 255);
        $lb = mb_substr($b, 0, 255);
        $maxLen = max(strlen($la), strlen($lb));
        $lev = $maxLen > 0 ? (1 - (levenshtein($la, $lb) / $maxLen)) * 100 : 0;

        // similar_text percentage
        similar_text($a, $b, $pct);

        // Token overlap (order-insensitive)
        $tokensA = $this->tokens($a);
        $tokensB = $this->tokens($b);
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

        $score = min(100, max($lev * 0.35 + $pct * 0.25 + $overlap * 0.40, $containment));

        // Size / unit agreement guard
        $score *= $this->measurementFactor($a, $b);

        return (int) round($score);
    }

    /**
     * Multiplier reflecting whether two names describe the same pack size.
     *
     * 1.00 — same measurement, or neither name states one
     * 0.95 — only one name states a measurement (mild penalty, could be shorthand)
     * 0.55 — both state a measurement and they disagree
     */
    private function measurementFactor(string $a, string $b): float
    {
        $ma = $this->measurements($a);
        $mb = $this->measurements($b);

        if (empty($ma) && empty($mb)) {
            return 1.0;
        }

        if (empty($ma) || empty($mb)) {
            return 0.95;
        }

        return array_intersect($ma, $mb) ? 1.0 : 0.55;
    }

    /**
     * Pull normalised measurements ("1.5l", "500ml", "5kg") out of a name and
     * express them in a common base unit so 1.5L and 1500ml compare equal.
     *
     * @return array<int, string>
     */
    private function measurements(string $text): array
    {
        if (!preg_match_all('/(\d+(?:\.\d+)?)\s*(kg|g|gm|gram|grams|mg|l|ltr|litre|liter|ml|cl|pcs|pc|pack)\b/u', $text, $matches, PREG_SET_ORDER)) {
            return [];
        }

        $out = [];

        foreach ($matches as $match) {
            $value = (float) $match[1];
            $unit  = $match[2];

            [$base, $factor] = match ($unit) {
                'kg'                                  => ['g', 1000],
                'g', 'gm', 'gram', 'grams'            => ['g', 1],
                'mg'                                  => ['g', 0.001],
                'l', 'ltr', 'litre', 'liter'          => ['ml', 1000],
                'cl'                                  => ['ml', 10],
                'ml'                                  => ['ml', 1],
                default                               => ['unit', 1],
            };

            $out[] = $base . ':' . rtrim(rtrim(number_format($value * $factor, 3, '.', ''), '0'), '.');
        }

        return array_unique($out);
    }
}
