<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Everything the public store pages (home, shop, product) need to know about what a business sells.
 *
 * One pass builds every sellable item exactly the way the cart will price it: the same pricing, offer,
 * stock and add-on rules as checkout, so a card, a product page and the cart can never disagree.
 * Filtering, sorting and paging then happen in memory on that list (capped), which keeps price filters
 * and "on offer" honest even though prices are worked out after the query.
 *
 * Read-only. The QR menu keeps its own reader in PublicStoreController::show().
 */
class StorefrontCatalogue
{
    public const CAP = 5000;
    public const PER_PAGE = 24;

    public function __construct(
        private OnlinePricing $pricing,
        private Promotions $promos,
        private StockAvailability $stock,
        private OnlineAddOns $addOns,
    ) {
    }

    /** @return Collection<int, array> sellable items, option groups folded into one item with `options`. */
    public function items(Storefront $store): Collection
    {
        // Building thousands of priced, stock-checked items is heavy; share one build across shoppers for a few seconds.
        // Checkout re-checks real stock, so a short-lived list is safe.
        return \Illuminate\Support\Facades\Cache::remember('sfcat:' . $store->id, 30, fn () => $this->buildItems($store));
    }

    /** @return Collection<int, array> */
    private function buildItems(Storefront $store): Collection
    {
        $cols = ['sp.is_featured', 'sp.created_at as listed_at', 'p.category_id', 'sp.id as listing_id', 'sp.public_name', 'sp.public_description', 'sp.override_price', 'sp.allow_below_cost', 'sp.product_id',
            'sp.offline_reserve_qty', 'sp.online_stock_limit', 'sp.sort_order',
            'sp.image_path as listing_image', 'sp.option_group', 'sp.option_label', 'p.id', 'p.tenant_id', 'p.name', 'p.description', 'p.image_path', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
            'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial'];

        $base = fn () => DB::table('storefront_products as sp')
            ->join('products as p', fn ($j) => $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id'))
            ->where('sp.storefront_id', $store->id)->where('sp.tenant_id', $store->tenant_id)->where('sp.is_published', 1)->where('sp.show_online', 1)
            ->whereNull('p.deleted_at');

        $all = $base()
            ->orderByDesc('sp.is_featured')->orderBy('sp.sort_order')->orderBy('p.name')->orderBy('sp.id')
            ->limit(self::CAP * 3)->get($cols);

        $catNames = DB::table('categories')->whereIn('id', $all->pluck('category_id')->filter()->unique()->all())->pluck('name', 'id');

        // One representative row per option group (the first listed); the rest become its options.
        $seen = [];
        $heads = $all->filter(function ($r) use (&$seen) {
            if (! $r->option_group) {
                return true;
            }
            if (isset($seen[$r->option_group])) {
                return false;
            }
            return $seen[$r->option_group] = true;
        })->take(self::CAP)->values();
        $sibs = $all->filter(fn ($r) => $r->option_group)->groupBy('option_group');

        if ($store->warehouse_id) {
            $this->stock->prime($store->tenant_id, $store->warehouse_id, $all->pluck('id')->all());
        }
        $addOnMap = $this->addOns->forProducts(
            (int) $store->tenant_id,
            $all->mapWithKeys(fn ($r) => [(string) $r->id => $r->category_id])->all()
        );
        $plan = ['coupon' => null, 'auto' => $this->promos->live($store)
            ->filter(fn ($p) => $p->code === null && ($p->kind ?? 'percent') === 'percent' && (float) $p->min_order <= 0)->values()];

        $build = function ($r) use ($store, $plan, $catNames, $addOnMap) {
            if (ProductReadiness::reason($r) !== null) {
                return null;
            }
            $price = $this->pricing->resolve($r, $r, $store);
            if ($price['below_cost'] && ! $r->allow_below_cost) {
                return null;
            }
            $was = null;
            if ($promo = $this->promos->pickFor($plan, $r->category_id)) {
                $d = $this->pricing->discount($price, $r, (float) $promo->percent);
                if (! $d['below_cost'] || $r->allow_below_cost) {
                    $was = $price['online_price'];
                    $price = $d;
                }
            }
            $left = null;
            if ($store->warehouse_id && ! $this->stock->sellsWithoutStock((int) $store->tenant_id, (string) $r->id)) {
                $raw = $this->stock->available($store->tenant_id, $r->id, $store->warehouse_id);
                $left = max(0.0, $raw - (float) ($r->offline_reserve_qty ?? 0));
                if ($r->online_stock_limit !== null) {
                    $left = min($left, (float) $r->online_stock_limit);
                }
                if ($left > 0) {
                    $left = max(1.0, $left - $this->stock->pendingDemand($store->tenant_id, $r->id));
                }
            }
            $img = $store->show_images ? StorefrontPresenter::mediaUrl($r->listing_image ?: $r->image_path) : null;

            return [
                'id' => $r->listing_id,
                'name' => $r->public_name ?: $r->name,
                'description' => $r->public_description ?: $r->description,
                'category_id' => $r->category_id,
                'category' => $catNames[$r->category_id] ?? null,
                'price' => $price['online_price'],
                'was_price' => $was,
                'unit' => $r->base_unit ?: $r->unit,
                'stock' => $left === null ? null : ($left <= 0 ? 'out' : ($left <= 5 ? 'low' : null)),
                'left' => $left !== null && $left > 0 && $left <= 5 ? (int) floor($left) : null,
                'featured' => (bool) $r->is_featured,
                'is_new' => $r->listed_at && strtotime((string) $r->listed_at) > strtotime('-14 days'),
                'listed_at' => $r->listed_at ? strtotime((string) $r->listed_at) : 0,
                'image_url' => $img,
                'option_label' => $r->option_label,
                'addons' => $addOnMap[$r->id] ?? [],
                'options' => [],
            ];
        };

        return $heads->map(function ($r) use ($build, $sibs) {
            $item = $build($r);
            if (! $item || ! $r->option_group) {
                return $item;
            }
            $opts = ($sibs[$r->option_group] ?? collect())->sortBy([['option_label', 'asc'], ['listing_id', 'asc']])
                ->map($build)->filter()->map(fn ($o) => [
                    'id' => $o['id'], 'label' => $o['option_label'] ?: $o['name'], 'price' => $o['price'], 'was_price' => $o['was_price'],
                    'stock' => $o['stock'], 'left' => $o['left'], 'image_url' => $o['image_url'], 'addons' => $o['addons'],
                ])->values();
            if ($opts->count() > 1) {
                $item['options'] = $opts;
                $item['name'] = $r->public_name ?: ($r->option_group ?: $item['name']);
                $item['price_from'] = $opts->min('price');
                // a group is sold out only when every option is
                if ($opts->every(fn ($o) => $o['stock'] === 'out')) {
                    $item['stock'] = 'out';
                } elseif ($item['stock'] === 'out') {
                    $item['stock'] = null;
                }
                $item['was_price'] = $opts->contains(fn ($o) => $o['was_price']) ? $item['was_price'] : null;
            }

            return $item;
        })->filter()->values();
    }

    /** @return Collection<int, array{id:mixed,name:string,count:int,image_url:?string}> */
    public function categories(Collection $items): Collection
    {
        return $items->filter(fn ($i) => $i['category_id'])->groupBy('category_id')->map(fn ($g, $id) => [
            'id' => $id,
            'name' => $g->first()['category'] ?? 'Other',
            'count' => $g->count(),
            'image_url' => optional($g->first(fn ($i) => $i['image_url']))['image_url'],
        ])->sortBy('name')->values();
    }

    /**
     * Filter and sort an item list from the request-style filters.
     *
     * @param array{q?:string,category?:string,sort?:string,min?:mixed,max?:mixed,in_stock?:mixed,offer?:mixed} $f
     */
    public function filter(Collection $items, array $f): Collection
    {
        $q = mb_strtolower(trim((string) ($f['q'] ?? '')));
        $cat = (string) ($f['category'] ?? '');
        $min = isset($f['min']) && $f['min'] !== '' ? (float) $f['min'] : null;
        $max = isset($f['max']) && $f['max'] !== '' ? (float) $f['max'] : null;
        $inStock = filter_var($f['in_stock'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $offer = filter_var($f['offer'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $out = $items->filter(function ($i) use ($q, $cat, $min, $max, $inStock, $offer) {
            $p = (float) ($i['price_from'] ?? $i['price']);
            return ($cat === '' || (string) $i['category_id'] === $cat)
                && ($q === '' || str_contains(mb_strtolower($i['name'] . ' ' . ($i['description'] ?? '') . ' ' . ($i['category'] ?? '')), $q))
                && ($min === null || $p >= $min)
                && ($max === null || $p <= $max)
                && (! $inStock || $i['stock'] !== 'out')
                && (! $offer || $i['was_price'] !== null);
        });

        $sort = (string) ($f['sort'] ?? 'featured');
        $price = fn ($i) => (float) ($i['price_from'] ?? $i['price']);

        return match ($sort) {
            'price_asc' => $out->sortBy($price),
            'price_desc' => $out->sortByDesc($price),
            'newest' => $out->sortByDesc('listed_at'),
            'name' => $out->sortBy(fn ($i) => mb_strtolower($i['name'])),
            default => $out,                              // featured first, then the merchant's own order
        };
    }

    /** Offers worth showing as a banner. Coupon codes are never listed publicly: the owner shares those themselves. */
    public function offers(Storefront $store): Collection
    {
        return $this->promos->live($store)
            ->filter(fn ($p) => $p->code === null)
            ->map(fn ($p) => [
                'name' => $p->name,
                'percent' => (float) $p->percent,
                'min_order' => (float) $p->min_order,
                'ends_at' => $p->ends_at,
            ])->values();
    }
}
