<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Party;
use App\Services\V3\FifoService as V3Fifo;
use App\Services\V3\AccountingService as AccountingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['party', 'items.product'])
            ->where('type', 'purchase');

        // Search
        if ($request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('invoice_number', 'like', "%{$term}%")
                  ->orWhere('reference', 'like', "%{$term}%")
                  ->orWhereHas('party', function ($q) use ($term) {
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
            } else {
                $query->where('status', $request->filter);
            }
        }

        // Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        // Apply Sorting
        $sortBy = $request->input('sort_by', 'date');
        $sortDir = $request->input('sort_dir', 'desc');

        if ($sortBy === 'date') {
            $query->orderBy('created_at', $sortDir);
        } elseif ($sortBy === 'invoice_number') {
            $query->orderBy('invoice_number', $sortDir);
        } elseif ($sortBy === 'total') {
            $query->orderBy('total_amount', $sortDir);
        } elseif ($sortBy === 'status') {
             $query->orderBy('status', $sortDir);
        } elseif ($sortBy === 'supplier_name') {
            $query->leftJoin('parties', 'invoices.party_id', '=', 'parties.id')
                ->select('invoices.*')
                ->orderBy('parties.name', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $purchases = $query->withCount('items')
            ->paginate(200)
            ->withQueryString()
            ->through(function ($purchase) {
                // Get landed costs / extra expenses for this purchase
                $extras = \App\Models\Expense::where('purchase_id', $purchase->id)
                    ->where('is_landed_cost', true)
                    ->sum('amount');
                
                $subtotal = $purchase->items->sum(fn($item) => $item->quantity * $item->unit_price);
                $grandTotal = $subtotal + $extras;
                $paid = $purchase->paid_amount ?? 0;
                $balance = $grandTotal - $paid;
                
                // Calculate proper payment status
                $paymentStatus = 'unpaid';
                if ($paid >= $grandTotal) {
                    $paymentStatus = 'paid';
                } elseif ($paid > 0) {
                    $paymentStatus = 'partial';
                }
                
                return [
                    'id' => $purchase->id,
                    'date' => $purchase->created_at,
                    'invoice_number' => $purchase->invoice_number,
                    'supplier' => $purchase->party,
                    'reference' => $purchase->reference,
                    'items_count' => $purchase->items_count,
                    'items' => $purchase->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product' => $item->product,
                            'name' => $item->product?->name ?? $item->description,
                            'quantity' => $item->quantity,
                            'price' => $item->unit_price,
                            'subtotal' => $item->quantity * $item->unit_price,
                        ];
                    }),
                    'subtotal' => $subtotal,
                    'extras' => $extras,
                    'total' => $grandTotal,
                    'paid' => $paid,
                    'balance' => $balance,
                    'payment_status' => $paymentStatus,
                    'status' => $purchase->status ?? 'pending',
                ];
            });

        if ($request->wantsJson()) {
            return response()->json($purchases);
        }

        // FIX-07: Stats from V3 Journal AP account (2000)
        $apAccount = \App\Models\Account::where('code', '2000')->value('id');

        // Total invoiced = sum of all AP credits (what we owe suppliers)
        $totalPurchase = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.reference_type', 'purchase')
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->sum('journal_items.credit');

        // Total paid = sum of all AP debits against purchase entries and payments
        $totalPaid = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('journal_entries.reference_type', ['purchase', 'purchase_payment'])
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->sum('journal_items.debit');

        $totalDue = $totalPurchase - $totalPaid;

        $stats = [
            'total_purchase' => $totalPurchase,
            'total_paid'     => $totalPaid,
            'total_due'      => $totalDue,
            'pending_count'  => Invoice::where('type', 'purchase')->where('status', 'pending')->count(),
        ];

        return Inertia::render('Purchases/PurchasesList', [
            'purchases' => $purchases,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date']),
            'stats' => $stats
        ]);
    }

    public function create()
    {
        $parties = Party::orderBy('name')->get();
        // Pass products for search
        $products = \App\Models\Product::select('id', 'name', 'sku', 'cost_price', 'stock_quantity')->get();
        $expenseCategories = \App\Models\ExpenseCategory::query()->get();

        return Inertia::render('Purchases/Create', [
            'parties' => $parties,
            'products' => $products,
            'expenseCategories' => $expenseCategories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'party_id' => 'required|string', // Accept any string, we'll resolve it
            'date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.price' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'amount_paid' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'status' => 'nullable|string'
        ]);

        // Resolve party_id - it could be a party ID or a supplier ID
        $party = Party::find($validated['party_id']);
        if (!$party) {
            // Maybe it's a supplier ID, find the supplier and get/create its party
            $supplier = \App\Models\Supplier::find($validated['party_id']);
            if ($supplier) {
                if ($supplier->party_id) {
                    $party = Party::find($supplier->party_id);
                }
                if (!$party) {
                    // Create party for this supplier
                    $party = Party::create([
                        'type' => 'supplier',
                        'name' => $supplier->name,
                        'email' => $supplier->email,
                        'phone' => $supplier->phone,
                        'address' => $supplier->address,
                        'notes' => $supplier->notes,
                        'opening_balance' => 0,
                        'opening_balance_type' => 'payable',
                        'current_balance' => 0
                    ]);
                    $supplier->update(['party_id' => $party->id]);
                }
            }
        }
        
        if (!$party) {
            return response()->json(['errors' => ['party_id' => ['The selected party is invalid.']]], 422);
        }
        
        // Update validated with resolved party_id
        $validated['party_id'] = $party->id;

        $purchaseId = DB::transaction(function () use ($validated, $request) {
            // 1. Calculate Totals (Vendor Bill)
            $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['price']);
            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;
            $vendorTotal = $subtotal - $discount + $tax;

            // 2. Parse Extras (Landed Costs)
            $extras = $request->input('extras', []); // [{category_id, amount, method, description}]
            $totalExtras = collect($extras)->sum('amount');
            $totalInvoiceValue = $vendorTotal + $totalExtras;

            // 3. Create Invoice (Purchase) - VENDOR BILL ONLY
            /** @var Invoice $invoice */
            $invoice = Invoice::create([
                'type' => 'purchase',
                'invoice_number' => 'PUR-' . date('ymd') . '-' . substr(time(), -4),
                'party_id' => $validated['party_id'],
                'date' => $validated['date'],
                'total_amount' => $vendorTotal, // Vendor Bill Amount
                'paid_amount' => $validated['amount_paid'] ?? 0, // Logic to be refined based on 'pay extras'
                'discount' => $discount,
                'tax' => $tax,
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => $validated['status'] ?? 'pending',
                'user_id' => Auth::id()
            ]);

            // 4. Party balance is now tracked via V3 journal only — no direct column write
            $party = Party::find($validated['party_id']);

            // 5. V3 journal entry is created below — skip legacy Transaction table write

            // 6. Create Expense Records for Extras
            foreach ($extras as $extra) {
                if (($extra['amount'] ?? 0) > 0) {
                    \App\Models\Expense::create([
                        'category' => \App\Models\ExpenseCategory::find($extra['category_id'])?->name ?? 'Landed Cost',
                        // expense_category_id: if you have such column, else 'category' string
                        'amount' => $extra['amount'],
                        'date' => $validated['date'],
                        'description' => 'Landed Cost for ' . $invoice->invoice_number . (($extra['description'] ?? null) ? ': ' . $extra['description'] : ''),
                        'is_landed_cost' => true,
                        'purchase_id' => $invoice->id,
                        'allocation_method' => $extra['method'] ?? 'value',
                        'bank_account_id' => $extra['bank_account_id'] ?? null, // If paying immediately
                    ]);
                    // Note: If expenses are paid immediately, we should handle bank deduction here or assume Unpaid Expense?
                    // Spec says: "Impact: The extra $100 is automatically logged as an Expense".
                    // Usually Expenses are cash-out. Let's assume they are PAID extras for now or handle via 'paid' flag if user supports it.
                    // For now, simple record.
                }
            }

            // 7. Distribute Costs & Update Stock (The Core Logic)
            $totalItemValue = $subtotal; // For weighted average by value
            $totalItemQty = collect($validated['items'])->sum('quantity');

            foreach ($validated['items'] as $item) {
                // Calculate Effective Cost
                $baseCost = $item['price'];
                $extraCostPerUnit = 0;

                foreach ($extras as $extra) {
                    $amount = $extra['amount'];
                    $method = $extra['method'] ?? 'value';

                    if ($method === 'quantity' && $totalItemQty > 0) {
                        $extraCostPerUnit += ($amount / $totalItemQty);
                    } elseif ($method === 'value' && $totalItemValue > 0) {
                         // Share = (ItemTotal / TotalItemValue) * ExtraAmount
                         // Per Unit = Share / Qty
                         $share = ($item['quantity'] * $baseCost / $totalItemValue) * $amount;
                         if ($item['quantity'] > 0) $extraCostPerUnit += ($share / $item['quantity']);
                    } elseif ($method === 'manual') {
                        // Not implemented fully in auto-distribute loop, usually per-item input. 
                        // Skipping for general 'extras' array.
                    }
                }

                $effectiveCost = $baseCost + $extraCostPerUnit;
                
                $invoice->items()->create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'], // Recorded as Vendor Price
                    'base_unit_cost' => $baseCost,
                    'effective_unit_cost' => $effectiveCost,
                    'total' => $item['quantity'] * $item['price'],
                    'received_qty' => ($validated['status'] ?? '') === 'received' ? $item['quantity'] : 0
                ]);

                // Update Stock & Moving Average Logic
                if (($validated['status'] ?? '') === 'received') {
                    $product = \App\Models\Product::find($item['product_id']);
                    if ($product) {
                        $currentStock = $product->stock_quantity;
                        $formattedCurrentCost = $product->cost_price;

                        // Increment Stock
                        $product->increment('stock_quantity', $item['quantity']);

                        // Moving Average Calculation (still used for products.cost_price reference field)
                        $oldVal   = $currentStock * $formattedCurrentCost;
                        $newVal   = $item['quantity'] * $effectiveCost;
                        $totalQty = $currentStock + $item['quantity'];
                        $newAvg   = ($totalQty > 0) ? ($oldVal + $newVal) / $totalQty : $effectiveCost;
                        $product->update(['cost_price' => $newAvg]);

                        // Get default warehouse
                        $defaultWarehouse = \App\Models\Warehouse::first();
                        $warehouseId = $defaultWarehouse?->id;

                        // [V3 SWAP DAY 3] V1 FifoService replaced with V3.
                        // V3::receiveBatch() is the ONLY method that creates inventory_batches rows.
                        app(\App\Services\V3\FifoService::class)->receiveBatch(
                            $item['product_id'],
                            $warehouseId,
                            $item['quantity'],
                            $baseCost,
                            'purchase',
                            $invoice->id
                        );

                        // If variant exists, update variant stock too
                        if (!empty($item['variant_id'])) {
                            $variant = \App\Models\ProductVariant::find($item['variant_id']);
                            if ($variant) $variant->increment('stock', $item['quantity']);
                        }

                        // Log Stock Movement
                        \App\Models\StockMovement::create([
                            'product_id'   => $item['product_id'],
                            'warehouse_id' => $warehouseId,
                            'type'         => 'purchase',
                            'quantity'     => $item['quantity'],
                            'reference_id' => $invoice->invoice_number,
                            'description'  => 'Purchase w/ Landed Cost',
                            'user_id'      => Auth::id()
                        ]);

                        // Update Stocks Table (Dashboard aggregate)
                        $stock = \App\Models\Stock::firstOrCreate(
                            ['product_id' => $item['product_id'], 'warehouse_id' => $warehouseId],
                            ['quantity'   => 0]
                        );
                        $stock->increment('quantity', $item['quantity']);
                    }
                }

            }

            // 8. Handle Payments & Journal Posting
            $this->postPurchaseJournal($invoice, $validated, $extras);

            \App\Models\Activity::create([
                'type' => 'purchase',
                'description' => 'Purchase ' . $invoice->invoice_number,
                'amount' => $totalInvoiceValue, // ECP total (Vendor + Landed costs)
                'reference_id' => $invoice->id,
                'reference_type' => 'invoice',
                'user_id' => \Illuminate\Support\Facades\Auth::id()
            ]);

            return $invoice->id;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Purchase recorded successfully',
                'id' => $purchaseId
            ]);
        }

        return redirect()->route('purchases.index')->with('success', 'Purchase recorded successfully');
    }

    public function show($id)
    {
        $purchase = Invoice::with(['party', 'items.product'])->findOrFail($id);

        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase
        ]);
    }

    public function edit($id)
    {
        $purchase = Invoice::with(['party', 'items.product', 'expenses'])->findOrFail($id);
        
        if ($purchase->party) {
            $arAccount = \App\Models\Account::where('code', '1200')->value('id');
            $apAccount = \App\Models\Account::where('code', '2000')->value('id');
            
            $netAR = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $purchase->party->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $arAccount)
                ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
                ->value('balance') ?? 0;

            $netAP = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $purchase->party->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
                ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
                ->value('balance') ?? 0;

            // Suppliers: Positive balance = Liability (WE owe THEM)
            $purchase->party->current_balance = (float)$netAP - (float)$netAR;
        }

        $parties = Party::orderBy('name')->get();
        // Pass products for search
        $products = \App\Models\Product::select('id', 'name', 'sku', 'cost_price', 'stock_quantity')->get();
        $expenseCategories = \App\Models\ExpenseCategory::query()->get();

        return Inertia::render('Purchases/Create', [
            'purchase' => $purchase,
            'parties' => $parties,
            'products' => $products,
            'expenseCategories' => $expenseCategories
        ]);
    }

    public function update(Request $request, $id)
    {
        $purchase = Invoice::with(['items', 'expenses'])->findOrFail($id);

        $validated = $request->validate([
            'party_id'        => 'required|string',
            'date'            => 'required|date',
            'items'           => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.001',
            'items.*.price'      => 'required|numeric|min:0',
            'payment_method'  => 'nullable|string',
            'amount_paid'     => 'nullable|numeric|min:0',
            'discount'        => 'nullable|numeric|min:0',
            'tax'             => 'nullable|numeric|min:0',
            'reference'       => 'nullable|string|max:100',
            'notes'           => 'nullable|string',
            'status'          => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request, $purchase) {
            // Step 1 — Reverse old journal entries
            $accounting = app(\App\Services\V3\AccountingService::class);
            $oldEntries = \App\Models\JournalEntry::where('reference', $purchase->id)
                ->whereIn('reference_type', ['purchase', 'purchase_payment'])
                ->where('is_reversed', 0)
                ->get();

            foreach ($oldEntries as $entry) {
                $entry->update(['is_reversed' => 1]);
                $reversalLines = $entry->items->map(function($item) {
                    return [
                        'account_id' => $item->account_id,
                        'debit'      => $item->credit,
                        'credit'     => $item->debit,
                        'party_id'   => $item->party_id,
                    ];
                })->toArray();
                
                $accounting->createEntry([
                    'date'           => now()->toDateString(),
                    'reference_type' => 'purchase_reversal',
                    'reference'      => $purchase->id,
                    'description'    => 'REVERSAL — ' . $entry->description,
                    'party_id'       => $entry->party_id,
                    'is_reversed'    => 1,
                ], $reversalLines);
            }

            // Step 2 — Reverse inventory batches & Stock
            foreach ($purchase->items as $item) {
                if (($item->received_qty ?? 0) > 0) {
                    $product = \App\Models\Product::find($item->product_id);
                    if ($product) $product->decrement('stock_quantity', $item->received_qty);
                }
            }
            \App\Models\InventoryBatch::where('purchase_invoice_id', $purchase->id)->delete();
            
            // Step 3 — Update invoice header
            $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['price']);
            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;
            $vendorTotal = $subtotal - $discount + $tax;

            $purchase->update([
                'party_id'     => $validated['party_id'],
                'date'         => $validated['date'],
                'total_amount' => $vendorTotal,
                'paid_amount'  => $validated['amount_paid'] ?? 0,
                'discount'     => $discount,
                'tax'          => $tax,
                'reference'    => $validated['reference'] ?? $purchase->reference,
                'notes'        => $validated['notes'] ?? $purchase->notes,
                'status'       => $validated['status'] ?? $purchase->status,
            ]);

            // Step 4 — Replace items/expenses & Restore stock
            $purchase->items()->delete();
            $purchase->expenses()->delete();
            \App\Models\Payment::where('sale_id', null)->where('reference', $purchase->invoice_number)->delete(); // Cleanup linked payments
            
            $extras = $request->input('extras', []);
            foreach ($extras as $extra) {
                if (($extra['amount'] ?? 0) > 0) {
                    \App\Models\Expense::create([
                        'category' => \App\Models\ExpenseCategory::find($extra['category_id'])?->name ?? 'Landed Cost',
                        'amount' => $extra['amount'],
                        'date' => $validated['date'],
                        'description' => 'Landed Cost for ' . $purchase->invoice_number,
                        'is_landed_cost' => true,
                        'purchase_id' => $purchase->id,
                        'allocation_method' => $extra['method'] ?? 'value',
                    ]);
                }
            }

            $fifo = app(\App\Services\V3\FifoService::class);
            $warehouseId = \App\Models\Warehouse::first()?->id ?? 1;

            foreach ($validated['items'] as $item) {
                $purchase->items()->create([
                    'product_id'          => $item['product_id'],
                    'quantity'            => $item['quantity'],
                    'unit_price'          => $item['price'],
                    'base_unit_cost'      => $item['price'],
                    'effective_unit_cost' => $item['price'],
                    'total'               => $item['quantity'] * $item['price'],
                    'received_qty'        => $item['quantity'],
                ]);

                $product = \App\Models\Product::find($item['product_id']);
                if ($product) {
                    $product->increment('stock_quantity', $item['quantity']);
                    $fifo->receiveBatch($item['product_id'], $warehouseId, $item['quantity'], $item['price'], 'purchase', $purchase->id);
                }
            }

            // Step 5 — Re-post Journal
            $this->postPurchaseJournal($purchase, $validated, $extras);

            return response()->json([
                'success' => true,
                'message' => 'Purchase updated and journals recalculated.',
                'id'      => $purchase->id,
            ]);
        });
    }

    private function postPurchaseJournal(Invoice $invoice, array $validated, array $extras = [])
    {
        $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['price']);
        $discount = $validated['discount'] ?? 0;
        $tax      = $validated['tax'] ?? 0;
        $vTotal   = $subtotal - $discount + $tax;

        $accounting = app(\App\Services\V3\AccountingService::class);

        // A. AP Liability (Vendor Bill)
        $apLines = [];
        $apLines[] = ['account_code' => '1100', 'debit' => $subtotal, 'credit' => 0, 'description' => "Goods received — {$invoice->invoice_number}"];
        if ($tax > 0) {
            $apLines[] = ['account_code' => '2100', 'debit' => $tax, 'credit' => 0, 'description' => "Input tax — {$invoice->invoice_number}"];
        }
        $apLines[] = ['account_code' => '2000', 'debit' => 0, 'credit' => $vTotal, 'description' => "Vendor liability — {$invoice->invoice_number}", 'party_id' => $invoice->party_id];

        foreach ($extras as $extra) {
            $amt = (float)($extra['amount'] ?? 0);
            if ($amt <= 0) continue;
            $apLines[] = ['account_code' => '5100', 'debit' => $amt, 'credit' => 0, 'description' => "Landed cost — {$invoice->invoice_number}"];
            $apLines[] = ['account_code' => '2000', 'debit' => 0, 'credit' => $amt, 'description' => "Landed cost payable — {$invoice->invoice_number}", 'party_id' => $invoice->party_id];
        }

        $accounting->createEntry([
            'date'           => $validated['date'],
            'reference_type' => 'purchase',
            'reference'      => $invoice->id,
            'description'    => "Vendor bill — {$invoice->invoice_number}",
            'party_id'       => $invoice->party_id,
        ], $apLines);

        // B. Payment
        if (($validated['amount_paid'] ?? 0) > 0) {
            $method = strtolower($validated['payment_method'] ?? 'cash');
            if ($method === 'credit') $method = 'cash';
            
            \App\Models\Payment::create([
                'party_id' => $invoice->party_id,
                'amount'   => $validated['amount_paid'],
                'date'     => $validated['date'],
                'type'     => 'out',
                'method'   => $method,
                'reference' => $invoice->invoice_number,
                'notes'    => "Payment for Purchase #{$invoice->invoice_number}"
            ]);

            $pmLines = [
                ['account_code' => '2000', 'debit' => $validated['amount_paid'], 'credit' => 0, 'description' => "Payment for Purchase #{$invoice->invoice_number}", 'party_id' => $invoice->party_id],
                ['account_code' => (in_array($method, ['bank', 'card', 'upi']) ? '1010' : '1000'), 'debit' => 0, 'credit' => $validated['amount_paid'], 'description' => "Payment out — {$invoice->invoice_number}"],
            ];

            $accounting->createEntry([
                'date'           => $validated['date'],
                'reference_type' => 'purchase_payment',
                'reference'      => $invoice->id,
                'description'    => "Payment — Purchase #{$invoice->invoice_number}",
                'party_id'       => $invoice->party_id,
            ], $pmLines);
        }
    }

    public function receive($id)
    {
        $purchase = Invoice::with(['party', 'items.product'])->findOrFail($id);

        return Inertia::render('Purchases/Receive', [
            'purchase' => $purchase
        ]);
    }

    public function storeReceive(Request $request, $id)
    {
        $purchase = Invoice::with('items')->findOrFail($id);

        $validated = $request->validate([
            'items'                   => 'required|array',
            'items.*.item_id'         => 'required|exists:invoice_items,id',
            'items.*.receiving_qty'   => 'required|numeric|min:0',
            'items.*.batch_number'    => 'nullable|string',
            'items.*.expiry_date'     => 'nullable|date',
            'notes'                   => 'nullable|string',
        ]);

        DB::transaction(function () use ($purchase, $validated) {
            $defaultWarehouse = \App\Models\Warehouse::first();
            $warehouseId      = $defaultWarehouse?->id;
            // [V3 SWAP DAY 3] V1 FifoService replaced with V3.
            $fifo             = app(V3Fifo::class);

            foreach ($validated['items'] as $itemData) {
                $item    = $purchase->items->find($itemData['item_id']);
                $recvQty = (float) $itemData['receiving_qty'];

                if (!$item || $recvQty <= 0) continue;

                $item->received_qty = ($item->received_qty ?? 0) + $recvQty;
                $item->save();

                $product = \App\Models\Product::find($item->product_id);
                if (!$product) continue;

                $invoiceUnitCost = (float) $item->unit_price;

                // V3 FIFO batch creation (V1 replaced)
                $fifo->receiveBatch(
                    productId:   $item->product_id,
                    warehouseId: $warehouseId,
                    qty:         $recvQty,
                    unitCost:    $invoiceUnitCost,
                    purchaseId:  $purchase->id
                );

                if ($item->product_variant_id) {
                    $variant = \App\Models\ProductVariant::find($item->product_variant_id);
                    if ($variant) $variant->increment('stock', $recvQty);
                }

                $stock = \App\Models\Stock::firstOrCreate(
                    ['product_id' => $item->product_id, 'warehouse_id' => $warehouseId],
                    ['quantity'   => 0]
                );
                $stock->increment('quantity', $recvQty);
                $product->increment('stock_quantity', $recvQty);

                \App\Models\StockMovement::create([
                    'product_id'   => $item->product_id,
                    'warehouse_id' => $warehouseId,
                    'type'         => 'purchase',
                    'quantity'     => $recvQty,
                    'reference_id' => $purchase->invoice_number,
                    'description'  => 'Goods received (partial/receive flow)',
                    'user_id'      => auth()->id(),
                ]);
            }

            $purchase->refresh();
            $allReceived = $purchase->items->every(fn($i) => $i->received_qty >= $i->quantity);
            $anyReceived = $purchase->items->some(fn($i) => ($i->received_qty ?? 0) > 0);
            $purchase->status = $allReceived ? 'received' : ($anyReceived ? 'partial' : $purchase->status);
            $purchase->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Goods received successfully. Inventory batches created.',
        ]);
    }


    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $purchase = Invoice::with('items')->findOrFail($id);

            // 1. Reverse all V3 journal entries for this purchase
            $oldEntries = \App\Models\JournalEntry::whereIn('reference_type', ['purchase', 'purchase_payment'])
                ->where('reference', $purchase->id)
                ->where('is_reversed', 0)
                ->get();

            foreach ($oldEntries as $entry) {
                $entry->update(['is_reversed' => 1]);

                $reversalLines = $entry->items->map(function ($item) {
                    return [
                        'account_id' => $item->account_id,
                        'debit'      => $item->credit,
                        'credit'     => $item->debit,
                    ];
                })->toArray();

                app(\App\Services\V3\AccountingService::class)->createEntry([
                    'date'           => now(),
                    'reference'      => $purchase->id,
                    'reference_type' => 'purchase_reversal',
                    'description'    => 'REVERSAL — Purchase deleted: ' . $purchase->invoice_number,
                    'party_id'       => $purchase->party_id,
                ], $reversalLines);
            }

            // 2. Void FIFO inventory batches
            $fifo = app(V3Fifo::class);
            $voidResult = $fifo->voidPurchaseBatches($purchase->id);
            if (!empty($voidResult['warnings'])) {
                Log::warning(
                    '[PurchaseController@destroy] Partially-consumed batches voided.',
                    ['purchase_id' => $purchase->id, 'warnings' => $voidResult['warnings']]
                );
            }

            // 3. Revert legacy stock_quantity aggregate
            if (in_array($purchase->status, ['received', 'partial'])) {
                foreach ($purchase->items as $item) {
                    $product = \App\Models\Product::find($item->product_id);
                    if ($product && $item->received_qty > 0) {
                        $product->decrement('stock_quantity', $item->received_qty);
                    }
                }
            }

            // 4. Delete purchase items and the purchase record
            $purchase->items()->delete();
            $purchase->delete();
        });

        return redirect()->route('purchases.index')->with('success', 'Purchase deleted successfully');
    }
}
