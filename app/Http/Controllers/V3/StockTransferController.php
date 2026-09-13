<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function __construct(
        private \App\Engines\InventoryService $inventory
    ) {}

    public function store(Request $request)
    {
        // Product and both warehouses must be this store's.
        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'product_id'         => ['required', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'from_warehouse_id'  => ['required', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId)],
            'to_warehouse_id'    => ['required', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId),
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
