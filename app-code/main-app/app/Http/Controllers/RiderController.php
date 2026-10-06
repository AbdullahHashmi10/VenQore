<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Occupancy;
use App\Models\Party;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
     * Restaurant Delivery Riders management page.
     */
    public function index(Request $request): Response
    {
        $tenant = app('current.tenant');
        $deliveryEnabled = Setting::where('tenant_id', $tenant->id)->where('key', 'lane_delivery')->value('value');
        $preparesOrders = Setting::where('tenant_id', $tenant->id)->where('key', 'prepares_orders')->value('value');

        $riders = Employee::with('party')
            ->where('tenant_id', $tenant->id)
            ->where('is_rider', true)
            ->orderBy('name')
            ->get();

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
            'status'          => ($r->status === 'terminated' || $r->status === 'inactive') ? 'inactive' : 'active',
            'phone'           => $r->party?->phone ?? '',
            'notes'           => $r->party?->notes ?? '',
            'commission_rate' => (float) ($r->commission_rate ?? 0),
            'live_count'      => $liveCounts[$r->id] ?? 0,
            'created_at'      => $r->created_at?->toIso8601String(),
        ]);

        return Inertia::render('Restaurant/Riders', [
            'storeSlug'             => $tenant->slug,
            'riders'                => $shaped,
            'deliveryEnabled'       => (string) $deliveryEnabled === '1',
            'preparesOrdersEnabled' => (string) $preparesOrders !== '0',
        ]);
    }

    /**
     * Add a new rider.
     * Riders are delivery staff and DO NOT consume a user login seat license.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'name'            => 'required|string|max:120',
            'phone'           => 'nullable|string|max:40',
            'commission_rate' => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string|max:500',
        ]);

        $partyId = null;
        if (!empty($data['phone']) || !empty($data['notes'])) {
            $party = Party::create([
                'tenant_id' => $tenant->id,
                'name'      => $data['name'],
                'phone'     => $data['phone'] ?? null,
                'notes'     => $data['notes'] ?? null,
                'type'      => 'other',
            ]);
            $partyId = $party->id;
        }

        $employee = Employee::create([
            'tenant_id'       => $tenant->id,
            'name'            => $data['name'],
            'status'          => 'active',
            'is_rider'        => true,
            'commission_rate' => $data['commission_rate'] ?? 0.0,
            'party_id'        => $partyId,
        ]);

        return response()->json([
            'success' => true,
            'rider'   => [
                'id'              => $employee->id,
                'name'            => $employee->name,
                'status'          => $employee->status,
                'phone'           => $data['phone'] ?? '',
                'notes'           => $data['notes'] ?? '',
                'commission_rate' => (float) $employee->commission_rate,
                'live_count'      => 0,
            ],
        ]);
    }

    /**
     * Update an existing rider's details or status.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $data = $request->validate([
            'name'            => 'required|string|max:120',
            'phone'           => 'nullable|string|max:40',
            'commission_rate' => 'nullable|numeric|min:0',
            'status'          => 'nullable|string|in:active,inactive,terminated',
            'notes'           => 'nullable|string|max:500',
        ]);

        $employee = Employee::where('tenant_id', $tenant->id)->findOrFail($id);
        $employee->name = $data['name'];
        if (isset($data['commission_rate'])) {
            $employee->commission_rate = $data['commission_rate'];
        }
        if (isset($data['status'])) {
            $employee->status = ($data['status'] === 'inactive' || $data['status'] === 'terminated') ? 'terminated' : 'active';
        }

        if ($employee->party_id) {
            $party = Party::where('tenant_id', $tenant->id)->find($employee->party_id);
            if ($party) {
                $party->update([
                    'name'  => $data['name'],
                    'phone' => $data['phone'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);
            }
        } elseif (!empty($data['phone']) || !empty($data['notes'])) {
            $party = Party::create([
                'tenant_id' => $tenant->id,
                'name'      => $data['name'],
                'phone'     => $data['phone'] ?? null,
                'notes'     => $data['notes'] ?? null,
                'type'      => 'other',
            ]);
            $employee->party_id = $party->id;
        }

        $employee->save();

        return response()->json([
            'success' => true,
            'rider'   => [
                'id'              => $employee->id,
                'name'            => $employee->name,
                'status'          => $employee->status === 'terminated' ? 'inactive' : 'active',
                'phone'           => $data['phone'] ?? '',
                'notes'           => $data['notes'] ?? '',
                'commission_rate' => (float) $employee->commission_rate,
            ],
        ]);
    }

    /**
     * Soft delete / deactivate a rider.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $employee = Employee::where('tenant_id', $tenant->id)->findOrFail($id);
        $employee->is_rider = false;
        $employee->status = 'terminated';
        $employee->save();

        return response()->json(['success' => true]);
    }

    /**
     * Active riders with their current live delivery count.
     * Used to populate the rider picker in the dispatch / delivery form.
     */
    public function list(Request $request): JsonResponse
    {
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
        $tenant = app('current.tenant');

        $employee = Employee::where('tenant_id', $tenant->id)->findOrFail($id);
        $employee->is_rider = !$employee->is_rider;
        $employee->save();

        return response()->json([
            'id'       => $employee->id,
            'is_rider' => $employee->is_rider,
        ]);
    }
}
