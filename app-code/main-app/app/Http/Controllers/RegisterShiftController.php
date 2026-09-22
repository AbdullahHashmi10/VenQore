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
            ]);
        }

        $metrics = $this->calculateShiftMetrics($shift);

        return response()->json([
            'has_open_shift' => true,
            'shift'          => $shift,
            'metrics'        => $metrics,
        ]);
    }

    /**
     * Open a new register shift.
     */
    public function open(Request $request): JsonResponse
    {
        $request->validate([
            'opening_float' => 'required|numeric|min:0',
            'register_id'   => 'nullable|string|max:100',
            'notes'         => 'nullable|string|max:1000',
        ]);

        $tenantId = app('current.tenant')->id;
        $userId = Auth::id();
        $registerId = $request->input('register_id', 'REG-1');

        // Check if there is already an open shift for this user / register
        $existing = RegisterShift::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->where(function ($q) use ($registerId, $userId) {
                $q->where('register_id', $registerId)
                  ->orWhere('opened_by', $userId);
            })
            ->first();

        if ($existing) {
            $metrics = $this->calculateShiftMetrics($existing);
            return response()->json([
                'success' => false,
                'message' => 'A shift is already open for this register or cashier.',
                'shift'   => $existing,
                'metrics' => $metrics,
            ], 422);
        }

        $shift = RegisterShift::create([
            'tenant_id'     => $tenantId,
            'register_id'   => $registerId,
            'opened_by'     => $userId,
            'opened_at'     => now(),
            'opening_float' => (float) $request->input('opening_float', 0),
            'status'        => 'open',
            'notes'         => $request->input('notes'),
        ]);

        $shift->load('openedByUser:id,name,email');
        $metrics = $this->calculateShiftMetrics($shift);

        return response()->json([
            'success' => true,
            'message' => 'Register shift opened successfully.',
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
        $request->validate([
            'shift_id'      => 'required|exists:register_shifts,id',
            'counted_cash'  => 'required|numeric|min:0',
            'notes'         => 'nullable|string|max:1000',
            'denominations' => 'nullable|array',
        ]);

        $tenantId = app('current.tenant')->id;
        $shift = RegisterShift::where('tenant_id', $tenantId)
            ->where('id', $request->input('shift_id'))
            ->firstOrFail();

        if ($shift->status !== 'open') {
            return response()->json([
                'success' => false,
                'message' => 'This shift is already closed.',
            ], 422);
        }

        $metrics = $this->calculateShiftMetrics($shift);
        $countedCash = (float) $request->input('counted_cash', 0);
        $expectedCash = (float) $metrics['expected_cash'];
        $variance = round($countedCash - $expectedCash, 2);

        $shift->update([
            'closed_by'     => Auth::id(),
            'closed_at'     => now(),
            'expected_cash' => $expectedCash,
            'counted_cash'  => $countedCash,
            'variance'      => $variance,
            'status'        => 'closed',
            'notes'         => $request->input('notes'),
            'denominations' => $request->input('denominations'),
        ]);

        $shift->load(['openedByUser:id,name,email', 'closedByUser:id,name,email', 'cashMovements.user:id,name']);

        $zReport = $this->generateZReportData($shift, $metrics);

        return response()->json([
            'success'  => true,
            'message'  => 'Register shift closed successfully.',
            'shift'    => $shift,
            'metrics'  => $metrics,
            'z_report' => $zReport,
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
            ->with(['openedByUser:id,name,email', 'closedByUser:id,name,email', 'cashMovements.user:id,name'])
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
            ->with(['openedByUser:id,name', 'closedByUser:id,name'])
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
            ->where('status', 'posted');

        $salesCount = (int) $salesQuery->count();
        $grossSales = (float) $salesQuery->sum('subtotal_gross');
        $itemDiscounts = (float) $salesQuery->sum('total_item_discounts');
        $globalDiscounts = (float) $salesQuery->sum('global_discount');
        $totalDiscounts = round($itemDiscounts + $globalDiscounts, 2);
        $netSales = (float) $salesQuery->sum('net_sales');
        $totalTax = (float) $salesQuery->sum('total_tax');
        $totalTips = (float) $salesQuery->sum('tip_amount');
        $totalServiceCharges = (float) $salesQuery->sum('service_charge');
        $totalDeliveryCharges = (float) $salesQuery->sum('delivery_charge');
        $totalExtraCharges = (float) $salesQuery->sum('extra_charge_value');
        $totalRevenue = (float) $salesQuery->sum('invoice_total');

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
        $expectedCash = round($openingFloat + $cashSales + $cashIn - $cashOut, 2);

        return [
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
            'cash_in'                => round($cashIn, 2),
            'cash_out'               => round($cashOut, 2),
            'expected_cash'          => $expectedCash,
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
        $expectedCash = (float) $metrics['expected_cash'];
        $variance = round($countedCash - $expectedCash, 2);

        return [
            'store' => [
                'name'       => $storeName,
                'tax_number' => $taxNumber,
                'phone'      => $phone,
                'address'    => $address,
            ],
            'shift' => [
                'id'            => $shift->id,
                'register_id'   => $shift->register_id ?? 'REG-1',
                'opened_by'     => $shift->openedByUser?->name ?? 'Cashier',
                'opened_at'     => $shift->opened_at ? Carbon::parse($shift->opened_at)->toDateTimeString() : null,
                'closed_by'     => $shift->closedByUser?->name ?? Auth::user()?->name ?? 'Manager',
                'closed_at'     => $shift->closed_at ? Carbon::parse($shift->closed_at)->toDateTimeString() : now()->toDateTimeString(),
                'status'        => $shift->status,
                'notes'         => $shift->notes,
                'denominations' => $shift->denominations,
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
                'opening_float' => $metrics['opening_float'],
                'cash_sales'    => $metrics['cash_sales'],
                'cash_in'       => $metrics['cash_in'],
                'cash_out'      => $metrics['cash_out'],
                'expected_cash' => $expectedCash,
                'counted_cash'  => $countedCash,
                'variance'      => $variance,
                'variance_type' => $variance == 0 ? 'balanced' : ($variance > 0 ? 'overage' : 'shortage'),
            ],
            'movements' => $metrics['cash_movements'],
            'printed_at' => now()->toDateTimeString(),
        ];
    }
}
