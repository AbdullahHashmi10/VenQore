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
        if (!in_array($paymentMethod, ['cash', 'bank', 'cheque'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash, bank, or cheque.']);
        }

        $bankAccountId = $payload['bank_account_id'] ?? null;
        $chequeLeafId  = $payload['cheque_leaf_id'] ?? null;

        if ($paymentMethod === 'cheque') {
            if (!$bankAccountId) {
                throw ValidationException::withMessages(['bank_account_id' => 'Bank account is required for cheque expense payment.']);
            }

            $ba = \App\Models\BankAccount::where('tenant_id', $tenant->id)->where('id', $bankAccountId)->first();
            if (!$ba || ($ba->type !== 'bank' && $ba->account_type === 'cash')) {
                throw ValidationException::withMessages(['bank_account_id' => 'Cheques must be drawn on a valid company bank account.']);
            }

            if (!$chequeLeafId) {
                $nextLeaf = app(\App\Services\Cheque\ChequeBookService::class)->getNextAvailableLeaf($tenant, $bankAccountId);
                if (!$nextLeaf) {
                    throw ValidationException::withMessages(['cheque_leaf_id' => 'No available cheque leaves found for this bank account.']);
                }
                $chequeLeafId = $nextLeaf->id;
            } else {
                $leaf = \App\Models\ChequeLeaf::where('tenant_id', $tenant->id)
                    ->where('bank_account_id', $bankAccountId)
                    ->where('id', $chequeLeafId)
                    ->first();
                if (!$leaf) {
                    throw ValidationException::withMessages(['cheque_leaf_id' => 'Selected cheque leaf is invalid for this bank account.']);
                }
            }
        }

        return [
            'expense_category_id' => $categoryId,
            'category_id'         => $categoryId,
            'amount'              => $amount,
            'payment_method'      => $paymentMethod,
            'bank_account_id'     => $bankAccountId,
            'cheque_leaf_id'      => $chequeLeafId,
            'cheque_date'         => $payload['cheque_date'] ?? ($payload['expense_date'] ?? ($payload['date'] ?? now()->toDateString())),
            'expense_date'        => $payload['expense_date'] ?? $payload['date'] ?? now()->toDateString(),
            'notes'               => $payload['notes'] ?? $payload['description'] ?? null,
            'description'         => $payload['description'] ?? $payload['notes'] ?? null,
            'reference'           => $payload['reference'] ?? null,
            'input_tax'           => (float)($payload['input_tax'] ?? $payload['tax_amount'] ?? 0),
            // R07 FIX: preserve payee/party identity — the adapter previously dropped
            // these, meaning all approved expenses had no payee on record.
            'payee'               => $payload['payee'] ?? null,
            'party_id'            => $payload['party_id'] ?? $payload['payee_id'] ?? null,
            // R07 FIX: preserve partial payment amount — the ExpensePostingService
            // always paid the full amount; amount_paid lets the posting service know
            // how much was actually settled vs. posted to AP.
            'amount_paid'         => isset($payload['amount_paid'])
                ? min((float)$payload['amount_paid'], round($amount + (float)($payload['input_tax'] ?? 0), 2))
                : null,
            // Service-job linkage for workshop expense attribution.
            'service_job_id'      => $payload['service_job_id'] ?? null,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $payload = $revision->payload;
        if (!empty($payload['cheque_leaf_id'])) {
            $leaf = \App\Models\ChequeLeaf::where('tenant_id', $tenant->id)
                ->where('id', $payload['cheque_leaf_id'])
                ->first();

            if (!$leaf) {
                throw new RuntimeException("The selected cheque leaf no longer exists.");
            }

            $isReservedByThisDoc = ($leaf->status === \App\Models\ChequeLeaf::STATUS_RESERVED
                && (int)$leaf->reserved_by_approval_document_id === (int)$doc->id);
            $isAvailable = ($leaf->status === \App\Models\ChequeLeaf::STATUS_AVAILABLE);

            if (!$isReservedByThisDoc && !$isAvailable) {
                throw new RuntimeException("The reserved cheque leaf ({$leaf->display_serial_number}) is no longer available (status: {$leaf->status}).");
            }
        }

        $this->validatePayload($payload, $tenant, $reviewer);
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

    public function reviewerEligibilityPermissions(): array
    {
        return ['finance.expenses'];
    }

    /**
     * R10: No AND-semantics permission requirements for this adapter type.
     * The OR list in reviewerEligibilityPermissions() is sufficient.
     */
    public function reviewerEligibilityPermissionsAll(): array
    {
        return [];
    }
}
