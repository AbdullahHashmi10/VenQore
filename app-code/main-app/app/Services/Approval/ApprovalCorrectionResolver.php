<?php

namespace App\Services\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalTransition;
use Illuminate\Http\Request;

final class ApprovalCorrectionResolver
{
    /**
     * Resolve and validate approval document for original-editor correction flow.
     *
     * @param Request $request
     * @param string $expectedType
     * @return array<string, mixed>|null
     */
    public function resolveForEdit(Request $request, string $expectedType): ?array
    {
        $approvalId = $request->query('edit_approval');
        if (empty($approvalId)) {
            return null;
        }

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $user = auth()->user();

        if (!$tenant || !$user) {
            abort(401, 'Unauthenticated or missing tenant context.');
        }

        $doc = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('id', $approvalId)
            ->with(['currentRevision', 'transitions'])
            ->first();

        if (!$doc) {
            abort(404, 'Approval document not found.');
        }

        if ($doc->maker_id !== $user->id) {
            abort(403, 'Only the original creator can edit returned approval documents.');
        }

        if ($doc->status !== ApprovalDocument::STATUS_RETURNED) {
            abort(422, 'Only returned approval documents can be edited.');
        }

        if ($doc->document_type !== $expectedType) {
            abort(422, "Approval document type mismatch. Expected {$expectedType}, found {$doc->document_type}.");
        }

        $latestTransition = ApprovalTransition::where('approval_document_id', $doc->id)
            ->where('to_status', ApprovalDocument::STATUS_RETURNED)
            ->latest('id')
            ->first();

        return [
            'document_id'         => $doc->id,
            'document_type'       => $doc->document_type,
            'version'             => (int) $doc->version,
            'expected_version'    => (int) $doc->version,
            'payload'             => $doc->currentRevision?->payload ?? [],
            'return_notes'        => $latestTransition?->notes ?? '',
            'return_reason_codes' => $latestTransition?->reason_codes ?? [],
            'resubmit_url'        => route('store.approvals.resubmit', ['store_slug' => $tenant->slug, 'id' => $doc->id]),
        ];
    }
}
