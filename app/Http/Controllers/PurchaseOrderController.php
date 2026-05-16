<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'warehouse', 'user', 'items.product']);

        // Search
        if ($request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('reference_number', 'like', "%{$term}%")
                  ->orWhereHas('supplier', function ($q) use ($term) {
                      $q->where('name', 'like', "%{$term}%");
                  });
            });
        }

        // Filter by Status
        if ($request->filter && $request->filter !== 'all' && $request->filter !== 'custom') {
            if ($request->filter === 'today') {
                $query->whereDate('order_date', now()->toDateString());
            } elseif ($request->filter === 'month') {
                $query->whereMonth('order_date', now()->month)->whereYear('order_date', now()->year);
            } else {
                $query->where('status', $request->filter);
            }
        }

        // Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('order_date', [$request->from_date, $request->to_date]);
        }

        $orders = $query->latest()->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($orders);
        }

        return Inertia::render('PurchaseOrders/PurchaseOrdersList', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date']),
            'suppliers' => Supplier::query()->get(),
            'warehouses' => Warehouse::query()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('PurchaseOrders/Create', [
            'suppliers' => Supplier::query()->get(),
            'warehouses' => Warehouse::query()->get(),
            'products' => Product::select('id', 'name', 'sku', 'cost_price')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'status' => 'nullable|in:ordered,received'
        ]);

        $po = DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'reference_number' => 'PO-' . date('Ymd') . '-' . rand(1000, 9999),
                'status' => 'ordered',
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'notes' => $validated['notes'],
                'user_id' => auth()->id(),
                'total_amount' => 0, // Calculated below
            ]);

            $total = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_cost'];
                $total += $lineTotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $lineTotal,
                ]);
            }

            $po->update(['total_amount' => $total]);

            // Handle Immediate Receive
            if (($validated['status'] ?? 'ordered') === 'received') {
                $po->update(['status' => 'received']);
                foreach ($po->items as $item) {
                    // V3 Inventory: Create Batch
                    app(\App\Services\V3\FifoService::class)->receiveBatch(
                        $item->product_id,
                        $po->warehouse_id,
                        $item->quantity,
                        $item->unit_cost,
                        'purchase',
                        $po->id
                    );

                    // Log Movement
                    \App\Models\StockMovement::create([
                        'product_id' => $item->product_id,
                        'warehouse_id' => $po->warehouse_id,
                        'quantity' => $item->quantity,
                        'type' => 'purchase',
                        'description' => "Received PO #{$po->reference_number} (Direct)",
                        'user_id' => auth()->id(),
                    ]);

                     // Update item received qty
                    $item->update(['received_quantity' => $item->quantity]);

                     // Update Product Cost Price
                    $item->product->update(['cost_price' => $item->unit_cost]);
                }
            }
            return $po;
        });

        if ($request->wantsJson()) {
            return response()->json(['id' => $po->id, 'success' => true, 'message' => 'Purchase Order created successfully.']);
        }

        return redirect()->route('purchase-orders.index')->with('success', 'Purchase Order created successfully.');
    }

    public function edit(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['items.product']);
        return Inertia::render('PurchaseOrders/Create', [
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => Supplier::query()->get(),
            'warehouses' => Warehouse::query()->get(),
            'products' => Product::select('id', 'name', 'sku', 'cost_price')->get(),
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status === 'received') {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => 'Cannot update a received order. It is immutable.'], 403);
            }
            return redirect()->back()->with('error', 'Cannot update a received order.');
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder, $request) {
            $purchaseOrder->update([
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'notes' => $validated['notes'],
            ]);

            // Simple update: delete old items and create new ones
            $purchaseOrder->items()->delete();

            $total = 0;
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_cost'];
                $total += $lineTotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $lineTotal,
                ]);
            }

            $purchaseOrder->update(['total_amount' => $total]);

            // Handle Status Transition to 'received'
            if ($request->input('status') === 'received' && $purchaseOrder->status !== 'received') {
                $purchaseOrder->update(['status' => 'received']);
                foreach ($purchaseOrder->items as $item) {
                    // V3 Inventory: Create Batch
                    app(\App\Services\V3\FifoService::class)->receiveBatch(
                        $item->product_id,
                        $purchaseOrder->warehouse_id,
                        $item->quantity,
                        $item->unit_cost,
                        'purchase',
                        $purchaseOrder->id
                    );

                    // Log Movement
                    \App\Models\StockMovement::create([
                        'product_id' => $item->product_id,
                        'warehouse_id' => $purchaseOrder->warehouse_id,
                        'quantity' => $item->quantity,
                        'type' => 'purchase',
                        'description' => "Received PO #{$purchaseOrder->reference_number} (Via Edit)",
                        'user_id' => auth()->id(),
                    ]);

                    // Update item received qty
                    $item->update(['received_quantity' => $item->quantity]);

                    // Update Product Cost Price
                    $item->product->update(['cost_price' => $item->unit_cost]);
                }
            }
        });

        if ($request->wantsJson()) {
            return response()->json(['id' => $purchaseOrder->id, 'success' => true, 'message' => 'Purchase Order updated successfully.']);
        }

        return redirect()->route('purchase-orders.index')->with('success', 'Purchase Order updated successfully.');
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'warehouse', 'items.product', 'user']);
        return Inertia::render('PurchaseOrders/Show', ['order' => $purchaseOrder]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status === 'received') {
            return redirect()->back()->with('error', 'Order already received.');
        }

        DB::transaction(function () use ($purchaseOrder) {
            foreach ($purchaseOrder->items as $item) {
                // V3 Inventory: Create Batch
                app(\App\Services\V3\FifoService::class)->receiveBatch(
                    $item->product_id,
                    $purchaseOrder->warehouse_id,
                    $item->quantity,
                    $item->unit_cost,
                    'purchase',
                    $purchaseOrder->id
                );

                // Log Movement
                StockMovement::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $purchaseOrder->warehouse_id,
                    'quantity' => $item->quantity,
                    'type' => 'purchase',
                    'description' => "Received PO #{$purchaseOrder->reference_number}",
                    'user_id' => auth()->id(),
                ]);

                // Update item received qty
                $item->update(['received_quantity' => $item->quantity]);

                // Update Product Cost Price (Last Price)
                $item->product->update(['cost_price' => $item->unit_cost]);
            }

            $purchaseOrder->update(['status' => 'received']);
        });

        return redirect()->back()->with('success', 'Stock received successfully.');
    }
    public function print(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'warehouse', 'items.product', 'user']);
        // For now, return a simple view or the Show page as print friendly, or raw text if no print view exists
        // Ideally: return Inertia::render('PurchaseOrders/Print', ['order' => $purchaseOrder]);
        // Or specific PDF generation.
        // We'll mimic the Show page for now but user might want dedicated print.
        return Inertia::render('PurchaseOrders/Show', ['order' => $purchaseOrder, 'print' => true]);
    }
}
