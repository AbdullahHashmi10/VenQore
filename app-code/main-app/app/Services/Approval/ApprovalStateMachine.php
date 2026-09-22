<?php

namespace App\Services\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalRevision;
use App\Models\ApprovalTransition;
use App\Models\ApprovalReturnReason;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class ApprovalStateMachine
{
    /**
     * Allowed status transitions matrix.
     */
    public const TRANSITIONS = [
        ApprovalDocument::STATUS_DRAFT => [
            ApprovalDocument::STATUS_PENDING,
            ApprovalDocument::STATUS_WITHDRAWN,
        ],
        ApprovalDocument::STATUS_PENDING => [
            ApprovalDocument::STATUS_APPROVED,
            ApprovalDocument::STATUS_REJECTED,
            ApprovalDocument::STATUS_RETURNED,
            ApprovalDocument::STATUS_WITHDRAWN,
        ],
        ApprovalDocument::STATUS_RETURNED => [
            ApprovalDocument::STATUS_PENDING,
            ApprovalDocument::STATUS_WITHDRAWN,
        ],
        ApprovalDocument::STATUS_APPROVED => [],
        ApprovalDocument::STATUS_REJECTED => [],
        ApprovalDocument::STATUS_WITHDRAWN => [],
    ];

    /**
     * Create initial approval submission with immutable first revision.
     */
    public function submitNew(
        int $tenantId,
        string $documentType,
        User $maker,
        array $payload,
        float $amount,
        ?string $description = null,
        ?string $idempotencyKey = null,
        ?string $entityType = null,
        ?int $entityId = null,
        array $metadata = []
    ): ApprovalDocument {
        if (!in_array($documentType, ApprovalDocument::SUPPORTED_TYPES, true)) {
            throw new InvalidArgumentException("Unsupported document type for approval: '{$documentType}'.");
        }

        return DB::transaction(function () use (
            $tenantId, $documentType, $maker, $payload, $amount, $description, $idempotencyKey, $entityType, $entityId, $metadata
        ) {
            // Check idempotency if key provided
            if ($idempotencyKey) {
                $existing = ApprovalDocument::where('tenant_id', $tenantId)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();
                if ($existing) {
                    return $existing;
                }
            }

            $summaryHash = hash('sha256', json_encode($payload));

            $doc = ApprovalDocument::create([
                'tenant_id'       => $tenantId,
                'document_type'   => $documentType,
                'document_number' => 'APP-' . strtoupper(substr($documentType, 0, 3)) . '-' . strtoupper(uniqid()),
                'status'          => ApprovalDocument::STATUS_PENDING,
                'maker_id'        => $maker->id,
                'version'         => 1,
                'idempotency_key' => $idempotencyKey,
                'amount'          => $amount,
                'currency'        => 'PKR',
                'description'     => $description,
                'entity_type'     => $entityType,
                'entity_id'       => $entityId,
                'metadata'        => $metadata,
            ]);

            $revision = ApprovalRevision::create([
                'approval_document_id' => $doc->id,
                'revision_number'      => 1,
                'maker_id'             => $maker->id,
                'payload'              => $payload,
                'summary_hash'         => $summaryHash,
                'notes'                => $description,
            ]);

            $doc->update(['current_revision_id' => $revision->id]);

            ApprovalTransition::create([
                'approval_document_id' => $doc->id,
                'actor_id'             => $maker->id,
                'source_revision_id'   => $revision->id,
                'from_status'          => ApprovalDocument::STATUS_DRAFT,
                'to_status'            => ApprovalDocument::STATUS_PENDING,
                'reason_codes'         => [],
                'notes'                => 'Initial submission',
                'metadata'             => ['version' => 1],
            ]);

            return $doc->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }

    /**
     * Resubmit a returned document with a new immutable revision.
     */
    public function resubmit(
        ApprovalDocument $document,
        User $maker,
        array $updatedPayload,
        float $updatedAmount,
        ?string $makerNotes = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        if ($document->status !== ApprovalDocument::STATUS_RETURNED) {
            throw new RuntimeException("Only returned documents can be resubmitted. Current status: '{$document->status}'.");
        }

        if ($expectedVersion !== null && (int)$document->version !== (int)$expectedVersion) {
            throw new RuntimeException("Version conflict: document has been modified by another transition.");
        }

        return DB::transaction(function () use ($document, $maker, $updatedPayload, $updatedAmount, $makerNotes) {
            $latestRevision = $document->latestRevision();
            $nextRevisionNumber = ($latestRevision ? $latestRevision->revision_number : 0) + 1;
            $summaryHash = hash('sha256', json_encode($updatedPayload));

            $newRevision = ApprovalRevision::create([
                'approval_document_id' => $document->id,
                'revision_number'      => $nextRevisionNumber,
                'maker_id'             => $maker->id,
                'payload'              => $updatedPayload,
                'summary_hash'         => $summaryHash,
                'notes'                => $makerNotes,
            ]);

            $previousStatus = $document->status;
            $document->status = ApprovalDocument::STATUS_PENDING;
            $document->current_revision_id = $newRevision->id;
            $document->amount = $updatedAmount;
            $document->version = (int)$document->version + 1;
            $document->save();

            ApprovalTransition::create([
                'approval_document_id' => $document->id,
                'actor_id'             => $maker->id,
                'source_revision_id'   => $newRevision->id,
                'from_status'          => $previousStatus,
                'to_status'            => ApprovalDocument::STATUS_PENDING,
                'reason_codes'         => [],
                'notes'                => $makerNotes ?: 'Resubmitted after correction',
                'metadata'             => ['revision_number' => $nextRevisionNumber],
            ]);

            return $document->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }

    /**
     * Reviewer returns a document with preset reason codes and notes.
     */
    public function returnDocument(
        ApprovalDocument $document,
        User $reviewer,
        array $reasonCodes,
        ?string $reviewerNotes = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        if ($document->status !== ApprovalDocument::STATUS_PENDING) {
            throw new RuntimeException("Only pending documents can be returned. Current status: '{$document->status}'.");
        }

        if (empty($reasonCodes)) {
            throw new InvalidArgumentException("At least one return reason code is required to return a document.");
        }

        if ($expectedVersion !== null && (int)$document->version !== (int)$expectedVersion) {
            throw new RuntimeException("Version conflict: document has been modified by another transition.");
        }

        // Validate reason codes against preset definitions
        foreach ($reasonCodes as $code) {
            $preset = ApprovalReturnReason::where('code', $code)
                ->where(function ($q) use ($document) {
                    $q->whereNull('tenant_id')->orWhere('tenant_id', $document->tenant_id);
                })->first();

            if ($preset && $preset->requires_notes && empty(trim($reviewerNotes ?? ''))) {
                throw new InvalidArgumentException("Return reason '{$preset->label}' requires an explanation note.");
            }
        }

        return DB::transaction(function () use ($document, $reviewer, $reasonCodes, $reviewerNotes) {
            $fromStatus = $document->status;
            $document->status = ApprovalDocument::STATUS_RETURNED;
            $document->reviewer_id = $reviewer->id;
            $document->version = (int)$document->version + 1;
            $document->save();

            ApprovalTransition::create([
                'approval_document_id' => $document->id,
                'actor_id'             => $reviewer->id,
                'source_revision_id'   => $document->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_RETURNED,
                'reason_codes'         => $reasonCodes,
                'notes'                => $reviewerNotes,
                'metadata'             => ['version' => $document->version],
            ]);

            return $document->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }

    /**
     * Reviewer rejects a document.
     */
    public function rejectDocument(
        ApprovalDocument $document,
        User $reviewer,
        ?string $rejectionReason = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        if ($document->status !== ApprovalDocument::STATUS_PENDING) {
            throw new RuntimeException("Only pending documents can be rejected. Current status: '{$document->status}'.");
        }

        if ($expectedVersion !== null && (int)$document->version !== (int)$expectedVersion) {
            throw new RuntimeException("Version conflict: document has been modified by another transition.");
        }

        return DB::transaction(function () use ($document, $reviewer, $rejectionReason) {
            $fromStatus = $document->status;
            $document->status = ApprovalDocument::STATUS_REJECTED;
            $document->reviewer_id = $reviewer->id;
            $document->version = (int)$document->version + 1;
            $document->save();

            ApprovalTransition::create([
                'approval_document_id' => $document->id,
                'actor_id'             => $reviewer->id,
                'source_revision_id'   => $document->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_REJECTED,
                'reason_codes'         => ['REJECTED'],
                'notes'                => $rejectionReason ?: 'Document rejected by reviewer',
                'metadata'             => ['version' => $document->version],
            ]);

            return $document->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }

    /**
     * Maker withdraws a draft, pending, or returned document.
     */
    public function withdrawDocument(
        ApprovalDocument $document,
        User $maker,
        ?string $reason = null
    ): ApprovalDocument {
        if (!in_array($document->status, [
            ApprovalDocument::STATUS_DRAFT,
            ApprovalDocument::STATUS_PENDING,
            ApprovalDocument::STATUS_RETURNED,
        ], true)) {
            throw new RuntimeException("Document with status '{$document->status}' cannot be withdrawn.");
        }

        return DB::transaction(function () use ($document, $maker, $reason) {
            $fromStatus = $document->status;
            $document->status = ApprovalDocument::STATUS_WITHDRAWN;
            $document->version = (int)$document->version + 1;
            $document->save();

            ApprovalTransition::create([
                'approval_document_id' => $document->id,
                'actor_id'             => $maker->id,
                'source_revision_id'   => $document->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_WITHDRAWN,
                'reason_codes'         => ['WITHDRAWN_BY_MAKER'],
                'notes'                => $reason ?: 'Withdrawn by maker',
                'metadata'             => ['version' => $document->version],
            ]);

            return $document->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }
}
