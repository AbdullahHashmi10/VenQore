<?php

namespace App\Engines;

use App\Exceptions\BelowCostSaleException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaleService
{
    public function __get($name)
    {
        if ($name === 'tenantId') {
            return $this->getTenantId();
        }
        return null;
    }

    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo,
        private PaymentService    $payments,
        private TaxService        $tax,
        private UomService        $uom
    ) {
    }

    /**
     * Resolve the active tenant_id from the authenticated user.
     * Falls back to data passed explicitly (for CLI / queue contexts).
     *
     * WOUND 2 FIX: Every raw DB::table()->insert() MUST call this.
     * Without it, records are stored with tenant_id = null and become
     * cross-tenant orphans invisible to scoped queries.
     */
    private function getTenantId(int|string|null $explicit = null): int|string|null
    {
        if ($explicit !== null) {
            return $explicit;
        }

        if (app()->bound('current.tenant')) {
            return app('current.tenant')->id;
        }

        $user = auth()->user();
        if ($user && $user->last_store_id) {
            return (int) $user->last_store_id;
        }

        // Final safety net — log and return null so the DB constraint
        // (NOT NULL, once enforced) surfaces the bug immediately.
        \Illuminate\Support\Facades\Log::warning(
            'SaleService: could not resolve tenant_id. Sale may be orphaned.',
            ['user_id' => auth()->id(), 'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5)]
        );
        return null;
    }

    /**
     * Post a B1 (cash) or B2 (credit) sale.
     * This is the ONLY method that writes to sales, sale_items,
     * sale_item_batches. Controllers never write these tables directly.
     *
     * @param array $data {
     *   customer_id, warehouse_id, sale_date, payment_method,
     *   amount_received, approved_by, items: [{
     *     product_id, qty, sale_uom, unit_price,
     *     discount_percent, tax_rate, is_promotional
     *   }]
     * }
     * @return object The created sales row
     */
    public function post(array $data): object
    {
        // Idempotency check (S-048 / Offline Sync)
        if (!empty($data['client_sale_id'])) {
            $existing = DB::table('sales')
                ->where('tenant_id', $this->tenantId)
                ->where('client_sale_id', $data['client_sale_id'])
                ->first();
            if ($existing) {
                return Sale::find($existing->id);
            }
        }

        return DB::transaction(function () use ($data) {
            $data['customer_id']    = $data['customer_id'] ?? $data['party_id'] ?? null;
            $data['payment_method'] = $data['payment_method'] ?? 'cash';
            $data['warehouse_id']   = $data['warehouse_id'] ?? DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');
            $data['sale_date']      = $data['sale_date'] ?? now()->toDateString();

            $saleId        = Str::uuid()->toString();
            $invoiceNumber = \App\Services\SequenceService::generateTransactionNumber('SAL');

            // ── 1. Calculate line totals and deduct stock ─────────────
            $subtotalGross      = 0.00;
            $totalItemDiscounts = 0.00;
            $taxTotal           = 0.00;
            $cogsTotal          = 0.00;
            $lineItems          = [];

            // ── S-042 Tiered pricing: expand items before processing ──
            // S-045: a converted sales order carries the prices LOCKED when the
            // order was taken — tiers created since must not re-price it.
            $lockedPrices  = !empty($data['source_order_id']);
            $expandedItems = [];
            foreach ($data['items'] as $item) {
                foreach (($lockedPrices ? [$item] : $this->applyTieredPricing($item)) as $tieredItem) {
                    $expandedItems[] = $tieredItem;
                }
            }
            $data['items'] = $expandedItems;

            foreach ($data['items'] as $item) {
                $qty           = (float) $item['qty'];
                $unitPrice     = (float) $item['unit_price'];
                $discountPct   = (float) ($item['discount_percent'] ?? 0);
                $taxRate       = (float) ($item['tax_rate'] ?? 0);
                $isPromotional = !empty($item['is_promotional']);

                // Promotional items are Rs.0 — S-040
                if ($isPromotional) {
                    $unitPrice   = 0.00;
                    $discountPct = 0.00;
                }

                $lineGross   = round($qty * $unitPrice, 2);
                $discountAmt = round($lineGross * $discountPct / 100, 2);
                $lineNet     = $lineGross - $discountAmt;

                $taxCalc = $this->tax->calculateLineTax(
                    amount:           $lineNet,
                    taxRate:          $taxRate,
                    priceIncludesTax: false
                );

                // Fetch product type to support service products bypass rule
                $productType = DB::table('products')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $item['product_id'])
                    ->value('type');

                if ($productType === 'service') {
                    $baseQty = $qty;
                    $deductions = [];
                    $lineCogs = 0.00;
                } else {
                    // UOM conversion: sale qty → base qty for FIFO
                    $saleUom = $item['sale_uom'] ?? DB::table('products')->where('id', $item['product_id'])->value('base_unit') ?? 'pcs';
                    $baseQty = $this->uom->toBaseQty(
                        $item['product_id'],
                        $qty,
                        $saleUom
                    );

                    // FIFO deduction — returns array of batch deductions
                    $deductions = $this->fifo->deductStock(
                        productId:   $item['product_id'],
                        warehouseId: $data['warehouse_id'],
                        qty:         $baseQty,
                        saleUom:     $saleUom
                    );
                    $lineCogs = array_sum(array_column($deductions, 'total_cost'));
                }

                $cogsTotal += $lineCogs;

                $subtotalGross      += $lineGross;
                $totalItemDiscounts += $discountAmt;
                $taxTotal           += $taxCalc['tax'];

                $lineItems[] = [
                    'item'       => $item,
                    'base_qty'   => $baseQty,
                    'line_net'   => $lineNet,
                    'line_total' => round($lineNet + $taxCalc['tax'], 2),
                    'tax_amount' => $taxCalc['tax'],
                    'cogs'       => $lineCogs,
                    'deductions' => $deductions,
                ];
            }

            $netSales     = round($subtotalGross - $totalItemDiscounts, 2);
            $invoiceTotal = round($netSales + $taxTotal, 2);

            // ── Credit Limit Check ──
            if (!empty($data['customer_id'])) {
                $customer = DB::table('parties')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $data['customer_id'])
                    ->lockForUpdate()
                    ->first();

                if ($customer && $customer->credit_limit !== null) {
                    $creditPortion = 0.00;
                    if ($data['payment_method'] === 'credit') {
                        $creditPortion = $invoiceTotal;
                    } else {
                        $amountReceived = (float) ($data['amount_received'] ?? $invoiceTotal);
                        if (round($amountReceived, 2) < round($invoiceTotal, 2)) {
                            $creditPortion = round($invoiceTotal - $amountReceived, 2);
                        }
                    }

                    if ($creditPortion > 0) {
                        $currentBalance = (float) DB::table('journal_items as ji')
                            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                            ->where('je.tenant_id', $this->tenantId)
                            ->where('je.party_id', $data['customer_id'])
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

            // ── 2. S-011 Below-cost check ─────────────────────────────
            foreach ($lineItems as $lineData) {
                if (!empty($lineData['item']['is_promotional'])) continue;

                if ($lineData['line_net'] < $lineData['cogs'] && empty($data['approved_by'])) {
                    throw new BelowCostSaleException(
                        $lineData['item']['product_id'],
                        $lineData['line_net'],
                        $lineData['cogs']
                    );
                }
            }

            // ── 3. Build journal lines ─────────────────────────────────
            // Revenue recognised as net_sales (pre-tax)
            $journalLines = [
                ['account_code' => '4000', 'debit' => 0,         'credit' => $netSales,   'party_id' => $data['customer_id']],
                ['account_code' => '5000', 'debit' => $cogsTotal, 'credit' => 0],
                ['account_code' => '1100', 'debit' => 0,         'credit' => $cogsTotal],
            ];

            if ($taxTotal > 0) {
                $journalLines[] = [
                    'account_code' => '2100', // Sales Tax Payable (was 2200 = Loans Payable — M1-06b fix)
                    'debit'        => 0,
                    'credit'       => $taxTotal,
                ];
            }

            $paymentStatus = 'unpaid';

            if ($data['payment_method'] === 'credit') {
                // B2 — AR open
                $journalLines[] = [
                    'account_code' => '1200',
                    'debit'        => $invoiceTotal,
                    'credit'       => 0,
                    'party_id'     => $data['customer_id'],
                ];
                $paymentStatus = 'unpaid';
            } else {
                // B1 — cash or bank
                $cashAccount    = $data['payment_method'] === 'bank' ? '1010' : '1000';
                $amountReceived = (float) ($data['amount_received'] ?? $invoiceTotal);

                $journalLines[] = [
                    'account_code' => $cashAccount,
                    'debit'        => $amountReceived,
                    'credit'       => 0,
                ];

                if (round($amountReceived, 2) < round($invoiceTotal, 2)) {
                    // Split — part cash, remainder on AR
                    $remainder = round($invoiceTotal - $amountReceived, 2);
                    $journalLines[] = [
                        'account_code' => '1200',
                        'debit'        => $remainder,
                        'credit'       => 0,
                        'party_id'     => $data['customer_id'],
                    ];
                    $paymentStatus = 'partial';
                } elseif (round($amountReceived, 2) > round($invoiceTotal, 2)) {
                    // Overpayment — the whole amount received is in the till, and the
                    // surplus is the customer's money held on account: a Customer
                    // Advance (rulebook B1 "Customer Advance"). In this chart that is
                    // 2060 — 2100 is Sales Tax Payable, and parking the surplus there
                    // inflated the tax report by every rupee of unreturned change.
                    // Held on 2060 against the customer it is consumable by a later
                    // sale's advance settlement (step 8 below, S-048).
                    $surplus = round($amountReceived - $invoiceTotal, 2);
                    $journalLines[] = [
                        'account_id'   => $this->accounting->getAccountByCode('2060', 'Customer Advances', 'liability')->id,
                        'debit'        => 0,
                        'credit'       => $surplus,
                        'party_id'     => $data['customer_id'],
                    ];
                    $paymentStatus = 'paid';
                } else {
                    $paymentStatus = 'paid';
                }
            }

            // ── 4. Post journal ────────────────────────────────────────
            $journalEntry = $this->accounting->createEntry([
                'tenant_id' => $data['tenant_id'] ?? null,
                'date'     => $data['sale_date'],
                'reference_type' => 'sale',
                'reference'   => $saleId,
                'description'    => 'Sale — ' . $invoiceNumber,
                'party_id'       => $data['customer_id'],
                'approved_by'    => $data['approved_by'] ?? null,
            ], $journalLines);

            // ── 5. Write sales record ──────────────────────────────────
            $tenantId = $this->tenantId; // always from authenticated tenant context

            DB::table('sales')->insert([
                'id'                   => $saleId,
                'tenant_id'            => $tenantId,  // WOUND 2 FIX — explicit tenant stamp
                'client_sale_id'       => $data['client_sale_id'] ?? null,
                'reference_number'     => $invoiceNumber,
                'party_id'             => $data['customer_id'],
                'warehouse_id'         => $data['warehouse_id'],
                'subtotal'             => $subtotalGross,
                'subtotal_gross'       => $subtotalGross,
                'total_item_discounts' => $totalItemDiscounts,
                'net_sales'            => $netSales,
                'total_tax'            => $taxTotal,
                'tax'                  => $taxTotal,
                'invoice_total'        => $invoiceTotal,
                'total'                => $invoiceTotal, // legacy column alias
                'payment_status'       => $paymentStatus,
                'payment_method'       => $data['payment_method'],
                'status'               => 'posted',
                'posted_at'            => $data['sale_date'] ?? now(),
                // The seller is whoever rang the sale up; a manager approval (S-011/S-044)
                // is recorded on journal_entries.approved_by, not here.
                'user_id'              => auth()->id() ?? $data['approved_by'] ?? 1, // added for legacy
                'created_at'           => $data['sale_date'] ?? now(),
                'updated_at'           => now(),
            ]);

            // ── 6. Write sale_items + sale_item_batches ────────────────
            foreach ($lineItems as $lineData) {
                $item       = $lineData['item'];
                $saleItemId = Str::uuid()->toString();

                $grossAmount = round($item['qty'] * $item['unit_price'], 2);
                $discountAmount = round($grossAmount - $lineData['line_net'], 2);

                DB::table('sale_items')->insert([
                    'id'               => $saleItemId,
                    'tenant_id'        => $tenantId,  // WOUND 2 FIX — explicit tenant stamp
                    'sale_id'          => $saleId,
                    'product_id'       => $item['product_id'],
                    'quantity'         => $item['qty'],
                    'unit_price'       => $item['unit_price'],
                    'tax_rate'         => $item['tax_rate'] ?? 0,
                    'gross_amount'     => $grossAmount,
                    'discount_amount'  => $discountAmount,
                    'net_amount'       => $lineData['line_net'],
                    'tax_amount'       => $lineData['tax_amount'],
                    'subtotal'         => $lineData['line_total'],
                    'line_total'       => $lineData['line_total'],
                    'cost_price'       => $lineData['cogs'],
                    'free_quantity'    => !empty($item['is_promotional']) ? $item['qty'] : 0,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);

                foreach ($lineData['deductions'] as $deduction) {
                    DB::table('sale_item_batches')->insert([
                        'id'                 => Str::uuid()->toString(),
                        'tenant_id'          => $tenantId,  // WOUND 2 FIX — explicit tenant stamp
                        'sale_item_id'       => $saleItemId,
                        'inventory_batch_id' => $deduction['batch_id'],
                        'qty_deducted'       => $deduction['qty_taken'],
                        'unit_cost'          => $deduction['unit_cost'],
                        'total_cogs'         => $deduction['total_cost'],
                        'is_reversed'        => 0,
                        'created_at'         => now(),
                        'updated_at'         => now(),
                    ]);
                }
            }

            // ── 6b. Stock aggregates (stocks / products.stock_quantity) ──
            // FIFO batches are the source of truth; these are the denormalised
            // counters the POS, stock lists and low-stock alerts read. Every other
            // stock movement (purchases, adjustments, returns) keeps them in step,
            // so a sale must too — otherwise they drift upward by every unit sold
            // through this engine. Moved by the base qty actually taken from batches.
            foreach ($lineItems as $lineData) {
                $movedQty = (float) array_sum(array_column($lineData['deductions'], 'qty_taken'));
                if ($movedQty > 0) {
                    $this->adjustStockAggregates($lineData['item']['product_id'], $data['warehouse_id'], -$movedQty);
                }
            }

            // ── 7. Allocate payment if cash/bank ──────────────────────
            if ($data['payment_method'] !== 'credit') {
                $amountReceived = (float) ($data['amount_received'] ?? $invoiceTotal);
                $allocateAmount = min($amountReceived, $invoiceTotal);

                $this->payments->allocate($journalEntry->id, [
                    ['sale_id' => $saleId, 'amount' => $allocateAmount],
                ]);
            }

            // ── 8. Settle advance if provided (S-048) ─────────────────
            if (!empty($data['advance_amount'])) {
                $advanceAmount = (float) $data['advance_amount'];

                // Verify customer has sufficient advance balance on 2060 Customer Advances
                // (2100 is Sales Tax Payable in this chart — see CustomerAdvanceController).
                $tid = $this->tenantId;
                $advanceBalance = (float) (DB::table('journal_items as ji')
                    ->where('ji.tenant_id', $tid)
                    ->join('journal_entries as je', function($join) use ($tid) {
                        $join->on('ji.journal_entry_id', '=', 'je.id')
                             ->where('je.tenant_id', $tid);
                    })
                    ->join('accounts as a', function($join) use ($tid) {
                        $join->on('ji.account_id', '=', 'a.id')
                             ->where('a.tenant_id', $tid);
                    })
                    ->where('je.party_id', $data['customer_id'])
                    ->where('a.code', '2060')
                    ->where('je.is_reversed', 0)
                    ->selectRaw('IFNULL(SUM(ji.credit) - SUM(ji.debit), 0) as balance')
                    ->value('balance') ?? 0);

                if ($advanceAmount > $advanceBalance + 0.01) {
                    throw new \InvalidArgumentException(
                        "Advance settlement amount {$advanceAmount} exceeds " .
                        "available advance balance {$advanceBalance}."
                    );
                }

                // Step 2 settlement journal: DR 2060 / CR 1200
                // This reduces the advance liability and offsets the AR from the sale
                $advanceAccount = $this->accounting->getAccountByCode('2060', 'Customer Advances', 'liability');
                $settlement = $this->accounting->createEntry([
                    'date'     => $data['sale_date'],
                    'reference_type' => 'advance_settlement',
                    'reference'   => $saleId,
                    'description'    => 'Advance settlement — ' . $invoiceNumber,
                    'party_id'       => $data['customer_id'],
                ], [
                    [
                        'account_id'   => $advanceAccount->id,
                        'debit'        => $advanceAmount,
                        'credit'       => 0,
                        'party_id'     => $data['customer_id'],
                    ],
                    [
                        'account_code' => '1200',
                        'debit'        => 0,
                        'credit'       => $advanceAmount,
                        'party_id'     => $data['customer_id'],
                    ],
                ]);

                // The settlement pays the invoice, so it must count toward the badge.
                $alreadyAllocated = (float) DB::table('allocations')
                    ->where('tenant_id', $tid)
                    ->where('sale_id', $saleId)
                    ->where('status', 'active')
                    ->sum('allocated_amount');
                $settleAmount = round(min($advanceAmount, $invoiceTotal - $alreadyAllocated), 2);
                if ($settleAmount > 0) {
                    $this->payments->allocate($settlement->id, [
                        ['sale_id' => $saleId, 'amount' => $settleAmount],
                    ]);
                }
            }

            return DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $saleId)->first();

        });
    }

    /**
     * Fully reverse a posted sale (B9 — Sale Return).
     * Restores stock to original FIFO batches and reverses the journal.
     *
     * @param string      $saleId
     * @param string      $reason
     * @param string|null $returnDate  ISO date string; defaults to today
     * @param array       $items       Optional partial return filter — not yet used (full reversal for now)
     */
    public function reverse(
        string  $saleId,
        string  $reason,
        ?string $returnDate = null,
        array   $items      = []
    ): object {
        return DB::transaction(function () use ($saleId, $reason, $returnDate, $items) {

            $sale = DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $saleId)->lockForUpdate()->firstOrFail();

            if (in_array($sale->status, ['returned', 'cancelled'], true)) {
                throw new \LogicException("Sale {$saleId} has already been returned.");
            }

            $entryDate = $returnDate ?: now()->toDateString();

            // A sale that already had ANY units returned — through this path, the
            // legacy returnSale() partial path or the Returns screen (all three
            // record sale_items.returned_quantity) — can no longer be reversed
            // wholesale: the original journal entry would be undone in full on top
            // of the return entries already posted (revenue, tax, COGS and AR/cash
            // for those units reversed twice). Return whatever is still
            // outstanding through the partial path instead.
            $alreadyReturned = $sale->status === 'partially_returned'
                || DB::table('sale_items')
                    ->where('tenant_id', $this->tenantId)
                    ->where('sale_id', $sale->id)
                    ->where('returned_quantity', '>', 0)
                    ->exists();

            if ($alreadyReturned) {
                if (empty($items)) {
                    $items = DB::table('sale_items')
                        ->where('tenant_id', $this->tenantId)
                        ->where('sale_id', $sale->id)
                        ->get()
                        ->map(fn ($si) => [
                            'sale_item_id' => $si->id,
                            'return_qty'   => max(0.0, (float) $si->quantity - (float) $si->returned_quantity),
                        ])
                        ->filter(fn ($i) => $i['return_qty'] > 0)
                        ->values()
                        ->all();
                }
                $isPartial = true;
            } else {
                // Check if it's a partial return
                $isPartial = !empty($items) && $this->isPartialReturn($sale, $items);
            }

            if ($isPartial) {
                // ─── PARTIAL RETURN PATH (B9) ─────────────────────────────────
                //   DR 4000 Revenue            net value of the returned units
                //   DR 2100 Sales Tax Payable  their share of the output tax
                //   CR 1200 AR / cash / bank   the two together
                //   DR 1100 Inventory / CR 5000 COGS   at the FIFO cost they left at
                //
                // Revenue and tax are pro-rated cumulatively — what has been
                // returned after this return, less what had been returned before
                // it, both rounded to the cent — so however a line is returned in
                // pieces, the pieces add up to exactly what the sale posted.

                // Resolve the refund GL account based on the ORIGINAL sale's payment method.
                $originalPaymentMethod = strtolower($sale->payment_method ?? 'cash');
                if (in_array($originalPaymentMethod, ['bank', 'card', 'online', 'upi'])) {
                    $refundAccountCode = '1010';
                } elseif (in_array($originalPaymentMethod, ['credit', 'ledger', 'khata'])) {
                    $refundAccountCode = '1200';
                } else {
                    $refundAccountCode = '1000'; // cash default
                }

                // What the customer still owes on THIS invoice, before this return.
                $owedBefore = $this->receivableOutstanding($sale);

                $revenueTotal = 0.0;
                $taxTotal     = 0.0;
                $costTotal    = 0.0;
                $touched      = false;

                foreach ($items as $item) {
                    $saleItemId = $item['sale_item_id'];
                    $returnQty = (float)$item['return_qty'];

                    $originalItem = DB::table('sale_items')
                        ->where('tenant_id', $this->tenantId)
                        ->where('sale_id', $sale->id)
                        ->where('id', $saleItemId)
                        ->lockForUpdate()
                        ->first();

                    if (!$originalItem) {
                        continue;
                    }

                    $alreadyReturnedQty  = (float)$originalItem->returned_quantity;
                    $remainingReturnable = max(0.0, (float)$originalItem->quantity - $alreadyReturnedQty);
                    $qty = min($returnQty, $remainingReturnable);
                    if ($qty <= 0) {
                        continue;
                    }
                    $touched = true;

                    // ── Revenue and tax share (cumulative pro-rata) ──────────
                    $originalQty = max(0.0001, (float)$originalItem->quantity);
                    $lineNet     = (float)$originalItem->net_amount;
                    $lineTax     = (float)($originalItem->tax_amount ?? 0);
                    $isFreeLine  = (float)($originalItem->free_quantity ?? 0) >= (float)$originalItem->quantity - 0.0001;

                    if ($lineNet <= 0 && !$isFreeLine) {
                        // Legacy row from before the waterfall columns: no net_amount
                        // recorded, so value the units at their unit price.
                        $lineNet = round((float)$originalItem->unit_price * $originalQty, 2);
                    }

                    $after  = min($originalQty, $alreadyReturnedQty + $qty) / $originalQty;
                    $before = $alreadyReturnedQty / $originalQty;
                    $revenueTotal += round($lineNet * $after, 2) - round($lineNet * $before, 2);
                    $taxTotal     += round($lineTax * $after, 2) - round($lineTax * $before, 2);

                    // ── Restore FIFO stock, newest deduction first ────────────
                    $activeBatches = DB::table('sale_item_batches')
                        ->select('sale_item_batches.*')
                        ->join('inventory_batches', 'sale_item_batches.inventory_batch_id', '=', 'inventory_batches.id')
                        ->where('sale_item_batches.sale_item_id', $originalItem->id)
                        ->where('sale_item_batches.qty_deducted', '>', 0)
                        ->where('sale_item_batches.is_reversed', 0)
                        ->whereNull('sale_item_batches.reversed_at')
                        ->orderBy('inventory_batches.created_at', 'desc')
                        ->orderBy('inventory_batches.seq', 'desc')
                        ->get();

                    // ── Sale units → base units ──────────────────────────────
                    // returned_quantity / return_qty are in the SALE unit (2 CTN),
                    // while the FIFO paper trail is in the product's BASE unit
                    // (24 PCS), so the two cannot be compared directly. sale_items
                    // keeps no UOM, but its live slices say how many base units
                    // are still out for the sale units still out: this return
                    // takes its share of them, and the last unit of the line takes
                    // whatever is left, so however the line comes back the pieces
                    // add up to exactly what left the batches. For a line sold in
                    // the base unit the share is the returned qty itself.
                    $liveBase = (float) $activeBatches->sum(fn ($sib) => (float) $sib->qty_deducted);
                    if ($qty >= $remainingReturnable - 0.00001) {
                        $qtyToRestore = $liveBase;
                    } else {
                        $qtyToRestore = min($liveBase, round($liveBase * $qty / $remainingReturnable, 4));
                    }
                    $restoredBase = 0.0;

                    foreach ($activeBatches as $sib) {
                        if ($qtyToRestore <= 0.00001) break;
                        $restoreFromThis = min((float)$sib->qty_deducted, $qtyToRestore);
                        $batch = DB::table('inventory_batches')->where('id', $sib->inventory_batch_id)->lockForUpdate()->first();
                        if ($batch) {
                            $everTaken   = (float)($batch->initial_qty ?? $batch->original_qty) - (float)$batch->remaining_qty;
                            $restoredQty = min($restoreFromThis, $everTaken);

                            DB::table('inventory_batches')
                                ->where('id', $batch->id)
                                ->increment('remaining_qty', $restoredQty);
                            $restoredBase += $restoredQty;

                            // COGS comes back at what this slice was costed at when
                            // it left: the drop in the slice's own total_cogs, so a
                            // line returned in pieces restores exactly what it took.
                            $sliceCogs = (float)($sib->total_cogs ?? round((float)$sib->qty_deducted * (float)$sib->unit_cost, 2));

                            if ($restoredQty >= (float)$sib->qty_deducted - 0.00001) {
                                $costTotal += $sliceCogs;
                                DB::table('sale_item_batches')
                                    ->where('id', $sib->id)
                                    ->update([
                                        // is_reversed is the flag FifoService::restoreStock(), the
                                        // COGS report and every SIB reader filter on — reversed_at
                                        // alone left this slice counted as live COGS (and let a later
                                        // full return restore the same stock twice).
                                        'is_reversed' => 1,
                                        'reversed_at' => now(),
                                        'reversal_reason' => "Partial return of {$sale->reference_number}"
                                    ]);
                            } else {
                                $newQty  = (float)$sib->qty_deducted - $restoredQty;
                                $newCogs = round($newQty * (float)$sib->unit_cost, 2);
                                $costTotal += $sliceCogs - $newCogs;
                                DB::table('sale_item_batches')
                                    ->where('id', $sib->id)
                                    ->update([
                                        'qty_deducted' => $newQty,
                                        'total_cogs'   => $newCogs,
                                    ]);
                            }
                        }
                        $qtyToRestore -= $restoreFromThis;
                    }

                    // Keep the denormalised counters in step with what actually
                    // went back into the batches.
                    if ($restoredBase > 0) {
                        $this->adjustStockAggregates($originalItem->product_id, $sale->warehouse_id, $restoredBase);
                    }

                    if ($originalItem->product_variant_id && $restoredBase > 0) {
                        DB::table('product_variants')
                            ->where('id', $originalItem->product_variant_id)
                            ->increment('stock', $restoredBase);
                    }

                    DB::table('sale_items')->where('id', $originalItem->id)->increment('returned_quantity', $qty);
                }

                if (!$touched) {
                    throw new \LogicException("Nothing left to return on this sale.");
                }

                $revenueTotal = round($revenueTotal, 2);
                $taxTotal     = round($taxTotal, 2);
                $costTotal    = round($costTotal, 2);
                $returnValue  = round($revenueTotal + $taxTotal, 2);

                // The credit goes first against what is still owed on this
                // invoice (a part-paid cash sale's remainder sits on 1200); only
                // the rest leaves the drawer / bank. A credit sale's return always
                // lands on the customer's account.
                if ($refundAccountCode === '1200') {
                    $toReceivable = $returnValue;
                } else {
                    $toReceivable = round(min($returnValue, max(0.0, $owedBefore)), 2);
                }
                $toRefund = round($returnValue - $toReceivable, 2);

                $journalItems = [];
                if ($revenueTotal > 0) {
                    $journalItems[] = ['account_id' => $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income')->id,
                        'debit' => $revenueTotal, 'credit' => 0, 'party_id' => $sale->party_id];
                }
                if ($taxTotal > 0) {
                    $journalItems[] = ['account_id' => $this->accounting->getAccountByCode('2100', 'Sales Tax Payable', 'liability')->id,
                        'debit' => $taxTotal, 'credit' => 0];
                }
                if ($toReceivable > 0) {
                    // Tag the customer so a 1200 credit reduces THEIR sub-ledger
                    // (aged receivables / party statement), same as the sale did.
                    $journalItems[] = ['account_id' => $this->accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset')->id,
                        'debit' => 0, 'credit' => $toReceivable, 'party_id' => $sale->party_id];
                }
                if ($toRefund > 0) {
                    $journalItems[] = ['account_id' => $this->accounting->getAccountByCode($refundAccountCode)->id,
                        'debit' => 0, 'credit' => $toRefund, 'party_id' => $sale->party_id];
                }
                if ($costTotal > 0) {
                    $journalItems[] = ['account_id' => $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset')->id,
                        'debit' => $costTotal, 'credit' => 0];
                    $journalItems[] = ['account_id' => $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense')->id,
                        'debit' => 0, 'credit' => $costTotal];
                }

                // Post the partial reversal journal entry. reference_type
                // 'sale_return' is what every return entry carries (Returns
                // screen, POS open return) and what the dashboard, day book and
                // fund ledger classify as a return; source_* ties it to the sale.
                if (!empty($journalItems)) {
                    $this->accounting->createEntry([
                        'date'           => $entryDate,
                        'reference_type' => 'sale_return',
                        'reference'      => 'PRET-' . $sale->reference_number,
                        'description'    => "Partial return of {$sale->reference_number}. Reason: {$reason}",
                        'party_id'       => $sale->party_id,
                        'source_type'    => \App\Models\Sale::class,
                        'source_id'      => $sale->id,
                    ], $journalItems);
                }

                // Record Refund Payment
                if ($returnValue > 0) {
                    \App\Models\Payment::create([
                        'sale_id'   => $sale->id,
                        'party_id'  => $sale->party_id,
                        'amount'    => -$returnValue,
                        'type'      => 'out',
                        'method'    => $sale->payment_method ?? 'cash',
                        'reference' => 'Partial refund of payment: ' . $sale->reference_number,
                        'date'      => $entryDate,
                    ]);
                }

                // Check if the entire sale is now fully returned across all items
                $allSaleItems = DB::table('sale_items')->where('tenant_id', $this->tenantId)->where('sale_id', $sale->id)->get();
                $isFullyReturned = true;
                foreach ($allSaleItems as $si) {
                    if ((float)$si->returned_quantity < (float)$si->quantity - 0.0001) {
                        $isFullyReturned = false;
                        break;
                    }
                }

                $newStatus = $isFullyReturned ? 'returned' : 'partially_returned';

                DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $sale->id)->update([
                    'status' => $newStatus,
                    'updated_at' => now(),
                ]);

                // S-024: what is still owed changed — rebuild the payment badge.
                $this->refreshBadgeAfterReturn($sale);

                return DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $sale->id)->first();
            }

            // ─── FULL RETURN PATH ──────────────────────────────────────────────────
            // Restore stock for every sale_item, and the denormalised counters by
            // exactly what goes back into the batches.
            $saleItems = DB::table('sale_items')->where('tenant_id', $this->getTenantId())->where('sale_id', $saleId)->get();
            foreach ($saleItems as $saleItem) {
                $restoring = (float) DB::table('sale_item_batches')
                    ->where('tenant_id', $this->tenantId)
                    ->where('sale_item_id', $saleItem->id)
                    ->where('is_reversed', 0)
                    ->sum('qty_deducted');

                $this->fifo->restoreStock($saleItem->id);

                if ($restoring > 0) {
                    $this->adjustStockAggregates($saleItem->product_id, $sale->warehouse_id, $restoring);
                }

                DB::table('sale_items')
                    ->where('tenant_id', $this->tenantId)
                    ->where('id', $saleItem->id)
                    ->update(['returned_quantity' => $saleItem->quantity]);
            }

            // Reverse the journal entry (auto-voids payment allocations)
            $journalEntryId = DB::table('journal_entries')
                ->where('tenant_id', $this->tenantId)
                ->where('reference_type', 'sale')
                ->where('reference', $saleId)
                ->where('is_reversed', 0)
                ->value('id');

            if ($journalEntryId) {
                $this->accounting->reverseEntry($journalEntryId, $reason);
            }

            // Reverse payments in the payments table
            $payments = DB::table('payments')->where('sale_id', $sale->id)->get();
            foreach ($payments as $payment) {
                $exists = DB::table('payments')
                    ->where('sale_id', $sale->id)
                    ->where('amount', -$payment->amount)
                    ->where('method', $payment->method)
                    ->where('reference', 'like', 'REVERSAL%')
                    ->exists();

                if (!$exists) {
                    \App\Models\Payment::create([
                        'sale_id'   => $sale->id,
                        'party_id'  => $payment->party_id,
                        'amount'    => -$payment->amount,
                        'type'      => $payment->type === 'in' ? 'out' : 'in',
                        'method'    => $payment->method,
                        'reference' => 'REVERSAL of payment: ' . $payment->reference,
                        'date'      => $returnDate ?? now()->toDateString(),
                    ]);
                }
            }

            // Mark sale as returned
            DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $saleId)->update([
                'status'     => 'returned',
                'updated_at' => now(),
            ]);

            return DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $saleId)->first();
        });
    }

    /**
     * Determine if a return is partial.
     */
    private function isPartialReturn(object $sale, array $items): bool
    {
        if (empty($items)) {
            return false;
        }

        $saleItems = DB::table('sale_items')
            ->where('tenant_id', $this->tenantId)
            ->where('sale_id', $sale->id)
            ->get();

        if (count($items) < count($saleItems)) {
            return true;
        }

        foreach ($items as $item) {
            $originalItem = $saleItems->firstWhere('id', $item['sale_item_id']);
            if (!$originalItem) {
                continue;
            }
            $remaining = (float)$originalItem->quantity - (float)$originalItem->returned_quantity;
            if ((float)$item['return_qty'] < $remaining - 0.0001) {
                return true;
            }
        }

        return false;
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Move the denormalised stock counters (stocks per warehouse, and the
     * product master's stock_quantity) by $delta base units — negative when
     * goods leave, positive when they come back. FIFO batches stay the source
     * of truth; this only keeps the counters the POS and stock screens read in
     * step with them. Same conventions as InventoryService / PurchaseService.
     */
    private function adjustStockAggregates(string|int $productId, string|int|null $warehouseId, float $delta): void
    {
        if (abs($delta) < 0.00001) {
            return;
        }

        $tid = $this->tenantId;

        if (DB::table('products')->where('tenant_id', $tid)->where('id', $productId)->value('type') === 'service') {
            return;
        }

        if ($warehouseId !== null) {
            $stock = DB::table('stocks')
                ->where('tenant_id', $tid)
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->first();

            if ($stock) {
                DB::table('stocks')->where('id', $stock->id)->increment('quantity', $delta);
            } else {
                DB::table('stocks')->insert([
                    'id'           => Str::uuid()->toString(),
                    'tenant_id'    => $tid,
                    'product_id'   => $productId,
                    'warehouse_id' => $warehouseId,
                    'quantity'     => $delta,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }
        }

        DB::table('products')->where('tenant_id', $tid)->where('id', $productId)->increment('stock_quantity', $delta);
    }

    /**
     * What the customer still owes on THIS invoice, read from the ledger:
     * the 1200 movements of the sale's own entries (the unpaid part at the
     * till, its advance settlement, the returns already credited against it —
     * engine partial returns and Returns-screen credit notes alike), less
     * payments received against it through allocations (B4).
     */
    private function receivableOutstanding(object $sale): float
    {
        $tid = $this->tenantId;

        $arAccountId = DB::table('accounts')->where('tenant_id', $tid)->where('code', '1200')->value('id');
        if (!$arAccountId) {
            return 0.0;
        }

        $returnSaleIds = DB::table('sales')
            ->where('tenant_id', $tid)
            ->where('original_sale_id', $sale->id)
            ->pluck('id')
            ->all();

        $entryIds = DB::table('journal_entries')
            ->where('tenant_id', $tid)
            ->where('is_reversed', 0)
            ->where(function ($q) use ($sale, $returnSaleIds) {
                $q->where(function ($w) use ($sale) {
                    $w->whereIn('reference_type', ['sale', 'advance_settlement'])
                      ->where('reference', $sale->id);
                })->orWhere('source_id', $sale->id);
                if (!empty($returnSaleIds)) {
                    $q->orWhere(function ($w) use ($returnSaleIds) {
                        $w->where('reference_type', 'sale_return')->whereIn('reference', $returnSaleIds);
                    });
                }
            })
            ->pluck('id')
            ->all();

        $onEntries = empty($entryIds) ? 0.0 : (float) DB::table('journal_items')
            ->whereIn('journal_entry_id', $entryIds)
            ->where('account_id', $arAccountId)
            ->selectRaw('COALESCE(SUM(debit) - SUM(credit), 0) as bal')
            ->value('bal');

        $paidAgainst = (float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $sale->id)
            ->where('status', 'active')
            ->when(!empty($entryIds), fn ($q) => $q->whereNotIn('payment_journal_entry_id', $entryIds))
            ->sum('allocated_amount');

        return round($onEntries - $paidAgainst, 2);
    }


    /**
     * Payment badge after a partial return. An engine sale is paid through
     * allocations and PaymentService::updatePaymentBadge() reads them; a sale
     * rung up on the legacy POS (SaleController@store) was paid at the till
     * and has no allocation rows at all, so that method would call a fully
     * paid cash sale 'unpaid' the moment one unit came back. For those the
     * badge is read from the ledger instead: what is still owed on the
     * invoice (receivableOutstanding) against what it is now worth.
     */
    private function refreshBadgeAfterReturn(object $sale): void
    {
        $tid = $this->tenantId;

        $hasAllocations = DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $sale->id)
            ->exists();

        if ($hasAllocations) {
            $this->payments->updatePaymentBadge($sale->id);
            return;
        }

        $current = DB::table('sales')->where('tenant_id', $tid)->where('id', $sale->id)->first();
        if (!$current || $current->payment_status === 'written_off') {
            return;
        }

        $returnedValue = (float) DB::table('sale_items')
            ->where('tenant_id', $tid)
            ->where('sale_id', $sale->id)
            ->where('returned_quantity', '>', 0)
            ->selectRaw('COALESCE(SUM(returned_quantity * CASE WHEN net_amount > 0 AND quantity > 0 THEN (net_amount + COALESCE(tax_amount, 0)) / quantity ELSE unit_price END), 0) as v')
            ->value('v');
        $worth     = max(0.0, round((float) ($current->total ?? 0) - $returnedValue, 2));
        $owed      = max(0.0, $this->receivableOutstanding($current));
        $tolerance = (float) (DB::table('system_settings')->where('tenant_id', $tid)
            ->where('key', 'roundoff_tolerance')->value('value') ?? 1.00);

        if ($owed <= $tolerance) {
            $status = 'paid';
        } elseif ($owed >= $worth - 0.005) {
            $status = 'unpaid';
        } else {
            $status = 'partial';
        }

        DB::table('sales')->where('tenant_id', $tid)->where('id', $sale->id)
            ->update(['payment_status' => $status, 'updated_at' => now()]);
    }

    /**
     * S-042: Apply tiered pricing to a product line.
     * Splits the qty across configured tiers and returns one item per tier.
     * If no tiers exist, returns the item unchanged (caller's price used).
     *
     * @return array  One or more line items with unit_price set from tiers
     */
    private function applyTieredPricing(array $item): array
    {
        $tiers = DB::table('product_price_tiers')
            ->where('tenant_id', $this->tenantId)
            ->where('product_id', $item['product_id'])
            ->orderBy('min_qty')
            ->get();

        if ($tiers->isEmpty()) {
            return [$item]; // no tiers — use submitted price as-is
        }

        $totalQty   = (float) $item['qty'];
        $remaining  = $totalQty;
        $splitLines = [];

        foreach ($tiers as $tier) {
            if ($remaining <= 0.0001) break;

            if ($totalQty < (float) $tier->min_qty) {
                continue;
            }

            $tierMax = $tier->max_qty !== null ? (float) $tier->max_qty : PHP_FLOAT_MAX;

            // How much of the TOTAL qty falls within this tier's range
            $qtyUpToThisTierMax   = min($totalQty, $tierMax);
            $qtyBeforeThisTier    = $totalQty - $remaining;
            $inTier               = max(0, $qtyUpToThisTierMax - $qtyBeforeThisTier);

            if ($inTier <= 0.0001) continue;

            $splitLines[] = array_merge($item, [
                'qty'        => $inTier,
                'unit_price' => (float) $tier->unit_price,
            ]);

            $remaining -= $inTier;
        }

        // Any qty beyond all tier max values uses the last tier's price
        if ($remaining > 0.0001 && !empty($splitLines)) {
            $last = end($splitLines);
            $splitLines[] = array_merge($item, [
                'qty'        => $remaining,
                'unit_price' => $last['unit_price'],
            ]);
        }

        return $splitLines ?: [$item];
    }
}
