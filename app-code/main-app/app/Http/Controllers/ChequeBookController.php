<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Services\Cheque\ChequeBookService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChequeBookController extends Controller
{
    public function __construct(
        private ChequeBookService $chequeBookService
    ) {}

    /**
     * Display a listing of cheque books.
     */
    public function index(Request $request)
    {
        $tenant = app('current.tenant');
        $query = ChequeBook::where('tenant_id', $tenant->id)
            ->with(['bankAccount'])
            ->withCount([
                'leaves as total_leaves_count',
                'leaves as available_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_AVAILABLE),
                'leaves as reserved_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_RESERVED),
                'leaves as issued_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_ISSUED),
                'leaves as cleared_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_CLEARED),
                'leaves as bounced_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_BOUNCED),
                'leaves as stopped_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_STOPPED),
                'leaves as void_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_VOID),
            ]);

        if ($request->filled('bank_account_id')) {
            $query->where('bank_account_id', $request->bank_account_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('series_prefix', 'like', "%{$search}%")
                  ->orWhere('start_number', 'like', "%{$search}%")
                  ->orWhere('end_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('bankAccount', fn ($b) => $b->where('name', 'like', "%{$search}%")->orWhere('bank_name', 'like', "%{$search}%"));
            });
        }

        $chequeBooks = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($chequeBooks);
        }

        $bankAccounts = BankAccount::where('tenant_id', $tenant->id)->orderBy('name')->get();

        return Inertia::render('ChequeBooks/Index', [
            'chequeBooks'  => $chequeBooks,
            'bankAccounts' => $bankAccounts,
            'filters'      => $request->only(['bank_account_id', 'status', 'search']),
        ]);
    }

    /**
     * Show form for creating a new cheque book.
     */
    public function create()
    {
        $tenant = app('current.tenant');
        $bankAccounts = BankAccount::where('tenant_id', $tenant->id)->orderBy('name')->get();

        return Inertia::render('ChequeBooks/Create', [
            'bankAccounts' => $bankAccounts,
        ]);
    }

    /**
     * Store a newly created cheque book.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|uuid|exists:bank_accounts,id',
            'series_prefix'   => 'nullable|string|max:10',
            'start_number'    => 'required|integer|min:0',
            'end_number'      => 'required|integer|min:0|gte:start_number',
            'padding_zeros'   => 'nullable|integer|min:1|max:12',
            'description'     => 'nullable|string|max:255',
        ]);

        $tenant = app('current.tenant');

        try {
            $book = $this->chequeBookService->createChequeBook(
                tenant: $tenant,
                bankAccountId: $validated['bank_account_id'],
                startNumber: (int)$validated['start_number'],
                endNumber: (int)$validated['end_number'],
                seriesPrefix: $validated['series_prefix'] ?? null,
                paddingZeros: (int)($validated['padding_zeros'] ?? 6),
                description: $validated['description'] ?? null,
                user: $request->user()
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success'     => true,
                    'message'     => "Chequebook registered successfully with {$book->total_leaves} leaves.",
                    'cheque_book' => $book->load('bankAccount'),
                ], 201);
            }

            return redirect()->route('store.banking.cheque-books.show', ['store_slug' => $tenant->slug, 'id' => $book->id])
                ->with('success', "Chequebook registered successfully with {$book->total_leaves} leaves.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    /**
     * Display the specified cheque book and its individual leaves.
     */
    public function show(Request $request, string $id)
    {
        $tenant = app('current.tenant');
        $book = ChequeBook::where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->with(['bankAccount'])
            ->withCount([
                'leaves as total_leaves_count',
                'leaves as available_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_AVAILABLE),
                'leaves as reserved_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_RESERVED),
                'leaves as issued_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_ISSUED),
                'leaves as cleared_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_CLEARED),
                'leaves as bounced_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_BOUNCED),
                'leaves as stopped_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_STOPPED),
                'leaves as void_leaves_count' => fn ($q) => $q->where('status', ChequeLeaf::STATUS_VOID),
            ])
            ->firstOrFail();

        $leavesQuery = ChequeLeaf::where('tenant_id', $tenant->id)
            ->where('cheque_book_id', $book->id)
            ->with(['payment.party', 'party', 'approvalDocument']);

        if ($request->filled('status')) {
            $leavesQuery->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $leavesQuery->where(function ($q) use ($search) {
                $q->where('display_serial_number', 'like', "%{$search}%")
                  ->orWhere('cheque_number', 'like', "%{$search}%")
                  ->orWhere('status_reason', 'like', "%{$search}%")
                  ->orWhereHas('party', fn ($p) => $p->where('name', 'like', "%{$search}%"));
            });
        }

        $leaves = $leavesQuery->orderBy('serial_number', 'asc')->paginate(50)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json([
                'cheque_book' => $book,
                'leaves'      => $leaves,
            ]);
        }

        return Inertia::render('ChequeBooks/Show', [
            'chequeBook' => $book,
            'leaves'     => $leaves,
            'filters'    => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Close a cheque book manually.
     */
    public function close(Request $request, string $id)
    {
        $tenant = app('current.tenant');

        try {
            $book = $this->chequeBookService->closeChequeBook($tenant, $id, $request->user());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Chequebook marked as closed.',
                    'cheque_book' => $book,
                ]);
            }

            return back()->with('success', 'Chequebook marked as closed.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete an unused cheque book.
     */
    public function destroy(Request $request, string $id)
    {
        $tenant = app('current.tenant');

        try {
            $this->chequeBookService->deleteChequeBook($tenant, $id, $request->user());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Chequebook and all its leaves deleted.',
                ]);
            }

            return redirect()->route('store.banking.cheque-books.index', ['store_slug' => $tenant->slug])
                ->with('success', 'Chequebook and all its leaves deleted.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Return list of available leaves for a given bank account (or all bank accounts if omitted).
     */
    public function availableLeaves(Request $request)
    {
        $request->validate([
            'bank_account_id' => 'nullable|uuid|exists:bank_accounts,id',
        ]);

        $tenant = app('current.tenant');

        $query = ChequeLeaf::where('tenant_id', $tenant->id)
            ->where('status', ChequeLeaf::STATUS_AVAILABLE)
            ->with(['bankAccount:id,name,bank_name', 'chequeBook:id,prefix']);

        if ($request->filled('bank_account_id')) {
            $query->where('bank_account_id', $request->bank_account_id);
        }

        $leaves = $query->orderBy('numeric_serial', 'asc')
            ->get(['id', 'cheque_book_id', 'bank_account_id', 'numeric_serial', 'display_serial_number', 'status'])
            ->map(function ($leaf) {
                return [
                    'id'                    => $leaf->id,
                    'cheque_book_id'        => $leaf->cheque_book_id,
                    'bank_account_id'       => $leaf->bank_account_id,
                    'bank_account_name'     => $leaf->bankAccount?->name ?? $leaf->bankAccount?->bank_name ?? 'Bank Account',
                    'series_prefix'         => $leaf->chequeBook?->series_prefix,
                    'serial_number'         => $leaf->numeric_serial,
                    'display_serial_number' => $leaf->display_serial_number,
                    'cheque_number'         => $leaf->display_serial_number,
                ];
            });

        return response()->json([
            'success' => true,
            'leaves'  => $leaves,
        ]);
    }
}
