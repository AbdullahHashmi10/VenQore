<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Engines\FifoService;
use App\Queries\PartyBalanceQuery;
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
    public function create(Request $request)
    {
        // We pass empty/default data if needed, or just render the view.
        // The Create.jsx page seems to handle its own state via context/props.
        return Inertia::render('Returns/Create', [
            // `?ai_prefill=<key>` opens this screen pre-filled from an AI Scan.
            // A return posts a permanent ledger entry, so AI Scan hands the
            // lines over rather than posting them itself.
            'aiPrefill' => app(\App\Services\SmartCapture\PrefillService::class)
                ->pull($request->query('ai_prefill')),
        ]);
    }

    /**
     * Display the specified return details.
     */
    public function show($id)
    {
        $return = Sale::with(['customer', 'user', 'items.product', 'items.variant', 'payments'])
            ->where('status', 'returned')
            ->findOrFail($id);

        if ($return->party_id) {
            $net        = PartyBalanceQuery::partyNetBalance($return->party_id, $return->tenant_id ?? app('current.tenant')->id);
            $balanceDue = max(0, (float) abs($return->total) - (float) $return->payments->sum('amount'));
            $return->customer_net_balance  = $net;
            $return->customer_prev_balance = $net - $balanceDue;
            $return->append(['customer_net_balance', 'customer_prev_balance']);
        }

        // Batch restocking: ReturnController::store() does NOT link the newly-created
        // inventory batch back to this return via any FK (no sale_id/return_id column
        // on inventory_batches — see receiveBatch() calls in store()). The one reliable,
        // reference-tagged audit trail for "stock came back in via this return" is the
        // StockMovement rows written with type='return' and reference_id=reference_number.
        $restockMovements = \App\Models\StockMovement::with('product')
            ->where('type', 'return')
            ->where('reference_id', $return->reference_number)
            ->get();

        if (request()->wantsJson()) {
            return response()->json([
                'return' => $return
            ]);
        }

        return Inertia::render('Returns/Show', [
            'return' => $return,
            'restockMovements' => $restockMovements,
        ]);
    }
    /**
     * Store a newly created return in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id'   => 'required|exists:parties,id',
            /* A return answers to a sale. Without that link nothing caps it:
               the same goods could be handed back three times, each one putting
               stock on the shelf and cash out of the drawer, and no report
               would disagree. */
            /* Required, and scoped to this shop. Optional meant the whole cap
               block below could be skipped by leaving it out, and an unscoped
               `exists` meant another tenant's invoice would pass. */
            'original_sale_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('sales', 'id')
                    ->where('tenant_id', app('current.tenant')->id)
                    ->whereNull('deleted_at'),
            ],
            'return_reason' => 'nullable|string|max:255',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'items'         => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.original_sale_item_id' => 'required|exists:sale_items,id',
            'items.*.quantity'   => 'required|numeric|min:0.01',
            'items.*.price'      => 'required|numeric|min:0',
            'items.*.tax_rate'   => 'nullable|numeric|min:0|max:100',
            'items.*.discount'   => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,credit',
            /* What is actually handed back now. Anything short of the return's
               value stays on the customer's account as credit. It used to be
               required, ignored, and the full amount refunded regardless. */
            'amount_refunded' => 'required|numeric|min:0',
            'payment_account_id' => 'nullable',
            'notes' => 'nullable|string',
            'date'  => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();

            $tenantId = app('current.tenant')->id;
            $originalId = $request->input('original_sale_id');

            /* ── the cap, enforced HERE ──────────────────────────────────
               A limit checked only in a browser is not a limit. Whatever the
               screen sent, this is what the ledger says is still returnable. */
            $returnable = [];
            if ($originalId) {
                $sold = DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->where('sales.tenant_id', $tenantId)
                    ->whereNull('sales.deleted_at')
                    /* A line struck off the original sale is not returnable. */
                    ->whereNull('sale_items.deleted_at')
                    ->where('sale_items.sale_id', $originalId)
                    ->pluck('sale_items.quantity', 'sale_items.id');

                $back = DB::table('sale_items')
                    ->join('sales as r', 'sale_items.sale_id', '=', 'r.id')
                    ->where('r.tenant_id', $tenantId)
                    ->where('r.original_sale_id', $originalId)
                    ->where('r.status', 'returned')
                    ->whereNotNull('sale_items.original_sale_item_id')
                    ->groupBy('sale_items.original_sale_item_id')
                    ->selectRaw('sale_items.original_sale_item_id as line_id, SUM(ABS(sale_items.quantity)) as qty')
                    ->pluck('qty', 'line_id');

                foreach ($sold as $lineId => $qty) {
                    $returnable[$lineId] = max(0, (float) $qty - (float) ($back[$lineId] ?? 0));
                }

                foreach ($request->items as $i => $item) {
                    $lineId = $item['original_sale_item_id'] ?? null;
                    if (! $lineId) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "items.$i.quantity" => ['This line is not on the sale it is being returned against.'],
                        ]);
                    }
                    if (! array_key_exists($lineId, $returnable)) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "items.$i.quantity" => ['That line belongs to a different sale.'],
                        ]);
                    }
                    if ((float) $item['quantity'] > $returnable[$lineId] + 0.0001) {
                        $name = \App\Models\Product::find($item['product_id'])?->name ?? 'this item';
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "items.$i.quantity" => [
                                "Only {$returnable[$lineId]} of {$name} is still returnable on that sale.",
                            ],
                        ]);
                    }
                }
            }

            // 1. What is coming back, and what it is worth
            $goods = 0.0;      // after line discounts, before tax
            $taxBack = 0.0;    // tax coming back with it
            $itemsData = [];

            foreach ($request->items as $item) {
                $qty = (float) $item['quantity'];
                $price = (float) $item['price'];
                $discount = (float) ($item['discount'] ?? 0);
                $net = max(0, ($qty * $price) - $discount);
                /* Tax comes back in the same proportion it went out. Zeroing it
                   — which is what this did — hands the customer their money back
                   and quietly keeps the tax. */
                $rate = (float) ($item['tax_rate'] ?? 0);
                $lineTax = round($net * ($rate / 100), 2);

                $goods += $net;
                $taxBack += $lineTax;

                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'original_sale_item_id' => $item['original_sale_item_id'] ?? null,
                    'quantity' => $qty,
                    'price' => $price,
                    'discount' => $discount,
                    'tax_rate' => $rate,
                    'tax' => $lineTax,
                    'total' => $net,
                ];
            }

            $subtotal = round($goods, 2);
            $taxBack = round($taxBack, 2);
            $returnValue = round($subtotal + $taxBack, 2);

            /* Never hand back more than the return is worth. */
            $refundNow = round(min(max(0, (float) $request->amount_refunded), $returnValue), 2);
            $asCredit = round($returnValue - $refundNow, 2);

            // 2. The return, as a negative sale
            $reference = \App\Services\SequenceService::generateTransactionNumber('SRET');
            $warehouseId = $request->input('warehouse_id')
                ?? DB::table('sales')->where('id', $originalId)->value('warehouse_id')
                ?? \App\Models\Warehouse::first()?->id
                ?? 1;

            $sale = Sale::forceCreate([
                'reference_number' => $reference,
                'party_id'         => $request->customer_id,
                'customer_id'      => null, // Deprecated
                'user_id'          => Auth::id(),
                'warehouse_id'     => $warehouseId,
                'original_sale_id' => $originalId,
                'return_reason'    => $request->input('return_reason'),
                'subtotal'         => -$subtotal,
                'tax'              => -$taxBack,
                'discount'         => 0,
                'total'            => -$returnValue,
                'net_sales'        => -$subtotal,
                'subtotal_gross'   => -$subtotal,
                'total_tax'        => -$taxBack,
                'invoice_total'    => -$returnValue,
                'tendered_amount'  => -$refundNow,
                'change_return'    => 0,
                'status'           => 'returned',
                'payment_status'   => 'refunded',
                'payment_method'   => $request->payment_method,
                'notes'            => $request->notes,
                'posted_at'        => $request->date ?? now(),
            ]);

            // 3. Items and stock
            $fifo = app(FifoService::class);
            $totalCogs = 0;

            foreach ($itemsData as $data) {
                $productRecord = \App\Models\Product::find($data['product_id']);

                \App\Models\SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $data['product_id'],
                    'original_sale_item_id' => $data['original_sale_item_id'],
                    'quantity'   => -$data['quantity'],
                    'unit_price' => $data['price'],
                    'discount_amount' => $data['discount'],
                    'tax_rate'   => $data['tax_rate'],
                    'subtotal'   => -$data['total'],
                    'net_amount' => -$data['total'],
                    'cost_price' => $productRecord?->cost_price ?? 0,
                ]);

                /* Goods returned against a known line go back into the BATCHES
                   they came out of, at what they actually cost. Only a return
                   with no original line has to guess, and then today's cost is
                   the best guess there is. */
                $restored = false;
                if ($data['original_sale_item_id']) {
                    $batches = DB::table('sale_item_batches')
                        ->where('sale_item_id', $data['original_sale_item_id'])
                        ->where('is_reversed', 0)
                        ->get();

                    if ($batches->isNotEmpty()) {
                        $remaining = $data['quantity'];
                        foreach ($batches as $b) {
                            if ($remaining <= 0.0001) break;
                            $take = min($remaining, (float) $b->qty_deducted);
                            DB::table('inventory_batches')
                                ->where('id', $b->inventory_batch_id)
                                ->increment('remaining_qty', $take);
                            /* At the batch's own cost where the deduction row
                               recorded it — that is what these goods actually
                               cost, rather than what the batch costs now. */
                            $unit = (float) ($b->unit_cost
                                ?? DB::table('inventory_batches')
                                    ->where('id', $b->inventory_batch_id)->value('unit_cost')
                                ?? 0);
                            $totalCogs += $take * $unit;
                            $remaining -= $take;

                            /* Struck through, so a second return against the
                               same line cannot find this deduction and inflate
                               the batch all over again. Nothing was writing
                               this flag, only reading it. */
                            /* Through the model, so `reversed_at` and the reason go
                                with the flag. A raw `is_reversed = 1` left
                                `reversed_at` null, and SaleService::reverse() keys
                                off THAT — so returning a line and then voiding the
                                sale restored the same goods twice.

                                And `total_cogs` moves with `qty_deducted`, because
                                it is the figure the profit reports actually sum. */
                            $row = \App\Models\SaleItemBatch::find($b->id);
                            if ($row) {
                                if ($take >= (float) $b->qty_deducted - 0.0001) {
                                    $row->markReversed("Returned on #{$reference}");
                                } else {
                                    $left = (float) $b->qty_deducted - $take;
                                    $row->update([
                                        'qty_deducted' => $left,
                                        'total_cogs'   => round($left * (float) $b->unit_cost, 4),
                                    ]);
                                }
                            }
                        }
                        /* Anything the original batches cannot account for —
                           a partial reversal, a batch since cleared — lands as
                           a fresh one rather than being lost. */
                        if ($remaining > 0.0001) {
                            $unitCost = $productRecord?->cost_price ?? $data['price'];
                            $fifo->receiveBatch(
                                productId: $data['product_id'], warehouseId: $warehouseId,
                                qty: $remaining, unitCost: $unitCost, batchType: 'return',
                            );
                            $totalCogs += $remaining * $unitCost;
                        }
                        $restored = true;
                    }
                }

                if (! $restored) {
                    $unitCost = $productRecord?->cost_price ?? $data['price'];
                    $fifo->receiveBatch(
                        productId: $data['product_id'], warehouseId: $warehouseId,
                        qty: $data['quantity'], unitCost: $unitCost, batchType: 'return',
                    );
                    $totalCogs += $data['quantity'] * $unitCost;
                }

                \App\Models\StockMovement::create([
                    'product_id'   => $data['product_id'],
                    'warehouse_id' => $warehouseId,
                    'type'         => 'return',
                    'quantity'     => $data['quantity'],
                    'reference_id' => $reference,
                    'description'  => 'Return #' . $sale->id,
                    'user_id'      => Auth::id(),
                ]);
            }

            // 4. The ledger
            $accounting = app(\App\Engines\AccountingService::class);
            $journalItems = [];

            // DR Sales Revenue — income comes back down by what the goods were worth
            $salesAccount = $accounting->getAccountByCode('4000', 'Sales Revenue', 'income');
            $journalItems[] = [
                'account_id' => $salesAccount->id, 'debit' => $subtotal, 'credit' => 0,
                'description' => "Return for Sale #{$sale->reference_number}",
                'party_id' => $sale->party_id,
            ];

            // DR Tax payable — the tax goes back too
            if ($taxBack > 0.0001) {
                $taxAccount = $accounting->getAccountByCode('2100', 'Tax Payable', 'liability');
                $journalItems[] = [
                    'account_id' => $taxAccount->id, 'debit' => $taxBack, 'credit' => 0,
                    'description' => "Tax on return #{$sale->reference_number}",
                    'party_id' => $sale->party_id,
                ];
            }

            /* CR whatever the money actually came out of. Cash handed over now
               reduces the till; the rest sits on the customer's account. Both
               can happen on one return, which is why they are not a branch. */
            if ($refundNow > 0.0001) {
                $acc = null;
                if ($request->payment_account_id) {
                    $acc = \App\Models\Account::find($request->payment_account_id);
                }
                $acc = $acc ?: $accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
                $journalItems[] = [
                    'account_id' => $acc->id, 'debit' => 0, 'credit' => $refundNow,
                    'description' => "Refund for Return #{$sale->reference_number}",
                    'party_id' => $sale->party_id,
                ];
                \App\Models\Payment::create([
                    'sale_id' => $sale->id, 'amount' => -$refundNow, 'method' => 'cash',
                    'type' => 'out', 'date' => today()->toDateString(), 'reference' => 'Refund paid',
                ]);
            }

            if ($asCredit > 0.0001) {
                $receivables = $accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
                $journalItems[] = [
                    'account_id' => $receivables->id, 'debit' => 0, 'credit' => $asCredit,
                    'description' => "Credited to account — Return #{$sale->reference_number}",
                    'party_id' => $sale->party_id,
                ];
                \App\Models\Payment::create([
                    'sale_id' => $sale->id, 'amount' => -$asCredit, 'method' => 'store_credit',
                    'type' => 'out', 'date' => today()->toDateString(), 'reference' => 'Credited to account',
                    'cheque_date' => null,
                ]);
            }

            // Reverse COGS and put the inventory value back
            if ($totalCogs > 0) {
                $totalCogs = round($totalCogs, 2);
                $cogsAccount = $accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
                $journalItems[] = [
                    'account_id' => $cogsAccount->id, 'debit' => 0, 'credit' => $totalCogs,
                    'description' => "COGS reversal for Return #{$sale->reference_number}",
                ];
                $inventoryAccount = $accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
                $journalItems[] = [
                    'account_id' => $inventoryAccount->id, 'debit' => $totalCogs, 'credit' => 0,
                    'description' => "Inventory addition for Return #{$sale->reference_number}",
                ];
            }

            $sale->posted_at = $sale->posted_at ?: $sale->created_at;
            $sale->save();

            $accounting->createEntry([
                'date' => ($request->date ? \Carbon\Carbon::parse($request->date) : today())->toDateString(),
                'reference_type' => 'sale_return',
                'reference' => $sale->id,
                'description' => "Auto journal — Return #{$sale->reference_number}",
                'party_id' => $sale->party_id,
            ], $journalItems);

            DB::commit();

            \App\Models\Activity::create([
                'type' => 'return',
                'description' => 'Return from ' . (\App\Models\Party::find($request->customer_id)?->name ?? 'Customer'),
                'amount' => $returnValue,
                'reference_id' => $sale->id,
                'reference_type' => 'sale',
                'user_id' => Auth::id(),
                'metadata' => json_encode([
                    'reference_number' => $sale->reference_number,
                    'original_sale_id' => $originalId,
                    'refunded_now'     => $refundNow,
                    'credited'         => $asCredit,
                    'items_count'      => count($request->items),
                    'payment_method'   => $request->payment_method,
                ]),
            ]);

            return response()->json([
                'success'   => true,
                'message'   => 'Return processed.',
                'return_id' => $sale->id,
                'refunded'  => $refundNow,
                'credited'  => $asCredit,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
