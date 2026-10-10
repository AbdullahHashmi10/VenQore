<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'period'       => ['required', 'string', 'max:20'], // e.g. "2026-03"
            'accrual_date' => ['required', 'date', 'before_or_equal:today'],
            'lines'        => ['required', 'array', 'min:1'],
            // Only this store's employees (a bare exists: accepted any store's id).
            'lines.*.employee_id'    => ['required', 'string',
                                         Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'lines.*.gross_salary'   => ['required', 'numeric', 'min:0.01'],
        ]);

        // ZeroDrift Ledger: each salary quantized once; the run is their exact sum.
        $totalGross = \App\Support\Money::toFloat(array_sum(array_map(
            fn ($g) => \App\Support\Money::parseMinor($g, 'gross salary', false),
            array_column($validated['lines'], 'gross_salary')
        )));

        DB::transaction(function () use ($validated, $totalGross) {

            // 6100 / 2400 are not in a new store's default chart
            $this->accounting->getAccountByCode('6100', 'Salary Expense', 'expense');
            $this->accounting->getAccountByCode('2400', 'Salary Payable', 'liability');

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
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            // Only this store's employees (a bare exists: accepted any store's id).
            'employee_id'        => ['required', 'string', Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'payment_date'       => ['required', 'date', 'before_or_equal:today'],
            'gross_salary'       => ['required', 'numeric', 'min:0.01'],
            'advance_deduction'  => ['nullable', 'numeric', 'min:0'],
            'payment_method'     => ['required', 'in:cash,bank'],
        ]);

        $employee = DB::table('employees')
            ->where('tenant_id', $tenantId)
            ->where('id', $validated['employee_id'])
            ->firstOrFail();
        // ZeroDrift Ledger: gross = paid + advance recovered, to the paisa.
        $grossM           = \App\Support\Money::parseMinor($validated['gross_salary'], 'gross salary', false);
        $advanceM         = \App\Support\Money::parseMinor($validated['advance_deduction'] ?? 0, 'advance', false);
        $grossSalary      = \App\Support\Money::toFloat($grossM);
        $advanceDeduction = \App\Support\Money::toFloat($advanceM);
        $netPaid          = \App\Support\Money::toFloat($grossM - $advanceM);
        $cashAccount      = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        if ($netPaid < 0) {
            return back()->withErrors([
                'advance_deduction' => 'Advance deduction cannot exceed gross salary.',
            ]);
        }

        // Validate advance balance if deduction requested — against THIS
        // employee's own outstanding advance, not the store's whole 1350
        // balance (which let one employee's advance be "recovered" from
        // another employee's salary). Every 1350 movement for an employee
        // (advance issued, salary deduction, final settlement) carries the
        // employee id as the journal entry reference.
        if ($advanceDeduction > 0) {
            $advanceBalance = app(\App\Engines\AccountingService::class)->referenceBalance('1350', (string) $validated['employee_id']);

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
            // 2400 / 1350 are not in a new store's default chart
            $this->accounting->getAccountByCode('2400', 'Salary Payable', 'liability');
            $this->accounting->getAccountByCode($cashAccount, $cashAccount === '1010' ? 'Bank Account' : 'Cash in Hand', 'asset');
            if ($advanceDeduction > 0) {
                $this->accounting->getAccountByCode('1350', 'Employee Advance', 'asset');
            }

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
