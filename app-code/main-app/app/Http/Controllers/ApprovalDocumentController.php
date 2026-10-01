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
     * Approvals landing: routes approvers to inbox and submitters/cashiers to my-submissions.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $slug = $tenant?->slug ?? '';
        $membership = $user?->getActiveMembership();

        $requiresApproval = ($membership?->transaction_approval_mode === 'required')
            || (!$user?->isPlatformAdmin() && $membership?->role !== 'owner' && !$user?->hasPermission('approvals.inbox') && !$user?->hasPermission('approvals.review'));

        if ($requiresApproval) {
            return redirect()->to('/s/' . $slug . '/approvals/my-submissions');
        }

        return redirect()->to('/s/' . $slug . '/approvals/inbox');
    }

    /**
     * Universal correction screen for every approval document type.
     *
     * Some transaction editors have richer native correction support. This
     * endpoint is the complete fallback and ensures every returned Phase 1
     * document can be corrected and resubmitted by its maker.
     */
    public function correct(Request $request, $id): Response
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        $doc = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->with(['currentRevision', 'transitions'])
            ->firstOrFail();

        if ((int) $doc->maker_id !== (int) $user->id) {
            abort(403, 'Only the original creator can correct this document.');
        }

        if ($doc->status !== ApprovalDocument::STATUS_RETURNED) {
            abort(422, 'Only a returned document can be corrected.');
        }

        $latestReturn = $doc->transitions
            ->where('to_status', ApprovalDocument::STATUS_RETURNED)
            ->sortByDesc('id')
            ->first();

        return Inertia::render('Approvals/Correct', [
            'document' => [
                'id' => $doc->id,
                'document_number' => $doc->document_number,
                'document_type' => $doc->document_type,
                'amount' => (float) $doc->amount,
                'version' => (int) $doc->version,
                'payload' => $doc->currentRevision?->payload ?? [],
                'return_notes' => $latestReturn?->notes ?? '',
                'return_reason_codes' => $latestReturn?->reason_codes ?? [],
                'resubmit_url' => route('store.approvals.resubmit', [
                    'store_slug' => $tenant->slug,
                    'id' => $doc->id,
                ]),
                'show_url' => route('store.approvals.show', [
                    'store_slug' => $tenant->slug,
                    'id' => $doc->id,
                ]),
            ],
        ]);
    }

    /**
     * Reviewer queue: List all documents awaiting review.
     */
    public function inbox(Request $request): Response|JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();
        $membership = $user?->getActiveMembership();

        $requiresApproval = ($membership?->transaction_approval_mode === 'required')
            || (!$user?->isPlatformAdmin() && $membership?->role !== 'owner' && !$user?->hasPermission('approvals.inbox') && !$user?->hasPermission('approvals.review'));

        if ($requiresApproval) {
            return redirect()->to('/s/' . $tenant->slug . '/approvals/my-submissions');
        }

        // Enforce review permission
        if (!$user->hasPermission('approvals.inbox') && !$user->hasPermission('approvals.review') && !$user->isPlatformAdmin() && $membership?->role !== 'owner') {
            abort(403, 'Access Denied: You do not have permission to view the approval inbox.');
        }

        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->with(['maker:id,name,email', 'currentRevision']);

        // R14 FIX: Allow status filtering (defaults to pending for inbox, but permits
        // history drilldown when navigating from reviewer decisions cards).
        $status = $request->input('status', ApprovalDocument::STATUS_PENDING);
        if ($status !== 'all' && in_array($status, ApprovalDocument::SUPPORTED_STATUSES, true)) {
            $query->where('status', $status);
        }

        // R14 FIX: Apply reviewer document eligibility filter so reviewers only see
        // documents for which they hold the required business authorities.
        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->first();
        $isOwner = ($membership?->role === 'owner');
        $isAdmin = ($membership?->role === 'admin');

        if (!$isOwner && !$isAdmin && !$user->isPlatformAdmin()) {
            $eligibleTypes = $this->approvalEngine->getEligibleDocumentTypes($tenant, $user);
            $query->whereIn('document_type', $eligibleTypes);
        }

        // R14 FIX: Strict owner separation — makers cannot review their own submissions.
        $strictOwnerSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        if (!$isOwner || $strictOwnerSeparation) {
            $query->where('maker_id', '!=', $user->id);
        }

        // R14 FIX: Reviewer history drilldown support by actor_id/reviewer_id
        if ($request->filled('actor_id') || $request->filled('reviewer_id')) {
            $actorId = (int)($request->input('actor_id') ?: $request->input('reviewer_id'));
            $query->whereHas('transitions', fn($tq) => $tq->where('actor_id', $actorId));
        }

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

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }

        $documents = $query->latest('id')->paginate(20);

        if ($request->wantsJson()) {
            return response()->json($documents);
        }

        $stats = [
            'pending_count'   => ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'pending')->count(),
            'pending_amount'  => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'pending')->sum('amount'),
            'returned_count'  => ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'returned')->count(),
            'returned_amount' => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'returned')->sum('amount'),
            'approved_count'  => ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'approved')->count(),
            'approved_amount' => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'approved')->sum('amount'),
            'rejected_count'  => ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'rejected')->count(),
            'rejected_amount' => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('status', 'rejected')->sum('amount'),
            'total_count'     => ApprovalDocument::where('tenant_id', $tenant->id)->count(),
            'total_amount'    => (float) ApprovalDocument::where('tenant_id', $tenant->id)->sum('amount'),
        ];

        return Inertia::render('Approvals/Inbox', [
            'documents'     => $documents,
            'stats'         => $stats,
            'filters'       => $request->only(['status', 'type', 'maker_id', 'actor_id', 'reviewer_id', 'search', 'from_date', 'to_date', 'filter']),
            'returnReasons' => ApprovalReturnReason::where('is_active', true)
                ->where(fn($q) => $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id))
                ->get(),
        ]);
    }

    /**
     * Maker queue: List submissions created by the authenticated user.
     */
    public function mySubmissions(Request $request): Response|JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();
        $membership = $user?->getActiveMembership();

        $requiresApproval = ($membership?->transaction_approval_mode === 'required')
            || (!$user?->isPlatformAdmin() && $membership?->role !== 'owner' && !$user?->hasPermission('approvals.inbox') && !$user?->hasPermission('approvals.review'));

        // Approvers / reviewers who do not require approval must NOT see My Submissions! Redirect to Reviewer Inbox.
        if (!$requiresApproval) {
            return redirect()->to('/s/' . $tenant->slug . '/approvals/inbox');
        }

        if (!$user->hasPermission('approvals.view_own') && !$user->hasPermission('approvals.submit') && !$user->isPlatformAdmin() && $membership?->role !== 'owner') {
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
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('document_number', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%");
            });
        }
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }

        $documents = $query->latest('id')->paginate(20);

        if ($request->wantsJson()) {
            return response()->json($documents);
        }

        $stats = [
            'pending_count'   => ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'pending')->count(),
            'pending_amount'  => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'pending')->sum('amount'),
            'returned_count'  => ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'returned')->count(),
            'returned_amount' => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'returned')->sum('amount'),
            'approved_count'  => ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'approved')->count(),
            'approved_amount' => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'approved')->sum('amount'),
            'rejected_count'  => ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'rejected')->count(),
            'rejected_amount' => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->where('status', 'rejected')->sum('amount'),
            'total_count'     => ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->count(),
            'total_amount'    => (float) ApprovalDocument::where('tenant_id', $tenant->id)->where('maker_id', $user->id)->sum('amount'),
        ];

        return Inertia::render('Approvals/MySubmissions', [
            'documents' => $documents,
            'stats'     => $stats,
            'filters'   => $request->only(['status', 'type', 'search', 'from_date', 'to_date', 'filter']),
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
                'currentRevision.maker:id,name,email',
                'revisions.maker:id,name,email',
                'transitions.actor:id,name,email',
            ])
            ->firstOrFail();

        // Enrich revisions' payloads with human-readable relation names
        if ($doc->revisions) {
            foreach ($doc->revisions as $rev) {
                if (is_array($rev->payload)) {
                    $rev->payload = $this->enrichPayload($tenant->id, $rev->payload);
                }
            }
        }
        if ($doc->currentRevision && is_array($doc->currentRevision->payload)) {
            $doc->currentRevision->payload = $this->enrichPayload($tenant->id, $doc->currentRevision->payload);
        }

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

        // R14 FIX: canApprove requires business eligibility for this document type,
        // matching assertReviewerEligible() in the engine. Holding approvals.review
        // alone is not sufficient if the reviewer lacks the business authority.
        $isBusinessEligible = in_array($doc->document_type, $this->approvalEngine->getEligibleDocumentTypes($tenant, $user), true);

        $canApprove = $hasReviewPerm && $isBusinessEligible && $doc->status === ApprovalDocument::STATUS_PENDING && (!$strictOwnerSeparation || !$isMaker || ($isOwner && !$strictOwnerSeparation)) && ($isOwner || !$isMaker);
        $canWithdraw = $isMaker && in_array($doc->status, [ApprovalDocument::STATUS_DRAFT, ApprovalDocument::STATUS_PENDING, ApprovalDocument::STATUS_RETURNED], true);
        $canResubmit = $isMaker && ($doc->status === ApprovalDocument::STATUS_RETURNED);

        $responseData = [
            'document'          => $doc,
            'canApprove'        => $canApprove,
            'isMaker'           => $isMaker,
            'canWithdraw'       => $canWithdraw,
            'canResubmit'       => $canResubmit,
            'warehouses'        => \App\Models\Warehouse::where('tenant_id', $tenant->id)->get(['id', 'name', 'is_default']),
            'bankAccounts'      => \App\Models\BankAccount::where('tenant_id', $tenant->id)->get(['id', 'name', 'account_number', 'bank_name', 'current_balance']),
            'expenseCategories' => \App\Models\ExpenseCategory::where('tenant_id', $tenant->id)->get(['id', 'name']),
            'categories'        => \App\Models\ExpenseCategory::where('tenant_id', $tenant->id)->get(['id', 'name']),
            'suppliers'         => \Illuminate\Support\Facades\DB::table('parties')->where('tenant_id', $tenant->id)->whereIn('type', ['supplier', 'both', 'customer'])->orderBy('name')->get(['id', 'name', 'phone', 'current_balance']),
            'customers'         => \Illuminate\Support\Facades\DB::table('parties')->where('tenant_id', $tenant->id)->whereIn('type', ['customer', 'both'])->orderBy('name')->get(['id', 'name', 'phone', 'current_balance']),
            'parties'           => \Illuminate\Support\Facades\DB::table('parties')->where('tenant_id', $tenant->id)->orderBy('name')->get(['id', 'name', 'phone', 'type', 'current_balance']),
            'products'          => \Illuminate\Support\Facades\DB::table('products')->where('tenant_id', $tenant->id)->orderBy('name')->get(['id', 'name', 'sku', 'base_unit', 'base_unit as unit', 'tax_rate', 'cost_price', 'stock_quantity']),
            'returnReasons'     => ApprovalReturnReason::where('is_active', true)
                ->where(fn($q) => $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id))
                ->get(),
        ];

        if ($request->wantsJson()) {
            return response()->json($responseData);
        }

        return Inertia::render('Approvals/Show', $responseData);
    }

    /**
     * Enrich raw document payload with human-readable party, warehouse, bank, and item names.
     */
    private function enrichPayload(int $tenantId, array $payload): array
    {
        try {
            // Party lookup (party_id, supplier_id, customer_id)
            $partyId = $payload['party_id'] ?? $payload['supplier_id'] ?? $payload['customer_id'] ?? null;
            if ($partyId) {
                $party = \App\Models\Party::where('tenant_id', $tenantId)->find($partyId);
                if ($party) {
                    if (empty($payload['party_name'])) $payload['party_name'] = $party->name;
                    if (empty($payload['supplier_name'])) $payload['supplier_name'] = $party->name;
                    if (empty($payload['customer_name'])) $payload['customer_name'] = $party->name;
                    if (empty($payload['party_phone'])) $payload['party_phone'] = $party->phone;
                    if (empty($payload['party_email'])) $payload['party_email'] = $party->email;
                    if (empty($payload['party_address'])) $payload['party_address'] = $party->address;
                    if (empty($payload['party_type'])) $payload['party_type'] = $party->type;
                    if (!isset($payload['party_balance'])) $payload['party_balance'] = (float)($party->current_balance ?? 0);
                }
            }

            // Warehouse lookup
            $warehouseId = $payload['warehouse_id'] ?? null;
            if ($warehouseId && empty($payload['warehouse_name'])) {
                $wh = \App\Models\Warehouse::where('tenant_id', $tenantId)->find($warehouseId);
                if ($wh) {
                    $payload['warehouse_name'] = $wh->name;
                }
            }

            // Expense category lookup
            $catId = $payload['expense_category_id'] ?? $payload['category_id'] ?? null;
            if ($catId && empty($payload['expense_category_name']) && empty($payload['category_name'])) {
                $cat = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->find($catId);
                if ($cat) {
                    $payload['expense_category_name'] = $cat->name;
                }
            }

            // Bank Account lookup
            $bankId = $payload['bank_account_id'] ?? $payload['account_id'] ?? $payload['payment_account_id'] ?? null;
            if ($bankId && empty($payload['bank_account_name']) && empty($payload['account_name'])) {
                $bank = \App\Models\BankAccount::where('tenant_id', $tenantId)->find($bankId);
                if ($bank) {
                    $payload['bank_account_name'] = $bank->name . ($bank->bank_name ? " ({$bank->bank_name})" : '');
                }
            }

            // Transfer accounts lookup
            if (!empty($payload['from_account_id']) && empty($payload['from_account_name'])) {
                $bank = \App\Models\BankAccount::where('tenant_id', $tenantId)->find($payload['from_account_id']);
                if ($bank) $payload['from_account_name'] = $bank->name;
            }
            if (!empty($payload['to_account_id']) && empty($payload['to_account_name'])) {
                $bank = \App\Models\BankAccount::where('tenant_id', $tenantId)->find($payload['to_account_id']);
                if ($bank) $payload['to_account_name'] = $bank->name;
            }

            // Items lookup (product names, sku, units, barcodes)
            if (!empty($payload['items']) && is_array($payload['items'])) {
                $productIds = array_filter(array_column($payload['items'], 'product_id'));
                $products = [];
                if (!empty($productIds)) {
                    $products = \App\Models\Product::where('tenant_id', $tenantId)->whereIn('id', $productIds)->get()->keyBy('id');
                }
                foreach ($payload['items'] as &$item) {
                    $pId = $item['product_id'] ?? null;
                    if ($pId && isset($products[$pId])) {
                        $p = $products[$pId];
                        if (empty($item['product_name']) && empty($item['item_name']) && empty($item['name'])) {
                            $item['product_name'] = $p->name;
                        }
                        if (empty($item['sku'])) {
                            $item['sku'] = $p->sku;
                        }
                        if (empty($item['barcode'])) {
                            $item['barcode'] = $p->getAttribute('barcode') ?? $p->sku ?? null;
                        }
                        if (empty($item['unit_name']) && empty($item['unit'])) {
                            $item['unit_name'] = is_string($p->unit) ? $p->unit : 'pcs';
                        }
                    }
                }
                unset($item);
            }
            // Cheque leaf lookup
            $chequeLeafId = $payload['cheque_leaf_id'] ?? null;
            if ($chequeLeafId && empty($payload['cheque_number'])) {
                $leaf = \App\Models\ChequeLeaf::where('tenant_id', $tenantId)->find($chequeLeafId);
                if ($leaf) {
                    $payload['cheque_number'] = $leaf->leaf_number;
                    $payload['cheque_status'] = $leaf->status;
                }
            }

            // Allocations enrichment (for invoice/bill payments)
            if (!empty($payload['allocations']) && is_array($payload['allocations'])) {
                foreach ($payload['allocations'] as &$alloc) {
                    if (empty($alloc['invoice_number']) && !empty($alloc['sale_id'])) {
                        $sale = \App\Models\Sale::where('tenant_id', $tenantId)->find($alloc['sale_id']);
                        if ($sale) $alloc['invoice_number'] = $sale->invoice_number;
                    }
                    if (empty($alloc['bill_number']) && !empty($alloc['purchase_id'])) {
                        $pur = \App\Models\Purchase::where('tenant_id', $tenantId)->find($alloc['purchase_id']);
                        if ($pur) $alloc['bill_number'] = $pur->purchase_number ?? $pur->supplier_invoice;
                    }
                }
                unset($alloc);
            }
        } catch (\Throwable $e) {
            \Log::warning('Approval payload enrichment skipped: ' . $e->getMessage());
        }

        return $payload;
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

        $updatedPayload = $request->input('updated_payload') ?? $request->input('payload');
        $updatedAmount = $request->input('updated_amount') ?? $request->input('amount');
        if ($updatedAmount !== null) {
            $updatedAmount = (float)$updatedAmount;
        }

        try {
            $res = $this->approvalEngine->approve(
                documentId: (int)$id,
                tenant: $tenant,
                reviewer: $user,
                expectedVersion: (int)$version,
                reviewerNotes: $request->input('notes'),
                updatedPayload: $updatedPayload,
                updatedAmount: $updatedAmount
            );

            if ($request->header('X-Inertia')) {
                return redirect()->to('/s/' . $tenant->slug . '/approvals/inbox')->with('success', 'Document approved and posted successfully.');
            }

            return response()->json([
                'success'       => true,
                'message'       => 'Document approved and posted successfully.',
                'posted_result' => $res['posted_result'],
            ]);
        } catch (\InvalidArgumentException | \RuntimeException $e) {
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['approval' => $e->getMessage()]);
            }
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
