<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function __construct(
        private \App\Services\V3\InventoryService $inventory
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id'         => ['required', 'string', 'exists:products,id'],
            'from_warehouse_id'  => ['required', 'string', 'exists:warehouses,id'],
            'to_warehouse_id'    => ['required', 'string', 'exists:warehouses,id',
                                     'different:from_warehouse_id'],
            'qty'                => ['required', 'numeric', 'min:0.0001'],
            'reason'             => ['nullable', 'string', 'max:500'],
        ]);

        $this->inventory->transferStock(
            productId:       $validated['product_id'],
            fromWarehouseId: $validated['from_warehouse_id'],
            toWarehouseId:   $validated['to_warehouse_id'],
            qty:             (float) $validated['qty'],
            reason:          $validated['reason'] ?? null
        );

        return redirect()->back()
            ->with('success', 'Stock transferred successfully.');
    }
}
