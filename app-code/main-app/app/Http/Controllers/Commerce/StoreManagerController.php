<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
use App\Services\Commerce\OnlinePricing;
use App\Services\Commerce\OpeningHours;
use App\Services\Commerce\ProductReadiness;
use App\Services\Commerce\StockAvailability;
use App\Services\Commerce\StorefrontPresenter;
use App\Services\Commerce\StorefrontReadiness;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** Merchant-side Online Store: profile, publication, pricing. Everything is scoped to the bound tenant. */
class StoreManagerController extends Controller
{
    private const RESERVED_SLUGS = ['order', 'orders', 'api', 'cart', 'checkout', 'quote', 'admin', 'www', 'app', 'shop', 'stores', 'venqore'];

    private function tenant()
    {
        return app('current.tenant');
    }

    private function store(bool $create = false): ?Storefront
    {
        $t = $this->tenant();
        $s = Storefront::where('tenant_id', $t->id)->first();
        if (! $s && $create) {
            $slug = Str::slug($t->slug ?: $t->name) ?: 'store-' . $t->id;
            if (in_array($slug, self::RESERVED_SLUGS, true) || Storefront::where('slug', $slug)->exists()) {
                $slug .= '-' . $t->id;
            }
            $country = $t->country_code ? DB::table('commerce_countries')->where('code', strtoupper($t->country_code))->first() : null;
            $s = Storefront::create([
                'tenant_id' => $t->id,
                'slug' => Str::limit($slug, 60, ''),
                'display_name' => $t->name,
                'country_id' => $country->id ?? null,
                'timezone' => $t->timezone ?: 'UTC',
                'currency_code' => $t->currency_code ?: 'PKR',
                'currency_symbol' => $t->currency_symbol ?: 'Rs',
                'warehouse_id' => DB::table('warehouses')->where('tenant_id', $t->id)->whereNull('deleted_at')->orderByDesc('is_default')->value('id'),
                'status' => 'draft',
            ])->refresh(); // load DB defaults (pricing_mode, flags…)
        }
        return $s;
    }

    private function urls(): array
    {
        $slug = $this->tenant()->slug;
        $r = fn ($n, $extra = []) => route('store.commerce.' . $n, array_merge(['store_slug' => $slug], $extra));
        return [
            'home' => $r('home'), 'settings' => $r('settings'), 'settings_save' => $r('settings.save'),
            'products' => $r('products'), 'products_bulk' => $r('products.bulk'),
            'publish' => $r('publish'), 'unpublish' => $r('unpublish'), 'intake' => $r('intake'),
            'orders' => $r('orders'), 'alerts' => $r('alerts'),
        ];
    }

    public function home()
    {
        $store = $this->store(true);
        $t = $this->tenant();
        $problems = StorefrontReadiness::problems($store);
        $counts = DB::table('commerce_orders')->where('tenant_id', $t->id)->selectRaw("
            SUM(status='pending') as pending, SUM(status IN ('confirmed','preparing','ready','out_for_delivery')) as active,
            SUM(status='completed') as completed, COUNT(*) as total")->first();
        $url = StorefrontPresenter::publicUrl($store);

        return Inertia::render('OnlineStore/Home', [
            'store' => $this->forManager($store),
            'problems' => $problems,
            'can_publish' => empty($problems) && $store->status !== 'suspended',
            'counts' => ['pending' => (int) $counts->pending, 'active' => (int) $counts->active, 'completed' => (int) $counts->completed, 'total' => (int) $counts->total],
            'published_products' => DB::table('storefront_products')->where('storefront_id', $store->id)->where('is_published', 1)->count(),
            'public_url' => $url,
            'qr_svg' => StorefrontPresenter::qrSvg($url),
            'urls' => $this->urls(),
        ]);
    }

    public function settings()
    {
        $store = $this->store(true);
        $t = $this->tenant();
        return Inertia::render('OnlineStore/Settings', [
            'store' => $this->forManager($store),
            'countries' => DB::table('commerce_countries')->where('is_active', 1)->orderBy('name')->get(['id', 'code', 'name']),
            'cities' => DB::table('commerce_cities')->where('is_active', 1)->orderBy('sort_order')->orderBy('name')->get(['id', 'country_id', 'name']),
            'warehouses' => DB::table('warehouses')->where('tenant_id', $t->id)->whereNull('deleted_at')->orderBy('name')->get(['id', 'name']),
            'days' => OpeningHours::DAYS,
            'urls' => $this->urls(),
        ]);
    }

    public function saveSettings(Request $request)
    {
        $store = $this->store(true);
        $t = $this->tenant();

        $data = $request->validate([
            'display_name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'min:3', 'max:60', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/', Rule::unique('storefronts', 'slug')->ignore($store->id), Rule::notIn(self::RESERVED_SLUGS)],
            'description' => ['nullable', 'string', 'max:2000'],
            'country_id' => ['nullable', 'integer', Rule::exists('commerce_countries', 'id')->where('is_active', 1)],
            'city_id' => ['nullable', 'integer', Rule::exists('commerce_cities', 'id')->where('is_active', 1)],
            'address_line' => ['nullable', 'string', 'max:255'],
            'map_url' => ['nullable', 'url', 'max:500'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'opening_hours' => ['nullable', 'array'],
            'opening_hours.*' => ['nullable', 'array'],
            'opening_hours.*.open' => ['nullable', 'date_format:H:i'],
            'opening_hours.*.close' => ['nullable', 'date_format:H:i'],
            'supports_pickup' => ['boolean'],
            'supports_delivery' => ['boolean'],
            'delivery_charge' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'delivery_note' => ['nullable', 'string', 'max:255'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'warehouse_id' => ['nullable', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $t->id)->whereNull('deleted_at')],
            'pricing_mode' => ['required', Rule::in(['same', 'increase', 'decrease'])],
            'pricing_percent' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'accept_cod' => ['boolean'], 'accept_pickup_payment' => ['boolean'], 'accept_bank_transfer' => ['boolean'],
            'bank_instructions' => ['nullable', 'string', 'max:1000'],
            'accept_deadline_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        if (! empty($data['city_id']) && ! empty($data['country_id'])
            && ! DB::table('commerce_cities')->where('id', $data['city_id'])->where('country_id', $data['country_id'])->exists()) {
            return back()->withErrors(['city_id' => 'That city is not in the selected country.']);
        }
        $pct = (float) ($data['pricing_percent'] ?? 0);
        if ($data['pricing_mode'] === 'same') {
            $pct = 0.0;
        }
        if ($err = OnlinePricing::validateRule($data['pricing_mode'], $pct)) {
            return back()->withErrors(['pricing_percent' => $err]);
        }

        // opening hours: keep only known days
        $hours = null;
        if (isset($data['opening_hours'])) {
            $hours = [];
            foreach (OpeningHours::DAYS as $d) {
                $h = $data['opening_hours'][$d] ?? null;
                $hours[$d] = ($h && ! empty($h['open']) && ! empty($h['close'])) ? ['open' => $h['open'], 'close' => $h['close']] : null;
            }
        }

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('commerce/logos', 'public');
        }
        unset($data['logo']);

        $store->fill(array_merge($data, [
            'pricing_percent' => $pct,
            'opening_hours' => $hours,
            'delivery_charge' => (float) ($data['delivery_charge'] ?? 0),
            'min_order_amount' => (float) ($data['min_order_amount'] ?? 0),
            'accept_deadline_minutes' => (int) ($data['accept_deadline_minutes'] ?? $store->accept_deadline_minutes),
            // currency / timezone come from the business, never from a visitor
            'timezone' => $t->timezone ?: $store->timezone,
            'currency_code' => $t->currency_code ?: $store->currency_code,
            'currency_symbol' => $t->currency_symbol ?: $store->currency_symbol,
        ]))->save();

        // A published store that no longer meets the bar is pulled back to unpublished.
        if ($store->status === 'published' && StorefrontReadiness::problems($store)) {
            $store->update(['status' => 'unpublished']);
            return back()->with('info', 'Saved. Your store was unpublished because it no longer meets the publishing requirements.');
        }
        return back()->with('success', 'Online store settings saved.');
    }

    public function publish()
    {
        $store = $this->store(true);
        if ($store->status === 'suspended') {
            return back()->withErrors(['store' => 'This store is suspended. Contact VenQore support.']);
        }
        $problems = StorefrontReadiness::problems($store);
        if ($problems) {
            return back()->withErrors(['store' => 'Not ready to publish: ' . implode(' ', $problems)]);
        }
        $store->update(['status' => 'published', 'published_at' => $store->published_at ?? now()]);
        return back()->with('success', 'Your store is live.');
    }

    public function unpublish()
    {
        $store = $this->store(true);
        if ($store->status === 'published') {
            $store->update(['status' => 'unpublished']);
        }
        return back()->with('success', 'Your store is hidden. Open orders can still be completed.');
    }

    public function intake(Request $request)
    {
        $store = $this->store(true);
        $store->update(['intake_paused' => $request->boolean('paused')]);
        return back()->with('success', $store->intake_paused ? 'New online orders are paused.' : 'Online ordering resumed.');
    }

    // ── Products ─────────────────────────────────────────────────────────────

    public function products(Request $request)
    {
        $store = $this->store(true);
        $t = $this->tenant();
        $q = trim((string) $request->query('q', ''));
        $filter = $request->query('filter', 'all');

        $query = DB::table('products as p')
            ->leftJoin('storefront_products as sp', function ($j) use ($store) {
                $j->on('sp.product_id', '=', 'p.id')->where('sp.storefront_id', '=', $store->id);
            })
            ->where('p.tenant_id', $t->id)->whereNull('p.deleted_at')
            ->when($q !== '', fn ($w) => $w->where(fn ($x) => $x->where('p.name', 'like', "%{$q}%")->orWhere('p.sku', 'like', "%{$q}%")))
            ->when($filter === 'published', fn ($w) => $w->where('sp.is_published', 1))
            ->when($filter === 'unpublished', fn ($w) => $w->where(fn ($x) => $x->whereNull('sp.is_published')->orWhere('sp.is_published', 0)))
            ->orderBy('p.name');

        $page = $query->select(['p.id', 'p.tenant_id', 'p.name', 'p.sku', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
            'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial', 'p.image_path', 'p.base_unit',
            'sp.id as listing_id', 'sp.is_published', 'sp.override_price', 'sp.public_name', 'sp.public_description', 'sp.allow_below_cost'])
            ->paginate(25)->withQueryString();

        $pricing = app(OnlinePricing::class);
        $stock = app(StockAvailability::class);
        $rows = collect($page->items())->map(function ($p) use ($store, $pricing, $stock, $t) {
            $reason = ProductReadiness::reason($p);
            $price = $pricing->resolve($p, (object) ['override_price' => $p->override_price], $store);
            return [
                'id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'has_image' => (bool) $p->image_path,
                'regular_price' => (float) $p->price, 'online_price' => $price['online_price'], 'rule' => $price['rule'],
                'below_cost' => $price['below_cost'], 'allow_below_cost' => (bool) $p->allow_below_cost,
                'published' => (bool) $p->is_published, 'override_price' => $p->override_price !== null ? (float) $p->override_price : null,
                'public_name' => $p->public_name, 'public_description' => $p->public_description,
                'blocked_reason' => $reason,
                'available' => $store->warehouse_id ? round($stock->available($t->id, $p->id, $store->warehouse_id), 2) : null,
            ];
        });

        return Inertia::render('OnlineStore/Products', [
            'store' => $this->forManager($store),
            'products' => $rows,
            'pagination' => ['current' => $page->currentPage(), 'last' => $page->lastPage(), 'total' => $page->total(), 'per_page' => $page->perPage()],
            'filters' => ['q' => $q, 'filter' => $filter],
            'skipped' => session('skipped', []),
            'urls' => $this->urls(),
        ]);
    }

    public function bulkProducts(Request $request)
    {
        $store = $this->store(true);
        $t = $this->tenant();
        $v = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['string'],
            'action' => ['required', Rule::in(['publish', 'unpublish', 'update'])],
            'override_price' => ['nullable', 'numeric', 'min:0.01', 'max:100000000'],
            'clear_override' => ['boolean'],
            'public_name' => ['nullable', 'string', 'max:191'],
            'public_description' => ['nullable', 'string', 'max:2000'],
            'allow_below_cost' => ['nullable', 'boolean'],
        ]);

        $products = DB::table('products')->where('tenant_id', $t->id)->whereNull('deleted_at')->whereIn('id', $v['ids'])->get()->keyBy('id');
        $pricing = app(OnlinePricing::class);
        $done = 0;
        $skipped = [];

        foreach ($v['ids'] as $id) {
            $p = $products->get($id);
            if (! $p) {
                $skipped[] = ['id' => $id, 'reason' => 'Product not found.'];
                continue;
            }
            $sp = DB::table('storefront_products')->where('storefront_id', $store->id)->where('product_id', $id)->first();
            $now = now();

            if ($v['action'] === 'unpublish') {
                if ($sp) {
                    DB::table('storefront_products')->where('id', $sp->id)->update(['is_published' => 0, 'updated_at' => $now]);
                    $done++;
                }
                continue;
            }

            $fields = [];
            if (array_key_exists('override_price', $v) && $v['override_price'] !== null && count($v['ids']) === 1) {
                $fields['override_price'] = round((float) $v['override_price'], 4);
            }
            if (! empty($v['clear_override']) && count($v['ids']) === 1) {
                $fields['override_price'] = null;
            }
            if (count($v['ids']) === 1) {
                foreach (['public_name', 'public_description'] as $f) {
                    if (array_key_exists($f, $v)) {
                        $fields[$f] = $v[$f] === '' ? null : $v[$f];
                    }
                }
            }
            if (array_key_exists('allow_below_cost', $v) && $v['allow_below_cost'] !== null) {
                $fields['allow_below_cost'] = (bool) $v['allow_below_cost'];
            }

            $effective = (object) array_merge(
                ['override_price' => $sp->override_price ?? null, 'allow_below_cost' => $sp->allow_below_cost ?? 0],
                $fields
            );

            if ($v['action'] === 'publish') {
                if ($reason = ProductReadiness::reason($p)) {
                    $skipped[] = ['id' => $id, 'name' => $p->name, 'reason' => $reason];
                    continue;
                }
                $price = $pricing->resolve($p, $effective, $store);
                if ($price['below_cost'] && ! $effective->allow_below_cost) {
                    $skipped[] = ['id' => $id, 'name' => $p->name, 'reason' => 'Online price is below cost. Allow below-cost pricing for this product, or change the price.'];
                    continue;
                }
                $fields['is_published'] = 1;
            }

            if ($sp) {
                DB::table('storefront_products')->where('id', $sp->id)->update($fields + ['updated_at' => $now]);
            } else {
                DB::table('storefront_products')->insert($fields + [
                    'id' => (string) Str::uuid(), 'storefront_id' => $store->id, 'tenant_id' => $t->id, 'product_id' => $id,
                    'is_published' => 0, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }
            $done++;
        }

        // Pulling the last product from a live store pulls the store back.
        if ($store->status === 'published' && ! DB::table('storefront_products')->where('storefront_id', $store->id)->where('is_published', 1)->exists()) {
            $store->update(['status' => 'unpublished']);
        }

        $msg = "{$done} product(s) updated." . ($skipped ? ' ' . count($skipped) . ' skipped.' : '');
        return back()->with($skipped ? 'info' : 'success', $msg)->with('skipped', $skipped);
    }

    private function forManager(Storefront $s): array
    {
        return [
            'id' => $s->id, 'slug' => $s->slug, 'display_name' => $s->display_name, 'description' => $s->description,
            'country_id' => $s->country_id, 'city_id' => $s->city_id, 'address_line' => $s->address_line, 'map_url' => $s->map_url,
            'logo_url' => StorefrontPresenter::mediaUrl($s->logo_path), 'phone' => $s->phone, 'email' => $s->email,
            'opening_hours' => $s->opening_hours, 'timezone' => $s->timezone, 'currency_symbol' => $s->currency_symbol,
            'supports_pickup' => $s->supports_pickup, 'supports_delivery' => $s->supports_delivery,
            'delivery_charge' => $s->delivery_charge, 'delivery_note' => $s->delivery_note, 'min_order_amount' => $s->min_order_amount,
            'warehouse_id' => $s->warehouse_id, 'pricing_mode' => $s->pricing_mode, 'pricing_percent' => $s->pricing_percent,
            'accept_cod' => $s->accept_cod, 'accept_pickup_payment' => $s->accept_pickup_payment,
            'accept_bank_transfer' => $s->accept_bank_transfer, 'bank_instructions' => $s->bank_instructions,
            'accept_deadline_minutes' => $s->accept_deadline_minutes,
            'intake_paused' => $s->intake_paused, 'status' => $s->status, 'suspended_reason' => $s->suspended_reason,
        ];
    }
}
