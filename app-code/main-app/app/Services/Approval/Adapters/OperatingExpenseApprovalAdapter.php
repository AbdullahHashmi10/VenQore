<?php

namespace App\Services\Approval\Adapters;

use App\Services\ExpensePostingService;
use App\Models\ApprovalDocument;
use App\Models\ExpenseCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class OperatingExpenseApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private ExpensePostingService $postingService
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
            'description'         => $payload['description'] ?? $payload['notes'] ?? null,
            'reference'           => $payload['reference'] ?? null,
            'input_tax'           => (float)($payload['input_tax'] ?? $payload['tax_amount'] ?? 0),
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
        $result = $this->postingService->post($tenant, $payload, $reviewer);

        return [
            'type'             => 'expense',
            'id'               => $result['expense_id'],
            'reference'        => $result['reference'],
            'journal_entry_id' => $result['journal_entry_id'],
        ];
    }
}
