<?php

namespace App\Services\Approval\Adapters;

use App\Services\SupplierPaymentPostingService;
use App\Models\ApprovalDocument;
use App\Models\Party;
use App\Models\Purchase;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class SupplierPaymentApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private SupplierPaymentPostingService $postingService
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_SUPPLIER_PAYMENT;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $supplierId = $payload['supplier_id'] ?? ($payload['party_id'] ?? null);
        if (!$supplierId || !Party::where('tenant_id', $tenant->id)->where('id', $supplierId)->exists()) {
            throw ValidationException::withMessages(['supplier_id' => 'Invalid or cross-tenant supplier selected.']);
        }

        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Payment amount must be greater than zero.']);
        }

        $paymentMethod = $payload['payment_method'] ?? 'cash';
        if (!in_array($paymentMethod, ['cash', 'bank', 'cheque'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash, bank, or cheque.']);
        }

        $bankAccountId = $payload['bank_account_id'] ?? null;
        $chequeLeafId  = $payload['cheque_leaf_id'] ?? null;

        if ($paymentMethod === 'cheque') {
            if (!$bankAccountId) {
                throw ValidationException::withMessages(['bank_account_id' => 'Bank account is required for cheque payments.']);
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

        $allocations = (array)($payload['allocations'] ?? []);
        $allocTotal = 0.0;
        foreach ($allocations as $i => $alloc) {
            $purchaseId = $alloc['purchase_id'] ?? null;
            $allocAmount = (float)($alloc['amount'] ?? 0);

            if ($allocAmount <= 0) {
                throw ValidationException::withMessages(["allocations.{$i}.amount" => 'Allocation amount must be positive.']);
            }

            if (class_exists(Purchase::class)) {
                $purchase = Purchase::where('tenant_id', $tenant->id)
                    ->where('id', $purchaseId)
                    ->where('party_id', $supplierId)
                    ->first();

                if (!$purchase) {
                    throw ValidationException::withMessages(["allocations.{$i}.purchase_id" => 'Purchase bill does not belong to the selected supplier or current store.']);
                }
            }

            $allocTotal += $allocAmount;
        }

        if (!empty($allocations) && round($allocTotal, 2) > round($amount, 2)) {
            throw ValidationException::withMessages(['allocations' => "Total allocations ({$allocTotal}) exceed payment amount ({$amount})."]);
        }

        return [
            'supplier_id'     => $supplierId,
            'payment_date'    => $payload['payment_date'] ?? now()->toDateString(),
            'payment_method'  => $paymentMethod,
            'bank_account_id' => $bankAccountId,
            'cheque_leaf_id'  => $chequeLeafId,
            'cheque_date'     => $payload['cheque_date'] ?? ($payload['payment_date'] ?? now()->toDateString()),
            'amount'          => $amount,
            'reference'       => $payload['reference'] ?? null,
            'allocations'     => $allocations,
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
            'type'             => 'journal_entry',
            'id'               => $result['journal_entry_id'],
            'reference'        => $result['reference'],
            'journal_entry_id' => $result['journal_entry_id'],
            'payment_id'       => $result['payment_id'] ?? null,
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['finance.send_payment'];
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
