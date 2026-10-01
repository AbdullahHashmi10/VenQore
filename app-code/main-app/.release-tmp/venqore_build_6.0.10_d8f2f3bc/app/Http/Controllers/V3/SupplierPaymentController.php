<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSupplierPaymentRequest;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\SupplierPaymentPostingService;
use Illuminate\Support\Facades\DB;

class SupplierPaymentController extends Controller
{
    public function __construct(
        private SupplierPaymentPostingService $postingService,
        private ApprovalPolicyResolver $policyResolver,
        private ApprovalExecutionEngine $approvalEngine
    ) {}

    public function store(StoreSupplierPaymentRequest $request)
    {
        $validated = $request->validated();
        $tenant = app('current.tenant');
        $user = auth()->user();

        // ── Maker-Checker Approval Interception ──────────────────────────────
        $policy = $this->policyResolver->resolve(
            tenant: $tenant,
            user: $user,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            amount: (float)$validated['amount']
        );

        if ($policy['requires_approval']) {
            $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
            $doc = $this->approvalEngine->submit(
                tenant: $tenant,
                maker: $user,
                documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
                payload: $validated,
                amount: (float)$validated['amount'],
                description: 'Supplier payment — ' . ($validated['reference'] ?? ''),
                idempotencyKey: $idempotencyKey
            );

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'status'               => 'pending_approval',
                    'approval_document_id' => $doc->id,
                    'document_number'      => $doc->document_number,
                    'message'              => 'Supplier payment submitted for approval.',
                ], 202);
            }

            return redirect()->back()->with('info', 'Supplier payment submitted for approval.');
        }

        try {
            $result = $this->postingService->post($tenant, $validated, $user);
        } catch (\App\Exceptions\OverAllocationException $e) {
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'errors'  => ['allocations' => [$e->getMessage()]],
                    'message' => $e->getMessage()
                ], 422);
            }
            return redirect()->back()->withErrors([
                'allocations' => $e->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', 'Supplier payment posted.');
    }

    private function updatePurchaseBadge(string $purchaseId): void
    {
        $this->payments->updatePurchaseBadge($purchaseId);
    }
}

