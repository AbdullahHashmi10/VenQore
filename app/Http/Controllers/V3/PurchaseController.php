<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\ReceivePurchaseRequest;
use App\Http\Requests\V3\StorePurchaseRequest;
use App\Http\Requests\V3\UpdatePurchaseRequest;
use App\Engines\AccountingService;
use App\Engines\InventoryService;
use App\Engines\TaxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * THE purchase controller. Purchases live in `purchases`. Full stop.
 *
 * Phase 2 (V3_CONSOLIDATION_PLAN.md) brought this up to legacy parity:
 * edit / update / destroy(void) / receive / storeReceive, landed costs, header
 * discount, variants, supplier→party resolution and default-warehouse fallback.
 */
class PurchaseController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private InventoryService  $inventory,
        private TaxService        $tax,
        private \App\Engines\PurchaseService $purchaseService
    ) {}

    public function index(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $query = \App\Models\Purchase::where('purchases.tenant_id', $tenantId)
            ->with(['party', 'items.product']);

        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($w) use ($term) {
                $w->where('purchases.invoice_number', 'like', $term)
                  ->orWhere('purchases.reference', 'like', $term)
                  ->orWhereHas('party', function ($q) use ($term) {
                      $q->where('name', 'like', $term);
                  });
            });
        }

        if ($request->filled('filter') && $request->input('filter') !== 'all' && $request->input('filter') !== 'custom') {
            $filter = $request->input('filter');
            if ($filter === 'today') {
                $query->whereDate('purchases.purchase_date', now()->toDateString());
            } elseif ($filter === 'month') {
                $query->whereMonth('purchases.purchase_date', now()->month)
                      ->whereYear('purchases.purchase_date', now()->year);
            } else {
                $query->where(function ($q) use ($filter) {
                    $q->where('purchases.workflow_status', $filter)
                      ->orWhere('purchases.payment_status', $filter);
                });
            }
        }

        if ($request->filled('workflow_status')) {
            $query->where('purchases.workflow_status', $request->input('workflow_status'));
        }

        if ($request->filled('payment_status')) {
            $query->where('purchases.payment_status', $request->input('payment_status'));
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('purchases.purchase_date', [
                $request->input('from_date'),
                $request->input('to_date'),
            ]);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'date');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'date') {
            $query->orderBy('purchases.purchase_date', $sortDir)->orderBy('purchases.created_at', $sortDir);
        } elseif ($sortBy === 'invoice_number') {
            $query->orderBy('purchases.invoice_number', $sortDir);
        } elseif ($sortBy === 'total') {
            $query->orderBy('purchases.total', $sortDir);
        } elseif ($sortBy === 'status') {
            $query->orderBy('purchases.workflow_status', $sortDir);
        } elseif ($sortBy === 'supplier_name') {
            $query->leftJoin('parties', 'purchases.party_id', '=', 'parties.id')
                ->select('purchases.*')
                ->orderBy('parties.name', $sortDir);
        } else {
            $query->orderBy('purchases.created_at', $sortDir);
        }

        /* The summary is read from the same source of truth as each row's
           badge (PaymentService::purchaseSettlementSummaries): paid at the
           counter + every allocation (Supplier Payments, the Payments screen,
           backfilled legacy payments), less purchase returns and debit notes
           for what is owed. It used to sum AP debits on `purchase` /
           `purchase_payment` entries only, so nothing paid through Supplier
           Payments or the Payments screen ever reached "Paid", and "Due"
           ignored returns. A voided purchase owes nothing and an unreceived
           one owes nothing yet. */
        $paymentService = app(\App\Engines\PaymentService::class);

        $stats = [
            'total_purchase' => 0.0,
            'total_paid'     => 0.0,
            'total_due'      => 0.0,
            'pending_count'  => DB::table('purchases')
                ->where('tenant_id', $tenantId)
                ->where('workflow_status', 'pending')
                ->count(),
        ];

        DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->where(fn ($q) => $q->whereNull('workflow_status')->orWhereNotIn('workflow_status', ['pending', 'cancelled']))
            ->when($request->filled('from_date') && $request->filled('to_date'), fn ($q) => $q->whereBetween('purchase_date', [
                $request->input('from_date'),
                $request->input('to_date'),
            ]))
            ->select('id', 'total', 'payment_status')
            ->orderBy('id')
            ->chunk(500, function ($chunk) use ($paymentService, &$stats) {
                $summaries = $paymentService->purchaseSettlementSummaries($chunk);
                foreach ($chunk as $purchase) {
                    [$paid, $balance] = $this->listFigures($purchase, $summaries[(string) $purchase->id]);
                    $stats['total_purchase'] += (float) $purchase->total;
                    $stats['total_paid']     += $paid;
                    $stats['total_due']      += $balance;
                }
            });

        $stats['total_purchase'] = round($stats['total_purchase'], 2);
        $stats['total_paid']     = round($stats['total_paid'], 2);
        $stats['total_due']      = round($stats['total_due'], 2);

        $purchases = $query->paginate(50)->withQueryString();

        // One batch of settlement queries for the page, not three per row.
        $summaries = $paymentService->purchaseSettlementSummaries(
            $purchases->getCollection()->map(fn ($p) => (object) $p->getAttributes())
        );

        $purchases = $purchases
            ->through(function ($purchase) use ($tenantId, $summaries) {
                $extras = (float) DB::table('expenses')
                    ->where('tenant_id', $tenantId)
                    ->where('purchase_id', $purchase->id)
                    ->where('is_landed_cost', true)
                    ->sum('amount');

                // Paid / balance from the same reading the badge uses: counter
                // payment + allocations, less debit notes for what is owed.
                [$paid, $balance] = $this->listFigures($purchase, $summaries[(string) $purchase->id]);

                $total = (float) $purchase->total;

                return [
                    'id'              => $purchase->id,
                    'date'            => $purchase->purchase_date ?? $purchase->created_at,
                    'created_at'      => $purchase->created_at,
                    'invoice_number'  => $purchase->invoice_number,
                    'reference'       => $purchase->reference,
                    'supplier'        => $purchase->party,
                    'supplier_name'   => $purchase->party?->name ?? 'Unknown Supplier',
                    'payment_method'  => $purchase->payment_method ?? 'Cash',
                    'items_count'     => $purchase->items ? $purchase->items->count() : 0,
                    'items'           => $purchase->items ? $purchase->items->map(function ($item) {
                        return [
                            'id'       => $item->id,
                            'product'  => $item->product,
                            'name'     => $item->product?->name ?? 'Product Item',
                            'quantity' => (float) ($item->qty ?? $item->quantity ?? 1),
                            'price'    => (float) ($item->unit_cost ?? $item->unit_price ?? 0),
                            'subtotal' => (float) ($item->line_total ?? (($item->qty ?? 1) * ($item->unit_cost ?? 0))),
                        ];
                    })->values() : [],
                    'subtotal'        => (float) ($purchase->subtotal ?? ($total - $extras)),
                    'extras'          => $extras,
                    'total'           => $total,
                    'paid'            => $paid,
                    'balance'         => $balance,
                    'payment_status'  => $purchase->payment_status ?? ($balance <= 1.0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid')),
                    'status'          => $purchase->workflow_status ?? 'received',
                    'workflow_status' => $purchase->workflow_status ?? 'received',
                    'is_jit'          => (bool) ($purchase->is_jit ?? false),
                    'approval_status' => $purchase->approval_status ?? null,
                ];
            });

        if ($request->wantsJson()) {
            return response()->json($purchases);
        }

        return Inertia::render('Purchases/PurchasesList', [
            'purchases' => $purchases,
            'filters'   => $request->only(['search', 'filter', 'workflow_status', 'payment_status', 'from_date', 'to_date', 'sort_by', 'sort_dir']),
            'stats'     => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('V3/Purchases/Create', $this->formData());
    }

    public function store(StorePurchaseRequest $request)
    {
        $purchase = $this->purchaseService->store($request->validated());

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'purchase' => $purchase], 200);
        }

        return $this->redirectTo('show', ['purchase' => $purchase->id])
            ->with('success', 'Purchase recorded successfully.');
    }

    public function show(string $id)
    {
        $tenantId = app('current.tenant')->id;

        $purchase = DB::table('purchases')
            ->where('purchases.tenant_id', $tenantId)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $id)
            ->select('purchases.*', 'parties.name as supplier_name')
            ->firstOrFail();

        $items = DB::table('purchase_items')
            ->where('purchase_items.tenant_id', $tenantId)
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchase_items.purchase_id', $id)
            ->select(
                'purchase_items.*',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get();

        // Every journal entry the document has ever raised, including reversals,
        // so the audit trail is visible rather than just the current one.
        /* A return's entry is referenced by the RETURN id, not the purchase id
           (PurchaseService::createReturn), so it is found through
           purchase_returns.journal_entry_id. One query with an OR, so an entry
           that matches both ways (migrated legacy returns) is listed once. */
        $returnEntryIds = DB::table('purchase_returns')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $id)
            ->whereNotNull('journal_entry_id')
            ->pluck('journal_entry_id');

        $journalEntries = DB::table('journal_entries')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($id, $returnEntryIds) {
                $q->where(function ($own) use ($id) {
                    $own->where('reference', $id)
                        ->whereIn('reference_type', ['purchase', 'purchase_payment', 'purchase_reversal', 'purchase_return']);
                });
                if ($returnEntryIds->isNotEmpty()) {
                    $q->orWhereIn('id', $returnEntryIds);
                }
            })
            ->orderBy('created_at')
            ->get();

        $journalLines = DB::table('journal_items')
            ->where('journal_items.tenant_id', $tenantId)
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->whereIn('journal_items.journal_entry_id', $journalEntries->pluck('id'))
            ->select(
                'journal_items.journal_entry_id',
                'accounts.code',
                'accounts.name as account_name',
                'journal_items.debit',
                'journal_items.credit'
            )
            ->get();

        $landedCosts = DB::table('expenses')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $id)
            ->where('is_landed_cost', true)
            ->get(['id', 'category', 'amount', 'allocation_method', 'description']);

        $returns = DB::table('purchase_returns')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $id)
            ->orderByDesc('return_date')
            ->get();

        return Inertia::render('V3/Purchases/Show', [
            'purchase'       => $purchase,
            'items'          => $items,
            'journalEntries' => $journalEntries,
            'journalLines'   => $journalLines,
            'landedCosts'    => $landedCosts,
            'returns'        => $returns,
            'paidAmount'     => $this->paidAmount($id, $tenantId),
            /* Where the bill stands — total, paid, returned, outstanding — from
               the badge's own reading. The page used to work outstanding out
               as total − paid, which ignored returns. */
            'settlement'     => app(\App\Engines\PaymentService::class)->purchaseSettlementSummary($purchase),
        ]);
    }

    public function edit(string $id)
    {
        $tenantId = app('current.tenant')->id;

        /* Joined to the party so the edit screen can show WHO this purchase is
           from. Without it the supplier box came up empty on every edit. The
           paid figure comes along for the same reason: the screen has to know
           what was already settled or re-saving would post it all to payables. */
        $purchase = DB::table('purchases')
            ->where('purchases.tenant_id', $tenantId)
            ->leftJoin('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $id)
            ->select('purchases.*', 'parties.name as supplier_name', 'parties.current_balance as supplier_balance')
            ->firstOrFail();

        $purchase->amount_paid = $this->paidAmount($id, $tenantId);

        if ($purchase->workflow_status === 'cancelled') {
            return $this->redirectTo('show', ['purchase' => $id])
                ->with('error', 'A cancelled purchase cannot be edited.');
        }

        /* Joined to products, because the edit screen shows the item's NAME and
            unit and `purchase_items` carries neither. Without this every line
            on an edit came up as an empty search box. */
        $items = DB::table('purchase_items')
            ->where('purchase_items.tenant_id', $tenantId)
            ->leftJoin('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchase_items.purchase_id', $id)
            ->select('purchase_items.*', 'products.name as product_name', 'products.sku', 'products.base_unit')
            ->get();

        $landedCosts = DB::table('expenses')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $id)
            ->where('is_landed_cost', true)
            ->get(['expense_category_id as category_id', 'amount', 'allocation_method as method', 'description']);

        return Inertia::render('V3/Purchases/Edit', array_merge($this->formData(), [
            'purchase'    => $purchase,
            'items'       => $items,
            'landedCosts' => $landedCosts,
        ]));
    }

    public function update(UpdatePurchaseRequest $request, string $id)
    {
        try {
            $this->purchaseService->update($id, $request->validated());
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return $this->redirectTo('show', ['purchase' => $id])
            ->with('success', 'Purchase updated and journals recalculated.');
    }

    /**
     * VOID, not delete.
     *
     * Authorization mirrors the legacy controller: only Owner / Admin, because
     * this reverses journal entries and releases FIFO batches. Managers hold the
     * `purchases` permission for day-to-day work but are barred from this.
     *
     * Unlike legacy, the row is never removed — a posted document that vanishes
     * takes its audit trail with it.
     */
    public function destroy(Request $request, string $id)
    {
        $user       = auth()->user();
        $tenantRole = $user?->role;

        if (! $user || (! in_array($tenantRole, ['owner', 'admin'], true) && ! $user->isPlatformAdmin())) {
            Log::warning('V3 Purchase void unauthorized', [
                'user_id'     => auth()->id(),
                'tenant_role' => $tenantRole,
                'purchase_id' => $id,
            ]);
            abort(403, 'Unauthorized action. Only Owners and Admins can void purchases.');
        }

        try {
            $this->purchaseService->void($id, $request->input('reason'));
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return $this->redirectTo('index')
            ->with('success', 'Purchase voided. Journal entries reversed and stock released.');
    }

    public function receive(string $id)
    {
        $tenantId = app('current.tenant')->id;

        $purchase = DB::table('purchases')
            ->where('purchases.tenant_id', $tenantId)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $id)
            ->select('purchases.*', 'parties.name as supplier_name')
            ->firstOrFail();

        $items = DB::table('purchase_items')
            ->where('purchase_items.tenant_id', $tenantId)
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchase_items.purchase_id', $id)
            ->select(
                'purchase_items.*',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get();

        return Inertia::render('V3/Purchases/Receive', [
            'purchase' => $purchase,
            'items'    => $items,
        ]);
    }

    public function storeReceive(ReceivePurchaseRequest $request, string $id)
    {
        try {
            $result = $this->purchaseService->receive($id, $request->validated()['items']);

            /* "Two cartons crushed, driver noted it" — validated since the day
               the request class was written and then dropped on the floor,
               because only the items were passed on. It is the one thing about
               a delivery nobody can reconstruct later. */
            $note = trim((string) ($request->validated()['notes'] ?? ''));
            if ($note !== '') {
                $purchase = \App\Models\Purchase::find($id);
                if ($purchase) {
                    $stamp = now()->format('d M Y') . ' receipt: ' . $note;
                    $purchase->update([
                        'notes' => $purchase->notes ? $purchase->notes . "\n" . $stamp : $stamp,
                    ]);
                }
            }
        } catch (\DomainException | \InvalidArgumentException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success'         => true,
                'message'         => 'Goods received. Inventory batches created.',
                'workflow_status' => $result['workflow_status'],
            ]);
        }

        return $this->redirectTo('show', ['purchase' => $id])
            ->with('success', 'Goods received. Inventory batches created.');
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Redirect to the route family the user actually came in through.
     *
     * At Phase 5 this controller also serves the legacy `/purchases/*` URLs via
     * PurchaseRouterController. Redirecting to `store.v3.purchases.*` from there
     * would bounce the user onto `/v3/` URLs mid-flow — a visible change, which
     * the cutover is explicitly meant to avoid.
     *
     * So: if the current request came in on a `store.purchases.*` route, stay in
     * that family. Otherwise use the v3 names.
     */
    private function redirectTo(string $action, array $params = [])
    {
        $current = optional(request()->route())->getName() ?? '';
        $family  = str_starts_with($current, 'store.purchases.') ? 'store.purchases.' : 'store.v3.purchases.';

        return redirect()->route($family . $action, array_merge(
            ['store_slug' => app('current.tenant')->slug],
            $params
        ));
    }

    /** Suppliers / products / warehouses / expense categories for create + edit. */
    private function formData(): array
    {
        $tenantId = app('current.tenant')->id;

        return [
            'suppliers' => DB::table('parties')
                ->where('tenant_id', $tenantId)
                ->where('type', 'supplier')
                ->orderBy('name')
                ->get(['id', 'name']),

            'products' => DB::table('products')
                ->where('tenant_id', $tenantId)
                ->orderBy('name')
                /* `stock_quantity` and the unit as well: the line table's
                   stock badge and its Unit column read them off the product,
                   so a product picked from this seeded list read "0 in stock"
                   with a hundred on the shelf, and showed no unit at all. */
                ->get(['id', 'name', 'sku', 'base_unit', 'base_unit as unit', 'tax_rate', 'cost_price', 'stock_quantity']),

            'warehouses' => DB::table('warehouses')
                ->where('tenant_id', $tenantId)
                ->orderByDesc('is_default')
                ->get(['id', 'name', 'is_default']),

            // Via the model, not DB::table, so the tenant global scope applies —
            // this mirrors what the legacy controller did and avoids assuming a
            // `tenant_id` column that may be scoped some other way.
            'expenseCategories' => \App\Models\ExpenseCategory::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }

    /**
     * A list row's paid and balance figures, for the rows and their summary
     * alike. A purchase marked paid with nothing behind it in the ledger (a
     * migrated legacy bill) reads as paid in full and owing nothing.
     *
     * @return array{0: float, 1: float}  [paid, balance]
     */
    private function listFigures(object $purchase, array $settlement): array
    {
        $total = (float) $purchase->total;
        $paid  = min($settlement['paid'], $total);

        if ($purchase->payment_status === 'paid' && $paid <= 0) {
            $paid = $total;
        }

        $balance = $purchase->payment_status === 'paid' ? 0.0 : $settlement['outstanding'];

        return [round($paid, 2), round($balance, 2)];
    }

    /**
     * How much of this purchase has been settled — money handed over at the
     * counter when it was entered, plus every payment allocated to it since
     * (v3 supplier payments, the Payments screen, backfilled legacy
     * purchase_payment entries).
     *
     * Read from PaymentService::purchaseSettlementSummary(), the same source
     * the payment badge is computed from. This used to count only
     * `purchase_payment` journal entries, which nothing posts any more, so a
     * purchase paid through Supplier Payments showed "paid" on its badge and
     * nothing paid on its show and edit screens.
     */
    private function paidAmount(string $purchaseId, string $tenantId): float
    {
        $purchase = DB::table('purchases')->where('tenant_id', $tenantId)->where('id', $purchaseId)->first();
        if (! $purchase) {
            return 0.0;
        }

        $summary = app(\App\Engines\PaymentService::class)->purchaseSettlementSummary($purchase);

        return round(min($summary['paid'], $summary['total']), 2);
    }
}
