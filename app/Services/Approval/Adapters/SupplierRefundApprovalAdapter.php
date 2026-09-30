<?php

namespace App\Services\Approval\Adapters;

use App\Engines\AccountingService;
use App\Engines\PaymentService;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\DebitNote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Supplier Refund — cash received BACK from a supplier against an approved debit note.
 *
 * GL posting:
 *   DR 1000  Cash / 1010 Bank     (cash coming into the store from supplier)
 *   CR 2000  Accounts Payable     (offsets the debit note's reduction of AP)
 */
class SupplierRefundApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService    $payments
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_SUPPLIER_REFUND;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $debitNoteId = $payload['debit_note_id'] ?? null;
        if (!$debitNoteId) {
            throw ValidationException::withMessages(['debit_note_id' => 'A debit note is required for a supplier refund.']);
        }

        $note = DebitNote::where('id', $debitNoteId)
            ->whereHas('supplier', fn($q) => $q->where('tenant_id', $tenant->id))
            ->first();

        if (!$note) {
            throw ValidationException::withMessages(['debit_note_id' => 'Debit note not found or does not belong to this store.']);
        }

        if ($note->status !== 'approved') {
            throw ValidationException::withMessages(['debit_note_id' => 'Only approved debit notes can be refunded. Status: ' . $note->status]);
        }

        $refundMethod = $payload['refund_method'] ?? $payload['payment_method'] ?? 'cash';
        if (!in_array($refundMethod, ['cash', 'bank'], true)) {
            throw ValidationException::withMessages(['refund_method' => 'Refund method must be cash or bank.']);
        }

        $amount = (float)($payload['amount'] ?? $note->amount);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Refund amount must be greater than zero.']);
        }

        return [
            'debit_note_id'   => $debitNoteId,
            'supplier_id'     => $note->supplier_id,
            'purchase_id'     => $note->purchase_id,
            'refund_method'   => $refundMethod,
            'bank_account_id' => $payload['bank_account_id'] ?? null,
            'refund_date'     => $payload['refund_date'] ?? $payload['payment_date'] ?? now()->toDateString(),
            'amount'          => $amount,
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $debitNoteId = $revision->payload['debit_note_id'] ?? null;
        $note = $debitNoteId ? DebitNote::find($debitNoteId) : null;

        if (!$note || $note->status !== 'approved') {
            throw new RuntimeException('Debit note is no longer in approved status and cannot be refunded.');
        }
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload       = $doc->currentRevision->payload;
        $debitNoteId   = $payload['debit_note_id'];
        $supplierId    = $payload['supplier_id'];
        $amount        = (float)$payload['amount'];
        $refundMethod  = $payload['refund_method'] ?? 'cash';
        $bankAccountId = $payload['bank_account_id'] ?? null;

        $cashCode = '1000';
        if ($refundMethod === 'bank') {
            $cashCode = '1010';
            if (!empty($bankAccountId)) {
                $ba = BankAccount::find($bankAccountId);
                if ($ba && $ba->account_id) {
                    $acc = \App\Models\Account::find($ba->account_id);
                    if ($acc) {
                        $cashCode = $acc->code;
                    }
                }
            }
        }

        app()->instance('current.tenant', $tenant);

        $entry = $this->accounting->createEntry([
            'date'           => $payload['refund_date'] ?? now()->toDateString(),
            'reference_type' => 'supplier_refund',
            'reference'      => $debitNoteId,
            'description'    => "Refund received from supplier (Debit Note #{$debitNoteId})",
            'party_id'       => $supplierId,
            'user_id'        => $reviewer->id,
        ], [
            [
                'account_code' => $cashCode,
                'debit'        => $amount,
                'credit'       => 0,
            ],
            [
                'account_code' => '2000',
                'debit'        => 0,
                'credit'       => $amount,
                'party_id'     => $supplierId,
            ],
        ]);

        DebitNote::where('id', $debitNoteId)->update(['status' => 'refunded']);

        $purchaseId = $payload['purchase_id'] ?? null;
        if ($purchaseId) {
            $this->payments->updatePurchaseBadge($purchaseId);
        }

        return [
            'type'             => 'journal_entry',
            'id'               => $entry->id,
            'reference'        => $entry->reference,
            'journal_entry_id' => $entry->id,
            'debit_note_id'    => $debitNoteId,
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['finance.supplier_refund'];
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
