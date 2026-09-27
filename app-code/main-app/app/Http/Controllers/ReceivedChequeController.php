<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\Party;
use App\Models\ReceivedCheque;
use App\Services\Cheque\ChequeDuplicateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReceivedChequeController extends Controller
{
    public function __construct(
        private ChequeDuplicateService $duplicateService
    ) {}

    /**
     * Display a listing of received customer cheques.
     */
    public function index(Request $request)
    {
        $tenant = app('current.tenant');
        $query = ReceivedCheque::where('tenant_id', $tenant->id)
            ->with(['party', 'depositBankAccount', 'payment']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', $request->party_id);
        }

        if ($request->filled('deposit_bank_account_id')) {
            $query->where('deposit_bank_account_id', $request->deposit_bank_account_id);
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('cheque_date', [$request->from_date, $request->to_date]);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cheque_number', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%")
                  ->orWhere('branch', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('party', fn ($p) => $p->where('name', 'like', "%{$search}%"));
            });
        }

        $receivedCheques = $query->orderBy('cheque_date', 'desc')->paginate(25)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($receivedCheques);
        }

        $bankAccounts = BankAccount::where('tenant_id', $tenant->id)->orderBy('name')->get();
        $parties = Party::where('tenant_id', $tenant->id)->where('type', 'customer')->orderBy('name')->get();

        $stats = [
            'total_received'  => ReceivedCheque::where('tenant_id', $tenant->id)->where('status', ReceivedCheque::STATUS_RECEIVED)->sum('amount'),
            'total_deposited' => ReceivedCheque::where('tenant_id', $tenant->id)->where('status', ReceivedCheque::STATUS_DEPOSITED)->sum('amount'),
            'total_cleared'   => ReceivedCheque::where('tenant_id', $tenant->id)->where('status', ReceivedCheque::STATUS_CLEARED)->sum('amount'),
            'total_bounced'   => ReceivedCheque::where('tenant_id', $tenant->id)->where('status', ReceivedCheque::STATUS_BOUNCED)->sum('amount'),
        ];

        return Inertia::render('ChequeBooks/ReceivedCheques', [
            'receivedCheques' => $receivedCheques,
            'bankAccounts'    => $bankAccounts,
            'parties'         => $parties,
            'stats'           => $stats,
            'filters'         => $request->only(['status', 'party_id', 'deposit_bank_account_id', 'from_date', 'to_date', 'search']),
        ]);
    }

    /**
     * Store a manually recorded received cheque.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cheque_number' => 'required|string|max:50',
            'amount'        => 'required|numeric|min:0.01',
            'party_id'      => 'nullable|uuid|exists:parties,id',
            'bank_name'     => 'required|string|max:100',
            'branch'        => 'nullable|string|max:100',
            'cheque_date'   => 'required|date',
            'notes'         => 'nullable|string|max:500',
        ]);

        $tenant = app('current.tenant');

        try {
            $cheque = $this->duplicateService->recordReceivedCheque(
                tenant: $tenant,
                chequeNumber: $validated['cheque_number'],
                amount: (float)$validated['amount'],
                partyId: $validated['party_id'] ?? null,
                bankName: $validated['bank_name'],
                chequeDate: $validated['cheque_date'],
                paymentId: null,
                notes: $validated['notes'] ?? null,
                user: $request->user(),
                branch: $validated['branch'] ?? null
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success'         => true,
                    'message'         => 'Customer cheque recorded successfully.',
                    'received_cheque' => $cheque,
                ], 201);
            }

            return back()->with('success', 'Customer cheque recorded successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    /**
     * Deposit a received cheque into a company bank account.
     */
    public function deposit(Request $request, string $id)
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|uuid|exists:bank_accounts,id',
            'deposit_date'    => 'nullable|date',
        ]);

        $tenant = app('current.tenant');

        try {
            $cheque = $this->duplicateService->depositReceivedCheque(
                tenant: $tenant,
                receivedChequeId: $id,
                bankAccountId: $validated['bank_account_id'],
                depositDate: $validated['deposit_date'] ?? null,
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success'         => true,
                    'message'         => 'Cheque marked as deposited into bank account.',
                    'received_cheque' => $cheque,
                ]);
            }

            return back()->with('success', 'Cheque marked as deposited into bank account.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Mark a deposited cheque as cleared.
     */
    public function clear(Request $request, string $id)
    {
        $validated = $request->validate([
            'clear_date' => 'nullable|date',
        ]);

        $tenant = app('current.tenant');

        try {
            $cheque = $this->duplicateService->clearReceivedCheque(
                tenant: $tenant,
                receivedChequeId: $id,
                clearDate: $validated['clear_date'] ?? null,
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success'         => true,
                    'message'         => 'Received cheque marked as cleared.',
                    'received_cheque' => $cheque,
                ]);
            }

            return back()->with('success', 'Received cheque marked as cleared.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Mark a deposited or received cheque as bounced.
     */
    public function bounce(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason'      => 'required|string|max:255',
            'bounce_date' => 'nullable|date',
        ]);

        $tenant = app('current.tenant');

        try {
            $cheque = $this->duplicateService->bounceReceivedCheque(
                tenant: $tenant,
                receivedChequeId: $id,
                reason: $validated['reason'],
                bounceDate: $validated['bounce_date'] ?? null,
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success'         => true,
                    'message'         => 'Cheque recorded as bounced. Bank deposit reversed.',
                    'received_cheque' => $cheque,
                ]);
            }

            return back()->with('success', 'Cheque recorded as bounced.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Return a bounced or uncashed cheque back to the customer.
     */
    public function returnToCustomer(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $tenant = app('current.tenant');

        try {
            $cheque = $this->duplicateService->returnReceivedCheque(
                tenant: $tenant,
                receivedChequeId: $id,
                reason: $validated['reason'],
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success'         => true,
                    'message'         => 'Cheque returned to customer.',
                    'received_cheque' => $cheque,
                ]);
            }

            return back()->with('success', 'Cheque returned to customer.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
