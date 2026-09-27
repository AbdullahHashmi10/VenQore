<?php

namespace App\Services\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalTransition;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\Adapters\ApprovalAdapterInterface;
use App\Services\Approval\Adapters\CapitalInjectionApprovalAdapter;
use App\Services\Approval\Adapters\CustomerReceiptApprovalAdapter;
use App\Services\Approval\Adapters\CustomerRefundApprovalAdapter;
use App\Services\Approval\Adapters\FundTransferApprovalAdapter;
use App\Services\Approval\Adapters\BalanceAdjustmentApprovalAdapter;
use App\Services\Approval\Adapters\OperatingExpenseApprovalAdapter;
use App\Services\Approval\Adapters\OwnerDrawingsApprovalAdapter;
use App\Services\Approval\Adapters\PurchasePostingApprovalAdapter;
use App\Services\Approval\Adapters\PurchaseReturnApprovalAdapter;
use App\Services\Approval\Adapters\SalesInvoiceApprovalAdapter;
use App\Services\Approval\Adapters\SalesReturnApprovalAdapter;
use App\Services\Approval\Adapters\SupplierPaymentApprovalAdapter;
use App\Services\Approval\Adapters\SupplierRefundApprovalAdapter;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class ApprovalExecutionEngine
{
    /** @var array<string, ApprovalAdapterInterface> */
    private array $adapters;

    public function __construct(
        private ApprovalStateMachine $stateMachine,
        private ApprovalPolicyResolver $policyResolver,
        CustomerReceiptApprovalAdapter  $customerReceipt,
        SupplierPaymentApprovalAdapter  $supplierPayment,
        SalesInvoiceApprovalAdapter     $salesInvoice,
        OperatingExpenseApprovalAdapter $operatingExpense,
        CustomerRefundApprovalAdapter   $customerRefund,
        SupplierRefundApprovalAdapter   $supplierRefund,
        PurchasePostingApprovalAdapter  $purchasePosting,
        SalesReturnApprovalAdapter      $salesReturn,
        PurchaseReturnApprovalAdapter   $purchaseReturn,
        CapitalInjectionApprovalAdapter $capitalInjection,
        OwnerDrawingsApprovalAdapter    $ownerDrawings,
        FundTransferApprovalAdapter        $fundTransfer,
        BalanceAdjustmentApprovalAdapter   $balanceAdjustment
    ) {
        $this->adapters = [
            ApprovalDocument::TYPE_CUSTOMER_RECEIPT  => $customerReceipt,
            ApprovalDocument::TYPE_SUPPLIER_PAYMENT  => $supplierPayment,
            ApprovalDocument::TYPE_SALES_INVOICE     => $salesInvoice,
            ApprovalDocument::TYPE_OPERATING_EXPENSE => $operatingExpense,
            ApprovalDocument::TYPE_CUSTOMER_REFUND   => $customerRefund,
            ApprovalDocument::TYPE_SUPPLIER_REFUND   => $supplierRefund,
            ApprovalDocument::TYPE_PURCHASE_POSTING  => $purchasePosting,
            ApprovalDocument::TYPE_SALES_RETURN      => $salesReturn,
            ApprovalDocument::TYPE_PURCHASE_RETURN   => $purchaseReturn,
            ApprovalDocument::TYPE_CAPITAL_INJECTION => $capitalInjection,
            ApprovalDocument::TYPE_OWNER_DRAWINGS    => $ownerDrawings,
            ApprovalDocument::TYPE_FUND_TRANSFER     => $fundTransfer,
            ApprovalDocument::TYPE_BALANCE_ADJUSTMENT => $balanceAdjustment,
        ];
    }

    public function getAdapter(string $type): ApprovalAdapterInterface
    {
        if (!isset($this->adapters[$type])) {
            throw new InvalidArgumentException("No approval adapter registered for type '{$type}'.");
        }
        return $this->adapters[$type];
    }

    /**
     * Reviewer eligibility, scoped per document type. Holding a generic
     * transition permission (approvals.review/approve/reject/return) is
     * necessary but not sufficient: the reviewer must ALSO hold the business
     * permission the document type's adapter declares via
     * reviewerEligibilityPermissions() — e.g. approving a supplier_payment
     * document requires finance.send_payment, not just approvals.review.
     * This is what stops a manager's broad, generic review grant from
     * doubling as financial approval authority it was never given.
     *
     * Owner, admin, and platform admins are exempt (blanket authority
     * elsewhere in the permission model already covers them).
     *
     * @throws RuntimeException if the reviewer lacks the required business permission
     */
    private function assertReviewerEligible(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        if ($reviewer->isPlatformAdmin()) {
            return;
        }

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $reviewer->id)->first();
        $role = $membership?->role;

        if ($role === 'owner' || $role === 'admin') {
            return;
        }

        $adapter = $this->getAdapter($doc->document_type);

        // OR-semantics: reviewer must hold at least ONE of these permissions.
        $requiredPerms = $adapter->reviewerEligibilityPermissions();

        if (!empty($requiredPerms)) {
            $hasAny = false;
            foreach ($requiredPerms as $perm) {
                if ($reviewer->hasPermission($perm)) {
                    $hasAny = true;
                    break;
                }
            }
            if (!$hasAny) {
                throw new RuntimeException(
                    "User {$reviewer->id} holds a general review permission but not the business " .
                    "authority required for '{$doc->document_type}' documents (needs one of: " .
                    implode(', ', $requiredPerms) . ').'
                );
            }
        }

        // R10 FIX: AND-semantics: reviewer must hold ALL of these permissions.
        // Adapters like SalesReturn declare multiple authorities that must all be
        // held simultaneously — having only one is insufficient.
        $requiredPermsAll = $adapter->reviewerEligibilityPermissionsAll();

        if (!empty($requiredPermsAll)) {
            foreach ($requiredPermsAll as $perm) {
                if (!$reviewer->hasPermission($perm)) {
                    throw new RuntimeException(
                        "User {$reviewer->id} lacks required business permission '{$perm}' " .
                        "to review '{$doc->document_type}' documents. All of the following must be held: " .
                        implode(', ', $requiredPermsAll) . '.'
                    );
                }
            }
        }
    }

    public function getAdapters(): array
    {
        return $this->adapters;
    }

    /**
     * Determine all document types a user is eligible to review/decide in the tenant.
     * Platform admins and tenant owner/admin have universal reviewer authority.
     * Other roles must possess general review permission AND the specific business permission for each adapter.
     */
    public function getEligibleDocumentTypes(Tenant $tenant, User $reviewer): array
    {
        if ($reviewer->isPlatformAdmin()) {
            return array_keys($this->adapters);
        }

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $reviewer->id)->first();
        $role = $membership?->role;

        if ($role === 'owner' || $role === 'admin') {
            return array_keys($this->adapters);
        }

        $hasGeneralReview = $reviewer->hasPermission('approvals.review')
            || $reviewer->hasPermission('approvals.approve')
            || $reviewer->hasPermission('approvals.reject')
            || $reviewer->hasPermission('approvals.return');

        if (!$hasGeneralReview) {
            return [];
        }

        $eligible = [];
        foreach ($this->adapters as $type => $adapter) {
            $requiredPerms = $adapter->reviewerEligibilityPermissions();

            // OR check: at least ONE must be held (unless list is empty)
            if (!empty($requiredPerms)) {
                $hasAny = false;
                foreach ($requiredPerms as $perm) {
                    if ($reviewer->hasPermission($perm)) {
                        $hasAny = true;
                        break;
                    }
                }
                if (!$hasAny) {
                    continue;
                }
            }

            // R10 FIX: AND check — reviewer must hold ALL of these.
            $requiredPermsAll = $adapter->reviewerEligibilityPermissionsAll();
            if (!empty($requiredPermsAll)) {
                $hasAll = true;
                foreach ($requiredPermsAll as $perm) {
                    if (!$reviewer->hasPermission($perm)) {
                        $hasAll = false;
                        break;
                    }
                }
                if (!$hasAll) {
                    continue;
                }
            }

            $eligible[] = $type;
        }

        return $eligible;
    }

    /**
     * Submit new document for approval.
     */
    public function submit(
        Tenant $tenant,
        User $maker,
        string $documentType,
        array $payload,
        float $amount,
        ?string $description = null,
        ?string $idempotencyKey = null
    ): ApprovalDocument {
        app()->instance('current.tenant', $tenant);
        $adapter = $this->getAdapter($documentType);
        $normalizedPayload = $adapter->validatePayload($payload, $tenant, $maker);

        $doc = $this->stateMachine->submitNew(
            tenantId: $tenant->id,
            documentType: $documentType,
            maker: $maker,
            payload: $normalizedPayload,
            amount: $amount,
            description: $description,
            idempotencyKey: $idempotencyKey
        );

        if (!empty($normalizedPayload['cheque_leaf_id']) && !empty($normalizedPayload['bank_account_id'])) {
            app(\App\Services\Cheque\ChequeLifecycleService::class)->reserveForApproval(
                tenant: $tenant,
                bankAccountId: $normalizedPayload['bank_account_id'],
                leafId: $normalizedPayload['cheque_leaf_id'],
                approvalDocId: $doc->id,
                amount: $amount,
                partyId: $normalizedPayload['supplier_id'] ?? $normalizedPayload['customer_id'] ?? $normalizedPayload['party_id'] ?? null,
                chequeDate: $normalizedPayload['cheque_date'] ?? $normalizedPayload['payment_date'] ?? null,
                user: $maker
            );
        }

        return $doc;
    }

    /**
     * Reviewer approves document with lock and single-transaction execution.
     */
    public function approve(
        int $documentId,
        Tenant $tenant,
        User $reviewer,
        ?int $expectedVersion = null,
        ?string $reviewerNotes = null
    ): array {
        app()->instance('current.tenant', $tenant);
        return DB::transaction(function () use ($documentId, $tenant, $reviewer, $expectedVersion, $reviewerNotes) {
            /** @var ApprovalDocument $doc */
            $doc = ApprovalDocument::where('tenant_id', $tenant->id)
                ->where('id', $documentId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($doc->status !== ApprovalDocument::STATUS_PENDING) {
                throw new RuntimeException("Cannot approve document with status '{$doc->status}'. Must be 'pending'.");
            }

            if ($expectedVersion !== null && (int)$doc->version !== (int)$expectedVersion) {
                throw new RuntimeException("Version conflict: document version {$doc->version} does not match expected {$expectedVersion}.");
            }

            // Check reviewer permission. approvals.inbox (view-only) is deliberately
            // NOT accepted here: viewing the inbox must never authorize a decision.
            $hasReviewPerm = $reviewer->hasPermission('approvals.review') ||
                             $reviewer->hasPermission('approvals.approve') ||
                             $reviewer->isPlatformAdmin();

            if (!$hasReviewPerm) {
                throw new RuntimeException("User {$reviewer->id} does not have permission to review approval documents.");
            }

            // Per-document-type business authority (see assertReviewerEligible doc).
            $this->assertReviewerEligible($doc, $tenant, $reviewer);

            // Strict Owner Separation Setting
            $strictOwnerSetting = Setting::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('key', 'approval_strict_owner_separation')
                ->value('value');
            $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

            $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $reviewer->id)->first();
            $isOwner = ($membership?->role === 'owner');

            if ($doc->maker_id === $reviewer->id) {
                if ($strictOwnerSeparation || !$isOwner) {
                    throw new RuntimeException("Separation of duties violation: Maker cannot approve their own submission.");
                }
            }

            $adapter = $this->getAdapter($doc->document_type);

            // Revalidate against live database state
            $adapter->revalidate($doc, $tenant, $reviewer);

            // Execute operational and financial posting atomically within canonical posting scope
            $postedResult = \App\Services\CanonicalPostingScope::run(function () use ($adapter, $doc, $tenant, $reviewer) {
                return $adapter->post($doc, $tenant, $reviewer);
            });

            // If a cheque leaf was reserved for this document, atomically issue it
            $payload = $doc->currentRevision?->payload ?? [];
            if (!empty($payload['cheque_leaf_id'])) {
                app(\App\Services\Cheque\ChequeLifecycleService::class)->issueCheque(
                    tenant: $tenant,
                    leafId: $payload['cheque_leaf_id'],
                    paymentId: $postedResult['payment_id'] ?? ($postedResult['id'] ?? null),
                    amount: (float)$doc->amount,
                    partyId: $payload['supplier_id'] ?? $payload['customer_id'] ?? $payload['party_id'] ?? null,
                    issueDate: now()->toDateString(),
                    chequeDate: $payload['cheque_date'] ?? $payload['payment_date'] ?? null,
                    user: $reviewer,
                    approvalDocId: $doc->id
                );
            }

            // Update document to approved
            $fromStatus = $doc->status;
            $doc->status = ApprovalDocument::STATUS_APPROVED;
            $doc->reviewer_id = $reviewer->id;
            $doc->posted_entity_type = $postedResult['type'] ?? null;
            $doc->posted_entity_id = $postedResult['id'] ?? null;
            $doc->posted_at = now();
            $doc->version = (int)$doc->version + 1;
            $doc->save();

            ApprovalTransition::create([
                'approval_document_id' => $doc->id,
                'actor_id'             => $reviewer->id,
                'source_revision_id'   => $doc->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_APPROVED,
                'reason_codes'         => ['APPROVED'],
                'notes'                => $reviewerNotes ?: 'Approved and posted to ledger',
                'metadata'             => [
                    'posted_entity' => $postedResult,
                    'version'       => $doc->version,
                ],
            ]);

            return [
                'success'           => true,
                'document'          => $doc->fresh(['currentRevision', 'transitions']),
                'posted_result'     => $postedResult,
            ];
        });
    }

    /**
     * Reviewer rejects document.
     */
    public function reject(
        int $documentId,
        Tenant $tenant,
        User $reviewer,
        ?string $reason = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        app()->instance('current.tenant', $tenant);

        // approvals.inbox (view-only) is deliberately NOT accepted: viewing the
        // inbox must never authorize a decision.
        $hasReviewPerm = $reviewer->hasPermission('approvals.review') ||
                         $reviewer->hasPermission('approvals.reject') ||
                         $reviewer->isPlatformAdmin();

        if (!$hasReviewPerm) {
            throw new RuntimeException("User {$reviewer->id} does not have permission to reject approval documents.");
        }

        /** @var ApprovalDocument $doc */
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();

        // Per-document-type business authority (see assertReviewerEligible doc).
        $this->assertReviewerEligible($doc, $tenant, $reviewer);

        $strictOwnerSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $reviewer->id)->first();
        $isOwner = ($membership?->role === 'owner');

        if ($doc->maker_id === $reviewer->id && ($strictOwnerSeparation || !$isOwner)) {
            throw new RuntimeException("Separation of duties violation: Maker cannot reject their own submission.");
        }

        $rejectedDoc = $this->stateMachine->rejectDocument($doc, $reviewer, $reason, $expectedVersion);

        app(\App\Services\Cheque\ChequeLifecycleService::class)->releaseReservation(
            tenant: $tenant,
            approvalDocId: $doc->id,
            reason: $reason ?? 'Approval document rejected',
            user: $reviewer
        );

        return $rejectedDoc;
    }

    /**
     * Reviewer returns document for correction.
     */
    public function returnDocument(
        int $documentId,
        Tenant $tenant,
        User $reviewer,
        array $reasonCodes,
        ?string $notes = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        app()->instance('current.tenant', $tenant);

        // approvals.inbox (view-only) is deliberately NOT accepted: viewing the
        // inbox must never authorize a decision.
        $hasReviewPerm = $reviewer->hasPermission('approvals.review') ||
                         $reviewer->hasPermission('approvals.return') ||
                         $reviewer->isPlatformAdmin();

        if (!$hasReviewPerm) {
            throw new RuntimeException("User {$reviewer->id} does not have permission to return approval documents.");
        }

        /** @var ApprovalDocument $doc */
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();

        // Per-document-type business authority (see assertReviewerEligible doc).
        $this->assertReviewerEligible($doc, $tenant, $reviewer);

        $strictOwnerSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $reviewer->id)->first();
        $isOwner = ($membership?->role === 'owner');

        if ($doc->maker_id === $reviewer->id && ($strictOwnerSeparation || !$isOwner)) {
            throw new RuntimeException("Separation of duties violation: Maker cannot return their own submission.");
        }

        return $this->stateMachine->returnDocument($doc, $reviewer, $reasonCodes, $notes, $expectedVersion);
    }

    /**
     * Maker withdraws a pending or returned document.
     */
    public function withdraw(
        int $documentId,
        Tenant $tenant,
        User $maker,
        ?string $reason = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        app()->instance('current.tenant', $tenant);

        /** @var ApprovalDocument $doc */
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();

        if ($doc->maker_id !== $maker->id && !$maker->isPlatformAdmin()) {
            throw new RuntimeException("Only the document maker can withdraw this submission.");
        }

        $withdrawnDoc = $this->stateMachine->withdrawDocument($doc, $maker, $reason, $expectedVersion);

        app(\App\Services\Cheque\ChequeLifecycleService::class)->releaseReservation(
            tenant: $tenant,
            approvalDocId: $doc->id,
            reason: $reason ?? 'Approval document withdrawn',
            user: $maker
        );

        return $withdrawnDoc;
    }

    /**
     * Maker resubmits returned document with correction.
     */
    public function resubmit(
        int $documentId,
        Tenant $tenant,
        User $maker,
        array $updatedPayload,
        float $updatedAmount,
        ?string $notes = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        app()->instance('current.tenant', $tenant);

        /** @var ApprovalDocument $doc */
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();

        if ($doc->maker_id !== $maker->id) {
            throw new RuntimeException("Only the document maker can resubmit this submission.");
        }

        $adapter = $this->getAdapter($doc->document_type);
        $normalizedPayload = $adapter->validatePayload($updatedPayload, $tenant, $maker);

        // R09 FIX: reconcile updatedAmount with the adapter-normalized payload
        // so client-supplied values cannot desynchronize document amount from payload.
        if (isset($normalizedPayload['amount']) && is_numeric($normalizedPayload['amount']) && (float)$normalizedPayload['amount'] > 0) {
            $updatedAmount = (float)$normalizedPayload['amount'];
        } elseif (isset($normalizedPayload['items']) && is_array($normalizedPayload['items']) && !empty($normalizedPayload['items'])) {
            $derived = 0.0;
            foreach ($normalizedPayload['items'] as $item) {
                $qty = (float)($item['qty'] ?? $item['quantity'] ?? 0);
                $cost = (float)($item['unit_cost'] ?? $item['unit_price'] ?? 0);
                $itemDiscount = (float)($item['discount_amount'] ?? 0);
                $derived += max(0.0, ($qty * $cost) - $itemDiscount);
            }
            $discount = (float)($normalizedPayload['discount'] ?? 0);
            $roundOff = (float)($normalizedPayload['round_off'] ?? 0);
            $derivedTotal = max(0.0, $derived - $discount + $roundOff);
            if ($derivedTotal > 0) {
                $updatedAmount = $derivedTotal;
            }
        }

        $resubmittedDoc = $this->stateMachine->resubmit(
            document: $doc,
            maker: $maker,
            updatedPayload: $normalizedPayload,
            updatedAmount: $updatedAmount,
            makerNotes: $notes,
            expectedVersion: $expectedVersion
        );

        if (!empty($normalizedPayload['cheque_leaf_id']) && !empty($normalizedPayload['bank_account_id'])) {
            app(\App\Services\Cheque\ChequeLifecycleService::class)->updateReservation(
                tenant: $tenant,
                approvalDocId: $doc->id,
                bankAccountId: $normalizedPayload['bank_account_id'],
                newLeafId: $normalizedPayload['cheque_leaf_id'],
                amount: $updatedAmount,
                partyId: $normalizedPayload['supplier_id'] ?? $normalizedPayload['customer_id'] ?? $normalizedPayload['party_id'] ?? null,
                chequeDate: $normalizedPayload['cheque_date'] ?? $normalizedPayload['payment_date'] ?? null,
                user: $maker
            );
        } else {
            app(\App\Services\Cheque\ChequeLifecycleService::class)->releaseReservation(
                tenant: $tenant,
                approvalDocId: $doc->id,
                reason: 'Payment method changed during correction',
                user: $maker
            );
        }

        return $resubmittedDoc;
    }
}
