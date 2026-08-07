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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'                => 'required|date',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0',
            'tax_amount'          => 'nullable|numeric|min:0',
            'grand_total'         => 'nullable|numeric|min:0',
            'payment_method'      => 'required|in:cash,bank',
            'bank_account_id'     => 'required_if:payment_method,bank|nullable|exists:bank_accounts,id',
            'payee'               => 'nullable|string|max:150',
            'reference'           => 'nullable|string|max:100',
            'description'         => 'nullable|string',
            'notes'               => 'nullable|string',
            'attachment'          => 'nullable|file|mimes:jpeg,png,pdf,doc,docx|max:2048'
        ]);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('expenses', 'public');
            $validated['attachment'] = $path;
        }

        $category = ExpenseCategory::find($validated['expense_category_id']);
        $validated['category']    = $category->name;
        $validated['tax_amount']  = $validated['tax_amount'] ?? 0;

        $expense = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request) {
            $expense = Expense::create($validated);

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

        $validated = $request->validate([
            'date'                => 'required|date',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount'              => 'required|numeric|min:0',
            'tax_amount'          => 'nullable|numeric|min:0',
            'payment_method'      => 'required|in:cash,bank',
            'bank_account_id'     => 'required_if:payment_method,bank|nullable|exists:bank_accounts,id',
            'payee'               => 'nullable|string|max:150',
            'reference'           => 'nullable|string|max:100',
            'description'         => 'nullable|string',
            'notes'               => 'nullable|string',
            'attachment'          => 'nullable|file|mimes:jpeg,png,pdf,doc,docx|max:2048'
        ]);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('expenses', 'public');
            $validated['attachment'] = $path;
        }

        $category = ExpenseCategory::find($validated['expense_category_id']);
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
                    ];
                })->toArray();
                
                app(\App\Services\V3\AccountingService::class)->createEntry([
                    'date'           => now()->toDateString(),
                    'reference'      => $expense->id,
                    'reference_type' => 'expense_reversal',
                    'description'    => 'REVERSAL — ' . $entry->description,
                    'is_reversed'    => 1,
                    'party_id'       => null,
                ], $reversalLines);
            }

            $expense->update($validated);

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

        \Illuminate\Support\Facades\DB::transaction(function () use ($expense) {
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
                    ];
                })->toArray();
                
                app(\App\Services\V3\AccountingService::class)->createEntry([
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
    private function postExpenseJournalEntry(Expense $expense): void
    {
        $total = (float) $expense->amount + (float) ($expense->tax_amount ?? 0);
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

        app(\App\Services\V3\AccountingService::class)->createEntry([
            'date'           => $expense->date,
            'reference'      => $expense->id,
            'reference_type' => 'expense',
            'description'    => ($expense->category ?? 'Expense') . ': ' . ($expense->description ?? $expense->payee ?? ''),
            'party_id'       => null,
        ], [
            ['account_id' => $expenseAccount->id, 'debit' => $total,  'credit' => 0],
            ['account_id' => $creditAccount->id,  'debit' => 0,       'credit' => $total],
        ]);
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
