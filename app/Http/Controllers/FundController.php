<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\BankAccount;
use App\Models\FundTransaction;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class FundController extends Controller
{
    /**
     * Display the fund management page
     */
    public function index()
    {
        $cashAccount = Account::where('code', '1000')->first();
        $accountingSvc = resolve(\App\Services\V3\AccountingService::class);
        $cashBalance = (float) $accountingSvc->getBalance('1000');

        // Get all bank accounts
        $bankAccounts = BankAccount::query()->get()->map(function ($acc) {
            $accountType = $acc->account_type ?? $acc->type ?? 'bank';
            // CRITICAL: Check BOTH type and account_type columns to correctly
            // identify 'Cash in Hand' virtual accounts. Without this, the GL
            // cash balance (code 1000) gets double-counted in totalFunds.
            $isCash = ($accountType === 'cash') || ($acc->type === 'cash');
            return [
                'id'             => $acc->id,
                'name'           => $acc->bank_name ?? $acc->name,
                'account_number' => $acc->account_number,
                'type'           => $accountType,
                'balance'        => $isCash ? 0.0 : (float) $acc->v3Balance(),
                'is_cash'        => $isCash
            ];
        });

        // Get IDs of all monitored accounts (Cash + Banks)
        $accountIds = $bankAccounts->pluck('id')->push($cashAccount?->id)->filter();

        // ═══════════════════════════════════════════════════════
        // BUILD THE UNIFIED CASH STORY (Strict physical cash only)
        // ═══════════════════════════════════════════════════════
        $txCollection = collect();

        if ($cashAccount) {
            // 1. Ultimate Source: The General Ledger (Account 1000)
            // We fetch everything that touched this account to ensure 10 parity with "Cash Ledger"
            $glEntries = \App\Models\JournalItem::where('account_id', $cashAccount->id)
                ->with(['journalEntry.party'])
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.is_reversed', 0)
                ->select(
                    'journal_items.id as item_id',
                    'journal_items.journal_entry_id',
                    'journal_entries.id as entry_id',
                    'journal_entries.date',
                    'journal_entries.created_at as time',
                    'journal_entries.description',
                    'journal_entries.reference_type',
                    'journal_entries.reference as reference_id',
                    'journal_items.debit',
                    'journal_items.credit'
                )
                ->orderBy('journal_entries.date', 'desc')
                ->orderBy('journal_entries.created_at', 'desc')
                ->get();

            foreach ($glEntries as $item) {
                $isIn = (float)$item->debit > 0;
                $amt = (float)($isIn ? $item->debit : $item->credit);
                
            // Map Reference Type to our Filter Categories
            $refType = $item->reference_type;
            $desc = strtolower($item->description);
            $category = 'adjust'; // Default to adjust if unknown

            // 1. Sales Tab (In/Out)
            if (in_array($refType, ['sale', 'pos_sale', 'sale_return']) || str_contains($desc, 'sale #')) {
                $category = 'sale';
            } 
            // 2. Purchases Tab (In/Out)
            elseif (in_array($refType, ['purchase', 'purchase_payment', 'purchase_return']) || str_contains($desc, 'purchase #')) {
                $category = 'purchase';
            }
            // 3. Expenses Tab
            elseif ($refType === 'expense' || str_contains($desc, 'expense:')) {
                $category = 'expense';
            }
            // 4. Deposits Tab
            elseif ($refType === 'fund_add' || in_array($refType, ['payment_in', 'capital']) || str_contains($desc, 'capital') || str_contains($desc, 'added funds')) {
                $category = 'add';
            }
            // 5. Withdrawals Tab
            elseif ($refType === 'fund_remove' || in_array($refType, ['payment_out', 'withdrawal']) || str_contains($desc, 'withdrawal') || str_contains($desc, 'removed funds')) {
                $category = 'remove';
            }
            // 6. Transfers Tab
            elseif ($refType === 'fund_transfer' || str_contains($desc, 'transfer')) {
                $category = 'transfer';
            }
            // 7. Adjustments Tab
            elseif (in_array($refType, ['fund_adjust', 'adjustment']) || str_contains($desc, 'adjustment')) {
                $category = 'adjust';
            }

            // Special Labeling
            $reason = empty($item->description) ? 'Cash Transaction' : $item->description;
            if ($item->journalEntry && $item->journalEntry->party) {
                $reason .= ' (' . $item->journalEntry->party->name . ')';
            }

            $txCollection->push([
                'id' => 'gl-' . $item->item_id,
                'type' => $category,
                'amount' => $amt,
                'is_outgoing' => !$isIn,
                'reason' => $reason,
                'notes' => '',
                'reference' => $item->reference_id,
                'account_name' => 'Cash',
                'created_at' => \Carbon\Carbon::parse($item->time)->format('d M, Y h:i A'),
                'sort_date' => $item->time,
            ]);
        }

            // 2. Fallback: If Ledger is somehow empty or missing entries, we check Payments table
            if ($txCollection->isEmpty()) {
                $fallbackPmts = \App\Models\Payment::where('method', 'cash')
                    ->where('amount', '>', 0)
                    ->with(['sale', 'party'])
                    ->latest()
                    ->get();

                foreach ($fallbackPmts as $pmt) {
                    $isOut = $pmt->type === 'out';
                    $category = $pmt->sale_id ? 'sale' : 'payment';
                    $txCollection->push([
                        'id' => 'pmt-' . $pmt->id,
                        'type' => $category,
                        'amount' => (float)$pmt->amount,
                        'is_outgoing' => $isOut,
                        'reason' => ($isOut ? 'Payment Out: ' : 'Payment In: ') . ($pmt->sale ? $pmt->sale->reference_number : ($pmt->party ? $pmt->party->name : 'Manual Cash')),
                        'notes' => $pmt->notes ?? '',
                        'reference' => $pmt->reference ?? '',
                        'account_name' => 'Cash',
                        'created_at' => $pmt->created_at->format('d M, Y h:i A'),
                        'sort_date' => $pmt->created_at,
                    ]);
                }
            }
        }

        // Final sorting for the UI (Most recent first)
        $transactions = $txCollection->sortByDesc('sort_date')->values();

        // Total Liquidity Logic
        $totalBankBalances = $bankAccounts->where('is_cash', false)->sum('balance');
        $totalFunds = $cashBalance + $totalBankBalances;

        return Inertia::render('Funds/FundManagement', [
            'cashAccount' => [
                'code'    => '1000',
                'name'    => 'Cash in Hand',
                'balance' => $cashBalance
            ],
            'bankAccounts' => $bankAccounts->values(),
            'transactions' => $transactions,
            'totalFunds'   => $totalFunds,
            'stats' => [
                'total_funds' => (float) $totalFunds,
                'cash_on_hand' => (float) $cashBalance,
                'bank_total' => (float) $totalBankBalances,
            ]
        ]);
    }

    /**
     * Dedicated Cash History Ledger
     */
    public function history()
    {
        $accountingSvc = resolve(\App\Services\V3\AccountingService::class);
        $cashBalance = (float) $accountingSvc->getBalance('1000');

        // Fetch ALL journal items for account 1000
        $cashAccount = Account::where('code', '1000')->first();
        if (!$cashAccount) {
            return back()->with('error', 'Cash account not found.');
        }

        $ledger = \App\Models\JournalItem::where('account_id', $cashAccount->id)
            ->with(['journalEntry.party'])
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.is_reversed', 0)
            ->select(
                'journal_entries.id as entry_id',
                'journal_entries.date',
                'journal_entries.description',
                'journal_entries.reference_type',
                'journal_entries.reference as reference_id',
                'journal_items.debit',
                'journal_items.credit',
                'journal_items.id as item_id'
            )
            ->orderBy('journal_entries.date', 'desc')
            ->orderBy('journal_entries.created_at', 'desc')
            ->get()
            ->map(function($item) {
                // Determine User-Friendly Type
                $type = 'Transaction';
                $refType = $item->reference_type;
                
                if ($refType === 'sale') $type = 'Sale';
                if ($refType === 'pos_sale') $type = 'PoS Sale';
                if ($refType === 'purchase') $type = 'Purchase';
                if ($refType === 'expense') $type = 'Expense';
                if ($refType === 'fund_add') $type = 'Capital Add';
                if ($refType === 'fund_remove') $type = 'Withdrawal';
                if ($refType === 'fund_transfer') $type = 'Transfer';
                if ($refType === 'fund_adjust') $type = 'Adjustment';
                if ($refType === 'payment_in') $type = 'Payment-In';
                if ($refType === 'payment_out') $type = 'Payment-Out';
                if ($refType === 'sale_return') $type = 'Sale Return';
                if ($refType === 'purchase_return') $type = 'Purchase Return';

                // Resolve Name
                $name = 'Cash Transaction';
                if ($item->journalEntry->party) {
                    $name = $item->journalEntry->party->name;
                } elseif (str_contains($item->description, 'Sale #')) {
                    $name = 'Cash Sale';
                } elseif (str_contains($item->description, 'Capital')) {
                    $name = 'Owner Capital';
                }

                return [
                    'id' => $item->item_id,
                    'date' => Carbon::parse($item->date)->format('d/m/Y, h:i A'),
                    'type' => $type,
                    'name' => $name,
                    'mode' => $item->debit > 0 ? 'in' : 'out',
                    'amount' => (float) ($item->debit > 0 ? $item->debit : $item->credit),
                    'description' => $item->description,
                ];
            });

        return Inertia::render('Funds/CashHistory', [
            'balance' => $cashBalance,
            'ledger' => $ledger
        ]);
    }

    /**
     * Add funds to an account (Owner Capital Injection)
     */
    public function addFunds(Request $request)
    {
        $request->validate([
            'account_type' => 'required|in:cash,bank',
            'bank_account_id' => 'required_if:account_type,bank|nullable|exists:bank_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $amount = (float) $request->amount;
            $accountingSvc = resolve(\App\Services\V3\AccountingService::class);

            if ($request->account_type === 'cash') {
                // Add to Cash Account (GL 1000)
                $account = Account::where('code', '1000')->first();
                if (!$account) {
                    throw new \Exception('Cash account not found. Please set up Chart of Accounts.');
                }

                // V3: Use journal balance
                $balanceBefore = (float) resolve(\App\Services\V3\AccountingService::class)->getBalance('1000');
                
                $cashBank = BankAccount::where('account_type', 'cash')->first();
                $toAccountId = $cashBank ? $cashBank->id : null;
                $balanceAfter = $balanceBefore + $amount;
            } else {
                // Add to Bank Account
                $bankAccount = BankAccount::findOrFail($request->bank_account_id);
                // V3: Use journal balance
                $balanceBefore = (float) $bankAccount->v3Balance();
                $toAccountId = $bankAccount->id;
                $balanceAfter = $balanceBefore + $amount;
            }

            // Record the fund transaction
            $fundTransaction = FundTransaction::create([
                'type' => 'add',
                'to_account_id' => $toAccountId,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'reference_number' => 'ADD-' . date('Ymd') . '-' . rand(1000, 9999),
                'performed_by' => Auth::id(),
            ]);

            \App\Models\Activity::create([
                'type' => 'payment_in',
                'description' => 'Added funds: ' . $request->reason,
                'amount' => $amount,
                'reference_id' => $request->account_type === 'cash' ? 'cash' : $request->bank_account_id,
                'reference_type' => 'fund_transaction',
                'user_id' => Auth::id(),
            ]);

            // V3: Use AccountingService instead of raw createJournalEntry helper
            $debitCode  = $request->account_type === 'cash' ? '1000' : '1010';
            $debitAcct  = \App\Models\Account::where('code', $debitCode)->firstOrFail();
            $creditAcct = \App\Models\Account::where('code', '3000')->firstOrCreate(
                ['code' => '3000'],
                ['name' => "Owner's Capital", 'type' => 'equity', 'is_active' => true]
            );
            
            // For Bank transactions, reference must be the bank_account_id for v3Balance() to find it
            $journalRef = $request->account_type === 'bank' ? $request->bank_account_id : $fundTransaction->id;

            app(\App\Services\V3\AccountingService::class)->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'fund_add',
                'reference'   => $journalRef,
                'description'    => 'Owner Capital — ' . $request->reason,
                'party_id'       => null,
            ], [
                ['account_id' => $debitAcct->id,  'debit' => $amount, 'credit' => 0],
                ['account_id' => $creditAcct->id, 'debit' => 0, 'credit' => $amount],
            ]);

            DB::commit();

            return back()->with('success', 'Funds added successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to add funds: ' . $e->getMessage());
        }
    }

    /**
     * Remove funds from an account (Owner Withdrawal)
     */
    public function removeFunds(Request $request)
    {
        $request->validate([
            'account_type' => 'required|in:cash,bank',
            'bank_account_id' => 'required_if:account_type,bank|nullable|exists:bank_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $amount = (float) $request->amount;
            $accountingSvc = resolve(\App\Services\V3\AccountingService::class);

            if ($request->account_type === 'cash') {
                $account = Account::where('code', '1000')->first();
                if (!$account) {
                    throw new \Exception('Cash account not found.');
                }

                // V3: Get current balance from journal
                $balanceBefore = (float) resolve(\App\Services\V3\AccountingService::class)->getBalance('1000');
                
                if ($balanceBefore < $amount) {
                    throw new \Exception('Insufficient cash balance. Current: Rs ' . number_format($balanceBefore, 2));
                }

                // Legacy support
                $account->balance = $balanceBefore - $amount;
                $account->save();

                $cashBank = BankAccount::where('account_type', 'cash')->first();
                $fromAccountId = $cashBank ? $cashBank->id : null;
                $balanceAfter = $balanceBefore - $amount;
            } else {
                $bankAccount = BankAccount::findOrFail($request->bank_account_id);
                // V3: Get current balance from journal
                $balanceBefore = (float) $bankAccount->v3Balance();
                
                if ($balanceBefore < $amount) {
                    throw new \Exception('Insufficient bank balance. Current: Rs ' . number_format($balanceBefore, 2));
                }

                // Legacy support
                $bankAccount->current_balance = $balanceBefore - $amount;
                $bankAccount->save();
                $fromAccountId = $bankAccount->id;
                $balanceAfter = $balanceBefore - $amount;
            }

            $fundTransaction = FundTransaction::create([
                'type' => 'remove',
                'from_account_id' => $fromAccountId,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'reference_number' => 'REM-' . date('Ymd') . '-' . rand(1000, 9999),
                'performed_by' => Auth::id(),
            ]);

            \App\Models\Activity::create([
                'type' => 'payment_out',
                'description' => 'Removed funds: ' . $request->reason,
                'amount' => $amount,
                'reference_id' => $request->account_type === 'cash' ? 'cash' : $request->bank_account_id,
                'reference_type' => 'fund_transaction',
                'user_id' => Auth::id(),
            ]);

            // V3: Use AccountingService
            $creditCode  = $request->account_type === 'cash' ? '1000' : '1010';
            $creditAcct  = \App\Models\Account::where('code', $creditCode)->firstOrFail();
            $drawingsAcct = \App\Models\Account::where('code', '3100')->firstOrCreate(
                ['code' => '3100'],
                ['name' => "Owner's Drawings", 'type' => 'equity', 'is_active' => true]
            );

            // For Bank transactions, reference must be the bank_account_id for v3Balance() to find it
            $journalRef = $request->account_type === 'bank' ? $request->bank_account_id : $fundTransaction->id;

            app(\App\Services\V3\AccountingService::class)->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'fund_remove',
                'reference'   => $journalRef,
                'description'    => 'Owner Withdrawal — ' . $request->reason,
                'party_id'       => null,
            ], [
                ['account_id' => $drawingsAcct->id, 'debit' => $amount, 'credit' => 0],
                ['account_id' => $creditAcct->id,   'debit' => 0, 'credit' => $amount],
            ]);

            DB::commit();

            return back()->with('success', 'Funds removed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to remove funds: ' . $e->getMessage());
        }
    }

    /**
     * Transfer funds between accounts
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'from_type' => 'required|in:cash,bank',
            'from_bank_id' => 'required_if:from_type,bank|nullable|exists:bank_accounts,id',
            'to_type' => 'required|in:cash,bank',
            'to_bank_id' => 'required_if:to_type,bank|nullable|exists:bank_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
        ]);

        // Prevent same account transfer
        if ($request->from_type === $request->to_type) {
            if ($request->from_type === 'cash') {
                return back()->with('error', 'Cannot transfer from cash to cash.');
            }
            if ($request->from_bank_id === $request->to_bank_id) {
                return back()->with('error', 'Cannot transfer to the same account.');
            }
        }

        DB::beginTransaction();
        try {
            $amount = (float) $request->amount;
            $accountingSvc = resolve(\App\Services\V3\AccountingService::class);

            // Deduct from source
            if ($request->from_type === 'cash') {
                $fromAccount = Account::where('code', '1000')->first();
                $fromBalanceBefore = (float) $accountingSvc->getBalance('1000');
                if ($fromBalanceBefore < $amount) {
                    throw new \Exception("Insufficient cash balance. (Current: Rs " . number_format($fromBalanceBefore) . ")");
                }
                
                $cashBank = \App\Models\BankAccount::where('account_type', 'cash')->first();
                $fromAccountId = $cashBank ? $cashBank->id : null;
                $fromName = 'Cash';
            } else {
                $fromBankAccount = BankAccount::findOrFail($request->from_bank_id);
                $fromBalanceBefore = (float) $fromBankAccount->v3Balance();
                if ($fromBalanceBefore < $amount) {
                    throw new \Exception("Insufficient bank balance. (Current: Rs " . number_format($fromBalanceBefore) . ")");
                }
                $fromAccountId = $fromBankAccount->id;
                $fromName = $fromBankAccount->bank_name ?? $fromBankAccount->name;
            }

            // Add to destination
            if ($request->to_type === 'cash') {
                $toAccount = Account::where('code', '1000')->first();
                $toBalanceBefore = (float) $accountingSvc->getBalance('1000');
                
                $cashBank = \App\Models\BankAccount::where('account_type', 'cash')->first();
                $toAccountId = $cashBank ? $cashBank->id : null;
                $toName = 'Cash';
            } else {
                $toBankAccount = BankAccount::findOrFail($request->to_bank_id);
                $toBalanceBefore = (float) $toBankAccount->v3Balance();
                $toAccountId = $toBankAccount->id;
                $toName = $toBankAccount->bank_name ?? $toBankAccount->name;
            }

            $fundTx = FundTransaction::create([
                'type' => 'transfer',
                'from_account_id' => $fromAccountId,
                'to_account_id' => $toAccountId,
                'amount' => $amount,
                'balance_before' => $fromBalanceBefore,
                'balance_after' => $fromBalanceBefore - $amount,
                'reason' => $request->reason ?? "Transfer from {$fromName} to {$toName}",
                'reference_number' => 'TRF-' . date('Ymd') . '-' . rand(1000, 9999),
                'performed_by' => Auth::id(),
            ]);

            // V3: Post the transfer journal
            $fromCode = $request->from_type === 'cash' ? '1000' : '1010';
            $toCode   = $request->to_type   === 'cash' ? '1000' : '1010';
            $fromAcct = \App\Models\Account::where('code', $fromCode)->firstOrFail();
            $toAcct   = \App\Models\Account::where('code', $toCode)->firstOrFail();
            // For transfers involving a bank, we use that bank as reference.
            // If it's a bank-to-bank transfer, the 'To' bank's reference takes priority for identification.
            $journalRef = $fundTx->id;
            if ($request->to_type === 'bank') $journalRef = $request->to_bank_id;
            elseif ($request->from_type === 'bank') $journalRef = $request->from_bank_id;

            app(\App\Services\V3\AccountingService::class)->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'fund_transfer',
                'reference'   => $journalRef,
                'description'    => "Transfer: {$fromName} → {$toName}",
                'party_id'       => null,
            ], [
                ['account_id' => $toAcct->id,   'debit' => $amount, 'credit' => 0],
                ['account_id' => $fromAcct->id, 'debit' => 0, 'credit' => $amount],
            ]);

            DB::commit();

            return back()->with('success', "Transferred Rs {$amount} from {$fromName} to {$toName}!");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Transfer failed: ' . $e->getMessage());
        }
    }

    /**
     * Adjust account balance (for corrections)
     */
    /**
     * Adjust account balance (for corrections)
     */
    public function adjust(Request $request)
    {
        $request->validate([
            'account_type' => 'required|in:cash,bank',
            'bank_account_id' => 'required_if:account_type,bank|nullable|exists:bank_accounts,id',
            'new_balance' => 'required|numeric|min:0',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $newBalance = (float) $request->new_balance;
            $accountingSvc = resolve(\App\Services\V3\AccountingService::class);

            if ($request->account_type === 'cash') {
                $account = Account::where('code', '1000')->first();
                if (!$account) {
                    throw new \Exception('Cash account not found.');
                }
                
                // V3: Get current balance from journal
                $balanceBefore = (float) $accountingSvc->getBalance('1000');
                
                // Legacy support (optional: keep row in sync if needed, but truth is journal)
                $account->balance = $newBalance;
                $account->save();
                
                $cashBank = BankAccount::where('account_type', 'cash')->first();
                $accountId = $cashBank ? $cashBank->id : null;
            } else {
                $bankAccount = BankAccount::findOrFail($request->bank_account_id);
                // V3: Get current balance from journal/v3Balance
                $balanceBefore = (float) $bankAccount->v3Balance();
                
                // Legacy support
                $bankAccount->current_balance = $newBalance;
                $bankAccount->save();
                $accountId = $bankAccount->id;
            }

            $difference = $newBalance - $balanceBefore;

            // Record the fund transaction
            $fundTx = FundTransaction::create([
                'type' => 'adjust',
                'from_account_id' => $difference < 0 ? $accountId : null,
                'to_account_id' => $difference > 0 ? $accountId : null,
                'amount' => abs($difference),
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'reference_number' => 'ADJ-' . date('Ymd') . '-' . rand(1000, 9999),
                'performed_by' => Auth::id(),
            ]);

            // V3: Post adjustment journal if there is a difference
            if (abs($difference) > 0.001) {
                // Determine account code (1000 for cash, 1010 for bank)
                $adjCode = $request->account_type === 'cash' ? '1000' : '1010';
                $adjAcct = \App\Models\Account::where('code', $adjCode)->firstOrFail();
                $suspenseAcct = \App\Models\Account::where('code', '9000')->firstOrCreate(
                    ['code' => '9000'],
                    ['name' => 'Suspense / Adjustment', 'type' => 'equity', 'is_active' => true]
                );

                $accountingSvc->createEntry([
                    'date'           => now()->toDateString(),
                    'reference_type' => 'fund_adjust',
                    'reference'      => $accountId ?? $fundTx->id, // If bank, must use accountId for v3Balance to find it!
                    'description'    => 'Balance Adjustment — ' . $request->reason,
                    'party_id'       => null,
                ], $difference > 0 ? [
                    ['account_id' => $adjAcct->id,      'debit' => $difference, 'credit' => 0],
                    ['account_id' => $suspenseAcct->id, 'debit' => 0, 'credit' => $difference],
                ] : [
                    ['account_id' => $suspenseAcct->id, 'debit' => abs($difference), 'credit' => 0],
                    ['account_id' => $adjAcct->id,      'debit' => 0, 'credit' => abs($difference)],
                ]);
            }

            DB::commit();

            $changeText = $difference >= 0 ? '+Rs ' . number_format($difference, 2) : '-Rs ' . number_format(abs($difference), 2);
            return back()->with('success', "Balance adjusted ({$changeText}) to Rs " . number_format($newBalance, 2));
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Adjustment failed: ' . $e->getMessage());
        }
    }

    /**
     * Get cash transactions for the last N days (for AI reconciliation)
     */
    public function getCashHistory(Request $request)
    {
        $days = $request->get('days', 7);
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        $cashAccount = Account::where('code', '1000')->first();
        if (!$cashAccount) {
            return response()->json(['transactions' => [], 'balance' => 0]);
        }

        $transactions = $cashAccount->journalItems()
            ->with('journalEntry')
            ->where('created_at', '>=', $startDate)
            ->latest()
            ->take(50)
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->journalEntry->date,
                    'description' => $item->journalEntry->description,
                    'amount' => $item->debit > 0 ? (float) $item->debit : -(float) $item->credit,
                    'type' => $item->debit > 0 ? 'in' : 'out',
                ];
            });

        $accountingSvc = resolve(\App\Services\V3\AccountingService::class);
        return response()->json([
            'transactions' => $transactions,
            'balance' => (float) $accountingSvc->getBalance('1000')
        ]);
    }

    /**
     * Helper to create journal entries
     * @deprecated Use app(\App\Services\V3\AccountingService::class)->createEntry() instead
     */
    private function createJournalEntry($description, $debitAccountCode, $creditAccountCode, $amount, $reference = null)
    {
        $debitAccount = $debitAccountCode ? Account::where('code', $debitAccountCode)->first() : null;
        $creditAccount = $creditAccountCode ? Account::where('code', $creditAccountCode)->first() : null;

        if (!$debitAccount && !$creditAccount) {
            return; // Skip if no valid accounts
        }

        $journalEntry = JournalEntry::create([
            'date' => now(),
            'description' => $description . ($reference ? " - {$reference}" : ''),
            'reference' => $reference,
            'user_id' => Auth::id(),
        ]);

        if ($debitAccount) {
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $debitAccount->id,
                'debit' => $amount,
                'credit' => 0,
            ]);
        }

        if ($creditAccount) {
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $creditAccount->id,
                'debit' => 0,
                'credit' => $amount,
            ]);
        }
    }
}
