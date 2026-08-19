<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use App\Engines\FifoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

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
        $validated = $request->validate([
            'return_date' => ['required', 'date', 'before_or_equal:today'],
            'reason'      => ['required', 'string', 'max:500'],
            'items'       => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id'   => ['required', 'string',
                                             'exists:purchase_items,id'],
            'items.*.inventory_batch_id' => ['required', 'string',
                                             'exists:inventory_batches,id'],
            'items.*.return_qty'         => ['required', 'numeric', 'min:0.0001'],
        ]);

        $this->purchaseService->createReturn($purchaseId, $validated);

        return redirect()
            ->route('store.v3.purchases.show', ['store_slug' => app('current.tenant')->slug, 'purchase' => $purchaseId])
            ->with('success', 'Purchase return posted successfully.');
    }
}
