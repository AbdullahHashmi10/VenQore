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
            'purchase_id' => 'nullable|exists:purchases,id',
            'date' => 'required|date',
            /* The column is an enum of exactly these two. It used to accept
               'refunded' as well, which the database then refused. */
            'status' => 'required|in:pending,approved',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            /* A note is not always about goods coming back. A short delivery or
               a price that was wrong is a billing adjustment and nothing leaves
               the shelf, so whether stock moves is a decision, not a guess. */
            'returns_stock' => 'nullable|boolean',
            'tax' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
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
            foreach ($validated['items'] as $itemData) {
                $subtotal = round((float) $itemData['quantity'] * (float) $itemData['unit_price'], 2);
                $goodsValue += $subtotal;

                $note->items()->create([
                    'product_id' => $itemData['product_id'],
                    'quantity'   => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal'   => $subtotal,
                ]);

                if ($movesStock && $validated['status'] === 'approved') {
                    $this->returnStock($itemData['product_id'], $validated['warehouse_id'], $itemData['quantity'], $note->reference_number);
                }
            }

            /* ── the ledger ──────────────────────────────────────────────
               A debit note says the shop owes the supplier less than their
               bill claimed, and that is a movement whether or not any goods
               travel. It used to post nothing at all, so the supplier's
               balance stayed exactly where it was and the note was a piece of
               paper with no effect on anything.

               DR Accounts Payable   — the shop owes them less
               CR Inventory          — where the goods actually went back
               CR Cost of Goods Sold — where it is a price or billing
                                       adjustment and nothing moved */
            if ($validated['status'] === 'approved') {
                $accounting = app(\App\Engines\AccountingService::class);
                $lines = [
                    [
                        'account_id' => $accounting->getAccountByCode('2000', 'Accounts Payable', 'liability')->id,
                        'debit' => $amount, 'credit' => 0,
                        'description' => "Debit note #{$note->reference_number}",
                        'party_id' => $note->supplier_id,
                    ],
                ];

                $creditCode = $movesStock ? '1100' : '5000';
                $creditName = $movesStock ? 'Inventory Asset' : 'Cost of Goods Sold';
                $creditType = $movesStock ? 'asset' : 'expense';
                $lines[] = [
                    'account_id' => $accounting->getAccountByCode($creditCode, $creditName, $creditType)->id,
                    'debit' => 0, 'credit' => round(max(0, $goods - $discount), 2),
                    'description' => $movesStock
                        ? "Goods returned on #{$note->reference_number}"
                        : "Price adjustment on #{$note->reference_number}",
                ];

                /* Tax claimed back on the original bill has to go back too. */
                if ($tax > 0.0001) {
                    $lines[] = [
                        'account_id' => $accounting->getAccountByCode('1300', 'Input Tax Credit', 'asset')->id,
                        'debit' => 0, 'credit' => $tax,
                        'description' => "Input tax reversed on #{$note->reference_number}",
                    ];
                }

                $entry = $accounting->createEntry([
                    'date' => $validated['date'],
                    'reference_type' => 'debit_note',
                    'reference' => $note->id,
                    'description' => "Debit note #{$note->reference_number}",
                    'party_id' => $note->supplier_id,
                ], $lines);

                $note->update(['journal_entry_id' => $entry->id ?? null]);
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
            'purchase_id' => 'nullable|exists:purchases,id',
            'date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'returns_stock' => 'nullable|boolean',
            'tax' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
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

    protected function returnStock($productId, $warehouseId, $quantity, $reference)
    {
        $stock = \App\Models\Stock::firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $warehouseId],
            ['quantity' => 0]
        );
        $stock->decrement('quantity', $quantity);

        \App\Models\StockMovement::create([
             'product_id' => $productId,
             'warehouse_id' => $warehouseId,
             'type' => 'purchase_return',
             'quantity' => -$quantity,
             'reference_id' => $reference,
             'user_id' => Auth::id(),
             'description' => "Debit Note / Return ($reference)"
        ]);
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
        });

        return redirect()->back()->with('success', 'Debit note marked as refunded.');
    }
}
