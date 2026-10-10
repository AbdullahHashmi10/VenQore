<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use App\Support\MapCoords;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Builds the public marketplace page (/shop): where the shopper is, nearby shops, offers, best sellers. */
class MarketplaceDirectory
{
    private const PER_PAGE = 12;
    private const MAX_SHOPS = 500;
    private const NEAREST_CITY_KM = 120;

    public function build(Request $request): array
    {
        $countries = DB::table('commerce_countries')->where('is_active', 1)->orderBy('name')->get(['id', 'code', 'name']);
        $country = $countries->firstWhere('code', strtoupper((string) $request->query('country'))) ?? ($countries->count() === 1 ? $countries->first() : null);
        $cities = $country
            ? DB::table('commerce_cities')->where('country_id', $country->id)->where('is_active', 1)->orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug', 'latitude', 'longitude'])
            : collect();

        $me = $this->me($request);
        $city = $cities->firstWhere('slug', (string) $request->query('city'));
        $located = false;
        if (! $city && $me) {
            $city = $this->nearestCity($cities, $me);
            $located = $city !== null;
        }

        $intent = MarketplaceSearch::parse(mb_substr(trim((string) $request->query('q', '')), 0, 80));
        $f = [
            'q' => mb_substr(trim((string) $request->query('q', '')), 0, 80),
            'open' => $request->boolean('open') || $intent['open'],
            'delivery' => $request->boolean('delivery') || $intent['delivery'],
            'pickup' => $request->boolean('pickup') || $intent['pickup'],
            'offers' => $request->boolean('offers') || $intent['offers'],
            'free_delivery' => $intent['free_delivery'],
            'kind' => (string) $request->query('kind', '') ?: $intent['kind'],
            'sort' => in_array($request->query('sort'), ['nearest', 'fastest', 'rating', 'cheapest', 'name'], true) ? $request->query('sort') : ($intent['sort'] ?: ($me ? 'nearest' : 'name')),
            'near_asked' => $intent['near'],
            'text' => $intent['text'], 'kind_words' => $intent['kind_words'],
        ];

        $out = [
            'countries' => $countries, 'country' => $country,
            'cities' => $cities->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'lat' => $c->latitude !== null ? (float) $c->latitude : null, 'lng' => $c->longitude !== null ? (float) $c->longitude : null])->values(),
            'city' => $city ? ['id' => $city->id, 'name' => $city->name, 'slug' => $city->slug, 'lat' => $city->latitude !== null ? (float) $city->latitude : null, 'lng' => $city->longitude !== null ? (float) $city->longitude : null] : null,
            'me' => $me, 'located' => $located, 'filters' => $f,
            'kinds' => collect(MarketplaceSearch::KINDS)->map(fn ($k, $key) => ['key' => $key, 'label' => $k['label']])->values(),
            'stores' => null, 'products' => [], 'trending' => [], 'offers' => [], 'nearby' => [], 'map' => [], 'needs_location' => $f['near_asked'] && ! $me,
        ];
        if (! $city) {
            return $out;
        }

        $shops = $this->shops($city, $me);
        $out['offers'] = $this->offersStrip($shops);
        $out['trending'] = $this->trending($shops);
        $filtered = $this->filter($shops, $f);
        $sorted = $this->sort($filtered, $f['sort']);
        $out['products'] = $f['text'] !== '' ? $this->productHits($shops, $f['text']) : [];

        $per = self::PER_PAGE;
        $cur = max(1, (int) $request->query('page', 1));
        $slice = $sorted->slice(($cur - 1) * $per, $per)->values();
        $out['stores'] = ['data' => $slice->map(fn ($r) => $r['card'])->all(), 'current' => $cur, 'last' => max(1, (int) ceil($sorted->count() / $per)), 'total' => $sorted->count()];
        $out['nearby'] = $me ? $this->sort($shops, 'nearest')->take(6)->map(fn ($r) => $r['card'])->values()->all() : [];
        $out['map'] = $sorted->filter(fn ($r) => $r['lat'] !== null)->take(200)->map(fn ($r) => ['slug' => $r['card']['slug'], 'name' => $r['card']['name'], 'lat' => $r['lat'], 'lng' => $r['lng'], 'open' => $r['card']['open_now'], 'url' => $r['card']['url']])->values()->all();
        return $out;
    }

    /** The shopper's chosen point, if sane. */
    private function me(Request $request): ?array
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if (! is_numeric($lat) || ! is_numeric($lng) || MapCoords::valid((float) $lat, (float) $lng) === null) {
            return null;
        }
        return ['lat' => round((float) $lat, 5), 'lng' => round((float) $lng, 5)];
    }

    private function nearestCity($cities, array $me): ?object
    {
        $best = null;
        $bestKm = PHP_FLOAT_MAX;
        foreach ($cities as $c) {
            if ($c->latitude === null || $c->longitude === null) {
                continue;
            }
            $km = MapCoords::km($me['lat'], $me['lng'], (float) $c->latitude, (float) $c->longitude);
            if ($km < $bestKm) {
                $best = $c;
                $bestKm = $km;
            }
        }
        return $bestKm <= self::NEAREST_CITY_KM ? $best : null;
    }

    /** Every live shop in the city with what the page needs to filter and sort it. */
    private function shops(object $city, ?array $me)
    {
        $rows = Storefront::onlineStoreOn()->where('status', 'published')->where('city_id', $city->id)->orderBy('display_name')->orderBy('id')->limit(self::MAX_SHOPS)->get();
        $ids = $rows->pluck('id')->map(fn ($i) => (string) $i)->all();
        StorefrontBadges::preload($ids);
        $ratings = $ids ? DB::table('storefront_reviews')->whereIn('storefront_id', $ids)->groupBy('storefront_id')
            ->selectRaw('storefront_id, AVG(rating) as avg_r, COUNT(*) as n')->get()->keyBy('storefront_id') : collect();
        $types = $rows->isNotEmpty() ? DB::table('tenants')->whereIn('id', $rows->pluck('tenant_id')->unique()->all())->pluck('business_type', 'id') : collect();
        $now = now()->utc()->toDateTimeString();
        $promos = $ids ? DB::table('commerce_promotions')->whereIn('storefront_id', $ids)->where('is_active', 1)->whereNull('code')
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->where(fn ($q) => $q->whereNull('max_uses')->orWhereColumn('uses', '<', 'max_uses'))
            ->get()->groupBy('storefront_id') : collect();

        return $rows->map(function ($s) use ($me, $ratings, $types, $promos) {
            $lat = $s->latitude !== null ? (float) $s->latitude : null;
            $lng = $s->longitude !== null ? (float) $s->longitude : null;
            $km = ($me && $lat !== null && $lng !== null) ? round(MapCoords::km($me['lat'], $me['lng'], $lat, $lng), 1) : null;
            $rate = $ratings->get((string) $s->id);
            $best = $promos->get((string) $s->id, collect())->sortByDesc(fn ($p) => ($p->kind ?? 'percent') === 'amount' ? 0 : (float) $p->percent)->first();
            $offer = $best ? (($best->kind ?? 'percent') === 'amount' ? 'Rs ' . rtrim(rtrim(number_format((float) $best->amount, 2, '.', ''), '0'), '.') . ' off' : rtrim(rtrim(number_format((float) $best->percent, 1, '.', ''), '0'), '.') . '% off') : null;
            $card = StorefrontPresenter::card($s) + [
                'distance_km' => $km,
                'rating' => $rate ? round((float) $rate->avg_r, 1) : null,
                'reviews' => $rate ? (int) $rate->n : 0,
                'prep_minutes' => $s->prep_minutes !== null ? (int) $s->prep_minutes : null,
                'delivery_charge' => (float) $s->delivery_charge,
                'min_order' => (float) $s->min_order_amount,
                'offer' => $offer,
                'offer_name' => $best->name ?? null,
                'business_type' => $types[$s->tenant_id] ?? null,
                'banner_url' => StorefrontPresenter::mediaUrl($s->banner_path),
                'currency' => $s->currency_symbol,
            ];
            return ['card' => $card, 'model' => $s, 'lat' => $lat, 'lng' => $lng, 'km' => $km, 'promo' => $best];
        })->values();
    }

    private function filter($shops, array $f)
    {
        $types = $f['kind'] ? MarketplaceSearch::typesFor($f['kind']) : [];
        $text = mb_strtolower($f['text']);
        $hitIds = $text !== '' ? $this->storesWithProduct($shops, $f['text']) : [];
        return $shops->filter(function ($r) use ($f, $types, $text, $hitIds) {
            $c = $r['card'];
            if ($f['delivery'] && ! $c['delivery']) return false;
            if ($f['pickup'] && ! $c['pickup']) return false;
            if ($f['offers'] && ! $c['offer']) return false;
            if ($f['free_delivery'] && ($c['delivery_charge'] > 0 || ! $c['delivery'])) return false;
            if ($f['open'] && $c['open_now'] !== true) return false;
            if ($f['kind']) {
                $hay = mb_strtolower($c['name'] . ' ' . ($c['address'] ?? ''));
                $byName = collect($f['kind_words'] ?? [])->contains(fn ($w) => str_contains($hay, $w));
                if (! in_array($c['business_type'], $types, true) && ! $byName) return false;
            }
            if ($text !== '' && ! str_contains(mb_strtolower($c['name'] . ' ' . ($c['address'] ?? '')), $text) && ! isset($hitIds[(string) $r['model']->id])) return false;
            return true;
        })->values();
    }

    private function sort($shops, string $by)
    {
        $far = 1.0e9;
        return match ($by) {
            'nearest' => $shops->sortBy(fn ($r) => [$r['km'] ?? $far, $r['card']['name']])->values(),
            'fastest' => $shops->sortBy(fn ($r) => [$r['card']['delivery'] ? 0 : 1, $r['card']['prep_minutes'] ?? 999, $r['km'] ?? $far])->values(),
            'cheapest' => $shops->sortBy(fn ($r) => [$r['card']['delivery'] ? 0 : 1, $r['card']['delivery_charge'], $r['card']['name']])->values(),
            'rating' => $shops->sortBy(fn ($r) => [-($r['card']['rating'] ?? 0), -$r['card']['reviews'], $r['card']['name']])->values(),
            default => $shops->sortBy(fn ($r) => $r['card']['name'])->values(),
        };
    }

    /** @return array<string,true> storefront ids that sell a product matching $text */
    private function storesWithProduct($shops, string $text): array
    {
        $ids = $shops->pluck('model.id')->map(fn ($i) => (string) $i)->all();
        if (! $ids) return [];
        $like = '%' . addcslashes($text, '\\%_') . '%';
        return DB::table('storefront_products as sp')
            ->join('products as p', fn ($j) => $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id'))
            ->whereIn('sp.storefront_id', $ids)->where('sp.is_published', 1)->where('sp.show_online', 1)->whereNull('p.deleted_at')
            ->where(fn ($x) => $x->where('p.name', 'like', $like)->orWhere('sp.public_name', 'like', $like))
            ->distinct()->pluck('sp.storefront_id')->mapWithKeys(fn ($i) => [(string) $i => true])->all();
    }

    private function productHits($shops, string $text): array
    {
        $byId = $shops->keyBy(fn ($r) => (string) $r['model']->id);
        if ($byId->isEmpty()) return [];
        $like = '%' . addcslashes($text, '\\%_') . '%';
        return DB::table('storefront_products as sp')
            ->join('products as p', fn ($j) => $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id'))
            ->whereIn('sp.storefront_id', $byId->keys()->all())->where('sp.is_published', 1)->where('sp.show_online', 1)->whereNull('p.deleted_at')
            ->where(fn ($x) => $x->where('p.name', 'like', $like)->orWhere('sp.public_name', 'like', $like))
            ->orderBy('p.name')->limit(24)->get(['p.name as product', 'sp.public_name', 'sp.storefront_id'])
            ->map(function ($r) use ($byId) {
                $c = $byId[(string) $r->storefront_id]['card'];
                $name = $r->public_name ?: $r->product;
                return ['product' => $name, 'store' => $c['name'], 'url' => $c['url'] . '/products?q=' . rawurlencode($name)];
            })->all();
    }

    /** Biggest live offers across the city, one per shop. */
    private function offersStrip($shops): array
    {
        return $shops->filter(fn ($r) => $r['promo'])->sortByDesc(fn ($r) => ($r['promo']->kind ?? 'percent') === 'amount' ? (float) $r['promo']->amount : (float) $r['promo']->percent * 10)
            ->take(10)->map(fn ($r) => ['store' => $r['card']['name'], 'logo_url' => $r['card']['logo_url'], 'url' => $r['card']['url'], 'offer' => $r['card']['offer'], 'title' => $r['card']['offer_name'], 'open_now' => $r['card']['open_now']])->values()->all();
    }

    private const COLS = ['sp.id as listing_id', 'sp.public_name', 'sp.override_price', 'sp.allow_below_cost', 'sp.product_id', 'sp.storefront_id', 'sp.image_path as listing_image',
        'p.category_id', 'p.id', 'p.tenant_id', 'p.name', 'p.image_path', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
        'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial'];

    /** Best sellers (completed orders, last 90 days); falls back to newly listed items while the marketplace is young. */
    private function trending($shops): array
    {
        $byId = $shops->keyBy(fn ($r) => (string) $r['model']->id);
        if ($byId->isEmpty()) return [];
        $ids = $byId->keys()->all();
        $since = now()->subDays(90)->toDateTimeString();
        $top = DB::table('commerce_order_items as i')
            ->join('commerce_orders as o', 'o.id', '=', 'i.order_id')
            ->whereIn('o.storefront_id', $ids)->where('o.status', 'completed')->where('o.created_at', '>=', $since)
            ->groupBy('o.storefront_id', 'i.product_id')
            ->selectRaw('o.storefront_id as sid, i.product_id as pid, SUM(i.quantity) as qty')
            ->orderByDesc('qty')->limit(60)->get();
        $pairs = $top->map(fn ($t) => [(string) $t->sid, (string) $t->pid, (float) $t->qty])->all();
        $items = $this->hydrate($byId, $pairs, true);
        if (count($items) < 8) {
            $new = DB::table('storefront_products as sp')
                ->join('products as p', fn ($j) => $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id'))
                ->whereIn('sp.storefront_id', $ids)->where('sp.is_published', 1)->where('sp.show_online', 1)->whereNull('p.deleted_at')
                ->orderByDesc('sp.created_at')->limit(40)->get(['sp.storefront_id', 'sp.product_id']);
            $have = collect($items)->map(fn ($i) => $i['_k'])->all();
            $extra = $new->map(fn ($r) => [(string) $r->storefront_id, (string) $r->product_id, 0.0])->filter(fn ($p) => ! in_array($p[0] . '|' . $p[1], $have, true))->all();
            $items = array_merge($items, $this->hydrate($byId, $extra, false, 12 - count($items)));
        }
        return collect($items)->map(function ($i) { unset($i['_k']); return $i; })->take(12)->values()->all();
    }

    private function hydrate($byId, array $pairs, bool $sold, int $limit = 12): array
    {
        $pricing = app(OnlinePricing::class);
        $perShop = [];
        $out = [];
        foreach ($pairs as [$sid, $pid, $qty]) {
            if (count($out) >= $limit) break;
            if (($perShop[$sid] ?? 0) >= 2) continue;
            $shop = $byId[$sid] ?? null;
            if (! $shop) continue;
            $r = DB::table('storefront_products as sp')
                ->join('products as p', fn ($j) => $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id'))
                ->where('sp.storefront_id', $sid)->where('sp.product_id', $pid)->where('sp.tenant_id', $shop['model']->tenant_id)
                ->where('sp.is_published', 1)->where('sp.show_online', 1)->whereNull('p.deleted_at')->first(self::COLS);
            if (! $r || ProductReadiness::reason($r) !== null) continue;
            $price = $pricing->resolve($r, $r, $shop['model']);
            if ($price['below_cost'] && ! $r->allow_below_cost) continue;
            $was = null;
            $promo = $shop['promo'];
            if ($promo && ($promo->kind ?? 'percent') === 'percent' && (float) $promo->min_order <= 0 && $promo->scope === 'store') {
                $d = $pricing->discount($price, $r, (float) $promo->percent);
                if (! $d['below_cost'] || $r->allow_below_cost) { $was = $price['online_price']; $price = $d; }
            }
            $c = $shop['card'];
            $perShop[$sid] = ($perShop[$sid] ?? 0) + 1;
            $name = $r->public_name ?: $r->name;
            $out[] = [
                '_k' => $sid . '|' . $pid, 'name' => $name, 'price' => $price['online_price'], 'was_price' => $was,
                'image_url' => StorefrontPresenter::mediaUrl($r->listing_image ?: $r->image_path),
                'store' => $c['name'], 'url' => $c['url'] . '/products?q=' . rawurlencode($name), 'currency' => $c['currency'],
                'sold' => $sold ? (int) round($qty) : null, 'open_now' => $c['open_now'], 'distance_km' => $c['distance_km'],
            ];
        }
        return $out;
    }
}
