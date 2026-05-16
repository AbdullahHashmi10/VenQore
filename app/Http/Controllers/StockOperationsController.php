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
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $product = Product::findOrFail($validated['product_id']);

            // Check source warehouse stock
            $sourceStock = Stock::where('product_id', $validated['product_id'])
                ->where('warehouse_id', $validated['from_warehouse_id'])
                ->first();

            if (!$sourceStock || $sourceStock->quantity < $validated['quantity']) {
                throw new \Exception('Insufficient stock in source warehouse');
            }

            // Deduct from source warehouse
            $sourceStock->decrement('quantity', $validated['quantity']);

            // Add to destination warehouse
            $destStock = Stock::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'warehouse_id' => $validated['to_warehouse_id'],
                ],
                ['quantity' => 0]
            );
            $destStock->increment('quantity', $validated['quantity']);

            // Record movements
            StockMovement::create([
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['from_warehouse_id'],
                'type' => 'transfer_out',
                'quantity' => -$validated['quantity'],
                'reference' => 'Transfer to ' . Warehouse::find($validated['to_warehouse_id'])->name,
                'notes' => $validated['notes'],
                'user_id' => auth()->id(),
            ]);

            StockMovement::create([
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['to_warehouse_id'],
                'type' => 'transfer_in',
                'quantity' => $validated['quantity'],
                'reference' => 'Transfer from ' . Warehouse::find($validated['from_warehouse_id'])->name,
                'notes' => $validated['notes'],
                'user_id' => auth()->id(),
            ]);

            // Update product total stock
            $product->stock_quantity = Stock::where('product_id', $product->id)->sum('quantity');
            $product->save();
        });

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

        DB::transaction(function () use ($validated, $request) {
            $product = Product::findOrFail($validated['product_id']);
            $quantity = (float) $validated['quantity'];
            $direction = $validated['adjustment_type'] === 'add' ? 'increase' : 'decrease';

            // V3 Sync - This handles both inventory_batches and accounting
            /** @var \App\Services\V3\InventoryService $v3Inventory */
            $v3Inventory = resolve(\App\Services\V3\InventoryService::class);
            $v3Inventory->adjustStock(
                productId:   $validated['product_id'],
                warehouseId: $validated['warehouse_id'],
                qty:         $quantity,
                direction:   $direction,
                unitCost:    (float) ($product->cost_price ?? 0),
                reason:      "Manual Adjustment: " . $validated['reason']
            );

            // Legacy Sync (for UI list)
            $stock = Stock::where('product_id', $validated['product_id'])
                ->where('warehouse_id', $validated['warehouse_id'])
                ->first();

            if ($stock) {
                if ($direction === 'increase') {
                    $stock->increment('quantity', $quantity);
                } else {
                    $stock->decrement('quantity', $quantity);
                }
            } else if ($direction === 'increase') {
                Stock::create([
                    'product_id' => $validated['product_id'],
                    'warehouse_id' => $validated['warehouse_id'],
                    'quantity' => $quantity
                ]);
            }

            // Record Movement
            StockMovement::create([
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'type' => 'adjustment',
                'quantity' => $direction === 'increase' ? $quantity : -$quantity,
                'reference' => 'Adjustment: ' . $validated['reason'],
                'notes' => $validated['notes'],
                'user_id' => auth()->id(),
            ]);

            // Update product total stock
            $product->stock_quantity = Stock::where('product_id', $product->id)->sum('quantity');
            $product->save();
        });

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
                    // V3 Sync - This handles both inventory_batches and accounting
                    $v3Inventory->adjustStock(
                        productId:   $item['product_id'],
                        warehouseId: $validated['warehouse_id'],
                        qty:         abs($difference),
                        direction:   $difference > 0 ? 'increase' : 'decrease',
                        unitCost:    (float) ($product->cost_price ?? 0),
                        reason:      "Audit Adjustment"
                    );

                    // Legacy Sync
                    if ($stock) {
                        $stock->quantity = $item['physical_count'];
                        $stock->save();
                    } else {
                        Stock::create([
                            'product_id' => $item['product_id'],
                            'warehouse_id' => $validated['warehouse_id'],
                            'quantity' => $item['physical_count']
                        ]);
                    }

                    // Record adjustment movement
                    StockMovement::create([
                        'product_id' => $item['product_id'],
                        'warehouse_id' => $validated['warehouse_id'],
                        'type' => 'audit_adjustment',
                        'quantity' => $difference,
                        'reference' => 'Stock Take Adjustment',
                        'notes' => sprintf(
                            'Physical count: %d, System count: %d, Difference: %d',
                            $item['physical_count'],
                            $currentQty,
                            $difference
                        ),
                        'user_id' => auth()->id(),
                    ]);

                    // Update product total stock
                    $product->stock_quantity = Stock::where('product_id', $product->id)->sum('quantity');
                    $product->save();
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
