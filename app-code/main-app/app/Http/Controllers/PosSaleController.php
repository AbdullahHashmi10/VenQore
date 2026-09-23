<?php

namespace App\Http\Controllers;

use App\Engines\SaleService;
use App\Http\Requests\V3\StoreSaleRequest;
use App\Models\ApprovalDocument;
use App\Models\RegisterShift;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosSaleController extends Controller
{
    public function __construct(
        private SaleService $saleService,
        private ApprovalExecutionEngine $approvalEngine,
        private ApprovalPolicyResolver $policyResolver
    ) {}

    /**
     * Dedicated POS sale checkout endpoint.
     * Enforces server-side register shift verification.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        // 1. Server-Side Shift Verification (Never trust client claims)
        $registerId = $request->input('register_id');
        $shiftQuery = RegisterShift::where('tenant_id', $tenant->id)
            ->where('status', 'open')
            ->where('opened_by', $user->id);

        if ($registerId) {
            $shiftQuery->where('register_id', $registerId);
        }

        $openShift = $shiftQuery->latest('id')->first();
        $isTrustedPos = ($openShift !== null);

        if (!$isTrustedPos) {
            return response()->json([
                'success' => false,
                'message' => 'POS Checkout requires an active, open cash register shift for the current cashier.',
                'errors'  => [
                    'register_shift' => ['No open register shift found for this cashier in the current store. Please open a shift before checkout.'],
                ],
            ], 422);
        }

        // 2. Resolve Policy for Verified POS
        $payload = $request->all();
        $amount = (float)($payload['total'] ?? $payload['payable_amount'] ?? 0.0);
        $policy = $this->policyResolver->resolve($tenant, $user, ApprovalDocument::TYPE_SALES_INVOICE, $amount, true);

        // 3. If POS Clearance passes, post directly to SaleService
        if (!$policy['requires_approval']) {
            $formattedItems = array_map(fn($item) => [
                'product_id'       => $item['product_id'],
                'qty'              => (float)($item['quantity'] ?? $item['qty'] ?? 1),
                'unit_price'       => (float)($item['unit_price'] ?? $item['price'] ?? 0),
                'discount_percent' => (float)($item['discount_percent'] ?? 0),
                'tax_rate'         => (float)($item['tax_rate'] ?? 0),
                'sale_uom'         => $item['sale_uom'] ?? 'pcs',
            ], (array)($payload['items'] ?? []));

            $saleData = [
                'items'             => $formattedItems,
                'customer_id'       => $payload['customer_id'] ?? null,
                'payment_method'    => $payload['payment_method'] ?? 'cash',
                'amount_received'   => (float)($payload['paid_amount'] ?? $amount),
                'register_shift_id' => $openShift->id,
                'register_id'       => $openShift->register_id,
                'source'            => 'pos',
                'idempotency_key'   => $payload['idempotency_key'] ?? null,
            ];

            $sale = $this->saleService->post($saleData);

            return response()->json([
                'success'        => true,
                'status'         => 'posted',
                'sale'           => $sale,
                'sale_id'        => $sale->id,
                'invoice_number' => $sale->reference_number ?? ($sale->invoice_number ?? null),
                'message'        => 'POS sale completed successfully.',
            ], 201);
        }

        // 4. Policy requires approval (e.g. amount escalation) -> Route to Maker-Checker Approval
        $idempotencyKey = $request->input('idempotency_key');
        $doc = $this->approvalEngine->submit(
            tenant: $tenant,
            maker: $user,
            documentType: ApprovalDocument::TYPE_SALES_INVOICE,
            payload: $payload,
            amount: $amount,
            description: 'POS sale routed to approval (' . $policy['reason'] . ')',
            idempotencyKey: $idempotencyKey
        );

        return response()->json([
            'success'              => true,
            'status'               => 'pending_approval',
            'approval_document_id' => $doc->id,
            'document_number'      => $doc->document_number,
            'reason'               => $policy['reason'],
            'message'              => 'Transaction has been submitted for manager approval.',
        ], 202);
    }
}
