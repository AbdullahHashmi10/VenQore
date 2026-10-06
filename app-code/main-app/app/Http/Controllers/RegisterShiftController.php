<?php

namespace App\Http\Controllers;

use App\Models\RegisterShift;
use App\Models\Sale;
use App\Models\ShiftCashMovement;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RegisterShiftController extends Controller
{
    /**
     * Get the active open shift for the current tenant and register/user.
     */
    public function current(Request $request): JsonResponse
    {
        $tenantId = app('current.tenant')->id;
        $userId = Auth::id();
        $membership = \App\Models\TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->first();

        // Store owners and full staff members remain outside the mandatory personal shift flow
        if (!$membership || !$membership->isPosStaff()) {
            return response()->json([
                'has_open_shift'    => false,
                'shift'             => null,
                'last_closed_shift' => null,
                'is_pos_staff'      => false,
            ]);
        }

        $registerId = $request->query('register_id');

        $query = RegisterShift::where('tenant_id', $tenantId)
            ->where('status', 'open');

        if ($registerId) {
            $query->where(function ($q) use ($registerId, $userId) {
                $q->where('register_id', $registerId)
                  ->orWhere('opened_by', $userId);
            });
        } else {
            $query->where('opened_by', $userId);
        }

        $shift = $query->with(['openedByUser:id,name,email', 'cashMovements.user:id,name'])
            ->latest('id')
            ->first();

        if (!$shift) {
            // Also fetch the last closed shift for convenience
            $lastShift = RegisterShift::where('tenant_id', $tenantId)
                ->where('status', 'closed')
                ->latest('closed_at')
                ->first();

            return response()->json([
                'has_open_shift'    => false,
                'shift'             => null,
                'last_closed_shift' => $lastShift,
                'is_pos_staff'      => true,
            ]);
        }

        $metrics = $this->calculateShiftMetrics($shift);

        return response()->json([
            'has_open_shift' => true,
            'shift'          => $shift,
            'metrics'        => $metrics,
            'is_pos_staff'   => true,
        ]);
    }

    /**
     * Open a new register shift.
     */
    public function open(Request $request): JsonResponse
    {
        $tenantId = app('current.tenant')->id;
        $user = Auth::user();
        $membership = \App\Models\TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->first();

        // Store owners and full staff members do not open personal work shifts
        if (!$membership || !$membership->isPosStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Work shifts are reserved for POS staff members. Store owners and full staff operate outside the mandatory shift flow.',
            ], 403);
        }

        $isPosStaff = $membership->isPosStaff();
        $isOrdersOnly = $isPosStaff && !$membership->hasPosCapability(\App\Models\TenantUser::CAP_TAKE_PAYMENTS);

        if ($isOrdersOnly) {
            $request->validate([
                'register_id' => 'nullable|string|max:100',
                'notes'       => 'nullable|string|max:1000',
            ]);
        } else {
            $request->validate([
                'opening_float' => 'required|numeric|min:0',
                'register_id'   => 'nullable|string|max:100',
                'notes'         => 'nullable|string|max:1000',
            ]);
        }

        $registerId = $request->input('register_id', 'REG-1');

        // Check if there is already an open shift for this user in this store
        $existingUserShift = RegisterShift::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->where('opened_by', $user->id)
            ->first();

        if ($existingUserShift) {
            $metrics = $this->calculateShiftMetrics($existingUserShift);
            return response()->json([
                'success' => false,
                'message' => 'You already have an active open shift. Switching stations resumes your existing shift.',
                'shift'   => $existingUserShift,
                'metrics' => $metrics,
            ], 422);
        }

        // Single custodian per cashbox: If cash drawer mode, no other user can hold an open cash shift on the same register
        if (!$isOrdersOnly) {
            $existingRegisterShift = RegisterShift::where('tenant_id', $tenantId)
                ->where('status', 'open')
                ->where('register_id', $registerId)
                ->where('shift_mode', 'cash_drawer')
                ->with('openedByUser:id,name')
                ->first();

            if ($existingRegisterShift) {
                return response()->json([
                    'success' => false,
                    'message' => 'Register ' . $registerId . ' currently has an active cash custodian (' . ($existingRegisterShift->openedByUser?->name ?? 'another staff') . '). Reconcile and close the existing shift or select a separate station.',
                ], 422);
            }
        }

        $openingFloat = $isOrdersOnly ? 0.0 : (float) $request->input('opening_float', 0);

        $shift = RegisterShift::create([
            'tenant_id'         => $tenantId,
            'register_id'       => $registerId,
            'shift_mode'        => $isOrdersOnly ? 'orders_only' : 'cash_drawer',
            'opened_by'         => $user->id,
            'cash_custodian_id' => $isOrdersOnly ? null : $user->id,
            'opened_at'         => now(),
            'opening_float'     => $openingFloat,
            'status'            => 'open',
            'notes'             => $request->input('notes'),
        ]);

        $shift->load(['openedByUser:id,name,email', 'cashCustodian:id,name,email']);
        $metrics = $this->calculateShiftMetrics($shift);

        return response()->json([
            'success' => true,
            'message' => $isOrdersOnly ? 'Order taker shift started successfully.' : 'Register shift opened successfully with cash custody.',
            'shift'   => $shift,
            'metrics' => $metrics,
        ], 201);
    }

    /**
     * Record a cash movement (Cash In / Cash Out).
     */
    public function movement(Request $request): JsonResponse
    {
        $request->validate([
            'shift_id' => 'required|exists:register_shifts,id',
            'type'     => 'required|in:in,out',
            'amount'   => 'required|numeric|min:0.01',
            'reason'   => 'required|string|max:255',
        ]);

        $tenantId = app('current.tenant')->id;
        $shift = RegisterShift::where('tenant_id', $tenantId)
            ->where('id', $request->input('shift_id'))
            ->firstOrFail();

        if ($shift->status !== 'open') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot add cash movement to a closed shift.',
            ], 422);
        }

        $movement = ShiftCashMovement::create([
            'tenant_id'         => $tenantId,
            'register_shift_id' => $shift->id,
            'user_id'           => Auth::id(),
            'type'              => $request->input('type'),
            'amount'            => (float) $request->input('amount'),
            'reason'            => $request->input('reason'),
        ]);

        $movement->load('user:id,name');
        $metrics = $this->calculateShiftMetrics($shift);

        return response()->json([
            'success'  => true,
            'message'  => ($request->input('type') === 'in' ? 'Cash In' : 'Cash Out') . ' recorded successfully.',
            'movement' => $movement,
            'metrics'  => $metrics,
        ]);
    }

    /**
     * Close the register shift, reconcile cash, and generate Z-Report.
     */
    public function close(Request $request): JsonResponse
    {
        $tenantId = app('current.tenant')->id;
        $user = Auth::user();

        $shift = RegisterShift::where('tenant_id', $tenantId)
            ->where('id', $request->input('shift_id'))
            ->firstOrFail();

        if ($shift->status !== 'open') {
            return response()->json([
                'success' => false,
                'message' => 'This shift is already closed.',
            ], 422);
        }

        // Check if closer is the shift owner or an authorized manager
        $isShiftOwner = ((int) $shift->opened_by === (int) $user->id);
        $membership = \App\Models\TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->first();

        $isManager = ($membership && in_array($membership->role, ['owner', 'admin', 'manager'], true)) || $user->isPlatformAdmin();

        if (!$isShiftOwner && !$isManager) {
            return response()->json([
                'success' => false,
                'message' => 'Only the shift custodian or an authorized manager can close this shift.',
            ], 403);
        }

        $managerCloseReason = null;
        if (!$isShiftOwner && $isManager) {
            $request->validate([
                'manager_close_reason' => 'required|string|max:500',
            ]);
            $managerCloseReason = $request->input('manager_close_reason');
        }

        // Branching: orders_only vs cash_drawer
        if ($shift->isOrdersOnly()) {
            $request->validate([
                'notes' => 'nullable|string|max:1000',
            ]);

            $metrics = $this->calculateShiftMetrics($shift);

            $shift->update([
                'closed_by'            => $user->id,
                'closed_at'            => now(),
                'expected_cash'        => 0.00,
                'counted_cash'         => 0.00,
                'variance'             => 0.00,
                'expected_handover'    => 0.00,
                'actual_handover'      => 0.00,
                'manager_close_reason' => $managerCloseReason,
                'status'               => 'closed',
                'notes'                => $request->input('notes'),
            ]);

            $shift->load(['openedByUser:id,name,email', 'closedByUser:id,name,email']);
            $zReport = $this->generateZReportData($shift, $metrics);

            return response()->json([
                'success'  => true,
                'message'  => 'Order taker work shift closed successfully.',
                'shift'    => $shift,
                'metrics'  => $metrics,
                'z_report' => $zReport,
            ]);
        }

        // Cash drawer mode: physical cash reconciliation
        $request->validate([
            'counted_cash'    => 'required|numeric|min:0',
            'retained_float'  => 'nullable|numeric|min:0',
            'actual_handover' => 'nullable|numeric|min:0',
            'handover_notes'  => 'nullable|string|max:1000',
            'notes'           => 'nullable|string|max:1000',
            'denominations'   => 'nullable|array',
        ]);

        $metrics = $this->calculateShiftMetrics($shift);
        $countedCash = (float) $request->input('counted_cash', 0);
        $expectedCash = (float) $metrics['expected_cash'];
        $variance = round($countedCash - $expectedCash, 2);

        $retainedFloat = (float) $request->input('retained_float', (float) $shift->opening_float);
        $expectedHandover = max(0.0, round($expectedCash - $retainedFloat, 2));
        $actualHandover = $request->has('actual_handover')
            ? (float) $request->input('actual_handover')
            : max(0.0, round($countedCash - $retainedFloat, 2));

        $shift->update([
            'closed_by'            => $user->id,
            'closed_at'            => now(),
            'expected_cash'        => $expectedCash,
            'counted_cash'         => $countedCash,
            'variance'             => $variance,
            'retained_float'       => $retainedFloat,
            'expected_handover'    => $expectedHandover,
            'actual_handover'      => $actualHandover,
            'handover_notes'       => $request->input('handover_notes'),
            'manager_close_reason' => $managerCloseReason,
            'status'               => 'closed',
            'notes'                => $request->input('notes'),
            'denominations'        => $request->input('denominations'),
        ]);

        $shift->load(['openedByUser:id,name,email', 'closedByUser:id,name,email', 'cashCustodian:id,name,email', 'cashMovements.user:id,name']);

        $zReport = $this->generateZReportData($shift, $metrics);

        return response()->json([
            'success'  => true,
            'message'  => 'Register shift closed and cash reconciled successfully.',
            'shift'    => $shift,
            'metrics'  => $metrics,
            'z_report' => $zReport,
        ]);
    }

    /**
     * Acknowledge handover of drawer cash to store owner / manager.
     */
    public function acknowledgeHandover(Request $request, $id): JsonResponse
    {
        $tenantId = app('current.tenant')->id;
        $user = Auth::user();

        $membership = \App\Models\TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->first();

        $isAuthorized = ($membership && in_array($membership->role, ['owner', 'admin'], true)) || $user->isPlatformAdmin();

        if (!$isAuthorized) {
            return response()->json([
                'success' => false,
                'message' => 'Only the store owner or admin can acknowledge cash handovers.',
            ], 403);
        }

        $shift = RegisterShift::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        if ($shift->status !== 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Handover can only be acknowledged after the shift is closed.',
            ], 422);
        }

        $shift->update([
            'handover_acknowledged_by' => $user->id,
            'handover_acknowledged_at' => now(),
        ]);

        $shift->load(['openedByUser:id,name', 'closedByUser:id,name', 'handoverAcknowledgedByUser:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Cash handover acknowledged successfully.',
            'shift'   => $shift,
        ]);
    }

    /**
     * Get Z-Report details for any shift.
     */
    public function zReport(Request $request, $id): JsonResponse
    {
        $tenantId = app('current.tenant')->id;
        $shift = RegisterShift::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->with(['openedByUser:id,name,email', 'closedByUser:id,name,email', 'cashCustodian:id,name,email', 'cashMovements.user:id,name'])
            ->firstOrFail();

        $metrics = $this->calculateShiftMetrics($shift);
        $zReport = $this->generateZReportData($shift, $metrics);

        return response()->json([
            'success'  => true,
            'shift'    => $shift,
            'metrics'  => $metrics,
            'z_report' => $zReport,
        ]);
    }

    /**
     * Get recent shift history.
     */
    public function history(Request $request): JsonResponse
    {
        $tenantId = app('current.tenant')->id;
        $shifts = RegisterShift::where('tenant_id', $tenantId)
            ->with(['openedByUser:id,name', 'closedByUser:id,name', 'cashCustodian:id,name'])
            ->withCount('sales')
            ->latest('id')
            ->paginate(15);

        return response()->json($shifts);
    }

    /**
     * Calculate financial metrics for a shift.
     */
    private function calculateShiftMetrics(RegisterShift $shift): array
    {
        $tenantId = $shift->tenant_id;
        $shiftId = $shift->id;

        // Query sales belonging to this shift
        $salesQuery = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->whereIn('status', ['posted', 'returned']);

        $salesCount = (int) (clone $salesQuery)->where('status', 'posted')->count();
        $grossSales = (float) (clone $salesQuery)->where('status', 'posted')->sum('subtotal_gross');
        $itemDiscounts = (float) (clone $salesQuery)->where('status', 'posted')->sum('total_item_discounts');
        $globalDiscounts = (float) (clone $salesQuery)->where('status', 'posted')->sum('global_discount');
        $totalDiscounts = round($itemDiscounts + $globalDiscounts, 2);
        $netSales = (float) (clone $salesQuery)->where('status', 'posted')->sum('net_sales');
        $totalTax = (float) (clone $salesQuery)->where('status', 'posted')->sum('total_tax');
        $totalTips = (float) (clone $salesQuery)->where('status', 'posted')->sum('tip_amount');
        $totalServiceCharges = (float) (clone $salesQuery)->where('status', 'posted')->sum('service_charge');
        $totalDeliveryCharges = (float) (clone $salesQuery)->where('status', 'posted')->sum('delivery_charge');
        $totalExtraCharges = (float) (clone $salesQuery)->where('status', 'posted')->sum('extra_charge_value');
        $totalRevenue = (float) (clone $salesQuery)->where('status', 'posted')->sum('invoice_total');

        // Payment breakdown
        $cashSales = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('status', 'posted')
            ->where(function ($q) {
                $q->where('payment_method', 'cash')
                  ->orWhereNull('payment_method');
            })
            ->sum('invoice_total');

        $cardSales = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('status', 'posted')
            ->whereIn('payment_method', ['card', 'bank', 'digital', 'pos', 'stripe', 'online'])
            ->sum('invoice_total');

        $creditSales = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('status', 'posted')
            ->where('payment_method', 'credit')
            ->sum('invoice_total');

        $otherSales = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('status', 'posted')
            ->whereNotIn('payment_method', ['cash', 'card', 'bank', 'digital', 'pos', 'stripe', 'online', 'credit'])
            ->sum('invoice_total');

        // Cash refunds paid out from drawer
        $cashRefunds = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('status', 'returned')
            ->where(function ($q) {
                $q->where('payment_method', 'cash')
                  ->orWhereNull('payment_method');
            })
            ->sum(DB::raw('ABS(invoice_total)'));

        // Cash movements
        $cashIn = (float) DB::table('shift_cash_movements')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('type', 'in')
            ->sum('amount');

        $cashOut = (float) DB::table('shift_cash_movements')
            ->where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->where('type', 'out')
            ->sum('amount');

        $movements = ShiftCashMovement::where('tenant_id', $tenantId)
            ->where('register_shift_id', $shiftId)
            ->with('user:id,name')
            ->latest('created_at')
            ->get();

        $openingFloat = (float) $shift->opening_float;

        // Canonical physical cash reconciliation formula:
        // Expected drawer cash = opening cash + cash tenders received + cash in - cash refunds - cash out
        $expectedCash = $shift->isOrdersOnly()
            ? 0.00
            : round($openingFloat + $cashSales + $cashIn - $cashRefunds - $cashOut, 2);

        $retainedFloat = (float) ($shift->retained_float ?? $openingFloat);
        $expectedHandover = max(0.0, round($expectedCash - $retainedFloat, 2));

        return [
            'shift_mode'             => $shift->shift_mode,
            'sales_count'            => $salesCount,
            'gross_sales'            => round($grossSales, 2),
            'total_discounts'        => $totalDiscounts,
            'net_sales'              => round($netSales, 2),
            'total_tax'              => round($totalTax, 2),
            'total_tips'             => round($totalTips, 2),
            'total_service_charges'  => round($totalServiceCharges, 2),
            'total_delivery_charges' => round($totalDeliveryCharges, 2),
            'total_extra_charges'    => round($totalExtraCharges, 2),
            'total_revenue'          => round($totalRevenue, 2),
            'payment_breakdown'      => [
                'cash'   => round($cashSales, 2),
                'card'   => round($cardSales, 2),
                'credit' => round($creditSales, 2),
                'other'  => round($otherSales, 2),
            ],
            'opening_float'          => round($openingFloat, 2),
            'cash_sales'             => round($cashSales, 2),
            'cash_refunds'           => round($cashRefunds, 2),
            'cash_in'                => round($cashIn, 2),
            'cash_out'               => round($cashOut, 2),
            'expected_cash'          => $expectedCash,
            'retained_float'         => round($retainedFloat, 2),
            'expected_handover'      => $expectedHandover,
            'cash_movements'         => $movements,
        ];
    }

    /**
     * Generate complete printable Z-Report payload.
     */
    private function generateZReportData(RegisterShift $shift, array $metrics): array
    {
        $tenant = app('current.tenant');
        $storeName = $tenant?->name ?? 'VenQore POS';
        $storeSettings = DB::table('store_settings')->where('tenant_id', $tenant?->id)->first();
        $taxNumber = $storeSettings?->tax_number ?? '';
        $phone = $storeSettings?->phone ?? $tenant?->phone ?? '';
        $address = $storeSettings?->address ?? '';

        $countedCash = (float) ($shift->counted_cash ?? 0);
        $expectedCash = (float) ($metrics['expected_cash'] ?? 0);
        $variance = round($countedCash - $expectedCash, 2);

        return [
            'store' => [
                'name'       => $storeName,
                'tax_number' => $taxNumber,
                'phone'      => $phone,
                'address'    => $address,
            ],
            'shift' => [
                'id'                       => $shift->id,
                'register_id'              => $shift->register_id ?? 'REG-1',
                'shift_mode'               => $shift->shift_mode,
                'opened_by'                => $shift->openedByUser?->name ?? 'Staff',
                'cash_custodian'           => $shift->cashCustodian?->name ?? $shift->openedByUser?->name ?? 'Staff',
                'opened_at'                => $shift->opened_at ? Carbon::parse($shift->opened_at)->toDateTimeString() : null,
                'closed_by'                => $shift->closedByUser?->name ?? Auth::user()?->name ?? 'Manager',
                'closed_at'                => $shift->closed_at ? Carbon::parse($shift->closed_at)->toDateTimeString() : now()->toDateTimeString(),
                'status'                   => $shift->status,
                'notes'                    => $shift->notes,
                'manager_close_reason'     => $shift->manager_close_reason,
                'handover_acknowledged_by' => $shift->handoverAcknowledgedByUser?->name,
                'handover_acknowledged_at' => $shift->handover_acknowledged_at?->toDateTimeString(),
                'denominations'            => $shift->denominations,
            ],
            'sales' => [
                'count'           => $metrics['sales_count'],
                'gross_sales'     => $metrics['gross_sales'],
                'discounts'       => $metrics['total_discounts'],
                'net_sales'       => $metrics['net_sales'],
                'tax'             => $metrics['total_tax'],
                'tips'            => $metrics['total_tips'],
                'service_charges' => $metrics['total_service_charges'],
                'delivery'        => $metrics['total_delivery_charges'],
                'grand_total'     => $metrics['total_revenue'],
            ],
            'tenders' => $metrics['payment_breakdown'],
            'cash_reconciliation' => [
                'shift_mode'        => $shift->shift_mode,
                'opening_float'     => $metrics['opening_float'],
                'cash_sales'        => $metrics['cash_sales'],
                'cash_refunds'      => $metrics['cash_refunds'] ?? 0.00,
                'cash_in'           => $metrics['cash_in'],
                'cash_out'          => $metrics['cash_out'],
                'expected_cash'     => $expectedCash,
                'counted_cash'      => $countedCash,
                'variance'          => $variance,
                'variance_type'     => $variance == 0 ? 'balanced' : ($variance > 0 ? 'overage' : 'shortage'),
                'retained_float'    => (float) ($shift->retained_float ?? $metrics['retained_float'] ?? 0),
                'expected_handover' => (float) ($shift->expected_handover ?? $metrics['expected_handover'] ?? 0),
                'actual_handover'   => (float) ($shift->actual_handover ?? 0),
                'handover_notes'    => $shift->handover_notes,
            ],
            'movements' => $metrics['cash_movements'],
            'printed_at' => now()->toDateTimeString(),
        ];
    }
}
