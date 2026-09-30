<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Models\Position;
use App\Models\Occupancy;
use App\Models\Setting;
use App\Engines\OccupancyEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantDashboardController extends Controller
{
    /**
     * 'counter' is the parked-cart pseudo position the occupancy migration
     * creates one of per tenant. It is not a seat and must never appear on a
     * floor plan. Everything else IS seating, whatever the zone is called —
     * 'dining' from the legacy restaurant_tables backfill, or the human zone
     * names TableServiceController::seedIfEmpty() creates. Filtering on
     * zone = 'dining' here is what let this screen and the floor screen seed
     * two competing sets of tables for the same tenant.
     */
    private const RESERVED_ZONE = 'counter';

    /**
     * The ticket ladder. Cancelled is deliberately NOT on it: it is somewhere a
     * ticket is sent, not a stage it passes through, and putting it on the end
     * would make one more bump on a served ticket cancel it.
     */
    private const KITCHEN_STAGES = ['pending', 'preparing', 'ready', 'served'];

    /**
     * Display the Restaurant / Café Dashboard (Table Layout, Kitchen Display, Modifiers).
     * Deploy D: Legacy RestaurantTable is gone. All reads AND writes go through Position/Occupancy.
     */
    public function index(Request $request): Response
    {
        $this->ensureRestaurantEnabled();
        $tenant = app('current.tenant');

        $positions = Position::with('activeOccupancy')
            ->where('tenant_id', $tenant->id)
            ->where('zone', '!=', self::RESERVED_ZONE)
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
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');

        return Inertia::render('Restaurant/Kitchen', [
            'storeSlug' => $tenant->slug,
            'orders'    => $this->kitchenQueue($tenant->id),
        ]);
    }

    /**
     * The same queue as JSON, for polling.
     */
    public function kitchenState(Request $request): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');

        return response()->json([
            'orders'         => $this->kitchenQueue($tenant->id),
            'eighty_six_ids' => json_decode(Setting::where('key', 'pos_86_products')->value('value') ?? '[]', true) ?: [],
        ]);
    }

    /**
     * Advance a ticket: pending → preparing → ready → served.
     *
     * A bump on an already-served ticket is a no-op rather than an error. The
     * pass is a touchscreen with wet hands over it and the double tap is the
     * normal case; failing it teaches the kitchen to ignore the toast.
     */
    public function bump(Request $request, $id): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');
        $order  = WorkOrder::where('tenant_id', $tenant->id)->findOrFail($id);

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'That ticket was cancelled. Recall it from the cancelled filter.'], 422);
        }

        $next = $this->nextStage($order->status, 1);
        if ($next !== null) {
            $order->status = $next;
            // The only honest ticket time is bumped_at − fired_at, so the clock
            // stops when it leaves the pass and not a stage earlier.
            if ($next === 'served') $order->bumped_at = now();
            $order->save();
        }

        return response()->json(['success' => true, 'order' => $this->ticketShape($order)]);
    }

    /**
     * Step a ticket back one stage: served → ready → preparing → pending.
     *
     * A recall off 'served' clears bumped_at, because the ticket is demonstrably
     * back on the pass and a ticket time measured to a bump that was undone is
     * worse than no ticket time at all.
     */
    public function recall(Request $request, $id): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');
        $order  = WorkOrder::where('tenant_id', $tenant->id)->findOrFail($id);

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'That ticket was cancelled. Set its status directly to bring it back.'], 422);
        }

        $prev = $this->nextStage($order->status, -1);
        if ($prev !== null) {
            if ($order->status === 'served') $order->bumped_at = null;
            $order->status = $prev;
            $order->save();
        }

        return response()->json(['success' => true, 'order' => $this->ticketShape($order)]);
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
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');
        $request->validate([
            'status' => 'required|string|in:pending,preparing,ready,served,cancelled',
        ]);

        $order  = WorkOrder::where('tenant_id', $tenant->id)->findOrFail($id);
        $status = $request->input('status');

        // Same stamp bump() makes. This route is the one the KDS buttons still
        // post to, and a ticket time that depends on WHICH button was pressed is
        // not a measurement.
        $order->update([
            'status'    => $status,
            'bumped_at' => $status === 'served' ? ($order->bumped_at ?? now()) : $order->bumped_at,
        ]);

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
            ->where('zone', '!=', self::RESERVED_ZONE)
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

    /** One step along KITCHEN_STAGES, or null when there is nowhere to go. */
    private function nextStage(?string $status, int $step): ?string
    {
        $i = array_search($status, self::KITCHEN_STAGES, true);
        if ($i === false) return null;

        $next = $i + $step;
        return ($next >= 0 && $next < count(self::KITCHEN_STAGES)) ? self::KITCHEN_STAGES[$next] : null;
    }

    private function kitchenQueue(int $tenantId): array
    {
        $cutoff = now()->subHours(4);

        return WorkOrder::where('tenant_id', $tenantId)
            ->where(function ($q) use ($cutoff) {
                $q->whereIn('status', ['pending', 'preparing', 'ready'])
                  ->orWhere(function ($q2) use ($cutoff) {
                      $q2->where('status', 'served')
                         ->where('fired_at', '>=', $cutoff);
                  });
            })
            ->orderBy('id', 'desc')
            ->limit(200)
            ->get()
            ->map(fn (WorkOrder $o) => $this->ticketShape($o))
            ->values()->all();
    }

    /**
     * A ticket as the pass reads it.
     *
     * `table_number` is the denormalised position_code, NOT a join back to the
     * live occupancy: the table is settled and re-seated while the ticket is
     * still up, and the ticket has to keep naming the table it was cooked for.
     * The KDS has always read this key — until now nothing ever set it, which is
     * why every ticket on that screen said "Takeaway".
     */
    private function ticketShape(WorkOrder $order): array
    {
        return [
            'id'                => $order->id,
            'kind'              => $order->kind,
            'order_type'        => $order->order_type ?? 'dine_in',
            'order_number'      => $order->order_number,
            'table_number'      => $order->position_code,
            'position_code'     => $order->position_code,
            'occupancy_id'      => $order->occupancy_id,
            'station'           => $order->station,
            'course'            => (int) ($order->course ?? 1),
            'status'            => $order->status,
            'items'             => $order->items ?? [],
            'time_elapsed_mins' => $order->fired_at
                // Measured, not stored. A counter that only moves when something
                // writes to the row is a counter that reads 8 minutes all night.
                ? (int) $order->fired_at->diffInMinutes($order->bumped_at ?? now())
                : (int) ($order->time_elapsed_mins ?? 0),
            'fired_at'          => $order->fired_at?->toIso8601String(),
            'bumped_at'         => $order->bumped_at?->toIso8601String(),
            'created_at'        => $order->created_at?->toIso8601String(),
        ];
    }

    /**
     * Kitchen Performance Analytics (T4.1 / R26).
     *
     * Computes real preparation times by station and hour of day from
     * fired_at and bumped_at timestamps.
     */
    public function kitchenPerformance(Request $request): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');
        $days   = (int) $request->query('days', 7);
        $since  = now()->subDays($days)->startOfDay();

        $completed = WorkOrder::where('tenant_id', $tenant->id)
            ->where('status', 'served')
            ->whereNotNull('fired_at')
            ->whereNotNull('bumped_at')
            ->where('fired_at', '>=', $since)
            ->get();

        $stationStats = [];
        $hourlyStats  = array_fill(0, 24, ['count' => 0, 'total_mins' => 0]);
        $totalMinutes = 0;
        $onTimeCount  = 0;

        foreach ($completed as $wo) {
            $mins = max(1, (int) $wo->fired_at->diffInMinutes($wo->bumped_at));
            $st   = $wo->station ?: 'kitchen';

            if (!isset($stationStats[$st])) {
                $stationStats[$st] = ['station' => $st, 'count' => 0, 'total_mins' => 0];
            }
            $stationStats[$st]['count']++;
            $stationStats[$st]['total_mins'] += $mins;

            $hour = (int) $wo->fired_at->format('H');
            $hourlyStats[$hour]['count']++;
            $hourlyStats[$hour]['total_mins'] += $mins;

            $totalMinutes += $mins;
            if ($mins <= 15) $onTimeCount++;
        }

        $count = $completed->count();
        $avgMinutes = $count > 0 ? round($totalMinutes / $count, 1) : 0;
        $onTimePct  = $count > 0 ? round(($onTimeCount / $count) * 100, 1) : 100;

        $byStation = array_map(function ($s) {
            return [
                'station'    => $s['station'],
                'count'      => $s['count'],
                'avg_mins'   => $s['count'] > 0 ? round($s['total_mins'] / $s['count'], 1) : 0,
            ];
        }, array_values($stationStats));

        $byHour = [];
        foreach ($hourlyStats as $h => $d) {
            if ($d['count'] > 0) {
                $byHour[] = [
                    'hour'       => $h,
                    'hour_label' => sprintf('%02d:00', $h),
                    'count'      => $d['count'],
                    'avg_mins'   => round($d['total_mins'] / $d['count'], 1),
                ];
            }
        }

        return response()->json([
            'total_tickets' => $count,
            'avg_cook_time' => $avgMinutes,
            'on_time_pct'   => $onTimePct,
            'by_station'    => $byStation,
            'by_hour'       => $byHour,
        ]);
    }

    /**
     * Gratuities & Tips Distribution Report (T4.3 / R24).
     *
     * Separates staff gratuities (liability) from house service charge (revenue).
     */
    public function tipsReport(Request $request): JsonResponse
    {
        $this->ensureRestaurantEnabled();
        $tenant = app('current.tenant');
        $days   = (int) $request->query('days', 30);
        $since  = now()->subDays($days)->startOfDay();

        $sales = \App\Models\Sale::with('user')
            ->where('tenant_id', $tenant->id)
            ->where(function ($q) {
                $q->where('tip_amount', '>', 0)
                  ->orWhere('service_charge', '>', 0);
            })
            ->where('created_at', '>=', $since)
            ->get();

        $byStaff = [];
        $totalTips = 0.0;
        $totalServiceCharge = 0.0;

        foreach ($sales as $sale) {
            $staffId   = $sale->user_id ?? 'unassigned';
            $staffName = $sale->user ? $sale->user->name : 'Unassigned';
            $tip       = (float) ($sale->tip_amount ?? 0);
            $sc        = (float) ($sale->service_charge ?? 0);

            if (!isset($byStaff[$staffId])) {
                $byStaff[$staffId] = [
                    'staff_id'       => $staffId,
                    'staff_name'     => $staffName,
                    'tips_collected' => 0.0,
                    'sales_count'    => 0,
                ];
            }

            $byStaff[$staffId]['tips_collected'] += $tip;
            $byStaff[$staffId]['sales_count']++;
            $totalTips += $tip;
            $totalServiceCharge += $sc;
        }

        return response()->json([
            'period_days'          => $days,
            'total_tips_collected' => round($totalTips, 2),
            'total_service_charge' => round($totalServiceCharge, 2),
            'by_staff'             => array_values($byStaff),
        ]);
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

    /**
     * Abort 404 if the store does not have kitchen order preparation enabled.
     */
    private function ensurePreparesOrders(): void
    {
        $tenant = app('current.tenant');
        $preparesOrders = Setting::where('tenant_id', $tenant->id)
            ->where('key', 'prepares_orders')
            ->value('value');

        if ((string) $preparesOrders !== '1') {
            abort(404, 'Page not found.');
        }
    }

    /**
     * Abort 404 if the store is not configured for restaurant / hospitality operations.
     */
    private function ensureRestaurantEnabled(): void
    {
        $tenant = app('current.tenant');
        $preparesOrders = Setting::where('tenant_id', $tenant->id)
            ->where('key', 'prepares_orders')
            ->value('value');
        $serviceMode = Setting::where('tenant_id', $tenant->id)
            ->where('key', 'pos_service_mode')
            ->value('value');

        $isRestaurant = ((string) $preparesOrders === '1') || in_array($serviceMode, ['tables', 'both'], true);

        if (!$isRestaurant) {
            abort(404, 'Page not found.');
        }
    }
}

