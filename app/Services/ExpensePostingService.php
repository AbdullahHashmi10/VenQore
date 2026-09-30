<?php

namespace App\Services;

use App\Engines\AccountingService;
use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExpensePostingService
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function post(Tenant $tenant, array $payload, ?User $user = null): array
    {
        $tenantId = $tenant->id;
        $amount = (float) $payload['amount'];
        $inputTax = (float) ($payload['input_tax'] ?? $payload['tax_amount'] ?? 0);
        $totalDue = round($amount + $inputTax, 2);
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $expenseDate = $payload['expense_date'] ?? $payload['date'] ?? now()->toDateString();
        $description = $payload['description'] ?? $payload['category'] ?? $payload['notes'] ?? 'Operating expense';
        $reference = $payload['reference'] ?? ('EXP-' . strtoupper(uniqid()));

        // R07 FIX: Support partial payment.
        // When amount_paid is explicitly provided, honour it; the remaining balance
        // goes to AP (2000). This matches the legacy direct path which stored
        // amount_paid on the Expense record without altering the GL posting logic.
        // If amount_paid is null or not provided, default to paying the full total
        // (backward-compatible behaviour).
        $amountPaid = isset($payload['amount_paid']) && $payload['amount_paid'] !== null
            ? round((float)$payload['amount_paid'], 2)
            : $totalDue;
        $amountPaid = max(0.0, min($amountPaid, $totalDue));
        $amountCredit = round($totalDue - $amountPaid, 2); // balance posted to AP

        return CanonicalPostingScope::run(function () use (
            $tenantId, $amount, $inputTax, $totalDue, $amountPaid, $amountCredit,
            $paymentMethod, $expenseDate, $description, $reference, $payload, $user
        ) {
            return DB::transaction(function () use (
                $tenantId, $amount, $inputTax, $totalDue, $amountPaid, $amountCredit,
                $paymentMethod, $expenseDate, $description, $reference, $payload, $user
            ) {
                $cashAccount = in_array($paymentMethod, ['bank', 'cheque'], true) ? '1010' : '1000';
                $bankAccountId = $payload['bank_account_id'] ?? null;

                if (in_array($paymentMethod, ['bank', 'cheque'], true) && empty($bankAccountId)) {
                    $firstBank = BankAccount::where('tenant_id', $tenantId)
                        ->where('type', 'bank')
                        ->first();
                    $bankAccountId = $firstBank?->id;
                }

                // Create Expense Model record
                $expense = Expense::create([
                    'tenant_id'           => $tenantId,
                    'expense_category_id' => $payload['expense_category_id'] ?? $payload['category_id'] ?? null,
                    'amount'              => $amount,
                    'tax_amount'          => $inputTax,
                    'grand_total'         => $totalDue,
                    'amount_paid'         => $amountPaid,
                    'date'                => $expenseDate,
                    'payment_method'      => $paymentMethod,
                    'bank_account_id'     => $bankAccountId,
                    'notes'               => $description,
                    'description'         => $description,
                    'reference'           => $reference,
                    // R07 FIX: preserve payee, party_id and service_job_id
                    'payee'               => $payload['payee'] ?? null,
                    'party_id'            => $payload['party_id'] ?? null,
                    'service_job_id'      => $payload['service_job_id'] ?? null,
                ]);

                // Build journal lines:
                //   DR 6000  Expense (full amount)
                //   DR 2300  Input Tax Recoverable (if any)
                //   CR 1000/1010  Cash/Bank (amount actually paid)
                //   CR 2000  Accounts Payable (unpaid balance, if partial payment)
                $lines = [
                    [
                        'account_code' => '6000',
                        'debit'        => $amount,
                        'credit'       => 0,
                        'description'  => $description,
                    ],
                ];

                if ($inputTax > 0) {
                    $lines[] = [
                        'account_code' => '2300',
                        'debit'        => $inputTax,
                        'credit'       => 0,
                        'description'  => 'Input Tax — ' . $description,
                    ];
                }

                if ($amountPaid > 0) {
                    $lines[] = [
                        'account_code'    => $cashAccount,
                        'debit'           => 0,
                        'credit'          => $amountPaid,
                        'bank_account_id' => in_array($paymentMethod, ['bank', 'cheque'], true) ? $bankAccountId : null,
                    ];
                }

                if ($amountCredit > 0) {
                    // Unpaid balance → Accounts Payable
                    $lines[] = [
                        'account_code' => '2000',
                        'debit'        => 0,
                        'credit'       => $amountCredit,
                        'description'  => 'AP balance — ' . $description,
                    ];
                }

                $journalEntry = $this->accounting->createEntry([
                    'tenant_id'      => $tenantId,
                    'date'           => $expenseDate,
                    'reference_type' => 'operating_expense',
                    'reference'      => $reference,
                    'description'    => 'Expense — ' . $description,
                    'user_id'        => $user?->id ?? auth()->id(),
                ], $lines);

                return [
                    'expense_id'       => $expense->id,
                    'journal_entry_id' => $journalEntry->id,
                    'reference'        => $reference,
                    'amount'           => $amount,
                    'tax_amount'       => $inputTax,
                    'total_paid'       => $amountPaid,
                    'ap_balance'       => $amountCredit,
                ];
            });
        });
    }
}
