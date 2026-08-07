<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\SettlementService;
use Illuminate\Http\Request;

class EmployeeSettlementController extends Controller
{
    public function __construct(
        private SettlementService $settlement
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'          => ['required', 'string', 'exists:employees,id'],
            'settlement_date'      => ['required', 'date', 'before_or_equal:today'],
            'payment_method'       => ['required', 'in:cash,bank'],
            'partial_month_salary' => ['nullable', 'numeric', 'min:0'],
            'gratuity'             => ['nullable', 'numeric', 'min:0'],
            'notice_pay'           => ['nullable', 'numeric', 'min:0'],
            'leave_encashment'     => ['nullable', 'numeric', 'min:0'],
            'advance_deduction'    => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->settlement->processSettlement($validated);

        return redirect()->back()->with('success', 'Employee settlement posted.');
    }
}
