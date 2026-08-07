<?php

namespace App\Http\Controllers;

use App\Models\KitchenOrder;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantDashboardController extends Controller
{
    /**
     * Display the Restaurant / Café Dashboard (Table Layout, Kitchen Display, Modifiers).
     */
    public function index(Request $request): Response
    {
        $tenant = app('current.tenant');

        // Auto-seed initial tables for tenant if empty
        if (RestaurantTable::where('tenant_id', $tenant->id)->count() === 0) {
            $defaultTables = [
                ['table_number' => '1', 'name' => 'T1', 'capacity' => 4, 'status' => 'occupied', 'order_total' => 45.50],
                ['table_number' => '2', 'name' => 'T2', 'capacity' => 2, 'status' => 'available', 'order_total' => 0.00],
                ['table_number' => '3', 'name' => 'T3', 'capacity' => 6, 'status' => 'reserved', 'order_total' => 0.00],
                ['table_number' => '4', 'name' => 'T4', 'capacity' => 4, 'status' => 'occupied', 'order_total' => 82.00],
                ['table_number' => '5', 'name' => 'T5', 'capacity' => 2, 'status' => 'cleaning', 'order_total' => 0.00],
            ];

            foreach ($defaultTables as $dt) {
                RestaurantTable::create(array_merge($dt, ['tenant_id' => $tenant->id]));
            }
        }

        $tables = RestaurantTable::where('tenant_id', $tenant->id)
            ->orderBy('id')
            ->get();

        $kitchenQueueCount = KitchenOrder::where('tenant_id', $tenant->id)
            ->whereIn('status', ['pending', 'preparing'])
            ->count();

        return Inertia::render('Restaurant/Dashboard', [
            'storeSlug' => $tenant->slug,
            'tables'    => $tables,
            'kitchenQueueCount' => $kitchenQueueCount,
        ]);
    }

    /**
     * Kitchen Display System (KDS) order queue view.
     */
    public function kitchen(Request $request): Response
    {
        $tenant = app('current.tenant');

        // Auto-seed initial kitchen orders if empty
        if (KitchenOrder::where('tenant_id', $tenant->id)->count() === 0) {
            $t1 = RestaurantTable::where('tenant_id', $tenant->id)->where('table_number', '1')->first();
            $t4 = RestaurantTable::where('tenant_id', $tenant->id)->where('table_number', '4')->first();

            KitchenOrder::create([
                'tenant_id' => $tenant->id,
                'order_number' => 'ORD-101',
                'table_id' => $t1?->id,
                'table_number' => 'T1',
                'items' => [
                    ['name' => 'Burger', 'qty' => 2, 'modifiers' => ['No Onion', 'Extra Cheese']],
                    ['name' => 'Fries', 'qty' => 1, 'modifiers' => ['Large']],
                ],
                'status' => 'preparing',
                'time_elapsed_mins' => 8,
            ]);

            KitchenOrder::create([
                'tenant_id' => $tenant->id,
                'order_number' => 'ORD-102',
                'table_id' => $t4?->id,
                'table_number' => 'T4',
                'items' => [
                    ['name' => 'Pasta', 'qty' => 1, 'modifiers' => ['Gluten Free']],
                    ['name' => 'Iced Tea', 'qty' => 2, 'modifiers' => ['Less Ice']],
                ],
                'status' => 'pending',
                'time_elapsed_mins' => 3,
            ]);
        }

        $orders = KitchenOrder::where('tenant_id', $tenant->id)
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Restaurant/Kitchen', [
            'storeSlug' => $tenant->slug,
            'orders'    => $orders,
        ]);
    }

    /**
     * Update table status (e.g. available, occupied, reserved, cleaning).
     */
    public function updateTableStatus(Request $request, $id): JsonResponse|RedirectResponse
    {
        $tenant = app('current.tenant');
        $request->validate([
            'status' => 'required|string|in:available,occupied,reserved,cleaning',
        ]);

        $table = RestaurantTable::where('tenant_id', $tenant->id)->findOrFail($id);
        $table->update([
            'status' => $request->input('status'),
            'order_total' => $request->input('status') === 'available' ? 0.00 : $table->order_total,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'table' => $table]);
        }

        return redirect()->back();
    }

    /**
     * Update kitchen order status (e.g. pending, preparing, ready, served, cancelled).
     */
    public function updateOrderStatus(Request $request, $id): JsonResponse|RedirectResponse
    {
        $tenant = app('current.tenant');
        $request->validate([
            'status' => 'required|string|in:pending,preparing,ready,served,cancelled',
        ]);

        $order = KitchenOrder::where('tenant_id', $tenant->id)->findOrFail($id);
        $order->update(['status' => $request->input('status')]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'order' => $order]);
        }

        return redirect()->back();
    }
}
