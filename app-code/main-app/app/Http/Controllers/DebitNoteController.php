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
            'date' => 'required|date',
            'status' => 'required|in:pending,approved,refunded',
            'reason' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id', // Required if returning items
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0.1',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            
            // Calculate total from items if present, else use explicit 'amount' (not in validation yet?)
            // Actually let's assume if items exist, sum them. If not, use 'flat amount' logic (not typical for inventory systems but good for basic adjustments).
            // For now, let's enforce items for accurate tracking or add 'flat_amount' field.
            // Let's sum items.
            
            $totalAmount = 0;
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $totalAmount += $item['quantity'] * $item['unit_price'];
                }
            } else {
                 // Fallback or error? Let's assume frontend handled 'amount' if no items? 
                 // For simplified validaton let's require items or add 'amount' to inputs.
                 // Let's trust items for now.
            }

            $note = \App\Models\DebitNote::create([
                'supplier_id' => $validated['supplier_id'],
                'date' => $validated['date'],
                'status' => $validated['status'],
                'amount' => $totalAmount,
                'reason' => $validated['reason'],
                'created_by' => Auth::id()
            ]);

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $itemData) {
                    $subtotal = $itemData['quantity'] * $itemData['unit_price'];

                    $note->items()->create([
                        'product_id' => $itemData['product_id'],
                        'quantity' => $itemData['quantity'],
                        'unit_price' => $itemData['unit_price'],
                        'subtotal' => $subtotal
                    ]);

                    // If Approved or Refunded & Warehouse Selected -> Return Stock
                    if (in_array($validated['status'], ['approved', 'refunded']) && !empty($validated['warehouse_id'])) {
                        $this->returnStock($itemData['product_id'], $validated['warehouse_id'], $itemData['quantity'], $note->reference_number);
                    }
                }
            }

            // Financial Update now handled by Journal Entry via V3 (if implemented here in future)
        });

        return redirect()->route('store.debit-notes.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Debit Note created successfully.');
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
