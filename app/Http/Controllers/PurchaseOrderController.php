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
use Illuminate\Support\Facades\Cache;

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
            /* A party id or a supplier id — the screen searches everyone,
               because buying from somebody who is also a customer is ordinary
               and being made to register them twice is not. Resolved below. */
            'supplier_id' => 'required|string',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'status' => 'nullable|in:ordered,received',
            'is_tax_inclusive' => 'boolean',
            /* `is_tax_inclusive` was the only tax-adjacent thing on this table
               and nothing ever read it. An order placed with a deposit is as
               ordinary on the buying side as on the selling side. */
            'reference'          => 'nullable|string|max:100',
            'payment_terms'      => 'nullable|string|max:40',
            'discount'           => 'nullable|numeric|min:0',
            'tax'                => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'delivery_charge'    => 'nullable|numeric|min:0',
            'extra_charge_value' => 'nullable|numeric|min:0',
            'extra_charge_label' => 'nullable|string|max:120',
            'amount_paid'        => 'nullable|numeric|min:0',
            'payment_account_id' => 'nullable',
            'items.*.discount'      => 'nullable|numeric|min:0',
            'items.*.discount_type' => 'nullable|in:fixed,percent',
            'items.*.tax_rate'      => 'nullable|numeric|min:0|max:100',
            'items.*.free_quantity' => 'nullable|numeric|min:0',
        ]);

        $validated['supplier_id'] = $this->resolveSupplierId($validated['supplier_id']);

        $po = DB::transaction(function () use ($validated) {
            $po = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'reference_number' => \App\Services\SequenceService::generateTransactionNumber('PO'),
                'status' => 'ordered',
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'notes' => $validated['notes'],
                'user_id' => auth()->id(),
                'is_tax_inclusive' => $validated['is_tax_inclusive'] ?? false,
                'reference' => $validated['reference'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'discount' => $validated['discount'] ?? 0,
                'tax' => $validated['tax'] ?? 0,
                'tax_rate' => $validated['tax_rate'] ?? 0,
                'delivery_charge' => $validated['delivery_charge'] ?? 0,
                'extra_charge_value' => $validated['extra_charge_value'] ?? 0,
                'extra_charge_label' => $validated['extra_charge_label'] ?? null,
                'amount_paid' => $validated['amount_paid'] ?? 0,
                'payment_account_id' => $validated['payment_account_id'] ?? null,
                'total_amount' => 0, // Calculated below
            ]);

            $total = 0;
            foreach ($validated['items'] as $item) {
                /* `discount` is already money by the time it arrives — every
                   screen resolves a percentage before it sends. */
                $lineDiscount = (float) ($item['discount'] ?? 0);
                $lineTotal = max(0, ($item['quantity'] * $item['unit_cost']) - $lineDiscount);
                $total += $lineTotal;

                $product = Product::find($item['product_id']);
                if ($product && $product->cost_price > 0 && $item['unit_cost'] > $product->cost_price) {
                    $msg = "Product '{$product->name}' (SKU: {$product->sku}) unit cost in PO is Rs. {$item['unit_cost']}, which is higher than current cost Rs. {$product->cost_price}.";
                    if (auth()->check()) {
                        auth()->user()->notify(new \App\Notifications\SystemAlertNotification($msg));
                    }
                }

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    /* Columns that existed for these and were never written. */
                    'discount' => $lineDiscount,
                    /* Stored as 'fixed' because `discount` above is money, not a
                       percentage. Keeping the operator's 'percent' label beside
                       a resolved amount was a delayed fault: the line saved
                       correctly, then re-opened showing 100 with the % toggle
                       lit — a 100% discount — and the next save zeroed it. */
                    'discount_type' => 'fixed',
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'free_quantity' => $item['free_quantity'] ?? 0,
                    'total_cost' => $lineTotal,
                ]);
            }

            /* The whole order, not just the goods: the same method had already
               saved a discount, a tax figure and carriage and then stored a
               total that ignored all three, so the screen and the record
               disagreed by exactly the amount that mattered. */
            $net = max(0, $total - (float) ($validated['discount'] ?? 0));
            $grand = round(
                $net
                + (float) ($validated['tax'] ?? 0)
                + (float) ($validated['delivery_charge'] ?? 0)
                + (float) ($validated['extra_charge_value'] ?? 0),
                2
            );
            $po->update(['total_amount' => $grand]);

            /* A deposit paid to a supplier is money that has left the till, so
               it goes to the ledger like any other. It was being stored on the
               order and posted nowhere. */
            $paid = round(min(max(0, (float) ($validated['amount_paid'] ?? 0)), $grand), 2);
            if ($paid > 0.0001) {
                $accounting = app(\App\Engines\AccountingService::class);
                $cash = $this->resolvePaymentAccount($validated['payment_account_id'] ?? null, $accounting);
                $cash = $cash ?: $accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
                /* Not a payable — nothing has been delivered. It is money the
                   supplier is holding on the shop's behalf. */
                /* Not 1400 — that is Prepaid Expenses and is already in use, so
                    supplier advances would have been co-mingled with rent paid up
                    front under a name the seeder chose. */
                $prepaid = $accounting->getAccountByCode('1450', 'Advances to Suppliers', 'asset');

                $entry = $accounting->createEntry([
                    'date' => $validated['order_date'],
                    'reference_type' => 'purchase_order_advance',
                    'reference' => $po->id,
                    'description' => "Advance on order #{$po->reference_number}",
                    /* `purchase_orders.supplier_id` points at `suppliers`, but a
                        journal party is a `parties` id everywhere else — posting the
                        supplier id would put this on nobody's ledger, or worse on an
                        unrelated party's. */
                    'party_id' => $po->supplier?->party_id ?? null,
                ], [
                    ['account_id' => $prepaid->id, 'debit' => $paid, 'credit' => 0,
                     'description' => "Advance paid on #{$po->reference_number}"],
                    ['account_id' => $cash->id, 'debit' => 0, 'credit' => $paid,
                     'description' => "Advance paid on #{$po->reference_number}"],
                ]);
                $po->update(['journal_entry_id' => $entry->id, 'amount_paid' => $paid]);
            }

            // Handle Immediate Receive
            if (($validated['status'] ?? 'ordered') === 'received') {
                $po->update(['status' => 'received']);
                foreach ($po->items as $item) {
                    // V3 Inventory: Create Batch
                    app(\App\Engines\FifoService::class)->receiveBatch(
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

        return redirect()->route('store.purchase-orders.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Purchase Order created successfully.');
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
        /* 'partial' too. An edit rebuilds the item rows from scratch, which
           destroys `received_quantity`; the receive transition below would then
           book the FULL quantity again, so an order for 100 with 40 already
           received would put another 100 on the shelf and 100 more of cost
           into stock. */
        if (in_array($purchaseOrder->status, ['received', 'partial'], true)) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => 'Cannot update a received order. It is immutable.'], 403);
            }
            return redirect()->back()->with('error', 'Cannot update a received order.');
        }

        /* `validated()` returns only the keys that have rules, so a short
           rule list is a whitelist. This one was nine keys long while the body
           below it saved twenty — every discount, tax figure, charge and line
           rate was stripped on the way in and then written as zero. Editing an
           order to change one quantity wiped its money. */
        $validated = $request->validate([
            'supplier_id' => 'required|string',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:ordered,received',
            'is_tax_inclusive' => 'boolean',
            'reference'          => 'nullable|string|max:100',
            'payment_terms'      => 'nullable|string|max:40',
            'discount'           => 'nullable|numeric|min:0',
            'tax'                => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'delivery_charge'    => 'nullable|numeric|min:0',
            'extra_charge_value' => 'nullable|numeric|min:0',
            'extra_charge_label' => 'nullable|string|max:120',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.discount'      => 'nullable|numeric|min:0',
            'items.*.discount_type' => 'nullable|in:fixed,percent',
            'items.*.tax_rate'      => 'nullable|numeric|min:0|max:100',
            'items.*.free_quantity' => 'nullable|numeric|min:0',
        ]);

        $validated['supplier_id'] = $this->resolveSupplierId($validated['supplier_id']);

        DB::transaction(function () use ($validated, $purchaseOrder, $request) {
            $purchaseOrder->update([
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? $purchaseOrder->expected_delivery_date,
                'notes' => $validated['notes'] ?? $purchaseOrder->notes,
                /* An edit that saved none of these was how a corrected order
                   came back at list price. */
                'reference' => $validated['reference'] ?? $purchaseOrder->reference,
                'payment_terms' => $validated['payment_terms'] ?? $purchaseOrder->payment_terms,
                'is_tax_inclusive' => $validated['is_tax_inclusive'] ?? $purchaseOrder->is_tax_inclusive,
                'discount' => $validated['discount'] ?? 0,
                'tax' => $validated['tax'] ?? 0,
                'tax_rate' => $validated['tax_rate'] ?? 0,
                'delivery_charge' => $validated['delivery_charge'] ?? 0,
                'extra_charge_value' => $validated['extra_charge_value'] ?? 0,
                'extra_charge_label' => $validated['extra_charge_label'] ?? null,
            ]);

            // Simple update: delete old items and create new ones
            $purchaseOrder->items()->delete();

            $total = 0;
            foreach ($validated['items'] as $item) {
                /* `discount` is already money by the time it arrives — every
                   screen resolves a percentage before it sends. */
                $lineDiscount = (float) ($item['discount'] ?? 0);
                $lineTotal = max(0, ($item['quantity'] * $item['unit_cost']) - $lineDiscount);
                $total += $lineTotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    /* Columns that existed for these and were never written. */
                    'discount' => $lineDiscount,
                    /* Stored as 'fixed' because `discount` above is money, not a
                       percentage. Keeping the operator's 'percent' label beside
                       a resolved amount was a delayed fault: the line saved
                       correctly, then re-opened showing 100 with the % toggle
                       lit — a 100% discount — and the next save zeroed it. */
                    'discount_type' => 'fixed',
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'free_quantity' => $item['free_quantity'] ?? 0,
                    'total_cost' => $lineTotal,
                ]);
            }

            /* The whole order, the same way store() works it out. Saving the
               bare line sum here meant an edited order lost its tax and
               carriage from the total while still storing them. */
            $net = max(0, $total - (float) ($validated['discount'] ?? 0));
            $purchaseOrder->update(['total_amount' => round(
                $net
                + (float) ($validated['tax'] ?? 0)
                + (float) ($validated['delivery_charge'] ?? 0)
                + (float) ($validated['extra_charge_value'] ?? 0),
                2
            )]);

            // Handle Status Transition to 'received'
            if ($request->input('status') === 'received' && $purchaseOrder->status !== 'received') {
                $purchaseOrder->update(['status' => 'received']);
                foreach ($purchaseOrder->items as $item) {
                    // V3 Inventory: Create Batch
                    app(\App\Engines\FifoService::class)->receiveBatch(
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

        return redirect()->route('store.purchase-orders.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Purchase Order updated successfully.');
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'warehouse', 'items.product', 'user']);
        return Inertia::render('PurchaseOrders/Show', ['order' => $purchaseOrder]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        $lock = Cache::lock("purchase_order_receive_lock_{$purchaseOrder->id}", 10);
        try {
            $lock->block(5);
            $purchaseOrder = $purchaseOrder->fresh();

            if ($purchaseOrder->status === 'received') {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Order already received.'], 422);
                }
                return redirect()->back()->with('error', 'Order already received.');
            }

            $hasPartialInputs = $request->has('items');
            $partialItems = $request->input('items', []);

            DB::transaction(function () use ($purchaseOrder, $hasPartialInputs, $partialItems) {
                $allFullyReceived = true;

                foreach ($purchaseOrder->items as $item) {
                    $receiveQty = (float)($item->quantity - $item->received_quantity); // Default: remaining

                    if ($hasPartialInputs) {
                        $inputItem = collect($partialItems)->firstWhere('id', $item->id);
                        if ($inputItem) {
                            $receiveQty = (float)$inputItem['receive_qty'];
                        } else {
                            $receiveQty = 0; // Not intaken in this batch
                        }
                    }

                    if ($receiveQty <= 0) {
                        if ($item->received_quantity < $item->quantity) {
                            $allFullyReceived = false;
                        }
                        continue;
                    }

                    // Enforce remaining limit
                    $remaining = $item->quantity - $item->received_quantity;
                    if ($receiveQty > $remaining) {
                        $receiveQty = $remaining;
                    }

                    // V3 Inventory: Create Batch
                    app(\App\Engines\FifoService::class)->receiveBatch(
                        $item->product_id,
                        $purchaseOrder->warehouse_id,
                        $receiveQty,
                        $item->unit_cost,
                        'purchase',
                        $purchaseOrder->id
                    );

                    // Log Movement
                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'warehouse_id' => $purchaseOrder->warehouse_id,
                        'quantity' => $receiveQty,
                        'type' => 'purchase',
                        'description' => "Received PO #{$purchaseOrder->reference_number} (Intake: {$receiveQty})",
                        'user_id' => auth()->id(),
                    ]);

                    // Update item received qty
                    $newReceivedQty = $item->received_quantity + $receiveQty;
                    $item->update(['received_quantity' => $newReceivedQty]);

                    // Update Product Cost Price (Last Price)
                    $item->product->update(['cost_price' => $item->unit_cost]);

                    if ($newReceivedQty < $item->quantity) {
                        $allFullyReceived = false;
                    }
                }

                // Update PO Status
                $newStatus = $allFullyReceived ? 'received' : 'partial';
                $purchaseOrder->update(['status' => $newStatus]);
            });

            if ($request->wantsJson()) {
                return response()->json(['id' => $purchaseOrder->id, 'success' => true, 'message' => 'Stock received successfully.']);
            }
            return redirect()->back()->with('success', 'Stock received successfully.');
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Another process is currently processing this order.'], 422);
            }
            return redirect()->back()->with('error', 'Another process is currently processing this order.');
        } finally {
            optional($lock)->release();
        }
    }
    public function print(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'warehouse', 'items.product', 'user']);
        // For now, return a simple view or the Show page as print friendly, or raw text if no print view exists
        // Renders PurchaseOrders/Show in print mode
        // Or specific PDF generation.
        // We'll mimic the Show page for now but user might want dedicated print.
        return Inertia::render('PurchaseOrders/Show', ['order' => $purchaseOrder, 'print' => true]);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        // A received PO has already posted inventory batches (see receive() above)
        // and may have downstream journal entries. Deleting it at that point would
        // leave those batches referencing a vanished order. Block it — the correct
        // way to undo a received PO is a purchase return, not deleting the order.
        if ($purchaseOrder->status === 'received') {
            return redirect()->back()->with(
                'error',
                'This purchase order has already been received and cannot be deleted. Use a purchase return to reverse it instead.'
            );
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($purchaseOrder) {
        /* An advance posted DR 1450 / CR cash when the order was placed. Left
           standing, deleting the order leaves the money sitting in Advances to
           Suppliers against no document and the till permanently short. */
        if ($purchaseOrder->journal_entry_id) {
            $entry = \App\Models\JournalEntry::with('items')->find($purchaseOrder->journal_entry_id);
            if ($entry && ! $entry->is_reversed) {
                $accounting = app(\App\Engines\AccountingService::class);
                $accounting->createEntry([
                    'date' => now()->toDateString(),
                    'reference_type' => 'purchase_order_advance_reversal',
                    'reference' => $purchaseOrder->id,
                    'description' => "Advance reversed — order #{$purchaseOrder->reference_number} deleted",
                    'party_id' => $entry->party_id,
                ], $entry->items->map(fn ($i) => [
                    'account_id' => $i->account_id,
                    'debit' => $i->credit,
                    'credit' => $i->debit,
                    'party_id' => $i->party_id,
                    'description' => 'Reversal',
                ])->toArray());
                $entry->update(['is_reversed' => 1]);
            }
        }

        // Soft delete (PurchaseOrder uses SoftDeletes) — the row and its items
        // remain in the database for audit purposes; HasActivityLog records the
        // deletion in store_activity_log automatically.
        $purchaseOrder->delete();

        return redirect()
            ->route('store.purchase-orders.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Purchase order deleted.');
        });
    }

    /**
     * Whoever the picker found, as a `suppliers` row.
     *
     * `purchase_orders.supplier_id` points at the old `suppliers` table while
     * every other document in the app now works in `parties`. Rather than make
     * the operator keep two address books in step, the id from either is
     * accepted here and turned into the one this table needs.
     */
    private function resolveSupplierId(string $id): string
    {
        /* `withTrashed` and an explicit order: `suppliers.party_id` has no
           unique index, so without both of these the same party could resolve
           to a different row on different days, or get a second row created
           beside a soft-deleted one. */
        /* A live row first, oldest of them, and only then a deleted one. The
           other order round would resurrect a supplier the shop had deliberately
           removed and file the order against it, splitting that party's history
           across two rows. */
        $supplier = \App\Models\Supplier::where('party_id', $id)->orderBy('created_at')->first()
            ?? \App\Models\Supplier::find($id)
            ?? \App\Models\Supplier::withTrashed()->where('party_id', $id)->orderBy('created_at')->first()
            ?? \App\Models\Supplier::withTrashed()->find($id);

        if ($supplier) {
            if ($supplier->trashed()) $supplier->restore();
            return $supplier->id;
        }

        $party = \App\Models\Party::find($id);
        if (! $party) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'supplier_id' => ['That supplier could not be found.'],
            ]);
        }

        /* A party that has never been bought from yet. Making the row here is
           what lets the shop order from a customer without registering them a
           second time under another name. */
        return \App\Models\Supplier::create([
            'name'     => $party->name,
            'party_id' => $party->id,
            'phone'    => $party->phone ?? null,
            'email'    => $party->email ?? null,
            'address'  => $party->address ?? null,
        ])->id;
    }

    /**
     * The account a deposit actually came out of.
     *
     * The picker sends the sentinel 'CHEQUE' for a cheque, which is not an
     * account id — `Account::find()` returns null for it and the old fallback
     * quietly debited Cash in Hand, so the till dropped by the value of every
     * cheque the moment an order was placed. A cheque written but not yet
     * cleared belongs in 1020.
     */
    private function resolvePaymentAccount($given, \App\Engines\AccountingService $accounting)
    {
        if (is_string($given) && strtoupper($given) === 'CHEQUE') {
            return $accounting->getAccountByCode('1020', 'Cheques in Hand', 'asset');
        }
        $account = $given ? \App\Models\Account::find($given) : null;

        return $account ?: $accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
    }
}
