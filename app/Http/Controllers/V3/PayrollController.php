<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PayrollController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    /**
     * B7 — Accrue monthly salary for one or more employees.
     */
    public function accrue(Request $request)
    {
        $validated = $request->validate([
            'period'       => ['required', 'string', 'max:20'], // e.g. "2026-03"
            'accrual_date' => ['required', 'date', 'before_or_equal:today'],
            'lines'        => ['required', 'array', 'min:1'],
            'lines.*.employee_id'    => ['required', 'string',
                                         'exists:employees,id'],
            'lines.*.gross_salary'   => ['required', 'numeric', 'min:0.01'],
        ]);

        $totalGross = array_sum(
            array_column($validated['lines'], 'gross_salary')
        );

        DB::transaction(function () use ($validated, $totalGross) {

            // Single journal entry for the whole payroll run
            $this->accounting->createEntry([
                'date'     => $validated['accrual_date'],
                'reference_type' => 'salary_accrual',
                'reference'   => Str::uuid()->toString(),
                'description'    => "Salary accrual — {$validated['period']}",
            ], [
                [
                    'account_code' => '6100',
                    'debit'        => $totalGross,
                    'credit'       => 0,
                ],
                [
                    'account_code' => '2400',
                    'debit'        => 0,
                    'credit'       => $totalGross,
                ],
            ]);
        });

        return redirect()->back()->with('success', 'Salary accrual posted.');
    }

    /**
     * B8 — Pay salary for a single employee.
     * Deducts any outstanding employee advance from the net payment.
     */
    public function pay(Request $request)
    {
        $validated = $request->validate([
            'employee_id'        => ['required', 'string', 'exists:employees,id'],
            'payment_date'       => ['required', 'date', 'before_or_equal:today'],
            'gross_salary'       => ['required', 'numeric', 'min:0.01'],
            'advance_deduction'  => ['nullable', 'numeric', 'min:0'],
            'payment_method'     => ['required', 'in:cash,bank'],
        ]);

        $tenantId = app('current.tenant')->id;
        $employee = DB::table('employees')
            ->where('tenant_id', $tenantId)
            ->where('id', $validated['employee_id'])
            ->firstOrFail();
        $grossSalary      = (float) $validated['gross_salary'];
        $advanceDeduction = (float) ($validated['advance_deduction'] ?? 0);
        $netPaid          = round($grossSalary - $advanceDeduction, 2);
        $cashAccount      = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        if ($netPaid < 0) {
            return back()->withErrors([
                'advance_deduction' => 'Advance deduction cannot exceed gross salary.',
            ]);
        }

        // Validate advance balance if deduction requested
        if ($advanceDeduction > 0) {
            $advanceBalance = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                ->where('je.tenant_id', $tenantId)
                ->where('a.code', '1350')
                ->where('je.is_reversed', 0)
                ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as balance')
                ->value('balance') ?? 0;

            if ($advanceDeduction > $advanceBalance + 0.01) {
                return back()->withErrors([
                    'advance_deduction' =>
                        "Advance deduction {$advanceDeduction} exceeds " .
                        "outstanding advance balance {$advanceBalance}.",
                ]);
            }
        }

        DB::transaction(function () use (
            $validated, $employee, $grossSalary,
            $advanceDeduction, $netPaid, $cashAccount
        ) {
            $journalLines = [
                [
                    'account_code' => '2400',
                    'debit'        => $grossSalary,
                    'credit'       => 0,
                ],
                [
                    'account_code' => $cashAccount,
                    'debit'        => 0,
                    'credit'       => $netPaid,
                ],
            ];

            // If advance is being recovered, credit 1350 to reduce the asset
            if ($advanceDeduction > 0) {
                $journalLines[] = [
                    'account_code' => '1350',
                    'debit'        => 0,
                    'credit'       => $advanceDeduction,
                ];
            }

            $this->accounting->createEntry([
                'date'     => $validated['payment_date'],
                'reference_type' => 'salary_payment',
                'reference'   => $validated['employee_id'],
                'description'    => "Salary payment — {$employee->name}",
            ], $journalLines);
        });

        return redirect()->back()->with('success', 'Salary payment posted.');
    }
}
