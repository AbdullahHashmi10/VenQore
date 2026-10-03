<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Storefront;
use App\Services\Commerce\Promotions;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

/** Merchant dated offers and coupon codes. Windows are entered in the store timezone and stored in UTC. */
class PromotionsController extends Controller
{
    private function store(): Storefront
    {
        $s = Storefront::where('tenant_id', app('current.tenant')->id)->first();
        abort_unless($s, 404);
        return $s;
    }

    private function toUtc(?string $local, string $tz): ?string
    {
        return $local ? Carbon::parse($local, $tz)->setTimezone('UTC')->format('Y-m-d H:i:s') : null;
    }

    private function toLocal(?string $utc, string $tz): ?string
    {
        return $utc ? Carbon::parse($utc, 'UTC')->setTimezone($tz)->format('Y-m-d\TH:i') : null;
    }

    public function index()
    {
        $store = $this->store();
        $slug = app('current.tenant')->slug;
        $r = fn ($n) => route('store.commerce.' . $n, ['store_slug' => $slug]);
        $now = now('UTC')->format('Y-m-d H:i:s');
        $cats = DB::table('categories')->where('tenant_id', $store->tenant_id)->whereNull('deleted_at')->orderBy('name')->get(['id', 'name']);
        $catNames = $cats->pluck('name', 'id');
        $rows = DB::table('commerce_promotions')->where('storefront_id', $store->id)->orderByDesc('created_at')->get()->map(function ($p) use ($now, $store, $catNames) {
            $state = ! $p->is_active ? 'off' : ($p->starts_at && $p->starts_at > $now ? 'scheduled' : ($p->ends_at && $p->ends_at <= $now ? 'ended' : ($p->code && $p->max_uses !== null && $p->uses >= $p->max_uses ? 'used_up' : 'live')));
            return ['id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'kind' => $p->kind ?? 'percent', 'amount' => $p->amount !== null ? (float) $p->amount : null, 'percent' => (float) $p->percent, 'scope' => $p->scope,
                'category_id' => $p->category_id, 'category_name' => $catNames[$p->category_id] ?? null, 'min_order' => (float) $p->min_order,
                'max_uses' => $p->max_uses, 'uses' => $p->uses, 'is_active' => (bool) $p->is_active, 'state' => $state,
                'starts_at' => $this->toLocal($p->starts_at, $store->timezone), 'ends_at' => $this->toLocal($p->ends_at, $store->timezone)];
        });
        return Inertia::render('OnlineStore/Promotions', [
            'store' => ['id' => $store->id, 'slug' => $store->slug, 'display_name' => $store->display_name, 'status' => $store->status, 'timezone' => $store->timezone, 'currency_symbol' => $store->currency_symbol],
            'promotions' => $rows, 'categories' => $cats,
            'urls' => ['home' => $r('home'), 'settings' => $r('settings'), 'products' => $r('products'), 'orders' => $r('orders'), 'alerts' => $r('alerts'),
                'promotions' => $r('promotions'), 'save' => $r('promotions.save'), 'toggle' => route('store.commerce.promotions.toggle', ['store_slug' => $slug, 'id' => '__ID__']),
                'destroy' => route('store.commerce.promotions.destroy', ['store_slug' => $slug, 'id' => '__ID__'])],
        ]);
    }

    public function save(Request $request)
    {
        $store = $this->store();
        $v = $request->validate([
            'id' => ['nullable', 'string', 'max:36'],
            'name' => ['required', 'string', 'max:120'],
            'code' => ['nullable', 'string', 'max:40'],
            'kind' => ['nullable', 'in:percent,amount'],
            'percent' => ['required_unless:kind,amount', 'nullable', 'numeric', 'min:1', 'max:90'],
            'amount' => ['required_if:kind,amount', 'nullable', 'numeric', 'min:1', 'max:100000000'],
            'scope' => ['required', 'in:store,category'],
            'category_id' => ['nullable', 'string', 'max:36'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'min_order' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'max_uses' => ['nullable', 'integer', 'min:1', 'max:1000000'],
        ]);
        if ($v['scope'] === 'category') {
            if (empty($v['category_id']) || ! DB::table('categories')->where('id', $v['category_id'])->where('tenant_id', $store->tenant_id)->exists()) {
                return back()->withErrors(['category_id' => 'Choose one of your categories.']);
            }
        } else {
            $v['category_id'] = null;
        }
        $starts = $this->toUtc($v['starts_at'] ?? null, $store->timezone);
        $ends = $this->toUtc($v['ends_at'] ?? null, $store->timezone);
        if ($starts && $ends && $ends <= $starts) {
            return back()->withErrors(['ends_at' => 'The end must be after the start.']);
        }
        $code = Promotions::normalizeCode($v['code'] ?? null);
        if ($code && DB::table('commerce_promotions')->where('storefront_id', $store->id)->where('code', $code)->when(! empty($v['id']), fn ($q) => $q->where('id', '!=', $v['id']))->exists()) {
            return back()->withErrors(['code' => 'That code is already used by another offer.']);
        }
        $kind = ($v['kind'] ?? 'percent') === 'amount' ? 'amount' : 'percent';
        $row = ['name' => $v['name'], 'code' => $code, 'kind' => $kind, 'amount' => $kind === 'amount' ? round((float) $v['amount'], 2) : null, 'percent' => $kind === 'amount' ? 0 : round((float) $v['percent'], 2), 'scope' => $v['scope'], 'category_id' => $v['category_id'],
            'starts_at' => $starts, 'ends_at' => $ends, 'min_order' => round((float) ($v['min_order'] ?? 0), 2), 'max_uses' => $code ? ($v['max_uses'] ?? null) : null, 'updated_at' => now()];
        if (! empty($v['id'])) {
            $n = DB::table('commerce_promotions')->where('id', $v['id'])->where('storefront_id', $store->id)->where('tenant_id', $store->tenant_id)->update($row);
            abort_unless($n !== null, 404);
        } else {
            DB::table('commerce_promotions')->insert($row + ['id' => (string) Str::uuid(), 'tenant_id' => $store->tenant_id, 'storefront_id' => $store->id, 'is_active' => 1, 'created_at' => now()]);
        }
        return back()->with('success', 'Offer saved. It applies to new orders only; existing orders keep their prices.');
    }

    public function toggle(string $id)
    {
        $store = $this->store();
        $p = DB::table('commerce_promotions')->where('id', $id)->where('storefront_id', $store->id)->first();
        abort_unless($p, 404);
        DB::table('commerce_promotions')->where('id', $id)->update(['is_active' => $p->is_active ? 0 : 1, 'updated_at' => now()]);
        return back();
    }

    public function destroy(string $id)
    {
        $store = $this->store();
        $n = DB::table('commerce_promotions')->where('id', $id)->where('storefront_id', $store->id)->delete();
        abort_unless($n, 404);
        return back()->with('success', 'Offer deleted. Past orders keep their snapshot.');
    }
}
