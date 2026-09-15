<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\SettlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeSettlementController extends Controller
{
    public function __construct(
        private SettlementService $settlement
    ) {}

    public function store(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            // Only this store's employees (a bare exists: accepted any store's id).
            'employee_id'          => ['required', 'string', Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'settlement_date'      => ['required', 'date', 'before_or_equal:today'],
            'payment_method'       => ['required', 'in:cash,bank'],
            'partial_month_salary' => ['nullable', 'numeric', 'min:0'],
            'gratuity'             => ['nullable', 'numeric', 'min:0'],
            'notice_pay'           => ['nullable', 'numeric', 'min:0'],
            'leave_encashment'     => ['nullable', 'numeric', 'min:0'],
            'advance_deduction'    => ['nullable', 'numeric', 'min:0'],
        ]);

        // The advance recovered on settlement cannot exceed THIS employee's own
        // outstanding advance (1350 lines on entries referencing the employee).
        $advanceDeduction = (float) ($validated['advance_deduction'] ?? 0);
        if ($advanceDeduction > 0) {
            $advanceBalance = app(\App\Engines\AccountingService::class)->referenceBalance('1350', (string) $validated['employee_id']);

            if ($advanceDeduction > $advanceBalance + 0.01) {
                return back()->withErrors([
                    'advance_deduction' => "Advance deduction {$advanceDeduction} exceeds " .
                                           "this employee's outstanding advance balance {$advanceBalance}.",
                ]);
            }
        }

        $this->settlement->processSettlement($validated);

        return redirect()->back()->with('success', 'Employee settlement posted.');
    }
}
