<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Warehouse;
use App\Support\FohSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Front of house: one full-screen page for tables, takeaway and delivery.
 * FOH plan 2.3 / Phase 2.
 *
 * The page ships its first floor state in the response (no empty first paint)
 * and then polls `store.tables.state`, the same endpoint the old floor used.
 */
class FohController extends Controller
{
    /** Settings the register reads must never carry secrets (same list as PosController). */
    private const SECRET_SETTINGS = [
        'admin_passcode', 'openai_api_key', 'anthropic_api_key', 'gemini_api_key',
        'stripe_secret_key', 'stripe_webhook_secret', 'woocommerce_consumer_key',
        'woocommerce_consumer_secret', 'whatsapp_access_token', 'fbr_auth_token',
        'sso_certificate',
    ];

    public function index(Request $request, ?string $tab = null): Response|RedirectResponse
    {
        $tenant = app('current.tenant');
        $foh    = FohSettings::all((int) $tenant->id);

        if (!FohSettings::available((int) $tenant->id)) {
            // Nothing is switched on: send the owner to the settings page, anyone else back to the till.
            if ($this->canManage($request)) {
                return redirect()->route('store.foh.settings', ['store_slug' => $tenant->slug])
                    ->with('info', 'Turn on at least one of tables, takeaway or delivery to open FOH.');
            }
            return redirect()->route('store.pos', ['store_slug' => $tenant->slug]);
        }

        $tabs = FohSettings::enabledTabs((int) $tenant->id);

        // A tab the store has switched off is not an error, it is a redirect to the first one that is on.
        $want = $tab ?: ($foh['default_tab'] !== 'auto' ? $foh['default_tab'] : null);

        // A link to one order (?order=ID) opens on the tab that order lives in.
        if (!$tab && $request->filled('order')) {
            $occ = \App\Models\Occupancy::where('tenant_id', $tenant->id)->find((int) $request->input('order'));
            if ($occ) {
                $type = ($occ->session_data['order_type'] ?? null) ?: ($occ->position_id ? 'dine_in' : 'takeaway');
                $want = $type === 'dine_in' ? 'tables' : $type;
            }
        }
        if (!$want || !in_array($want, $tabs, true)) {
            $want = in_array('tables', $tabs, true) ? 'tables' : (in_array('takeaway', $tabs, true) ? 'takeaway' : $tabs[0]);
        }
        if ($tab && $tab !== $want) {
            return redirect()->route('store.foh', array_filter([
                'store_slug' => $tenant->slug, 'tab' => $want, 'order' => $request->input('order'),
            ]));
        }

        // Same payload `/tables/state` returns, so the first paint and every poll agree.
        $floor = app(TableServiceController::class)->state($request)->getData(true);

        $bankAccounts = BankAccount::where(function ($q) {
                $q->whereNull('account_type')->orWhere('account_type', '!=', 'cash');
            })
            ->where(function ($q) {
                $q->whereNull('type')->orWhere('type', '!=', 'cash');
            })
            ->get(['id', 'name', 'account_number as code', 'account_number']);

        return Inertia::render('Foh/Index', [
            'tab'          => $want,
            'tabs'         => $tabs,
            'orderId'      => $request->filled('order') ? (int) $request->input('order') : null,
            'floorState'   => $floor,
            'fohSettings'  => $foh,
            'caps'         => $this->caps($request),
            'bankAccounts' => $bankAccounts,
            'warehouses'   => Warehouse::all(['id', 'name', 'is_default']),
            'settings'     => Setting::all()->pluck('value', 'key')->except(self::SECRET_SETTINGS),
        ]);
    }

    public function settings(Request $request): Response
    {
        $tenant = app('current.tenant');
        $s = Setting::where('tenant_id', $tenant->id)->pluck('value', 'key');

        return Inertia::render('Foh/Settings', [
            'storeSlug'   => $tenant->slug,
            'fohSettings' => FohSettings::all((int) $tenant->id),
            'extra'       => [
                'service_charge_percent' => (float) ($s['service_charge_percent'] ?? 0),
                'prepares_orders'        => (string) ($s['prepares_orders'] ?? '1'),
                'kds_auto_print'         => (string) ($s['kds_auto_print'] ?? '0'),
                'kot_enabled'            => (string) ($s['kot_enabled'] ?? '1'),
                'kot_show_prices'        => (string) ($s['kot_show_prices'] ?? '0'),
                'pos_sound_alert'        => (string) ($s['pos_sound_alert'] ?? '1'),
            ],
            'categories'  => Category::withCount('products')->has('products')->orderBy('name')->get(['id', 'name']),
            'untrackedCount' => Product::where('track_stock', false)->count(),
        ]);
    }

    public function saveSettings(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'tables'             => 'nullable|boolean',
            'takeaway'           => 'nullable|boolean',
            'delivery'           => 'nullable|boolean',
            'stock'              => 'nullable|string|in:per_item,never',
            'takeaway_flow'      => 'nullable|string|in:pay_first,fire_first',
            'default_tab'        => 'nullable|string|in:auto,overview,tables,takeaway,delivery',
            'takeaway_collect'   => 'nullable|boolean',
            'takeaway_autoclose' => 'nullable|boolean',
            'takeaway_name_required' => 'nullable|boolean',
            'delivery_fee'       => 'nullable|numeric|min:0|max:100000',
            'delivery_eta'       => 'nullable|integer|min:1|max:600',
            'delivery_grace'     => 'nullable|integer|min:0|max:240',
            'default_covers'     => 'nullable|integer|min:1|max:99',

            // Existing keys that now live on the FOH settings page.
            'service_charge_percent' => 'nullable|numeric|min:0|max:100',
            'prepares_orders'        => 'nullable|in:0,1',
            'kds_auto_print'         => 'nullable|in:0,1',
            'kot_enabled'            => 'nullable|in:0,1',
            'kot_show_prices'        => 'nullable|in:0,1',
            'pos_sound_alert'        => 'nullable|in:0,1',
        ]);

        $foh = array_intersect_key($data, array_flip([
            'tables', 'takeaway', 'delivery', 'stock', 'takeaway_flow', 'default_tab', 'takeaway_collect', 'takeaway_autoclose',
            'takeaway_name_required', 'delivery_fee', 'delivery_eta', 'delivery_grace', 'default_covers',
        ]));
        $foh = array_filter($foh, fn ($v) => $v !== null);
        FohSettings::save((int) $tenant->id, $foh);

        foreach (['service_charge_percent', 'prepares_orders', 'kds_auto_print', 'kot_enabled', 'kot_show_prices', 'pos_sound_alert'] as $key) {
            if (array_key_exists($key, $data) && $data[$key] !== null) {
                Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => $key], ['value' => (string) $data[$key]]);
            }
        }

        // Keep the two legacy gates agreeing with the new switches until the old screens are gone,
        // so the POS, the TV queue and the dispatch board never disagree with FOH about what is on.
        if (array_key_exists('takeaway', $foh)) {
            Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => 'lane_takeaway'], ['value' => $foh['takeaway'] ? '1' : '0']);
        }
        if (array_key_exists('delivery', $foh)) {
            Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => 'lane_delivery'], ['value' => $foh['delivery'] ? '1' : '0']);
        }

        return response()->json(['success' => true, 'fohSettings' => FohSettings::all((int) $tenant->id)]);
    }

    /**
     * "Don't track stock for items in these categories": the made-to-order menu switch.
     * `track_stock=false` stops FIFO deduction for those products everywhere (SaleController::skipsStock).
     */
    public function untrackStock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_ids'   => 'required|array|min:1',
            'category_ids.*' => 'string',
            'track'          => 'nullable|boolean',
        ]);

        $tenant = app('current.tenant');
        $ids = Category::where('tenant_id', $tenant->id)->whereIn('id', $data['category_ids'])->pluck('id');

        $changed = Product::where('tenant_id', $tenant->id)
            ->whereIn('category_id', $ids)
            ->update(['track_stock' => $request->boolean('track', false)]);

        return response()->json([
            'success'        => true,
            'changed'        => $changed,
            'untrackedCount' => Product::where('track_stock', false)->count(),
        ]);
    }

    private function canManage(Request $request): bool
    {
        $u = $request->user();
        return $u && ($u->isPlatformAdmin() || $u->hasPermission('admin.settings_manage'));
    }

    /**
     * What this person may do on the FOH screen. The server enforces each of
     * these on the routes themselves; the page only uses them to decide which
     * buttons to show (Pay vs Print bill, Discard, settings link).
     */
    private function caps(Request $request): array
    {
        $u = $request->user();
        $all = $u && $u->isPlatformAdmin();
        $has = fn (string $p) => $all || ($u && $u->hasPermission($p));

        return [
            'canPay'      => $has('pos.checkout'),
            'canDiscount' => $has('pos.discounts'),
            'canVoid'     => $has('pos.void_item'),
            'canManage'   => $has('admin.settings_manage'),
        ];
    }
}
