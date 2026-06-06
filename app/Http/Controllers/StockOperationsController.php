<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StockOperationsController extends Controller
{
    public function index()
    {
        // 1. Ensure default warehouse exists
        $defaultWarehouse = Warehouse::first();
        if (!$defaultWarehouse) {
            $defaultWarehouse = Warehouse::create([
                'name' => 'Main Warehouse',
                'location' => 'Main Location',
            ]);
        }

        // 3. Fix orphaned stock (stock without warehouse_id)
        Stock::whereNull('warehouse_id')->update(['warehouse_id' => $defaultWarehouse->id]);

        $products = Product::with(['category', 'stocks.warehouse'])
            ->select('id', 'name', 'sku', 'category_id', 'stock_quantity')
            ->get();

        $warehouses = Warehouse::query()->get();

        return Inertia::render('StockOperations', [
            'products' => $products,
            'warehouses' => $warehouses,
            'reasons' => ['Damaged', 'Stolen', 'Found', 'Expired', 'Lost', 'Return', 'Correction', 'Other'],
        ]);
    }

    public function transfer(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'quantity' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string',
        ]);

        /** @var \App\Services\V3\InventoryService $v3Inventory */
        $v3Inventory = resolve(\App\Services\V3\InventoryService::class);
        $v3Inventory->transferStock(
            productId: $validated['product_id'],
            fromWarehouseId: $validated['from_warehouse_id'],
            toWarehouseId: $validated['to_warehouse_id'],
            qty: (float) $validated['quantity'],
            reason: $validated['notes']
        );

        return redirect()->back()->with('success', 'Stock transferred successfully');
    }

    public function adjust(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'adjustment_type' => 'required|in:add,remove',
            'quantity' => 'required|numeric|min:0.001',
            'reason' => 'required|string',
            'notes' => 'required|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $quantity = (float) $validated['quantity'];
        $direction = $validated['adjustment_type'] === 'add' ? 'increase' : 'decrease';

        /** @var \App\Services\V3\InventoryService $v3Inventory */
        $v3Inventory = resolve(\App\Services\V3\InventoryService::class);
        $v3Inventory->adjustStock(
            productId:   $validated['product_id'],
            warehouseId: $validated['warehouse_id'],
            qty:         $quantity,
            direction:   $direction,
            unitCost:    (float) ($product->cost_price ?? 0),
            reason:      "Manual Adjustment: " . $validated['reason'] . " (" . $validated['notes'] . ")"
        );

        return redirect()->back()->with('success', 'Stock adjusted successfully');
    }

    public function audit(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'audit_items' => 'required|array',
            'audit_items.*.product_id' => 'required|exists:products,id',
            'audit_items.*.physical_count' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            /** @var \App\Services\V3\InventoryService $v3Inventory */
            $v3Inventory = resolve(\App\Services\V3\InventoryService::class);

            foreach ($validated['audit_items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                $stock = Stock::where('product_id', $item['product_id'])
                    ->where('warehouse_id', $validated['warehouse_id'])
                    ->first();

                $currentQty = $stock ? (float) $stock->quantity : 0;
                $difference = (float) $item['physical_count'] - $currentQty;

                if ($difference != 0) {
                    $v3Inventory->adjustStock(
                        productId:   $item['product_id'],
                        warehouseId: $validated['warehouse_id'],
                        qty:         abs($difference),
                        direction:   $difference > 0 ? 'increase' : 'decrease',
                        unitCost:    (float) ($product->cost_price ?? 0),
                        reason:      sprintf(
                            "Stock Take Adjustment. Physical: %s, System: %s",
                            $item['physical_count'],
                            $currentQty
                        )
                    );
                }
            }
        });

        return redirect()->back()->with('success', 'Stock audit completed successfully');
    }

    public function storeWarehouse(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        Warehouse::create([
            'name' => $validated['name'],
            'location' => $validated['location'],
            // 'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Warehouse created successfully');
    }

    public function updateWarehouse(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
        ]);

        $warehouse->update($validated);

        return redirect()->back()->with('success', 'Warehouse updated successfully');
    }
}
