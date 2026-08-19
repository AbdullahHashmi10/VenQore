<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Models\Position;
use App\Models\Occupancy;
use App\Engines\OccupancyEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantDashboardController extends Controller
{
    /**
     * Display the Restaurant / Café Dashboard (Table Layout, Kitchen Display, Modifiers).
     * Deploy D: Legacy RestaurantTable is gone. All reads AND writes go through Position/Occupancy.
     */
    public function index(Request $request): Response
    {
        $tenant = app('current.tenant');

        // Auto-seed initial positions for tenant if empty
        if (Position::where('tenant_id', $tenant->id)->where('zone', 'dining')->count() === 0) {
            $defaults = [
                ['code' => '1', 'label' => 'T1', 'capacity' => 4, 'status' => 'active',   'order_total' => 45.50, 'occupied' => true],
                ['code' => '2', 'label' => 'T2', 'capacity' => 2, 'status' => 'active',   'order_total' => 0.00,  'occupied' => false],
                ['code' => '3', 'label' => 'T3', 'capacity' => 6, 'status' => 'reserved', 'order_total' => 0.00,  'occupied' => false],
                ['code' => '4', 'label' => 'T4', 'capacity' => 4, 'status' => 'active',   'order_total' => 82.00, 'occupied' => true],
                ['code' => '5', 'label' => 'T5', 'capacity' => 2, 'status' => 'cleaning', 'order_total' => 0.00,  'occupied' => false],
            ];

            foreach ($defaults as $i => $d) {
                $pos = Position::create([
                    'tenant_id'   => $tenant->id,
                    'zone'        => 'dining',
                    'code'        => $d['code'],
                    'label'       => $d['label'],
                    'capacity'    => $d['capacity'],
                    'status'      => $d['status'],
                    'sort_order'  => $i + 1,
                    'source_type' => 'restaurant_table',
                ]);

                if ($d['occupied']) {
                    Occupancy::create([
                        'tenant_id'    => $tenant->id,
                        'position_id'  => $pos->id,
                        'label'        => $d['label'],
                        'session_data' => ['order_total' => $d['order_total']],
                        'opened_at'    => now(),
                    ]);
                }
            }
        }

        $positions = Position::with('activeOccupancy')
            ->where('tenant_id', $tenant->id)
            ->where('zone', 'dining')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $tables = $positions->map(fn (Position $pos) => $this->positionToTableShape($pos));

        $kitchenQueueCount = WorkOrder::where('tenant_id', $tenant->id)
            ->whereIn('status', ['pending', 'preparing'])
            ->count();

        return Inertia::render('Restaurant/Dashboard', [
            'storeSlug'         => $tenant->slug,
            'tables'            => $tables,
            'kitchenQueueCount' => $kitchenQueueCount,
        ]);
    }

    /**
     * Kitchen Display System (KDS) order queue view.
     */
    public function kitchen(Request $request): Response
    {
        $tenant = app('current.tenant');

        if (WorkOrder::where('tenant_id', $tenant->id)->count() === 0) {
            WorkOrder::create([
                'tenant_id'         => $tenant->id,
                'kind'              => 'kitchen',
                'order_number'      => 'K-101',
                'items'             => [
                    ['name' => 'Margherita Pizza', 'qty' => 1, 'notes' => 'Extra cheese'],
                    ['name' => 'Iced Latte', 'qty' => 2],
                ],
                'status'            => 'preparing',
                'time_elapsed_mins' => 8,
            ]);
        }

        $orders = WorkOrder::where('tenant_id', $tenant->id)
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Restaurant/Kitchen', [
            'storeSlug' => $tenant->slug,
            'orders'    => $orders,
        ]);
    }

    /**
     * Update table status. Deploy D: writes directly to Position/Occupancy.
     * The $id here is the Position.id (Deploy C already exposed position_id to frontend).
     */
    public function updateTableStatus(Request $request, $id): JsonResponse|RedirectResponse
    {
        $tenant = app('current.tenant');
        $request->validate([
            'status' => 'required|string|in:available,occupied,reserved,cleaning',
        ]);

        $pos    = Position::where('tenant_id', $tenant->id)->findOrFail($id);
        $status = $request->input('status');

        // Map legacy status values to Position.status + Occupancy presence
        if ($status === 'occupied') {
            $pos->update(['status' => 'active']);
            Occupancy::updateOrCreate(
                ['tenant_id' => $tenant->id, 'position_id' => $pos->id, 'closed_at' => null],
                ['label' => $pos->label, 'session_data' => ['order_total' => $request->input('order_total', 0)], 'opened_at' => now()]
            );
        } else {
            // Close any open occupancy for non-occupied statuses
            Occupancy::where('tenant_id', $tenant->id)
                ->where('position_id', $pos->id)
                ->whereNull('closed_at')
                ->update(['closed_at' => now()]);
            $pos->update(['status' => $status === 'available' ? 'active' : $status]);
        }

        $pos->load('activeOccupancy');

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'table' => $this->positionToTableShape($pos)]);
        }

        return redirect()->back();
    }

    /**
     * Update kitchen order status.
     */
    public function updateOrderStatus(Request $request, $id): JsonResponse|RedirectResponse
    {
        $tenant = app('current.tenant');
        $request->validate([
            'status' => 'required|string|in:pending,preparing,ready,served,cancelled',
        ]);

        $order = WorkOrder::where('tenant_id', $tenant->id)->findOrFail($id);
        $order->update(['status' => $request->input('status')]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'order' => $order]);
        }

        return redirect()->back();
    }

    /**
     * Get all active occupancies / tables. Deploy D: reads from Position/Occupancy.
     */
    public function getOccupancies(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');

        $tables = Position::with('activeOccupancy')
            ->where('tenant_id', $tenant->id)
            ->where('zone', 'dining')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Position $pos) => $this->positionToTableShape($pos));

        return response()->json($tables);
    }

    /**
     * Mark position as occupied. Deploy D: writes directly to Position/Occupancy.
     */
    public function occupyPosition(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $request->validate([
            'position_id' => 'required|integer',
            'order_total' => 'nullable|numeric',
        ]);

        $pos = Position::where('tenant_id', $tenant->id)->findOrFail($request->position_id);
        $pos->update(['status' => 'active']);

        Occupancy::updateOrCreate(
            ['tenant_id' => $tenant->id, 'position_id' => $pos->id, 'closed_at' => null],
            [
                'label'        => $pos->label,
                'session_data' => ['order_total' => $request->input('order_total', 0.00)],
                'opened_at'    => now(),
            ]
        );

        $pos->load('activeOccupancy');
        return response()->json(['success' => true, 'table' => $this->positionToTableShape($pos)]);
    }

    /**
     * Release position back to available. Deploy D: writes directly to Position/Occupancy.
     */
    public function releasePosition(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $request->validate([
            'position_id' => 'required|integer',
        ]);

        $pos = Position::where('tenant_id', $tenant->id)->findOrFail($request->position_id);

        Occupancy::where('tenant_id', $tenant->id)
            ->where('position_id', $pos->id)
            ->whereNull('closed_at')
            ->update(['closed_at' => now()]);

        $pos->update(['status' => 'active']);
        $pos->load('activeOccupancy');

        return response()->json(['success' => true, 'table' => $this->positionToTableShape($pos)]);
    }

    /**
     * Map a Position + its active Occupancy to the legacy table shape the frontend expects.
     */
    private function positionToTableShape(Position $pos): array
    {
        $occ        = $pos->activeOccupancy;
        $orderTotal = $occ ? (float) ($occ->session_data['order_total'] ?? 0) : 0.0;

        if ($pos->status === 'active' && $occ) {
            $status = 'occupied';
        } elseif ($pos->status === 'reserved') {
            $status = 'reserved';
        } elseif ($pos->status === 'cleaning') {
            $status = 'cleaning';
        } else {
            $status = 'available';
        }

        return [
            'id'           => $pos->id,
            'position_id'  => $pos->id,
            'table_number' => $pos->code,
            'name'         => $pos->label,
            'capacity'     => $pos->capacity,
            'status'       => $status,
            'order_total'  => $orderTotal,
            'tenant_id'    => $pos->tenant_id,
        ];
    }
}
