<?php

namespace App\Services\Approval\Adapters;

use App\Engines\AccountingService;
use App\Models\ApprovalDocument;
use App\Models\BankAccount;
use App\Models\Party;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Customer Refund — standalone cash/bank payment to settle an existing customer credit.
 *
 * GL posting:
 *   DR 1200  Accounts Receivable   (settles customer credit balance)
 *   CR 1000  Cash / 1010 Bank      (funds disbursed to customer)
 *
 * R15: Distinct from atomic return-with-refund (handled by SalesReturnApprovalAdapter).
 * This settles prior customer credits without redoing stock or revenue effects.
 */
class CustomerRefundApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_CUSTOMER_REFUND;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $customerId = $payload['customer_id'] ?? $payload['party_id'] ?? null;
        if (!$customerId || !Party::where('tenant_id', $tenant->id)
                ->where('id', $customerId)
                ->where('type', 'customer')
                ->exists()) {
            throw ValidationException::withMessages(['customer_id' => 'Invalid or cross-tenant customer selected.']);
        }

        $amount = (float)($payload['amount'] ?? 0);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Refund amount must be greater than zero.']);
        }

        $paymentMethod = $payload['payment_method'] ?? 'cash';
        if (!in_array($paymentMethod, ['cash', 'bank', 'cheque'], true)) {
            throw ValidationException::withMessages(['payment_method' => 'Payment method must be cash, bank, or cheque.']);
        }

        $bankAccountId = $payload['bank_account_id'] ?? null;
        $chequeLeafId  = $payload['cheque_leaf_id'] ?? null;

        if ($paymentMethod === 'cheque') {
            if (!$bankAccountId) {
                throw ValidationException::withMessages(['bank_account_id' => 'Bank account is required for cheque refund.']);
            }

            $ba = BankAccount::where('tenant_id', $tenant->id)->where('id', $bankAccountId)->first();
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
            'customer_id'     => $customerId,
            'amount'          => $amount,
            'payment_method'  => $paymentMethod,
            'bank_account_id' => $bankAccountId,
            'cheque_leaf_id'  => $chequeLeafId,
            'cheque_date'     => $payload['cheque_date'] ?? ($payload['payment_date'] ?? now()->toDateString()),
            'payment_date'    => $payload['payment_date'] ?? now()->toDateString(),
            'reason'          => $payload['reason'] ?? $payload['notes'] ?? null,
            'reference'       => $payload['reference'] ?? null,
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
        $payload       = $doc->currentRevision->payload;
        $amount        = (float)$payload['amount'];
        $paymentMethod = $payload['payment_method'] ?? 'cash';
        $bankAccountId = $payload['bank_account_id'] ?? null;
        $customerId    = $payload['customer_id'];

        $cashCode = in_array($paymentMethod, ['bank', 'cheque'], true) ? '1010' : '1000';

        if (in_array($paymentMethod, ['bank', 'cheque'], true) && empty($bankAccountId)) {
            $firstBank = BankAccount::where('tenant_id', $tenant->id)->where('type', 'bank')->first();
            $bankAccountId = $firstBank?->id;
        }

        app()->instance('current.tenant', $tenant);

        $payment = \App\Models\Payment::create([
            'tenant_id'       => $tenant->id,
            'date'            => $payload['payment_date'] ?? now()->toDateString(),
            'type'            => 'out',
            'party_id'        => $customerId,
            'amount'          => $amount,
            'method'          => $paymentMethod,
            'bank_account_id' => in_array($paymentMethod, ['bank', 'cheque'], true) ? $bankAccountId : null,
            'reference'       => $payload['reference'] ?? null,
            'notes'           => $payload['reason'] ?? 'Customer refund (approved)',
            'cheque_date'     => $payload['cheque_date'] ?? null,
        ]);

        $entry = $this->accounting->createEntry([
            'date'           => $payload['payment_date'] ?? now()->toDateString(),
            'reference_type' => 'customer_refund',
            'reference'      => $payment->reference ?: Str::uuid()->toString(),
            'description'    => 'Customer refund' . ($payload['reason'] ? ' — ' . $payload['reason'] : ''),
            'party_id'       => $customerId,
            'user_id'        => $reviewer->id,
        ], [
            [
                'account_code' => '1200',
                'debit'        => $amount,
                'credit'       => 0,
                'party_id'     => $customerId,
            ],
            [
                'account_code'    => $cashCode,
                'debit'           => 0,
                'credit'          => $amount,
                'bank_account_id' => in_array($paymentMethod, ['bank', 'cheque'], true) ? $bankAccountId : null,
            ],
        ]);

        return [
            'type'             => 'payment',
            'id'               => $payment->id,
            'payment_id'       => $payment->id,
            'reference'        => $entry->reference,
            'journal_entry_id' => $entry->id,
        ];
    }

    public function reviewerEligibilityPermissions(): array
    {
        return ['finance.customer_refund'];
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
