<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Party;
use App\Models\BankAccount;
use App\Engines\AccountingService;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\Approval\ApprovalExecutionEngine;
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
        $correction = app(\App\Services\Approval\ApprovalCorrectionResolver::class)->resolveForEdit($request, 'customer_receipt');

        return Inertia::render('Payments/In', [
            'parties'             => Party::orderBy('name')->get(),
            'bankAccounts'        => BankAccount::orderBy('name')->get(),
            'selected_party_id'   => $selectedPartyId,
            'approval_correction' => $correction,
        ]);
    }

    public function createOut(Request $request)
    {
        $selectedPartyId = $request->query('party_id');
        $correction = app(\App\Services\Approval\ApprovalCorrectionResolver::class)->resolveForEdit($request, 'supplier_payment');

        return Inertia::render('Payments/Out', [
            'parties'             => Party::orderBy('name')->get(),
            'bankAccounts'        => BankAccount::orderBy('name')->get(),
            'selected_party_id'   => $selectedPartyId,
            'approval_correction' => $correction,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'            => 'required|date',
            'type'            => 'required|in:in,out,received,sent',
            'party_id'        => 'required|exists:parties,id',
            'amount'          => 'required|numeric|min:0.01',
            'payment_method'  => 'required|in:cash,bank,card,upi,cheque',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'cheque_leaf_id'  => 'nullable|string',
            'cheque_number'   => 'nullable|string|max:50',
            'cheque_date'     => 'nullable|date',
            'bank_name'       => 'nullable|string|max:100',
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

        if ($method === 'cheque' && $type === 'out') {
            if (empty($validated['bank_account_id']) || empty($validated['cheque_leaf_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bank account and an available cheque leaf are required for cheque payments.',
                ], 422);
            }
        }

        // ── Direction & party-type permission gate ─────────────────────────────
        // The route middleware uses OR semantics, so a user holding only
        // finance.receive_payment could POST type=out without this check.
        // We also guard cross-direction refunds (supplier pays us back /
        // we refund a customer) which require their own dedicated permissions.
        $user = auth()->user();
        $party = $partyId ? Party::find($partyId) : null;

        // Audited 2026-09-23: this endpoint posted directly with NO approval-
        // workflow interception at all — a confirmed bypass of the Phase 1
        // maker-checker system for both standard receipts/payments AND for
        // refunds recorded via this generic screen. Standard receipts/payments
        // now route through the existing TYPE_CUSTOMER_RECEIPT /
        // TYPE_SUPPLIER_PAYMENT adapters below. The two refund directions
        // (supplier money in, customer money out) have no adapter that fits a
        // refund with no debit note / no sales return behind it — rather than
        // leave them posting ungated, or silently forcing them through an
        // adapter whose validation and GL logic doesn't match this shape, they
        // are blocked here with a message pointing at the sanctioned flow
        // (debit note refund / sales return refund), both of which already
        // carry their own approval interception.
        $documentType = null;

        if ($party && $party->type === 'supplier' && $type === 'in') {
            // Supplier refund: money flows in FROM a supplier — needs finance.supplier_refund
            if (!$user->hasPermission('finance.supplier_refund')) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to record supplier refunds.'], 403);
            }
            $policy = resolve(ApprovalPolicyResolver::class)->resolve(
                tenant: app('current.tenant'),
                user: $user,
                documentType: ApprovalDocument::TYPE_SUPPLIER_REFUND,
                amount: $amount,
            );
            if ($policy['requires_approval']) {
                return response()->json([
                    'success' => false,
                    'message' => 'When approval workflow is enabled, supplier refunds must be recorded against a debit note. Use Purchases → Debit Notes → Refund.',
                ], 422);
            }
        } elseif ($party && $party->type === 'customer' && $type === 'out') {
            // Customer refund: money flows out TO a customer — needs finance.customer_refund
            if (!$user->hasPermission('finance.customer_refund')) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to record customer refunds.'], 403);
            }
            $tenant = app('current.tenant');
            $policy = resolve(ApprovalPolicyResolver::class)->resolve(
                tenant: $tenant,
                user: $user,
                documentType: ApprovalDocument::TYPE_CUSTOMER_REFUND,
                amount: $amount,
            );
            if ($policy['requires_approval']) {
                $hasReference = $request->filled('reference') || $request->filled('sales_return_id') || $request->filled('credit_note_id');
                if (!$hasReference) {
                    return response()->json([
                        'success' => false,
                        'message' => 'When approval workflow is enabled, customer refunds must be recorded against a sales return. Use Sales → Returns.',
                    ], 422);
                }
                $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
                $doc = resolve(ApprovalExecutionEngine::class)->submit(
                    tenant: $tenant,
                    maker: $user,
                    documentType: ApprovalDocument::TYPE_CUSTOMER_REFUND,
                    payload: [
                        'customer_id'     => $partyId,
                        'party_id'        => $partyId,
                        'amount'          => $amount,
                        'payment_method'  => $method,
                        'bank_account_id' => $validated['bank_account_id'] ?? null,
                        'cheque_leaf_id'  => $validated['cheque_leaf_id'] ?? null,
                        'cheque_date'     => $validated['cheque_date'] ?? $date,
                        'payment_date'    => $date,
                        'reason'          => $validated['description'] ?? 'Customer refund',
                        'reference'       => $validated['reference'] ?? null,
                    ],
                    amount: $amount,
                    description: "Customer refund to {$party->name} — " . ($validated['description'] ?? 'Refund'),
                    idempotencyKey: $idempotencyKey
                );

                return response()->json([
                    'status'               => 'pending_approval',
                    'approval_document_id' => $doc->id,
                    'document_number'      => $doc->document_number,
                    'message'              => 'Customer refund submitted for approval.',
                ], 202);
            }
        } elseif ($type === 'in') {
            // Standard customer receipt
            if (!$user->hasPermission('finance.receive_payment')) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to receive payments.'], 403);
            }
            $documentType = ApprovalDocument::TYPE_CUSTOMER_RECEIPT;
        } else {
            // Standard supplier payment (type === 'out')
            if (!$user->hasPermission('finance.send_payment')) {
                return response()->json(['success' => false, 'message' => 'You do not have permission to send payments.'], 403);
            }
            $documentType = ApprovalDocument::TYPE_SUPPLIER_PAYMENT;
        }
        // Re-fetch party inside transaction to avoid TOCTOU on party.type
        unset($party);

        // ── Approval interception (standard receipt/payment, party present) ──
        // A no-party generic cash in/out (Service Income / Rent Expense lines
        // below) has no Phase 1 adapter to route through and is left on the
        // direct path unchanged — same as before this fix.
        if ($documentType && $partyId) {
            $tenant = app('current.tenant');
            $allocations = $this->computeAutoAllocations($type, $partyId, $amount);

            $policy = resolve(ApprovalPolicyResolver::class)->resolve(
                tenant: $tenant,
                user: $user,
                documentType: $documentType,
                amount: $amount,
            );

            if ($policy['requires_approval']) {
                $partyKey = $documentType === ApprovalDocument::TYPE_CUSTOMER_RECEIPT ? 'customer_id' : 'supplier_id';
                $label    = $documentType === ApprovalDocument::TYPE_CUSTOMER_RECEIPT ? 'Customer receipt' : 'Supplier payment';

                $doc = resolve(ApprovalExecutionEngine::class)->submit(
                    tenant: $tenant,
                    maker: $user,
                    documentType: $documentType,
                    payload: [
                        $partyKey         => $partyId,
                        'payment_date'    => $date,
                        'payment_method'  => $method,
                        'bank_account_id' => $validated['bank_account_id'] ?? null,
                        'cheque_leaf_id'  => $validated['cheque_leaf_id'] ?? null,
                        'cheque_number'   => $validated['cheque_number'] ?? null,
                        'cheque_date'     => $validated['cheque_date'] ?? $date,
                        'bank_name'       => $validated['bank_name'] ?? null,
                        'amount'          => $amount,
                        'reference'       => $validated['reference'] ?? null,
                        'allocations'     => $allocations,
                    ],
                    amount: $amount,
                    description: $label . ' — ' . ($validated['reference'] ?? ''),
                    idempotencyKey: $request->header('Idempotency-Key'),
                );

                return response()->json([
                    'success'               => true,
                    'status'                => 'pending_approval',
                    'approval_document_id'  => $doc->id,
                    'document_number'       => $doc->document_number,
                    'message'               => $label . ' submitted for approval (ref: ' . $doc->document_number . ').',
                ], 202);
            }
        } else {
            $allocations = [];
        }

        try {
            DB::transaction(function () use ($validated, $type, $amount, $partyId, $method, $date, $allocations, $user) {
                $tenant = app('current.tenant');

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

                // ── Cheque handling for direct outgoing & incoming ──
                if ($method === 'cheque' && $type === 'out') {
                    $leaf = app(\App\Services\Cheque\ChequeLifecycleService::class)->issueCheque(
                        tenant: $tenant,
                        leafId: $validated['cheque_leaf_id'],
                        paymentId: $payment->id,
                        amount: $amount,
                        partyId: $partyId,
                        issueDate: $date,
                        chequeDate: $validated['cheque_date'] ?? $date,
                        user: $user
                    );
                    $payment->update([
                        'cheque_leaf_id' => $leaf->id,
                        'cheque_number'  => $leaf->cheque_number,
                    ]);
                } elseif ($method === 'cheque' && $type === 'in') {
                    $chequeNum = $validated['cheque_number'] ?? $validated['reference'] ?? null;
                    if (!$chequeNum) {
                        throw new \InvalidArgumentException("Cheque number is required for cheque receipts.");
                    }
                    $bankName = $validated['bank_name'] ?? 'Cheque';
                    $chequeDate = $validated['cheque_date'] ?? $date;

                    $dupService = app(\App\Services\Cheque\ChequeDuplicateService::class);
                    $dupCheck = $dupService->checkReceivedDuplicate($tenant, $chequeNum, $bankName, $partyId, $amount);
                    if ($dupCheck['duplicate']) {
                        throw new \InvalidArgumentException($dupCheck['message']);
                    }

                    $rc = $dupService->recordReceivedCheque(
                        tenant: $tenant,
                        chequeNumber: $chequeNum,
                        amount: $amount,
                        partyId: $partyId,
                        bankName: $bankName,
                        chequeDate: $chequeDate,
                        paymentId: $payment->id,
                        notes: $validated['description'] ?? null,
                        user: $user
                    );
                    $payment->update([
                        'received_cheque_id' => $rc->id,
                        'cheque_number'      => $rc->cheque_number,
                    ]);
                }

                // ── 2. Resolve Cash / Bank ledger account ──────────────────────────
                $accounting = app(AccountingService::class);

                if ($method === 'cash') {
                    $cashBankAccount = $accounting->getAccountByCode('1000', 'Cash on Hand', 'asset');
                } elseif ($method === 'cheque' && $type === 'in') {
                    $cashBankAccount = $accounting->getAccountByCode('1020', 'Cheques in Hand', 'asset');
                } elseif (($method === 'bank' || $method === 'cheque') && !empty($validated['bank_account_id'])) {
                    $ba = BankAccount::find($validated['bank_account_id']);
                    $cashBankAccount = ($ba && $ba->account_id)
                        ? \App\Models\Account::find($ba->account_id)
                        : $accounting->getAccountByCode('1010', 'Bank Account', 'asset');
                } else {
                    $cashBankAccount = $accounting->getAccountByCode('1010', 'Bank Account', 'asset');
                }

                // ── 3. Build double-entry journal lines ────────────────────────────
                $bankAccountId = (($method === 'bank' || $method === 'cheque') && !empty($validated['bank_account_id']) && !($method === 'cheque' && $type === 'in')) ? $validated['bank_account_id'] : null;

                $party = $partyId ? Party::find($partyId) : null;

                if ($party) {
                    if ($party->type === 'supplier') {
                        $counterAccount = $accounting->getAccountByCode('2000', 'Accounts Payable', 'liability');
                        $description    = $type === 'in' ? "Refund received from supplier {$party->name}" : "Payment sent to {$party->name}";
                        
                        if ($type === 'in') {
                            $lines = [
                                ['account_id' => $cashBankAccount->id, 'debit' => $amount, 'credit' => 0, 'bank_account_id' => $bankAccountId],
                                ['account_id' => $counterAccount->id,  'debit' => 0,       'credit' => $amount, 'party_id' => $partyId],
                            ];
                        } else {
                            $lines = [
                                ['account_id' => $counterAccount->id,  'debit' => $amount, 'credit' => 0, 'party_id' => $partyId],
                                ['account_id' => $cashBankAccount->id, 'debit' => 0,       'credit' => $amount, 'bank_account_id' => $bankAccountId],
                            ];
                        }
                    } else { // customer
                        $counterAccount = $accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
                        $description    = $type === 'in' ? "Payment received from {$party->name}" : "Refund paid to customer {$party->name}";
                        
                        if ($type === 'in') {
                            $lines = [
                                ['account_id' => $cashBankAccount->id, 'debit' => $amount, 'credit' => 0, 'bank_account_id' => $bankAccountId],
                                ['account_id' => $counterAccount->id,  'debit' => 0,       'credit' => $amount, 'party_id' => $partyId],
                            ];
                        } else {
                            $lines = [
                                ['account_id' => $counterAccount->id,  'debit' => $amount, 'credit' => 0, 'party_id' => $partyId],
                                ['account_id' => $cashBankAccount->id, 'debit' => 0,       'credit' => $amount, 'bank_account_id' => $bankAccountId],
                            ];
                        }
                    }
                } else {
                    if ($type === 'in') {
                        $counterAccount = $accounting->getAccountByCode('4100', 'Service Income', 'income');
                        $description    = 'Payment In — ' . ($validated['description'] ?? $validated['reference'] ?? 'Cash receipt');
                        $lines = [
                            ['account_id' => $cashBankAccount->id, 'debit' => $amount, 'credit' => 0, 'bank_account_id' => $bankAccountId],
                            ['account_id' => $counterAccount->id,  'debit' => 0,       'credit' => $amount],
                        ];
                    } else {
                        $counterAccount = $accounting->getAccountByCode('5100', 'Rent Expense', 'expense');
                        $description    = 'Payment Out — ' . ($validated['description'] ?? $validated['reference'] ?? 'Cash disbursement');
                        $lines = [
                            ['account_id' => $counterAccount->id,  'debit' => $amount, 'credit' => 0],
                            ['account_id' => $cashBankAccount->id, 'debit' => 0,       'credit' => $amount, 'bank_account_id' => $bankAccountId],
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

                // ── Apply the auto-allocation computed BEFORE this transaction started
                // (same computation used to build the approval payload above, via
                // computeAutoAllocations()) — direct and approved paths now allocate
                // through the exact same App\Engines\PaymentService::allocate() call,
                // which also runs over-allocation checks and updates badges, so the
                // two paths cannot drift apart (audited 2026-09-23).
                if (!empty($allocations)) {
                    app(\App\Engines\PaymentService::class)->allocate($journalEntry->id, $allocations);
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

    /**
     * Compute the oldest-first invoice allocation for a lump-sum payment,
     * WITHOUT writing anything. Used both to decide the direct-post
     * allocations and to build the approval-submission payload, so a
     * payment that requires approval posts identically once approved
     * (audited 2026-09-23 — this used to be computed only inline, after
     * the approval branch did not exist, so there was nothing to keep in
     * sync; now there are two call sites and they must agree).
     *
     * @return array<int, array{sale_id?: string, purchase_id?: string, amount: float}>
     */
    private function computeAutoAllocations(string $type, ?string $partyId, float $amount): array
    {
        if (!$partyId) {
            return [];
        }

        $party = Party::find($partyId);
        if (!$party) {
            return [];
        }

        $tenantId = app('current.tenant')->id;
        $paymentService = app(\App\Engines\PaymentService::class);
        $remainingAmount = $amount;
        $result = [];

        if ($party->type === 'supplier') {
            // Only money going OUT to the supplier pays their bills (see store()).
            $invoices = $type !== 'out' ? collect() : DB::table('purchases')
                ->where('tenant_id', $tenantId)
                ->where('party_id', $partyId)
                ->whereIn('payment_status', ['unpaid', 'partial'])
                ->where(fn ($q) => $q->whereNull('workflow_status')->orWhere('workflow_status', '!=', 'cancelled'))
                ->orderBy('purchase_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($invoices as $invoice) {
                if ($remainingAmount <= 0.005) break;

                $due = $paymentService->purchaseSettlementSummary($invoice)['outstanding'];
                if ($due <= 0.01) continue;

                $allocAmount = round(min($remainingAmount, $due), 2);
                $remainingAmount = round($remainingAmount - $allocAmount, 2);

                $result[] = ['purchase_id' => $invoice->id, 'amount' => $allocAmount];
            }
        } else { // Customer
            // Only money coming IN from the customer pays their invoices (see store()).
            $invoices = $type !== 'in' ? collect() : DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->where('party_id', $partyId)
                ->whereIn('payment_status', ['unpaid', 'partial'])
                ->whereNull('deleted_at')
                ->where(fn ($q) => $q->whereNull('status')
                    ->orWhereNotIn('status', \App\Engines\PaymentService::CLOSED_SALE_STATUSES))
                ->when(DB::getSchemaBuilder()->hasColumn('sales', 'original_sale_id'),
                    fn ($q) => $q->whereNull('original_sale_id'))
                ->orderBy('posted_at', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($invoices as $invoice) {
                if ($remainingAmount <= 0.005) break;

                $due = $paymentService->saleSettlementSummary($invoice)['outstanding'];
                if ($due <= 0.01) continue;

                $allocAmount = round(min($remainingAmount, $due), 2);
                $remainingAmount = round($remainingAmount - $allocAmount, 2);

                $result[] = ['sale_id' => $invoice->id, 'amount' => $allocAmount];
            }
        }

        return $result;
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
