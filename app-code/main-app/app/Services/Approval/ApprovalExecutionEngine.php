<?php

namespace App\Services\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalTransition;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Approval\Adapters\ApprovalAdapterInterface;
use App\Services\Approval\Adapters\CustomerReceiptApprovalAdapter;
use App\Services\Approval\Adapters\OperatingExpenseApprovalAdapter;
use App\Services\Approval\Adapters\SalesInvoiceApprovalAdapter;
use App\Services\Approval\Adapters\SupplierPaymentApprovalAdapter;
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
        CustomerReceiptApprovalAdapter $customerReceipt,
        SupplierPaymentApprovalAdapter $supplierPayment,
        SalesInvoiceApprovalAdapter $salesInvoice,
        OperatingExpenseApprovalAdapter $operatingExpense
    ) {
        $this->adapters = [
            ApprovalDocument::TYPE_CUSTOMER_RECEIPT  => $customerReceipt,
            ApprovalDocument::TYPE_SUPPLIER_PAYMENT  => $supplierPayment,
            ApprovalDocument::TYPE_SALES_INVOICE     => $salesInvoice,
            ApprovalDocument::TYPE_OPERATING_EXPENSE => $operatingExpense,
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

        return $this->stateMachine->submitNew(
            tenantId: $tenant->id,
            documentType: $documentType,
            maker: $maker,
            payload: $normalizedPayload,
            amount: $amount,
            description: $description,
            idempotencyKey: $idempotencyKey
        );
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

            // Enforce separation of duties: maker cannot approve own document
            // Check store strict owner separation or non-owner maker
            $reviewerMembership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $reviewer->id)->first();
            $reviewerRole = $reviewerMembership?->role ?? 'cashier';
            $canApprove = in_array($reviewerRole, ['owner', 'admin', 'manager'], true);

            if (!$canApprove) {
                throw new RuntimeException("User {$reviewer->id} does not have permission to approve transactions.");
            }

            if ($doc->maker_id === $reviewer->id && $reviewerRole !== 'owner') {
                throw new RuntimeException("Separation of duties violation: Maker cannot approve their own submission.");
            }

            $adapter = $this->getAdapter($doc->document_type);

            // Revalidate against live database state
            $adapter->revalidate($doc, $tenant, $reviewer);

            // Execute operational and financial posting atomically
            $postedResult = $adapter->post($doc, $tenant, $reviewer);

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
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();
        return $this->stateMachine->rejectDocument($doc, $reviewer, $reason, $expectedVersion);
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
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();
        return $this->stateMachine->returnDocument($doc, $reviewer, $reasonCodes, $notes, $expectedVersion);
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
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $documentId)->firstOrFail();
        $adapter = $this->getAdapter($doc->document_type);
        $normalizedPayload = $adapter->validatePayload($updatedPayload, $tenant, $maker);

        return $this->stateMachine->resubmit(
            document: $doc,
            maker: $maker,
            updatedPayload: $normalizedPayload,
            updatedAmount: $updatedAmount,
            makerNotes: $notes,
            expectedVersion: $expectedVersion
        );
    }
}
