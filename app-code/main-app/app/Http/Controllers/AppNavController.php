<?php

namespace App\Http\Controllers;

use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The phone bar's content, for the phone app to draw natively.
 *
 * It mirrors resources/js/Components/BottomNavBar.jsx and PhoneActionMenu.jsx on purpose: the same four
 * tabs (Dashboard, Contacts, Stock, Settings), the same centre "+" and the same quick actions, filtered by
 * the same permission rule. If those web components change, change this list with them.
 * Paths are relative so the app stays on its own configured host.
 */
class AppNavController extends Controller
{
    /** label, icon key, tone, route name, permission, optional query */
    private const ACTIONS = [
        ['New Sale', 'cart', 'emerald', 'store.sales.invoice.create', 'sales.create', []],
        ['New Purchase', 'bag', 'amber', 'store.purchases.create', 'purchases.create', []],
        ['Payment In', 'arrow_down', 'emerald', 'store.payments.in', 'finance.receive_payment', []],
        ['Payment Out', 'arrow_up', 'rose', 'store.payments.out', 'finance.send_payment', []],
        ['Add Product', 'box', 'teal', 'store.inventory.create', 'inventory.create', []],
        ['New Quote', 'file', 'indigo', 'store.proposals.create', 'sales.quotations', []],
        ['Goods In', 'package_in', 'teal', 'store.purchases.goods-in', 'purchases.receive', []],
        ['Goods Out', 'package_out', 'indigo', 'store.sales.goods-out', 'sales.dispatch', []],
        ['Transfer Stock', 'refresh', 'orange', 'store.stock-transfers.create', 'inventory.transfer', []],
        ['Add Bank', 'bank', 'sky', 'store.bank-accounts.index', 'finance.journal', ['action' => 'add']],
        ['Add Category', 'tag', 'teal', 'store.categories.index', 'inventory.create', []],
        ['Approvals', 'check', 'amber', 'store.approvals.inbox', 'approvals.view', []],
    ];

    public function show(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();
        $slug = $tenant->slug;

        $modules = ModuleService::allVisible($tenant, $user);
        $has = fn (string $m) => ! is_array($modules) || in_array($m, $modules, true);

        $path = function (string $name, array $extra = []) use ($slug): ?string {
            return \Illuminate\Support\Facades\Route::has($name)
                ? route($name, ['store_slug' => $slug] + $extra, false)
                : null;
        };

        $perms = (array) $user->permissions;
        $can = fn (string $p) => $user->is_platform_admin || $user->role === 'owner' || in_array('*', $perms, true) || in_array($p, $perms, true);

        $tabs = array_values(array_filter([
            ['id' => 'home', 'label' => 'Dashboard', 'path' => $path('store.dashboard'), 'match' => ['/dashboard']],
            ['id' => 'contacts', 'label' => 'Contacts', 'path' => $path($has('customers') ? 'store.customers.index' : 'store.suppliers.index'), 'match' => ['/customers', '/suppliers', '/parties']],
            ['id' => 'stock', 'label' => 'Stock', 'path' => $path('store.inventory.index'), 'match' => ['/inventory', '/stock', '/categories', '/attributes', '/labels', '/warehouses', '/batches', '/serials', '/production', '/cookbook']],
            ['id' => 'settings', 'label' => 'Settings', 'path' => $path('store.settings'), 'match' => ['/settings']],
        ], fn ($t) => $t['path'] !== null));

        $actions = [];
        foreach (self::ACTIONS as [$label, $icon, $tone, $route, $perm, $extra]) {
            $p = $path($route, $extra);
            if ($p !== null && $can($perm)) {
                $actions[] = ['label' => $label, 'icon' => $icon, 'tone' => $tone, 'path' => $p];
            }
        }

        return response()->json([
            'store' => ['slug' => $slug, 'name' => $tenant->name],
            'tabs' => $tabs,
            'actions' => $actions,
            // Same places the web bar hides itself (BottomNavBar / OneGlanceLayout).
            'hide_on' => ['/pos', '/checkout', '/create', '/edit', '/return', '/refund', '/setup', '/new-store', '/start', '/build-workspace'],
        ]);
    }
}
