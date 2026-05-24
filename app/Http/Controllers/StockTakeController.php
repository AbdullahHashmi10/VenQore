<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class StockTakeController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\StockTake::with(['warehouse', 'creator']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('reference_number', 'like', "%{$search}%");
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $stockTakes = $query->orderBy('date', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('StockTake/StockTake', [
            'stock_takes' => $stockTakes,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total_audits' => \App\Models\StockTake::count(),
                'pending' => \App\Models\StockTake::where('status', 'draft')->count(),
                'completed' => \App\Models\StockTake::where('status', 'completed')->count(),
                'discrepancies' => \App\Models\StockTakeItem::where('difference', '!=', 0)->count(),
            ]
        ]);
    }
    
    public function create() 
    { 
        return Inertia::render('StockTake/Create', [
            'warehouses' => \App\Models\Warehouse::query()->get(),
            'products' => \App\Models\Product::select('id', 'name', 'code', 'cost_price')->get(),
            // Pass simple stock map for frontend Quick Look if needed, though robust solution typically fetches per warehouse
            'stocks' => \App\Models\Stock::select('warehouse_id', 'product_id', 'quantity')->get()->groupBy('warehouse_id')
        ]);
    }

    public function store(Request $request) 
    { 
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'date' => 'required|date',
            'status' => 'required|in:draft,completed',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            // 'items.*.expected_quantity' => 'required|numeric', // Can be trusted from frontend or recalculated
            'items.*.counted_quantity' => 'required|numeric',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $audit = \App\Models\StockTake::create([
                'warehouse_id' => $validated['warehouse_id'],
                'date' => $validated['date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'],
                'created_by' => auth()->id()
            ]);

            foreach ($validated['items'] as $itemData) {
                // Re-fetch expected quantity from DB to ensure accuracy if completing
                $currentStock = \App\Models\Stock::where('warehouse_id', $validated['warehouse_id'])
                    ->where('product_id', $itemData['product_id'])
                    ->value('quantity') ?? 0;
                
                $expected = $currentStock; 
                $counted = $itemData['counted_quantity'];
                $difference = $counted - $expected;
                
                $product = \App\Models\Product::find($itemData['product_id']);

                $audit->items()->create([
                    'product_id' => $itemData['product_id'],
                    'expected_quantity' => $expected,
                    'counted_quantity' => $counted,
                    'difference' => $difference,
                    'cost_price' => $product->cost_price ?? 0
                ]);

                if ($validated['status'] === 'completed' && $difference != 0) {
                    $this->adjustStock($itemData['product_id'], $validated['warehouse_id'], $difference, $audit->reference_number);
                }
            }
        });

        return redirect()->route('store.stock-takes.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Stock Audit saved successfully.');
    }

    protected function adjustStock($productId, $warehouseId, $difference, $reference)
    {
        $stock = \App\Models\Stock::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $warehouseId],
            ['quantity' => 0]
        );
        
        // Difference: +2 means we counted 2 more than expected -> Add 2
        // Difference: -2 means we counted 2 less -> Deduct 2
        
        // $stock->increment('quantity', $difference); // Legacy sync

        // V3 Logic: Must sync with inventory_batches for valuation
        /** @var \App\Services\V3\InventoryService $v3Inventory */
        $v3Inventory = resolve(\App\Services\V3\InventoryService::class);
        $v3Inventory->adjustStock(
            productId:   $productId,
            warehouseId: $warehouseId,
            qty:         abs($difference),
            direction:   $difference > 0 ? 'increase' : 'decrease',
            unitCost:    (float) (\App\Models\Product::find($productId)?->cost_price ?? 0),
            reason:      "Stock Take Adjustment ($reference)"
        );

        // Legacy movement logging (for reports that use it)
        \App\Models\StockMovement::create([
             'product_id' => $productId,
             'warehouse_id' => $warehouseId,
             'type' => $difference > 0 ? 'adjust_in' : 'adjust_out',
             'quantity' => $difference,
             'reference_id' => $reference,
             'user_id' => auth()->id(),
             'description' => "Stock Take Adjustment ($reference)"
        ]);
    }

    public function show($id) 
    { 
        $audit = \App\Models\StockTake::with(['warehouse', 'items.product', 'creator'])->findOrFail($id);
        return Inertia::render('StockTake/Show', ['audit' => $audit]); 
    }
}
