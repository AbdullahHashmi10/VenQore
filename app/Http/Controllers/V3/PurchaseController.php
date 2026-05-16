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
        private TaxService        $tax
    ) {}

    public function index()
    {
        $tenantId = app('current.tenant')->id;
        $purchases = DB::table('purchases')
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
        $suppliers = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'supplier')
            ->orderBy('name')
            ->get(['id', 'name']);

        $products = DB::table('products')
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'base_unit', 'tax_rate']);

        $warehouses = DB::table('warehouses')
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

        $purchase = DB::transaction(function () use ($validated) {

            $purchaseId    = Str::uuid()->toString();
            $invoiceNumber = 'PUR-' . strtoupper(Str::random(8));

            // ── 1. Calculate totals ───────────────────────────────────
            $subtotal  = 0.00;
            $taxTotal  = 0.00;
            $itcTotal  = 0.00;
            $expTotal  = 0.00;
            $lineItems = [];

            foreach ($validated['items'] as $item) {
                $lineCost    = round($item['qty'] * $item['unit_cost'], 2);
                $businessPct = isset($item['business_pct'])
                                ? (float) $item['business_pct']
                                : 100.0; // default full ITC

                $taxCalc = $this->tax->calculateLineTax(
                    amount:           $lineCost,
                    taxRate:          $item['tax_rate'] ?? 0,
                    priceIncludesTax: false
                );

                $recoverableTax   = round($taxCalc['tax'] * ($businessPct / 100), 2);
                $nonRecoverableTax = round($taxCalc['tax'] - $recoverableTax, 2);

                $subtotal  += $taxCalc['net'];
                $taxTotal  += $taxCalc['tax'];          // total tax for grand total calc
                $itcTotal  += $recoverableTax;          // goes to 2300
                $expTotal  += $nonRecoverableTax;       // goes to 6000

                $lineItems[] = array_merge($item, [
                    'line_total'        => $lineCost,
                    'tax_amount'        => $taxCalc['tax'],
                    'recoverable_tax'   => $recoverableTax,
                    'nonrecoverable_tax'=> $nonRecoverableTax,
                    'business_pct'      => $businessPct,
                ]);
            }

            $grandTotal = round($subtotal + $taxTotal, 2);

            // ── 2. Build journal lines ────────────────────────────────
            $journalLines = [
                ['account_code' => '1100', 'debit' => $subtotal, 'credit' => 0],
            ];

            if ($itcTotal > 0) {
                $journalLines[] = [
                    'account_code' => '2300',
                    'debit'        => $itcTotal,
                    'credit'       => 0,
                ];
            }

            if ($expTotal > 0) {
                $journalLines[] = [
                    'account_code' => '6000',
                    'debit'        => $expTotal,
                    'credit'       => 0,
                ];
            }

            if ($validated['payment_method'] === 'cash') {
                // B3 — Cash leaves immediately
                $journalLines[] = [
                    'account_code' => '1000',
                    'debit'        => 0,
                    'credit'       => $grandTotal,
                    'party_id'     => $validated['supplier_id'],
                ];
                $paymentStatus = 'paid';
            } else {
                // B6 — Liability created, cash stays
                $journalLines[] = [
                    'account_code' => '2000',
                    'debit'        => 0,
                    'credit'       => $grandTotal,
                    'party_id'     => $validated['supplier_id'],
                ];
                $paymentStatus = 'unpaid';
            }

            // ── 3. Post the journal entry ─────────────────────────────
            $journalEntry = $this->accounting->createEntry([
                'date'           => $validated['purchase_date'],
                'reference_type' => 'purchase',
                'reference'      => $purchaseId,
                'description'    => ($validated['payment_method'] === 'cash' ? 'Cash' : 'Credit')
                                    . " purchase — {$invoiceNumber}",
                'party_id'       => $validated['supplier_id'],
            ], $journalLines);

            // ── 4. Insert purchases record ────────────────────────────
            DB::table('purchases')->insert([
                'id'               => $purchaseId,
                'tenant_id'        => app('current.tenant')->id,
                'invoice_number'   => $validated['supplier_invoice'] ?? $invoiceNumber,
                'party_id'         => $validated['supplier_id'],
                'warehouse_id'     => $validated['warehouse_id'],
                'purchase_date'    => $validated['purchase_date'],
                'subtotal'         => $subtotal,
                'tax'              => $taxTotal,
                'total'            => $grandTotal,
                'payment_status'   => $paymentStatus,
                'payment_method'   => $validated['payment_method'],
                'journal_entry_id' => $journalEntry->id,
                'created_by'       => auth()->id() ?? 1,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            // ── 5. Insert purchase_items + create inventory batches ───
            foreach ($lineItems as $item) {
                $itemId = Str::uuid()->toString();

                DB::table('purchase_items')->insert([
                    'id'           => $itemId,
                    'tenant_id'    => app('current.tenant')->id,
                    'purchase_id'  => $purchaseId,
                    'product_id'   => $item['product_id'],
                    'qty'          => $item['qty'],
                    'unit_cost'    => $item['unit_cost'],
                    'tax_rate'     => $item['tax_rate'] ?? 0,
                    'business_pct' => $item['business_pct'],
                    'line_total'   => $item['line_total'],
                    'created_at'   => now(),
                ]);

                // receiveBatch — unit_cost locked here, never changed
                $batch = $this->inventory->fifo->receiveBatch(
                    productId:   $item['product_id'],
                    warehouseId: $validated['warehouse_id'],
                    qty:         (float) $item['qty'],
                    unitCost:    (float) $item['unit_cost'],
                    batchType:   'purchase',
                    purchaseId:  $purchaseId
                );

                // Link batch back to purchase_item
                DB::table('purchase_items')
                    ->where('id', $itemId)
                    ->update(['inventory_batch_id' => $batch->id]);
            }

            return DB::table('purchases')
                ->join('parties', 'purchases.party_id', '=', 'parties.id')
                ->where('purchases.id', $purchaseId)
                ->select('purchases.*', 'parties.name as supplier_name')
                ->first();
        });

        return redirect()
            ->route('store.v3.purchases.show', ['store_slug' => app('current.tenant')->slug, 'purchase' => $purchase->id])
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
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->where('purchase_items.purchase_id', $id)
            ->select(
                'purchase_items.*',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get();

        $journalEntry = DB::table('journal_entries')
            ->where('id', $purchase->journal_entry_id)
            ->first();

        $journalLines = DB::table('journal_items')
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
