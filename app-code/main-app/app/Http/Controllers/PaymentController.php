<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Party;
use App\Models\BankAccount;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with('party');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('party', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        } elseif ($request->filled('filter')) {
            switch ($request->filter) {
                case 'today':
                    $query->whereDate('date', Carbon::today());
                    break;
                case 'month':
                    $query->whereMonth('date', Carbon::now()->month)
                          ->whereYear('date', Carbon::now()->year);
                    break;
            }
        }

        $payments = $query->orderBy('date', 'desc')->paginate(50);

        if ($request->wantsJson()) {
            return response()->json($payments);
        }

        $today = Carbon::today();

        // Normalise legacy type values in DB (one-time safe)
        Payment::where('type', 'received')->update(['type' => 'in']);
        Payment::where('type', 'sent')->update(['type' => 'out']);
        DB::statement('UPDATE payments SET date = DATE(created_at) WHERE sale_id IS NOT NULL AND date != DATE(created_at)');

        $stats = [
            'today_in'  => Payment::where('type', 'in')->whereDate('date', $today)->sum('amount'),
            'today_out' => Payment::where('type', 'out')->whereDate('date', $today)->sum('amount'),
            'month_in'  => Payment::where('type', 'in')->whereMonth('date', $today->month)->whereYear('date', $today->year)->sum('amount'),
            'month_out' => Payment::where('type', 'out')->whereMonth('date', $today->month)->whereYear('date', $today->year)->sum('amount'),
        ];

        return Inertia::render('Payments/PaymentsList', [
            'payments' => $payments,
            'stats'    => $stats,
            'filters'  => $request->all(['search', 'type', 'from_date', 'to_date', 'filter'])
        ]);
    }

    public function createIn(Request $request)
    {
        $selectedPartyId = $request->query('party_id');
        return Inertia::render('Payments/In', [
            'parties'      => Party::orderBy('name')->get(),
            'bankAccounts' => BankAccount::orderBy('name')->get(),
            'selected_party_id' => $selectedPartyId,
        ]);
    }

    public function createOut(Request $request)
    {
        $selectedPartyId = $request->query('party_id');
        return Inertia::render('Payments/Out', [
            'parties'      => Party::orderBy('name')->get(),
            'bankAccounts' => BankAccount::orderBy('name')->get(),
            'selected_party_id' => $selectedPartyId,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'            => 'required|date',
            'type'            => 'required|in:in,out,received,sent',
            'party_id'        => 'required|exists:parties,id',
            'amount'          => 'required|numeric|min:0.01',
            'payment_method'  => 'required|in:cash,bank,card,upi',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'reference'       => 'nullable|string|max:100',
            'description'     => 'nullable|string',
        ]);

        // Normalise legacy type values
        $type    = match ($validated['type']) {
            'received' => 'in',
            'sent'     => 'out',
            default    => $validated['type'],
        };
        $amount  = (float) $validated['amount'];
        $partyId = $validated['party_id'] ?? null;
        $method  = $validated['payment_method'];
        $date    = $validated['date'];

        try {
            DB::transaction(function () use ($validated, $type, $amount, $partyId, $method, $date) {

                // ── 1. Write to payments table (for history / list view) ───────────
                $paymentData = [
                    'date'      => $date,
                    'type'      => $type,
                    'party_id'  => $partyId,
                    'amount'    => $amount,
                    'method'    => $method,
                    'reference' => $validated['reference'] ?? null,
                    'notes'     => $validated['description'] ?? null,
                ];

                if (DB::getSchemaBuilder()->hasColumn('payments', 'bank_account_id')) {
                    $paymentData['bank_account_id'] = $validated['bank_account_id'] ?? null;
                }

                $payment = Payment::create($paymentData);

                // ── 2. Resolve Cash / Bank ledger account ──────────────────────────
                $accounting = app(AccountingService::class);

                if ($method === 'cash') {
                    $cashBankAccount = $accounting->getAccountByCode('1000', 'Cash on Hand', 'asset');
                } elseif ($method === 'bank' && !empty($validated['bank_account_id'])) {
                    $ba = BankAccount::find($validated['bank_account_id']);
                    $cashBankAccount = ($ba && $ba->account_id)
                        ? \App\Models\Account::find($ba->account_id)
                        : $accounting->getAccountByCode('1010', 'Bank Account', 'asset');
                } else {
                    $cashBankAccount = $accounting->getAccountByCode('1010', 'Bank Account', 'asset');
                }

                // ── 3. Build double-entry journal lines ────────────────────────────
                //
                // PAYMENT IN (customer pays us):
                //   DR Cash/Bank        = asset increases
                //   CR AR (1200)        = customer's receivable decreases
                //
                // PAYMENT OUT (we pay supplier):
                //   DR AP (2000)        = supplier's payable decreases (debit clears liability)
                //   CR Cash/Bank        = asset decreases
                //
                // No party = generic cash in/out (owner, misc)

                $party = $partyId ? Party::find($partyId) : null;

                if ($party) {
                    if ($party->type === 'supplier') {
                        $counterAccount = $accounting->getAccountByCode('2000', 'Accounts Payable', 'liability');
                        $description    = $type === 'in' ? "Refund received from supplier {$party->name}" : "Payment sent to {$party->name}";
                        
                        if ($type === 'in') {
                            $lines = [
                                ['account_id' => $cashBankAccount->id, 'debit' => $amount, 'credit' => 0],
                                ['account_id' => $counterAccount->id,  'debit' => 0,       'credit' => $amount, 'party_id' => $partyId],
                            ];
                        } else {
                            $lines = [
                                ['account_id' => $counterAccount->id,  'debit' => $amount, 'credit' => 0, 'party_id' => $partyId],
                                ['account_id' => $cashBankAccount->id, 'debit' => 0,       'credit' => $amount],
                            ];
                        }
                    } else { // customer
                        $counterAccount = $accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
                        $description    = $type === 'in' ? "Payment received from {$party->name}" : "Refund paid to customer {$party->name}";
                        
                        if ($type === 'in') {
                            $lines = [
                                ['account_id' => $cashBankAccount->id, 'debit' => $amount, 'credit' => 0],
                                ['account_id' => $counterAccount->id,  'debit' => 0,       'credit' => $amount, 'party_id' => $partyId],
                            ];
                        } else {
                            $lines = [
                                ['account_id' => $counterAccount->id,  'debit' => $amount, 'credit' => 0, 'party_id' => $partyId],
                                ['account_id' => $cashBankAccount->id, 'debit' => 0,       'credit' => $amount],
                            ];
                        }
                    }
                } else {
                    if ($type === 'in') {
                        $counterAccount = $accounting->getAccountByCode('4100', 'Service Income', 'income');
                        $description    = 'Payment In — ' . ($validated['description'] ?? $validated['reference'] ?? 'Cash receipt');
                        $lines = [
                            ['account_id' => $cashBankAccount->id, 'debit' => $amount, 'credit' => 0],
                            ['account_id' => $counterAccount->id,  'debit' => 0,       'credit' => $amount],
                        ];
                    } else {
                        $counterAccount = $accounting->getAccountByCode('5100', 'Rent Expense', 'expense');
                        $description    = 'Payment Out — ' . ($validated['description'] ?? $validated['reference'] ?? 'Cash disbursement');
                        $lines = [
                            ['account_id' => $counterAccount->id,  'debit' => $amount, 'credit' => 0],
                            ['account_id' => $cashBankAccount->id, 'debit' => 0,       'credit' => $amount],
                        ];
                    }
                }

                $journalEntry = $accounting->createEntry([
                    'date'     => $date,
                    'reference_type' => 'payment',
                    'reference'   => $payment->id,
                    'description'    => $description,
                    'party_id'       => $partyId,
                    'created_by'     => auth()->id(),
                ], $lines);

                // ── Auto Allocate lump-sum payments to oldest outstanding invoices ─
                if ($party) {
                    $remainingAmount = $amount;
                    $tenantId = app('current.tenant')->id;
                    $paymentService = app(\App\Engines\PaymentService::class);

                    if ($party->type === 'supplier') {
                        $invoices = DB::table('purchases')
                            ->where('tenant_id', $tenantId)
                            ->where('party_id', $partyId)
                            ->whereIn('payment_status', ['unpaid', 'partial'])
                            ->orderBy('purchase_date', 'asc')
                            ->get();

                        foreach ($invoices as $invoice) {
                            if ($remainingAmount <= 0) break;

                            $allocated = (float) DB::table('allocations')
                                ->where('tenant_id', $tenantId)
                                ->where('purchase_id', $invoice->id)
                                ->where('status', 'active')
                                ->sum('allocated_amount');

                            $due = max(0.0, (float)$invoice->total - $allocated);
                            if ($due <= 0.01) continue;

                            $allocAmount = min($remainingAmount, $due);
                            $remainingAmount -= $allocAmount;

                            DB::table('allocations')->insert([
                                'id'                       => \Illuminate\Support\Str::uuid()->toString(),
                                'tenant_id'                => $tenantId,
                                'payment_journal_entry_id' => $journalEntry->id,
                                'purchase_id'              => $invoice->id,
                                'allocated_amount'         => $allocAmount,
                                'status'                   => 'active',
                                'created_at'               => now(),
                                'updated_at'               => now(),
                            ]);

                            $paymentService->updatePurchaseBadge($invoice->id);
                        }
                    } else { // Customer
                        $invoices = DB::table('sales')
                            ->where('tenant_id', $tenantId)
                            ->where('party_id', $partyId)
                            ->whereIn('payment_status', ['unpaid', 'partial'])
                            ->whereNull('deleted_at')
                            ->orderBy('posted_at', 'asc')
                            ->get();

                        foreach ($invoices as $invoice) {
                            if ($remainingAmount <= 0) break;

                            $allocated = (float) DB::table('allocations')
                                ->where('tenant_id', $tenantId)
                                ->where('sale_id', $invoice->id)
                                ->where('status', 'active')
                                ->sum('allocated_amount');

                            $due = max(0.0, (float)$invoice->total - $allocated);
                            if ($due <= 0.01) continue;

                            $allocAmount = min($remainingAmount, $due);
                            $remainingAmount -= $allocAmount;

                            DB::table('allocations')->insert([
                                'id'                       => \Illuminate\Support\Str::uuid()->toString(),
                                'tenant_id'                => $tenantId,
                                'payment_journal_entry_id' => $journalEntry->id,
                                'sale_id'                  => $invoice->id,
                                'allocated_amount'         => $allocAmount,
                                'status'                   => 'active',
                                'created_at'               => now(),
                                'updated_at'               => now(),
                            ]);

                            $paymentService->updatePaymentBadge($invoice->id);
                        }
                    }
                }

                // ── 5. [V3 SWAP] NO direct current_balance updates ─────────────────
                // Party balances and bank balances are computed from the journal only.
            });

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Payment store failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
        ]);
    }

    public function show($id)
    {
        $payment = Payment::with('party', 'bankAccount')->findOrFail($id);

        // Allocations are linked via allocations.payment_journal_entry_id,
        // which stores the JournalEntry ID (NOT the Payment ID) that was created for
        // this payment (see AccountingService::createEntry() call in store(), which
        // posts reference_type = 'payment', reference = $payment->id). Find that
        // journal entry, then load its allocations against sales/purchases.
        $journalEntry = \App\Models\JournalEntry::where('reference_type', 'payment')
            ->where('reference', $payment->id)
            ->first();

        $allocations = collect();
        if ($journalEntry) {
            $allocations = \App\Models\Allocation::with(['sale', 'purchase'])
                ->where('payment_journal_entry_id', $journalEntry->id)
                ->where('status', 'active')
                ->get();
        }

        return Inertia::render('Payments/Show', [
            'payment' => $payment,
            'allocations' => $allocations,
        ]);
    }
}
