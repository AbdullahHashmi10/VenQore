<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
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
                'url' => $table->customer_order_token
                    ? $lanBase . '/catalogue/' . $store->slug . '/table/' . $table->customer_order_token
                    : null,
                'qr_url' => route('store.tables.plan.table.qr', ['store_slug' => $tenant->slug, 'position' => $table->id]),
            ])->values();

        $generalUrl = $lanBase . '/catalogue/' . $store->slug;

        return Inertia::render('OnsiteCatalogue/Setup', [
            'catalogue' => [
                'enabled' => (bool) $store->onsite_ordering_enabled,
                'theme' => $store->onsite_catalogue_theme ?: 'visual-grid',
                'show_images' => (bool) $store->onsite_show_images,
                'name' => $store->onsite_name ?: $store->display_name,
                'tagline' => $store->onsite_tagline ?: '',
                'logo_url' => StorefrontPresenter::mediaUrl($store->onsite_logo_path ?: $store->logo_path),
                'banner_url' => StorefrontPresenter::mediaUrl($store->onsite_banner_path ?: $store->banner_path),
                'lan_url' => $store->onsite_lan_url ?: rtrim((string) config('app.customer_url', config('app.url')), '/'),
                'general_url' => $generalUrl,
                'general_qr_url' => route('store.commerce.catalogue.qr', ['store_slug' => $tenant->slug]),
                'preview_url' => url('/catalogue/' . $store->slug),
            ],
            'tables' => $tables,
            'floor_plan_url' => route('store.tables.plan', ['store_slug' => $tenant->slug]),
            'save_url' => route('store.commerce.catalogue.save', ['store_slug' => $tenant->slug]),
            'tabs' => [
                'home' => route('store.commerce.home', ['store_slug' => $tenant->slug]),
                'orders' => route('store.commerce.orders', ['store_slug' => $tenant->slug]),
                'products' => route('store.commerce.products', ['store_slug' => $tenant->slug]),
                'promotions' => route('store.commerce.promotions', ['store_slug' => $tenant->slug]),
                'settings' => route('store.commerce.settings', ['store_slug' => $tenant->slug]),
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
            'name' => ['required', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:240'],
            'lan_url' => ['required', 'url:http,https', 'max:255'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
        ]);
        $store->fill([
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
}
