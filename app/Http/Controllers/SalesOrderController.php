<?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Stock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Party;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Warehouse;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrder::with(['customer', 'user', 'items.product']);

        // Search
        if ($request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('order_number', 'like', "%{$term}%")
                  ->orWhere('reference_number', 'like', "%{$term}%")
                  ->orWhereHas('customer', function ($q) use ($term) {
                      $q->where('name', 'like', "%{$term}%");
                  });
            });
        }

        // Filter by Status
        if ($request->filter && $request->filter !== 'all' && $request->filter !== 'custom') {
            if ($request->filter === 'today') {
                $query->whereDate('created_at', now()->toDateString());
            } elseif ($request->filter === 'month') {
                $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
            } elseif ($request->filter === 'year') {
                $query->whereYear('created_at', now()->year);
            } else {
                // If it's a status
                $query->where('status', $request->filter);
            }
        }

        // Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        $orders = $query->latest()->paginate(50)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($orders);
        }

        // Calculate stats
        $stats = [
            'total_orders' => SalesOrder::sum('total_amount'),
            'order_count' => SalesOrder::count(),
            'confirmed_count' => SalesOrder::where('status', 'confirmed')->count(),
            'pending_count' => SalesOrder::whereIn('status', ['pending', 'draft'])->count(),
        ];

        return Inertia::render('SalesOrders/PreSales', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date']),
            'stats' => $stats
        ]);
    }

    public function create()
    {
        // Get total stock from 'stocks' table (correctly handles negative values)
        $stockTotals = DB::table('stocks')
            ->select('product_id', DB::raw('SUM(quantity) as total_on_hand'))
            ->groupBy('product_id')
            ->pluck('total_on_hand', 'product_id');

        // Get reserved quantities from active Pre-Sales
        $reservedTotals = DB::table('sales_order_items as soi')
            ->join('sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->select('soi.product_id', DB::raw('SUM(soi.quantity_reserved) as total_reserved'))
            ->whereNull('so.deleted_at')
            ->whereNull('soi.deleted_at')
            ->whereNotIn('so.status', ['cancelled', 'completed', 'delivered'])
            ->groupBy('soi.product_id')
            ->pluck('total_reserved', 'product_id');

        return Inertia::render('SalesOrders/CreatePreSale', [
            'customers' => Party::where('type', 'customer')->get(),
            'products' => Product::get()->map(function ($product) use ($stockTotals, $reservedTotals) {
                $product->total_stock = (float)($stockTotals->get($product->id) ?? 0);
                $product->reserved_stock = (float)($reservedTotals->get($product->id) ?? 0);
                $product->available_stock = $product->total_stock - $product->reserved_stock;
                return $product;
            })
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:parties,id',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $order = DB::transaction(function () use ($validated) {
            $customerId = $validated['customer_id'] ?? Party::firstOrCreate(['name' => 'Walk-in Customer'], ['type' => 'customer', 'phone' => '0000000000'])->id;
            $customerName = Party::find($customerId)->name;

            $order = SalesOrder::create([
                'order_number' => 'SO-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $customerId,
                'customer_name' => $customerName,
                'order_date' => $validated['order_date'],
                'status' => 'confirmed',
                'user_id' => auth()->id(),
                'total_amount' => 0
            ]);

            $totalAmount = 0;

            foreach ($validated['items'] as $item) {
                $subtotal = $item['unit_price'] * $item['quantity'];
                $totalAmount += $subtotal;

                // V3 Inventory Reservation Logic: Count requested qty as reserved
                // In backorder-mode, we always reserve the full requested quantity even if stock is negative.
                $reservedAmount = $item['quantity'];

                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity'],
                    'quantity_reserved' => $reservedAmount,
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $subtotal
                ]);
            }

            $order->update(['total_amount' => $totalAmount]);
            
            return $order;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pre-Sale created and inventory reserved.',
            'order_id' => $order->id
        ]);
    }

    public function show(SalesOrder $order)
    {
        $order->load(['customer', 'items.product']);
        
        if ($order->customer) {
            $arAccount = \App\Models\Account::where('code', '1200')->value('id');
            $apAccount = \App\Models\Account::where('code', '2000')->value('id');
            
            $netAR = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $order->customer->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $arAccount)
                ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
                ->value('balance') ?? 0;

            $netAP = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $order->customer->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
                ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
                ->value('balance') ?? 0;

            $order->customer->current_balance = (float)$netAR - (float)$netAP;
        }

        // Get total stock from 'stocks' table
        $stockTotals = DB::table('stocks')
            ->select('product_id', DB::raw('SUM(quantity) as total_on_hand'))
            ->groupBy('product_id')
            ->pluck('total_on_hand', 'product_id');

        $reservedTotals = DB::table('sales_order_items as soi')
            ->join('sales_orders as so', 'soi.sales_order_id', '=', 'so.id')
            ->select('soi.product_id', DB::raw('SUM(soi.quantity_reserved) as total_reserved'))
            ->where('so.id', '!=', $order->id) 
            ->whereNull('so.deleted_at')
            ->whereNull('soi.deleted_at')
            ->whereNotIn('so.status', ['cancelled', 'completed', 'delivered'])
            ->groupBy('soi.product_id')
            ->pluck('total_reserved', 'product_id');

        return Inertia::render('SalesOrders/CreatePreSale', [
            'sale' => $order,
            'customers' => Party::where('type', 'customer')->get(),
            'products' => Product::get()->map(function ($product) use ($stockTotals, $reservedTotals) {
                $product->total_stock = (float)($stockTotals->get($product->id) ?? 0);
                $product->reserved_stock = (float)($reservedTotals->get($product->id) ?? 0);
                $product->available_stock = $product->total_stock - $product->reserved_stock;
                return $product;
            })
        ]);
    }

    public function update(Request $request, SalesOrder $order)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:parties,id',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $order) {
            $order->items()->delete();

            $customerId = $validated['customer_id'] ?? Party::firstOrCreate(['name' => 'Walk-in Customer'], ['type' => 'customer', 'phone' => '0000000000'])->id;
            $customerName = Party::find($customerId)->name;

            // Update order header
            $order->update([
                'customer_id' => $customerId,
                'customer_name' => $customerName,
                'order_date' => $validated['order_date'],
                'total_amount' => 0
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $subtotal = $item['unit_price'] * $item['quantity'];
                $totalAmount += $subtotal;

                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity'],
                    'quantity_reserved' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $subtotal
                ]);
            }
            $order->update(['total_amount' => $totalAmount]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Pre-Sale updated successfully.',
            'order_id' => $order->id
        ]);
    }

    public function convertToSale(SalesOrder $order)
    {
        try {
            $sale = DB::transaction(function () use ($order) {
                // 1. Create Sale Record
                $dateCode      = date('ymd');
                $dailyCount    = Sale::whereDate('created_at', today())->count();
                $sequence      = str_pad($dailyCount + 1, 3, '0', STR_PAD_LEFT);
                $referenceNumber = (\App\Helpers\SettingsHelper::getSalePrefix() ?: 'INV-') . $dateCode . '-' . $sequence;

                $warehouseId = Warehouse::first()?->id ?? 1;

                $sale = Sale::create([
                    'reference_number' => $referenceNumber,
                    'party_id' => $order->customer_id,
                    'status' => 'posted',
                    'posted_at' => now(),
                    'payment_status' => 'unpaid',
                    'subtotal' => $order->total_amount,
                    'tax' => 0,
                    'discount' => 0,
                    'total' => $order->total_amount,
                    'subtotal_gross' => $order->total_amount,
                    'net_sales' => $order->total_amount,
                    'invoice_total' => $order->total_amount,
                    'user_id' => auth()->id() ?? \App\Models\User::first()->id,
                    'warehouse_id' => $warehouseId
                ]);

                $fifo = app(\App\Services\V3\FifoService::class);

                foreach ($order->items as $item) {
                    $totalQty = (float)$item->quantity_requested;

                    // A. Deduct stock using FIFO (Batches)
                    $lineCogs = 0;
                    $deductions = null;
                    try {
                        $deductions = $fifo->deductStock($item->product_id, $warehouseId, $totalQty);
                        $lineCogs = collect($deductions)->sum('total_cost');
                    } catch (\App\Exceptions\InsufficientStockException $e) {
                        // Fallback: use static cost for backorders
                        $product = Product::find($item->product_id);
                        $lineCogs = ($product->cost_price ?? 0) * $totalQty;
                        Log::warning("Backorder in conversion for product {$item->product_id}: using static cost.");
                    }

                    // B. Deduct Physical Stock from 'stocks' table (handles negatives)
                    $stock = Stock::where('product_id', $item->product_id)->where('warehouse_id', $warehouseId)->first();
                    if ($stock) {
                        $stock->decrement('quantity', $totalQty);
                    } else {
                        Stock::create([
                            'product_id' => $item->product_id,
                            'warehouse_id' => $warehouseId,
                            'quantity' => -$totalQty
                        ]);
                    }

                    // C. Also handle StockMovement for history
                    \App\Models\StockMovement::create([
                        'product_id' => $item->product_id,
                        'warehouse_id' => $warehouseId,
                        'type' => 'sale',
                        'quantity' => -$totalQty,
                        'reference_id' => $sale->id,
                        'description' => "Pre-Sale Conversion: {$order->order_number}",
                        'user_id' => auth()->id()
                    ]);

                    $saleItem = SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $item->product_id,
                        'quantity' => $totalQty,
                        'unit_price' => $item->unit_price,
                        'cost_price' => $totalQty > 0 ? $lineCogs / $totalQty : 0,
                        'gross_amount' => $item->subtotal,
                        'net_amount' => $item->subtotal,
                        'line_total' => $item->subtotal,
                        'subtotal' => $item->subtotal,
                        'discount_amount' => 0,
                    ]);

                    // D. Record batch links if FIFO succeeded
                    if ($deductions) {
                        foreach ($deductions as $deduction) {
                            DB::table('sale_item_batches')->insert([
                                'id' => \Illuminate\Support\Str::uuid()->toString(),
                                'sale_item_id' => $saleItem->id,
                                'inventory_batch_id' => $deduction['batch_id'],
                                'qty_deducted' => $deduction['qty_taken'],
                                'unit_cost' => $deduction['unit_cost'],
                                'total_cogs' => $deduction['total_cost'],
                                'is_reversed' => 0,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // 2. Post Journal Entries
                $accounting = resolve(\App\Services\V3\AccountingService::class);
                $journalItems = [];
                
                // DR: AR
                $arAcc = $accounting->getAccountByCode('1200');
                $journalItems[] = ['account_id' => $arAcc->id, 'debit' => $order->total_amount, 'credit' => 0, 'description' => "AR from Conversion #{$sale->reference_number}"];
                
                // CR: Revenue
                $revAcc = $accounting->getAccountByCode('4000');
                $journalItems[] = ['account_id' => $revAcc->id, 'debit' => 0, 'credit' => $order->total_amount, 'description' => "Revenue from Conversion #{$sale->reference_number}"];
                
                // Post
                $accounting->createEntry([
                    'date' => now()->toDateString(),
                    'reference_type' => 'sale',
                    'reference' => $sale->id,
                    'description' => "Sale Conversion #{$sale->reference_number}",
                    'party_id' => $order->customer_id
                ], $journalItems);

                // 3. Update Order Status
                $order->update(['status' => 'completed']);
                
                return $sale;
            });

            return response()->json([
                'success' => true,
                'message' => 'Sales Order converted to Invoice.',
                'sale_id' => $sale->id ?? null
            ]);

        } catch (\Exception $e) {
            Log::error("Conversion Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(SalesOrder $order)
    {
        DB::transaction(function () use ($order) {
            $order->items()->delete();
            $order->delete();
        });

        return redirect()->route('pre-sales.index')->with('success', 'Pre-sale moved to Recycle Bin.');
    }

    public function cancel(SalesOrder $salesOrder)
    {
        if ($salesOrder->status === 'cancelled') {
            return back()->with('error', 'Order is already cancelled.');
        }

        DB::transaction(function () use ($salesOrder) {
            $salesOrder->update(['status' => 'cancelled']);
        });

        return back()->with('success', 'Sales Order cancelled.');
    }

    public function print(SalesOrder $salesOrder)
    {
        $salesOrder->load(['customer', 'user', 'items.product']);
        $settings = \App\Models\Setting::all()->pluck('value', 'key');

        $view = view()->exists('pdf.sales-order') ? 'pdf.sales-order' : 'pdf.receipt';

        $pdf = Pdf::loadView($view, [
            'sale' => $salesOrder,
            'order' => $salesOrder, 
            'type' => 'sales-order',
            'settings' => $settings,
        ]);

        return $pdf->stream('sales-order-' . $salesOrder->order_number . '.pdf');
    }

    public function export(Request $request)
    {
        $query = SalesOrder::with(['customer', 'user']);

        if ($request->search) {
            $term = strtolower($request->search);
            $query->where(function ($q) use ($term) {
                $q->where('order_number', 'like', "%{$term}%")
                    ->orWhereHas('customer', fn($p) => $p->where('name', 'like', "%{$term}%"));
            });
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('order_date', [$request->from_date, $request->to_date]);
        }

        $orders = $query->latest()->get();

        $filename = "pre-sales_export_" . date('Y-m-d_H-i') . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Order No', 'Customer', 'Amount', 'Status', 'Created By']);

            foreach ($orders as $order) {
                fputcsv($file, [
                    $order->order_date,
                    $order->order_number,
                    $order->customer_name ?? 'Walk-in',
                    $order->total_amount,
                    $order->status,
                    $order->user->name ?? '-'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
