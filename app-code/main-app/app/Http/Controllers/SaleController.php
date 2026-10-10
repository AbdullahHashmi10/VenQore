<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Models\ParkedSale;
use App\Services\AutoManufacturingService;
use App\Engines\AccountingService;
use App\Engines\FifoService;
use App\Services\FbrService;
use App\Queries\PartyBalanceQuery;
use App\Services\FinancialReportingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\ApprovalDocument;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\Approval\ApprovalExecutionEngine;
use Carbon\Carbon;

class SaleController extends Controller
{
    protected $accounting;
    protected $fbr;
    protected $fifo;
    protected $frs;

    public function __construct(AccountingService $accounting, FbrService $fbr, FifoService $fifo, FinancialReportingService $frs)
    {
        $this->accounting = $accounting;
        $this->fbr        = $fbr;
        $this->fifo       = $fifo;
        $this->frs        = $frs;
    }
    public function store(Request $request)
    {

        $request->validate([
            'customer_id'           => 'nullable|exists:parties,id',
            // Optional label for a walk-in sale (name to call out). Not a customer record.
            'walk_in_name'          => 'nullable|string|max:120',
            // FOH (restaurant front of house): which table/ticket and channel this sale belongs to.
            'occupancy_id'          => 'nullable|integer',
            'order_type'            => 'nullable|string|in:dine_in,takeaway,delivery',
            'items'                 => 'required|array|min:1',
            'items.*.product_id'    => 'nullable|string',
            'items.*.description'   => 'required_without:items.*.product_id|nullable|string|max:255',
            'items.*.variant_id'    => 'nullable|exists:product_variants,id',
            'items.*.quantity'      => 'required|numeric|min:0.001',
            'items.*.free_quantity' => 'nullable|numeric|min:0',
            'items.*.price'         => 'required|numeric|min:0',
            'items.*.discount'      => 'nullable|numeric|min:0',
            // Take this line from a specific stock batch instead of oldest-first.
            'items.*.batch_id'      => 'nullable|string|max:64',
            // Stock and its cost leave at dispatch (Goods Out), not at sale time.
            'deliver_later'         => 'nullable|boolean',
            'items.*.modifiers'     => 'nullable|array|max:30',
            'items.*.modifiers.*.id'          => 'nullable',
            'items.*.modifiers.*.name'        => 'required|string|max:80',
            'items.*.modifiers.*.price_delta' => 'nullable|numeric',
            'payment_method'        => 'required|string',
            'amount_paid'           => 'nullable|numeric|min:0',
            'discount'              => 'nullable|numeric|min:0',
            'tax'                   => 'nullable|numeric|min:0',
            'tax_rate'              => 'nullable|numeric|min:0',
            'delivery_charge'       => 'nullable|numeric|min:0',
            'extra_charge_value'    => 'nullable|numeric|min:0',
            'extra_charge_label'    => 'nullable|string',
            // Restaurant money. Both are added to what the customer owes, and
            // they are the same number on the bill — but not the same money in
            // the books. See postSaleJournal().
            'service_charge'        => 'nullable|numeric|min:0',
            'tip_amount'            => 'nullable|numeric|min:0',
            'add_to_ledger'         => 'nullable|boolean',
            'payment_account_id'    => 'nullable',
            'idempotency_key'       => 'nullable|string|max:100',
            // Written on the sale, not merely accepted and dropped.
            'notes'                 => 'nullable|string|max:2000',
            'date'                  => 'nullable|date',
            'sale_date'             => 'nullable|date',
            'tax_inclusive'         => 'nullable|boolean',
            'tax_exempt'            => 'nullable|boolean',
            'bank_account_id'       => 'nullable',
            'payment_reference'     => 'nullable|string|max:120',
            'cheque_date'           => 'nullable|date',
            // S-011 / S-044 manager approval (see PosSaleApprovalGuard). The PIN
            // is checked and dropped; it is never stored or logged.
            'approved_by'           => 'nullable|string|max:64',
            'approval_pin'          => 'nullable|string|max:20',
            'register_shift_id'     => 'nullable',
            'register_id'           => 'nullable|string|max:100',
            // Sale reliability contract v2: an explicit payment contract.
            'payments'              => 'nullable|array|max:20',
            'payments.*'            => 'array',
            'payments.*.method'     => ['required_with:payments', 'string', 'max:30', 'regex:/^[A-Za-z_]+$/'],
            'payments.*.amount'     => 'required_with:payments|numeric|min:0',
            'payments.*.account_id' => 'nullable',
            'payments.*.bank_account_id' => 'nullable',
            'payments.*.reference'  => 'nullable|string|max:120',
            'tendered_amount'       => 'nullable|numeric|min:0',
            // Notes the customer handed over for the cash part (v2 till). The only
            // source of cash change when a card/bank line is also present.
            'cash_tendered'         => 'nullable|numeric|min:0',
            'change_return'         => 'nullable|numeric|min:0',
            'expected_total'        => 'nullable|numeric|min:0',
            'calculation_version'   => 'nullable|integer|min:1|max:99',
            'bill_rounding'         => 'nullable|boolean',
            // When the cashier actually rang the sale (ISO-8601 with offset). Kept
            // apart from created_at (server receipt) and posted_at (accounting date).
            'occurred_at'           => 'nullable|date',
        ]);

        $currentTenant = app()->bound('current.tenant') ? app('current.tenant') : auth()->user()?->tenant;
        $tenantId      = $currentTenant?->id ?? auth()->user()?->tenant_id;

        // ── L038: Idempotency protection ────────────────────────────────────
        // A network retry or double-click on the primary online sale endpoint
        // must NOT double-post revenue and inventory. Callers may supply an
        // idempotency key via the `Idempotency-Key` header or an
        // `idempotency_key` field. If a sale with that key already exists for
        // this tenant, return it instead of creating a duplicate.
        $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
        // Bound to the business content: same key + same intent → same sale;
        // same key + different content → 409 and nothing changes.
        $requestHash = \App\Services\Sales\CheckoutIntent::requestHash($request->all());
        if ($idempotencyKey && $tenantId) {
            $replay = self::idempotentReplay($tenantId, (string) $idempotencyKey, $requestHash);
            if ($replay) {
                return $replay;
            }
        }
        $strictMoney = (int) $request->input('calculation_version', 0) >= \App\Services\Sales\SaleTotals::VERSION;

        // The FBR report is sent once this level is reached again, i.e. only
        // after the sale's own transaction has committed.
        $fbrBaseLevel = DB::transactionLevel();
        try {
            DB::beginTransaction();

            $items = $request->items;

            // Resolve ad-hoc service / labour lines (where product_id is null or empty)
            foreach ($items as $idx => $item) {
                if (empty($item['product_id']) && (!empty($item['description']) || !empty($item['name']))) {
                    $desc = trim($item['description'] ?? $item['name']);
                    $adHocProduct = Product::firstOrCreate(
                        [
                            'tenant_id' => $currentTenant?->id,
                            'name'      => $desc,
                            'type'      => 'service',
                        ],
                        [
                            'sku'        => 'SRV-' . strtoupper(substr(md5($desc . ($currentTenant?->id ?? '')), 0, 8)),
                            'price'      => (float)($item['price'] ?? 0),
                            'cost_price' => 0,
                            'tax_rate'   => (float)($item['tax_rate'] ?? 0),
                            'is_active'  => true,
                        ]
                    );
                    $items[$idx]['product_id'] = $adHocProduct->id;
                }
            }
            $request->merge(['items' => $items]);

            // 1. PERFORMANCE: Pre-load products to avoid DB hits in the loop
            $productIds = collect($items)->pluck('product_id')->filter()->unique();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
            
            $isStockEnabled = \App\Helpers\SettingsHelper::isStockMaintenanceEnabled();
            $stopNegative = \App\Helpers\SettingsHelper::shouldStopNegativeStock();
            $deferStock = $request->boolean('deliver_later') && $isStockEnabled;
            $autoMfg = new AutoManufacturingService();
            $manufacturingNotifications = [];

            // 2. TOTALS — calculation contract v2 (App\Services\Sales\SaleTotals).
            // One exact calculation; every persisted amount, payment and journal
            // line below comes from this same immutable result. The old float
            // waterfall + late ledger "drift" patch are gone.
            [$calc, $lineItemsData] = $this->calculateSaleLines($request, $items, $products, $strictMoney);
            $m = fn (int $minor) => \App\Support\Money::toFloat($minor);
            $subtotalGross      = $m($calc['subtotal_gross']);
            $totalItemDiscounts = $m($calc['item_discounts'] + $calc['free_value']);
            $globalDiscount     = $m($calc['bill_discount']);
            $totalTax           = $m($calc['tax']);
            $netSales           = $m($calc['revenue']);
            $deliveryCharge     = $m($calc['delivery']);
            $extraCharge        = $m($calc['extra']);
            $serviceCharge      = $m($calc['service']);
            $tipAmount          = $m($calc['tip']);
            $invoiceTotal       = $m($calc['invoice']);
            $roundOff           = $m($calc['round_off']);

            // The till's own total must be the total we post. A disagreement is
            // caught here, before anything is written (no silent absorption).
            if ($request->filled('expected_total')) {
                $expected = \App\Support\Money::parseMinor($request->input('expected_total'), 'expected total', $strictMoney);
                if ($expected !== $calc['invoice']) {
                    throw new \App\Exceptions\MoneyException(
                        'The total on the register (' . \App\Support\Money::toString($expected) . ') does not match the server total ('
                        . \App\Support\Money::toString($calc['invoice']) . '). Nothing was saved. Refresh the products and try again.',
                        'total_mismatch'
                    );
                }
            }

            // ── Payments: explicit allocation (App\Services\Sales\PaymentAllocation) ──
            // A POS sale with no customer is a counter sale: it must be paid in
            // full, exactly — there is no 0.5 tolerance and nobody to owe a balance.
            $allocation = \App\Services\Sales\PaymentAllocation::allocate([
                'invoice'          => $calc['invoice'],
                'payments'         => $request->input('payments'),
                'payment_method'   => $request->payment_method,
                'amount_paid'      => $request->input('amount_paid'),
                'tendered_amount'  => $request->input('tendered_amount'),
                'cash_tendered'    => $request->input('cash_tendered'),
                'add_to_ledger'    => $request->boolean('add_to_ledger'),
                'has_customer'     => (bool) $request->customer_id,
                'walk_in_must_pay' => $request->source === 'pos',
                'strict'           => $strictMoney,
            ]);

            // ── Credit Limit Check ──
            if ($request->customer_id) {
                $customer = DB::table('parties')
                    ->where('tenant_id', app('current.tenant')->id)
                    ->where('id', $request->customer_id)
                    ->lockForUpdate()
                    ->first();

                if ($customer && $customer->credit_limit !== null) {
                    // Same quantity the check has always measured (see PaymentAllocation:
                    // undeclared_receivable). Whether declared credit legs should also
                    // count against the limit is an open policy decision, not changed here.
                    $creditPortion = \App\Support\Money::toFloat($allocation['undeclared_receivable']);

                    if ($creditPortion > 0) {
                        $currentBalance = (float) DB::table('journal_items as ji')
                            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                            ->where('je.tenant_id', app('current.tenant')->id)
                            ->where('je.party_id', $request->customer_id)
                            ->where('a.code', '1200')
                            ->where('je.is_reversed', 0)
                            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as balance')
                            ->value('balance') ?? 0.0;

                        if ($currentBalance + $creditPortion > (float) $customer->credit_limit) {
                            throw \Illuminate\Validation\ValidationException::withMessages([
                                'customer_id' => ["Credit limit exceeded. Remaining limit is " . ($customer->credit_limit - $currentBalance) . ", attempting to charge " . $creditPortion]
                            ]);
                        }
                    }
                }
            }

            // ── Serial Tracking Validation ──────────────────────────────────────
            // For every item whose product has track_serial = true:
            //  1. The caller must supply a 'serials' array matching the quantity.
            //  2. Each serial must not already exist in product_serials with status='sold'.
            $serialErrors = [];
            foreach ($items as $index => $item) {
                $product = $products->get($item['product_id']);
                if (!$product || !$product->track_serial) continue;

                $qty = (int) ceil((float) ($item['quantity'] ?? 0));
                $serials = $item['serials'] ?? null;

                if (empty($serials) || !is_array($serials) || count($serials) !== $qty) {
                    $serialErrors["items.{$index}.serials"] = [
                        "Serial numbers are required for '{$product->name}'. Expected {$qty}, got " . (is_array($serials) ? count($serials) : 0) . "."
                    ];
                    continue;
                }

                // Check for already-sold serials
                $duplicate = DB::table('product_serials')
                    ->where('tenant_id', app('current.tenant')->id)
                    ->where('product_id', $product->id)
                    ->where('status', 'sold')
                    ->whereIn('serial_number', $serials)
                    ->pluck('serial_number');

                if ($duplicate->isNotEmpty()) {
                    $serialErrors["items.{$index}.serials"] = [
                        "Serial number(s) already sold: " . $duplicate->implode(', ')
                    ];
                }
            }

            if (!empty($serialErrors)) {
                throw \Illuminate\Validation\ValidationException::withMessages($serialErrors);
            }

            // ── S-011 / S-044: manager approval (same rules as the V3 sale route) ──
            // Checked before anything is written. Throws ApprovalRequiredException
            // (→ 422 code=approval_required) when an approval is missing/invalid.
            $saleWarehouseId = $request->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1);
            $approvedBy = \App\Support\PosSaleApprovalGuard::authorize(
                array_map(fn ($ld) => [
                    'index'      => $ld['index'],
                    'product_id' => $ld['product_id'],
                    'name'       => $ld['product']->name,
                    'type'       => $ld['product']->type,
                    'no_stock'   => self::skipsStock($ld['product'], $request),
                    'cost_price' => $ld['product']->cost_price,
                    'paid_qty'   => $ld['qty'],
                    'free_qty'   => $ld['free_qty'],
                    'gross'      => \App\Support\Money::toFloat($ld['gross_minor']),
                    'discount'   => round($ld['item_discount'] + $ld['global_share'], 2),
                    'revenue'    => $ld['revenue'],
                ], $lineItemsData),
                app('current.tenant')->id,
                Auth::id(),
                $request->input('approved_by'),
                $request->filled('approval_pin') ? (string) $request->input('approval_pin') : null,
                $saleWarehouseId,
                $isStockEnabled
            );

            // ── Maker-Checker Approval Interception for Administrative Invoices ──
            // R01 FIX: This is the admin invoice route (POST /sales), not the POS checkout
            // route. POS clearance MUST NOT be granted here — ever.
            //
            // The correct POS checkout route is POST /pos/sales → PosSaleController, which
            // server-verifies the register shift before passing isTrustedPos=true.
            //
            // The following client-controlled signals were incorrectly treated as POS trust:
            //   - $hasActiveShift: a cashier's open shift does NOT exempt admin invoices
            //   - $approvedBy !== null: manager PIN approves below-cost/discounted products
            //     (PosSaleApprovalGuard), NOT the document-level approval workflow
            //   - source === 'pos': client-supplied field, trivially forgeable
            //
            // isTrustedPos is always false on this route. The approval policy resolver's
            // "trusted_pos_clearance" early return is only meaningful when called from
            // PosSaleController with a server-verified shift.
            $user = auth()->user();
            // Request attributes cannot be supplied by the client. Only
            // PosSaleController sets this after verifying the current user's
            // open register shift in the current tenant.
            $isTrustedPos = $request->attributes->get('trusted_pos_verified') === true;

            $policyResolver = app(\App\Services\Approval\ApprovalPolicyResolver::class);
            $policy = $policyResolver->resolve(
                tenant: $currentTenant,
                user: $user,
                documentType: \App\Models\ApprovalDocument::TYPE_SALES_INVOICE,
                amount: (float)$invoiceTotal,
                isTrustedPos: $isTrustedPos
            );

            if ($policy['requires_approval']) {
                if ($deferStock) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'deliver_later' => ['A sale that needs approval cannot be "deliver later" yet. Take stock out at sale time, or ask an approver to raise it.'],
                    ]);
                }
                DB::rollBack();
                $approvalEngine = app(\App\Services\Approval\ApprovalExecutionEngine::class);
                $doc = $approvalEngine->submit(
                    tenant: $currentTenant,
                    maker: $user,
                    documentType: \App\Models\ApprovalDocument::TYPE_SALES_INVOICE,
                    payload: $request->all(),
                    amount: (float)$invoiceTotal,
                    description: 'Sales invoice — ' . ($request->input('reference_number') ?? ''),
                    idempotencyKey: $idempotencyKey
                );

                if ($request->wantsJson() || $request->expectsJson()) {
                    return response()->json([
                        'status'               => 'pending_approval',
                        'approval_document_id' => $doc->id,
                        'document_number'      => $doc->document_number,
                        'message'              => 'Sales invoice submitted for approval.',
                    ], 202);
                }

                return redirect()->back()->with('info', 'Sales invoice submitted for approval.');
            }

            if ($allocation['tender_report_ignored'] !== null) {
                \App\Support\SaleEvents::record('tender_report_ignored', [
                    'intent_key' => $idempotencyKey,
                    'reported'   => \App\Support\Money::toString($allocation['tender_report_ignored']),
                    'recorded'   => \App\Support\Money::toString($allocation['tendered']),
                ], 'warning');
            }
            $tendered = \App\Support\Money::toFloat($allocation['tendered']);
            $changeReturn = \App\Support\Money::toFloat($allocation['change']);
            $addToLedger = $request->boolean('add_to_ledger') && $request->customer_id;
            $shiftId = $request->input('register_shift_id');
            if (!$shiftId) {
                $shiftId = \App\Models\RegisterShift::where('tenant_id', app('current.tenant')->id)
                    ->where('status', 'open')
                    ->where(function ($q) use ($request) {
                        if ($request->filled('register_id')) {
                            $q->where('register_id', $request->register_id);
                        } else {
                            $q->where('opened_by', Auth::id());
                        }
                    })
                    ->latest('id')
                    ->value('id');
            }

            $sale = Sale::withoutEvents(function () use ($request, $subtotalGross, $totalTax, $globalDiscount, $invoiceTotal, $totalItemDiscounts, $netSales, $deliveryCharge, $extraCharge, $serviceCharge, $tipAmount, $tendered, $changeReturn, $roundOff, $shiftId, $allocation, $requestHash) {
                return Sale::create(\App\Services\Sales\CheckoutIntent::withIntentColumns([
                    'id'                   => $request->input('id', \Illuminate\Support\Str::uuid()->toString()),
                    'tenant_id'            => app('current.tenant')->id,
                    'register_shift_id'    => $shiftId,
                    'reference_number'     => \App\Services\SequenceService::generateTransactionNumber('SAL'),
                    'idempotency_key'      => $request->header('Idempotency-Key') ?: $request->input('idempotency_key'),
                    'source'               => $request->source === 'pos' ? 'pos' : 'manual',
                    'party_id'             => $request->customer_id ?: \App\Models\Party::firstOrCreate(['phone' => '0000000000', 'name' => 'Walk-in Customer'], ['type' => 'customer'])->id,
                    'walk_in_name'         => $request->customer_id ? null : (trim((string) $request->input('walk_in_name')) ?: null),
                    'occupancy_id'         => self::ownedOccupancyId($request->input('occupancy_id')),
                    'order_type'           => in_array($request->input('order_type'), ['dine_in', 'takeaway', 'delivery'], true) ? $request->input('order_type') : null,
                    'user_id'              => Auth::id() ?? 1,
                    'order_taker_id'       => $request->input('order_taker_id', Auth::id()),
                    'warehouse_id'         => $request->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1),
                    'subtotal'             => $subtotalGross,
                    'tax'                  => $totalTax,
                    'discount'             => $globalDiscount,
                    'total'                => $invoiceTotal,
                    'subtotal_gross'       => $subtotalGross,
                    'total_item_discounts' => $totalItemDiscounts,
                    'global_discount'      => $globalDiscount,
                    'net_sales'            => $netSales,
                    'total_tax'            => $totalTax,
                    'delivery_charge'      => $deliveryCharge,
                    'shipping_charges'     => $deliveryCharge,
                    'extra_charge_value'   => $extraCharge,
                    'extra_charge_label'   => $request->extra_charge_label,
                    'service_charge'       => $serviceCharge,
                    'tip_amount'           => $tipAmount,
                    'invoice_total'        => $invoiceTotal,
                    'tendered_amount'      => $tendered,
                    'change_return'        => $changeReturn,
                    'round_off'            => $roundOff,
                    'status'               => 'posted',
                    /* `created_at` is when the sale was entered; `posted_at` is the
                       date it belongs to, and it is what every report groups by. An
                       invoice dated last Friday has to land in last Friday's takings,
                       so the operator's date wins here - keeping the clock so two
                       sales on one day still sort in the order they were rung up. */
                    'posted_at'            => (function () use ($request) {
                        $d = $request->input('sale_date', $request->input('date'));
                        if (!$d) {
                            // A queued/replayed till sale belongs to the moment it
                            // was rung, not the day it reached the server. Closed
                            // periods are still refused by AccountingPeriodGuard.
                            return \App\Services\Sales\CheckoutIntent::accountingTimeFrom($request->input('occurred_at')) ?? now();
                        }
                        try {
                            $parsed = Carbon::parse($d);
                            return $parsed->isSameDay(now())
                                ? now()
                                : $parsed->setTimeFrom(now());
                        } catch (\Throwable $e) {
                            return now();
                        }
                    })(),
                    // From money actually applied — not from what was handed over.
                    'payment_status'       => $allocation['payment_status'],
                    'payment_method'       => $request->payment_method,
                    'due_date'             => \App\Services\PlanRepository::canUseFeature(app('current.tenant'), 'payment_due_dates') ? $request->input('due_date') : null,
                    'is_dropship'          => $request->input('is_dropship', false),
                    /* Both screens have had a note field for as long as they have
                       existed and neither one was ever stored. */
                    'notes'                => $request->input('notes'),
                ], [
                    'idempotency_request_hash' => $requestHash,
                    'calculation_version'      => \App\Services\Sales\SaleTotals::VERSION,
                    'occurred_at'              => \App\Services\Sales\CheckoutIntent::occurredAt($request->input('occurred_at')),
                ]));
            });

            if ($deferStock) {
                // Stock and cost of goods are posted when goods are dispatched.
                DB::table('sales')->where('id', $sale->id)->update(['stock_at_dispatch' => 1, 'delivery_status' => 'pending']);
            }

            // 4. STORAGE: Process Items, Stock, and FIFO
            $totalCogs = 0;
            foreach ($lineItemsData as $ld) {
                $product = $ld['product'];
                $totalQty = $ld['qty'] + $ld['free_qty'];

                if ($isStockEnabled && !$deferStock && $product->type !== 'service' && !self::skipsStock($product, $request) && !$sale->is_dropship) {
                    $stock = \App\Models\Stock::where('product_id', $ld['product_id'])->where('warehouse_id', $sale->warehouse_id)->first();
                    $avail = $stock ? $stock->quantity : 0;

                    if ($avail < $totalQty && $autoMfg->hasManufacturingRules($ld['product_id'])) {
                        $mfg = $autoMfg->manufactureByProductId($ld['product_id'], $totalQty - max(0, $avail), $sale);
                        if ($mfg['success']) $manufacturingNotifications[] = $mfg['notification'];
                    }

                    if ($stopNegative && ($avail < $totalQty)) {
                        throw new \App\Exceptions\InsufficientStockException(
                            $ld['product_id'],
                            $sale->warehouse_id,
                            $totalQty,
                            $avail
                        );
                    }
                }

                $saleItem = SaleItem::create(\App\Services\Sales\CheckoutIntent::withLineColumns([
                    'sale_id' => $sale->id,
                    'product_id' => $ld['product_id'],
                    'product_variant_id' => $ld['variant_id'],
                    'quantity' => $ld['qty'],
                    'free_quantity' => $ld['free_qty'],
                    'unit_price' => $ld['unit_price'],
                    'cost_price' => $product->cost_price ?? 0,
                    'gross_amount' => \App\Support\Money::toFloat($ld['gross_minor']),
                    'discount_amount' => $ld['item_discount'], // pure item-level discount, no freeValue mixed in
                    'net_amount' => $ld['net'],
                    'tax_amount' => $ld['tax_amt'],
                    'subtotal' => \App\Support\Money::toFloat($ld['gross_minor']),
                    'line_total' => round($ld['net'] + $ld['tax_amt'], 2),
                    'modifiers' => $ld['modifiers'] ?: null,
                ], [
                    // What this line BOOKED — returns refund exactly this, pro rata.
                    'revenue_amount'      => $ld['revenue'],
                    'bill_discount_share' => $ld['global_share'],
                ]));

                if ($deferStock && !empty($ld['batch_id'])) {
                    // Remembered until dispatch, when the stock actually moves.
                    DB::table('sale_items')->where('id', $saleItem->id)->update(['preferred_batch_id' => $ld['batch_id']]);
                }

                // Serial Number Recording
                // Stamped with the store: a raw insert gets no HasTenant fill,
                // and a NULL tenant_id row is invisible to this store's own
                // serial screens (ProductSerial is tenant-scoped). An existing
                // row (e.g. received 'available' on a purchase) is updated in
                // place — updateOrInsert() used to overwrite its primary key.
                if ($product->track_serial && !empty($ld['serials'])) {
                    foreach ($ld['serials'] as $serial) {
                        $serialKey = [
                            'tenant_id'     => $sale->tenant_id,
                            'product_id'    => $ld['product_id'],
                            'serial_number' => $serial,
                        ];
                        $soldAs = [
                            'status'       => 'sold',
                            'sale_id'      => $sale->id,
                            'warehouse_id' => $sale->warehouse_id,
                            'updated_at'   => now(),
                        ];
                        // product_id is this store's own, so a row saved before
                        // the stamp (tenant_id NULL) is claimed here too.
                        $existingSerialId = DB::table('product_serials')
                            ->where('product_id', $ld['product_id'])
                            ->where('serial_number', $serial)
                            ->where(fn ($q) => $q->where('tenant_id', $sale->tenant_id)->orWhereNull('tenant_id'))
                            ->value('id');
                        if ($existingSerialId) {
                            DB::table('product_serials')->where('id', $existingSerialId)
                                ->update($soldAs + ['tenant_id' => $sale->tenant_id]);
                        } else {
                            DB::table('product_serials')->insert($serialKey + $soldAs + [
                                'id'         => \Illuminate\Support\Str::uuid()->toString(),
                                'created_at' => now(),
                            ]);
                        }
                    }
                }

                // FIFO Deduction
                //
                // L006 FIX (COGS integrity): For any stock-tracked product we ALWAYS
                // deduct through FifoService::deductStock(). That method is the single
                // source of COGS truth — it returns real, batch-derived costs and, on a
                // stockout, either (a) creates a proper negative_stock inventory_batches
                // row with a genuine cost basis and writes the matching sale_item_batches
                // audit rows, or (b) throws InsufficientStockException when the merchant
                // has "stop negative stock" enabled. That exception is caught by the
                // outer transaction handler in this method and returned as a clean 422
                // (the whole sale rolls back), so NOTHING is half-posted.
                //
                // We deliberately DO NOT catch-and-fabricate here. Previously a FIFO
                // failure or a stockout silently fell back to (cost_price * qty) with no
                // sale_item_batches row — posting an invented COGS to the ledger and
                // corrupting P&L / inventory valuation with no audit trail. That is the
                // exact defect L006 removes. The only remaining path that uses the
                // product's flat cost_price is when stock tracking is DISABLED for the
                // product (service / non-inventory items that legitimately have no batches).
                $itemCogs = 0;
                if ($deferStock && $product->type !== 'service' && !self::skipsStock($product, $request)) {
                    // Deliver later: nothing leaves the shelf and no cost is booked yet.
                    $deductions = null;
                } elseif ($isStockEnabled && $product->type !== 'service' && !self::skipsStock($product, $request)) {
                    // Let InsufficientStockException propagate — the outer catch turns it
                    // into a clean 422 + full rollback. No fabrication, no partial post.
                    $deductions = app(\App\Engines\FifoService::class)->deductStock($ld['product_id'], $sale->warehouse_id, $totalQty, preferredBatchId: $ld['batch_id'] ?? null);
                    foreach ($deductions as $d) {
                        $itemCogs += $d['total_cost'];
                        DB::table('sale_item_batches')->insert([
                            'id'                 => \Illuminate\Support\Str::uuid()->toString(),
                            'tenant_id'          => $sale->tenant_id,
                            'sale_item_id'       => $saleItem->id,
                            'inventory_batch_id' => $d['batch_id'],
                            'qty_deducted'       => $d['qty_taken'],
                            'unit_cost'          => $d['unit_cost'],
                            'total_cogs'         => $d['total_cost'],
                            'created_at' => now(), 'updated_at' => now(),
                        ]);
                    }
                    $saleItem->update(['cost_price' => $totalQty > 0 ? $itemCogs / $totalQty : 0]);
                } else {
                    // Stock tracking disabled for this product: no inventory_batches exist,
                    // so the product's configured cost_price is the correct (not fabricated)
                    // cost basis. This is an explicit, intended path — not a silent fallback.
                    $itemCogs = ($product->cost_price ?? 0) * $totalQty;
                    $deductions = null;
                }
                $totalCogs += $itemCogs;

                // S-011 safety net: re-check against the cost actually consumed
                // (throws → full rollback, same 422 as the pre-check).
                $approvedBy = \App\Support\PosSaleApprovalGuard::assertPostedCostCovered(
                    ['index' => $ld['index'], 'product_id' => $ld['product_id'], 'name' => $product->name, 'paid_qty' => $ld['qty'], 'revenue' => $ld['revenue']],
                    $deductions,
                    (float) ($product->cost_price ?? 0) * $ld['qty'],
                    $approvedBy,
                    $sale->tenant_id,
                    Auth::id()
                );

                // Legacy Stock Update
                if ($isStockEnabled && !$deferStock && $product->type !== 'service' && !self::skipsStock($product, $request)) {
                    if ($ld['variant_id']) {
                        ProductVariant::find($ld['variant_id'])?->decrement('stock', $totalQty);
                    } else {
                        $stockRecord = \App\Models\Stock::where('product_id', $ld['product_id'])
                            ->where('warehouse_id', $sale->warehouse_id)
                            ->first();
                        if ($stockRecord) {
                            $stockRecord->decrement('quantity', $totalQty);
                        } else {
                            \App\Models\Stock::create([
                                'product_id' => $ld['product_id'],
                                'warehouse_id' => $sale->warehouse_id,
                                'quantity' => -$totalQty,
                            ]);
                        }
                    }
                    Product::where('id', $ld['product_id'])->decrement('stock_quantity', $totalQty);
                    StockMovement::create([
                        'product_id' => $ld['product_id'], 'warehouse_id' => $sale->warehouse_id,
                        'type' => 'sale', 'quantity' => -$totalQty, 'reference_id' => $sale->reference_number, 'user_id' => Auth::id(),
                    ]);
                }
            }

            // 5. ACCOUNTING: Unified Journal Entry
            $this->postSaleJournal($sale, $request, $calc, $allocation, $totalCogs, $approvedBy);

            // 6. INTEGRATIONS: FBR — queued in the sale's own transaction, sent
            // after commit (never while holding the sale's locks), retried by
            // `fbr:flush-outbox` when FBR cannot be reached.
            $fbrEnabled = \App\Helpers\SettingsHelper::get('fbr_integration') == '1';
            if ($fbrEnabled) {
                \App\Services\Fbr\FbrOutbox::enqueue($sale);
            }

            DB::commit();

            if ($fbrEnabled && DB::transactionLevel() === $fbrBaseLevel) {
                try {
                    \App\Services\Fbr\FbrOutbox::deliverForSale($sale->id);
                    $sale->refresh();
                } catch (\Throwable $fbrError) {
                    \App\Support\SaleEvents::record('fbr_post_commit_failed', [
                        'sale_id' => $sale->id, 'error' => $fbrError->getMessage(),
                    ], 'warning');
                }
            }

            // 7. AUDIT: Activity Log. The sale is COMMITTED: nothing after this
            // point may turn it into an apparent failure (a 500 here used to make
            // the till queue a sale that already existed).
            try {
                \App\Models\Activity::create([
                    'type' => 'sale', 'reference_id' => $sale->id, 'reference_type' => 'sale', 'user_id' => Auth::id(),
                    'amount' => $invoiceTotal, 'description' => 'Sale #' . $sale->reference_number,
                    'metadata' => json_encode(['reference' => $sale->reference_number, 'total' => $invoiceTotal]),
                ]);
            } catch (\Throwable $activityError) {
                \App\Support\SaleEvents::record('post_commit_activity_failed', [
                    'sale_id' => $sale->id, 'intent_key' => $idempotencyKey, 'error' => $activityError->getMessage(),
                ], 'warning');
            }

            return response()->json(\App\Services\Sales\CheckoutIntent::canonicalResponse($sale, [
                'notifications' => $manufacturingNotifications,
            ]));

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'code' => 'validation_failed', 'outcome' => 'rejected', 'errors' => $e->errors(), 'message' => $e->getMessage()], 422);
        } catch (\App\Exceptions\MoneyException $e) {
            DB::rollBack();
            // Nothing was written: the amounts were refused before posting.
            \App\Support\SaleEvents::record('sale_amount_rejected', [
                'code' => $e->errorCode, 'intent_key' => $idempotencyKey, 'message' => $e->getMessage(),
                'calculation_version' => $request->input('calculation_version'),
            ], 'warning');
            return response()->json([
                'success' => false, 'code' => $e->errorCode, 'outcome' => 'rejected',
                'message' => $e->getMessage(),
                'errors'  => [$e->errorCode === 'walk_in_unpaid' ? 'customer_id' : 'amount' => [$e->getMessage()]],
            ], 422);
        } catch (\App\Exceptions\ApprovalRequiredException $e) {
            DB::rollBack();
            return response()->json($e->payload() + ['outcome' => 'rejected'], 422);
        } catch (\App\Exceptions\PeriodLockedException $e) {
            DB::rollBack();
            // e.g. an offline sale replayed after its period was closed: nothing is
            // written; the till keeps the intent for a manager to resolve.
            return response()->json(['success' => false, 'code' => 'period_locked', 'outcome' => 'rejected', 'message' => $e->getMessage()], 422);
        } catch (\App\Exceptions\InsufficientStockException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'code' => 'insufficient_stock', 'outcome' => 'rejected', 'message' => $e->getMessage()], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            // L038: lost the race on the (tenant_id, idempotency_key) unique index —
            // a concurrent request with this key already created the sale. Answer
            // with that sale (or a conflict if its content differs).
            if ($idempotencyKey && str_contains($e->getMessage(), 'sales_tenant_idempotency_unique')) {
                $tenantId = $currentTenant?->id ?? auth()->user()?->tenant_id;
                $replay = $tenantId ? self::idempotentReplay($tenantId, (string) $idempotencyKey, $requestHash) : null;
                if ($replay) {
                    return $replay;
                }
            }
            return self::uncertainFailure($e, $idempotencyKey, $request);
        } catch (\Exception $e) {
            DB::rollBack();
            if (str_contains($e->getMessage(), 'Insufficient stock')) {
                return response()->json(['success' => false, 'code' => 'insufficient_stock', 'outcome' => 'rejected', 'message' => $e->getMessage()], 422);
            }
            return self::uncertainFailure($e, $idempotencyKey, $request);
        }
    }

    /**
     * A failure we did not plan for. The transaction was rolled back, but the
     * caller cannot assume that (a lost response looks the same), so the body
     * says "unknown" and carries a correlation id; the till keeps the intent and
     * asks the status endpoint with the same key. Raw exception text is logged,
     * not sent.
     */
    private static function uncertainFailure(\Throwable $e, ?string $intentKey, Request $request)
    {
        $correlationId = \App\Support\SaleEvents::correlationId();
        \App\Support\SaleEvents::record('sale_store_failed', [
            'intent_key' => $intentKey,
            'exception'  => get_class($e),
            'error'      => mb_substr($e->getMessage(), 0, 500),
            'file'       => $e->getFile() . ':' . $e->getLine(),
            'calculation_version' => $request->input('calculation_version'),
        ], 'error');
        report($e);
        return response()->json([
            'success'        => false,
            'code'           => 'server_error',
            'outcome'        => 'unknown',
            'correlation_id' => $correlationId,
            'message'        => 'The sale could not be confirmed (ref ' . $correlationId . '). Do not ring it again — it will be checked with the same receipt key.',
        ], 500);
    }

    /**
     * Same key seen before in this store: return the canonical committed sale,
     * or 409 when the content differs. Sales saved before the request hash
     * existed keep the old behaviour (returned as-is).
     */
    public static function idempotentReplay($tenantId, string $key, ?string $requestHash)
    {
        // Every scope off (tenant AND soft-delete): an archived sale still owns its key.
        $existing = Sale::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('idempotency_key', $key)
            ->first();
        if (!$existing) {
            return null;
        }
        $storedHash = $existing->getAttribute('idempotency_request_hash');
        if ($storedHash && $requestHash && !hash_equals($storedHash, $requestHash)) {
            \App\Support\SaleEvents::record('idempotency_conflict', ['intent_key' => $key, 'sale_id' => $existing->id], 'warning');
            return response()->json([
                'success' => false,
                'code'    => 'idempotency_conflict',
                'outcome' => 'conflict',
                'message' => 'This receipt key was already used for a different sale (' . $existing->reference_number . '). Nothing was changed.',
                'sale_id' => $existing->id,
                'reference' => $existing->reference_number,
            ], 409);
        }
        return response()->json(\App\Services\Sales\CheckoutIntent::canonicalResponse($existing, [
            'idempotent' => true,
            'message'    => 'Sale already recorded for this request.',
        ]), 200);
    }

    /**
     * Turn request lines into the contract-v2 calculation and the per-line data
     * the rest of store() writes. Lines whose product cannot be found are left
     * out, exactly as before.
     *
     * @return array{0: array, 1: array}
     */
    private function calculateSaleLines(Request $request, array $items, $products, bool $strict): array
    {
        $taxExempt = $request->boolean('tax_exempt');
        $saleRate = $request->input('tax_rate', \App\Helpers\SettingsHelper::getDefaultTaxRate());
        $taxInclusive = (bool) $request->input('tax_inclusive', false);
        $known = [];
        $input = ['lines' => []];
        foreach ($items as $itemIndex => $item) {
            $product = $products->get($item['product_id']);
            if (!$product) {
                continue;
            }
            $known[] = [$itemIndex, $item, $product];
            $input['lines'][] = [
                'unit_price' => $item['price'],
                'qty'        => $item['quantity'],
                'free_qty'   => $item['free_quantity'] ?? 0,
                'discount'   => $item['discount'] ?? 0,
                /* "No tax on this sale" beats a product's own rate; otherwise a
                   product's own rate beats the sale rate (unchanged rule). */
                'tax_rate'   => $product->tax_rate !== null ? (string) $product->tax_rate : null,
                'tax_type'   => $item['tax_type'] ?? $request->input('tax_type', 'percentage'),
            ];
        }
        $input['bill_discount'] = ['type' => 'fixed', 'value' => $request->input('discount', 0) ?? 0];
        $input['tax'] = ['enabled' => !$taxExempt, 'inclusive' => $taxInclusive, 'default_rate' => $saleRate ?? 0];
        // Legacy-client adapter (bounded, explicit): tills before contract v2 sent a
        // "Delivery fee" twice — as delivery_charge AND extra_charge_value — and the
        // server summed both. Only that exact signature is folded back to one charge.
        $deliveryIn = $request->input('delivery_charge', 0) ?? 0;
        $extraIn = $request->input('extra_charge_value', 0) ?? 0;
        if (!$strict && (float) $deliveryIn > 0 && (string) (float) $deliveryIn === (string) (float) $extraIn
            && preg_match('/delivery/i', (string) $request->input('extra_charge_label'))) {
            $extraIn = 0;
            \App\Support\SaleEvents::record('legacy_delivery_double_folded', ['amount' => (string) $deliveryIn]);
        }
        $input['charges'] = [
            'delivery' => $deliveryIn,
            'extra'    => $extraIn,
            'service'  => $request->input('service_charge', 0) ?? 0,
            'tip'      => $request->input('tip_amount', 0) ?? 0,
        ];
        // The till's round-off switch decides WHETHER; the store setting decides to what.
        $input['bill_rounding'] = [
            'apply'   => $request->has('bill_rounding') ? $request->boolean('bill_rounding') : true,
            'setting' => \App\Helpers\SettingsHelper::get('round_off_total'),
        ];

        $calc = \App\Services\Sales\SaleTotals::calculate($input, $strict);
        $m = fn (int $minor) => \App\Support\Money::toFloat($minor);

        $lineItemsData = [];
        foreach ($known as $k => [$itemIndex, $item, $product]) {
            $r = $calc['lines'][$k];
            $lineItemsData[] = [
                'index'         => $itemIndex,
                'product'       => $product,
                'product_id'    => $item['product_id'],
                'variant_id'    => $item['variant_id'] ?? null,
                'qty'           => (float) $item['quantity'],
                'free_qty'      => (float) ($item['free_quantity'] ?? 0),
                'unit_price'    => (float) $item['price'],
                'gross_minor'   => $r['gross'],
                'gross'         => $m($r['gross'] + $r['free']),
                'discount'      => $m($r['discount'] + $r['free']),  // incl. free items (for totals)
                'item_discount' => $m($r['discount']),               // pure row discount (saved to DB)
                'discount_type' => $item['discount_type'] ?? 'fixed',
                'net'           => $m($r['net']),
                'tax_rate'      => $taxExempt ? 0.0 : (float) ($input['lines'][$k]['tax_rate'] ?? $saleRate ?? 0),
                'tax_type'      => $input['lines'][$k]['tax_type'],
                'tax_amt'       => $m($r['tax']),
                'global_share'  => $m($r['bill_share']),
                'revenue'       => $m($r['revenue']),
                'serials'       => $item['serials'] ?? [],
                'batch_id'      => $item['batch_id'] ?? null,
                'modifiers'     => self::cleanModifiers($item['modifiers'] ?? []),
            ];
        }
        return [$calc, $lineItemsData];
    }

    /**
     * GET /s/{store}/sales/approvers — who can approve a POS sale that needs
     * it (S-011 below cost / S-044 over-limit discount): the active owners,
     * admins and managers of THIS store, for the POS approval modal. Guarded
     * by the same permission as checkout. Exposes no PINs — only whether one
     * is set, since an approver other than the cashier must enter theirs.
     */
    public function approvers()
    {
        $tenantId = app('current.tenant')->id;
        $actorId  = Auth::id();

        $approvers = \App\Models\TenantUser::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->whereIn('role', \App\Support\ManagerApproval::ROLES)
            ->with('user:id,name')
            ->get()
            ->map(fn ($m) => [
                'user_id'        => (string) $m->user_id,
                'name'           => $m->display_name ?: ($m->user?->name ?? 'Unknown'),
                'role'           => $m->role,
                'is_self'        => (string) $m->user_id === (string) $actorId,
                'has_pin'        => !empty($m->security_pin),
                'discount_limit' => \App\Support\ManagerApproval::discountLimit($m->role, $tenantId),
            ])
            ->sortByDesc('is_self')
            ->values();

        return response()->json(['approvers' => $approvers]);
    }

    public function dashboard()
    {
        $tz = app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
        
        // Local date Carbon instances (for toDateString() and ledger reports)
        $localToday = \Carbon\Carbon::today($tz);
        $localYesterday = \Carbon\Carbon::yesterday($tz);
        $localStartOfMonth = \Carbon\Carbon::now($tz)->startOfMonth();
        $localStartOfLastMonth = \Carbon\Carbon::now($tz)->subMonth()->startOfMonth();
        $localEndOfLastMonth = \Carbon\Carbon::now($tz)->subMonth()->endOfMonth();
        $localSub30Days = \Carbon\Carbon::now($tz)->subDays(30);

        // UTC timestamps (for database created_at comparisons)
        $todayStart = $localToday->copy()->startOfDay()->utc();
        $todayEnd = $localToday->copy()->endOfDay()->utc();
        
        $yesterdayStart = $localYesterday->copy()->startOfDay()->utc();
        $yesterdayEnd = $localYesterday->copy()->endOfDay()->utc();
        
        $startOfMonth = $localStartOfMonth->copy()->startOfDay()->utc();
        $startOfLastMonth = $localStartOfLastMonth->copy()->startOfDay()->utc();
        $endOfLastMonth = $localEndOfLastMonth->copy()->endOfDay()->utc();
        
        $sub30Days = $localSub30Days->copy()->startOfDay()->utc();

        // 1. Sales & Orders Today (Ledger-derived via FinancialReportingService)
        $todayRevenue = (float) $this->frs->getProfitAndLoss($localToday->toDateString(), $localToday->toDateString())['revenue'];
        $yesterdayRevenue = (float) $this->frs->getProfitAndLoss($localYesterday->toDateString(), $localYesterday->toDateString())['revenue'];
        $todayCount = Sale::where('status', '!=', 'returned')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        $dailyGrowth = $yesterdayRevenue > 0 
            ? (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100 
            : ($todayRevenue > 0 ? 100 : 0);

        // 2. Monthly Net Sales (Ledger-derived via FinancialReportingService)
        $monthRevenue = (float) $this->frs->getProfitAndLoss($localStartOfMonth->toDateString(), $localToday->toDateString())['revenue'];
        $lastMonthRevenue = (float) $this->frs->getProfitAndLoss($localStartOfLastMonth->toDateString(), $localEndOfLastMonth->toDateString())['revenue'];
        
        $monthCount = Sale::where('status', '!=', 'returned')
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        $lastMonthCount = Sale::where('status', '!=', 'returned')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->count();

        $monthlyGrowth = $lastMonthRevenue > 0 
            ? (($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : ($monthRevenue > 0 ? 100 : 0);

        // 3. Average Order Value
        $averageOrderValue = $monthCount > 0 ? $monthRevenue / $monthCount : 0;
        
        // Avg Growth
        $avgLastMonth = $lastMonthCount > 0 ? $lastMonthRevenue / $lastMonthCount : 0;
        $avgGrowth = $avgLastMonth > 0 ? (($averageOrderValue - $avgLastMonth) / $avgLastMonth) * 100 : 0;

        // 4. Active Customers
        $activeCustomers = Sale::where('status', '!=', 'returned')
            ->where('created_at', '>=', $sub30Days)
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count('customer_id');

        // Recent Sales (Optimized Select & Relations)
        $recentSales = Sale::where('status', 'posted')
            ->select('id', 'reference_number', 'total', 'payment_status', 'party_id', 'created_at')
            ->with(['party:id,name'])
            ->latest()
            ->take(5)
            ->get();

        $tenantId = app('current.tenant')->id;

        // Top Selling Products — net_amount is permanently backfilled, no COALESCE needed
        $topSelling = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', '!=', 'returned')
            ->whereBetween('sales.created_at', [$todayStart, $todayEnd])
            ->select(
                'products.name',
                'products.price',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.net_amount) as revenue'),
                DB::raw('(
                    COALESCE((
                        SELECT SUM(sib.total_cogs)
                        FROM sale_item_batches sib
                        WHERE sib.sale_item_id = sale_items.id
                    ), sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity,0)))
                ) as cogs')
            )
            ->groupBy('products.id', 'products.name', 'products.price')
            ->orderByDesc('qty')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $item->gross_profit = round((float)$item->revenue - (float)$item->cogs, 2);
                return $item;
            });

        // Sales by Payment Method — use net_sales for accurate revenue breakdown
        $salesByMethod = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('status', '!=', 'returned')
            ->where('created_at', '>=', $startOfMonth)
            ->select('payment_method', DB::raw('SUM(net_sales) as total'))
            ->groupBy('payment_method')
            ->get();


        $data = [
            'stats' => [
                'sales_today' => $todayRevenue,
                'sales_today_growth' => round($dailyGrowth, 1),
                'orders_today' => $todayCount,
                'sales_month' => $monthRevenue,
                'sales_month_growth' => round($monthlyGrowth, 1),
                'orders_month' => $monthCount,
                'avg_order_value' => round($averageOrderValue, 0),
                'avg_order_growth' => round($avgGrowth, 1),
                'active_customers' => $activeCustomers,
            ],
            'recentSales' => $recentSales,
            'topSelling' => $topSelling,
            'salesByMethod' => $salesByMethod
        ];

        if (!request()->header('X-Inertia') && (request()->wantsJson() || request()->ajax())) {
            return response()->json($data);
        }

        return Inertia::render('Sales/Dashboard', $data);
    }

    public function index(Request $request)
    {
        $query = Sale::with(['customer', 'user', 'items.product', 'ecommerceChannel'])->withSum('payments as paid_amount', 'amount');

        // Apply Search
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('reference_number', 'like', "%{$request->search}%")
                    ->orWhereHas('customer', function ($q) use ($request) {
                        $q->where('name', 'like', "%{$request->search}%");
                    })
                    ->orWhereHas('party', function ($q) use ($request) { // ADDED THIS
                        $q->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        // Channel filter (Online / POS / Manual) — applies to the list and the stats.
        $channel = (string) $request->input('channel', 'all');
        if (in_array($channel, ['online', 'pos', 'manual'], true)) {
            $query->where('sales.source', $channel);
        }

        // Apply Date Filters
        $tz = app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
        $tzNow = \Carbon\Carbon::now($tz);
        if ($request->filter === 'today') {
            $query->whereBetween('created_at', [$tzNow->copy()->startOfDay(), $tzNow->copy()->endOfDay()]);
        } elseif ($request->filter === 'month') {
            $query->whereBetween('created_at', [$tzNow->copy()->startOfMonth(), $tzNow->copy()->endOfMonth()]);
        } elseif ($request->filter === 'year') {
            $query->whereBetween('created_at', [$tzNow->copy()->startOfYear(), $tzNow->copy()->endOfYear()]);
        }

        // Apply Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        // Apply Sorting
        $sortBy = $request->input('sort_by', 'date');
        $sortDir = $request->input('sort_dir', 'desc');
        // Injection sweep (2026-09-10): sort inputs are whitelisted — sort_dir went
        // straight into orderByRaw() (SQL injection) and unknown columns caused 500s.
        $sortDir = strtolower((string) $sortDir) === 'asc' ? 'asc' : 'desc';
        if (!is_string($sortBy) || !preg_match('/^[a-z_]{1,64}$/', $sortBy)) {
            $sortBy = 'created_at';
        }

        if ($sortBy === 'date') {
            $query->orderBy('created_at', $sortDir);
        } elseif ($sortBy === 'reference') {
            $query->orderBy('reference_number', $sortDir);
        } elseif ($sortBy === 'amount') {
            $query->orderBy('total', $sortDir);
        } elseif ($sortBy === 'status') {
             $query->orderBy('payment_status', $sortDir);
        } elseif ($sortBy === 'party_name') {
            $query->leftJoin('parties', 'sales.party_id', '=', 'parties.id')
                ->select('sales.*')
                ->orderBy('parties.name', $sortDir);
        } else {
            $query->orderBy(\Illuminate\Support\Facades\Schema::hasColumn('sales', $sortBy) ? 'sales.'.$sortBy : 'sales.created_at', $sortDir);
        }

        // ── Stats (computed before pagination, on the full filtered set) ──────
        // Clone the query builder so the filters above apply to stats too,
        // but pagination does NOT — stats must cover the entire filtered result set.
        $statsQuery = (clone $query)->where('status', '!=', 'returned');

        // BUG-03 FIX (CALCULATION_LOGIC.md §8 BUG-03)
        // OLD: sum('total')  — invoice_total, includes tax → inflated revenue figure
        // NEW: sum('net_sales') — true revenue: ex-tax, ex-discount (§2.7 definition)
        $totalSales = (float) $statsQuery->sum('net_sales');

        // Get filtered sale IDs for the payment join
        // Using ->toBase() avoids loading Eloquent overhead on a pluck-only query
        $filteredSaleIds = (clone $statsQuery)->toBase()->pluck('id');

        // BUG-03 FIX: Total collected = SUM of all POSITIVE payments against these sales.
        // RULE (§6 Rule #5): NEVER use payment_status as a financial signal.
        //                     payment_status is a UI badge only.
        // Positive payments = money received from customer
        // Negative payments = refunds issued (already excluded by >0 filter)
        $totalPaid = (float) DB::table('payments')
            ->whereIn('sale_id', $filteredSaleIds)
            ->where('amount', '>', 0)
            ->sum('amount');

        // Outstanding = what was billed (net) minus what was actually collected
        // Never goes negative — a credit balance is not shown on the history stat card
        $totalUnpaid = max(0, $totalSales - $totalPaid);

        // Paginate AFTER stats — pagination must not affect the stat totals
        $sales = $query->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($sales);
        }

        // Online orders still in progress: not a sale yet (nothing posted, no stock taken),
        // so they are listed beside the sales with the Online tag, outside the stats.
        $openOnlineOrders = [];
        if (in_array($channel, ['all', 'online'], true) && !$request->search && $request->user()?->hasPermission('online.orders_view')) {
            $openOnlineOrders = DB::table('commerce_orders')
                ->where('tenant_id', app('current.tenant')->id)
                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])
                ->orderByDesc('created_at')->limit(50)
                ->get(['id', 'public_number', 'status', 'payment_status', 'fulfilment', 'customer_name', 'total', 'created_at'])
                ->map(fn ($o) => [
                    'id' => $o->id, 'number' => $o->public_number, 'status' => $o->status,
                    'payment_status' => $o->payment_status, 'fulfilment' => $o->fulfilment,
                    'customer_name' => $o->customer_name, 'total' => (float) $o->total,
                    'created_at' => \Carbon\Carbon::parse($o->created_at, 'UTC')->toIso8601String(),
                ])->all();
        }

        return Inertia::render('Sales/SalesHistory', [
            'sales'   => $sales,
            'filters' => $request->all(['search', 'filter', 'from_date', 'to_date', 'channel']),
            'open_online_orders' => $openOnlineOrders,
            'stats'   => [
                'total_sale'        => $totalSales,   // net_sales: ex-tax, ex-discount
                'total_paid'        => $totalPaid,    // SUM(payments.amount > 0)
                'total_unpaid'      => $totalUnpaid,  // net_sales - collected
                'transaction_count' => $sales->total(),
            ],
        ]);
    }


    public function show($id)
    {
        $sale = Sale::with(['customer', 'user', 'items.product', 'items.productVariant', 'payments'])
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('reference_number', $id);
            })
            ->firstOrFail();
        
        // Get bank accounts for refund source selection
        $bankAccounts = \App\Models\Account::where('type', 'asset')
            ->where(function($q) {
                $q->where('name', 'like', '%bank%')
                  ->orWhere('code', 'like', '101%'); // Bank accounts typically start with 101x
            })
            ->get(['id', 'name', 'code']);

        if ($sale->customer) {
            $netBalance = PartyBalanceQuery::partyNetBalance(
                $sale->customer->id,
                $sale->tenant_id
            );
            $sale->customer->current_balance = $netBalance;

            $sale->customer_net_balance  = $netBalance;
            $sale->customer_prev_balance = PartyBalanceQuery::partyBalanceExcludingDocument(
                $sale->customer->id,
                $sale->tenant_id,
                $sale->id
            );
            $sale->append(['customer_net_balance', 'customer_prev_balance']);
        }

        if (request()->wantsJson()) {
            return response()->json([
                'sale' => $sale,
                'bankAccounts' => $bankAccounts,
            ]);
        }

        $tenantSlug = app('current.tenant')->slug ?? ($sale->tenant->slug ?? null);

        if ($sale->source === 'pos') {
            return redirect()->route('store.pos', [
                'store_slug' => $tenantSlug,
                'recall' => $sale->id,
            ]);
        }

        return redirect()->route('store.sales.edit', [
            'store_slug' => $tenantSlug,
            'sale' => $sale->id,
        ]);
    }

    public function printReceipt($id)
    {
        $sale = Sale::with(['customer', 'user', 'items.product', 'items.productVariant', 'payments'])->findOrFail($id);
        $settings = \App\Services\ReceiptDocument::prepare($sale)['settings'];
        abort_if(in_array($sale->status, ['draft', 'void', 'voided', 'cancelled'], true), 422, 'This receipt has not been issued.');

        if ($sale->party_id) {
            $sale->customer_net_balance  = PartyBalanceQuery::partyNetBalance($sale->party_id, $sale->tenant_id);
            $sale->customer_prev_balance = PartyBalanceQuery::partyBalanceExcludingDocument(
                $sale->party_id,
                $sale->tenant_id,
                $sale->id
            );
        }

        $pdf = Pdf::loadView('pdf.receipt', [
            'sale'     => $sale,
            'settings' => $settings,
        ])->setOptions(['isRemoteEnabled' => false]);

        $filename = preg_replace('/[^A-Za-z0-9._-]/', '-', (string) $sale->reference_number);
        return $pdf->stream('receipt-' . $filename . '.pdf');
    }

    public function lookup(Request $request)
    {
        $ref = $request->input('ref');
        if (!$ref) {
            return response()->json(['error' => 'Reference required'], 422);
        }
        $sale = Sale::with(['items.product', 'customer'])
            ->where('reference_number', $ref)
            ->firstOrFail();
        return response()->json($sale);
    }

    public function returnSale(Request $request, $id)
    {
        $sale = Sale::with(['items', 'items.saleItemBatches'])->findOrFail($id);

        if (!empty($sale->stock_at_dispatch) && ($sale->delivery_status ?? 'delivered') !== 'delivered') {
            return back()->withErrors(['error' => 'Some goods on this invoice have not been dispatched yet. Finish the dispatch, or void the invoice.']);
        }

        if ($sale->status === 'returned') {
            return back()->withErrors(['error' => 'This sale has already been fully returned.']);
        }

        if (!in_array($sale->status, ['posted', 'partially_returned'])) {
            return back()->withErrors(['error' => "Only posted or partially-returned sales can be returned. Current status: {$sale->status}."]);
        }

        $refundMethod  = $request->input('refund_method', 'cash');
        $refundSource  = $request->input('refund_source', 'cash_drawer');
        $reason        = $request->input('reason', 'Customer return');
        $itemsToReturn = $request->input('items', []);

        // Determine if this is a full or partial return
        $isFullReturn = empty($itemsToReturn) || $this->isFullReturn($sale, $itemsToReturn);

        // ── Approval interception ───────────────────────────────────────────────
        $tenant = app('current.tenant');
        $user   = Auth::user();
        $amount = (float) ($sale->net_sales ?: $sale->total);

        $policy = resolve(ApprovalPolicyResolver::class)->resolve(
            tenant:       $tenant,
            user:         $user,
            documentType: ApprovalDocument::TYPE_SALES_RETURN,
            amount:       $amount,
        );

        if ($policy['requires_approval']) {
            $engineItems = [];
            if (!$isFullReturn) {
                foreach ($itemsToReturn as $item) {
                    if (!empty($item['id']) && (float) ($item['quantity'] ?? 0) > 0) {
                        $engineItems[] = [
                            'sale_item_id' => (string) $item['id'],
                            'return_qty'   => (float) $item['quantity'],
                        ];
                    }
                }
            }
            $doc = resolve(ApprovalExecutionEngine::class)->submit(
                tenant:         $tenant,
                maker:          $user,
                documentType:   ApprovalDocument::TYPE_SALES_RETURN,
                payload:        [
                    '_path'   => $isFullReturn ? 'direct_reversal_full' : 'direct_reversal_partial',
                    'sale_id' => $sale->id,
                    'type'    => 'returned',
                    'reason'  => $reason,
                    'items'   => $engineItems,
                ],
                amount:         $amount,
                description:    'Sale return — ' . $sale->reference_number,
                idempotencyKey: $request->header('Idempotency-Key'),
            );
            $storeSlug = $tenant?->slug ?? $request->route('store_slug') ?? 'default';
            if ($request->wantsJson() || $request->ajax() || $request->expectsJson()) {
                return response()->json([
                    'status'           => 'pending_approval',
                    'pending_approval' => true,
                    'document_number'  => $doc->document_number,
                    'message'          => 'Return submitted for approval (ref: ' . $doc->document_number . ').',
                ], 202);
            }
            return redirect()->route('store.sales.index', ['store_slug' => $storeSlug])
                ->with('info', 'Return submitted for approval (ref: ' . $doc->document_number . ').');
        }
        // ────────────────────────────────────────────────────────────────────────

        try {
            $retVal = DB::transaction(function () use ($sale, $request, $refundMethod, $refundSource, $reason, $itemsToReturn, $isFullReturn, &$returnTotal) {

                if ($isFullReturn) {
                    // ─── FULL RETURN ───────────────────────────────────────────
                    // SaleReversalService handles everything atomically:
                    //   1. Posts a counter journal entry (flips every debit/credit)
                    //   2. Restores FIFO inventory_batches exactly as deducted
                    //   3. Restores stock aggregates
                    //   4. Sets sale status = 'returned'
                    (new \App\Engines\SaleReversalService())->reverse(
                        sale:   $sale,
                        type:   'returned',
                        reason: $reason,
                        userId: Auth::id() ?? 'system'
                    );

                    // BUG-04 FIX: full return reverses net_sales (true revenue)
                    // not total (which is tax-inclusive invoice amount — never equals revenue)
                    $returnTotal = (float) ($sale->net_sales ?: $sale->total);

                } else {
                    // ─── PARTIAL RETURN ────────────────────────────────────────
                    // The same B9 partial return the V3 route posts, through the
                    // same engine (SaleService::reverse), so a return does not
                    // depend on which screen it was keyed on:
                    //   DR 4000 net value of the units | DR 2100 their output tax
                    //   CR 1200 first, for whatever is still owed on the invoice,
                    //      then CR the sale's cash / bank account for the rest
                    //   DR 1100 / CR 5000 at the FIFO cost the units left at
                    // with reference_type 'sale_return', FIFO restored in base
                    // units, returned_quantity / status / payment badge updated.
                    // This path used to post revenue only (no tax), credit the
                    // refund account in full even when the customer still owed
                    // on the invoice, and leave the entry without reference_type.
                    $engineItems = [];
                    foreach ($itemsToReturn as $returnItem) {
                        if (empty($returnItem['id']) || (float) ($returnItem['quantity'] ?? 0) <= 0) {
                            continue;
                        }
                        $engineItems[] = [
                            'sale_item_id' => (string) $returnItem['id'],
                            'return_qty'   => (float) $returnItem['quantity'],
                        ];
                    }

                    if (empty($engineItems)) {
                        return back()->withErrors(['error' => 'Nothing left to return on this sale.']);
                    }

                    $entriesBefore = DB::table('journal_entries')
                        ->where('reference_type', 'sale_return')
                        ->where('source_id', $sale->id)
                        ->pluck('id')
                        ->all();

                    try {
                        app(\App\Engines\SaleService::class)->reverse(
                            saleId: (string) $sale->id,
                            reason: $reason,
                            items:  $engineItems,
                        );
                    } catch (\LogicException $e) {
                        return back()->withErrors(['error' => $e->getMessage()]);
                    }

                    // What was credited back (net + tax) — for the message below.
                    $newEntryIds = DB::table('journal_entries')
                        ->where('reference_type', 'sale_return')
                        ->where('source_id', $sale->id)
                        ->whereNotIn('id', $entriesBefore)
                        ->pluck('id');
                    $returnTotal = round((float) DB::table('journal_items as ji')
                        ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                        ->whereIn('ji.journal_entry_id', $newEntryIds)
                        ->whereIn('a.code', ['4000', '2100'])
                        ->sum('ji.debit'), 2);
                }

                // The refund Payment row of a partial return is recorded by the
                // engine above; a full return reverses the sale's own payments.
            });

            if ($retVal instanceof \Illuminate\Http\RedirectResponse) {
                return $retVal;
            }

            $sourceLabel = match($refundSource) {
                'bank_account' => 'bank transfer',
                'online'       => 'online/card',
                default        => 'cash',
            };

            // Use $returnTotal (the actual amount reversed) not $sale->total (the gross invoice)
            $refundAmount  = number_format((float) $returnTotal, 2);
            $successMessage = $refundMethod === 'ledger'
                ? "Return processed. Rs {$refundAmount} credited to customer khata. Ledger reversed."
                : "Return processed. Rs {$refundAmount} refunded via {$sourceLabel}. Ledger reversed.";

            $storeSlug = app('current.tenant')?->slug ?? request()->route('store_slug') ?? 'default';
            return redirect()->route('store.sales.index', ['store_slug' => $storeSlug])->with('success', $successMessage);

        } catch (\Exception $e) {
            Log::error('Sale Return Error', ['sale_id' => $sale->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Return failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Returns true if the items list covers the full quantity of every sale item.
     * Empty $itemsToReturn means all items are being returned.
     */
    /**
     * Should this line leave stock alone? (FOH plan 2.5)
     *
     * Two independent reasons: the product itself is not stock-tracked
     * (made-to-order menu items), or this is a FOH sale and the store chose
     * "FOH sales never deduct stock". The second reads the store setting on the
     * server - the client's `channel` only says WHERE the sale came from, it can
     * never switch deduction off on its own.
     */
    private static function skipsStock($product, Request $request): bool
    {
        if (isset($product->track_stock) && !$product->track_stock) {
            return true;
        }
        if ($request->input('channel') === 'foh') {
            return \App\Support\FohSettings::stockMode((int) app('current.tenant')->id) === 'never';
        }
        return false;
    }

    /** A sale may only point at an occupancy of its own store; anything else is dropped, not trusted. */
    private static function ownedOccupancyId($id): ?int
    {
        if ($id === null || $id === '' || !is_numeric($id)) return null;
        $ok = \App\Models\Occupancy::where('tenant_id', app('current.tenant')->id)->whereKey((int) $id)->exists();
        return $ok ? (int) $id : null;
    }

    /**
     * Add-ons picked on a line, reduced to what is worth keeping: a name for the
     * receipt and kitchen, and the price move they caused. The line's unit price
     * already includes these; they explain it, they are never added again.
     */
    private static function cleanModifiers($mods): array
    {
        if (!is_array($mods)) return [];
        $out = [];
        foreach (array_slice($mods, 0, 30) as $m) {
            if (!is_array($m)) continue;
            $name = trim((string) ($m['name'] ?? ''));
            if ($name === '') continue;
            $out[] = [
                'id'          => isset($m['id']) ? (string) $m['id'] : null,
                'name'        => mb_substr($name, 0, 80),
                'price_delta' => round((float) ($m['price_delta'] ?? 0), 4),
            ];
        }
        return $out;
    }

    private function isFullReturn(Sale $sale, array $itemsToReturn): bool
    {
        if (empty($itemsToReturn)) return true;

        $returnQtyMap = [];
        foreach ($itemsToReturn as $item) {
            if (isset($item['id'])) {
                $returnQtyMap[$item['id']] = (float) ($item['quantity'] ?? 0);
            }
        }

        foreach ($sale->items as $originalItem) {
            $alreadyReturned     = (float) $originalItem->returned_quantity;
            $remainingReturnable = max(0.0, (float) $originalItem->quantity - $alreadyReturned);

            if ($remainingReturnable <= 0) {
                continue;
            }

            $requestedQty = $returnQtyMap[$originalItem->id] ?? 0.0;
            if ($requestedQty < $remainingReturnable) {
                return false;
            }
        }

        return true;
    }

    /**
     * Park (Hold) a sale for later completion.
     * Deploy D: writes directly to Occupancy (canonical). ParkedSale table retired.
     */
    public function park(Request $request)
    {
        $request->validate([
            'cart_data'     => 'required|array',
            'customer_name' => 'nullable|string',
            'invoice_number'        => 'nullable|string',
            'is_dropship'           => 'boolean',
        ]);

        $tenant = app('current.tenant');
        $uuid   = (string) \Illuminate\Support\Str::uuid();

        // Ensure a counter position exists for this tenant
        $pos = \App\Models\Position::firstOrCreate(
            ['tenant_id' => $tenant->id, 'zone' => 'counter', 'code' => 'CTR'],
            ['label' => 'Counter (Parked)', 'capacity' => 99, 'status' => 'active', 'sort_order' => 9999, 'source_type' => 'parked_sale_slot']
        );

        $occ = \App\Models\Occupancy::create([
            'tenant_id'    => $tenant->id,
            'position_id'  => $pos->id,
            'source_type'  => 'parked_sale',
            'source_id'    => $uuid,
            'label'        => $request->customer_name ?? 'Parked Cart',
            'session_data' => array_merge($request->cart_data, ['customer_name' => $request->customer_name]),
            'opened_by'    => Auth::id(),
            'opened_at'    => now(),
            'expires_at'   => now()->addHours(24),
        ]);

        return response()->json([
            'success'        => true,
            'message'        => 'Sale parked successfully',
            'parked_sale_id' => $occ->source_id,
        ]);
    }

    /**
     * Get all active (non-expired) parked sales.
     * Deploy D: reads from canonical Occupancy table.
     */
    public function getParkedSales()
    {
        $tenant = app('current.tenant');

        $parkedSales = \App\Models\Occupancy::where('tenant_id', $tenant->id)
            ->where('source_type', 'parked_sale')
            ->whereNull('closed_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->where('opened_by', Auth::id())
            ->orderBy('opened_at', 'desc')
            ->get()
            ->map(fn ($occ) => [
                'id'            => $occ->source_id,
                'cart_data'     => $occ->session_data,
                'customer_name' => $occ->label !== 'Parked Cart' ? $occ->label : null,
                'expires_at'    => $occ->expires_at,
                'created_at'    => $occ->opened_at,
            ]);

        return response()->json([
            'parked_sales' => $parkedSales,
        ]);
    }

    /**
     * Recall (load) a parked sale.
     * Deploy D: reads from canonical Occupancy table via source_id.
     */
    public function recall($id)
    {
        $tenant = app('current.tenant');

        $occ = \App\Models\Occupancy::where('tenant_id', $tenant->id)
            ->where('source_type', 'parked_sale')
            ->where('source_id', (string) $id)
            ->whereNull('closed_at')
            ->first();

        if (!$occ) {
            return response()->json(['success' => false, 'message' => 'Parked sale not found.'], 404);
        }

        if ($occ->expires_at && $occ->expires_at->isPast()) {
            return response()->json(['success' => false, 'message' => 'This parked sale has expired.'], 410);
        }

        return response()->json([
            'success'     => true,
            'parked_sale' => [
                'id'            => $occ->source_id,
                'cart_data'     => $occ->session_data,
                'customer_name' => $occ->label !== 'Parked Cart' ? $occ->label : null,
                'expires_at'    => $occ->expires_at,
                'created_at'    => $occ->opened_at,
            ],
        ]);
    }

    /**
     * Delete a parked sale.
     * Deploy D: closes the Occupancy row (source_type=parked_sale).
     */
    public function deleteParked($id)
    {
        $tenant = app('current.tenant');

        \App\Models\Occupancy::where('tenant_id', $tenant->id)
            ->where('source_type', 'parked_sale')
            ->where('source_id', (string) $id)
            ->whereNull('closed_at')
            ->update(['closed_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Parked sale deleted',
        ]);
    }
    public function edit(Sale $sale)
    {
        // Phase 1.2 — Immutable Lock (Controller Layer)
        // We now allow 'posted' sales to load in the CreateInvoice UI so the user can 
        // view them in the familiar interface. The actual lock preventing modification 
        // is enforced in the update() method and the SaleObserver.

        $sale->load(['items.product', 'customer', 'payments']);
        
        if ($sale->customer) {
            $sale->customer->current_balance = PartyBalanceQuery::partyNetBalance(
                $sale->customer->id,
                app('current.tenant')->id
            );
        }

        return Inertia::render('Sales/CreateInvoice', [
            'sale' => $sale,
        ]);
    }

    public function update(Request $request, Sale $sale)
    {
        if (!empty($sale->stock_at_dispatch)) {
            // Re-posting lines would deduct stock the dispatch has not released yet.
            return response()->json(['message' => 'A deliver-later invoice cannot be edited. Void it and raise a new one.'], 422);
        }
        try {
            DB::beginTransaction();

            // Step 1 — Reverse old journal entries
            $oldEntries = \App\Models\JournalEntry::where('reference', $sale->id)
                ->where('reference_type', 'sale')
                ->where('is_reversed', 0)
                ->get();

            foreach ($oldEntries as $entry) {
                $entry->update(['is_reversed' => 1]);
                $reversalLines = $entry->items->map(function($item) {
                    return [
                        'account_id' => $item->account_id,
                        'debit'      => $item->credit,
                        'credit'     => $item->debit,
                    ];
                })->toArray();
                
                app(\App\Engines\AccountingService::class)->createEntry([
                    'date'           => now()->toDateString(),
                    'reference_type' => 'sale_reversal',
                    'reference'      => $request->input('reference'),
                    'is_dropship'      => $request->input('is_dropship', false),
                    'description'    => 'REVERSAL — ' . $entry->description,
                    'party_id'       => $entry->party_id,
                    'is_reversed'    => 1, // Rule: Reversal of an existing entry must be hidden from balances
                ], $reversalLines);
            }

            // 1. Restore Stock for OLD items
            //    (a) Restore FIFO batch remaining_qty from audit rows so the batches are
            //        back to their pre-sale state before we re-deduct for the edited items.
            //    (b) Restore the aggregate Stock / ProductVariant mirrors.
            //    (c) Delete the old sale_item_batches audit rows.
            foreach ($sale->items as $item) {
                // (a) FIFO restore — credit back each batch that was consumed by this item.
                $oldBatchRows = DB::table('sale_item_batches')
                    ->where('sale_item_id', $item->id)
                    ->get();
                foreach ($oldBatchRows as $batchRow) {
                    DB::table('inventory_batches')
                        ->where('id', $batchRow->inventory_batch_id)
                        ->increment('remaining_qty', $batchRow->qty_deducted);
                }
                // (c) Delete audit rows for this item.
                DB::table('sale_item_batches')->where('sale_item_id', $item->id)->delete();

                // (b) Aggregate mirror restore.
                /* Whatever left the shelf for this line comes back: the
                   quantity sold AND the free units, or an edit quietly
                   manufactured stock out of the difference. */
                $backOnShelf = (float) $item->quantity + (float) ($item->free_quantity ?? 0);
                if ($item->product_variant_id) {
                    \App\Models\ProductVariant::find($item->product_variant_id)?->increment('stock', $backOnShelf);
                } elseif ($item->product_id) {
                    \App\Models\Stock::where('product_id', $item->product_id)->first()?->increment('quantity', $backOnShelf);
                }
                // Note: Product.stock_quantity aggregate is restored by the re-deduct step below.
            }

            $sale->items()->delete();
            $sale->payments()->delete();

            // 2. Recalculate with the SAME contract-v2 calculation as store().
            // (The old one-pass float waterfall taxed at 4 decimals and leaned on
            // the ledger drift patch to balance.)
            $strictMoney = (int) $request->input('calculation_version', 0) >= \App\Services\Sales\SaleTotals::VERSION;
            $editItems = array_values((array) $request->items);
            $editProducts = Product::whereIn('id', collect($editItems)->pluck('product_id')->filter()->unique())->get()->keyBy('id');
            [$calc, $lineItemsData] = $this->calculateSaleLines($request, $editItems, $editProducts, $strictMoney);
            $m = fn (int $minor) => \App\Support\Money::toFloat($minor);
            $lineValues = array_map(fn ($ld) => [
                'product_id'         => $ld['product_id'],
                'product_variant_id' => $ld['variant_id'],
                'quantity'           => $ld['qty'],
                /* Goods given away still leave the shelf, and store() has
                   always deducted them. */
                'free_quantity'      => $ld['free_qty'],
                'unit_price'         => $ld['unit_price'],
                'gross_amount'       => $m($ld['gross_minor']),
                'discount'           => $ld['item_discount'],
                'discount_amount'    => $ld['item_discount'],
                'discount_type'      => $ld['discount_type'],
                'net_amount'         => $ld['net'],
                'tax_rate'           => $ld['tax_rate'],
                'tax_amount'         => $ld['tax_amt'],
                'line_total'         => round($ld['net'] + $ld['tax_amt'], 2),
                'modifiers'          => $ld['modifiers'] ?: null,
            ] + (\App\Services\Sales\CheckoutIntent::lineColumnsAvailable() ? [
                'revenue_amount'      => $ld['revenue'],
                'bill_discount_share' => $ld['global_share'],
            ] : []), $lineItemsData);

            $subtotalGross       = $m($calc['subtotal_gross']);
            $totalItemDiscounts  = $m($calc['item_discounts'] + $calc['free_value']);
            $globalDiscount      = $m($calc['bill_discount']);
            $totalTax            = $m($calc['tax']);
            $netSales            = $m($calc['revenue']);
            $deliveryCharge      = $m($calc['delivery']);
            $extraCharge         = $m($calc['extra']);
            $serviceCharge       = $m($calc['service']);
            $tipAmount           = $m($calc['tip']);
            $roundedInvoiceTotal = $m($calc['invoice']);
            $roundOff            = $m($calc['round_off']);

            $allocation = \App\Services\Sales\PaymentAllocation::allocate([
                'invoice'          => $calc['invoice'],
                'payments'         => $request->input('payments'),
                'payment_method'   => $request->payment_method,
                'amount_paid'      => $request->input('amount_paid'),
                'tendered_amount'  => $request->input('tendered_amount'),
                'cash_tendered'    => $request->input('cash_tendered'),
                'add_to_ledger'    => $request->boolean('add_to_ledger'),
                'has_customer'     => (bool) ($request->input('customer_id') ?: null),
                'walk_in_must_pay' => false,
                'strict'           => $strictMoney,
            ]);

            // 3. Update Sale Header with Phase 1.1 Columns
            $sale->update([
                'party_id'             => $request->input('customer_id') ?: $sale->party_id,
                'net_sales'            => $netSales,
                'total_tax'            => $totalTax,
                'delivery_charge'      => $deliveryCharge,
                'shipping_charges'     => $deliveryCharge,
                'extra_charge_value'   => $extraCharge,
                'extra_charge_label'   => $request->extra_charge_label,
                'service_charge'       => $serviceCharge,
                'tip_amount'           => $tipAmount,
                'invoice_total'        => $roundedInvoiceTotal,
                'total'                => $roundedInvoiceTotal, // Legacy sync
                'subtotal'             => $netSales,            // Legacy sync
                'global_discount'      => $globalDiscount,
                'subtotal_gross'       => $subtotalGross,
                'total_item_discounts' => $totalItemDiscounts,
                'round_off'            => $roundOff,
                'payment_status'       => $allocation['payment_status'],
                'payment_method'       => $request->payment_method,
                'notes'                => $request->notes,
            ]);

            // 4. Re-create Items & COGS Sum
            //    Uses FifoService::deductStock() (same as store()) so COGS is batch-derived
            //    and sale_item_batches audit rows are created for every stock-tracked item.
            $totalCogs       = 0;
            $isStockEnabled  = \App\Helpers\SettingsHelper::isStockMaintenanceEnabled();
            $stopNegative    = \App\Helpers\SettingsHelper::stopSaleOnNegativeStock();
            $warehouseId     = $sale->warehouse_id ?? 1;

            foreach ($lineValues as $line) {
                $product   = Product::find($line['product_id']);
                $costPrice = $product->cost_price ?? 0;
                $itemCogs  = 0;

                $saleItem = SaleItem::create(array_merge($line, [
                    'sale_id'    => $sale->id,
                    'cost_price' => $costPrice,
                    'subtotal'   => $line['unit_price'] * $line['quantity'],
                ]));

                // 4.3 Deduct Stock via FIFO (mirrors store() flow exactly)
                if ($isStockEnabled && $product->type !== 'service') {
                    /* Sold plus given away — the same total store() deducts. */
                    $qty = $line['quantity'] + (float) ($line['free_quantity'] ?? 0);

                    // Check availability if negative stock is blocked (mirrors store() path)
                    if ($stopNegative) {
                        $stockRecord = \App\Models\Stock::where('product_id', $line['product_id'])
                            ->where('warehouse_id', $warehouseId)
                            ->first();
                        $avail = $stockRecord ? $stockRecord->quantity : 0;
                        if ($avail < $qty) {
                            throw new \App\Exceptions\InsufficientStockException(
                                $line['product_id'], $warehouseId, $qty, $avail
                            );
                        }
                    }

                    $deductions = app(\App\Engines\FifoService::class)->deductStock($line['product_id'], $warehouseId, $qty, preferredBatchId: $line['batch_id'] ?? null);
                    foreach ($deductions as $d) {
                        $itemCogs += $d['total_cost'];
                        DB::table('sale_item_batches')->insert([
                            'id'                 => \Illuminate\Support\Str::uuid()->toString(),
                            'tenant_id'          => $sale->tenant_id,
                            'sale_item_id'       => $saleItem->id,
                            'inventory_batch_id' => $d['batch_id'],
                            'qty_deducted'       => $d['qty_taken'],
                            'unit_cost'          => $d['unit_cost'],
                            'total_cogs'         => $d['total_cost'],
                            'created_at'         => now(),
                            'updated_at'         => now(),
                        ]);
                    }
                    $saleItem->update(['cost_price' => $qty > 0 ? $itemCogs / $qty : 0]);

                    // Aggregate mirror
                    if (!empty($line['product_variant_id'])) {
                        $variant = ProductVariant::find($line['product_variant_id']);
                        if ($variant) $variant->decrement('stock', $qty);
                    } else {
                        $stock = \App\Models\Stock::where('product_id', $line['product_id'])->where('warehouse_id', $warehouseId)->first();
                        if ($stock) {
                            $stock->decrement('quantity', $qty);
                        } else {
                            \App\Models\Stock::create([
                                'product_id'  => $line['product_id'],
                                'warehouse_id' => $warehouseId,
                                'quantity'    => -$qty,
                            ]);
                        }
                    }
                    Product::where('id', $line['product_id'])->decrement('stock_quantity', $qty);

                    \App\Models\StockMovement::create([
                        'product_id'         => $line['product_id'],
                        'product_variant_id' => $line['product_variant_id'] ?? null,
                        'warehouse_id'       => $warehouseId,
                        'type'               => 'sale',
                        'quantity'           => -$qty,
                        'reference_id'       => $sale->id,
                        'description'        => 'Sale Update: ' . $sale->reference_number,
                        'user_id'            => auth()->id(),
                    ]);
                } else {
                    // Stock tracking disabled — use flat cost_price (service / non-inventory items)
                    $itemCogs = $costPrice * $line['quantity'];
                }

                $totalCogs += $itemCogs;
            }

            // 5. Re-post Journal & Payments
            $tenderedAmount = $m($allocation['tendered']);
            $this->postSaleJournal($sale, $request, $calc, $allocation, $totalCogs);

            // 6. Sync Activity
            \App\Models\Activity::updateOrCreate(
                ['reference_id' => $sale->id, 'reference_type' => 'sale'],
                [
                    'type'           => 'sale',
                    'description'    => 'Sale to ' . ($sale->walk_in_name
                        ?: ($sale->party_id
                            ? \App\Models\Party::find($sale->party_id)?->name ?? 'Customer'
                            : 'Walk-in')),
                    'amount'         => $roundedInvoiceTotal,
                    'user_id'        => auth()->id(),
                    'metadata'       => json_encode([
                        'reference_number' => $sale->reference_number,
                        'net_sales'        => $netSales,
                        'total_tax'        => $totalTax,
                        'invoice_total'    => $roundedInvoiceTotal,
                        'items_count'      => count($request->items),
                        'payment_method'   => $request->payment_method,
                        'amount_paid'      => $tenderedAmount,
                    ]),
                ]
            );

            DB::commit();
            return response()->json(['success' => true, 'sale_id' => $sale->id]);

        } catch (\App\Exceptions\MoneyException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'code' => $e->errorCode, 'message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale Update Error: ' . $e->getMessage());
            $statusCode = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException ? $e->getStatusCode() : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
        }
    }

    /* An uncleared cheque is an asset, but it is not the till. The screens send
       the sentinel 'CHEQUE' because the shop's chart of accounts may not have
       an account for it yet; this opens 1020 the first time one is needed
       rather than quietly banking the cheque as cash. */
    private function resolvePaymentAccount($accountId, string $method): ?\App\Models\Account
    {
        $isCheque = is_string($accountId) && strtoupper($accountId) === 'CHEQUE';
        if (!$isCheque && $method === 'cheque') $isCheque = true;

        if (!$isCheque && !empty($accountId)) {
            $acc = \App\Models\Account::find($accountId);
            if ($acc) return $acc;
        }

        if ($isCheque) {
            return $this->accounting->getAccountByCode('1020', 'Cheques in Hand', 'asset');
        }
        return null;
    }

    /**
     * Payments + one journal entry for a sale, built ONLY from the contract-v2
     * calculation ($calc) and payment allocation ($alloc), all integer minor
     * units. Each expected account amount is explicit; the entry is checked to
     * balance to the paisa BEFORE it reaches the ledger. There is no tolerance
     * and no revenue adjustment: an imbalance here is a defect and is refused.
     */
    private function postSaleJournal(Sale $sale, Request $request, array $calc, array $alloc, float $totalCogs, ?string $approvedBy = null)
    {
        $currentTenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $date = $sale->posted_at ? $sale->posted_at->toDateString() : today()->toDateString();
        $money = fn (int $minor) => \App\Support\Money::toFloat($minor);
        $isBank = fn (string $m) => in_array($m, ['bank', 'card', 'online', 'upi'], true);

        // A. Payment rows — one per allocated line, at the amount applied
        //    (cash change already taken out; an advance stays on its line).
        foreach ($alloc['lines'] as $line) {
            $single = !empty($line['single']);
            $created = Payment::create([
                'sale_id'         => $sale->id,
                'amount'          => $money($line['amount']),
                'method'          => $line['method'],
                'type'            => 'in',
                'bank_account_id' => $single ? ($request->bank_account_id ?? null) : ($line['account_id'] ?? $line['bank_account_id'] ?? null),
                /* "Deposited to HBL" or a cheque number. */
                'reference'       => $single ? $request->input('payment_reference') : ($line['reference'] ?? null),
                'cheque_date'     => $single ? $request->input('cheque_date') : null,
                'date'            => $date,
            ]);
            if ($single && $line['method'] === 'cheque' && $request->filled('payment_reference')) {
                try {
                    app(\App\Services\Cheque\ChequeDuplicateService::class)->recordReceivedCheque(
                        tenant: $currentTenant,
                        chequeNumber: $request->input('payment_reference'),
                        amount: $money($line['amount']),
                        partyId: $sale->customer_id,
                        bankName: $request->input('bank_name') ?? 'Bank',
                        chequeDate: $request->input('cheque_date') ?? $date,
                        paymentId: $created->id,
                        notes: 'Sale POS receipt ' . ($sale->invoice_number ?? $sale->id)
                    );
                } catch (\Exception $e) {
                    Log::warning("Could not auto-record received cheque for sale {$sale->id}: " . $e->getMessage());
                }
            }
        }

        // B. Journal lines (minor units until the very end).
        $lines = [];
        $add = function (string $accountId, int $debit, int $credit, string $description, $partyId = null, $bankAccountId = null) use (&$lines) {
            if ($debit === 0 && $credit === 0) {
                return;
            }
            $lines[] = compact('accountId', 'debit', 'credit', 'description', 'partyId', 'bankAccountId');
        };
        $ref = $sale->reference_number;

        // DR money received, per method/account. A 'credit' line is not money:
        // it is part of the receivable below.
        foreach ($alloc['lines'] as $line) {
            $method = $line['method'];
            if (in_array($method, \App\Services\Sales\PaymentAllocation::RECEIVABLE_METHODS, true)) {
                continue;
            }
            $accountRef = !empty($line['single']) ? $request->payment_account_id : ($line['account_id'] ?? null);
            $acc = $this->resolvePaymentAccount($accountRef, $method)
                ?? $this->accounting->getAccountByCode($isBank($method) ? '1010' : '1000');
            $bankAccountId = $isBank($method)
                ? (!empty($line['single']) ? ($request->bank_account_id ?? $request->payment_account_id ?? null) : ($line['bank_account_id'] ?? null))
                : null;
            $add($acc->id, $line['amount'], 0, "Payment ($method) for Sale #{$ref}", $sale->party_id, $bankAccountId);
        }

        // DR receivable — what the customer still owes.
        if ($alloc['receivable'] > 0) {
            $ar = $this->accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
            $add($ar->id, $alloc['receivable'], 0, "Credit balance for Sale #{$ref}", $sale->party_id);
        }

        // CR customer advance kept on account (explicit "add to ledger" only).
        if ($alloc['advance'] > 0) {
            $cr = $this->accounting->getAccountByCode('2050', 'Customer Credit Balances', 'liability');
            $add($cr->id, 0, $alloc['advance'], "Customer credit from Sale #{$ref}", $sale->party_id);
        }

        // CR revenue, charges, tips (a liability), tax.
        $rev = $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income');
        $add($rev->id, 0, $calc['revenue'], "Revenue from Sale #{$ref}", $sale->party_id);
        $other = null;
        $otherIncome = function () use (&$other) {
            return $other ??= $this->accounting->getAccountByCode('4100', 'Other Income', 'income');
        };
        if ($calc['delivery'] > 0) {
            $add($otherIncome()->id, 0, $calc['delivery'], "Delivery charges from Sale #{$ref}", $sale->party_id);
        }
        if ($calc['extra'] > 0) {
            $add($otherIncome()->id, 0, $calc['extra'], "Extra charges from Sale #{$ref}", $sale->party_id);
        }
        // Service charge: the house's money (Other Income).
        if ($calc['service'] > 0) {
            $add($otherIncome()->id, 0, $calc['service'], "Service charge from Sale #{$ref}", $sale->party_id);
        }
        // Tips: held for staff — 2150 Tips Payable, never income. Paid out by a
        // separate DR 2150 / CR 1000 entry.
        if ($calc['tip'] > 0) {
            $tipsAcc = $this->accounting->getAccountByCode('2150', 'Tips Payable', 'liability');
            $add($tipsAcc->id, 0, $calc['tip'], "Tips held for staff — #{$ref}", $sale->party_id);
        }
        if ($calc['tax'] > 0) {
            $taxAcc = $this->accounting->getAccountByCode('2100', 'Sales Tax Payable', 'liability');
            $add($taxAcc->id, 0, $calc['tax'], "Tax collected — #{$ref}");
        }

        // Explicit bill rounding from the calculation — never inferred from an imbalance.
        if ($calc['round_off'] !== 0) {
            $acc = $this->accounting->getAccountByCode($calc['round_off'] > 0 ? '4900' : '5900');
            $abs = abs($calc['round_off']);
            $add($acc->id, $calc['round_off'] < 0 ? $abs : 0, $calc['round_off'] > 0 ? $abs : 0, "Round off — #{$ref}");
        }

        // COGS — one quantized amount on both sides (FIFO costs may carry more decimals).
        $cogsMinor = \App\Support\Money::toMinor(\Brick\Math\BigDecimal::of(number_format($totalCogs, 6, '.', '')));
        if ($cogsMinor > 0) {
            $cogs = $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
            $inv = $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
            $add($cogs->id, $cogsMinor, 0, "COGS — #{$ref}");
            $add($inv->id, 0, $cogsMinor, "Inventory reduction — #{$ref}");
        }

        $dr = array_sum(array_column($lines, 'debit'));
        $cr = array_sum(array_column($lines, 'credit'));
        if ($dr !== $cr) {
            // By construction this cannot happen; if it does, refuse — never patch revenue.
            throw new \LogicException("Sale journal does not balance for #{$ref}: debits {$dr} vs credits {$cr} (minor units).");
        }

        return $this->accounting->createEntry([
            'date'           => $date,
            'reference_type' => 'sale',
            'reference'      => $sale->id,
            'description'    => "Sale #{$ref}",
            'party_id'       => $sale->party_id,
            // S-011 / S-044: the verified manager approval, as on the V3 path.
            'approved_by'    => $approvedBy,
        ], array_map(fn ($l) => array_filter([
            'account_id'      => $l['accountId'],
            'debit'           => $money($l['debit']),
            'credit'          => $money($l['credit']),
            'description'     => $l['description'],
            'party_id'        => $l['partyId'],
            'bank_account_id' => $l['bankAccountId'],
        ], fn ($v) => $v !== null), $lines));
    }

    public function cancel(Sale $sale)
    {
        // Phase 1.2 — Reversal Engine. A partly returned sale can be cancelled
        // too: SaleReversalService then reverses only what is still out.
        if (!in_array($sale->status, ['posted', 'partially_returned'], true)) {
            return back()->with('error', "Only posted or partially-returned sales can be cancelled. Current status: {$sale->status}.");
        }

        $tenant = app('current.tenant');
        $user = auth()->user();
        if ($tenant && $user) {
            $policy = resolve(\App\Services\Approval\ApprovalPolicyResolver::class)->resolve(
                tenant:       $tenant,
                user:         $user,
                documentType: \App\Models\ApprovalDocument::TYPE_SALES_RETURN,
                amount:       (float) ($sale->total ?? 0),
            );
            if ($policy['requires_approval']) {
                if (request()->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'When approval workflow is required, posted sales cannot be directly cancelled.',
                    ], 422);
                }
                return back()->with('error', 'When approval workflow is required, posted sales cannot be directly cancelled.');
            }
        }

        try {
            DB::transaction(function () use ($sale) {
                $reversal = new \App\Engines\SaleReversalService();
                $reversal->reverse(
                    sale:   $sale,
                    type:   'cancelled',
                    reason: request()->input('reason', 'Cancelled by user'),
                    userId: auth()->id()
                );
            });

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Sale {$sale->reference_number} has been cancelled. "
                        . "A counter journal entry has been posted and FIFO stock has been restored.",
                ]);
            }
            return back()->with('success', "Sale {$sale->reference_number} cancelled. Reversal journal entry posted.");

        } catch (\Exception $e) {
            Log::error('Sale Cancel Error', ['sale_id' => $sale->id, 'error' => $e->getMessage()]);
            if (request()->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Cancel failed: ' . $e->getMessage());
        }
    }

    public function bulkDestroy(Request $request)
    {
        Log::info('Bulk Destroy Attempt', ['user_id' => auth()->id(), 'role' => optional(auth()->user())->role, 'ids' => $request->ids]);

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['owner', 'admin', 'platform_admin'])) {
            Log::warning('Bulk Destroy Unauthorized', ['user_id' => auth()->id(), 'role' => optional($user)->role]);
            abort(403, 'Unauthorized action. Only Owners and Admins can delete sales.');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sales,id'
        ]);

        $tenant = app('current.tenant');
        if ($tenant && $user) {
            $policyResolver = resolve(\App\Services\Approval\ApprovalPolicyResolver::class);
            foreach ($request->ids as $id) {
                $checkSale = Sale::find($id);
                if ($checkSale) {
                    $policy = $policyResolver->resolve(
                        tenant:       $tenant,
                        user:         $user,
                        documentType: \App\Models\ApprovalDocument::TYPE_SALES_RETURN,
                        amount:       (float) ($checkSale->total ?? 0),
                    );
                    if ($policy['requires_approval']) {
                        if ($request->wantsJson()) {
                            return response()->json([
                                'success' => false,
                                'message' => 'When approval workflow is required, posted sales cannot be directly deleted.',
                            ], 422);
                        }
                        return back()->with('error', 'When approval workflow is required, posted sales cannot be directly deleted.');
                    }
                }
            }
        }

        $count = 0;
        $errors = [];

        foreach ($request->ids as $id) {
            try {
                $sale = Sale::findOrFail($id);
                $this->deleteSale($sale);
                $count++;
            } catch (\Exception $e) {
                $errors[] = "Failed to delete sale #{$id}: " . $e->getMessage();
            }
        }

        if (count($errors) > 0) {
            return back()->with('error', 'Deleted ' . $count . ' sales. Errors: ' . implode(', ', $errors));
        }

        return back()->with('success', $count . ' sales deleted and accounting reversed successfully');
    }

    public function destroy(Sale $sale)
    {
        Log::info('Single Destroy Attempt', ['user_id' => auth()->id(), 'role' => optional(auth()->user())->role, 'sale_id' => $sale->id]);

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['owner', 'admin', 'platform_admin'])) {
            Log::warning('Single Destroy Unauthorized', ['user_id' => auth()->id(), 'role' => optional($user)->role]);
            abort(403, 'Unauthorized action. Only Owners and Admins can delete sales.');
        }

        $tenant = app('current.tenant');
        if ($tenant && $user) {
            $policy = resolve(\App\Services\Approval\ApprovalPolicyResolver::class)->resolve(
                tenant:       $tenant,
                user:         $user,
                documentType: \App\Models\ApprovalDocument::TYPE_SALES_RETURN,
                amount:       (float) ($sale->total ?? 0),
            );
            if ($policy['requires_approval']) {
                if (request()->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'When approval workflow is required, posted sales cannot be directly deleted.',
                    ], 422);
                }
                return back()->with('error', 'When approval workflow is required, posted sales cannot be directly deleted.');
            }
        }

        try {
            $this->deleteSale($sale);
            return back()->with('success', 'Sale deleted and accounting reversed successfully');
        } catch (\Exception $e) {
            Log::error('Destroy Error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Error deleting sale: ' . $e->getMessage());
        }
    }

    /**
     * The sole authorised path for admin-level deletion of a posted sale.
     *
     * WHAT THIS IS NOT:
     *   - This is NOT a database DELETE of the sale and its journal entries.
     *   - Erasing past journal entries is illegal in double-entry accounting.
     *     It destroys the audit trail and corrupts the trial balance permanently.
     *
     * WHAT THIS IS:
     *   1. The SaleReversalService posts a counter journal entry
     *      (every debit flipped to credit, every credit flipped to debit).
     *      The original entries are preserved forever. The net effect on every
     *      account becomes zero. The trial balance still zeroes out.
     *   2. The FIFO batches that were consumed by this sale are restored to
     *      exactly the quantities they held before the sale ran.
     *   3. The sale is soft-deleted (it remains for compliance reporting).
     *
     * A partially returned sale has its not-yet-returned remainder reversed.
     * If the sale is already cancelled/returned, reversals have already been
     * posted previously — we only soft-delete the record at this point.
     */
    private function deleteSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {

            // Re-read under a row lock: two deletes of the same sale must not
            // both see 'posted' and reverse it twice.
            $status = DB::table('sales')->where('id', $sale->id)->lockForUpdate()->value('status');
            $sale->status = $status;

            if (in_array($status, ['posted', 'partially_returned'], true)) {
                // Run the financial + FIFO reversal. For a posted sale this is
                // the counter entry of the whole sale; for a partly returned
                // one SaleReversalService reverses only the units still out
                // (the returned ones were already reversed by their return
                // entries) — soft-deleting it alone left the rest of the sale's
                // revenue, tax, AR/cash and COGS on the books with no stock back.
                $reason = request()->input('reason', 'Admin deletion by ' . optional(auth()->user())->name);
                (new \App\Engines\SaleReversalService())->reverse(
                    sale:   $sale,
                    type:   'cancelled',
                    reason: $reason,
                    userId: auth()->id() ?? 'system'
                );
            }

            // Soft-delete the sale — it is preserved for compliance / audit queries.
            // forceDelete() is forbidden: it would destroy the FIFO paper trail
            // (sale_item_batches rows) which are the proof of what was consumed.
            $sale->delete();

            Log::info('Sale soft-deleted after reversal', [
                'sale_id'   => $sale->id,
                'reference' => $sale->reference_number,
                'user_id'   => auth()->id(),
            ]);
        });
    }
    public function export(Request $request)
    {
        $query = Sale::with('customer'); // Using Sale model as per controller context

        // Apply filters (same as index)
        if ($request->search) {
            $term = strtolower($request->search);
            $query->where(function ($q) use ($term) {
                $q->where('reference_number', 'like', "%{$term}%")
                    ->orWhereHas('customer', fn($p) => $p->where('name', 'like', "%{$term}%"));
            });
        }
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        $sales = $query->latest()->get();

        $filename = "sales_export_" . date('Y-m-d_H-i') . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($sales) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Invoice No', 'Customer', 'Amount', 'Paid', 'Payment Method']);

            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->created_at,
                    $sale->reference_number,
                    $sale->customer->name ?? 'Walk-in',
                    $sale->total,
                    // If no paid column on Sale, check Payments. But usually logic stores in header or calculated.
                    // Index uses withSum('payments as paid_amount'). We should probably load that.
                    $sale->payments->sum('amount'),
                    $sale->payment_method
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
