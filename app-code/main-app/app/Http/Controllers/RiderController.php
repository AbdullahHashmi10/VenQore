<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Occupancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Riders — staff members who can be assigned deliveries.
 *
 * WHY NOT A SEPARATE PEOPLE TABLE
 * --------------------------------
 * A rider is an employee with one extra flag: `is_rider`. Splitting them
 * into a parallel table would mean a separate form, separate onboarding,
 * and a join on every dispatch load — for information that is already in the
 * employee record. A boolean costs nothing and answers every question this
 * module needs to ask.
 *
 * LIVE DELIVERY COUNT
 * -------------------
 * The count is derived in real time, never stored. A stored count goes stale
 * on the first concurrent request; a derived one is always true.
 */
class RiderController extends Controller
{
    /**
     * Active riders with their current live delivery count.
     * Used to populate the rider picker in the dispatch / delivery form.
     */
    public function list(Request $request): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');

        $riders = Employee::where('tenant_id', $tenant->id)
            ->riders()
            ->orderBy('name')
            ->get(['id', 'name', 'commission_rate']);

        // Count open (not yet delivered) deliveries per rider today
        $today = now()->startOfDay();
        $openDeliveries = Occupancy::where('tenant_id', $tenant->id)
            ->whereNull('position_id')
            ->whereNull('closed_at')
            ->where('opened_at', '>=', $today)
            ->get(['id', 'session_data']);

        $liveCounts = [];
        foreach ($openDeliveries as $occ) {
            $sd = $occ->session_data ?? [];
            if (($sd['order_type'] ?? '') !== 'delivery') continue;
            $riderId = $sd['delivery']['rider_id'] ?? null;
            if ($riderId) {
                $liveCounts[$riderId] = ($liveCounts[$riderId] ?? 0) + 1;
            }
        }

        $shaped = $riders->map(fn ($r) => [
            'id'              => $r->id,
            'name'            => $r->name,
            'commission_rate' => (float) $r->commission_rate,
            'live_count'      => $liveCounts[$r->id] ?? 0,
        ]);

        return response()->json(['riders' => $shaped]);
    }

    /**
     * Toggle a staff member's rider capability on / off.
     * Gated to admin.settings_manage — only a manager should create riders.
     */
    public function toggleRider(Request $request, string $id): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');

        $employee = Employee::where('tenant_id', $tenant->id)->findOrFail($id);
        $employee->is_rider = !$employee->is_rider;
        $employee->save();

        return response()->json([
            'id'       => $employee->id,
            'is_rider' => $employee->is_rider,
        ]);
    }

    /**
     * Abort 404 if the store does not have kitchen order preparation enabled.
     */
    private function ensurePreparesOrders(): void
    {
        $tenant = app('current.tenant');
        $preparesOrders = \App\Models\Setting::where('tenant_id', $tenant->id)
            ->where('key', 'prepares_orders')
            ->value('value');

        if ((string) $preparesOrders !== '1') {
            abort(404, 'Page not found.');
        }
    }
}
