<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\CustomerPaymentPostingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CustomerPaymentController extends Controller
{
    public function __construct(
        private CustomerPaymentPostingService $postingService,
        private ApprovalPolicyResolver $policyResolver,
        private ApprovalExecutionEngine $approvalEngine
    ) {}

    public function store(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        // Both the paying party and every invoice must belong to the CURRENT
        // store (the bare exists: rules accepted another store's ids, and a
        // foreign sale id then blew up inside the allocation as a 500), and
        // each invoice must belong to the customer who is paying.
        $validated = $request->validate([
            'customer_id'    => ['required', 'string', Rule::exists('parties', 'id')->where('tenant_id', $tenantId)],
            'payment_date'   => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'in:cash,bank'],
            'bank_account_id' => ['nullable', 'string', Rule::exists('bank_accounts', 'id')->where('tenant_id', $tenantId)],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'reference'      => ['nullable', 'string', 'max:100'],
            'allocations'    => ['required', 'array', 'min:1'],
            'allocations.*.sale_id' => ['required', 'string', Rule::exists('sales', 'id')->where('tenant_id', $tenantId)],
            'allocations.*.amount'  => ['required', 'numeric', 'min:0.01'],
        ]);

        foreach ($validated['allocations'] as $i => $allocation) {
            $belongsToCustomer = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->where('id', $allocation['sale_id'])
                ->where('party_id', $validated['customer_id'])
                ->exists();

            if (!$belongsToCustomer) {
                throw ValidationException::withMessages([
                    "allocations.{$i}.sale_id" => 'This invoice does not belong to the selected customer.',
                ]);
            }
        }

        // Validate allocation total does not exceed payment amount
        $allocTotal = array_sum(array_column($validated['allocations'], 'amount'));
        if (round($allocTotal, 2) > round($validated['amount'], 2)) {
            return back()->withErrors([
                'allocations' => 'Total allocations (' . $allocTotal . ') exceed ' .
                                 'payment amount (' . $validated['amount'] . ').',
            ]);
        }

        $tenant = app('current.tenant');
        $user = auth()->user();

        // ── Maker-Checker Approval Interception ──────────────────────────────
        $policy = $this->policyResolver->resolve(
            tenant: $tenant,
            user: $user,
            documentType: ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            amount: (float)$validated['amount']
        );

        if ($policy['requires_approval']) {
            $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
            $doc = $this->approvalEngine->submit(
                tenant: $tenant,
                maker: $user,
                documentType: ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
                payload: $validated,
                amount: (float)$validated['amount'],
                description: 'Customer payment — ' . ($validated['reference'] ?? ''),
                idempotencyKey: $idempotencyKey
            );

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'status'               => 'pending_approval',
                    'approval_document_id' => $doc->id,
                    'document_number'      => $doc->document_number,
                    'message'              => 'Customer payment submitted for approval.',
                ], 202);
            }

            return redirect()->back()->with('info', 'Customer payment submitted for approval.');
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

        return redirect()->back()->with('success', 'Customer payment posted.');
    }
}
