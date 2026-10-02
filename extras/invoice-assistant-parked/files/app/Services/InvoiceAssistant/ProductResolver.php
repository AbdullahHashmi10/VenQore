<?php

namespace App\Services\InvoiceAssistant;

use App\Models\Product;
use App\Models\ProductBarcode;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;

/**
 * Deterministic, store-scoped product / variant resolution.
 *
 * Exact first: variant SKU, product SKU, barcode (all compared again in PHP so
 * collation folding cannot turn "ABC-101" into "ABC-1O1"). A SKU the operator
 * supplied that does not exist is a BLOCKER with optional suggestions — fuzzy
 * similarity never silently replaces it. Duplicate exact hits, and a product
 * matched where it has variants, are ambiguous and need a choice.
 *
 * Candidate ids are "<productId>|<variantId>" (variant part empty for a plain
 * product). Deleted products are excluded by the model's soft-delete scope.
 */
class ProductResolver
{
    public function __construct(private int|string|null $tenantId = null) {}

    /**
     * @param array $line      validated intent line
     * @param string|null $choice previously selected candidate id (re-validated)
     * @param bool $voice      spoken input: allow a normalized-SKU suggestion
     * @return array{status:string, product:?Product, variant:?ProductVariant, candidates:array, basis:?string}
     *   status: resolved | ambiguous | suggested | not_found
     */
    public function resolve(array $line, ?string $choice = null, bool $voice = false): array
    {
        if ($choice) {
            $hit = $this->fromCandidateId($choice);
            if ($hit) {
                return $this->done($hit[0], $hit[1], 'selected');
            }
        }

        $sku  = $line['sku'] ?? null;
        $name = $line['name'] ?? null;

        if ($sku !== null && $sku !== '') {
            $matches = $this->exactSku($sku);
            if ($matches['pairs']->count() === 1) {
                [$p, $v] = $matches['pairs']->first();
                // A product matched where it has variants: the variant matters.
                if (!$v && $p->has_variants && $this->variantsOf($p)->isNotEmpty()) {
                    return $this->variantChoice($p);
                }

                return $this->done($p, $v, $matches['basis']);
            }
            if ($matches['pairs']->count() > 1) {
                return $this->ambiguousPairs($matches['pairs']);
            }

            if ($voice) {
                $near = $this->normalizedSku($sku);
                if ($near->count() === 1) {
                    [$p, $v] = $near->first();

                    return [
                        'status' => 'suggested', 'product' => null, 'variant' => null, 'basis' => 'normalized_suggestion',
                        'candidates' => [$this->candidate($p, $v)],
                    ];
                }
                if ($near->count() > 1) {
                    return $this->ambiguousPairs($near);
                }
            }

            return $this->notFound($sku, $name);
        }

        if ($name !== null && $name !== '') {
            $exact = Product::query()->where('tenant_id', $this->tenantId)
                ->where('name', 'like', $this->like($name))->limit(25)->get()
                ->filter(fn (Product $p) => $this->squash($p->name) === $this->squash($name))->values();

            if ($exact->count() === 1) {
                $p = $exact->first();
                if ($p->has_variants && $this->variantsOf($p)->isNotEmpty()) {
                    return $this->variantChoice($p);
                }

                return $this->done($p, null, 'exact_name');
            }
            if ($exact->count() > 1) {
                return $this->ambiguousPairs($exact->map(fn ($p) => [$p, null]));
            }

            return $this->notFound(null, $name);
        }

        return ['status' => 'not_found', 'product' => null, 'variant' => null, 'candidates' => [], 'basis' => null];
    }

    /** Selection id -> [Product, ?Variant], only if both still belong to this store. */
    public function fromCandidateId(string $id): ?array
    {
        [$pid, $vid] = array_pad(explode('|', $id, 2), 2, '');
        if ($pid === '') {
            return null;
        }
        $product = Product::query()->where('tenant_id', $this->tenantId)->where('id', $pid)->first();
        if (!$product) {
            return null;
        }
        if ($vid === '') {
            if ($product->has_variants && $this->variantsOf($product)->isNotEmpty()) {
                return null; // a variant must be chosen
            }

            return [$product, null];
        }
        $variant = ProductVariant::query()->where('tenant_id', $this->tenantId)
            ->where('product_id', $product->id)->where('id', $vid)->first();

        return $variant ? [$product, $variant] : null;
    }

    public function candidate(Product $p, ?ProductVariant $v = null): array
    {
        $attrs = $v && is_array($v->attributes ?? null)
            ? collect($v->attributes)->map(fn ($val, $key) => is_scalar($val) ? "{$key}: {$val}" : null)->filter()->implode(', ')
            : null;

        return [
            'id'              => $p->id . '|' . ($v?->id ?? ''),
            'label'           => $v ? trim($p->name . ' — ' . ($attrs ?: ($v->sku ?: 'variant'))) : (string) $p->name,
            'secondary_label' => $v ? ($v->sku ?: $p->sku) : $p->sku,
        ];
    }

    /** @return array{pairs:Collection, basis:?string} pairs of [Product, ?Variant] */
    private function exactSku(string $sku): array
    {
        $want = $this->squash($sku);
        $pairs = collect();
        $basis = 'exact_sku';

        // Variant SKUs (globally unique column, but always filter to this store).
        ProductVariant::query()->where('tenant_id', $this->tenantId)
            ->where('sku', 'like', $this->like($sku))->limit(25)->get()
            ->filter(fn (ProductVariant $v) => $this->squash($v->sku) === $want)
            ->each(function (ProductVariant $v) use (&$pairs) {
                $p = Product::query()->where('tenant_id', $this->tenantId)->where('id', $v->product_id)->first();
                if ($p) {
                    $pairs->push([$p, $v]);
                }
            });

        Product::query()->where('tenant_id', $this->tenantId)
            ->where('sku', 'like', $this->like($sku))->limit(25)->get()
            ->filter(fn (Product $p) => $this->squash($p->sku) === $want)
            ->each(fn (Product $p) => $pairs->push([$p, null]));

        if ($pairs->isEmpty()) {
            ProductBarcode::query()->where('tenant_id', $this->tenantId)
                ->where('barcode', $sku)->where('is_active', true)->limit(10)->get()
                ->each(function (ProductBarcode $b) use (&$pairs) {
                    $p = Product::query()->where('tenant_id', $this->tenantId)->where('id', $b->product_id)->first();
                    if ($p) {
                        $pairs->push([$p, null]);
                    }
                });
            $basis = 'exact_barcode';
        }

        $unique = $pairs->unique(fn ($pair) => $pair[0]->id . '|' . ($pair[1]->id ?? ''))->values();

        return ['pairs' => $unique, 'basis' => $basis];
    }

    /** "ABC 101", "abc_101" and "ABC-101" are the same spoken SKU; flagged for confirmation only. */
    private function normalizedSku(string $sku): Collection
    {
        $key = $this->loose($sku);
        if (strlen($key) < 3) {
            return collect();
        }
        $pairs = collect();
        $first = mb_substr(preg_replace('/[^\p{L}\p{N}]+/u', '', $sku) ?? '', 0, 2);

        ProductVariant::query()->where('tenant_id', $this->tenantId)
            ->where('sku', 'like', $this->like($first) . '%')->limit(200)->get()
            ->filter(fn ($v) => $this->loose((string) $v->sku) === $key)
            ->each(function ($v) use (&$pairs) {
                $p = Product::query()->where('tenant_id', $this->tenantId)->where('id', $v->product_id)->first();
                if ($p) {
                    $pairs->push([$p, $v]);
                }
            });
        Product::query()->where('tenant_id', $this->tenantId)
            ->where('sku', 'like', $this->like($first) . '%')->limit(200)->get()
            ->filter(fn ($p) => $this->loose((string) $p->sku) === $key)
            ->each(fn ($p) => $pairs->push([$p, null]));

        return $pairs->unique(fn ($pair) => $pair[0]->id . '|' . ($pair[1]->id ?? ''))->values();
    }

    private function variantChoice(Product $p): array
    {
        $limit = (int) config('invoice_assistant.candidate_limit', 5);
        $cands = $this->variantsOf($p)->take($limit)->map(fn ($v) => $this->candidate($p, $v))->all();

        return [
            'status' => 'ambiguous', 'product' => null, 'variant' => null,
            'candidates' => $cands, 'basis' => 'variant_required',
        ];
    }

    private function ambiguousPairs(Collection $pairs): array
    {
        $limit = (int) config('invoice_assistant.candidate_limit', 5);

        return [
            'status' => 'ambiguous', 'product' => null, 'variant' => null, 'basis' => 'duplicate',
            'candidates' => $pairs->take($limit)->map(fn ($pair) => $this->candidate($pair[0], $pair[1] ?? null))->all(),
        ];
    }

    private function notFound(?string $sku, ?string $name): array
    {
        $limit = (int) config('invoice_assistant.candidate_limit', 5);
        $term = $sku ?: $name;
        $cands = [];
        if ($term) {
            $like = '%' . $this->likeBody($term) . '%';
            $rows = Product::query()->where('tenant_id', $this->tenantId)
                ->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('sku', 'like', $like))
                ->orderBy('name')->limit($limit)->get();
            foreach ($rows as $p) {
                $cands[] = $this->candidate($p, null);
            }
        }

        return ['status' => 'not_found', 'product' => null, 'variant' => null, 'candidates' => array_slice($cands, 0, $limit), 'basis' => null];
    }

    private function done(Product $p, ?ProductVariant $v, string $basis): array
    {
        return ['status' => 'resolved', 'product' => $p, 'variant' => $v, 'candidates' => [], 'basis' => $basis];
    }

    private function variantsOf(Product $p): Collection
    {
        return ProductVariant::query()->where('tenant_id', $this->tenantId)->where('product_id', $p->id)->orderBy('sku')->get();
    }

    private function squash(?string $s): string
    {
        return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', (string) $s)));
    }

    private function loose(string $s): string
    {
        return mb_strtolower((string) preg_replace('/[^\p{L}\p{N}]+/u', '', $s));
    }

    private function like(string $s): string
    {
        return $this->likeBody($s);
    }

    private function likeBody(string $s): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $s);
    }
}
