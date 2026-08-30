<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('expenseCategory');

        // Search
        if ($request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('description', 'like', "%{$term}%")
                  ->orWhere('reference', 'like', "%{$term}%")
                  ->orWhere('payee', 'like', "%{$term}%")
                  ->orWhereHas('expenseCategory', function ($q) use ($term) {
                      $q->where('name', 'like', "%{$term}%");
                  });
            });
        }

        // Filter
        if ($request->filter && $request->filter !== 'all') {
            if ($request->filter === 'today') {
                $query->whereDate('date', now()->toDateString());
            } elseif ($request->filter === 'month') {
                $query->whereMonth('date', now()->month)->whereYear('date', now()->year);
            }
        }

        // Category Filter
        if ($request->category && $request->category !== 'all') {
            $query->where('expense_category_id', $request->category);
        }

        // Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        }

        // Apply Sorting
        $sortBy = $request->input('sort_by', 'date');
        $sortDir = $request->input('sort_dir', 'desc');

        if ($sortBy === 'date') {
            $query->orderBy('date', $sortDir);
        } elseif ($sortBy === 'amount') {
            $query->orderBy('amount', $sortDir);
        } elseif ($sortBy === 'payee') {
             $query->orderBy('payee', $sortDir);
        } elseif ($sortBy === 'category') {
            $query->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
                ->select('expenses.*')
                ->orderBy('expense_categories.name', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $expenses = $query->paginate(200)
            ->withQueryString()
            ->through(function ($expense) {
                return [
                    'id' => $expense->id,
                    'date' => $expense->date,
                    'category' => $expense->expenseCategory->name ?? $expense->category ?? 'Uncategorized',
                    'category_icon' => $expense->expenseCategory->icon ?? 'Receipt',
                    'category_color' => $expense->expenseCategory->color ?? 'gray',
                    'category_group' => $expense->expenseCategory->group ?? 'Miscellaneous',
                    'expense_category_id' => $expense->expense_category_id,
                    'amount' => $expense->amount,
                    'payment_method' => $expense->payment_method,
                    'reference' => $expense->reference,
                    'description' => $expense->description,
                    'notes' => $expense->notes,
                    'payee' => $expense->payee,
                ];
            });

        if ($request->wantsJson()) {
            return response()->json($expenses);
        }

        // Get categories grouped
        $categories = ExpenseCategory::active()
            ->orderBy('name', 'asc')
            ->get();

        $tenantId = app('current.tenant')->id;

        // Calculate stats
        $stats = [
            'today' => (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('accounts.code', '6000')
                ->where('journal_entries.reference_type', 'expense')
                ->where('journal_entries.is_reversed', 0)
                ->whereDate('journal_entries.date', today())
                ->sum('journal_items.debit'),
            'month' => (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('accounts.code', '6000')
                ->where('journal_entries.reference_type', 'expense')
                ->where('journal_entries.is_reversed', 0)
                ->whereMonth('journal_entries.date', now()->month)
                ->whereYear('journal_entries.date', now()->year)
                ->sum('journal_items.debit'),
            'total' => (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('accounts.code', '6000')
                ->where('journal_entries.reference_type', 'expense')
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.debit'),
        ];

        // Get bank accounts and cash balance
        $allAccounts = BankAccount::orderBy('name')->get();
        $bankAccounts = collect();
        foreach ($allAccounts as $acc) {
            $acc->current_balance = $acc->v3Balance();
            if ($acc->account_type !== 'cash' && $acc->type !== 'cash' && strcasecmp(trim($acc->name), 'cash in hand') !== 0 && strcasecmp(trim($acc->name), 'cash') !== 0) {
                $bankAccounts->push($acc);
            }
        }

        // Fetch Cash in Hand balance directly from the ledger (Account 1000)
        $cashBalance = (float) DB::table('journal_items')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('accounts.code', '1000')
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as balance')
            ->value('balance');

                return Inertia::render('Expenses/ExpensesList', [
            'expenses' => $expenses,
            'categories' => $categories,
            'stats' => $stats,
            'bankAccounts' => $bankAccounts,
            'cashBalance' => $cashBalance,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date'])
        ]);
    }

    /** The full-page voucher. The modal on the list page still posts to store(). */
    public function create()
    {
        return Inertia::render('Expenses/Create', [
            'categories'   => ExpenseCategory::orderBy('name')->get(),
            'bankAccounts' => BankAccount::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'                => 'required|date',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'channel'             => 'nullable|string',
            'amount'              => 'required|numeric|min:0',
            'tax_amount'          => 'nullable|numeric|min:0',
            'grand_total'         => 'nullable|numeric|min:0',
            'payment_method'      => 'required|in:cash,bank',
            'bank_account_id'     => 'required_if:payment_method,bank|nullable|exists:bank_accounts,id',
            'payee'               => 'nullable|string|max:150',
            /* The payee as a real party, so an unpaid voucher lands in their
               ledger rather than in a string nobody can total. */
            'party_id'            => 'nullable|exists:parties,id',
            /* An expense is not always settled the moment it is written down.
               Absent means paid in full, which is what it always used to be. */
            'amount_paid'         => 'nullable|numeric|min:0',
            'reference'           => 'nullable|string|max:100',
            'description'         => 'nullable|string',
            'notes'               => 'nullable|string',
            /* One voucher, several things paid for. The table for these has
               existed for a while with nothing writing to it. */
            'items'                       => 'nullable|array',
            'items.*.expense_category_id' => 'required_with:items|exists:expense_categories,id',
            'items.*.description'         => 'nullable|string|max:255',
            'items.*.amount'              => 'required_with:items|numeric|min:0',
            'items.*.tax_amount'          => 'nullable|numeric|min:0',
            'attachment'          => 'nullable|file|mimes:jpeg,png,pdf,doc,docx|max:2048'
        ]);

        $validated = $this->foldExpenseLines($validated);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('expenses', 'public');
            $validated['attachment'] = $path;
        }

        $category = ExpenseCategory::find($validated['expense_category_id']);
        /* `exists:` does not scope to the tenant, so a category id from another
           store validates and then resolves to nothing. Reading ->name off it
           was a 500; refusing it is an error message. */
        if (! $category) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'expense_category_id' => ['That category does not belong to this store.'],
            ]);
        }
        $validated['category']    = $category->name;
        $validated['tax_amount']  = $validated['tax_amount'] ?? 0;

        $expense = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request) {
            $lines = $validated['items'] ?? [];
            unset($validated['items']);

            $expense = Expense::create($validated);
            $this->saveExpenseLines($expense, $lines);

            // ── Post to the double-entry ledger ─────────────────────────────────
            // DR Expense account | CR Cash or Bank
            // This is what makes expenses appear in the P&L and the Cash balance.
            $this->postExpenseJournalEntry($expense);
            
            \App\Models\Activity::create([
                'type' => 'expense',
                'description' => 'Expense: ' . ($expense->description ?? $expense->category),
                'amount' => $expense->amount,
                'reference_id' => $expense->id,
                'reference_type' => 'expense',
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
            ]);

            return $expense;
        });

        return response()->json([
            'success' => true,
            'message' => 'Expense recorded successfully',
            'expense' => $expense
        ]);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        /* Freight, duty and clearing on a purchase are capitalised INTO the
           stock by the purchase itself — they are already in what the goods are
           worth. Editing one here would reverse a journal entry this controller
           never posted and then post DR 6000 / CR cash on top of the
           capitalisation, counting the same money twice. */
        if ($expense->is_landed_cost) {
            return response()->json([
                'success' => false,
                'message' => 'This is a landed cost on a purchase. Change it on the purchase itself, so the value of the stock changes with it.',
            ], 422);
        }

        $validated = $request->validate([
            'date'                => 'required|date',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'channel'             => 'nullable|string',
            'amount'              => 'required|numeric|min:0',
            'tax_amount'          => 'nullable|numeric|min:0',
            'grand_total'         => 'nullable|numeric|min:0',
            'payment_method'      => 'required|in:cash,bank',
            'bank_account_id'     => 'required_if:payment_method,bank|nullable|exists:bank_accounts,id',
            'payee'               => 'nullable|string|max:150',
            'party_id'            => 'nullable|exists:parties,id',
            'amount_paid'         => 'nullable|numeric|min:0',
            'reference'           => 'nullable|string|max:100',
            'description'         => 'nullable|string',
            'notes'               => 'nullable|string',
            'items'                       => 'nullable|array',
            'items.*.expense_category_id' => 'required_with:items|exists:expense_categories,id',
            'items.*.description'         => 'nullable|string|max:255',
            'items.*.amount'              => 'required_with:items|numeric|min:0',
            'items.*.tax_amount'          => 'nullable|numeric|min:0',
            'attachment'          => 'nullable|file|mimes:jpeg,png,pdf,doc,docx|max:2048'
        ]);

        $validated = $this->foldExpenseLines($validated, $expense);
        /* The payee is part of the record, not part of every request: a caller
           that does not mention one is not saying there isn't one. */
        if (! array_key_exists('party_id', $validated)) $validated['party_id'] = $expense->party_id;
        if (! array_key_exists('payee', $validated))    $validated['payee']    = $expense->payee;

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('expenses', 'public');
            $validated['attachment'] = $path;
        }

        $category = ExpenseCategory::find($validated['expense_category_id']);
        if (! $category) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'expense_category_id' => ['That category does not belong to this store.'],
            ]);
        }
        $validated['category']   = $category->name;
        $validated['tax_amount'] = $validated['tax_amount'] ?? 0;

        \Illuminate\Support\Facades\DB::transaction(function () use ($expense, $validated) {
            // Reverse the original journal entry
            $originalEntries = \App\Models\JournalEntry::where('reference', $expense->id)
                ->where('reference_type', 'expense')
                ->where('is_reversed', 0)
                ->get();

            foreach ($originalEntries as $entry) {
                $entry->update(['is_reversed' => 1]);
                
                $reversalLines = $entry->items->map(function($item) {
                    return [
                        'account_id' => $item->account_id,
                        'debit'      => $item->credit,
                        'credit'     => $item->debit,
                        'party_id'   => $item->party_id,
                    ];
                })->toArray();
                
                app(\App\Engines\AccountingService::class)->createEntry([
                    'date'           => now()->toDateString(),
                    'reference'      => $expense->id,
                    'reference_type' => 'expense_reversal',
                    'description'    => 'REVERSAL — ' . $entry->description,
                    'is_reversed'    => 1,
                    'party_id'       => null,
                ], $reversalLines);
            }

            $lines = $validated['items'] ?? [];
            unset($validated['items']);
            $expense->update($validated);
            $this->saveExpenseLines($expense, $lines);

            // Post the corrected journal entry
            $this->postExpenseJournalEntry($expense);

            // Sync Activity
            \App\Models\Activity::updateOrCreate(
                ['reference_id' => $expense->id, 'reference_type' => 'expense'],
                [
                    'type'           => 'expense',
                    'description'    => 'Expense: ' . ($expense->description ?? $expense->category ?? 'Expense'),
                    'amount'         => abs($expense->amount + $expense->tax_amount),
                    'user_id'        => auth()->id(),
                ]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'expense' => $expense->fresh()
        ]);
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);

        /* Same reason as update(): deleting it here would leave the purchase's
           capitalisation standing with nothing to explain it. */
        if ($expense->is_landed_cost) {
            return response()->json([
                'success' => false,
                'message' => 'This is a landed cost on a purchase. Remove it from the purchase instead.',
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($expense) {
            /* `expenses` is a hard delete and `expense_items` has no cascade,
               so without this every deleted multi-line voucher leaves its lines
               behind for the category reports to keep counting. Inside the
               transaction, so a reversal that throws does not take the lines
               with it and leave the voucher standing. */
            $expense->items()->delete();

            // Reverse the journal entry that was posted when the expense was created
            $originalEntries = \App\Models\JournalEntry::where('reference', $expense->id)
                ->where('reference_type', 'expense')
                ->where('is_reversed', 0)
                ->get();

            foreach ($originalEntries as $entry) {
                $entry->update(['is_reversed' => 1]);
                
                $reversalLines = $entry->items->map(function($item) {
                    return [
                        'account_id' => $item->account_id,
                        'debit'      => $item->credit,
                        'credit'     => $item->debit,
                        'party_id'   => $item->party_id,
                    ];
                })->toArray();
                
                app(\App\Engines\AccountingService::class)->createEntry([
                    'date'           => now()->toDateString(),
                    'reference'      => $expense->id,
                    'reference_type' => 'expense_reversal',
                    'description'    => 'REVERSAL — ' . $entry->description,
                    'is_reversed'    => 1,
                    'party_id'       => null,
                ], $reversalLines);
            }

            $expense->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully'
        ]);
    }

    // Quick add expense (for charity and quick entries)
    public function quickAdd(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string',
            'amount'        => 'required|numeric|min:0',
            'description'   => 'nullable|string'
        ]);

        $category = ExpenseCategory::where('name', $validated['category_name'])->first();

        $expense = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $category) {
            $expense = Expense::create([
                'date'                => now()->toDateString(),
                'expense_category_id' => $category?->id,
                'category'            => $validated['category_name'],
                'amount'              => $validated['amount'],
                'payment_method'      => 'cash',
                'description'         => $validated['description'] ?? $validated['category_name']
            ]);

            $this->postExpenseJournalEntry($expense);
            return $expense;
        });

        return response()->json([
            'success' => true,
            'expense' => $expense
        ]);
    }

    /**
     * Post a double-entry journal entry for an expense.
     *
     * DR: Expense account (increases expense, reduces equity)
     * CR: Cash (account 1000) or Bank (account 1010)
     *
     * MUST be called inside a DB::transaction().
     */
    /**
     * Fold a voucher's lines into the single figures the row still carries, so
     * that an itemised expense and a one-line one are the same record.
     */
    private function foldExpenseLines(array $v, ?Expense $existing = null): array
    {
        $lines = $v['items'] ?? [];
        if (! empty($lines)) {
            $v['amount']     = round(array_sum(array_map(fn ($l) => (float) ($l['amount'] ?? 0), $lines)), 2);
            /* Only where the lines actually carry tax. The screen asks for it
               once, on the voucher, because there is no per-line tax column —
               and summing an absent key would have zeroed what was sent. */
            $lineTax = round(array_sum(array_map(fn ($l) => (float) ($l['tax_amount'] ?? 0), $lines)), 2);
            if ($lineTax > 0.0001) $v['tax_amount'] = $lineTax;
            /* The row's own category stays the first line's, so every list,
               filter and report that groups by it keeps working. */
            $v['expense_category_id'] = $lines[0]['expense_category_id'] ?? $v['expense_category_id'];
        }
        $v['tax_amount']  = round((float) ($v['tax_amount'] ?? 0), 2);
        $v['grand_total'] = round((float) $v['amount'] + $v['tax_amount'], 2);
        /* Nothing said means paid in full — which is what an expense has
           always meant here, so no existing caller changes behaviour. */
        /* Nothing said means paid in full on a NEW voucher — which is what an
           expense has always meant here, so the quick-add and the list modal
           keep working unchanged. On an edit it means "leave it as it was":
           taking silence as paid-in-full credited cash that never left the
           till and wiped what was still owed to the payee. */
        $v['amount_paid'] = array_key_exists('amount_paid', $v) && $v['amount_paid'] !== null
            ? round(min((float) $v['amount_paid'], $v['grand_total']), 2)
            : ($existing !== null && (float) $existing->grand_total > 0.0001
                /* Only where the row was written by something that knew about
                   these columns. Half a dozen services create expenses
                   directly — a charity donation, a landed cost, an import —
                   and those rows sit at the column default of zero. Preserving
                   THAT would turn a donation that has already left the till
                   into an unpayable liability the first time somebody edited
                   its description. `grand_total` is the tell: nothing else
                   writes it. */
                ? round(min((float) $existing->amount_paid, $v['grand_total']), 2)
                : $v['grand_total']);
        return $v;
    }

    private function saveExpenseLines(Expense $expense, array $lines): void
    {
        $expense->items()->delete();
        foreach ($lines as $l) {
            $expense->items()->create([
                'expense_category_id' => $l['expense_category_id'],
                'description' => $l['description'] ?? null,
                'amount'      => round((float) ($l['amount'] ?? 0), 2),
                'tax_amount'  => round((float) ($l['tax_amount'] ?? 0), 2),
            ]);
        }
    }

    private function postExpenseJournalEntry(Expense $expense): void
    {
        /* Belt and braces for the guards above, and for any other caller: a
           landed cost is already inside the purchase's own journal entry. */
        if ($expense->is_landed_cost) return;

        $net = round((float) $expense->amount, 2);
        $tax = round((float) ($expense->tax_amount ?? 0), 2);
        $total = round($net + $tax, 2);
        if ($total <= 0) return;

        // Resolve the expense GL account
        $expenseAccount = \App\Models\Account::where('code', '6000')->first()
            ?? \App\Models\Account::where('name', 'Operating Expenses')->first();

        if (!$expenseAccount) {
            $expenseAccount = \App\Models\Account::create([
                'code' => '6000',
                'name' => 'Operating Expenses',
                'type' => 'expense',
            ]);
        }

        // Resolve the cash/bank credit account
        if ($expense->payment_method === 'cash') {
            $creditAccount = \App\Models\Account::where('code', '1000')->first();
        } else {
            $creditAccount = \App\Models\Account::where('code', '1010')->first()
                ?? \App\Models\Account::where('code', '1000')->first();
        }

        if (!$creditAccount) return;

        $accounting = app(\App\Engines\AccountingService::class);

        /* What was actually handed over. The rest is owed, and it is owed to
           somebody — posting the whole voucher out of the till on the day it
           was written is how an unpaid bill came to reduce the cash balance. */
        $paid   = round(min((float) ($expense->amount_paid ?? $total), $total), 2);
        $unpaid = round($total - $paid, 2);

        $lines = [
            ['account_id' => $expenseAccount->id, 'debit' => $net, 'credit' => 0,
             'description' => ($expense->category ?? 'Expense') . ': ' . ($expense->description ?? '')],
        ];

        /* Tax on a bill the shop can reclaim is an ASSET, not an expense.
           Rolling it into the expense account overstated costs by exactly the
           tax and lost the input credit. */
        if ($tax > 0.0001) {
            $lines[] = [
                'account_id' => $accounting->getAccountByCode('1300', 'Input Tax Credit', 'asset')->id,
                'debit' => $tax, 'credit' => 0,
                'description' => 'Input tax on expense',
            ];
        }

        if ($paid > 0.0001) {
            $lines[] = ['account_id' => $creditAccount->id, 'debit' => 0, 'credit' => $paid,
                        'description' => 'Paid ' . ($expense->payee ?? '')];
        }
        if ($unpaid > 0.0001) {
            $lines[] = [
                'account_id' => $accounting->getAccountByCode('2000', 'Accounts Payable', 'liability')->id,
                'debit' => 0, 'credit' => $unpaid,
                'description' => 'Owed to ' . ($expense->payee ?? 'payee'),
                'party_id' => $expense->party_id,
            ];
        }

        $accounting->createEntry([
            'date'           => $expense->date,
            'reference'      => $expense->id,
            'reference_type' => 'expense',
            'description'    => ($expense->category ?? 'Expense') . ': ' . ($expense->description ?? $expense->payee ?? ''),
            /* Named, so the voucher appears in the payee's ledger. */
            'party_id'       => $expense->party_id,
        ], $lines);
    }


    public function storeCategory(Request $request)
    {
        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'name' => [
                'required', 
                'string', 
                'max:100', 
                \Illuminate\Validation\Rule::unique('expense_categories')->where(fn ($q) => $q->where('tenant_id', $tenantId))
            ],
            'icon' => 'nullable|string',
            'color' => 'nullable|string'
        ]);

        $category = ExpenseCategory::create([
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? 'Tag',
            'color' => $validated['color'] ?? 'slate',
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'category' => $category
        ]);
    }
}
