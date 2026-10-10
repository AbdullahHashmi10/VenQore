<?php

namespace App\Engines;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SettlementService
{
    public function __get($name) {
        if ($name === 'tenantId') {
            return app('current.tenant')->id;
        }
        return null;
    }

    public function __construct(
        private AccountingService $accounting
    ) {
    }

    /**
     * B27 — Final employee settlement.
     * Posts two journal entries atomically:
     *   Entry 1: Accrue final salary + severance components → 2400
     *   Entry 2: Pay out 2400 → Cash
     * Then marks employee as terminated.
     *
     * @param array $data {
     *   employee_id, settlement_date, payment_method,
     *   partial_month_salary, gratuity, notice_pay,
     *   leave_encashment, advance_deduction
     * }
     */
    public function processSettlement(array $data): void
    {
        DB::transaction(function () use ($data) {

            $tid = $this->tenantId;
            $employee = DB::table('employees')
                ->where('tenant_id', $tid)
                ->where('id', $data['employee_id'])
                ->where('status', 'active')
                ->firstOrFail();

            // ZeroDrift Ledger: every component is quantized to the paisa once
            // and the totals are exact integer sums, so accrual = payout + advance
            // recovered, to the paisa.
            $M = fn ($k) => max(0, \App\Support\Money::parseMinor($data[$k] ?? 0, $k, false));
            $F = fn (int $m) => \App\Support\Money::toFloat($m);
            $salaryM    = $M('partial_month_salary');
            $severanceM = $M('gratuity') + $M('notice_pay') + $M('leave_encashment');
            $advanceM   = $M('advance_deduction');
            $accruedM   = $salaryM + $severanceM;
            if ($advanceM > $accruedM) {
                throw new \InvalidArgumentException('The advance to recover is more than the settlement.');
            }

            $partialMonthSalary = $F($salaryM);
            $severanceTotal     = $F($severanceM);
            $advanceDeduction   = $F($advanceM);
            $totalAccrued       = $F($accruedM);
            $netPaid            = $F($accruedM - $advanceM);
            $cashAccount    = ($data['payment_method'] ?? 'cash') === 'bank'
                              ? '1010' : '1000';

            if ($totalAccrued <= 0) {
                throw new \InvalidArgumentException(
                    'Settlement total must be greater than zero.'
                );
            }

            // ── Ensure the GL accounts exist ──────────────────────────
            // A new store's chart (TenantDefaultSeeder) has no 6100 / 6800 /
            // 2400 / 1350, so without this B27 failed with "Account code not
            // found" on every real store. Same provisioning (names, types,
            // normal_balance) as PayrollController, which posts to the same
            // 6100 / 2400 / 1350 accounts.
            if ($partialMonthSalary > 0) {
                $this->accounting->getAccountByCode('6100', 'Salary Expense', 'expense');
            }
            if ($severanceTotal > 0) {
                $this->accounting->getAccountByCode('6800', 'Gratuity & Severance', 'expense');
            }
            $this->accounting->getAccountByCode('2400', 'Salary Payable', 'liability');
            $this->accounting->getAccountByCode($cashAccount, $cashAccount === '1010' ? 'Bank Account' : 'Cash in Hand', 'asset');
            if ($advanceDeduction > 0) {
                $this->accounting->getAccountByCode('1350', 'Employee Advance', 'asset');
            }

            // ── Entry 1: Accrue ───────────────────────────────────────
            $accrualLines = [];

            if ($partialMonthSalary > 0) {
                $accrualLines[] = [
                    'account_code' => '6100',
                    'debit'        => $partialMonthSalary,
                    'credit'       => 0,
                ];
            }

            if ($severanceTotal > 0) {
                $accrualLines[] = [
                    'account_code' => '6800',
                    'debit'        => $severanceTotal,
                    'credit'       => 0,
                ];
            }

            $accrualLines[] = [
                'account_code' => '2400',
                'debit'        => 0,
                'credit'       => $totalAccrued,
            ];

            $this->accounting->createEntry([
                'date'     => $data['settlement_date'],
                'reference_type' => 'settlement_accrual',
                'reference'   => $data['employee_id'],
                'description'    => "Final settlement accrual — {$employee->name}",
                'approved_by'    => $data['approved_by'] ?? null,
            ], $accrualLines);

            // ── Entry 2: Pay out ──────────────────────────────────────
            $paymentLines = [
                [
                    'account_code' => '2400',
                    'debit'        => $totalAccrued,
                    'credit'       => 0,
                ],
                [
                    'account_code' => $cashAccount,
                    'debit'        => 0,
                    'credit'       => $netPaid,
                ],
            ];

            if ($advanceDeduction > 0) {
                $paymentLines[] = [
                    'account_code' => '1350',
                    'debit'        => 0,
                    'credit'       => $advanceDeduction,
                ];
            }

            $this->accounting->createEntry([
                'date'     => $data['settlement_date'],
                'reference_type' => 'settlement_payment',
                'reference'   => $data['employee_id'],
                'description'    => "Final settlement payment — {$employee->name}",
                'approved_by'    => $data['approved_by'] ?? null,
            ], $paymentLines);

            // ── Terminate employee ────────────────────────────────────
            DB::table('employees')
                ->where('tenant_id', $tid)
                ->where('id', $data['employee_id'])
                ->update([
                    'status'           => 'terminated',
                    'termination_date' => $data['settlement_date'],
                    'updated_at'       => now(),
                ]);
        });
    }
}
