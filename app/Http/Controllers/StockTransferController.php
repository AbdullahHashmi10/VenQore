<?php

namespace App\Http\Controllers;

use App\Models\StockTransfer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    /**
     * Display a listing of stock transfers.
     */
    public function index(Request $request)
    {
        $query = StockTransfer::query()
            ->with(['fromWarehouse', 'toWarehouse', 'creator']); // Assuming relationships exist

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('reference_number', 'like', "%{$search}%");
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $transfers = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        $stats = [
            'total_transfers' => StockTransfer::count(),
            'in_progress' => StockTransfer::where('status', 'in_progress')->count(),
            'completed' => StockTransfer::where('status', 'completed')->count(),
            'pending_approval' => StockTransfer::where('status', 'pending')->count(),
        ];

        return Inertia::render('StockTransfers/StockTransfers', [
            'transfers' => $transfers,
            'filters' => $request->only(['search', 'status']),
            'stats' => $stats
        ]);
    }

    public function create()
    {
        return Inertia::render('StockTransfers/Create', [
             'warehouses' => \App\Models\Warehouse::query()->get(),
             'products' => \App\Models\Product::select('id', 'name', 'code')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'transfer_date' => 'required|date',
            'status' => 'required|in:pending,in_progress,completed',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $transfer = StockTransfer::create([
                'from_warehouse_id' => $validated['from_warehouse_id'],
                'to_warehouse_id' => $validated['to_warehouse_id'],
                'transfer_date' => $validated['transfer_date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'],
                'created_by' => auth()->id(),
                'completed_at' => $validated['status'] === 'completed' ? now() : null,
            ]);

            foreach ($validated['items'] as $itemData) {
                // Create Item Record
                $transfer->items()->create([
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                ]);

                // Move Stock if Completed
                if ($validated['status'] === 'completed') {
                    $this->moveStock($itemData['product_id'], $validated['from_warehouse_id'], $validated['to_warehouse_id'], $itemData['quantity'], $transfer->reference_number);
                }
            }
        });

        return redirect()->route('stock-transfers.index')->with('success', 'Stock Transfer created successfully.');
    }

    protected function moveStock($productId, $fromWarehouseId, $toWarehouseId, $quantity, $reference)
    {
        // 1. Deduct from Source
        $sourceStock = \App\Models\Stock::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $fromWarehouseId],
            ['quantity' => 0]
        );
        $sourceStock->decrement('quantity', $quantity);

        \App\Models\StockMovement::create([
             'product_id' => $productId,
             'warehouse_id' => $fromWarehouseId,
             'type' => 'transfer_out',
             'quantity' => -$quantity,
             'reference' => $reference,
             'user_id' => auth()->id(),
             'description' => "Transfer to Warehouse #$toWarehouseId"
        ]);

        // 2. Add to Destination
        $destStock = \App\Models\Stock::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $toWarehouseId],
            ['quantity' => 0]
        );
        $destStock->increment('quantity', $quantity);

        \App\Models\StockMovement::create([
             'product_id' => $productId,
             'warehouse_id' => $toWarehouseId,
             'type' => 'transfer_in',
             'quantity' => $quantity,
             'reference' => $reference,
             'user_id' => auth()->id(),
             'description' => "Transfer from Warehouse #$fromWarehouseId"
        ]);
    }

    public function show($id)
    {
        $transfer = StockTransfer::with(['fromWarehouse', 'toWarehouse', 'items.product', 'creator'])->findOrFail($id);
        return Inertia::render('StockTransfers/Show', ['transfer' => $transfer]);
    }
}
