<?php

namespace App\Services\V3;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SettlementService
{
    private $tenantId;

    public function __construct(
        private AccountingService $accounting
    ) {
        $this->tenantId = app('current.tenant')->id;
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

            $partialMonthSalary = (float) ($data['partial_month_salary'] ?? 0);
            $gratuity           = (float) ($data['gratuity']             ?? 0);
            $noticePay          = (float) ($data['notice_pay']           ?? 0);
            $leaveEncashment    = (float) ($data['leave_encashment']     ?? 0);
            $advanceDeduction   = (float) ($data['advance_deduction']    ?? 0);

            $severanceTotal = $gratuity + $noticePay + $leaveEncashment;
            $totalAccrued   = $partialMonthSalary + $severanceTotal;
            $netPaid        = round($totalAccrued - $advanceDeduction, 2);
            $cashAccount    = ($data['payment_method'] ?? 'cash') === 'bank'
                              ? '1010' : '1000';

            if ($totalAccrued <= 0) {
                throw new \InvalidArgumentException(
                    'Settlement total must be greater than zero.'
                );
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
