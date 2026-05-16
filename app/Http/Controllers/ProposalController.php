<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\ProposalItem;
use App\Models\Product;
use App\Models\Party;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ProposalController extends Controller
{
    public function index(Request $request)
    {
        $query = Proposal::with(['customer', 'user', 'items.product']);

        // Search
        if ($request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('proposal_number', 'like', "%{$term}%")
                  ->orWhere('reference_number', 'like', "%{$term}%")
                  ->orWhereHas('customer', function ($q) use ($term) {
                      $q->where('name', 'like', "%{$term}%");
                  });
            });
        }

        // Filter by Status
        if ($request->filter && $request->filter !== 'all' && $request->filter !== 'custom') {
            if ($request->filter === 'pending') {
                $query->whereIn('status', ['draft', 'sent', 'pending']);
            } else {
                $query->where('status', $request->filter);
            }
        }

        // Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        } elseif ($request->filter === 'today') {
            $query->whereDate('created_at', now()->toDateString());
        } elseif ($request->filter === 'month') {
            $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
        }

        $proposals = $query->latest()->paginate(50)->withQueryString();

        // Calculate stats
        $stats = [
            'total_count' => Proposal::count(),
            'accepted_count' => Proposal::where('status', 'accepted')->count(),
            'pending_count' => Proposal::whereIn('status', ['draft', 'sent', 'pending'])->count(),
            'total_value' => Proposal::sum('total_amount'),
        ];

        return Inertia::render('Proposals/ProposalsList', [
            'proposals' => $proposals,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date']),
            'stats' => $stats
        ]);
    }

    public function create(Request $request)
    {
        $existingProposal = null;
        if ($request->has('existing_id')) {
            $existingProposal = Proposal::with(['items.product', 'customer'])->find($request->existing_id);
            // Remap items if necessary to match frontend Expectations? 
            // SalesEngine expects specific structure. 
            // Usually SalesEngine logic handles normalization if passed as 'existingSale'.
            // But we pass it as 'existingProposal' prop to the page component.
        }

        return Inertia::render('Proposals/Create', [
            'existingProposal' => $existingProposal,
            'customers' => Party::where('type', 'customer')->get(),
            'products' => Product::with([
                'stocks' => function ($q) {
                    $q->select('product_id', 
                        DB::raw('sum(quantity) as quantity'),
                        DB::raw('sum(reserved_quantity) as reserved_quantity'),
                        DB::raw('sum(quantity) as total_stock')
                    )->groupBy('product_id');
                }
            ])->get()->map(function ($product) {
                $product->stock_quantity = $product->stocks->sum('total_stock');
                return $product;
            })
        ]);
    }

    public function edit(Proposal $proposal)
    {
        $proposal->load(['items.product', 'customer']);
        
        if ($proposal->customer) {
            $arAccount = \App\Models\Account::where('code', '1200')->value('id');
            $apAccount = \App\Models\Account::where('code', '2000')->value('id');
            
            $netAR = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $proposal->customer->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $arAccount)
                ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
                ->value('balance') ?? 0;

            $netAP = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $proposal->customer->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
                ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
                ->value('balance') ?? 0;

            $proposal->customer->current_balance = (float)$netAR - (float)$netAP;
        }

        return Inertia::render('Proposals/Create', [
            'existingProposal' => $proposal,
            'customers' => Party::where('type', 'customer')->get(),
            'products' => Product::with([
                'stocks' => function ($q) {
                    $q->select('product_id', 
                        DB::raw('sum(quantity) as quantity'),
                        DB::raw('sum(reserved_quantity) as reserved_quantity'),
                        DB::raw('sum(quantity) as total_stock')
                    )->groupBy('product_id');
                }
            ])->get()->map(function ($product) {
                $product->stock_quantity = $product->stocks->sum('total_stock');
                return $product;
            })
        ]);
    }

    public function update(Request $request, $id)
    {
        // Add update logic for editing existing proposals
        // Re-use store validation or similar
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:parties,id',
            'customer_name' => 'nullable|string',
            'valid_until' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $id) {
            $proposal = Proposal::findOrFail($id);
            $proposal->update([
                'customer_id' => $validated['customer_id'],
                'customer_name' => $validated['customer_name'] ?? Party::find($validated['customer_id'])?->name,
                'valid_until' => $validated['valid_until'] ?? $proposal->valid_until,
                'total_amount' => 0, // Recalculated below
            ]);

            // Sync items (Delete old, create new - simple approach)
            ProposalItem::where('proposal_id', $proposal->id)->delete();

            $totalAmount = 0;
            $totalCost = 0;

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $lineTotal = ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $lineCost = $product->cost_price * $item['quantity'];

                $totalAmount += $lineTotal;
                $totalCost += $lineCost;

                ProposalItem::create([
                    'proposal_id' => $proposal->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'unit_cost' => $product->cost_price,
                    'discount' => $item['discount'] ?? 0,
                    'total' => $lineTotal
                ]);
            }

            $proposal->update([
                'total_amount' => $totalAmount,
                'estimated_cost' => $totalCost,
                'expected_margin' => $totalAmount - $totalCost
            ]);
        });

        return redirect()->route('proposals.index')->with('success', 'Proposal updated.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:parties,id',
            'customer_name' => 'nullable|string',
            'valid_until' => 'nullable|date',
            'status' => 'required|in:draft,sent,accepted,declined',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        $proposalId = null;

        DB::transaction(function () use ($validated, &$proposalId) {
            $proposal = Proposal::create([
                'reference_number' => 'PROP-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $validated['customer_id'],
                'customer_name' => $validated['customer_name'] ?? Party::find($validated['customer_id'])?->name,
                'valid_until' => $validated['valid_until'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'user_id' => auth()->id(),
                'total_amount' => 0,
                'estimated_cost' => 0,
                'expected_margin' => 0
            ]);

            $proposalId = $proposal->id;
            $totalAmount = 0;
            $totalCost = 0;

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $lineTotal = ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $lineCost = ($product->cost_price ?? 0) * $item['quantity'];

                $totalAmount += $lineTotal;
                $totalCost += $lineCost;

                ProposalItem::create([
                    'proposal_id' => $proposal->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'unit_cost' => $product->cost_price ?? 0,
                    'discount' => $item['discount'] ?? 0,
                    'total' => $lineTotal
                ]);
            }

            $proposal->update([
                'total_amount' => $totalAmount,
                'estimated_cost' => $totalCost,
                'expected_margin' => $totalAmount - $totalCost
            ]);
        });

        // Return JSON for AJAX requests
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Proposal created successfully.',
                'proposal_id' => $proposalId
            ]);
        }

        return redirect()->route('proposals.index')->with('success', 'Proposal created successfully.');
    }

    public function show(Proposal $proposal)
    {
        $proposal->load(['items.product', 'customer', 'user']);
        return Inertia::render('Proposals/Show', [
            'proposal' => $proposal
        ]);
    }

    public function destroy(Proposal $proposal)
    {
        $proposal->delete();
        return redirect()->back()->with('success', 'Proposal deleted.');
    }

    public function convertToSale(Proposal $proposal)
    {
        DB::transaction(function () use ($proposal) {
            // Create Sale
            $sale = Sale::create([
                'invoice_number' => 'INV-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $proposal->customer_id,
                'customer_name' => $proposal->customer_name,
                'status' => 'completed',
                'payment_status' => 'pending',
                'final_total' => $proposal->total_amount,
                'user_id' => auth()->id(),
                // Add default cash account/warehouse for now, or make user select in future steps
                'warehouse_id' => \App\Models\Warehouse::first()?->id ?? 1
            ]);

            $fifo = app(\App\Services\V3\FifoService::class);

            foreach ($proposal->items as $item) {
                // Deduct stock using FIFO
                $lineCogs = 0;
                $warehouseId = $sale->warehouse_id;
                try {
                    $deductions = $fifo->deductStock($item->product_id, $warehouseId, (float)$item->quantity);
                    $lineCogs = collect($deductions)->sum('total_cost');
                } catch (\App\Exceptions\InsufficientStockException $e) {
                    $product = \App\Models\Product::find($item->product_id);
                    $lineCogs = ($product->cost_price ?? 0) * $item->quantity;
                }

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'cost_price' => $item->quantity > 0 ? $lineCogs / $item->quantity : 0,
                    'subtotal' => $item->total,
                    'discount' => $item->discount ?? 0,
                ]);

                // Record batches if FIFO succeeded
                if (isset($deductions)) {
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

            $proposal->update(['status' => 'accepted']);
        });

        return redirect()->route('sales.index')->with('success', 'Proposal converted to Sale.');
    }

    public function convertToPreSale(Proposal $proposal)
    {
        DB::transaction(function () use ($proposal) {
            // Create Sales Order (Pre-Sale)
            $salesOrder = \App\Models\SalesOrder::create([
                'reference_number' => 'SO-' . date('Ymd') . '-' . rand(1000, 9999),
                'customer_id' => $proposal->customer_id,
                'customer_name' => $proposal->customer_name,
                'status' => 'pending',
                'total' => $proposal->total_amount,
                'user_id' => auth()->id(),
                'notes' => 'Converted from Proposal #' . $proposal->reference_number,
            ]);

            $totalAmount = 0;
            foreach ($proposal->items as $item) {
                // V3 Inventory Reservation Logic
                $totalStock = \Illuminate\Support\Facades\DB::table('inventory_batches')
                    ->where('product_id', $item->product_id)
                    ->whereNull('deleted_at')
                    ->sum('remaining_qty');

                $currentlyReserved = \Illuminate\Support\Facades\DB::table('sales_order_items')
                    ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
                    ->where('sales_order_items.product_id', $item->product_id)
                    ->whereNull('sales_orders.deleted_at')
                    ->whereNull('sales_order_items.deleted_at')
                    ->whereNotIn('sales_orders.status', ['cancelled', 'completed'])
                    ->sum('sales_order_items.quantity_reserved');

                $available = max(0, $totalStock - $currentlyReserved);
                $reservedAmount = min($available, $item->quantity);

                \App\Models\SalesOrderItem::create([
                    'sales_order_id' => $salesOrder->id,
                    'product_id' => $item->product_id,
                    'quantity_requested' => $item->quantity,
                    'quantity_reserved' => $reservedAmount,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->discount ?? 0,
                    'subtotal' => $item->total // Use subtotal field to match actual schema
                ]);

                $totalAmount += $item->total;
            }

            // Update total to be accurate
            $salesOrder->update(['total_amount' => $totalAmount]);

            $proposal->update(['status' => 'accepted']);
        });

        return redirect()->route('pre-sales.index')->with('success', 'Proposal converted to Pre-Sale. Inventory has been reserved.');
    }

    public function print(Proposal $proposal)
    {
        $proposal->load(['items.product', 'customer', 'user']);
        return view('proposals.print', compact('proposal'));
    }
}
