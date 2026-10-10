<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\SaleService;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SaleReturnController extends Controller
{
    public function __construct(
        private SaleService $sales
    ) {}

    public function store(Request $request, string $saleId)
    {
        // Each returned line must be a line of THIS sale, in this store.
        $validated = $request->validate([
            'return_date' => ['required', 'date', 'before_or_equal:today'],
            'reason'      => ['required', 'string', 'max:500'],
            'items'       => ['nullable', 'array'],
            'items.*.sale_item_id' => ['required', 'string', Rule::exists('sale_items', 'id')
                ->where('tenant_id', app('current.tenant')->id)
                ->where('sale_id', $saleId)],
            'items.*.return_qty'   => ['required', 'numeric', 'min:0.0001'],
        ]);

        $tenant = app('current.tenant');
        $user   = auth()->user();

        $saleRow = \Illuminate\Support\Facades\DB::table('sales')->where('tenant_id', $tenant->id)->where('id', $saleId)->first();
        if ($saleRow && !empty($saleRow->stock_at_dispatch) && ($saleRow->delivery_status ?? 'delivered') !== 'delivered') {
            return back()->withErrors(['error' => 'Some goods on this invoice have not been dispatched yet. Finish the dispatch, or void the invoice.']);
        }

        // ── Approval interception ─────────────────────────────────────────────
        // R09 FIX: Compute the actual return amount server-side before the policy
        // decision. The old code hardcoded $returnAmount = 0, meaning threshold
        // checks were always evaluated against zero — a zero amount can never
        // exceed a positive threshold, effectively disabling threshold-based
        // approval for all sales returns regardless of value.
        //
        // We load each sale_item by its ID from the validated items array and sum
        // (return_qty × unit_price). If no items are specified (full return), we
        // read the original sale's total directly. This is the best server-side
        // estimate at submission time; the adapter revalidates at approval time.
        $returnAmount = 0.0;

        if (!empty($validated['items'])) {
            $saleItemIds = array_column($validated['items'], 'sale_item_id');
            if (!empty($saleItemIds)) {
                $saleItemPrices = \Illuminate\Support\Facades\DB::table('sale_items')
                    ->where('tenant_id', $tenant->id)
                    ->where('sale_id', $saleId)
                    ->whereIn('id', $saleItemIds)
                    ->pluck('unit_price', 'id');

                foreach ($validated['items'] as $item) {
                    $unitPrice    = (float) ($saleItemPrices[$item['sale_item_id']] ?? 0);
                    $returnQty    = (float) ($item['return_qty'] ?? 0);
                    $returnAmount += $unitPrice * $returnQty;
                }
                $returnAmount = round($returnAmount, 2);
            }
        } else {
            // Full return: use original sale total as the threshold basis.
            $saleTotal = \Illuminate\Support\Facades\DB::table('sales')
                ->where('tenant_id', $tenant->id)
                ->where('id', $saleId)
                ->value('total');
            $returnAmount = round((float) $saleTotal, 2);
        }

        $policy = resolve(ApprovalPolicyResolver::class)->resolve(
            tenant:       $tenant,
            user:         $user,
            documentType: ApprovalDocument::TYPE_SALES_RETURN,
            amount:       $returnAmount,
        );

        if ($policy['requires_approval']) {
            $doc = resolve(ApprovalExecutionEngine::class)->submit(
                tenant:       $tenant,
                maker:        $user,
                documentType: ApprovalDocument::TYPE_SALES_RETURN,
                payload:      array_merge($validated, [
                    'sale_id' => $saleId,
                    '_path'   => 'full',          // SalesReturnApprovalAdapter dispatch key
                ]),
                amount:       $returnAmount,
                description:  'Sales return for sale #' . $saleId . ' — ' . $validated['reason'],
                idempotencyKey: $request->header('Idempotency-Key'),
            );
            return redirect()->back()->with('info',
                'Sales return submitted for approval (ref: ' . $doc->document_number . ').'
            );
        }
        // ── Direct path ───────────────────────────────────────────────────────
        $this->sales->reverse(
            saleId:     $saleId,
            reason:     $validated['reason'],
            returnDate: $validated['return_date'],
            items:      $validated['items'] ?? []
        );

        return redirect()->back()->with('success', 'Sale return posted.');
    }
}
