<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
use App\Models\Position;
use App\Services\Commerce\StorefrontPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OnsiteCatalogueController extends Controller
{
    private function store(): Storefront
    {
        $tenant = app('current.tenant');
        $existing = Storefront::where('tenant_id', $tenant->id)->first();
        if ($existing) return $existing;
        $slug = Str::slug($tenant->slug ?: $tenant->name) ?: 'store-' . $tenant->id;
        if (Storefront::where('slug', $slug)->exists()) $slug .= '-' . $tenant->id;
        return Storefront::create([
            'tenant_id' => $tenant->id,
            'slug' => Str::limit($slug, 60, ''),
            'display_name' => $tenant->name,
            'timezone' => $tenant->timezone ?: 'UTC',
            'currency_code' => $tenant->currency_code ?: 'PKR',
            'currency_symbol' => $tenant->currency_symbol ?: 'Rs',
            'warehouse_id' => DB::table('warehouses')->where('tenant_id', $tenant->id)->whereNull('deleted_at')->orderByDesc('is_default')->value('id'),
            'status' => 'draft',
        ])->refresh();
    }

    public function setup()
    {
        $tenant = app('current.tenant');
        $store = $this->store();
        $lanBase = rtrim($store->onsite_lan_url ?: (string) config('app.customer_url', config('app.url')), '/');
        $tables = DB::table('positions')->where('tenant_id', $tenant->id)
            ->orderBy('zone')->orderBy('sort_order')->get(['id', 'zone', 'code', 'label', 'customer_order_token', 'customer_ordering_enabled'])
            ->map(fn ($table) => [
                'id' => $table->id,
                'zone' => $table->zone,
                'code' => $table->code,
                'label' => $table->label ?: $table->code,
                'enabled' => (bool) $table->customer_ordering_enabled,
                'has_token' => (bool) $table->customer_order_token,
                'url' => $table->customer_order_token
                    ? $lanBase . '/catalogue/' . $store->slug . '/table/' . $table->customer_order_token
                    : null,
                'qr_url' => route('store.tables.plan.table.qr', ['store_slug' => $tenant->slug, 'position' => $table->id]),
            ])->values();

        $generalUrl = $lanBase . '/catalogue/' . $store->slug;
        $shopOn = \App\Services\ModuleService::enabled($tenant, 'online_store');

        return Inertia::render('OnsiteCatalogue/Setup', [
            'catalogue' => [
                'enabled' => (bool) $store->onsite_ordering_enabled,
                'theme' => $store->onsite_catalogue_theme ?: 'visual-grid',
                'show_images' => (bool) $store->onsite_show_images,
                'alt_lang' => $store->getAttributes()['onsite_alt_lang'] ?? '',
                'paused' => (bool) $store->onsite_paused,
                'require_seated' => (bool) $store->onsite_require_seated,
                'auto_hours' => (bool) $store->onsite_auto_hours,
                'has_hours' => ! empty($store->opening_hours),
                'name' => $store->onsite_name ?: $store->display_name,
                'tagline' => $store->onsite_tagline ?: '',
                'logo_url' => StorefrontPresenter::mediaUrl($store->onsite_logo_path ?: $store->logo_path),
                'banner_url' => StorefrontPresenter::mediaUrl($store->onsite_banner_path ?: $store->banner_path),
                'lan_url' => $store->onsite_lan_url ?: rtrim((string) config('app.customer_url', config('app.url')), '/'),
                'general_url' => $generalUrl,
                'general_qr_url' => route('store.commerce.catalogue.qr', ['store_slug' => $tenant->slug]),
                'preview_url' => url('/catalogue/' . $store->slug),
            ],
            'languages' => collect(Storefront::ALT_LANGUAGES)->map(fn ($v, $k) => ['code' => $k, 'label' => $v[0]])->values(),
            'tables' => $tables,
            'stats' => $this->stats($store),
            'urls' => [
                'table_toggle' => str_replace('987654321', '__ID__', route('store.commerce.catalogue.table.toggle', ['store_slug' => $tenant->slug, 'position' => 987654321])),
                'table_regenerate' => str_replace('987654321', '__ID__', route('store.commerce.catalogue.table.regenerate', ['store_slug' => $tenant->slug, 'position' => 987654321])),
                'cards' => route('store.commerce.catalogue.cards', ['store_slug' => $tenant->slug]),
            ],
            'floor_plan_url' => route('store.tables.plan', ['store_slug' => $tenant->slug]),
            'save_url' => route('store.commerce.catalogue.save', ['store_slug' => $tenant->slug]),
            // The catalogue works on its own. The shop's tabs only appear when the business
            // has also switched the Online Store module on.
            'tabs' => ($shopOn ? [
                'home' => route('store.commerce.home', ['store_slug' => $tenant->slug]),
                'orders' => route('store.commerce.orders', ['store_slug' => $tenant->slug]),
                'promotions' => route('store.commerce.promotions', ['store_slug' => $tenant->slug]),
                'settings' => route('store.commerce.settings', ['store_slug' => $tenant->slug]),
            ] : []) + [
                'products' => route('store.commerce.products', ['store_slug' => $tenant->slug]),
                'catalogue' => route('store.commerce.catalogue', ['store_slug' => $tenant->slug]),
                'public' => $generalUrl,
            ],
            'store_status' => $store->status,
        ]);
    }

    public function save(Request $request)
    {
        $store = $this->store();
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'theme' => ['required', Rule::in(['visual-grid', 'editorial-ledger', 'express-rail'])],
            'show_images' => ['required', 'boolean'],
            'alt_lang' => ['nullable', 'string', Rule::in(array_keys(Storefront::ALT_LANGUAGES))],
            'paused' => ['sometimes', 'boolean'],
            'require_seated' => ['sometimes', 'boolean'],
            'auto_hours' => ['sometimes', 'boolean'],
            'name' => ['required', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:240'],
            'lan_url' => ['required', 'url:http,https', 'max:255'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
        ]);
        // "Close outside opening hours" needs hours to close by; otherwise it would silently do nothing.
        if (! empty($data['auto_hours']) && empty($store->opening_hours)) {
            return back()->withErrors(['auto_hours' => 'Add your opening hours in Online Store settings first, then this switch can use them.']);
        }
        $store->fill([
            'onsite_alt_lang' => ($data['alt_lang'] ?? null) ?: null,
            'onsite_paused' => (bool) ($data['paused'] ?? false),
            'onsite_require_seated' => (bool) ($data['require_seated'] ?? false),
            'onsite_auto_hours' => (bool) ($data['auto_hours'] ?? false),
            'onsite_ordering_enabled' => (bool) $data['enabled'],
            'counter_qr_enabled' => (bool) $data['enabled'],
            'onsite_catalogue_theme' => $data['theme'],
            'onsite_show_images' => (bool) $data['show_images'],
            'onsite_name' => trim($data['name']),
            'onsite_tagline' => trim((string) ($data['tagline'] ?? '')) ?: null,
            'onsite_lan_url' => rtrim($data['lan_url'], '/'),
        ]);
        if ($request->hasFile('logo')) $store->onsite_logo_path = $request->file('logo')->store('onsite/logos', 'public');
        if ($request->hasFile('banner')) $store->onsite_banner_path = $request->file('banner')->store('onsite/banners', 'public');
        $store->save();
        return back()->with('success', 'Onsite catalogue saved.');
    }

    public function qr()
    {
        $store = $this->store();
        $base = rtrim($store->onsite_lan_url ?: (string) config('app.customer_url', config('app.url')), '/');
        $svg = StorefrontPresenter::qrSvg($base . '/catalogue/' . $store->slug);
        return response($svg, 200, ['Content-Type' => 'image/svg+xml', 'Content-Disposition' => 'inline; filename="onsite-catalogue-qr.svg"', 'Cache-Control' => 'no-store, private']);
    }

    /** Orders guests have sent through the QR menu (so the owner can see it is being used). */
    private function stats(Storefront $store): array
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('onsite_order_requests')) {
            return ['today' => 0, 'week' => 0];
        }
        $q = DB::table('onsite_order_requests')->where('storefront_id', $store->id);

        return [
            'today' => (clone $q)->where('created_at', '>=', now()->startOfDay())->count(),
            'week' => (clone $q)->where('created_at', '>=', now()->subDays(7))->count(),
        ];
    }

    /** Switch one table's QR ordering on or off without touching its printed code. */
    public function tableToggle(Request $request, string $store_slug, int $position)
    {
        $tenant = app('current.tenant');
        $table = Position::where('tenant_id', $tenant->id)->findOrFail($position);
        $table->update(['customer_ordering_enabled' => ! $table->customer_ordering_enabled]);

        return back()->with('success', ($table->label ?: $table->code) . ($table->customer_ordering_enabled ? ': QR ordering is on.' : ': QR ordering is off.'));
    }

    /** A new code for one table (the old printed code stops working). Used if a code was photographed or leaked. */
    public function tableRegenerate(Request $request, string $store_slug, int $position)
    {
        $tenant = app('current.tenant');
        $table = Position::where('tenant_id', $tenant->id)->findOrFail($position);
        $table->update(['customer_order_token' => Str::random(40)]);

        return back()->with('success', ($table->label ?: $table->code) . ': new QR code created. Reprint it and remove the old one.');
    }

    /** One printable A4 page: a card per table (name + QR) that staff cut out and put on the tables. */
    public function cards()
    {
        $tenant = app('current.tenant');
        $store = $this->store();
        $base = rtrim($store->onsite_lan_url ?: (string) config('app.customer_url', config('app.url')), '/');
        $name = e($store->onsite_name ?: $store->display_name);
        $cards = [];
        $rows = Position::where('tenant_id', $tenant->id)->orderBy('zone')->orderBy('sort_order')->get();
        foreach ($rows as $t) {
            if (! $t->customer_order_token) {
                $t->update(['customer_order_token' => Str::random(40)]);
            }
            $svg = StorefrontPresenter::qrSvg($base . '/catalogue/' . $store->slug . '/table/' . $t->customer_order_token);
            $cards[] = '<div class="c"><div class="n">' . $name . '</div><div class="q">' . $svg . '</div><div class="t">' . e($t->label ?: $t->code) . '</div><div class="h">Scan to see the menu and order</div></div>';
        }
        if (! $cards) {
            $svg = StorefrontPresenter::qrSvg($base . '/catalogue/' . $store->slug);
            $cards[] = '<div class="c"><div class="n">' . $name . '</div><div class="q">' . $svg . '</div><div class="t">Order here</div><div class="h">Scan to see the menu and order</div></div>';
        }
        $html = '<!doctype html><html><head><meta charset="utf-8"><title>QR table cards</title><style>'
            . '@page{size:A4;margin:10mm}body{margin:0;font-family:system-ui,sans-serif}.g{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}'
            . '.c{border:1.5px dashed #888;border-radius:6mm;padding:8mm;text-align:center;break-inside:avoid}.n{font-weight:800;font-size:15pt}'
            . '.q svg{width:55mm;height:55mm;margin:5mm 0}.t{font-weight:900;font-size:26pt}.h{font-size:10pt;color:#444;margin-top:2mm}'
            . '@media screen{body{padding:16px;background:#eee}.c{background:#fff}}</style></head><body onload="setTimeout(function(){window.print()},300)"><div class="g">'
            . implode('', $cards) . '</div></body></html>';

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'no-store, private']);
    }
}
