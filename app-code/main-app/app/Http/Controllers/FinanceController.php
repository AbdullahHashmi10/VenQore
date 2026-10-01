<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Party;
use App\Models\JournalEntry;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function index()
    {
        // ── ALL balances come from the journal ledger (SUM of items) ──────────
        // NEVER read Account::balance (denormalised cache — drifts on any direct DB insert).
        // NEVER read parties.current_balance (legacy column, superseded by ledger queries).
        
        $accountingSvc = resolve(\App\Engines\AccountingService::class);
        $tenantId = app('current.tenant')->id;

        // V3: Direct ledger sums for the overview cards
        $cashBalance = (float) $accountingSvc->getBalance('1000');
        $bankBalance = (float) $accountingSvc->getBalance('1010');

        // Receivables (Account 1200) - Debit normal
        $receivables = (float) \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('accounts.code', '1200')
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
            ->value('net');

        // Payables (Account 2000) - Credit normal
        $payables = (float) \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('accounts.code', '2000')
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0) as net')
            ->value('net');

        $receivables = max(0, $receivables);
        $payables = max(0, $payables);

        // Top receivable parties — query ledger per party on AR account
        $arAccount = Account::where('code', '1200')->first();
        $apAccount = Account::where('code', '2000')->first();

        $topReceivables = collect();
        $topPayables = collect();

        if ($arAccount) {
            $topReceivables = \Illuminate\Support\Facades\DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('parties', 'journal_entries.party_id', '=', 'parties.id')
                ->where('journal_items.tenant_id', $tenantId)
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_items.account_id', $arAccount->id)
                ->selectRaw('parties.id, parties.name, parties.phone, COALESCE(SUM(journal_items.debit), 0) - COALESCE(SUM(journal_items.credit), 0) as balance')
                ->groupBy('parties.id', 'parties.name', 'parties.phone')
                ->having('balance', '>', 0)
                ->orderByDesc('balance')
                ->take(5)
                ->get();
        }

        if ($apAccount) {
            $topPayables = \Illuminate\Support\Facades\DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->join('parties', 'journal_entries.party_id', '=', 'parties.id')
                ->where('journal_items.tenant_id', $tenantId)
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_items.account_id', $apAccount->id)
                ->selectRaw('parties.id, parties.name, parties.phone, COALESCE(SUM(journal_items.credit), 0) - COALESCE(SUM(journal_items.debit), 0) as balance')
                ->groupBy('parties.id', 'parties.name', 'parties.phone')
                ->having('balance', '>', 0)
                ->orderByDesc('balance')
                ->take(5)
                ->get();
        }

        // Recent journal entries
        $recentEntries = JournalEntry::with('items.account')
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->take(10)
            ->get();

        return Inertia::render('Finance/FinanceDashboard', [
            'stats' => [
                'cash'           => (float) $cashBalance,
                'bank'           => (float) $bankBalance,
                'receivables'    => (float) $receivables,
                'payables'       => (float) $payables,
                'totalLiquidity' => (float) ($cashBalance + $bankBalance)
            ],
            'topReceivables' => $topReceivables,
            'topPayables'    => $topPayables,
            'recentEntries'  => $recentEntries
        ]);
    }

    public function receivables()
    {
        // Query AR account (1200) balance per party — NEVER use parties.current_balance (stale cache).
        $arAccount = Account::where('code', '1200')->first();

        if (!$arAccount) {
            return Inertia::render('Finance/Receivables', ['parties' => []]);
        }

        $parties = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('parties', 'journal_entries.party_id', '=', 'parties.id')
            ->where('journal_items.tenant_id', app('current.tenant')->id)
            ->where('journal_entries.tenant_id', app('current.tenant')->id)
            ->where('journal_items.account_id', $arAccount->id)
            ->selectRaw('
                parties.id,
                parties.name,
                parties.phone,
                parties.email,
                parties.type,
                COALESCE(SUM(journal_items.debit), 0) - COALESCE(SUM(journal_items.credit), 0) as balance
            ')
            ->groupBy('parties.id', 'parties.name', 'parties.phone', 'parties.email', 'parties.type')
            ->having('balance', '>', 0)
            ->orderByDesc('balance')
            ->get();

        return Inertia::render('Finance/Receivables', [
            'parties' => $parties
        ]);
    }

    public function payables()
    {
        // Query AP account (2000) balance per party — NEVER use parties.current_balance (stale cache).
        $apAccount = Account::where('code', '2000')->first();

        if (!$apAccount) {
            return Inertia::render('Finance/Payables', ['parties' => []]);
        }

        $parties = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('parties', 'journal_entries.party_id', '=', 'parties.id')
            ->where('journal_items.tenant_id', app('current.tenant')->id)
            ->where('journal_entries.tenant_id', app('current.tenant')->id)
            ->where('journal_items.account_id', $apAccount->id)
            ->selectRaw('
                parties.id,
                parties.name,
                parties.phone,
                parties.email,
                parties.type,
                COALESCE(SUM(journal_items.credit), 0) - COALESCE(SUM(journal_items.debit), 0) as balance
            ')
            ->groupBy('parties.id', 'parties.name', 'parties.phone', 'parties.email', 'parties.type')
            ->having('balance', '>', 0)
            ->orderByDesc('balance')
            ->get();

        return Inertia::render('Finance/Payables', [
            'parties' => $parties
        ]);
    }

    /**
     * Bank Accounts Management (Phase 1 - Unification)
     */
    public function bankAccounts()
    {
        $bankAccounts = BankAccount::with(['chequeBooks' => function ($q) {
            $q->withCount([
                'leaves as available_leaves_count' => fn ($sq) => $sq->where('status', 'available'),
                'leaves as issued_leaves_count' => fn ($sq) => $sq->where('status', 'issued'),
            ])->orderByDesc('created_at');
        }])->orderBy('name')->get()->map(function ($account) {
            // V3: Single source of truth — balance comes exclusively from journal_items
            $account->current_balance = $account->v3Balance();
            return $account;
        });

        // Calculate stats
        $totalBalance = $bankAccounts->sum('current_balance');
        $cashBalance = $bankAccounts->where('account_type', 'cash')->sum('current_balance');

        // Today's transactions
        $financeSvc = app(\App\Services\FinancialReportingService::class);
        $todayFlow = $financeSvc->getCashFlowReport(now()->startOfDay()->toDateString(), now()->endOfDay()->toDateString());
        $todayMovement = [
            'cash_in'  => $todayFlow['operating_inflow'],
            'cash_out' => $todayFlow['operating_outflow'],
        ];

        return Inertia::render('BankAccounts/BankAccountsList', [
            'bankAccounts' => $bankAccounts,
            'stats' => [
                'total_balance' => $totalBalance,
                'cash_balance' => $cashBalance,
                'today_in' => $todayMovement['cash_in'],
                'today_out' => $todayMovement['cash_out']
            ]
        ]);
    }

    public function storeBankAccount(Request $request)
    {
        $validated = $request->validate([
            'name'                      => 'required|string|max:255',
            'account_number'            => 'nullable|string|max:50',
            'bank_name'                 => 'nullable|string|max:255',
            'account_type'              => 'required|in:cash,checking,savings,credit',
            'opening_balance'           => 'nullable|numeric',
            'notes'                     => 'nullable|string',

            // Inline Cheque Book option
            'add_cheque_book'           => 'nullable|boolean',
            'cheque_book_prefix'        => 'nullable|string|max:10',
            'cheque_book_start_number'  => 'nullable|required_if:add_cheque_book,true|integer|min:1',
            'cheque_book_end_number'    => 'nullable|required_if:add_cheque_book,true|integer|min:1|gte:cheque_book_start_number',
            'cheque_book_padding_zeros' => 'nullable|integer|min:1|max:12',
            'cheque_book_notes'         => 'nullable|string|max:255',
        ]);

        $validated['current_balance'] = $validated['opening_balance'] ?? 0;
        $validated['type']            = $validated['account_type'] === 'cash' ? 'cash' : 'bank';

        $tenant = app('current.tenant');
        $bankAccount = null;
        $chequeBook = null;

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $tenant, $request, &$bankAccount, &$chequeBook) {
                $bankAccount = BankAccount::create($validated);

                if (!empty($validated['opening_balance']) && $validated['opening_balance'] > 0) {
                    $accountSvc  = resolve(\App\Engines\AccountingService::class);
                    $bankAcct    = \App\Models\Account::where('code', '1010')->firstOrCreate(
                        ['code' => '1010'],
                        ['name' => 'Bank Accounts', 'type' => 'asset', 'is_active' => true]
                    );
                    $capitalAcct = \App\Models\Account::where('code', '3000')->firstOrCreate(
                        ['code' => '3000'],
                        ['name' => "Owner's Capital", 'type' => 'equity', 'is_active' => true]
                    );

                    $accountSvc->createEntry(
                        data: [
                            'date'           => now()->format('Y-m-d'),
                            'reference_type' => 'bank_account_opening',
                            'reference'      => $bankAccount->id,
                            'description'    => 'Opening Balance: ' . $bankAccount->name,
                        ],
                        lines: [
                            ['account_id' => $bankAcct->id, 'debit' => $validated['opening_balance'], 'credit' => 0],
                            ['account_id' => $capitalAcct->id, 'debit' => 0, 'credit' => $validated['opening_balance']],
                        ]
                    );
                }

                if (!empty($validated['add_cheque_book']) && $validated['account_type'] !== 'cash') {
                    $chequeSvc = app(\App\Services\Cheque\ChequeBookService::class);
                    $chequeBook = $chequeSvc->createChequeBook(
                        tenant: $tenant,
                        bankAccountId: $bankAccount->id,
                        startNumber: (int) $validated['cheque_book_start_number'],
                        endNumber: (int) $validated['cheque_book_end_number'],
                        seriesPrefix: !empty($validated['cheque_book_prefix']) ? strtoupper(trim($validated['cheque_book_prefix'])) : null,
                        paddingZeros: (int) ($validated['cheque_book_padding_zeros'] ?? 6),
                        description: $validated['cheque_book_notes'] ?? "Initial Cheque Book for {$bankAccount->name}",
                        user: $request->user()
                    );
                }
            });

            $msg = 'Bank account created successfully';
            if ($chequeBook) {
                $msg .= " with Cheque Book ({$chequeBook->total_leaves} leaves registered).";
            }

            return response()->json([
                'success'     => true,
                'message'     => $msg,
                'bankAccount' => $bankAccount,
                'chequeBook'  => $chequeBook,
            ]);
        } catch (\InvalidArgumentException | \Illuminate\Validation\ValidationException $e) {
            $msg = $e instanceof \Illuminate\Validation\ValidationException
                ? collect($e->errors())->flatten()->first()
                : $e->getMessage();

            return response()->json([
                'success' => false,
                'message' => $msg,
                'errors'  => $e instanceof \Illuminate\Validation\ValidationException ? $e->errors() : ['cheque_book_start_number' => [$msg]],
            ], 422);
        }
    }

    public function updateBankAccount(Request $request, $id)
    {
        $bankAccount = BankAccount::findOrFail($id);

        $validated = $request->validate([
            'name'                      => 'required|string|max:255',
            'account_number'            => 'nullable|string|max:50',
            'bank_name'                 => 'nullable|string|max:255',
            'account_type'              => 'required|in:cash,checking,savings,credit',
            'opening_balance'           => 'nullable|numeric',
            'notes'                     => 'nullable|string',

            // Inline Cheque Book option
            'add_cheque_book'           => 'nullable|boolean',
            'cheque_book_prefix'        => 'nullable|string|max:10',
            'cheque_book_start_number'  => 'nullable|required_if:add_cheque_book,true|integer|min:1',
            'cheque_book_end_number'    => 'nullable|required_if:add_cheque_book,true|integer|min:1|gte:cheque_book_start_number',
            'cheque_book_padding_zeros' => 'nullable|integer|min:1|max:12',
            'cheque_book_notes'         => 'nullable|string|max:255',
        ]);

        $validated['type'] = $validated['account_type'] === 'cash' ? 'cash' : 'bank';

        // We store the difference to adjust the journal
        $oldOpening = $bankAccount->opening_balance ?? 0;
        $newOpening = $validated['opening_balance'] ?? 0;
        $diff = $newOpening - $oldOpening;

        $tenant = app('current.tenant');
        $chequeBook = null;

        \Illuminate\Support\Facades\DB::transaction(function () use ($bankAccount, $validated, $diff, $tenant, $request, &$chequeBook) {
            $bankAccount->update($validated);

            if ($diff != 0) {
                $accountSvc = resolve(\App\Engines\AccountingService::class);
                
                $bankAcct    = \App\Models\Account::where('code', '1010')->firstOrFail();
                $capitalAcct = \App\Models\Account::where('code', '3000')->firstOrCreate(
                    ['code' => '3000'],
                    ['name' => "Owner's Capital", 'type' => 'equity', 'is_active' => true]
                );

                // If diff > 0, we need to debit bank more. If diff < 0, we credit bank.
                $debitLine =  $diff > 0 ? ['account_id' => $bankAcct->id, 'debit' => abs($diff), 'credit' => 0] 
                                        : ['account_id' => $bankAcct->id, 'debit' => 0, 'credit' => abs($diff)];
                                        
                $creditLine = $diff > 0 ? ['account_id' => $capitalAcct->id, 'debit' => 0, 'credit' => abs($diff)] 
                                        : ['account_id' => $capitalAcct->id, 'debit' => abs($diff), 'credit' => 0];

                $accountSvc->createEntry(
                    data: [
                        'date'           => now()->format('Y-m-d'),
                        'reference_type' => 'bank_account_opening',
                        'reference'      => $bankAccount->id,
                        'description'    => 'Opening Balance Adjustment: ' . $bankAccount->name,
                    ],
                    lines: [$debitLine, $creditLine]
                );
            }

            if (!empty($validated['add_cheque_book']) && $validated['account_type'] !== 'cash') {
                $chequeSvc = app(\App\Services\Cheque\ChequeBookService::class);
                $chequeBook = $chequeSvc->createChequeBook(
                    tenant: $tenant,
                    bankAccountId: $bankAccount->id,
                    startNumber: (int) $validated['cheque_book_start_number'],
                    endNumber: (int) $validated['cheque_book_end_number'],
                    seriesPrefix: !empty($validated['cheque_book_prefix']) ? strtoupper(trim($validated['cheque_book_prefix'])) : null,
                    paddingZeros: (int) ($validated['cheque_book_padding_zeros'] ?? 6),
                    description: $validated['cheque_book_notes'] ?? "Additional Cheque Book for {$bankAccount->name}",
                    user: $request->user()
                );
            }
        });

        $msg = 'Bank account updated successfully';
        if ($chequeBook) {
            $msg .= " with new Cheque Book ({$chequeBook->total_leaves} leaves registered).";
        }

        return response()->json([
            'success'     => true,
            'message'     => $msg,
            'bankAccount' => $bankAccount->fresh(['chequeBooks']),
            'chequeBook'  => $chequeBook,
        ]);
    }

    public function destroyBankAccount($id)
    {
        $bankAccount = BankAccount::findOrFail($id);

        // Check if account has balance
        if ($bankAccount->v3Balance() != 0) {
            return response()->json([
                'message' => 'Cannot delete account with non-zero balance'
            ], 422);
        }

        $bankAccount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bank account deleted successfully'
        ]);
    }

    public function bankAccountTransactions($id)
    {
        $bankAccount = BankAccount::findOrFail($id);
        $bankAccount->current_balance = $bankAccount->v3Balance();

        // We must CAST(id AS CHAR) because fund_transactions.id is BIGINT, while expenses.id is UUID (char).
        // Mixing them in a UNION causes a 500 SQL Error (Illegal mix of collations or type mismatch).
        $fundIns = DB::table('fund_transactions')
            ->where('tenant_id', app('current.tenant')->id)
            ->where('to_account_id', $id)
            ->selectRaw("CAST(id AS CHAR) as id, DATE(created_at) as date, amount, reference_number as ref, 'credit' as type, 'fund_transfer' as source, CONCAT('Fund In: ', COALESCE(reason, '')) as description");

        $fundOuts = DB::table('fund_transactions')
            ->where('tenant_id', app('current.tenant')->id)
            ->where('from_account_id', $id)
            ->selectRaw("CAST(id AS CHAR) as id, DATE(created_at) as date, amount, reference_number as ref, 'debit' as type, 'fund_transfer' as source, CONCAT('Fund Out: ', COALESCE(reason, '')) as description");

        $expenses = DB::table('expenses')
            ->where('tenant_id', app('current.tenant')->id)
            ->where('expenses.bank_account_id', $id)
            ->selectRaw("expenses.id, expenses.date, expenses.amount, expenses.reference as ref, 'debit' as type, 'expense' as source, CONCAT('Expense: ', expenses.category) as description");

        // Restore payments logic with safe check just in case bank_account_id was not fully dropped from DB yet
        $hasBankAccount = \Illuminate\Support\Facades\Schema::hasColumn('payments', 'bank_account_id');
        
        $query = $fundIns->union($fundOuts)->union($expenses);
        
        if ($hasBankAccount) {
            $deposits = DB::table('payments')
                ->leftJoin('parties', 'payments.party_id', '=', 'parties.id')
                ->where('payments.tenant_id', app('current.tenant')->id)
                ->where('payments.bank_account_id', $id)
                ->whereIn('payments.type', ['in', 'received'])
                ->selectRaw("payments.id, payments.date, payments.amount, payments.reference as ref, 'credit' as type, 'payment' as source, CONCAT('Deposit from ', COALESCE(parties.name, 'Unknown')) as description");

            $withdrawals = DB::table('payments')
                ->leftJoin('parties', 'payments.party_id', '=', 'parties.id')
                ->where('payments.tenant_id', app('current.tenant')->id)
                ->where('payments.bank_account_id', $id)
                ->whereIn('payments.type', ['out', 'sent'])
                ->selectRaw("payments.id, payments.date, payments.amount, payments.reference as ref, 'debit' as type, 'payment' as source, CONCAT('Payment to ', COALESCE(parties.name, 'Unknown')) as description");
                
            $query = $query->union($deposits)->union($withdrawals);
        }

        $query = $query->orderBy('date', 'desc');

        $transactions = $query->paginate(50)->withQueryString();

        if (request()->wantsJson()) {
            return response()->json($transactions);
        }

        return Inertia::render('BankAccounts/Transactions', [
            'bankAccount' => $bankAccount,
            'transactions' => $transactions
        ]);
    }
}
