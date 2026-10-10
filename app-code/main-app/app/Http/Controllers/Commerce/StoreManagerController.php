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
                'currency_symbol' => \App\Helpers\SettingsHelper::get('currency_symbol') ?? ($t->currency_symbol ?: 'Rs'),
                'warehouse_id' => DB::table('warehouses')->where('tenant_id', $t->id)->whereNull('deleted_at')->orderByDesc('is_default')->value('id'),
                'status' => 'draft',
            ])->refresh(); // load DB defaults (pricing_mode, flags…)
        }
        return $s;
    }

    private function urls(): array
    {
        $tenant = $this->tenant();
        $slug = $tenant->slug;
        $r = fn ($n, $extra = []) => route('store.commerce.' . $n, array_merge(['store_slug' => $slug], $extra));
        // The shop and the QR menu & catalogue are separate modules. Only offer the links
        // that this business can actually open (the tabs hide any link that is null).
        $shop = \App\Services\ModuleService::enabled($tenant, 'online_store');
        $cat  = \App\Services\ModuleService::enabled($tenant, 'onsite_catalogue');
        $o    = fn ($n) => $shop ? $r($n) : null;
        return [
            'home' => $o('home'), 'settings' => $o('settings'), 'settings_save' => $o('settings.save'),
            'catalogue' => $cat ? $r('catalogue') : null,
            'promotions' => $o('promotions'), 'products' => $r('products'), 'products_bulk' => $r('products.bulk'), 'products_photo' => $r('products.photo', ['product' => '__ID__']),
            'publish' => $o('publish'), 'unpublish' => $o('unpublish'), 'intake' => $o('intake'),
            'orders' => $o('orders'), 'alerts' => $o('alerts'),
            'public' => $shop && ($sl = DB::table('storefronts')->where('tenant_id', $tenant->id)->value('slug')) ? url('/shop/' . $sl) : null,
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
            'insights' => $this->insights($t->id),
            'sourcing' => app(\App\Services\Commerce\StockAvailability::class)->sourcingNeeds((int) $t->id),
            'recent' => DB::table('commerce_orders')->where('tenant_id', $t->id)->orderByDesc('created_at')->limit(5)
                ->get(['id', 'public_number', 'customer_name', 'status', 'total', 'currency_symbol', 'fulfilment', 'created_at'])
                ->map(fn ($o) => ['id' => $o->id, 'number' => $o->public_number, 'name' => $o->customer_name, 'status' => $o->status, 'total' => (float) $o->total,
                    'symbol' => $o->currency_symbol, 'fulfilment' => $o->fulfilment, 'at' => \App\Models\Commerce\CommerceOrder::localTime($o->created_at, $store->timezone ?: 'UTC'),
                    'url' => route('store.commerce.orders.show', ['store_slug' => $t->slug, 'id' => $o->id])])->values(),
            'store' => $this->forManager($store),
            'problems' => $problems,
            'can_publish' => empty($problems) && $store->status !== 'suspended',
            'counts' => ['pending' => (int) $counts->pending, 'active' => (int) $counts->active, 'completed' => (int) $counts->completed, 'total' => (int) $counts->total],
            'published_products' => DB::table('storefront_products')->where('storefront_id', $store->id)->where('is_published', 1)->count(),
            'public_url' => $url,
            'preview_url' => \Illuminate\Support\Facades\URL::temporarySignedRoute('commerce.store', now()->addHours(24), ['slug' => $store->slug, 'preview' => 1]),
            'edit_photos_url' => $this->editPhotosUrl($store),
            'qr_svg' => StorefrontPresenter::qrSvg($url),
            'urls' => $this->urls(),
        ]);
    }

    /** Read-only stage metrics over the last 30 days. Never writes or alters ledger totals. */
    private function insights(int $tenantId): array
    {
        $since = now('UTC')->subDays(30)->format('Y-m-d H:i:s');
        $base = fn () => DB::table('commerce_orders')->where('tenant_id', $tenantId)->where('created_at', '>=', $since);
        $o = $base()->selectRaw("COUNT(*) as placed,
            SUM(status IN ('rejected')) as rejected, SUM(status='expired') as expired, SUM(status='cancelled') as cancelled,
            SUM(status='completed') as completed,
            AVG(CASE WHEN confirmed_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, created_at, confirmed_at) END) as avg_accept,
            AVG(CASE WHEN completed_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, created_at, completed_at) END) as avg_complete,
            SUM(CASE WHEN status='completed' THEN total ELSE 0 END) as sales,
            SUM(CASE WHEN status='completed' THEN discount_total ELSE 0 END) as discounts")->first();
        $phones = $base()->select('customer_phone', DB::raw('COUNT(*) as n'))->groupBy('customer_phone')->get();
        $repeat = $phones->where('n', '>', 1)->count();
        return [
            'days' => 30, 'placed' => (int) $o->placed, 'completed' => (int) $o->completed,
            'rejected' => (int) $o->rejected, 'expired' => (int) $o->expired, 'cancelled' => (int) $o->cancelled,
            'avg_accept_minutes' => $o->avg_accept !== null ? (int) round($o->avg_accept) : null,
            'avg_complete_minutes' => $o->avg_complete !== null ? (int) round($o->avg_complete) : null,
            'sales' => round((float) $o->sales, 2), 'discounts' => round((float) $o->discounts, 2),
            'customers' => $phones->count(), 'repeat_customers' => $repeat,
        ];
    }

    public function settings()
    {
        $store = $this->store(true);
        $t = $this->tenant();
        $popularZones = ['Asia/Karachi', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Dhaka', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Australia/Sydney', 'UTC'];
        $allZones = \DateTimeZone::listIdentifiers();
        $zoneList = array_values(array_unique(array_merge($popularZones, $allZones)));
        $timezoneOptions = array_map(function ($z) {
            try {
                $offset = (new \DateTime('now', new \DateTimeZone($z)))->format('P');
            } catch (\Throwable) {
                $offset = '+00:00';
            }
            return ['value' => $z, 'label' => "{$z} (UTC{$offset})"];
        }, $zoneList);

        $effectiveTz = $store->timezone ?: ($t->timezone ?: 'Asia/Karachi');

        return Inertia::render('OnlineStore/Settings', [
            'store' => $this->forManager($store),
            'countries' => DB::table('commerce_countries')->where('is_active', 1)->orderBy('name')->get(['id', 'code', 'name']),
            'cities' => DB::table('commerce_cities')->where('is_active', 1)->orderBy('sort_order')->orderBy('name')->get(['id', 'country_id', 'name']),
            'warehouses' => DB::table('warehouses')->where('tenant_id', $t->id)->whereNull('deleted_at')->orderBy('name')->get(['id', 'name']),
            'days' => OpeningHours::DAYS,
            'timezones' => $timezoneOptions,
            'store_time_now' => now($effectiveTz)->format('l, g:i A (T)'),
            'hours_guidance' => OpeningHours::statusGuidance($store->opening_hours, $effectiveTz),
            'urls' => $this->urls(),
            'edit_photos_url' => $this->editPhotosUrl($store),
        ]);
    }

    /**
     * A signed link that opens the owner's storefront with "Add photo" on every photo spot.
     * The upload address for this store rides along in the session, so the public page knows where to post.
     */
    private function editPhotosUrl(Storefront $store): string
    {
        session(['commerce_edit.' . $store->slug => [
            'upload' => route('store.commerce.page-images.upload', ['store_slug' => $this->tenant()->slug]),
            'remove' => route('store.commerce.page-images.remove', ['store_slug' => $this->tenant()->slug]),
            'back' => route('store.commerce.settings', ['store_slug' => $this->tenant()->slug]),
        ]]);

        return \Illuminate\Support\Facades\URL::temporarySignedRoute('commerce.store', now()->addHours(24), ['slug' => $store->slug, 'preview' => 1, 'edit' => 1]);
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
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'opening_hours' => ['nullable', 'array'],
            'opening_hours.*' => ['nullable', 'array'],
            'opening_hours.*.open' => ['nullable', 'date_format:H:i'],
            'opening_hours.*.close' => ['nullable', 'date_format:H:i'],
            'opening_hours.*.break_start' => ['nullable', 'date_format:H:i'],
            'opening_hours.*.break_end' => ['nullable', 'date_format:H:i'],
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
            'show_images' => ['boolean'],
            'booking_enabled' => ['boolean'],
            'customer_mode' => ['required', Rule::in(['ordering', 'catalogue'])],
            'catalogue_theme' => ['required', Rule::in(['visual-grid', 'editorial-ledger', 'express-rail'])],
            'storefront_template' => ['nullable', Rule::in(['auto', 'restaurant', 'default'])],
            'brand_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'brand_color_2' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'announcement' => ['nullable', 'string', 'max:240'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'prep_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'orders_outside_hours' => ['boolean'],
            'orders_during_break' => ['boolean'],
            'delivery_zones' => ['nullable', 'array', 'max:20'],
            'delivery_zones.*.name' => ['required', 'string', 'max:60'],
            'delivery_zones.*.fee' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'delivery_zones.*.min_order' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
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
                $hours[$d] = ($h && ! empty($h['open']) && ! empty($h['close'])) ? [
                    'open' => $h['open'],
                    'close' => $h['close'],
                    'break_start' => (! empty($h['break_start']) && ! empty($h['break_end'])) ? $h['break_start'] : null,
                    'break_end' => (! empty($h['break_start']) && ! empty($h['break_end'])) ? $h['break_end'] : null,
                ] : null;
            }
        }

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('commerce/logos', 'public');
        }
        unset($data['logo'], $data['banner']);
        if ($request->hasFile('banner')) {
            $data['banner_path'] = $request->file('banner')->store('commerce/banners', 'public');
        }
        $zones = collect($data['delivery_zones'] ?? [])->map(fn ($z) => ['name' => trim($z['name']), 'fee' => round((float) $z['fee'], 2), 'min_order' => round((float) ($z['min_order'] ?? 0), 2)])
            ->filter(fn ($z) => $z['name'] !== '')->values();
        if ($zones->pluck('name')->map(fn ($n) => mb_strtolower($n))->duplicates()->isNotEmpty()) {
            return back()->withErrors(['delivery_zones' => 'Each delivery area needs a different name.']);
        }
        $data['delivery_zones'] = $zones->isEmpty() ? null : $zones->all();
        $data['prep_minutes'] = $data['prep_minutes'] ?? null;

        $oldSlug = $store->slug;
        // Shop location: a pin set by the owner wins; otherwise read it from the pasted map link; blank clears it.
        $pin = (isset($data['latitude'], $data['longitude']) && $data['latitude'] !== '' && $data['longitude'] !== '')
            ? \App\Support\MapCoords::valid((float) $data['latitude'], (float) $data['longitude'])
            : \App\Support\MapCoords::fromUrl($data['map_url'] ?? null);
        $data['latitude'] = $pin[0] ?? null;
        $data['longitude'] = $pin[1] ?? null;
        $store->fill(array_merge($data, [
            'pricing_percent' => $pct,
            'opening_hours' => $hours,
            'delivery_charge' => (float) ($data['delivery_charge'] ?? 0),
            'min_order_amount' => (float) ($data['min_order_amount'] ?? 0),
            'accept_deadline_minutes' => (int) ($data['accept_deadline_minutes'] ?? $store->accept_deadline_minutes),
            // currency / timezone come from the business or user selection
            'timezone' => ! empty($data['timezone']) ? $data['timezone'] : ($store->timezone ?: ($t->timezone ?: 'Asia/Karachi')),
            'currency_code' => $t->currency_code ?: $store->currency_code,
            'currency_symbol' => \App\Helpers\SettingsHelper::get('currency_symbol') ?? ($t->currency_symbol ?: $store->currency_symbol),
        ]))->save();
        if (! empty($data['timezone']) && $t->timezone !== $data['timezone']) {
            $t->update(['timezone' => $data['timezone']]);
        }
        if ($oldSlug && $oldSlug !== $store->slug) {
            // keep the old link alive (301) so printed QR codes and shared links do not break
            DB::table('storefront_slug_history')->updateOrInsert(['slug' => $oldSlug], ['storefront_id' => $store->id, 'created_at' => now()]);
            DB::table('storefront_slug_history')->where('slug', $store->slug)->delete();
        }

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
        $sorts = ['name' => 'p.name', 'sku' => 'p.sku', 'price' => 'p.price', 'published' => 'sp.is_published', 'backorder' => 'sp.sell_without_stock'];
        $sort = array_key_exists((string) $request->query('sort'), $sorts) ? (string) $request->query('sort') : 'name';
        $dir = $request->query('dir') === 'desc' ? 'desc' : 'asc';

        $query = DB::table('products as p')
            ->leftJoin('storefront_products as sp', function ($j) use ($store) {
                $j->on('sp.product_id', '=', 'p.id')->where('sp.storefront_id', '=', $store->id);
            })
            ->where('p.tenant_id', $t->id)->whereNull('p.deleted_at')
            ->when($q !== '', fn ($w) => $w->where(fn ($x) => $x->where('p.name', 'like', "%{$q}%")->orWhere('p.sku', 'like', "%{$q}%")))
            ->when($filter === 'published', fn ($w) => $w->where('sp.is_published', 1))
            ->when($filter === 'unpublished', fn ($w) => $w->where(fn ($x) => $x->whereNull('sp.is_published')->orWhere('sp.is_published', 0)))
            ->orderBy($sorts[$sort], $dir)->orderBy('p.name')->orderBy('p.id');

        $page = $query->select(['p.id', 'p.tenant_id', 'p.name', 'p.sku', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
            'p.is_active', 'p.type', 'p.track_stock', 'p.has_variants', 'p.is_weighted', 'p.track_serial', 'p.image_path', 'p.base_unit',
            'sp.id as listing_id', 'sp.is_featured', 'sp.option_group', 'sp.option_label', 'sp.image_path as listing_image',
            'sp.is_published', 'sp.override_price', 'sp.public_name', 'sp.public_description', 'sp.allow_below_cost', 'sp.sell_without_stock',
            'sp.offline_reserve_qty', 'sp.online_stock_limit', 'sp.show_online', 'sp.show_onsite', 'sp.public_name_ur', 'sp.diet_tags', 'sp.allergens'])
            ->paginate(25)->withQueryString();

        $pricing = app(OnlinePricing::class);
        $stock = app(StockAvailability::class);
        $rows = collect($page->items())->map(function ($p) use ($store, $pricing, $stock, $t) {
            $reason = ProductReadiness::reason($p);
            $price = $pricing->resolve($p, (object) ['override_price' => $p->override_price], $store);
            $physical = $store->warehouse_id ? round($stock->available($t->id, $p->id, $store->warehouse_id), 2) : null;
            // Inventory tracking off = made to order: there is no shelf count, reserve or sold-out state to show.
            $madeToOrder = ! ((bool) ($p->track_stock ?? true)) || ($physical !== null && $physical >= \App\Services\Commerce\StockAvailability::UNLIMITED);
            $offlineReserve = (float) ($p->offline_reserve_qty ?? 0);
            $onlineLimit = $p->online_stock_limit !== null ? (float) $p->online_stock_limit : null;
            $onlineAvailable = $physical !== null ? max(0.0, round($physical - $offlineReserve, 2)) : null;
            if ($onlineAvailable !== null && $onlineLimit !== null) {
                $onlineAvailable = min($onlineAvailable, $onlineLimit);
            }
            return [
                'id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'has_image' => (bool) ($p->listing_image ?: $p->image_path), 'image_url' => StorefrontPresenter::mediaUrl($p->listing_image ?: $p->image_path), 'featured' => (bool) $p->is_featured, 'has_custom_image' => (bool) $p->listing_image,
                'regular_price' => (float) $p->price, 'online_price' => $price['online_price'], 'rule' => $price['rule'],
                'below_cost' => $price['below_cost'], 'allow_below_cost' => (bool) $p->allow_below_cost,
                'sell_without_stock' => (bool) $p->sell_without_stock,
                'published' => (bool) $p->is_published, 'override_price' => $p->override_price !== null ? (float) $p->override_price : null,
                'show_online' => $p->show_online === null ? true : (bool) $p->show_online, 'show_onsite' => $p->show_onsite === null ? true : (bool) $p->show_onsite,
                'public_name_ur' => $p->public_name_ur,
                'diet_tags' => array_values(array_filter(explode(',', (string) $p->diet_tags))),
                'allergens' => $p->allergens,
                'public_name' => $p->public_name, 'public_description' => $p->public_description, 'option_group' => $p->option_group, 'option_label' => $p->option_label,
                'blocked_reason' => $reason,
                'physical_stock' => $madeToOrder ? null : $physical,
                'made_to_order' => $madeToOrder,
                'offline_reserve' => $madeToOrder ? 0 : $offlineReserve,
                'online_stock_limit' => $onlineLimit,
                'available' => $madeToOrder ? null : $onlineAvailable,
                'online_available' => $madeToOrder ? null : $onlineAvailable,
            ];
        });

        return Inertia::render('OnlineStore/Products', [
            'store' => $this->forManager($store),
            'alt_lang' => $store->altLang(),
            'products' => $rows,
            'pagination' => ['current' => $page->currentPage(), 'last' => $page->lastPage(), 'total' => $page->total(), 'per_page' => $page->perPage()],
            'stats' => [
                'total' => (int) DB::table('products')->where('tenant_id', $t->id)->whereNull('deleted_at')->count(),
                'published' => (int) DB::table('storefront_products')->where('storefront_id', $store->id)->where('is_published', 1)->count(),
                'backorder' => (int) DB::table('storefront_products')->where('storefront_id', $store->id)->where('sell_without_stock', 1)->count(),
            ],
            'filters' => ['q' => $q, 'filter' => $filter, 'sort' => $sort, 'dir' => $dir],
            'skipped' => session('skipped', []),
            'urls' => $this->urls(),
        ]);
    }

    public function productPhoto(Request $request, string $product)
    {
        $store = $this->store(true);
        $t = $this->tenant();
        abort_unless(DB::table('products')->where('tenant_id', $t->id)->where('id', $product)->whereNull('deleted_at')->exists(), 404);
        $request->validate(['photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'], 'remove' => ['boolean']]);
        $sp = DB::table('storefront_products')->where('storefront_id', $store->id)->where('product_id', $product)->first();
        $path = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('commerce/products', 'public');
        } elseif (! $request->boolean('remove')) {
            return back()->withErrors(['photo' => 'Choose a photo to upload.']);
        }
        $now = now();
        if ($sp) {
            DB::table('storefront_products')->where('id', $sp->id)->update(['image_path' => $path, 'updated_at' => $now]);
        } else {
            DB::table('storefront_products')->insert(['id' => (string) \Illuminate\Support\Str::uuid(), 'storefront_id' => $store->id, 'tenant_id' => $t->id,
                'product_id' => $product, 'is_published' => 0, 'image_path' => $path, 'created_at' => $now, 'updated_at' => $now]);
        }
        return back()->with('success', $path ? 'Photo saved.' : 'Online photo removed.');
    }

    public function bulkProducts(Request $request)
    {
        $store = $this->store(true);
        $t = $this->tenant();
        \Illuminate\Support\Facades\Cache::forget('sfcat:' . $store->id); // shoppers see the change at once
        $v = $request->validate([
            'select_all' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:191'],
            'filter' => ['nullable', 'string', 'max:20'],
            'ids' => ['required_without:select_all', 'array', 'min:1', 'max:200'],
            'ids.*' => ['string'],
            'action' => ['required', Rule::in(['publish', 'unpublish', 'update', 'feature', 'unfeature', 'set_reserve', 'channels'])],
            'override_price' => ['nullable', 'numeric', 'min:0.01', 'max:100000000'],
            'clear_override' => ['boolean'],
            'public_name' => ['nullable', 'string', 'max:191'],
            'public_description' => ['nullable', 'string', 'max:2000'],
            'public_name_ur' => ['nullable', 'string', 'max:190'],
            'diet_tags' => ['nullable', 'array', 'max:10'],
            'diet_tags.*' => ['string', Rule::in(['veg', 'vegan', 'halal', 'spicy', 'gluten_free', 'contains_nuts', 'contains_dairy'])],
            'allergens' => ['nullable', 'string', 'max:190'],
            'show_online' => ['nullable', 'boolean'],
            'show_onsite' => ['nullable', 'boolean'],
            'allow_below_cost' => ['nullable', 'boolean'],
            'sell_without_stock' => ['nullable', 'boolean'],
            'option_group' => ['nullable', 'string', 'max:60'],
            'option_label' => ['nullable', 'string', 'max:60'],
            'offline_reserve_qty' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'online_stock_limit' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
        ]);

        // "Select all N matching": resolve every id server-side from the current search/filter so thousands of
        // products can be published in one go without scrolling or paging through them.
        if (! empty($v['select_all'])) {
            $qq = trim((string) ($v['q'] ?? ''));
            $ff = $v['filter'] ?? 'all';
            $v['ids'] = DB::table('products as p')
                ->leftJoin('storefront_products as sp', fn ($j) => $j->on('sp.product_id', '=', 'p.id')->where('sp.storefront_id', '=', $store->id))
                ->where('p.tenant_id', $t->id)->whereNull('p.deleted_at')
                ->when($qq !== '', fn ($w) => $w->where(fn ($x) => $x->where('p.name', 'like', "%{$qq}%")->orWhere('p.sku', 'like', "%{$qq}%")))
                ->when($ff === 'published', fn ($w) => $w->where('sp.is_published', 1))
                ->when($ff === 'unpublished', fn ($w) => $w->where(fn ($x) => $x->whereNull('sp.is_published')->orWhere('sp.is_published', 0)))
                ->limit(50000)->pluck('p.id')->all();
            if (! $v['ids']) {
                return back()->with('success', '0 product(s) matched.');
            }
        }

        $products = DB::table('products')->where('tenant_id', $t->id)->whereNull('deleted_at')->whereIn('id', $v['ids'])->get()->keyBy('id');
        $pricing = app(OnlinePricing::class);
        $done = 0;
        $skipped = [];

        if ($v['action'] === 'set_reserve') {
            $reserveVal = array_key_exists('offline_reserve_qty', $v) && $v['offline_reserve_qty'] !== null && $v['offline_reserve_qty'] !== ''
                ? round((float) $v['offline_reserve_qty'], 4)
                : 0;
            $limitVal = array_key_exists('online_stock_limit', $v) && $v['online_stock_limit'] !== null && $v['online_stock_limit'] !== ''
                ? round((float) $v['online_stock_limit'], 4)
                : null;
            foreach ($v['ids'] as $id) {
                $sp = DB::table('storefront_products')->where('storefront_id', $store->id)->where('product_id', $id)->first();
                $now = now();
                if ($sp) {
                    DB::table('storefront_products')->where('id', $sp->id)->update([
                        'offline_reserve_qty' => $reserveVal,
                        'online_stock_limit' => $limitVal,
                        'updated_at' => $now,
                    ]);
                } else {
                    DB::table('storefront_products')->insert([
                        'id' => (string) Str::uuid(), 'storefront_id' => $store->id, 'tenant_id' => $t->id,
                        'product_id' => $id, 'is_published' => 0, 'offline_reserve_qty' => $reserveVal,
                        'online_stock_limit' => $limitVal, 'created_at' => $now, 'updated_at' => $now,
                    ]);
                }
                $done++;
            }
            return back()->with('success', "{$done} product(s) stock reserve updated.");
        }

        if ($v['action'] === 'channels') {
            // Where each dish may appear: the online store, the QR menu, or both. A dish hidden from both stays published
            // (and can come back with one tap); it just is not shown anywhere.
            $patch = array_filter([
                'show_online' => array_key_exists('show_online', $v) && $v['show_online'] !== null ? (int) (bool) $v['show_online'] : null,
                'show_onsite' => array_key_exists('show_onsite', $v) && $v['show_onsite'] !== null ? (int) (bool) $v['show_onsite'] : null,
                'sell_without_stock' => array_key_exists('sell_without_stock', $v) && $v['sell_without_stock'] !== null ? (int) (bool) $v['sell_without_stock'] : null,
            ], fn ($x) => $x !== null);
            foreach ($v['ids'] as $id) {
                if (! $products->has($id) || ! $patch) {
                    continue;
                }
                $sp = DB::table('storefront_products')->where('storefront_id', $store->id)->where('product_id', $id)->first();
                $now = now();
                if ($sp) {
                    DB::table('storefront_products')->where('id', $sp->id)->update($patch + ['updated_at' => $now]);
                } else {
                    DB::table('storefront_products')->insert($patch + ['id' => (string) Str::uuid(), 'storefront_id' => $store->id, 'tenant_id' => $t->id,
                        'product_id' => $id, 'is_published' => 0, 'created_at' => $now, 'updated_at' => $now]);
                }
                $done++;
            }
            return back()->with('success', "{$done} product(s) updated.");
        }

        foreach ($v['ids'] as $id) {
            $p = $products->get($id);
            if (! $p) {
                $skipped[] = ['id' => $id, 'reason' => 'Product not found.'];
                continue;
            }
            $sp = DB::table('storefront_products')->where('storefront_id', $store->id)->where('product_id', $id)->first();
            $now = now();

            if (in_array($v['action'], ['feature', 'unfeature'], true)) {
                if ($v['action'] === 'feature' && DB::table('storefront_products')->where('storefront_id', $store->id)->where('is_featured', 1)->count() >= 12) {
                    $skipped[] = ['id' => $id, 'reason' => 'You can feature up to 12 products.'];
                    continue;
                }
                $flag = $v['action'] === 'feature' ? 1 : 0;
                if ($sp) {
                    DB::table('storefront_products')->where('id', $sp->id)->update(['is_featured' => $flag, 'updated_at' => $now]);
                } else {
                    DB::table('storefront_products')->insert(['id' => (string) Str::uuid(), 'storefront_id' => $store->id, 'tenant_id' => $t->id, 'product_id' => $id,
                        'is_published' => 0, 'is_featured' => $flag, 'created_at' => $now, 'updated_at' => $now]);
                }
                $done++;
                continue;
            }

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
                if (array_key_exists('diet_tags', $v)) {
                    $fields['diet_tags'] = implode(',', array_unique($v['diet_tags'] ?? [])) ?: null;
                }
                if (array_key_exists('allergens', $v)) {
                    $fields['allergens'] = trim((string) $v['allergens']) === '' ? null : trim($v['allergens']);
                }
                foreach (['public_name', 'public_name_ur', 'public_description', 'option_group', 'option_label'] as $f) {
                    if (array_key_exists($f, $v)) {
                        $fields[$f] = trim((string) $v[$f]) === '' ? null : trim($v[$f]);
                    }
                }
                if (array_key_exists('option_group', $fields) && $fields['option_group'] === null) {
                    $fields['option_label'] = null;
                }
                if (! empty($fields['option_group']) && empty($fields['option_label'] ?? ($sp->option_label ?? null))) {
                    $skipped[] = ['id' => $id, 'name' => $p->name, 'reason' => 'Give this option a label (for example "Large" or "Red").'];
                    continue;
                }
                if (array_key_exists('offline_reserve_qty', $v)) {
                    $fields['offline_reserve_qty'] = ($v['offline_reserve_qty'] === null || $v['offline_reserve_qty'] === '')
                        ? 0
                        : round((float) $v['offline_reserve_qty'], 4);
                }
                if (array_key_exists('online_stock_limit', $v)) {
                    $fields['online_stock_limit'] = ($v['online_stock_limit'] === null || $v['online_stock_limit'] === '')
                        ? null
                        : round((float) $v['online_stock_limit'], 4);
                }
            }
            if (array_key_exists('allow_below_cost', $v) && $v['allow_below_cost'] !== null) {
                $fields['allow_below_cost'] = (bool) $v['allow_below_cost'];
            }
            if (array_key_exists('sell_without_stock', $v) && $v['sell_without_stock'] !== null) {
                $fields['sell_without_stock'] = (int) (bool) $v['sell_without_stock'];
            }
            foreach (['show_online', 'show_onsite'] as $ch) {
                if (count($v['ids']) === 1 && array_key_exists($ch, $v) && $v[$ch] !== null) {
                    $fields[$ch] = (int) (bool) $v[$ch];
                }
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
        $dynCurrency = \App\Helpers\SettingsHelper::get('currency_symbol') ?? ($s->currency_symbol ?: ($this->tenant()->currency_symbol ?: 'Rs'));
        return [
            'id' => $s->id, 'slug' => $s->slug, 'display_name' => $s->display_name, 'description' => $s->description,
            'country_id' => $s->country_id, 'city_id' => $s->city_id, 'address_line' => $s->address_line, 'map_url' => $s->map_url, 'latitude' => $s->latitude, 'longitude' => $s->longitude,
            'logo_url' => StorefrontPresenter::mediaUrl($s->logo_path), 'phone' => $s->phone, 'email' => $s->email,
            'opening_hours' => $s->opening_hours,
            'timezone' => $s->timezone ?: ($this->tenant()->timezone ?: 'Asia/Karachi'),
            'hours_guidance' => OpeningHours::statusGuidance($s->opening_hours, $s->timezone ?: ($this->tenant()->timezone ?: 'Asia/Karachi')),
            'currency_symbol' => $dynCurrency,
            'supports_pickup' => $s->supports_pickup, 'supports_delivery' => $s->supports_delivery,
            'delivery_charge' => $s->delivery_charge, 'delivery_note' => $s->delivery_note, 'min_order_amount' => $s->min_order_amount,
            'warehouse_id' => $s->warehouse_id, 'pricing_mode' => $s->pricing_mode, 'pricing_percent' => $s->pricing_percent,
            'accept_cod' => $s->accept_cod, 'accept_pickup_payment' => $s->accept_pickup_payment,
            'accept_bank_transfer' => $s->accept_bank_transfer, 'bank_instructions' => $s->bank_instructions,
            'accept_deadline_minutes' => $s->accept_deadline_minutes, 'show_images' => (bool) $s->show_images,
            'booking_enabled' => (bool) $s->booking_enabled, 'booking_url' => url('/book/' . $s->slug),
            'services_on' => \App\Services\ModuleService::enabled($this->tenant(), 'services'),
            'customer_mode' => $s->customer_mode ?: 'ordering', 'catalogue_theme' => $s->catalogue_theme ?: 'visual-grid',
            'brand_color' => $s->getAttributes()['brand_color'] ?? null,
            'brand_color_2' => $s->getAttributes()['brand_color_2'] ?? null,
            'storefront_template' => ($s->getAttributes()['storefront_template'] ?? null) ?: 'auto', 'storefront_url' => url('/shop/' . $s->slug), 'runs_foh' => \App\Services\ModuleService::runsFrontOfHouse($this->tenant()),
            'onsite_ordering_enabled' => (bool) $s->onsite_ordering_enabled, 'counter_qr_enabled' => (bool) $s->counter_qr_enabled,
            'announcement' => $s->announcement, 'banner_url' => StorefrontPresenter::mediaUrl($s->banner_path), 'prep_minutes' => $s->prep_minutes,
            'delivery_zones' => collect($s->delivery_zones ?? [])->values(),
            'intake_paused' => $s->intake_paused, 'orders_outside_hours' => (bool) $s->orders_outside_hours, 'status' => $s->status, 'suspended_reason' => $s->suspended_reason,
        ];
    }
}
