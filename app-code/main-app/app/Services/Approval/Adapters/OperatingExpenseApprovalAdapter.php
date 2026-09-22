<?php

namespace App\Services\Approval\Adapters;

use App\Engines\AccountingService;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class OperatingExpenseApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_OPERATING_EXPENSE;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Expense amount must be greater than zero.']);
        }

        $categoryId = $payload['expense_category_id'] ?? $payload['category_id'] ?? null;
        if ($categoryId) {
            $catExists = ExpenseCategory::where('tenant_id', $tenant->id)->where('id', $categoryId)->exists();
            if (!$catExists) {
                throw ValidationException::withMessages(['expense_category_id' => 'Invalid expense category selected.']);
            }
        }

        $paymentMethod = $payload['payment_method'] ?? 'cash';
        if (!in_array($paymentMethod, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash or bank.']);
        }

        return [
            'expense_category_id' => $categoryId,
            'category_id'         => $categoryId,
            'amount'              => $amount,
            'payment_method'      => $paymentMethod,
            'bank_account_id'     => $payload['bank_account_id'] ?? null,
            'expense_date'        => $payload['expense_date'] ?? $payload['date'] ?? now()->toDateString(),
            'notes'               => $payload['notes'] ?? $payload['description'] ?? null,
            'reference'           => $payload['reference'] ?? null,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $this->validatePayload($revision->payload, $tenant, $reviewer);
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload = $doc->currentRevision->payload;
        $tenantId = $tenant->id;

        $paymentAccount = $payload['payment_method'] === 'bank' ? '1010' : '1000';
        $bankAccountId = $payload['bank_account_id'] ?? null;

        if ($payload['payment_method'] === 'bank' && empty($bankAccountId)) {
            $firstBank = BankAccount::where('tenant_id', $tenantId)
                ->where('type', 'bank')
                ->first();
            $bankAccountId = $firstBank?->id;
        }

        // Create Expense Model
        $expense = Expense::create([
            'tenant_id'           => $tenantId,
            'expense_category_id' => $payload['expense_category_id'] ?? null,
            'amount'              => $payload['amount'],
            'date'                => $payload['expense_date'],
            'payment_method'      => $payload['payment_method'],
            'bank_account_id'     => $bankAccountId,
            'notes'               => $payload['notes'] ?? 'Operating expense (Approved)',
            'reference'           => $payload['reference'] ?? ('EXP-' . strtoupper(uniqid())),
        ]);

        // General Ledger Entry: DR 5200 Operating Expenses, CR 1000/1010 Cash/Bank
        $journalEntry = $this->accounting->createEntry([
            'date'           => $payload['expense_date'],
            'reference_type' => 'expense',
            'reference'      => $expense->reference,
            'description'    => 'Operating expense (Approved) — ' . ($expense->notes ?? ''),
            'user_id'        => $reviewer->id ?? $doc->maker_id,
            'approved_by'    => $reviewer->id,
        ], [
            [
                'account_code' => '5200',
                'debit'        => $payload['amount'],
                'credit'       => 0,
            ],
            [
                'account_code'    => $paymentAccount,
                'debit'           => 0,
                'credit'          => $payload['amount'],
                'bank_account_id' => $payload['payment_method'] === 'bank' ? $bankAccountId : null,
            ],
        ]);

        return [
            'type'            => 'expense',
            'id'              => $expense->id,
            'reference'       => $expense->reference,
            'journal_entry_id'=> $journalEntry->id,
        ];
    }
}
