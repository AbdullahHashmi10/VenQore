<?php

namespace App\Services\Cheque;

use App\Engines\AccountingService;
use App\Models\ChequeLeaf;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class ChequeLifecycleService
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    /**
     * Atomically reserve a cheque leaf for a document undergoing approval.
     */
    public function reserveForApproval(
        Tenant $tenant,
        string $bankAccountId,
        string $leafId,
        int $approvalDocId,
        float $amount,
        ?string $partyId = null,
        ?string $chequeDate = null,
        ?User $user = null
    ): ChequeLeaf {
        return DB::transaction(function () use (
            $tenant, $bankAccountId, $leafId, $approvalDocId, $amount, $partyId, $chequeDate, $user
        ) {
            /** @var ChequeLeaf $leaf */
            $leaf = ChequeLeaf::where('tenant_id', $tenant->id)
                ->where('bank_account_id', $bankAccountId)
                ->where('id', $leafId)
                ->lockForUpdate()
                ->first();

            if (!$leaf) {
                throw new InvalidArgumentException("Selected cheque leaf does not exist for this bank account.");
            }

            if ($leaf->status !== ChequeLeaf::STATUS_AVAILABLE) {
                throw new RuntimeException("Cheque leaf {$leaf->display_serial_number} is not available (current status: {$leaf->status}).");
            }

            $leaf->update([
                'status'                           => ChequeLeaf::STATUS_RESERVED,
                'reserved_by_approval_document_id' => $approvalDocId,
                'amount'                           => $amount,
                'party_id'                         => $partyId,
                'cheque_date'                      => $chequeDate ?? now()->toDateString(),
                'updated_by'                       => $user?->id ?? auth()->id(),
            ]);

            return $leaf->fresh();
        });
    }

    /**
     * Release a reservation when a document is rejected or withdrawn.
     */
    public function releaseReservation(Tenant $tenant, int $approvalDocId, ?string $reason = null, ?User $user = null): ?ChequeLeaf
    {
        return DB::transaction(function () use ($tenant, $approvalDocId, $reason, $user) {
            /** @var ChequeLeaf $leaf */
            $leaf = ChequeLeaf::where('tenant_id', $tenant->id)
                ->where('reserved_by_approval_document_id', $approvalDocId)
                ->where('status', ChequeLeaf::STATUS_RESERVED)
                ->lockForUpdate()
                ->first();

            if (!$leaf) {
                return null;
            }

            $leaf->update([
                'status'                           => ChequeLeaf::STATUS_AVAILABLE,
                'reserved_by_approval_document_id' => null,
                'amount'                           => null,
                'party_id'                         => null,
                'cheque_date'                      => null,
                'status_reason'                    => $reason ? "Reservation released: {$reason}" : 'Reservation released',
                'updated_by'                       => $user?->id ?? auth()->id(),
            ]);

            return $leaf->fresh();
        });
    }

    /**
     * Handle resubmission / correction of an approval document.
     * If the leaf changed, frees previous leaf and reserves the new one atomically.
     */
    public function updateReservation(
        Tenant $tenant,
        int $approvalDocId,
        string $bankAccountId,
        string $newLeafId,
        float $amount,
        ?string $partyId = null,
        ?string $chequeDate = null,
        ?User $user = null
    ): ChequeLeaf {
        return DB::transaction(function () use (
            $tenant, $approvalDocId, $bankAccountId, $newLeafId, $amount, $partyId, $chequeDate, $user
        ) {
            $currentLeaf = ChequeLeaf::where('tenant_id', $tenant->id)
                ->where('reserved_by_approval_document_id', $approvalDocId)
                ->where('status', ChequeLeaf::STATUS_RESERVED)
                ->lockForUpdate()
                ->first();

            // If same leaf, update metadata
            if ($currentLeaf && $currentLeaf->id === $newLeafId) {
                $currentLeaf->update([
                    'amount'      => $amount,
                    'party_id'    => $partyId,
                    'cheque_date' => $chequeDate ?? now()->toDateString(),
                    'updated_by'  => $user?->id ?? auth()->id(),
                ]);
                return $currentLeaf->fresh();
            }

            // If different leaf, release old and reserve new atomically
            if ($currentLeaf) {
                $currentLeaf->update([
                    'status'                           => ChequeLeaf::STATUS_AVAILABLE,
                    'reserved_by_approval_document_id' => null,
                    'amount'                           => null,
                    'party_id'                         => null,
                    'cheque_date'                      => null,
                    'status_reason'                    => 'Replaced during document correction',
                    'updated_by'                       => $user?->id ?? auth()->id(),
                ]);
            }

            return $this->reserveForApproval(
                $tenant,
                $bankAccountId,
                $newLeafId,
                $approvalDocId,
                $amount,
                $partyId,
                $chequeDate,
                $user
            );
        });
    }

    /**
     * Issue a cheque leaf atomically with a transaction.
     * Can transition from 'available' (direct posting) or from 'reserved' (approval posting).
     */
    public function issueCheque(
        Tenant $tenant,
        string $leafId,
        ?string $paymentId,
        float $amount,
        ?string $partyId,
        string $issueDate,
        ?string $chequeDate = null,
        ?User $user = null,
        ?int $approvalDocId = null
    ): ChequeLeaf {
        return DB::transaction(function () use (
            $tenant, $leafId, $paymentId, $amount, $partyId, $issueDate, $chequeDate, $user, $approvalDocId
        ) {
            /** @var ChequeLeaf $leaf */
            $leaf = ChequeLeaf::where('tenant_id', $tenant->id)
                ->where('id', $leafId)
                ->lockForUpdate()
                ->firstOrFail();

            // Valid origins:
            // 1. Available (direct payment path)
            // 2. Reserved by this exact approval document
            $isDirectAvailable = ($leaf->status === ChequeLeaf::STATUS_AVAILABLE);
            $isMatchingReserved = ($leaf->status === ChequeLeaf::STATUS_RESERVED
                && $approvalDocId !== null
                && (int) $leaf->reserved_by_approval_document_id === (int) $approvalDocId);

            if (!$isDirectAvailable && !$isMatchingReserved) {
                throw new RuntimeException(
                    "Cheque leaf {$leaf->display_serial_number} cannot be issued. Status is '{$leaf->status}'" .
                    ($leaf->reserved_by_approval_document_id ? " (reserved by document #{$leaf->reserved_by_approval_document_id})" : '')
                );
            }

            $leaf->update([
                'status'                           => ChequeLeaf::STATUS_ISSUED,
                'reserved_by_approval_document_id' => null,
                'payment_id'                       => $paymentId,
                'amount'                           => $amount,
                'party_id'                         => $partyId,
                'issue_date'                       => $issueDate,
                'cheque_date'                      => $chequeDate ?? $issueDate,
                'updated_by'                       => $user?->id ?? auth()->id(),
            ]);

            // Update parent chequebook exhaustion status
            $leaf->chequeBook?->updateStatusFromLeaves();

            return $leaf->fresh();
        });
    }

    /**
     * Mark an issued cheque as cleared.
     */
    public function clearIssuedCheque(Tenant $tenant, ChequeLeaf $leaf, ?string $clearedAt = null, ?User $user = null): ChequeLeaf
    {
        if ($leaf->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque leaf does not belong to current tenant.");
        }

        return DB::transaction(function () use ($leaf, $clearedAt, $user) {
            $lockedLeaf = ChequeLeaf::where('id', $leaf->id)->lockForUpdate()->firstOrFail();

            if ($lockedLeaf->status !== ChequeLeaf::STATUS_ISSUED) {
                throw new RuntimeException("Only issued cheques can be marked cleared (current status: {$lockedLeaf->status}).");
            }

            $lockedLeaf->update([
                'status'     => ChequeLeaf::STATUS_CLEARED,
                'cleared_at' => $clearedAt ?? now(),
                'updated_by' => $user?->id ?? auth()->id(),
            ]);

            return $lockedLeaf->fresh();
        });
    }

    /**
     * Mark an issued cheque as bounced and reverse associated accounting entries if present.
     */
    public function bounceIssuedCheque(Tenant $tenant, ChequeLeaf $leaf, string $reason, ?User $user = null): ChequeLeaf
    {
        if ($leaf->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque leaf does not belong to current tenant.");
        }

        return DB::transaction(function () use ($tenant, $leaf, $reason, $user) {
            $lockedLeaf = ChequeLeaf::where('id', $leaf->id)->lockForUpdate()->firstOrFail();

            if ($lockedLeaf->status !== ChequeLeaf::STATUS_ISSUED) {
                throw new RuntimeException("Only issued cheques can be marked bounced (current status: {$lockedLeaf->status}).");
            }

            $lockedLeaf->update([
                'status'        => ChequeLeaf::STATUS_BOUNCED,
                'bounced_at'    => now(),
                'status_reason' => $reason,
                'updated_by'    => $user?->id ?? auth()->id(),
            ]);

            // If linked to a payment, find associated journal entry and reverse it
            if ($lockedLeaf->payment_id) {
                $payment = Payment::where('tenant_id', $tenant->id)->find($lockedLeaf->payment_id);
                if ($payment && $payment->reference) {
                    $entry = DB::table('journal_entries')
                        ->where('tenant_id', $tenant->id)
                        ->where('reference', $payment->reference)
                        ->where('is_reversed', 0)
                        ->first();

                    if ($entry) {
                        $this->accounting->reverseEntry($entry->id, "Bounced company cheque {$lockedLeaf->display_serial_number}: {$reason}");
                    }
                }
            }

            return $lockedLeaf->fresh();
        });
    }

    /**
     * Stop an issued cheque with the bank.
     */
    public function stopCheque(Tenant $tenant, ChequeLeaf $leaf, string $reason, ?User $user = null): ChequeLeaf
    {
        if ($leaf->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque leaf does not belong to current tenant.");
        }

        return DB::transaction(function () use ($tenant, $leaf, $reason, $user) {
            $lockedLeaf = ChequeLeaf::where('id', $leaf->id)->lockForUpdate()->firstOrFail();

            if ($lockedLeaf->status !== ChequeLeaf::STATUS_ISSUED) {
                throw new RuntimeException("Only issued cheques can be stopped (current status: {$lockedLeaf->status}).");
            }

            $lockedLeaf->update([
                'status'        => ChequeLeaf::STATUS_STOPPED,
                'stopped_at'    => now(),
                'status_reason' => $reason,
                'updated_by'    => $user?->id ?? auth()->id(),
            ]);

            // If linked to a payment, reverse the journal entry
            if ($lockedLeaf->payment_id) {
                $payment = Payment::where('tenant_id', $tenant->id)->find($lockedLeaf->payment_id);
                if ($payment && $payment->reference) {
                    $entry = DB::table('journal_entries')
                        ->where('tenant_id', $tenant->id)
                        ->where('reference', $payment->reference)
                        ->where('is_reversed', 0)
                        ->first();

                    if ($entry) {
                        $this->accounting->reverseEntry($entry->id, "Stopped company cheque {$lockedLeaf->display_serial_number}: {$reason}");
                    }
                }
            }

            return $lockedLeaf->fresh();
        });
    }

    /**
     * Void an unused cheque leaf.
     */
    public function voidUnusedCheque(Tenant $tenant, ChequeLeaf $leaf, string $reason, ?User $user = null): ChequeLeaf
    {
        if ($leaf->tenant_id != $tenant->id) {
            throw new RuntimeException("Cheque leaf does not belong to current tenant.");
        }

        return DB::transaction(function () use ($leaf, $reason, $user) {
            $lockedLeaf = ChequeLeaf::where('id', $leaf->id)->lockForUpdate()->firstOrFail();

            if ($lockedLeaf->status !== ChequeLeaf::STATUS_AVAILABLE) {
                throw new RuntimeException("Only available, unused cheques can be voided (current status: {$lockedLeaf->status}).");
            }

            $lockedLeaf->update([
                'status'        => ChequeLeaf::STATUS_VOID,
                'voided_at'     => now(),
                'status_reason' => $reason,
                'updated_by'    => $user?->id ?? auth()->id(),
            ]);

            $lockedLeaf->chequeBook?->updateStatusFromLeaves();

            return $lockedLeaf->fresh();
        });
    }
}
