<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use App\Engines\FifoService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\Approval\ApprovalExecutionEngine;
use Illuminate\Support\Facades\Auth;

class PurchaseReturnController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo,
        private \App\Engines\PurchaseService $purchaseService
    ) {}

    public function create(string $purchaseId)
    {
        $purchase = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $purchaseId)
            ->select('purchases.*', 'parties.name as supplier_name')
            ->firstOrFail();

        $items = DB::table('purchase_items')->where('purchase_items.tenant_id', app('current.tenant')->id)
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->join('inventory_batches',
                'purchase_items.inventory_batch_id', '=', 'inventory_batches.id')
            ->where('purchase_items.purchase_id', $purchaseId)
            ->select(
                'purchase_items.id',
                'purchase_items.product_id',
                'purchase_items.qty as original_qty',
                'purchase_items.unit_cost',
                'purchase_items.inventory_batch_id',
                'inventory_batches.remaining_qty',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get();

        return Inertia::render('V3/Purchases/Return', [
            'purchase' => $purchase,
            'items'    => $items,
        ]);
    }

    public function store(Request $request, string $purchaseId)
    {
        $tenantId = app('current.tenant')->id;

        // The purchase must be this store's (404 otherwise) ...
        DB::table('purchases')->where('tenant_id', $tenantId)->where('id', $purchaseId)->firstOrFail();

        // ... and every line / batch must be this purchase's, in this store.
        $validated = $request->validate([
            'return_date' => ['required', 'date', 'before_or_equal:today'],
            'reason'      => ['required', 'string', 'max:500'],
            'items'       => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id'   => ['required', 'string',
                                             Rule::exists('purchase_items', 'id')
                                                 ->where('tenant_id', $tenantId)
                                                 ->where('purchase_id', $purchaseId)],
            'items.*.inventory_batch_id' => ['required', 'string',
                                             Rule::exists('inventory_batches', 'id')->where('tenant_id', $tenantId)],
            'items.*.return_qty'         => ['required', 'numeric', 'min:0.0001'],
        ]);

        // ── Approval interception ───────────────────────────────────────────────
        $tenant = app('current.tenant');
        $user   = Auth::user();
        $amount = (float) collect($validated['items'])->sum(fn ($i) =>
            (float) ($i['return_qty'] ?? 0) * (float) DB::table('purchase_items')
                ->where('id', $i['purchase_item_id'])->value('unit_cost')
        );

        $policy = resolve(ApprovalPolicyResolver::class)->resolve(
            tenant:       $tenant,
            user:         $user,
            documentType: ApprovalDocument::TYPE_PURCHASE_RETURN,
            amount:       $amount,
        );

        if ($policy['requires_approval']) {
            $doc = resolve(ApprovalExecutionEngine::class)->submit(
                tenant:         $tenant,
                maker:          $user,
                documentType:   ApprovalDocument::TYPE_PURCHASE_RETURN,
                payload:        array_merge($validated, ['purchase_id' => $purchaseId]),
                amount:         $amount,
                description:    'Purchase return — purchase #' . $purchaseId,
                idempotencyKey: $request->header('Idempotency-Key'),
            );
            return redirect()
                ->route('store.v3.purchases.show', ['store_slug' => $tenant->slug, 'purchase' => $purchaseId])
                ->with('info', 'Return submitted for approval (ref: ' . $doc->document_number . ').');
        }

        // Direct path
        $this->purchaseService->createReturn($purchaseId, $validated);

        return redirect()
            ->route('store.v3.purchases.show', ['store_slug' => $tenant->slug, 'purchase' => $purchaseId])
            ->with('success', 'Purchase return posted successfully.');
    }
}
