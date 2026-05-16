<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\V3\FifoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReturnController extends Controller
{
    /**
     * Display a listing of returns (Sales with status='returned').
     */
    public function index(Request $request)
    {
        $query = Sale::query()
            ->where('status', 'returned')
            ->with(['customer', 'user', 'items.product']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by Date Range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        // Sorting
        $query->orderBy('created_at', 'desc')->orderBy('id', 'desc');

        $returns = $query->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($returns);
        }
        
        // Calculate Stats
        $stats = [
            'total_returns' => Sale::where('status', 'returned')->count(),
            'total_refunded' => abs(Sale::where('status', 'returned')->sum('total')),
            'items_returned' => abs(Sale::where('status', 'returned')->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')->sum('sale_items.quantity')), // distinct items or total qty? Assuming qty for now
            'this_month' => Sale::where('status', 'returned')->whereMonth('created_at', now()->month)->count(),
        ];

        return Inertia::render('Returns/ReturnsHistory', [
            'returns' => $returns,
            'filters' => $request->only(['search', 'start_date', 'end_date']),
            'stats' => $stats
        ]);
    }

    /**
     * Show the form for creating a new return.
     */
    public function create()
    {
        // We pass empty/default data if needed, or just render the view.
        // The Create.jsx page seems to handle its own state via context/props.
        return Inertia::render('Returns/Create');
    }

    /**
     * Display the specified return details.
     */
    public function show($id)
    {
        $return = Sale::with(['customer', 'user', 'items.product', 'items.variant'])
            ->where('status', 'returned')
            ->findOrFail($id);
            
        if ($return->customer) {
            $arAccount = \App\Models\Account::where('code', '1200')->value('id');
            $apAccount = \App\Models\Account::where('code', '2000')->value('id');
            
            $netAR = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $return->customer->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $arAccount)
                ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
                ->value('balance') ?? 0;

            $netAP = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $return->customer->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
                ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
                ->value('balance') ?? 0;

            $return->customer->current_balance = (float)$netAR - (float)$netAP;
        }

        return Inertia::render('Returns/Show', [
            'return' => $return
        ]);
    }
    /**
     * Store a newly created return in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:parties,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,credit',
            'amount_refunded' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // 1. Calculate Totals (Negative for Return)
            $subtotal = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $qty = $item['quantity'];
                $price = $item['price'];
                $lineTotal = $qty * $price;
                
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $qty,
                    'price' => $price,
                    'total' => $lineTotal
                ];
            }

            // 2. Create Sale Record (Type: Return)
            $reference = 'RET-' . date('ymd') . '-' . str_pad(\App\Models\Sale::whereDate('created_at', today())->count() + 1, 3, '0', STR_PAD_LEFT);
            
            $sale = Sale::forceCreate([
                'reference_number' => $reference,
                'party_id' => $request->customer_id,
                'customer_id' => null, // Deprecated
                'user_id' => Auth::id(),
                'warehouse_id' => \App\Models\Warehouse::first()?->id ?? 1,
                'subtotal' => -$subtotal, // Negative
                'tax' => 0,
                'discount' => 0,
                'total' => -$subtotal, // Negative
                'net_sales' => -$subtotal,
                'subtotal_gross' => -$subtotal,
                'tendered_amount' => 0,
                'change_return' => 0,
                'status' => 'returned',
                'payment_status' => 'refunded',
                'payment_method' => $request->payment_method,
                'notes' => $request->notes,
                'posted_at' => $request->date ?? now(),
                // Let Laravel auto-set created_at/updated_at to now() for correct chronological ordering
            ]);

            // 3. Process Items & Stock
            // [V3 SWAP DAY 1] Raw stock/batch writes replaced with FifoService V3 calls.
            // FifoService::restoreStock() restores remaining_qty to the EXACT original batches
            // that were deducted at sale time (reads sale_item_batches). For legacy items with
            // no sale_item_batches, we fall back to FifoService::receiveBatch().
            $fifo = app(FifoService::class);
            $warehouseId = \App\Models\Warehouse::first()?->id ?? 1;
            $totalCogs = 0; // accumulated from actual batch unit costs

            foreach ($itemsData as &$data) {
                $productRecord = \App\Models\Product::find($data['product_id']);

                // Create the SaleItem row first (restoreStock needs its ID)
                $saleItem = \App\Models\SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $data['product_id'],
                    'quantity'   => -$data['quantity'], // Negative quantity for returns
                    'unit_price' => $data['price'],
                    'subtotal'   => -$data['total'],
                    'net_amount' => -$data['total'],
                    'cost_price' => $productRecord?->cost_price ?? 0,
                ]);

                // FifoService: restore to original batches if they exist, else create new batch
                $saleBatches = DB::table('sale_item_batches')
                    ->where('sale_item_id', $saleItem->id)
                    ->where('is_reversed', 0)
                    ->exists();

                if ($saleBatches) {
                    // V3 path: reverse the exact FIFO deductions made at sale time
                    $fifo->restoreStock($saleItem->id);
                    // Accumulate COGS from original batch costs
                    $batchCogs = DB::table('sale_item_batches')
                        ->where('sale_item_id', $saleItem->id)
                        ->sum('total_cogs');
                    $totalCogs += (float) $batchCogs;
                } else {
                    // Legacy path: no sale_item_batches — receive as new batch at product cost
                    $unitCost = $productRecord?->cost_price ?? $data['price'];
                    $fifo->receiveBatch(
                        productId:   $data['product_id'],
                        warehouseId: $warehouseId,
                        qty:         $data['quantity'],
                        unitCost:    $unitCost,
                        batchType:   'return'
                    );
                    $totalCogs += $data['quantity'] * $unitCost;
                }

                // [V3 SWAP DAY 1] Removed: manual Stock::increment() and Product::increment('stock_quantity').
                // The canonical stock figure is derived from StockMovements (and verified by FifoService
                // batch sums). Writing both Stock and products.stock_quantity by hand here caused the
                // triple-write that autoHealStockIntegrity was trying to paper over.

                // Log Movement (unchanged — this is the source of truth for stock history)
                \App\Models\StockMovement::create([
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $warehouseId,
                    'type'         => 'return',
                    'quantity'     => $data['quantity'], // Positive: going back into stock
                    'reference_id' => $reference,
                    'description'  => 'Return #' . $sale->id,
                    'user_id'      => Auth::id(),
                ]);
            }
            unset($data); // clean up foreach reference

            // 4. Financials / Accounting
            $accounting = app(\App\Services\AccountingService::class);
            $journalItems = [];

            // DR: Sales Revenue (reduce income by subtotal since it was a return)
            $salesAccount = $accounting->getAccountByCode('4000', 'Sales Revenue', 'income');
            $journalItems[] = [
                'account_id'  => $salesAccount->id,
                'debit'       => $subtotal, // debiting income reduces it
                'credit'      => 0,
                'description' => "Return for Sale #{$sale->reference_number}",
            ];

            // CR: Accounts Receivable OR Cash (reduce asset)
            if ($request->payment_method === 'credit') {
                $party = \App\Models\Party::find($request->customer_id);
                if ($party) {
                    \App\Models\Payment::create([
                        'sale_id' => $sale->id,
                        'amount' => -$subtotal, // Negative payment
                        'method' => 'store_credit',
                        'type' => 'out',
                        'date' => today()->toDateString(),
                        'reference' => 'Store Credit Issued',
                        'cheque_date' => null,
                    ]);
                }
                
                $receivablesAccount = $accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
                $journalItems[] = [
                    'account_id'  => $receivablesAccount->id,
                    'debit'       => 0,
                    'credit'      => $subtotal,
                    'description' => "Return (Store Credit) for Sale #{$sale->reference_number}",
                ];
            } else {
                \App\Models\Payment::create([
                    'sale_id' => $sale->id,
                    'amount' => -$subtotal,
                    'method' => 'cash', 
                    'type' => 'out',
                    'date' => today()->toDateString(),
                    'reference' => 'Cash Refund',
                ]);
                
                $cashAccount = $accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
                $journalItems[] = [
                    'account_id'  => $cashAccount->id,
                    'debit'       => 0,
                    'credit'      => $subtotal, // crediting cash reduces it
                    'description' => "Cash Refund for Sale #{$sale->reference_number}",
                ];

                // [V3 SWAP DAY 1] Removed: BankAccount::decrement('current_balance') bypass.
                // The Payment::create() record above is the audit trail. The Dashboard now derives
                // cash balance by summing payments (not from current_balance), as fixed in Day 1 item 1.
            }

            // Reverse COGS and Inventory
            // [V3 SWAP DAY 1] $totalCogs is now accumulated from actual FifoService batch costs
            // above — not from the snapshot product.cost_price, which may have changed since sale.
            if ($totalCogs > 0) {
                $cogsAccount = $accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
                $journalItems[] = [
                    'account_id'  => $cogsAccount->id,
                    'debit'       => 0, // CR Expense (reduces it)
                    'credit'      => $totalCogs,
                    'description' => "COGS reversal for Return #{$sale->reference_number}",
                ];
                $inventoryAccount = $accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
                $journalItems[] = [
                    'account_id'  => $inventoryAccount->id,
                    'debit'       => $totalCogs, // DR Asset (increases it)
                    'credit'      => 0,
                    'description' => "Inventory addition for Return #{$sale->reference_number}",
                ];
            }

            // Generate Journal Entry
            $sale->posted_at = $sale->created_at; // Ensure posted_at exists for reporting queries
            $sale->save();

            $accounting->createEntry([
                'date'     => today()->toDateString(),
                'reference_type' => 'sale_return',
                'reference'   => $sale->id,
                'description'    => "Auto journal — Return #{$sale->reference_number}",
                'party_id'       => $sale->party_id,
            ], $journalItems);

            DB::commit();

            \App\Models\Activity::create([
                'type'           => 'return',
                'description'    => 'Return from ' . ($request->customer_id ? \App\Models\Party::find($request->customer_id)?->name ?? 'Customer' : 'Walk-in'),
                'amount'         => abs($subtotal), // the true gross absolute size
                'reference_id'   => $sale->id,
                'reference_type' => 'sale',
                'user_id'        => Auth::id(),
                'metadata'       => json_encode([
                    'reference_number' => $sale->reference_number,
                    'net_sales'        => -$subtotal, // Note subtotal variable is already positive amount in logic actually... WAIT logic above: $subtotal += $lineTotal; subtotal is POSITIVE in the logic loop
                    'invoice_total'    => -$subtotal,
                    'items_count'      => count($request->items),
                    'payment_method'   => $request->payment_method,
                ]),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Return processed successfully.',
                'return_id' => $sale->id
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}
