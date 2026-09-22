<?php

namespace App\Http\Controllers;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Services\Approval\ApprovalExecutionEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalDocumentController extends Controller
{
    public function __construct(
        private ApprovalExecutionEngine $approvalEngine
    ) {}

    /**
     * Reviewer queue: List all documents awaiting review.
     */
    public function inbox(Request $request): Response|JsonResponse
    {
        $tenant = app('current.tenant');
        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('status', ApprovalDocument::STATUS_PENDING)
            ->with(['maker:id,name,email', 'currentRevision']);

        if ($request->filled('type')) {
            $query->where('document_type', $request->input('type'));
        }
        if ($request->filled('maker_id')) {
            $query->where('maker_id', $request->input('maker_id'));
        }

        $documents = $query->latest('id')->paginate(20);

        if ($request->wantsJson()) {
            return response()->json($documents);
        }

        return Inertia::render('Approvals/Inbox', [
            'documents'     => $documents,
            'filters'       => $request->only(['type', 'maker_id']),
            'returnReasons' => ApprovalReturnReason::where('is_active', true)
                ->where(fn($q) => $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id))
                ->get(),
        ]);
    }

    /**
     * Maker queue: List submissions created by the authenticated user.
     */
    public function mySubmissions(Request $request): Response|JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('maker_id', $user->id)
            ->with(['reviewer:id,name,email', 'currentRevision']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $documents = $query->latest('id')->paginate(20);

        if ($request->wantsJson()) {
            return response()->json($documents);
        }

        return Inertia::render('Approvals/MySubmissions', [
            'documents' => $documents,
            'filters'   => $request->only(['status']),
        ]);
    }

    /**
     * Detailed read-only comparison view with complete revision & transition history.
     */
    public function show(Request $request, $id): Response|JsonResponse
    {
        $tenant = app('current.tenant');
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->with([
                'maker:id,name,email',
                'reviewer:id,name,email',
                'revisions.maker:id,name,email',
                'transitions.actor:id,name,email',
            ])
            ->firstOrFail();

        if ($request->wantsJson()) {
            return response()->json($doc);
        }

        return Inertia::render('Approvals/Show', [
            'document'      => $doc,
            'returnReasons' => ApprovalReturnReason::where('is_active', true)
                ->where(fn($q) => $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id))
                ->get(),
        ]);
    }

    /**
     * Approve document action.
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $request->validate([
            'version' => 'nullable|integer',
            'notes'   => 'nullable|string|max:1000',
        ]);

        $res = $this->approvalEngine->approve(
            documentId: (int)$id,
            tenant: $tenant,
            reviewer: $user,
            expectedVersion: $request->input('version'),
            reviewerNotes: $request->input('notes')
        );

        return response()->json([
            'success'       => true,
            'message'       => 'Document approved and posted successfully.',
            'posted_result' => $res['posted_result'],
        ]);
    }

    /**
     * Reject document action.
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $request->validate([
            'version' => 'nullable|integer',
            'reason'  => 'nullable|string|max:1000',
        ]);

        $doc = $this->approvalEngine->reject(
            documentId: (int)$id,
            tenant: $tenant,
            reviewer: $user,
            reason: $request->input('reason'),
            expectedVersion: $request->input('version')
        );

        return response()->json([
            'success'  => true,
            'message'  => 'Document has been rejected.',
            'document' => $doc,
        ]);
    }

    /**
     * Return document for correction action.
     */
    public function returnDocument(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $request->validate([
            'reason_codes' => 'required|array|min:1',
            'reason_codes.*' => 'string|max:64',
            'notes'        => 'nullable|string|max:1000',
            'version'      => 'nullable|integer',
        ]);

        $doc = $this->approvalEngine->returnDocument(
            documentId: (int)$id,
            tenant: $tenant,
            reviewer: $user,
            reasonCodes: $request->input('reason_codes'),
            notes: $request->input('notes'),
            expectedVersion: $request->input('version')
        );

        return response()->json([
            'success'  => true,
            'message'  => 'Document returned to maker for correction.',
            'document' => $doc,
        ]);
    }

    /**
     * Resubmit returned document action.
     */
    public function resubmit(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $request->validate([
            'payload' => 'required|array',
            'amount'  => 'required|numeric|min:0.01',
            'notes'   => 'nullable|string|max:1000',
            'version' => 'nullable|integer',
        ]);

        $doc = $this->approvalEngine->resubmit(
            documentId: (int)$id,
            tenant: $tenant,
            maker: $user,
            updatedPayload: $request->input('payload'),
            updatedAmount: (float)$request->input('amount'),
            notes: $request->input('notes'),
            expectedVersion: $request->input('version')
        );

        return response()->json([
            'success'  => true,
            'message'  => 'Document resubmitted for approval.',
            'document' => $doc,
        ]);
    }
}
