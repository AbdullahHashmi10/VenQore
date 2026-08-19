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

        $purchases = DB::table('purchases')
            ->where('purchases.tenant_id', $tenantId)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->input('search') . '%';
                $q->where(function ($w) use ($term) {
                    $w->where('purchases.invoice_number', 'like', $term)
                      ->orWhere('purchases.reference', 'like', $term)
                      ->orWhere('parties.name', 'like', $term);
                });
            })
            ->when($request->filled('workflow_status'), fn ($q) => $q->where('purchases.workflow_status', $request->input('workflow_status')))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('purchases.payment_status', $request->input('payment_status')))
            ->when($request->filled('from_date') && $request->filled('to_date'), function ($q) use ($request) {
                $q->whereBetween('purchases.purchase_date', [
                    $request->input('from_date'),
                    $request->input('to_date'),
                ]);
            })
            ->orderByDesc('purchases.created_at')
            ->select(
                'purchases.id',
                'purchases.invoice_number',
                'purchases.reference',
                'purchases.purchase_date',
                'purchases.due_date',
                'purchases.total',
                'purchases.payment_status',
                'purchases.workflow_status',
                'purchases.payment_method',
                'parties.name as supplier_name'
            )
            ->paginate(50)
            ->withQueryString();

        // Calculate statistics for the list view
        $apAccount = DB::table('accounts')
            ->where('code', '2000')
            ->where('tenant_id', $tenantId)
            ->value('id');

        $applyStatsScope = function ($query) use ($tenantId, $request) {
            $query->where('journal_entries.tenant_id', $tenantId);
            if ($request->filled('from_date') && $request->filled('to_date')) {
                $query->whereBetween('journal_entries.date', [
                    $request->input('from_date'),
                    $request->input('to_date'),
                ]);
            }
            return $query;
        };

        // Total invoiced = sum of all AP credits (what we owe suppliers)
        $totalPurchase = (float) $applyStatsScope(
            DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.reference_type', 'purchase')
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
        )->sum('journal_items.credit');

        // Total paid = sum of all AP debits against purchase entries and payments
        $totalPaid = (float) $applyStatsScope(
            DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->whereIn('journal_entries.reference_type', ['purchase', 'purchase_payment'])
                ->where('journal_entries.is_reversed', 0)
                ->where('journal_items.account_id', $apAccount)
        )->sum('journal_items.debit');

        $totalDue = $totalPurchase - $totalPaid;

        $stats = [
            'total_purchase' => $totalPurchase,
            'total_paid'     => $totalPaid,
            'total_due'      => $totalDue,
            'pending_count'  => DB::table('purchases')
                ->where('tenant_id', $tenantId)
                ->where('workflow_status', 'pending')
                ->count(),
        ];

        return Inertia::render('V3/Purchases/Index', [
            'purchases' => $purchases,
            'filters'   => $request->only(['search', 'workflow_status', 'payment_status', 'from_date', 'to_date']),
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
        $journalEntries = DB::table('journal_entries')
            ->where('tenant_id', $tenantId)
            ->where('reference', $id)
            ->whereIn('reference_type', ['purchase', 'purchase_payment', 'purchase_reversal', 'purchase_return'])
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
        ]);
    }

    public function edit(string $id)
    {
        $tenantId = app('current.tenant')->id;

        $purchase = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        if ($purchase->workflow_status === 'cancelled') {
            return $this->redirectTo('show', ['purchase' => $id])
                ->with('error', 'A cancelled purchase cannot be edited.');
        }

        $items = DB::table('purchase_items')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $id)
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
                ->get(['id', 'name', 'sku', 'base_unit', 'tax_rate', 'cost_price']),

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
     * Paid amount is DERIVED from the ledger, never stored. Sums AP debits on
     * non-reversed purchase_payment entries for this purchase.
     */
    private function paidAmount(string $purchaseId, string $tenantId): float
    {
        return (float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->where('je.reference_type', 'purchase_payment')
            ->where('je.reference', $purchaseId)
            ->where('a.code', '2000')
            ->sum('ji.debit') ?? 0);
    }
}
