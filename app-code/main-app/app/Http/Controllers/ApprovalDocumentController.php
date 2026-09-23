<?php

namespace App\Http\Controllers;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\Setting;
use App\Models\TenantUser;
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
        $user = auth()->user();

        // Enforce review permission
        if (!$user->hasPermission('approvals.inbox') && !$user->hasPermission('approvals.review') && !$user->isPlatformAdmin()) {
            abort(403, 'Access Denied: You do not have permission to view the approval inbox.');
        }

        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('status', ApprovalDocument::STATUS_PENDING)
            ->with(['maker:id,name,email', 'currentRevision']);

        if ($request->filled('type')) {
            $query->where('document_type', $request->input('type'));
        }
        if ($request->filled('maker_id')) {
            $query->where('maker_id', $request->input('maker_id'));
        }
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('document_number', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhereHas('maker', function ($mq) use ($term) {
                      $mq->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%");
                  });
            });
        }

        $documents = $query->latest('id')->paginate(20);

        if ($request->wantsJson()) {
            return response()->json($documents);
        }

        return Inertia::render('Approvals/Inbox', [
            'documents'     => $documents,
            'filters'       => $request->only(['type', 'maker_id', 'search']),
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

        if (!$user->hasPermission('approvals.view_own') && !$user->hasPermission('approvals.submit') && !$user->isPlatformAdmin()) {
            abort(403, 'Access Denied: You do not have permission to view submissions.');
        }

        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('maker_id', $user->id)
            ->with(['reviewer:id,name,email', 'currentRevision']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('type')) {
            $query->where('document_type', $request->input('type'));
        }

        $documents = $query->latest('id')->paginate(20);

        if ($request->wantsJson()) {
            return response()->json($documents);
        }

        return Inertia::render('Approvals/MySubmissions', [
            'documents' => $documents,
            'filters'   => $request->only(['status', 'type']),
        ]);
    }

    /**
     * Detailed read-only comparison view with complete revision & transition history.
     */
    public function show(Request $request, $id): Response|JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $doc = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->with([
                'maker:id,name,email',
                'reviewer:id,name,email',
                'revisions.maker:id,name,email',
                'transitions.actor:id,name,email',
            ])
            ->firstOrFail();

        $isMaker = ($doc->maker_id === $user->id);
        // View access: approvals.inbox is fine here — it's meant to let someone
        // see the inbox and its documents.
        $hasViewPerm = $user->hasPermission('approvals.review') ||
                       $user->hasPermission('approvals.inbox') ||
                       $user->isPlatformAdmin();

        // Decision capability (drives canApprove below): approvals.inbox is
        // deliberately EXCLUDED. Viewing the inbox must never authorize a
        // decision, even indirectly through the UI showing an approve button.
        $hasReviewPerm = $user->hasPermission('approvals.review') ||
                         $user->hasPermission('approvals.approve') ||
                         $user->isPlatformAdmin();

        $hasOwnPerm = $user->hasPermission('approvals.view_own') ||
                      $user->hasPermission('approvals.submit') ||
                      $user->isPlatformAdmin();

        if ($isMaker && !$hasOwnPerm && !$hasViewPerm) {
            abort(403, 'Access Denied: You do not have permission to view your submission.');
        }

        if (!$isMaker && !$hasViewPerm) {
            abort(403, 'Access Denied: You do not have permission to view approval documents.');
        }

        // Strict Owner Separation check
        $strictOwnerSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->first();
        $isOwner = ($membership?->role === 'owner');

        $canApprove = $hasReviewPerm && $doc->status === ApprovalDocument::STATUS_PENDING && (!$strictOwnerSeparation || !$isMaker || $isOwner && !$strictOwnerSeparation) && ($isOwner || !$isMaker);
        $canWithdraw = $isMaker && in_array($doc->status, [ApprovalDocument::STATUS_DRAFT, ApprovalDocument::STATUS_PENDING, ApprovalDocument::STATUS_RETURNED], true);
        $canResubmit = $isMaker && ($doc->status === ApprovalDocument::STATUS_RETURNED);

        $responseData = [
            'document'      => $doc,
            'canApprove'    => $canApprove,
            'isMaker'       => $isMaker,
            'canWithdraw'   => $canWithdraw,
            'canResubmit'   => $canResubmit,
            'returnReasons' => ApprovalReturnReason::where('is_active', true)
                ->where(fn($q) => $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id))
                ->get(),
        ];

        if ($request->wantsJson()) {
            return response()->json($responseData);
        }

        return Inertia::render('Approvals/Show', $responseData);
    }

    /**
     * Approve document action.
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $version = $request->input('version') ?? $request->input('expected_version');
        if ($version === null) {
            return response()->json(['message' => 'The version field is required.', 'errors' => ['version' => ['The version field is required.']]], 422);
        }

        try {
            $res = $this->approvalEngine->approve(
                documentId: (int)$id,
                tenant: $tenant,
                reviewer: $user,
                expectedVersion: (int)$version,
                reviewerNotes: $request->input('notes')
            );

            return response()->json([
                'success'       => true,
                'message'       => 'Document approved and posted successfully.',
                'posted_result' => $res['posted_result'],
            ]);
        } catch (\InvalidArgumentException | \RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Reject document action.
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $version = $request->input('version') ?? $request->input('expected_version');
        if ($version === null) {
            return response()->json(['message' => 'The version field is required.', 'errors' => ['version' => ['The version field is required.']]], 422);
        }

        try {
            $doc = $this->approvalEngine->reject(
                documentId: (int)$id,
                tenant: $tenant,
                reviewer: $user,
                reason: $request->input('reason'),
                expectedVersion: (int)$version
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document has been rejected.',
                'document' => $doc,
            ]);
        } catch (\InvalidArgumentException | \RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Return document for correction action.
     */
    public function returnDocument(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $version = $request->input('version') ?? $request->input('expected_version');
        if ($version === null) {
            return response()->json(['message' => 'The version field is required.', 'errors' => ['version' => ['The version field is required.']]], 422);
        }

        $notes = $request->input('notes') ?? $request->input('reviewer_notes');

        try {
            $doc = $this->approvalEngine->returnDocument(
                documentId: (int)$id,
                tenant: $tenant,
                reviewer: $user,
                reasonCodes: $request->input('reason_codes'),
                notes: $notes,
                expectedVersion: (int)$version
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document returned to maker for correction.',
                'document' => $doc,
            ]);
        } catch (\InvalidArgumentException | \RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Withdraw document action.
     */
    public function withdraw(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $version = $request->input('version') ?? $request->input('expected_version');
        if ($version === null) {
            return response()->json(['message' => 'The version field is required.', 'errors' => ['version' => ['The version field is required.']]], 422);
        }

        $existing = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $id)->firstOrFail();
        if ($existing->maker_id !== $user->id && !$user->isPlatformAdmin()) {
            abort(403, 'Access Denied: Only the document maker can withdraw this submission.');
        }

        try {
            $doc = $this->approvalEngine->withdraw(
                documentId: (int)$id,
                tenant: $tenant,
                maker: $user,
                reason: $request->input('reason'),
                expectedVersion: (int)$version
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document withdrawn by maker.',
                'document' => $doc,
            ]);
        } catch (\InvalidArgumentException | \RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Resubmit returned document action.
     */
    public function resubmit(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $version = $request->input('version') ?? $request->input('expected_version');
        if ($version === null) {
            return response()->json(['message' => 'The version field is required.', 'errors' => ['version' => ['The version field is required.']]], 422);
        }

        $payload = $request->input('payload', []);
        $amount = $request->input('amount') ?? ($payload['amount'] ?? ($payload['grand_total'] ?? null));
        if ($amount !== null && !$request->has('amount')) {
            $request->merge(['amount' => $amount]);
        }

        $request->validate([
            'payload' => 'required|array',
            'amount'  => 'required|numeric|min:0.01',
            'notes'   => 'nullable|string|max:1000',
        ]);

        $existing = ApprovalDocument::where('tenant_id', $tenant->id)->where('id', $id)->firstOrFail();
        if ($existing->maker_id !== $user->id) {
            abort(403, 'Access Denied: Only the document maker can resubmit this submission.');
        }

        try {
            $doc = $this->approvalEngine->resubmit(
                documentId: (int)$id,
                tenant: $tenant,
                maker: $user,
                updatedPayload: $request->input('payload'),
                updatedAmount: (float)$request->input('amount'),
                notes: $request->input('notes'),
                expectedVersion: (int)$version
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document resubmitted for approval.',
                'document' => $doc,
            ]);
        } catch (\InvalidArgumentException | \RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
        }
    }
}
