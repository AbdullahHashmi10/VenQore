<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StorePurchaseRequest;
use App\Services\V3\AccountingService;
use App\Services\V3\InventoryService;
use App\Services\V3\TaxService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private InventoryService  $inventory,
        private TaxService        $tax,
        private \App\Services\V3\PurchaseService $purchaseService
    ) {}

    public function index()
    {
        $tenantId = app('current.tenant')->id;
        $purchases = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)
            ->where('purchases.tenant_id', $tenantId)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->orderByDesc('purchases.created_at')
            ->select(
                'purchases.id',
                'purchases.invoice_number',
                'purchases.purchase_date',
                'purchases.total',
                'purchases.payment_status',
                'purchases.payment_method',
                'parties.name as supplier_name'
            )
            ->paginate(50);

        return Inertia::render('V3/Purchases/Index', [
            'purchases' => $purchases,
        ]);
    }

    public function create()
    {
        $tenantId = app('current.tenant')->id;
        $suppliers = DB::table('parties')->where('parties.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('type', 'supplier')
            ->orderBy('name')
            ->get(['id', 'name']);

        $products = DB::table('products')->where('products.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'base_unit', 'tax_rate']);

        $warehouses = DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->orderByDesc('is_default')
            ->get(['id', 'name', 'is_default']);

        return Inertia::render('V3/Purchases/Create', [
            'suppliers'  => $suppliers,
            'products'   => $products,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(StorePurchaseRequest $request)
    {
        $validated = $request->validated();

        $purchase = $this->purchaseService->store($validated);

        return redirect()
            ->route('store.v3.purchases.show', ['store_slug' => app('current.tenant')->slug, 'purchase' => $purchase->id])
            ->with('success', 'Purchase recorded successfully.');
    }

    public function show(string $id)
    {
        $tenantId = app('current.tenant')->id;
        $purchase = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)
            ->where('purchases.tenant_id', $tenantId)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $id)
            ->select('purchases.*', 'parties.name as supplier_name')
            ->firstOrFail();

        $items = DB::table('purchase_items')->where('purchase_items.tenant_id', app('current.tenant')->id)
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchase_items.purchase_id', $id)
            ->select(
                'purchase_items.*',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get();

        $journalEntry = DB::table('journal_entries')->where('journal_entries.tenant_id', app('current.tenant')->id)
            ->where('id', $purchase->journal_entry_id)
            ->first();

        $journalLines = DB::table('journal_items')->where('journal_items.tenant_id', app('current.tenant')->id)
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_items.journal_entry_id', $purchase->journal_entry_id)
            ->select(
                'accounts.code',
                'accounts.name as account_name',
                'journal_items.debit',
                'journal_items.credit'
            )
            ->get();

        return Inertia::render('V3/Purchases/Show', [
            'purchase'     => $purchase,
            'items'        => $items,
            'journalEntry' => $journalEntry,
            'journalLines' => $journalLines,
        ]);
    }
}
