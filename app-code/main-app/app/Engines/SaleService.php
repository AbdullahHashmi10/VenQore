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

            $saleId        = Str::uuid()->toString();
            $invoiceNumber = \App\Services\SequenceService::generateTransactionNumber('SAL');

            // ── 1. Calculate line totals and deduct stock ─────────────
            $subtotalGross      = 0.00;
            $totalItemDiscounts = 0.00;
            $taxTotal           = 0.00;
            $cogsTotal          = 0.00;
            $lineItems          = [];

            // ── S-042 Tiered pricing: expand items before processing ──
            $expandedItems = [];
            foreach ($data['items'] as $item) {
                foreach ($this->applyTieredPricing($item) as $tieredItem) {
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
                    $baseQty = $this->uom->toBaseQty(
                        $item['product_id'],
                        $qty,
                        $item['sale_uom']
                    );

                    // FIFO deduction — returns array of batch deductions
                    $deductions = $this->fifo->deductStock(
                        productId:   $item['product_id'],
                        warehouseId: $data['warehouse_id'],
                        qty:         $baseQty,
                        saleUom:     $item['sale_uom']
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
                    // Overpayment — record surplus as Customer Advance (Account 2100)
                    $surplus = round($amountReceived - $invoiceTotal, 2);
                    $journalLines[] = [
                        'account_code' => '2100',
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
                'user_id'              => $data['approved_by'] ?? auth()->id() ?? 1, // added for legacy
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

                // Verify customer has sufficient advance balance on account 2100
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
                    ->where('a.code', '2100')
                    ->where('je.is_reversed', 0)
                    ->selectRaw('IFNULL(SUM(ji.credit) - SUM(ji.debit), 0) as balance')
                    ->value('balance') ?? 0);

                if ($advanceAmount > $advanceBalance + 0.01) {
                    throw new \InvalidArgumentException(
                        "Advance settlement amount {$advanceAmount} exceeds " .
                        "available advance balance {$advanceBalance}."
                    );
                }

                // Step 2 settlement journal: DR 2100 / CR 1200
                // This reduces the advance liability and offsets the AR from the sale
                $this->accounting->createEntry([
                    'date'     => $data['sale_date'],
                    'reference_type' => 'advance_settlement',
                    'reference'   => $saleId,
                    'description'    => 'Advance settlement — ' . $invoiceNumber,
                    'party_id'       => $data['customer_id'],
                ], [
                    [
                        'account_code' => '2100',
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

            if ($sale->status === 'returned') {
                throw new \LogicException("Sale {$saleId} has already been returned.");
            }

            // Check if it's a partial return
            $isPartial = !empty($items) && $this->isPartialReturn($sale, $items);

            if ($isPartial) {
                // ─── PARTIAL RETURN PATH ──────────────────────────────────────
                $returnTotal = 0.0;
                $journalItems = [];

                // Resolve the refund GL account based on the ORIGINAL sale's payment method.
                $originalPaymentMethod = strtolower($sale->payment_method ?? 'cash');
                if (in_array($originalPaymentMethod, ['bank', 'card', 'online', 'upi'])) {
                    $refundAccountCode = '1010';
                } elseif (in_array($originalPaymentMethod, ['credit', 'ledger', 'khata'])) {
                    $refundAccountCode = '1200';
                } else {
                    $refundAccountCode = '1000'; // cash default
                }

                $refundAccount = $this->accounting->getAccountByCode($refundAccountCode);
                $cogsAccount   = $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
                $invAccount    = $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
                $incAccount    = $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income');

                foreach ($items as $item) {
                    $saleItemId = $item['sale_item_id'];
                    $returnQty = (float)$item['return_qty'];

                    $originalItem = DB::table('sale_items')
                        ->where('tenant_id', $this->tenantId)
                        ->where('sale_id', $sale->id)
                        ->where('id', $saleItemId)
                        ->first();

                    if (!$originalItem) {
                        continue;
                    }

                    $alreadyReturned = (float)$originalItem->returned_quantity;
                    $remainingReturnable = max(0.0, (float)$originalItem->quantity - $alreadyReturned);
                    $qty = min($returnQty, $remainingReturnable);
                    if ($qty <= 0) {
                        continue;
                    }

                    // Pro-rate net revenue
                    $originalQty = max(0.001, (float)$originalItem->quantity);
                    $netAmountPerUnit = ((float)$originalItem->net_amount > 0)
                        ? (float)$originalItem->net_amount / $originalQty
                        : (float)$originalItem->unit_price;

                    $lineRevenue = round($netAmountPerUnit * $qty, 4);
                    $returnTotal += $lineRevenue;

                    // Restore FIFO stock
                    $activeBatches = DB::table('sale_item_batches')
                        ->select('sale_item_batches.*')
                        ->join('inventory_batches', 'sale_item_batches.inventory_batch_id', '=', 'inventory_batches.id')
                        ->where('sale_item_batches.sale_item_id', $originalItem->id)
                        ->where('sale_item_batches.qty_deducted', '>', 0)
                        ->whereNull('sale_item_batches.reversed_at')
                        ->orderBy('inventory_batches.created_at', 'desc')
                        ->orderBy('inventory_batches.seq', 'desc')
                        ->get();

                    $qtyToRestore = $qty;
                    $costToRestore = 0.0;

                    foreach ($activeBatches as $sib) {
                        \Illuminate\Support\Facades\Log::info("reverse() activeBatch SIB: " . json_encode($sib));
                        if ($qtyToRestore <= 0) break;
                        $restoreFromThis = min((float)$sib->qty_deducted, $qtyToRestore);
                        $batch = DB::table('inventory_batches')->where('id', $sib->inventory_batch_id)->first();
                        \Illuminate\Support\Facades\Log::info("reverse() activeBatch batch: " . json_encode($batch));
                        if ($batch) {
                            $restoredQty = min($restoreFromThis, (float)$batch->initial_qty - (float)$batch->remaining_qty);
                            \Illuminate\Support\Facades\Log::info("reverse() activeBatch restoredQty: " . $restoredQty);
                            
                            // Increment remaining_qty on inventory_batches
                            DB::table('inventory_batches')
                                ->where('id', $batch->id)
                                ->increment('remaining_qty', $restoredQty);

                            $costToRestore += $restoredQty * (float)$batch->unit_cost;
                            
                            if ($restoredQty >= (float)$sib->qty_deducted) {
                                // Mark reversed
                                DB::table('sale_item_batches')
                                    ->where('id', $sib->id)
                                    ->update([
                                        'reversed_at' => now(),
                                        'reversal_reason' => "Partial return of {$sale->reference_number}"
                                    ]);
                            } else {
                                $newQty = (float)$sib->qty_deducted - $restoredQty;
                                DB::table('sale_item_batches')
                                    ->where('id', $sib->id)
                                    ->update([
                                        'qty_deducted' => $newQty,
                                        'total_cogs' => $newQty * (float)$sib->unit_cost
                                    ]);
                            }
                        }
                        $qtyToRestore -= $restoreFromThis;
                    }

                    // Sync legacy stocks and aggregates
                    $stock = DB::table('stocks')
                        ->where('product_id', $originalItem->product_id)
                        ->where('warehouse_id', $sale->warehouse_id)
                        ->first();
                    if ($stock) {
                        DB::table('stocks')->where('id', $stock->id)->increment('quantity', $qty);
                    }

                    if ($originalItem->product_variant_id) {
                        DB::table('product_variants')
                            ->where('id', $originalItem->product_variant_id)
                            ->increment('stock', $qty);
                    }

                    DB::table('products')->where('id', $originalItem->product_id)->increment('stock_quantity', $qty);

                    // Reversal journal lines
                    if ($costToRestore > 0 && $cogsAccount && $invAccount) {
                        $journalItems[] = [
                            'account_id' => $invAccount->id,
                            'debit' => $costToRestore,
                            'credit' => 0,
                            'description' => "Inventory restored: partial return of {$sale->reference_number}"
                        ];
                        $journalItems[] = [
                            'account_id' => $cogsAccount->id,
                            'debit' => 0,
                            'credit' => $costToRestore,
                            'description' => "COGS reversal: partial return of {$sale->reference_number}"
                        ];
                    }

                    if ($lineRevenue > 0 && $refundAccount && $incAccount) {
                        $journalItems[] = [
                            'account_id' => $incAccount->id,
                            'debit' => $lineRevenue,
                            'credit' => 0,
                            'description' => "Revenue reversal: partial return of {$sale->reference_number}"
                        ];
                        $journalItems[] = [
                            'account_id' => $refundAccount->id,
                            'debit' => 0,
                            'credit' => $lineRevenue,
                            'description' => "Refund ({$refundAccountCode}): partial return of {$sale->reference_number}"
                        ];
                    }

                    DB::table('sale_items')->where('id', $originalItem->id)->increment('returned_quantity', $qty);
                }

                if ($returnTotal == 0 && empty($journalItems)) {
                    throw new \LogicException("Nothing left to return on this sale.");
                }

                // Post the partial reversal journal entry
                if (!empty($journalItems)) {
                    $this->accounting->createEntry([
                        'date' => now()->toDateString(),
                        'reference' => 'PRET-' . $sale->reference_number,
                        'description' => "Partial return of {$sale->reference_number}. Reason: {$reason}",
                        'party_id' => $sale->party_id,
                        'source_type' => \App\Models\Sale::class,
                        'source_id' => $sale->id,
                    ], $journalItems);
                }

                // Record Refund Payment
                \App\Models\Payment::create([
                    'sale_id'   => $sale->id,
                    'party_id'  => $sale->party_id,
                    'amount'    => -$returnTotal,
                    'type'      => 'out',
                    'method'    => $sale->payment_method ?? 'cash',
                    'reference' => 'Partial refund of payment: ' . $sale->reference_number,
                    'date'      => $returnDate ?? now()->toDateString(),
                ]);

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

                return DB::table('sales')->where('tenant_id', $this->tenantId)->where('id', $sale->id)->first();
            }

            // ─── FULL RETURN PATH ──────────────────────────────────────────────────
            // Restore stock for every sale_item
            $saleItems = DB::table('sale_items')->where('tenant_id', $this->getTenantId())->where('sale_id', $saleId)->get();
            foreach ($saleItems as $saleItem) {
                $this->fifo->restoreStock($saleItem->id);
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
