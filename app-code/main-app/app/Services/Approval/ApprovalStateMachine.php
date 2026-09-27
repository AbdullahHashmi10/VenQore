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
            // Check idempotency if key provided.
            // R11 FIX: also require document_type and maker_id to match — a key
            // must not return another maker's or another type's document.
            if ($idempotencyKey) {
                $existing = ApprovalDocument::where('tenant_id', $tenantId)
                    ->where('idempotency_key', $idempotencyKey)
                    ->where('document_type', $documentType)
                    ->where('maker_id', $maker->id)
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
     *
     * R11 FIX: Status and version checks moved INSIDE the DB transaction with
     * lockForUpdate(). Previously these were checked against the pre-loaded
     * $document before the transaction, making them a TOCTOU race: two concurrent
     * resubmit calls could both pass the check, then both enter the transaction
     * and create duplicate revisions against the same document. With lockForUpdate
     * the second concurrent caller is serialized and will see the post-update state.
     */
    public function resubmit(
        ApprovalDocument $document,
        User $maker,
        array $updatedPayload,
        float $updatedAmount,
        ?string $makerNotes = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        return DB::transaction(function () use ($document, $maker, $updatedPayload, $updatedAmount, $makerNotes, $expectedVersion) {
            // Re-read under lock — this is the race-safe status/version check.
            $fresh = ApprovalDocument::where('id', $document->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($fresh->status !== ApprovalDocument::STATUS_RETURNED) {
                throw new RuntimeException("Only returned documents can be resubmitted. Current status: '{$fresh->status}'.");
            }

            if ($expectedVersion !== null && (int)$fresh->version !== (int)$expectedVersion) {
                throw new RuntimeException("Version conflict: document has been modified by another transition.");
            }

            $latestRevision = $fresh->latestRevision();
            $nextRevisionNumber = ($latestRevision ? $latestRevision->revision_number : 0) + 1;
            $summaryHash = hash('sha256', json_encode($updatedPayload));

            $newRevision = ApprovalRevision::create([
                'approval_document_id' => $fresh->id,
                'revision_number'      => $nextRevisionNumber,
                'maker_id'             => $maker->id,
                'payload'              => $updatedPayload,
                'summary_hash'         => $summaryHash,
                'notes'                => $makerNotes,
            ]);

            $previousStatus = $fresh->status;
            $fresh->status = ApprovalDocument::STATUS_PENDING;
            $fresh->current_revision_id = $newRevision->id;
            $fresh->amount = $updatedAmount;
            $fresh->version = (int)$fresh->version + 1;
            $fresh->save();

            ApprovalTransition::create([
                'approval_document_id' => $fresh->id,
                'actor_id'             => $maker->id,
                'source_revision_id'   => $newRevision->id,
                'from_status'          => $previousStatus,
                'to_status'            => ApprovalDocument::STATUS_PENDING,
                'reason_codes'         => [],
                'notes'                => $makerNotes ?: 'Resubmitted after correction',
                'metadata'             => ['revision_number' => $nextRevisionNumber],
            ]);

            return $fresh->fresh(['currentRevision', 'revisions', 'transitions']);
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
                ->where('is_active', true)
                ->where(function ($q) use ($document) {
                    $q->whereNull('tenant_id')->orWhere('tenant_id', $document->tenant_id);
                })->first();

            if (!$preset) {
                throw new InvalidArgumentException("Unknown or inactive return reason code '{$code}'.");
            }

            $appliesTo = (array)($preset->applies_to ?? ['all']);
            if (!in_array('all', $appliesTo, true) && !in_array($document->document_type, $appliesTo, true)) {
                throw new InvalidArgumentException("Return reason '{$preset->label}' does not apply to {$document->document_type} documents.");
            }

            if ($preset->requires_notes && empty(trim($reviewerNotes ?? ''))) {
                throw new InvalidArgumentException("Return reason '{$preset->label}' requires an explanation note.");
            }
        }

        return DB::transaction(function () use ($document, $reviewer, $reasonCodes, $reviewerNotes, $expectedVersion) {
            /** @var ApprovalDocument $lockedDoc */
            $lockedDoc = ApprovalDocument::where('id', $document->id)->lockForUpdate()->firstOrFail();

            if ($lockedDoc->status !== ApprovalDocument::STATUS_PENDING) {
                throw new RuntimeException("Only pending documents can be returned. Current status: '{$lockedDoc->status}'.");
            }

            if ($expectedVersion !== null && (int)$lockedDoc->version !== (int)$expectedVersion) {
                throw new RuntimeException("Version conflict: document version {$lockedDoc->version} does not match expected {$expectedVersion}.");
            }

            $fromStatus = $lockedDoc->status;
            $lockedDoc->status = ApprovalDocument::STATUS_RETURNED;
            $lockedDoc->reviewer_id = $reviewer->id;
            $lockedDoc->version = (int)$lockedDoc->version + 1;
            $lockedDoc->save();

            ApprovalTransition::create([
                'approval_document_id' => $lockedDoc->id,
                'actor_id'             => $reviewer->id,
                'source_revision_id'   => $lockedDoc->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_RETURNED,
                'reason_codes'         => $reasonCodes,
                'notes'                => $reviewerNotes,
                'metadata'             => ['version' => $lockedDoc->version],
            ]);

            return $lockedDoc->fresh(['currentRevision', 'revisions', 'transitions']);
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

        return DB::transaction(function () use ($document, $reviewer, $rejectionReason, $expectedVersion) {
            /** @var ApprovalDocument $lockedDoc */
            $lockedDoc = ApprovalDocument::where('id', $document->id)->lockForUpdate()->firstOrFail();

            if ($lockedDoc->status !== ApprovalDocument::STATUS_PENDING) {
                throw new RuntimeException("Only pending documents can be rejected. Current status: '{$lockedDoc->status}'.");
            }

            if ($expectedVersion !== null && (int)$lockedDoc->version !== (int)$expectedVersion) {
                throw new RuntimeException("Version conflict: document version {$lockedDoc->version} does not match expected {$expectedVersion}.");
            }

            $fromStatus = $lockedDoc->status;
            $lockedDoc->status = ApprovalDocument::STATUS_REJECTED;
            $lockedDoc->reviewer_id = $reviewer->id;
            $lockedDoc->version = (int)$lockedDoc->version + 1;
            $lockedDoc->save();

            ApprovalTransition::create([
                'approval_document_id' => $lockedDoc->id,
                'actor_id'             => $reviewer->id,
                'source_revision_id'   => $lockedDoc->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_REJECTED,
                'reason_codes'         => ['REJECTED'],
                'notes'                => $rejectionReason ?: 'Document rejected by reviewer',
                'metadata'             => ['version' => $lockedDoc->version],
            ]);

            return $lockedDoc->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }

    /**
     * Maker withdraws a draft, pending, or returned document.
     */
    public function withdrawDocument(
        ApprovalDocument $document,
        User $maker,
        ?string $reason = null,
        ?int $expectedVersion = null
    ): ApprovalDocument {
        if (!in_array($document->status, [
            ApprovalDocument::STATUS_DRAFT,
            ApprovalDocument::STATUS_PENDING,
            ApprovalDocument::STATUS_RETURNED,
        ], true)) {
            throw new RuntimeException("Document with status '{$document->status}' cannot be withdrawn.");
        }

        if ($expectedVersion !== null && (int)$document->version !== (int)$expectedVersion) {
            throw new RuntimeException("Version conflict: document has been modified by another transition.");
        }

        return DB::transaction(function () use ($document, $maker, $reason, $expectedVersion) {
            /** @var ApprovalDocument $lockedDoc */
            $lockedDoc = ApprovalDocument::where('id', $document->id)->lockForUpdate()->firstOrFail();

            if (!in_array($lockedDoc->status, [
                ApprovalDocument::STATUS_DRAFT,
                ApprovalDocument::STATUS_PENDING,
                ApprovalDocument::STATUS_RETURNED,
            ], true)) {
                throw new RuntimeException("Document with status '{$lockedDoc->status}' cannot be withdrawn.");
            }

            if ($expectedVersion !== null && (int)$lockedDoc->version !== (int)$expectedVersion) {
                throw new RuntimeException("Version conflict: document version {$lockedDoc->version} does not match expected {$expectedVersion}.");
            }

            $fromStatus = $lockedDoc->status;
            $lockedDoc->status = ApprovalDocument::STATUS_WITHDRAWN;
            $lockedDoc->version = (int)$lockedDoc->version + 1;
            $lockedDoc->save();

            ApprovalTransition::create([
                'approval_document_id' => $lockedDoc->id,
                'actor_id'             => $maker->id,
                'source_revision_id'   => $lockedDoc->current_revision_id,
                'from_status'          => $fromStatus,
                'to_status'            => ApprovalDocument::STATUS_WITHDRAWN,
                'reason_codes'         => ['WITHDRAWN_BY_MAKER'],
                'notes'                => $reason ?: 'Withdrawn by maker',
                'metadata'             => ['version' => $lockedDoc->version],
            ]);

            return $lockedDoc->fresh(['currentRevision', 'revisions', 'transitions']);
        });
    }
}
