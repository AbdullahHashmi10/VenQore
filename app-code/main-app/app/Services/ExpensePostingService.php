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
        $totalPaid = round($amount + $inputTax, 2);
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $expenseDate = $payload['expense_date'] ?? $payload['date'] ?? now()->toDateString();
        $description = $payload['description'] ?? $payload['category'] ?? $payload['notes'] ?? 'Operating expense';
        $reference = $payload['reference'] ?? ('EXP-' . strtoupper(uniqid()));

        return CanonicalPostingScope::run(function () use ($tenantId, $amount, $inputTax, $totalPaid, $paymentMethod, $expenseDate, $description, $reference, $payload, $user) {
            return DB::transaction(function () use ($tenantId, $amount, $inputTax, $totalPaid, $paymentMethod, $expenseDate, $description, $reference, $payload, $user) {
                $cashAccount = $paymentMethod === 'bank' ? '1010' : '1000';
                $bankAccountId = $payload['bank_account_id'] ?? null;

                if ($paymentMethod === 'bank' && empty($bankAccountId)) {
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
                    'grand_total'         => $totalPaid,
                    'amount_paid'         => $totalPaid,
                    'date'                => $expenseDate,
                    'payment_method'      => $paymentMethod,
                    'bank_account_id'     => $bankAccountId,
                    'notes'               => $description,
                    'description'         => $description,
                    'reference'           => $reference,
                ]);

                $lines = [
                    [
                        'account_code' => '6000',
                        'debit'        => $amount,
                        'credit'       => 0,
                        'description'  => $description,
                    ],
                    [
                        'account_code'    => $cashAccount,
                        'debit'           => 0,
                        'credit'          => $totalPaid,
                        'bank_account_id' => $paymentMethod === 'bank' ? $bankAccountId : null,
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
                    'total_paid'       => $totalPaid,
                ];
            });
        });
    }
}
