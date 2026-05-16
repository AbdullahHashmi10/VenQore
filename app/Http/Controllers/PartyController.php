<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PartyController extends Controller
{
    public function search(Request $request)
    {
        $query = Party::query();

        // Check input first, then route parameter (for defaults)
        $type = $request->input('type') ?? $request->route('type');

        if ($type && $type !== 'all') {
            $query->where('type', $type);
        }

        $searchTerm = $request->input('search') ?? $request->input('query');
        if ($searchTerm) {
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                    ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }

        $limit = $request->search ? 20 : 50;
        $parties = $query->orderBy('name')->limit($limit)->get();

        // Enrich with V3 balances so search dropdowns can show live balance
        $arAccount = \App\Models\Account::where('code', '1200')->value('id');
        $apAccount = \App\Models\Account::where('code', '2000')->value('id');

        $parties = $parties->map(function ($party) use ($arAccount, $apAccount) {
            $netAR = (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $party->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $arAccount)
                ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
                ->value('balance') ?? 0;

            $netAP = (float) DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $party->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
                ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
                ->value('balance') ?? 0;

            $balance = $netAR - $netAP;

            if (round(abs($balance), 2) < 0.01) {
                $direction = 'Settled';
            } elseif ($party->type === 'customer') {
                $direction = $balance > 0 ? 'To Receive' : 'To Pay';
            } else {
                $direction = $balance > 0 ? 'To Receive' : 'To Pay';
            }

            $party->current_balance = (float)($party->type === 'customer' ? $balance : -$balance);
            $party->balance_direction = $direction;
            return $party;
        });

        return response()->json($parties);
    }

    public function index(Request $request)
    {
        $arAccount = \App\Models\Account::where('code', '1200')->value('id');
        $apAccount = \App\Models\Account::where('code', '2000')->value('id');

        $query = Party::query()
            ->select('parties.*')
            ->selectSub(function($q) use ($arAccount) {
                $q->from('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->whereColumn('journal_entries.party_id', 'parties.id')
                    ->where('journal_entries.is_reversed', 0)
                    ->where('journal_items.account_id', $arAccount)
                    ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0)');
            }, 'net_ar')
            ->selectSub(function($q) use ($apAccount) {
                $q->from('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->whereColumn('journal_entries.party_id', 'parties.id')
                    ->where('journal_entries.is_reversed', 0)
                    ->where('journal_items.account_id', $apAccount)
                    ->selectRaw('COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0)');
            }, 'net_ap');

        // Apply Filters
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // Apply Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');

        if ($sortBy === 'balance') {
            // Sort by absolute net position Since UI shows Absolute values
            $query->orderByRaw('ABS(COALESCE(net_ar,0) - COALESCE(net_ap,0)) ' . $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $tid = app('current.tenant')->id;
        $receivables = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_entries.tenant_id', $tid)
            ->where('accounts.code', '1200')
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
            ->value('net');

        $payables = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_entries.tenant_id', $tid)
            ->where('accounts.code', '2000')
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0) as net')
            ->value('net');

        $stats = [
            'total'       => Party::count(),
            'customers'   => Party::where('type', 'customer')->count(),
            'suppliers'   => Party::where('type', 'supplier')->count(),
            'receivables' => max(0, $receivables),
            'payables'    => max(0, $payables),
        ];

        $parties = $query->paginate(200)->withQueryString();

        $arAccount = \App\Models\Account::where('code', '1200')->value('id');
        $apAccount = \App\Models\Account::where('code', '2000')->value('id');

        $parties->getCollection()->transform(function($party) use ($arAccount, $apAccount) {
            // Net AR position (Asset: +Dr, -Cr)
            $netAR = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $party->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $arAccount)
                ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
                ->value('balance') ?? 0;

            // Net AP position (Liability: +Cr, -Dr)
            $netAP = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.party_id', $party->id)
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
                ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
                ->value('balance') ?? 0;
            
            // Final Asset Position (Positive means THEY owe US)
            $party->balance = (float)$netAR - (float)$netAP;

            // Direction label (For React logic)
            if (round(abs($party->balance), 2) < 0.01) {
                $party->balance_direction = 'Settled';
            } elseif ($party->type === 'customer') {
                $party->balance_direction = $party->balance > 0 ? 'To Receive' : 'To Pay';
            } else {
                // For Suppliers: balance > 0 usually means we overpaid (Asset), 
                // but the DB value we calculated is (AR - AP).
                // If AR is 1000 and AP is 0 -> balance = 1000 -> we are To Receive.
                // If AR is 0 and AP is 1000 -> balance = -1000 -> we are To Pay.
                $party->balance_direction = $party->balance > 0 ? 'To Receive' : 'To Pay';
            }

            // Sync with React expectations: 
            // Customers: Positive balance = To Receive (Asset)
            // Suppliers: Positive balance = To Pay (Liability) 
            // Since we use the same formula (AR - AP) for both, we need to flip the sign for Suppliers
            // so a "Payable" (negative Asset) becomes a positive Liability for React.
            $party->current_balance = $party->type === 'customer' ? $party->balance : -$party->balance;
            
            return $party;
        });

        if ($request->wantsJson()) {
            return response()->json($parties);
        }

        return Inertia::render('Parties/PartiesList', [
            'parties' => $parties,
            'stats'   => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'type' => 'required|in:customer,supplier',
            'opening_balance' => 'nullable|numeric',
            'credit_limit' => 'nullable|numeric',
            'payment_terms' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'opening_balance_type' => 'required|in:receivable,payable',
            'default_discount' => 'nullable|numeric|between:0,100'
        ]);

        $ob = floatval($validated['opening_balance'] ?? 0);
        $validated['current_balance'] = $validated['opening_balance_type'] === 'receivable' ? abs($ob) : -abs($ob);

        // For suppliers, 'payable' is positive balance, 'receivable' is negative balance
        if ($validated['type'] === 'supplier') {
            $validated['current_balance'] = -$validated['current_balance'];
        }

        $party = DB::transaction(function() use ($validated, $ob) {
            $party = Party::create($validated);

            if ($ob > 0) {
                $accountSvc = resolve(\App\Services\V3\AccountingService::class);
                $historicalAcct = \App\Models\Account::where('code', '7000')->firstOrCreate(
                    ['code' => '7000'],
                    ['name' => 'Historical Balances', 'type' => 'equity', 'is_active' => true]
                );

                $isCustomer = $validated['type'] === 'customer';
                $isReceivable = $validated['opening_balance_type'] === 'receivable';

                $tradeAcctId = \App\Models\Account::where('code', $isCustomer ? '1200' : '2000')->value('id');

                if ($isReceivable) {
                    // We are owed money
                    $lines = [
                        ['account_id' => $tradeAcctId, 'debit' => $ob, 'credit' => 0, 'party_id' => $party->id],
                        ['account_id' => $historicalAcct->id, 'debit' => 0, 'credit' => $ob, 'party_id' => $party->id],
                    ];
                } else {
                    // We owe money
                    $lines = [
                        ['account_id' => $tradeAcctId, 'debit' => 0, 'credit' => $ob, 'party_id' => $party->id],
                        ['account_id' => $historicalAcct->id, 'debit' => $ob, 'credit' => 0, 'party_id' => $party->id],
                    ];
                }

                $accountSvc->createEntry([
                    'date'     => now()->format('Y-m-d'),
                    'reference_type' => 'opening_balance_migration',
                    'reference'   => $party->id,
                    'party_id'       => $party->id,
                    'description'    => 'Opening Balance: ' . $party->name,
                    'created_by'     => auth()->id(),
                ], $lines);
            }
            return $party;
        });

        // Sync with Suppliers table if type is supplier
        if ($validated['type'] === 'supplier') {
            \App\Models\Supplier::create([
                'name' => $party->name,
                'email' => $party->email,
                'phone' => $party->phone,
                'address' => $party->address,
                'notes' => $party->notes,
                'party_id' => $party->id
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Party created successfully',
            'party' => $party
        ]);
    }

    public function update(Request $request, $id)
    {
        $party = Party::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'type' => 'required|in:customer,supplier',
            'opening_balance' => 'nullable|numeric',
            'credit_limit' => 'nullable|numeric',
            'payment_terms' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'opening_balance_type' => 'required|in:receivable,payable',
            'default_discount' => 'nullable|numeric|between:0,100'
        ]);

        // Handle current_balance recalculation
        $ob = floatval($validated['opening_balance'] ?? 0);
        $new_ob_val = $validated['opening_balance_type'] === 'receivable' ? abs($ob) : -abs($ob);
        if ($validated['type'] === 'supplier') {
            $new_ob_val = -$new_ob_val;
        }

        $old_ob = floatval($party->opening_balance ?? 0);
        $old_ob_val = $party->opening_balance_type === 'receivable' ? abs($old_ob) : -abs($old_ob);
        if ($party->type === 'supplier') {
            $old_ob_val = -$old_ob_val;
        }

        $new_current_balance = $party->current_balance;
        if ($party->type !== $validated['type']) {
            $new_current_balance = -$new_current_balance;
        }
        
        $new_current_balance = $new_current_balance - $old_ob_val + $new_ob_val;
        // $validated['current_balance'] = $new_current_balance;
        
        $changedOB = ($ob != $old_ob) || ($validated['opening_balance_type'] !== $party->opening_balance_type) || ($validated['type'] !== $party->type);

        DB::transaction(function() use ($party, $validated, $changedOB, $ob) {
            $party->update($validated);
            
            if ($changedOB) {
                $accountSvc = resolve(\App\Services\V3\AccountingService::class);
    
                // Step 1: Find and reverse existing opening balance entries for this party
                $oldEntries = \App\Models\JournalEntry::where('reference_type', 'opening_balance_migration')
                    ->where('reference', $party->id)
                    ->where('is_reversed', 0)
                    ->get();
    
                foreach ($oldEntries as $oldE) {
                    $accountSvc->reverseEntry($oldE->id, 'Opening balance altered during party update');
                }
    
                // Step 2: Create new opening balance entry if > 0
                if ($ob > 0) {
                    $historicalAcct = \App\Models\Account::where('code', '7000')->firstOrCreate(
                        ['code' => '7000'],
                        ['name' => 'Historical Balances', 'type' => 'equity', 'is_active' => true]
                    );
    
                    $isCustomer = $validated['type'] === 'customer';
                    $isReceivable = $validated['opening_balance_type'] === 'receivable';
    
                    $tradeAcctId = \App\Models\Account::where('code', $isCustomer ? '1200' : '2000')->value('id');
    
                    if ($isReceivable) {
                        $lines = [
                            ['account_id' => $tradeAcctId, 'debit' => $ob, 'credit' => 0, 'party_id' => $party->id],
                            ['account_id' => $historicalAcct->id, 'debit' => 0, 'credit' => $ob, 'party_id' => $party->id],
                        ];
                    } else {
                        $lines = [
                            ['account_id' => $tradeAcctId, 'debit' => 0, 'credit' => $ob, 'party_id' => $party->id],
                            ['account_id' => $historicalAcct->id, 'debit' => $ob, 'credit' => 0, 'party_id' => $party->id],
                        ];
                    }
    
                    $accountSvc->createEntry([
                        'date'     => now()->format('Y-m-d'),
                        'reference_type' => 'opening_balance_migration',
                        'reference'   => $party->id,
                        'party_id'       => $party->id,
                        'description'    => 'Opening Balance Updated: ' . $party->name,
                        'created_by'     => auth()->id(),
                    ], $lines);
                }
            }
        });

        // Sync with Suppliers table if type is supplier
        if ($validated['type'] === 'supplier') {
            $supplier = \App\Models\Supplier::withTrashed()->where('party_id', $party->id)->first();
            if ($supplier) {
                if ($supplier->trashed()) {
                    $supplier->restore();
                }
                if (
                    $supplier->name !== $party->name ||
                    $supplier->email !== $party->email ||
                    $supplier->phone !== $party->phone ||
                    $supplier->address !== $party->address ||
                    $supplier->notes !== $party->notes
                ) {
                    $supplier->update([
                        'name' => $party->name,
                        'email' => $party->email,
                        'phone' => $party->phone,
                        'address' => $party->address,
                        'notes' => $party->notes,
                    ]);
                }
            } else {
                // Auto-heal: Create missing supplier record
                \App\Models\Supplier::create([
                    'name' => $party->name,
                    'email' => $party->email,
                    'phone' => $party->phone,
                    'address' => $party->address,
                    'notes' => $party->notes,
                    'party_id' => $party->id
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Party updated successfully',
            'party' => $party
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $party = Party::findOrFail($id);

        // Check if party has transactions
        $arAccount = \App\Models\Account::where('code', '1200')->value('id');
        $apAccount = \App\Models\Account::where('code', '2000')->value('id');

        $journalBalance = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('journal_items.account_id', array_filter([$arAccount, $apAccount]))
            ->where('journal_entries.party_id', $party->id)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
            ->value('net');

        if (round(abs($journalBalance), 2) > 0) {
            $passcode = $request->input('passcode');
            
            if (!$passcode) {
                return response()->json([
                    'requires_passcode' => true,
                    'message' => 'Cannot delete party with non-zero balance. Manager or Admin passcode required.'
                ], 422);
            }

            // Verify passcode
            $valid = false;
            
            // 1. Check if the provided passcode belongs to any user with manager, admin, or platform_admin role
            $userWithPasscode = \App\Models\User::whereIn('role', ['manager', 'admin', 'platform_admin'])->get()->filter(function ($u) use ($passcode) {
                return \Illuminate\Support\Facades\Hash::check($passcode, $u->passcode);
            })->first();

            if ($userWithPasscode) {
                $valid = true;
            }

            // 2. Fallback to global admin_passcode setting
            if (!$valid) {
                $adminPasscode = \App\Models\Setting::where('key', 'admin_passcode')->value('value');
                if ($adminPasscode && $passcode === $adminPasscode) {
                    $valid = true;
                }
            }

            if (!$valid) {
                return response()->json([
                    'message' => 'Invalid passcode provided or insufficient privileges.'
                ], 403);
            }
        }

        $party->delete();

        return response()->json([
            'success' => true,
            'message' => 'Party deleted successfully'
        ]);
    }

    public function ledger($id)
    {
        $party = Party::findOrFail($id);

        $arAccount = \App\Models\Account::where('code', '1200')->first();
        $apAccount = \App\Models\Account::where('code', '2000')->first();

        // Determine which account to use based on party type
        $accountId = ($party->type === 'supplier')
            ? ($apAccount ? $apAccount->id : null)
            : ($arAccount ? $arAccount->id : null);

        $transactions = collect();
        $runningBalance = 0;

        if ($accountId) {
            $rows = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_items.account_id', $accountId)
                ->where('journal_entries.party_id', $id)
                ->where('journal_entries.is_reversed', 0)
                ->select(
                    'journal_entries.date',
                    'journal_entries.reference as reference',
                    'journal_entries.description as description',
                    'journal_items.debit',
                    'journal_items.credit'
                )
                ->orderBy('journal_entries.date', 'asc')
                ->orderBy('journal_entries.id', 'asc')
                ->get();

            $transactions = $rows->map(function ($r) use (&$runningBalance) {
                $runningBalance += ($r->debit - $r->credit);
                return (object)[
                    'date'        => $r->date,
                    'type'        => $r->debit > 0 ? 'Debit' : 'Credit',
                    'reference'   => $r->reference ?? 'Journal',
                    'description' => $r->description ?? 'Journal Entry',
                    'debit'       => (float) $r->debit,
                    'credit'      => (float) $r->credit,
                    'balance'     => $runningBalance,
                ];
            });
        }

        $transactions = $transactions->reverse()->values();

        $stats = [
            'opening_balance' => 0, // V3 source of truth removes denormalized opening_balance column
            'total_debit' => $transactions->sum('debit'),
            'total_credit' => $transactions->sum('credit'),
            'final_balance' => $runningBalance
        ];

        return Inertia::render('Parties/Ledger', [
            'party' => $party,
            'transactions' => $transactions,
            'stats' => $stats
        ]);
    }
}
