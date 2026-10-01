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
use App\Queries\PartyBalanceQuery;

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
            $proposal->customer->current_balance = PartyBalanceQuery::partyNetBalance(
                $proposal->customer->id,
                $proposal->tenant_id ?? app('current.tenant')->id
            );
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
            /* The day it was quoted, which is not the day the row was made. */
            'date' => 'nullable|date',
            /* Both of these were absent, so editing a quotation could not change
               its status or its note — the operator typed and nothing happened. */
            'status' => 'nullable|in:draft,sent,accepted,declined',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            /* A quotation is an offer, so it carries the money it is offered
               at — a discount, tax, carriage — and the terms it stands on.
               `tax_amount` and `discount_amount` have been columns all along
               and have never once been written. */
            'reference'          => 'nullable|string|max:100',
            'payment_terms'      => 'nullable|string|max:40',
            /* The screens call this `discount`; the column is `discount_amount`.
                Both are accepted so neither spelling is silently thrown away. */
            'discount'           => 'nullable|numeric|min:0',
            'discount_amount'    => 'nullable|numeric|min:0',
            'tax_amount'         => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'delivery_charge'    => 'nullable|numeric|min:0',
            'extra_charge_value' => 'nullable|numeric|min:0',
            'extra_charge_label' => 'nullable|string|max:120',
            'items.*.discount_type' => 'nullable|in:fixed,percent',
            'items.*.tax_rate'      => 'nullable|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($validated, $id) {
            $proposal = Proposal::findOrFail($id);
            $proposal->update([
                'customer_id' => $validated['customer_id'],
                'customer_name' => $validated['customer_name'] ?? Party::find($validated['customer_id'])?->name,
                'valid_until' => $validated['valid_until'] ?? $proposal->valid_until,
                'date' => $validated['date'] ?? $proposal->date,
                'status' => $validated['status'] ?? $proposal->status,
                'notes' => $validated['notes'] ?? $proposal->notes,
                'reference' => $validated['reference'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'discount_amount' => $validated['discount_amount'] ?? $validated['discount'] ?? 0,
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'tax_rate' => $validated['tax_rate'] ?? 0,
                'delivery_charge' => $validated['delivery_charge'] ?? 0,
                'extra_charge_value' => $validated['extra_charge_value'] ?? 0,
                'extra_charge_label' => $validated['extra_charge_label'] ?? null,
                'total_amount' => 0, // Recalculated below
            ]);

            // Sync items (Delete old, create new - simple approach)
            ProposalItem::where('proposal_id', $proposal->id)->delete();

            $totalAmount = 0;
            $totalCost = 0;

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $gross = $item['unit_price'] * $item['quantity'];
                /* Already money by the time it gets here — see the note in
                   SalesOrderController. */
                $lineDiscount = (float) ($item['discount'] ?? 0);
                $lineTotal = max(0, $gross - $lineDiscount);
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
                    'discount' => $lineDiscount,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'total' => $lineTotal
                ]);
            }

            /* What the customer was actually quoted: the goods, less the
               discount on the whole offer, plus tax and carriage. Saving only
               the sum of the lines is how a discounted quotation came back at
               full price. */
            $net = max(0, $totalAmount - (float) ($validated['discount_amount'] ?? $validated['discount'] ?? 0));
            $grand = round(
                $net
                + (float) ($validated['tax_amount'] ?? 0)
                + (float) ($validated['delivery_charge'] ?? 0)
                + (float) ($validated['extra_charge_value'] ?? 0),
                2
            );
            $proposal->update([
                'total_amount' => $grand,
                'estimated_cost' => $totalCost,
                'expected_margin' => $net - $totalCost
            ]);
        });

        return redirect()->route('store.proposals.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Proposal updated.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:parties,id',
            'customer_name' => 'nullable|string',
            'valid_until' => 'nullable|date',
            /* The day it was quoted, which is not the same as the day the row
               was created — a quotation is often written up afterwards. */
            'date' => 'nullable|date',
            'status' => 'required|in:draft,sent,accepted,declined',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            /* A quotation is an offer, so it carries the money it is offered
               at — a discount, tax, carriage — and the terms it stands on.
               `tax_amount` and `discount_amount` have been columns all along
               and have never once been written. */
            'reference'          => 'nullable|string|max:100',
            'payment_terms'      => 'nullable|string|max:40',
            /* The screens call this `discount`; the column is `discount_amount`.
                Both are accepted so neither spelling is silently thrown away. */
            'discount'           => 'nullable|numeric|min:0',
            'discount_amount'    => 'nullable|numeric|min:0',
            'tax_amount'         => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'delivery_charge'    => 'nullable|numeric|min:0',
            'extra_charge_value' => 'nullable|numeric|min:0',
            'extra_charge_label' => 'nullable|string|max:120',
            'items.*.discount_type' => 'nullable|in:fixed,percent',
            'items.*.tax_rate'      => 'nullable|numeric|min:0|max:100',
        ]);

        $proposalId = null;

        DB::transaction(function () use ($validated, &$proposalId) {
            $proposal = Proposal::create([
                'reference_number' => \App\Services\SequenceService::generateTransactionNumber('PROP'),
                'customer_id' => $validated['customer_id'],
                'customer_name' => $validated['customer_name'] ?? Party::find($validated['customer_id'])?->name,
                'valid_until' => $validated['valid_until'],
                'date' => $validated['date'] ?? now()->toDateString(),
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'discount_amount' => $validated['discount_amount'] ?? $validated['discount'] ?? 0,
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'tax_rate' => $validated['tax_rate'] ?? 0,
                'delivery_charge' => $validated['delivery_charge'] ?? 0,
                'extra_charge_value' => $validated['extra_charge_value'] ?? 0,
                'extra_charge_label' => $validated['extra_charge_label'] ?? null,
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
                $gross = $item['unit_price'] * $item['quantity'];
                /* Already money by the time it gets here — see the note in
                   SalesOrderController. */
                $lineDiscount = (float) ($item['discount'] ?? 0);
                $lineTotal = max(0, $gross - $lineDiscount);
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
                    'discount' => $lineDiscount,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'total' => $lineTotal
                ]);
            }

            /* What the customer was actually quoted: the goods, less the
               discount on the whole offer, plus tax and carriage. Saving only
               the sum of the lines is how a discounted quotation came back at
               full price. */
            $net = max(0, $totalAmount - (float) ($validated['discount_amount'] ?? $validated['discount'] ?? 0));
            $grand = round(
                $net
                + (float) ($validated['tax_amount'] ?? 0)
                + (float) ($validated['delivery_charge'] ?? 0)
                + (float) ($validated['extra_charge_value'] ?? 0),
                2
            );
            $proposal->update([
                'total_amount' => $grand,
                'estimated_cost' => $totalCost,
                'expected_margin' => $net - $totalCost
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

        return redirect()->route('store.proposals.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Proposal created successfully.');
    }

    public function show(Proposal $proposal)
    {
        $proposal->load(['items.product', 'customer', 'user']);

        if ($proposal->party_id ?? ($proposal->customer_id ?? null)) {
            $partyId    = $proposal->party_id ?? $proposal->customer_id;
            $tenantId   = $proposal->tenant_id ?? app('current.tenant')->id;
            $net        = \App\Queries\PartyBalanceQuery::partyNetBalance($partyId, $tenantId);
            $balanceDue = max(0, (float) ($proposal->total ?? 0) - (float) ($proposal->amount_paid ?? 0));
            $proposal->customer_net_balance  = $net;
            $proposal->customer_prev_balance = $net - $balanceDue;
            $proposal->append(['customer_net_balance', 'customer_prev_balance']);
        }

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
        $tenantId = app('current.tenant')->id;
        $lock = \Illuminate\Support\Facades\Cache::lock("proposal_convert_lock_{$proposal->id}", 10);

        try {
            $lock->block(5);

            $proposal->refresh();
            if (in_array($proposal->status, ['accepted', 'completed'])) {
                return redirect()->back()->with('error', 'Proposal has already been converted.');
            }

            DB::transaction(function () use ($proposal, $tenantId) {
                // Compute totals
                $subtotalGross = 0;
                $totalDiscount = 0;
                foreach ($proposal->items as $item) {
                    $subtotalGross += $item->unit_price * $item->quantity;
                    $totalDiscount += $item->discount;
                }

                $netSales = $subtotalGross - $totalDiscount;

                // Create Sale
                $sale = Sale::create([
                    'reference_number' => \App\Services\SequenceService::generateTransactionNumber('SAL'),
                    'party_id' => $proposal->customer_id,
                    'status' => 'completed',
                    'payment_status' => 'pending',
                    'subtotal' => $subtotalGross,
                    'discount' => $totalDiscount,
                    'global_discount' => $totalDiscount,
                    'tax' => 0,
                    'total' => $netSales,
                    'subtotal_gross' => $subtotalGross,
                    'net_sales' => $netSales,
                    'total_tax' => 0,
                    'invoice_total' => $netSales,
                    'user_id' => auth()->id(),
                    'warehouse_id' => \App\Models\Warehouse::first()?->id ?? 1,
                    'tenant_id' => $tenantId
                ]);

                $fifo = app(\App\Engines\FifoService::class);

                foreach ($proposal->items as $item) {
                    // Deduct stock using FIFO
                    $lineCogs = 0;
                    $warehouseId = $sale->warehouse_id;
                    $product = \App\Models\Product::find($item->product_id);
                    $productType = $product?->type ?? 'physical';

                    if ($productType === 'service') {
                        $lineCogs = ($product->cost_price ?? 0) * $item->quantity;
                    } else {
                        try {
                            $deductions = $fifo->deductStock($item->product_id, $warehouseId, (float)$item->quantity);
                            $lineCogs = collect($deductions)->sum('total_cost');
                        } catch (\App\Exceptions\InsufficientStockException $e) {
                            $lineCogs = ($product->cost_price ?? 0) * $item->quantity;
                        }
                    }

                    $saleItem = SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'cost_price' => $item->quantity > 0 ? $lineCogs / $item->quantity : 0,
                        'subtotal' => $item->total,
                        'gross_amount' => $item->unit_price * $item->quantity,
                        'net_amount' => $item->total,
                        'discount_amount' => $item->discount,
                        'line_total' => $item->total,
                        'tax_amount' => 0,
                        'tenant_id' => $tenantId
                    ]);

                    // Record batches if FIFO succeeded
                    if (isset($deductions)) {
                        foreach ($deductions as $deduction) {
                             DB::table('sale_item_batches')->insert([
                                'id' => \Illuminate\Support\Str::uuid()->toString(),
                                'tenant_id' => $tenantId,
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

            $tenantSlug = app('current.tenant')?->slug ?? request()->route('store_slug') ?? 'default';
            return redirect("/s/{$tenantSlug}/sales")->with('success', 'Proposal converted to Sale.');

        } finally {
            $lock->release();
        }
    }

    public function convertToPreSale(Proposal $proposal)
    {
        $tenantId = app('current.tenant')->id;
        $lock = \Illuminate\Support\Facades\Cache::lock("proposal_convert_lock_{$proposal->id}", 10);

        try {
            $lock->block(5);

            $proposal->refresh();
            $existingOrder = \App\Models\SalesOrder::withoutTenantScope()
                ->where('tenant_id', $tenantId)
                ->where('notes', 'Converted from Proposal #' . $proposal->reference_number)
                ->first();

            if ($existingOrder && in_array($existingOrder->status, ['completed', 'cancelled'])) {
                return redirect()->back()->with('error', 'The converted Pre-Sale has already been finalized into a Sale and cannot be altered.');
            }

            DB::transaction(function () use ($proposal, $tenantId, $existingOrder) {
                if ($existingOrder) {
                    $salesOrder = $existingOrder;
                    $salesOrder->update([
                        'customer_id' => $proposal->customer_id,
                        'customer_name' => $proposal->customer_name,
                        'total_amount' => $proposal->total_amount,
                        'status' => 'pending', // Reset status if cancelled/etc.
                    ]);
                    \App\Models\SalesOrderItem::withoutTenantScope()
                        ->where('sales_order_id', $salesOrder->id)
                        ->delete();
                } else {
                    // Create Sales Order (Pre-Sale)
                    $salesOrder = \App\Models\SalesOrder::create([
                        'order_number' => \App\Services\SequenceService::generateTransactionNumber('SO'),
                        'customer_id' => $proposal->customer_id,
                        'customer_name' => $proposal->customer_name,
                        'status' => 'pending',
                        'total_amount' => $proposal->total_amount,
                        'user_id' => auth()->id(),
                        'notes' => 'Converted from Proposal #' . $proposal->reference_number,
                        'tenant_id' => $tenantId
                    ]);
                }

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
                        'subtotal' => $item->total, // Use subtotal field to match actual schema
                        'tenant_id' => $tenantId
                    ]);

                    $totalAmount += $item->total;
                }

                // Update total to be accurate
                $salesOrder->update(['total_amount' => $totalAmount]);

                $proposal->update(['status' => 'accepted']);
            });

            $storeSlug = app('current.tenant')->slug;
            return redirect()->route('store.pre-sales.index', ['store_slug' => $storeSlug])->with('success', 'Proposal converted to Pre-Sale. Inventory has been reserved.');

        } finally {
            $lock->release();
        }
    }

    public function print(Proposal $proposal)
    {
        $proposal->load(['items.product', 'customer', 'user']);
        return view('proposals.print', compact('proposal'));
    }
}
