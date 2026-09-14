<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DebitNoteController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\DebitNote::with(['supplier']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('reference_number', 'like', "%{$search}%");
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $debitNotes = $query->orderBy('date', 'desc')->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($debitNotes);
        }

        return Inertia::render('DebitNotes/DebitNotes', [
            'debitNotes' => $debitNotes,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total' => \App\Models\DebitNote::count(),
                'totalAmount' => \App\Models\DebitNote::sum('amount'),
                'open' => \App\Models\DebitNote::whereIn('status', ['open', 'pending'])->count(),
            ]
        ]);
    }
    
    public function create() 
    { 
        return Inertia::render('DebitNotes/Create', [
            'suppliers' => \App\Models\Party::where('type', 'supplier')->get(),
            'products' => \App\Models\Product::take(50)->get(), // Limit to 50 for performance
            'warehouses' => \App\Models\Warehouse::query()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:parties,id',
            /* Which bill this note is arguing with. `purchase_id` has been a
               column since the table was made and was never once written, so a
               note could not say what it was about. */
            'purchase_id' => $this->purchaseRule($request),
            'date' => 'required|date',
            /* The column is an enum of exactly these two. It used to accept
               'refunded' as well, which the database then refused. */
            'status' => 'required|in:pending,approved',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'warehouse_id' => ['nullable', \Illuminate\Validation\Rule::exists('warehouses', 'id')->where('tenant_id', app('current.tenant')->id)],
            /* A note is not always about goods coming back. A short delivery or
               a price that was wrong is a billing adjustment and nothing leaves
               the shelf, so whether stock moves is a decision, not a guess. */
            'returns_stock' => 'nullable|boolean',
            'tax' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['required', \Illuminate\Validation\Rule::exists('products', 'id')->where('tenant_id', app('current.tenant')->id)],
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $note = \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {

            $goods = 0.0;
            foreach ($validated['items'] as $item) {
                $goods += (float) $item['quantity'] * (float) $item['unit_price'];
            }
            $goods = round($goods, 2);
            $discount = round((float) ($validated['discount'] ?? 0), 2);
            $tax = round((float) ($validated['tax'] ?? 0), 2);
            /* What the supplier is being told they are owed less. */
            $amount = round(max(0, $goods - $discount) + $tax, 2);

            $movesStock = (bool) ($validated['returns_stock'] ?? false) && ! empty($validated['warehouse_id']);

            $note = \App\Models\DebitNote::create([
                'supplier_id'  => $validated['supplier_id'],
                'purchase_id'  => $validated['purchase_id'] ?? null,
                'date'         => $validated['date'],
                'status'       => $validated['status'],
                'amount'       => $amount,
                'discount'     => $discount,
                'tax'          => $tax,
                'tax_rate'     => $validated['tax_rate'] ?? 0,
                'reason'       => $validated['reason'],
                'notes'        => $validated['notes'] ?? null,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'returns_stock' => $movesStock,
                'created_by'   => Auth::id(),
            ]);

            $goodsValue = 0.0;
            /* What the goods going back cost when they came in — read off the
               batches they leave, not the supplier's price on the note. */
            $stockCost = 0.0;
            foreach ($validated['items'] as $i => $itemData) {
                $subtotal = round((float) $itemData['quantity'] * (float) $itemData['unit_price'], 2);
                $goodsValue += $subtotal;

                $note->items()->create([
                    'product_id' => $itemData['product_id'],
                    'quantity'   => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal'   => $subtotal,
                ]);

                if ($movesStock && $validated['status'] === 'approved') {
                    $stockCost += $this->returnStock(
                        $itemData['product_id'],
                        $validated['warehouse_id'],
                        (float) $itemData['quantity'],
                        $note->reference_number,
                        $validated['purchase_id'] ?? null,
                        $i
                    );
                }
            }
            $stockCost = round($stockCost, 2);

            /* ── the ledger ──────────────────────────────────────────────
               A debit note says the shop owes the supplier less than their
               bill claimed, and that is a movement whether or not any goods
               travel.

               DR Accounts Payable   — the shop owes them less: the note's
                                       goods (less discount) plus its tax
               CR Inventory          — goods that went back, at EXACTLY the
                                       batch cost that left the FIFO layers,
                                       so 1100 keeps agreeing with them
               DR/CR 6000            — the gap between that cost and what the
                                       supplier credits, where a purchase
                                       return sends it (PurchaseService::
                                       createReturn: landed cost on returned
                                       goods is written off to 6000)
               CR Cost of Goods Sold — where it is a price or billing
                                       adjustment and nothing moved
               CR Input Tax          — the tax claimed back on the bill

               It used to credit 1100 with the supplier's price and never touch
               the batches, `stocks` or products.stock_quantity, so the ledger
               and the FIFO valuation drifted apart by every note. */
            if ($validated['status'] === 'approved') {
                $accounting = app(\App\Engines\AccountingService::class);
                $credited   = round(max(0, $goods - $discount), 2);
                $lines = [
                    [
                        'account_id' => $accounting->getAccountByCode('2000', 'Accounts Payable', 'liability')->id,
                        'debit' => $amount, 'credit' => 0,
                        'description' => "Debit note #{$note->reference_number}",
                        'party_id' => $note->supplier_id,
                    ],
                ];

                if ($movesStock) {
                    $lines[] = [
                        'account_id' => $accounting->getAccountByCode('1100', 'Inventory Asset', 'asset')->id,
                        'debit' => 0, 'credit' => $stockCost,
                        'description' => "Goods returned on #{$note->reference_number}",
                    ];
                    $gap = round($credited - $stockCost, 2);
                    if (abs($gap) >= 0.005) {
                        $lines[] = [
                            'account_id' => $accounting->getAccountByCode('6000', 'Operating Expenses', 'expense')->id,
                            'debit' => $gap < 0 ? -$gap : 0, 'credit' => $gap > 0 ? $gap : 0,
                            'description' => $gap < 0
                                ? "Cost of returned goods not credited by the supplier on #{$note->reference_number}"
                                : "Supplier credit above cost on #{$note->reference_number}",
                        ];
                    }
                } else {
                    $lines[] = [
                        'account_id' => $accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense')->id,
                        'debit' => 0, 'credit' => $credited,
                        'description' => "Price adjustment on #{$note->reference_number}",
                    ];
                }

                /* Tax claimed back on the original bill has to go back too —
                   off 2300 Input Tax Recoverable, where the purchase claimed it.
                   It was credited to 1300 (Prepaid Expenses / Advance to
                   Supplier), which left the input-tax claim on the tax summary
                   overstated and drove Prepaid Expenses negative. */
                if ($tax > 0.0001) {
                    $lines[] = [
                        'account_id' => $accounting->getAccountByCode('2300', 'Input Tax Recoverable', 'asset')->id,
                        'debit' => 0, 'credit' => $tax,
                        'description' => "Input tax reversed on #{$note->reference_number}",
                    ];
                }

                $lines = array_values(array_filter($lines, fn ($l) => $l['debit'] > 0.0001 || $l['credit'] > 0.0001));

                if (count($lines) >= 2) {
                    $entry = $accounting->createEntry([
                        'date' => $validated['date'],
                        'reference_type' => 'debit_note',
                        'reference' => $note->id,
                        'description' => "Debit note #{$note->reference_number}",
                        'party_id' => $note->supplier_id,
                    ], $lines);

                    $note->update(['journal_entry_id' => $entry->id ?? null]);
                }

                // A note against a bill comes off what that bill still owes.
                if (! empty($validated['purchase_id'])) {
                    app(\App\Engines\PaymentService::class)->updatePurchaseBadge($validated['purchase_id']);
                }
            }

            return $note;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Debit note created.',
                'debit_note_id' => $note->id,
            ]);
        }

        return redirect()->route('store.debit-notes.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Debit Note created successfully.');
    }

    /**
     * Edit a note that has not been acted on yet.
     *
     * An approved note has already moved stock and posted to the ledger, so it
     * is history: correcting one means raising another, not quietly rewriting
     * what the books say happened. A pending note has done neither and is
     * still just a draft.
     */
    public function update(Request $request, $id)
    {
        $note = \App\Models\DebitNote::findOrFail($id);

        if ($note->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This note has been approved and cannot be changed. Raise another one instead.',
            ], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:parties,id',
            'purchase_id' => $this->purchaseRule($request),
            'date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'warehouse_id' => ['nullable', \Illuminate\Validation\Rule::exists('warehouses', 'id')->where('tenant_id', app('current.tenant')->id)],
            'returns_stock' => 'nullable|boolean',
            'tax' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['required', \Illuminate\Validation\Rule::exists('products', 'id')->where('tenant_id', app('current.tenant')->id)],
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $note) {
            $goods = 0.0;
            foreach ($validated['items'] as $item) {
                $goods += (float) $item['quantity'] * (float) $item['unit_price'];
            }
            $goods = round($goods, 2);
            $discount = round((float) ($validated['discount'] ?? 0), 2);
            $tax = round((float) ($validated['tax'] ?? 0), 2);

            $note->update([
                'supplier_id'  => $validated['supplier_id'],
                'purchase_id'  => $validated['purchase_id'] ?? null,
                'date'         => $validated['date'],
                'amount'       => round(max(0, $goods - $discount) + $tax, 2),
                'discount'     => $discount,
                'tax'          => $tax,
                'tax_rate'     => $validated['tax_rate'] ?? 0,
                'reason'       => $validated['reason'],
                'notes'        => $validated['notes'] ?? null,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'returns_stock' => (bool) ($validated['returns_stock'] ?? false),
            ]);

            $note->items()->delete();
            foreach ($validated['items'] as $itemData) {
                $note->items()->create([
                    'product_id' => $itemData['product_id'],
                    'quantity'   => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal'   => round((float) $itemData['quantity'] * (float) $itemData['unit_price'], 2),
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Debit note updated.']);
    }

    /** The note, laid out to be printed or sent to the supplier. */
    public function print($id)
    {
        $note = \App\Models\DebitNote::with(['items.product', 'supplier'])->findOrFail($id);

        return \Inertia\Inertia::render('DebitNotes/Show', [
            'note'  => $note,
            'items' => $note->items,
            'print' => true,
        ]);
    }

    /**
     * Send one line's goods back: off the named bill's batch, or FIFO — see
     * PurchaseService::returnStockToSupplier(), which moves the batches,
     * `stocks`, products.stock_quantity and the movement log together.
     * Returns the batch cost that left. A line that cannot go back is the
     * user's to fix, so it comes back as a validation error on the form.
     */
    protected function returnStock($productId, $warehouseId, float $quantity, $reference, ?string $purchaseId = null, int $line = 0): float
    {
        try {
            return app(\App\Engines\PurchaseService::class)->returnStockToSupplier(
                (string) $productId,
                (string) $warehouseId,
                $quantity,
                $purchaseId,
                (string) $reference,
                "Debit Note / Return ($reference)"
            )['cost'];
        } catch (\InvalidArgumentException | \App\Exceptions\InsufficientStockException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'items' => $e->getMessage(),
                "items.{$line}.quantity" => $e->getMessage(),
            ]);
        }
    }

    /** The bill a note names: this store's, and from this note's supplier. */
    private function purchaseRule(Request $request): array
    {
        return [
            'nullable',
            \Illuminate\Validation\Rule::exists('purchases', 'id')
                ->where('tenant_id', app('current.tenant')->id)
                ->where('party_id', $request->input('supplier_id')),
        ];
    }

    public function show($id)
    {
        $note = \App\Models\DebitNote::with(['supplier', 'items.product', 'purchase'])->findOrFail($id);

        // GL posting: DebitNoteController::store() does NOT create a JournalEntry for
        // debit notes yet (see comment in store(): "Financial Update now handled by
        // Journal Entry via V3 (if implemented here in future)"). There is no
        // journal_entry_id column on debit_notes and no reference_type='debit_note'
        // entries are posted anywhere in the codebase today, so we cannot show a real
        // GL posting reference — only the stock-return movement this note triggered.
        $stockMovements = \App\Models\StockMovement::with('product')
            ->where('type', 'purchase_return')
            ->where('reference_id', $note->reference_number)
            ->get();

        return Inertia::render('DebitNotes/Show', [
            'note' => $note,
            'stockMovements' => $stockMovements,
            'bankAccounts' => \App\Models\BankAccount::orderBy('name')->get(),
        ]);
    }

    public function refund(Request $request, $store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug;
        $note = \App\Models\DebitNote::findOrFail($id);

        if ($note->status !== 'approved') {
            return redirect()->back()->with('error', 'Only approved debit notes can be refunded.');
        }

        $validated = $request->validate([
            'refund_method' => 'required|in:cash,bank',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'refund_date' => 'required|date|before_or_equal:today',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($note, $validated) {
            $accounting = app(\App\Engines\AccountingService::class);

            $paymentAccount = '1000'; // Cash
            if ($validated['refund_method'] === 'bank') {
                $paymentAccount = '1010'; // Default Bank
                if (!empty($validated['bank_account_id'])) {
                    $ba = \App\Models\BankAccount::find($validated['bank_account_id']);
                    if ($ba && $ba->account_id) {
                        $acc = \App\Models\Account::find($ba->account_id);
                        if ($acc) {
                            $paymentAccount = $acc->code;
                        }
                    }
                }
            }

            // DR 1000/1010 Cash/Bank (asset increases)
            // CR 2000 Accounts Payable (offsets the debit note's reduction of AP)
            $accounting->createEntry([
                'date'           => $validated['refund_date'],
                'reference_type' => 'supplier_refund',
                'reference'      => $note->id,
                'description'    => "Refund received for Debit Note {$note->reference_number}",
                'party_id'       => $note->supplier_id,
            ], [
                [
                    'account_code' => $paymentAccount,
                    'debit'        => $note->amount,
                    'credit'       => 0,
                ],
                [
                    'account_code' => '2000',
                    'debit'        => 0,
                    'credit'       => $note->amount,
                    'party_id'     => $note->supplier_id,
                ]
            ]);

            $note->update([
                'status' => 'refunded'
            ]);

            /* The supplier paid the credit back in cash, so it no longer comes
               off the bill the note named (PaymentService::purchaseSettlements). */
            if ($note->purchase_id) {
                app(\App\Engines\PaymentService::class)->updatePurchaseBadge($note->purchase_id);
            }
        });

        return redirect()->back()->with('success', 'Debit note marked as refunded.');
    }
}
