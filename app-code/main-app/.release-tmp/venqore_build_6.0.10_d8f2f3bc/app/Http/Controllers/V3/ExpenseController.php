<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\ExpensePostingService;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(
        private ExpensePostingService $postingService,
        private ApprovalPolicyResolver $policyResolver,
        private ApprovalExecutionEngine $approvalEngine
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'    => ['required', 'string', 'max:500'],
            'expense_date'   => ['required', 'date', 'before_or_equal:today'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank'],
            'input_tax'      => ['nullable', 'numeric', 'min:0'],
        ]);

        $amount      = (float) $validated['amount'];
        $inputTax    = (float) ($validated['input_tax'] ?? 0);
        $totalPaid   = round($amount + $inputTax, 2);

        $tenant = app('current.tenant');
        $user = auth()->user();

        // ── Maker-Checker Approval Interception ──────────────────────────────
        $policy = $this->policyResolver->resolve(
            tenant: $tenant,
            user: $user,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            amount: $totalPaid
        );

        if ($policy['requires_approval']) {
            $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
            $doc = $this->approvalEngine->submit(
                tenant: $tenant,
                maker: $user,
                documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
                payload: $validated,
                amount: $totalPaid,
                description: 'Expense — ' . ($validated['description'] ?? ''),
                idempotencyKey: $idempotencyKey
            );

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'status'               => 'pending_approval',
                    'approval_document_id' => $doc->id,
                    'document_number'      => $doc->document_number,
                    'message'              => 'Operating expense submitted for approval.',
                ], 202);
            }

            return redirect()->back()->with('info', 'Operating expense submitted for approval.');
        }

        $result = $this->postingService->post($tenant, $validated, $user);

        return redirect()->back()->with('success', 'Expense posted.');
    }
}
