<?php

namespace App\Engines;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * THE canonical purchase engine.
 *
 * Purchases live in `purchases` / `purchase_items` / `purchase_returns`. Full stop.
 * Nothing may write a purchase into the `invoices` table — see V3_CONSOLIDATION_PLAN.md.
 *
 * ── Phase 2 (capability parity) additions, 2026-08-11 ────────────────────────
 *   update()            — reverse-and-repost, never mutates a posted journal
 *   void()              — reverse + cancel, never hard-deletes
 *   receive()           — partial/full goods receipt workflow
 *   applyLandedCosts()  — value/quantity allocation + Expense rows
 *   header discount · round_off · variant_id · supplier→party resolution
 *   default-warehouse fallback
 *
 * ── Two deliberate divergences from the legacy implementation ───────────────
 *
 * 1. LANDED COSTS ARE CAPITALISED, NOT EXPENSED.
 *    Legacy did both: it folded the landed cost into `effective_unit_cost` (so it
 *    reached COGS through FIFO) AND debited an expense account for the same
 *    amount. That double-counts the cost. Here the landed cost is capitalised
 *    into inventory (DR 1100) so the ledger agrees with the FIFO batch valuation,
 *    and the `Expense` rows are still written for reporting/audit with
 *    `is_landed_cost = true` — but they are not posted a second time.
 *
 *    Legacy also debited account 5100, which `TenantDefaultSeeder` defines as
 *    "Salaries & Wages". That is a straightforward miscoding.
 *
 *    Related: legacy credited the landed cost to the SUPPLIER's payable, with
 *    their party_id attached. Freight and customs are not owed to the supplier
 *    of the goods, so that inflated the supplier's balance and made supplier
 *    statements disagree with reality. Here the landed cost is accrued to
 *    Accounts Payable with no party attached.
 *
 * 2. AN UNRECEIVED PURCHASE IS AN UNPOSTED DOCUMENT.
 *    Legacy posted the AP liability at creation even when nothing had been
 *    received, which debits Inventory with no matching FIFO batch and breaks
 *    ledger↔stock reconciliation. Here, `workflow_status = 'pending'` posts no
 *    journal; the journal is posted by receive() when goods actually arrive.
 *    `workflow_status = 'received'` (the default) behaves exactly as before.
 *
 * Both divergences will show up as differences in a naive legacy-vs-V3 journal
 * parity test. That is expected and correct — see the plan's Phase 2 exit note.
 */
class PurchaseService
{
    /** Chart-of-accounts codes, per database/seeders/TenantDefaultSeeder.php. */
    private const ACC_CASH            = '1000';
    private const ACC_BANK            = '1010';
    private const ACC_INVENTORY       = '1100';
    private const ACC_PAYABLE         = '2000';
    private const ACC_INPUT_TAX       = '2300';
    private const ACC_NONRECOVER_TAX  = '6000';
    /** Landed cost stranded on goods sent back to the supplier. */
    private const ACC_LANDED_COST_WRITEOFF = '6000';
    private const ACC_ROUNDOFF_INCOME = '4900';
    private const ACC_ROUNDOFF_EXPENSE = '5900';

    public function __construct(
        private AccountingService $accounting,
        private InventoryService  $inventory,
        private TaxService        $tax
    ) {}

    // ═════════════════════════════════════════════════════════════════════════
    // CREATE
    // ═════════════════════════════════════════════════════════════════════════

    public function store(array $validated)
    {
        return DB::transaction(function () use ($validated) {
            $tenantId      = $this->tenantId();
            $purchaseId    = Str::uuid()->toString();
            $invoiceNumber = \App\Services\SequenceService::generateTransactionNumber('PUR');

            $partyId       = $this->resolvePartyId($validated);
            $warehouseId   = $this->resolveWarehouseId($validated);
            $workflowStatus = $validated['workflow_status'] ?? 'received';
            $isReceived    = $workflowStatus === 'received';

            $totals = $this->calculateTotals($validated);

            // Landed costs are capitalised, so they raise the value of the goods
            // that hit the FIFO batches. Allocate before the batches are created.
            $extras          = $validated['extras'] ?? [];
            $allocation      = $this->allocateLandedCosts($totals['lineItems'], $extras);
            $lineItems       = $allocation['lineItems'];
            $landedCostTotal = $allocation['total'];

            $grandTotal = self::exactSum([$totals['subtotal'], -$totals['discount'], $totals['taxTotal'], $totals['roundOff']]);

            $journalEntryId = null;

            /* How much of this bill was settled at the counter. A cash purchase
               with no figure given means paid in full, which is what 'cash'
               used to mean on its own; a credit purchase with a figure means
               part of it was paid now. Never more than the bill. */
            $amountPaid = $this->paidNow($validated, $grandTotal);
            $paymentStatus = $amountPaid >= $grandTotal - 0.005
                ? 'paid'
                : ($amountPaid > 0.005 ? 'partial' : 'unpaid');

            if ($isReceived) {
                $journalEntry = $this->postPurchaseJournal(
                    purchaseId:    $purchaseId,
                    invoiceNumber: $invoiceNumber,
                    partyId:       $partyId,
                    date:          $validated['purchase_date'],
                    totals:        $totals,
                    landedCost:    $landedCostTotal,
                    grandTotal:    $grandTotal,
                    paymentMethod: $validated['payment_method'] ?? 'credit',
                    amountPaid:    $amountPaid,
                    paymentAccountId: $validated['payment_account_id'] ?? null
                );
                $journalEntryId = $journalEntry->id;
            }

            DB::table('purchases')->insert([
                'id'               => $purchaseId,
                'tenant_id'        => $tenantId,
                'invoice_number'   => $validated['supplier_invoice'] ?? $invoiceNumber,
                'reference'        => $validated['reference'] ?? null,
                'party_id'         => $partyId,
                'warehouse_id'     => $warehouseId,
                'purchase_date'    => $validated['purchase_date'],
                'due_date'         => $validated['due_date'] ?? null,
                'subtotal'         => $totals['subtotal'],
                'tax'              => $totals['taxTotal'],
                'discount'         => $totals['discount'],
                'round_off'        => $totals['roundOff'],
                'total'            => $grandTotal,
                'payment_status'   => $isReceived ? $paymentStatus : 'unpaid',
                'workflow_status'  => $workflowStatus,
                'payment_method'   => $validated['payment_method'] ?? null,
                'notes'            => $validated['notes'] ?? null,
                'journal_entry_id' => $journalEntryId,
                'created_by'       => auth()->id(),
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $this->writeItemsAndReceive($purchaseId, $warehouseId, $lineItems, $isReceived, $invoiceNumber);

            if (! empty($extras)) {
                $this->writeLandedCostExpenses($purchaseId, $extras, $validated['purchase_date'], $invoiceNumber);
            }

            /* Mark the cheque leaf as issued so it cannot be reused. The leaf is
               only linked when the purchase is received and actually paid with a
               cheque; a pending (goods not yet arrived) purchase posts no journal
               and issues no instrument. */
            if ($isReceived && $amountPaid > 0.0001) {
                $paymentAccountId = $validated['payment_account_id'] ?? null;
                $chequeLeafId     = $validated['cheque_leaf_id'] ?? null;
                if (is_string($paymentAccountId) && strtoupper($paymentAccountId) === 'CHEQUE' && $chequeLeafId) {
                    $tenant = app('current.tenant');
                    app(\App\Services\Cheque\ChequeLifecycleService::class)->issueCheque(
                        $tenant,
                        $chequeLeafId,
                        null,                                                  // paymentId — no payments row for a purchase payment
                        $amountPaid,
                        $partyId,                                              // payee = the supplier
                        $validated['purchase_date'],                           // issueDate
                        $validated['cheque_date'] ?? $validated['purchase_date'], // chequeDate
                        null,                                                  // user — will use auth()
                        null,                                                  // approvalDocId
                    );
                }
            }

            return $this->find($purchaseId);
        });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // UPDATE — reverse and re-post. The original journal is never mutated.
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Ported from the legacy PurchaseController::update() pattern, with one
     * correction: legacy hard-DELETED the inventory batches. That destroys the
     * audit trail and silently loses any batch that had already been consumed by
     * a sale. Here batches are voided through FifoService::voidPurchaseBatches(),
     * which refuses to lose consumed quantity and reports warnings instead.
     */
    public function update(string $purchaseId, array $validated)
    {
        return DB::transaction(function () use ($purchaseId, $validated) {
            $tenantId = $this->tenantId();
            $purchase = $this->lockPurchase($purchaseId);

            if (($purchase->workflow_status ?? null) === 'cancelled') {
                throw new \DomainException('A cancelled purchase cannot be edited. Create a new purchase instead.');
            }

            $this->reverseJournals($purchaseId, $purchase->party_id, 'Purchase edited — ' . $purchase->invoice_number);
            $this->releaseBatches($purchaseId);
            $this->removeItems($purchaseId);

            DB::table('expenses')
                ->where('tenant_id', $tenantId)
                ->where('purchase_id', $purchaseId)
                ->where('is_landed_cost', true)
                ->delete();

            $partyId        = $this->resolvePartyId($validated, $purchase->party_id);
            $warehouseId    = $this->resolveWarehouseId($validated, $purchase->warehouse_id);
            $workflowStatus = $validated['workflow_status'] ?? ($purchase->workflow_status ?? 'received');
            $isReceived     = $workflowStatus === 'received';

            $totals          = $this->calculateTotals($validated);
            $extras          = $validated['extras'] ?? [];
            $allocation      = $this->allocateLandedCosts($totals['lineItems'], $extras);
            $lineItems       = $allocation['lineItems'];
            $landedCostTotal = $allocation['total'];

            $grandTotal = self::exactSum([$totals['subtotal'], -$totals['discount'], $totals['taxTotal'], $totals['roundOff']]);

            $journalEntryId = null;
            /* An edit reverses the old entry and posts a fresh one, so the paid
               figure has to be worked out again here or a part-paid purchase
               would come back from an edit looking wholly unpaid. */
            $amountPaid = array_key_exists('amount_paid', $validated)
                ? $this->paidNow($validated, $grandTotal)
                : $this->paidNow(['payment_method' => $validated['payment_method'] ?? $purchase->payment_method], $grandTotal);

            /* The edit screen's paid figure is everything settled on this bill
               (PurchaseController::paidAmount — counter payment + allocated
               payments), and the form sends it straight back. Payments made
               since the purchase was posted are not reversed by an edit: their
               journal entries and allocations stay. So only what is NOT already
               covered by them was handed over at the counter; re-posting the
               whole figure as a counter payment paid the supplier twice (Cash
               credited again, AP left debited by the supplier payment). Nor can
               the counter take more than is still owed after those payments and
               any debit notes. */
            $settled = app(PaymentService::class)->purchaseSettlementSummary($purchaseId);
            $pm = fn ($v) => \App\Support\Money::parseMinor($v ?? 0, 'amount', false);
            $amountPaid = \App\Support\Money::toFloat(max(0, min(
                $pm($amountPaid) - $pm($settled['allocated']),
                $pm($grandTotal) - $pm($settled['returned']) - $pm($settled['allocated'])
            )));
            if ($isReceived) {
                $journalEntry = $this->postPurchaseJournal(
                    purchaseId:    $purchaseId,
                    invoiceNumber: $purchase->invoice_number,
                    partyId:       $partyId,
                    date:          $validated['purchase_date'],
                    totals:        $totals,
                    landedCost:    $landedCostTotal,
                    grandTotal:    $grandTotal,
                    paymentMethod: $validated['payment_method'] ?? ($purchase->payment_method ?? 'credit'),
                    amountPaid:    $amountPaid,
                    paymentAccountId: $validated['payment_account_id'] ?? null
                );
                $journalEntryId = $journalEntry->id;
            }

            DB::table('purchases')
                ->where('tenant_id', $tenantId)
                ->where('id', $purchaseId)
                ->update([
                    'reference'        => $validated['reference'] ?? $purchase->reference,
                    'party_id'         => $partyId,
                    'warehouse_id'     => $warehouseId,
                    'purchase_date'    => $validated['purchase_date'],
                    'due_date'         => $validated['due_date'] ?? $purchase->due_date,
                    'subtotal'         => $totals['subtotal'],
                    'tax'              => $totals['taxTotal'],
                    'discount'         => $totals['discount'],
                    'round_off'        => $totals['roundOff'],
                    'total'            => $grandTotal,
                    'workflow_status'  => $workflowStatus,
                    'payment_status'   => $isReceived
                        ? ($amountPaid >= $grandTotal - 0.005 ? 'paid' : ($amountPaid > 0.005 ? 'partial' : 'unpaid'))
                        : 'unpaid',
                    'payment_method'   => $validated['payment_method'] ?? $purchase->payment_method,
                    'notes'            => $validated['notes'] ?? $purchase->notes,
                    'journal_entry_id' => $journalEntryId,
                    'updated_at'       => now(),
                ]);

            $this->writeItemsAndReceive($purchaseId, $warehouseId, $lineItems, $isReceived, $purchase->invoice_number);

            if (! empty($extras)) {
                $this->writeLandedCostExpenses($purchaseId, $extras, $validated['purchase_date'], $purchase->invoice_number);
            }

            // payment_status is owned by PaymentService — recompute, never guess.
            $this->refreshPaymentStatus($purchaseId);

            return $this->find($purchaseId);
        });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // VOID — never hard-delete a posted document.
    // ═════════════════════════════════════════════════════════════════════════

    public function void(string $purchaseId, ?string $reason = null): void
    {
        DB::transaction(function () use ($purchaseId, $reason) {
            $tenantId = $this->tenantId();
            $purchase = $this->lockPurchase($purchaseId);

            if (($purchase->workflow_status ?? null) === 'cancelled') {
                return; // idempotent
            }

            $this->reverseJournals(
                $purchaseId,
                $purchase->party_id,
                'Purchase voided — ' . $purchase->invoice_number . ($reason ? ": {$reason}" : '')
            );
            $this->releaseBatches($purchaseId);

            DB::table('purchases')
                ->where('tenant_id', $tenantId)
                ->where('id', $purchaseId)
                ->update([
                    'workflow_status' => 'cancelled',
                    'payment_status'  => 'unpaid',
                    'notes'           => trim(($purchase->notes ?? '') . "\n[VOIDED " . now()->toDateTimeString() . ($reason ? " — {$reason}" : '') . ']'),
                    'updated_at'      => now(),
                ]);
        });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RECEIVE — partial or full goods receipt.
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @param array $lines [['purchase_item_id' => uuid, 'receiving_qty' => float,
     *                       'batch_number' => ?string, 'expiry_date' => ?string], ...]
     */
    public function receive(string $purchaseId, array $lines): array
    {
        $lock = \Illuminate\Support\Facades\Cache::lock("v3_purchase_receive_{$purchaseId}", 10);

        try {
            $lock->block(5);

            return DB::transaction(function () use ($purchaseId, $lines) {
                $tenantId = $this->tenantId();
                $purchase = $this->lockPurchase($purchaseId);

                if (($purchase->workflow_status ?? null) === 'cancelled') {
                    throw new \DomainException('A cancelled purchase cannot be received.');
                }
                if (($purchase->workflow_status ?? null) === 'received') {
                    throw new \DomainException('This purchase has already been fully received.');
                }

                $items = DB::table('purchase_items')
                    ->where('tenant_id', $tenantId)
                    ->where('purchase_id', $purchaseId)
                    ->get()
                    ->keyBy('id');

                // Guard pass — validate everything BEFORE mutating anything.
                foreach ($lines as $line) {
                    $item = $items[$line['purchase_item_id']] ?? null;
                    if (! $item) {
                        throw new \InvalidArgumentException('Unknown purchase item on this purchase.');
                    }
                    $recv = (float) ($line['receiving_qty'] ?? 0);
                    if ($recv <= 0) {
                        continue;
                    }
                    $remaining = (float) $item->qty - (float) ($item->received_qty ?? 0);
                    if ($recv > $remaining + 0.0001) {
                        throw new \DomainException(
                            "Cannot receive {$recv} — only {$remaining} remaining on this line."
                        );
                    }
                }

                /* Priced exactly as store() prices an immediate receipt: net of
                   line and header discounts, plus the landed-cost share — the
                   same value the purchase journal debits to 1100. */
                $lineCosts = $this->storedLineCosts($purchaseId);

                foreach ($lines as $line) {
                    $item = $items[$line['purchase_item_id']] ?? null;
                    $recv = (float) ($line['receiving_qty'] ?? 0);
                    if (! $item || $recv <= 0) {
                        continue;
                    }

                    $this->receiveLine(
                        purchaseId:   $purchaseId,
                        warehouseId:  $purchase->warehouse_id,
                        productId:    $item->product_id,
                        variantId:    $item->variant_id ?? null,
                        qty:          $recv,
                        unitCost:     (float) ($lineCosts[$item->id]['effective'] ?? $item->unit_cost),
                        reference:    $purchase->invoice_number,
                        purchaseItemId: $item->id,
                        batchNumber:  $line['batch_number'] ?? null,
                        expiryDate:   $line['expiry_date'] ?? null
                    );

                    DB::table('purchase_items')
                        ->where('tenant_id', $tenantId)
                        ->where('id', $item->id)
                        ->update([
                            'received_qty' => (float) ($item->received_qty ?? 0) + $recv,
                            'updated_at'   => now(),
                        ]);
                }

                // Recompute the workflow state from the lines themselves.
                $fresh = DB::table('purchase_items')
                    ->where('tenant_id', $tenantId)
                    ->where('purchase_id', $purchaseId)
                    ->get();

                $allReceived = $fresh->every(fn ($i) => (float) ($i->received_qty ?? 0) >= (float) $i->qty - 0.0001);
                $anyReceived = $fresh->contains(fn ($i) => (float) ($i->received_qty ?? 0) > 0);
                $newStatus   = $allReceived ? 'received' : ($anyReceived ? 'partial' : 'pending');

                // First goods in the door on a previously unposted document —
                // post the journal now (see class docblock, divergence 2).
                $journalEntryId = $purchase->journal_entry_id;
                if ($journalEntryId === null && $anyReceived) {
                    $totals = $this->totalsFromStoredItems($purchaseId, (float) $purchase->discount, (float) $purchase->round_off);
                    $entry  = $this->postPurchaseJournal(
                        purchaseId:    $purchaseId,
                        invoiceNumber: $purchase->invoice_number,
                        partyId:       $purchase->party_id,
                        date:          $purchase->purchase_date,
                        totals:        $totals,
                        landedCost:    $this->landedCostTotal($purchaseId),
                        grandTotal:    (float) $purchase->total,
                        paymentMethod: $purchase->payment_method ?? 'credit'
                    );
                    $journalEntryId = $entry->id;
                }

                DB::table('purchases')
                    ->where('tenant_id', $tenantId)
                    ->where('id', $purchaseId)
                    ->update([
                        'workflow_status'  => $newStatus,
                        'journal_entry_id' => $journalEntryId,
                        'updated_at'       => now(),
                    ]);

                $this->refreshPaymentStatus($purchaseId);

                return ['workflow_status' => $newStatus];
            });
        } finally {
            optional($lock)->release();
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RETURNS (unchanged behaviour — L011 fix preserved verbatim)
    // ═════════════════════════════════════════════════════════════════════════

    public function createReturn(string $purchaseId, array $data)
    {
        $purchase = DB::table('purchases')
            ->where('tenant_id', $this->tenantId())
            ->where('id', $purchaseId)
            ->firstOrFail();

        return DB::transaction(function () use ($data, $purchase, $purchaseId) {
            $tenantId        = $this->tenantId();
            // ZeroDrift Ledger: everything below is exact paisa. Each line's
            // value, landed cost and tax come back as a CUMULATIVE share of what
            // the purchase booked for that line, so a line returned in pieces
            // gives back exactly what it brought in — nothing stranded on 1100,
            // 2300 or 6000, and never more than was booked.
            $booked        = $this->bookedPurchaseLines($purchaseId);
            $trackReturned = \Illuminate\Support\Facades\Schema::hasColumn('purchase_items', 'returned_qty');
            $goodsM = $landedM = $itcM = $expM = 0;
            $returnedNow = [];
            $totalReturnCost = 0.00;
            // Input tax claimed on the returned goods goes back with them: the
            // supplier's debit note is for the goods AND the tax on them.
            $totalReturnItc  = 0.00;
            $totalReturnExp  = 0.00;
            /* What the supplier actually billed for the returned goods, and the
               landed cost (freight, customs …) that rode along in the batch. */
            $totalLandedCost    = 0.00;
            $lineCosts          = $this->storedLineCosts($purchaseId);

            foreach ($data['items'] as $item) {
                $pi = DB::table('purchase_items')
                    ->where('tenant_id', $tenantId)
                    ->where('id', $item['purchase_item_id'])
                    ->first();

                if (! $pi) {
                    throw new \InvalidArgumentException('Purchase item not found');
                }

                $batchId = $item['inventory_batch_id'] ?? $pi->inventory_batch_id;

                $batch = DB::table('inventory_batches')
                    ->where('tenant_id', $tenantId)
                    ->where('id', $batchId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $returnQty = (float) ($item['qty_returned'] ?? $item['return_qty']);

                if ($returnQty > (float) $batch->remaining_qty) {
                    throw new \InvalidArgumentException(
                        "Return qty {$returnQty} exceeds remaining batch qty " .
                        "{$batch->remaining_qty} for batch {$batch->id}. " .
                        'Cannot return stock that has already been sold.'
                    );
                }

                $before = ($trackReturned ? (float) ($pi->returned_qty ?? 0) : 0.0) + ($returnedNow[$pi->id] ?? 0.0);
                if ($trackReturned && $returnQty > (float) $pi->qty - $before + 0.00001) {
                    throw new \InvalidArgumentException(
                        "Return qty {$returnQty} is more than the " . max(0, (float) $pi->qty - $before) . ' still returnable on this purchase line.'
                    );
                }
                $returnedNow[$pi->id] = ($returnedNow[$pi->id] ?? 0.0) + $returnQty;
                $b = $booked[$pi->id] ?? ['goods' => 0, 'landed' => 0, 'itc' => 0, 'exp' => 0];
                $share = fn (int $whole) => \App\Services\Sales\ReturnValuation::share($whole, $pi->qty, $before, $returnQty);

                /* The supplier's debit note covers their own (discounted) price
                   and the tax on it. The landed cost (freight, customs …) rode
                   along in the batch but is owed to the carrier, not to this
                   supplier: it was spent and cannot be sent back, so it is
                   expensed (6000) and the carrier's accrual is left alone.
                   Stock leaves 1100 at goods + landed — exactly what the
                   purchase put there for these units. */
                $goodsM  += $share($b['goods']);
                $landedM += $share($b['landed']);
                $itcM    += $share($b['itc']);
                $expM    += $share($b['exp']);
                if ($trackReturned) {
                    DB::table('purchase_items')->where('tenant_id', $tenantId)->where('id', $pi->id)->increment('returned_qty', $returnQty);
                }

                DB::table('inventory_batches')->where('tenant_id', $tenantId)
                    ->where('id', $batch->id)->decrement('remaining_qty', $returnQty);

                DB::table('products')->where('tenant_id', $tenantId)
                    ->where('id', $batch->product_id)->decrement('stock_quantity', $returnQty);

                DB::table('stocks')->where('tenant_id', $tenantId)
                    ->where('product_id', $batch->product_id)
                    ->where('warehouse_id', $batch->warehouse_id)
                    ->decrement('quantity', $returnQty);

                DB::table('stock_movements')->insert([
                    'id'           => Str::uuid()->toString(),
                    'tenant_id'    => $tenantId,
                    'product_id'   => $batch->product_id,
                    'warehouse_id' => $batch->warehouse_id,
                    'quantity'     => -$returnQty,
                    'type'         => 'purchase_return',
                    'reference_id' => $purchase->invoice_number,
                    'description'  => "Purchase return for invoice {$purchase->invoice_number}",
                    'user_id'      => auth()->id(),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            // B18 Journal -- L011 FIX: the debit side must MIRROR how the original
            // purchase was paid. In both cases inventory leaves (CR 1100), but the
            // offsetting debit differs:
            //
            //   - CREDIT purchase (still owed on account): the original purchase
            //     CREDITED 2000 Accounts Payable. Returning goods reduces what we owe,
            //     so we DR 2000 Accounts Payable.
            //
            //   - CASH purchase (already paid): the original purchase CREDITED 1000
            //     Cash. We do NOT owe the supplier anything, so debiting AP would
            //     invent a phantom negative payable. Instead the supplier owes us a
            //     refund, so we DR 1000 Cash (the refund we are due / received back).
            $isCashPurchase    = ($purchase->payment_method ?? null) === 'cash';
            $offsetAccountCode = $isCashPurchase ? self::ACC_CASH : self::ACC_PAYABLE;

            $F = fn (int $m) => \App\Support\Money::toFloat($m);
            $totalReturnCost    = $F($goodsM + $landedM);
            $totalReturnItc     = $F($itcM);
            $totalReturnExp     = $F($expM);
            $totalLandedCost    = $F($landedM);
            $totalSupplierGoods = $F($goodsM);
            // The debit note: the supplier's price for the goods plus the tax on it.
            $totalReturnValue   = $F($goodsM + $itcM + $expM);

            $journalLines = [
                [
                    'account_code' => $offsetAccountCode,
                    'debit'        => $totalReturnValue,
                    'credit'       => 0,
                    'party_id'     => $purchase->party_id,
                ],
                [
                    'account_code' => self::ACC_INVENTORY,
                    'debit'        => 0,
                    'credit'       => $totalReturnCost,
                ],
            ];
            if ($totalLandedCost > 0) {
                $journalLines[] = [
                    'account_code' => self::ACC_LANDED_COST_WRITEOFF,
                    'debit'        => $totalLandedCost,
                    'credit'       => 0,
                ];
            }
            if ($totalReturnItc > 0) {
                $journalLines[] = ['account_code' => self::ACC_INPUT_TAX, 'debit' => 0, 'credit' => $totalReturnItc];
            }
            if ($totalReturnExp > 0) {
                $journalLines[] = ['account_code' => self::ACC_NONRECOVER_TAX, 'debit' => 0, 'credit' => $totalReturnExp];
            }

            $returnId = Str::uuid()->toString();

            $journalEntry = $this->accounting->createEntry([
                'date'           => $data['return_date'],
                'reference_type' => 'purchase_return',
                'reference'      => $returnId,
                'description'    => "Purchase return — {$purchase->invoice_number}: {$data['reason']}",
                'party_id'       => $purchase->party_id,
            ], $journalLines);

            DB::table('purchase_returns')->insert([
                'id'               => $returnId,
                'tenant_id'        => $tenantId,
                'purchase_id'      => $purchaseId,
                'return_date'      => $data['return_date'],
                'reason'           => $data['reason'],
                'total_amount'     => $totalReturnValue,
                'journal_entry_id' => $journalEntry->id,
                'created_by'       => $data['created_by'] ?? $data['user_id'] ?? auth()->id() ?? 1,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $this->refreshPaymentStatus($purchaseId);

            return $returnId;
        });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GOODS SENT BACK ON A DEBIT NOTE
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Take goods going back to the supplier off the shelf — the stock half of
     * a debit note that returns stock (DebitNoteController::store).
     *
     * Consistent with createReturn(): when the note names the bill the goods
     * came in on and that bill raised a batch for the product, the units leave
     * THAT bill's batch, and no more can leave it than it still holds (the
     * rest was sold). A note that names no bill — or a bill that never carried
     * the product — takes them oldest-first through FifoService, the one FIFO
     * deduction every other stock-out uses.
     *
     * Batches, `stocks`, products.stock_quantity and a stock_movements row all
     * move together. Returns the cost the units left the batches at — exactly
     * what must come off 1100 for the ledger to keep agreeing with the FIFO
     * valuation.
     *
     * @return array{cost: float, deductions: array<int, array{batch_id: string, warehouse_id: ?string, qty_taken: float, unit_cost: float, total_cost: float}>}
     * @throws \InvalidArgumentException when the named bill's batch holds too little
     * @throws \App\Exceptions\InsufficientStockException  FIFO, when negative stock is barred
     */
    public function returnStockToSupplier(
        string  $productId,
        string  $warehouseId,
        float   $qty,
        ?string $purchaseId,
        string  $reference,
        string  $description
    ): array {
        return DB::transaction(function () use ($productId, $warehouseId, $qty, $purchaseId, $reference, $description) {
            $tenantId   = $this->tenantId();
            $deductions = [];

            $batches = $purchaseId === null ? collect() : DB::table('inventory_batches')
                ->where('tenant_id', $tenantId)
                ->where('purchase_invoice_id', $purchaseId)
                ->where('product_id', $productId)
                ->whereNull('deleted_at')
                ->orderBy('created_at')
                ->orderBy('seq')
                ->lockForUpdate()
                ->get();

            if ($batches->isNotEmpty()) {
                $available = (float) $batches->sum('remaining_qty');
                if ($qty > $available + 0.00005) {
                    $bill = DB::table('purchases')->where('tenant_id', $tenantId)->where('id', $purchaseId)->value('invoice_number');
                    throw new \InvalidArgumentException(
                        "Only {$available} of this item from purchase {$bill} is still in stock; {$qty} cannot go back on it. " .
                        'Cannot return stock that has already been sold.'
                    );
                }

                $left = $qty;
                foreach ($batches as $batch) {
                    if ($left <= 0.00005) break;
                    $take = min($left, (float) $batch->remaining_qty);
                    if ($take <= 0) continue;

                    DB::table('inventory_batches')->where('tenant_id', $tenantId)
                        ->where('id', $batch->id)->decrement('remaining_qty', $take);

                    $deductions[] = [
                        'batch_id'     => $batch->id,
                        'warehouse_id' => $batch->warehouse_id,
                        'qty_taken'    => $take,
                        'unit_cost'    => (float) $batch->unit_cost,
                        'total_cost'   => round($take * (float) $batch->unit_cost, 2),
                    ];
                    $left -= $take;
                }
            } else {
                foreach ($this->inventory->fifo->deductStock($productId, $warehouseId, $qty) as $d) {
                    $deductions[] = $d + ['warehouse_id' => $warehouseId];
                }
            }

            // Units that left THIS bill's batches count against its lines, so
            // the per-line return cap and the return valuation in
            // createReturn() see them (ZeroDrift Ledger).
            if ($batches->isNotEmpty()) {
                $this->markLinesReturned($tenantId, $purchaseId, $productId, $deductions);
            }

            // Aggregates move by what actually left the batches, per warehouse.
            $byWarehouse = [];
            foreach ($deductions as $d) {
                $wh = $d['warehouse_id'] ?? $warehouseId;
                $byWarehouse[$wh] = ($byWarehouse[$wh] ?? 0) + (float) $d['qty_taken'];
            }

            foreach ($byWarehouse as $wh => $moved) {
                $stock = DB::table('stocks')->where('tenant_id', $tenantId)
                    ->where('product_id', $productId)->where('warehouse_id', $wh)->first();
                if ($stock) {
                    DB::table('stocks')->where('id', $stock->id)->decrement('quantity', $moved);
                } else {
                    DB::table('stocks')->insert([
                        'id'           => Str::uuid()->toString(),
                        'tenant_id'    => $tenantId,
                        'product_id'   => $productId,
                        'warehouse_id' => $wh,
                        'quantity'     => -$moved,
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]);
                }

                DB::table('products')->where('tenant_id', $tenantId)
                    ->where('id', $productId)->decrement('stock_quantity', $moved);

                DB::table('stock_movements')->insert([
                    'id'           => Str::uuid()->toString(),
                    'tenant_id'    => $tenantId,
                    'product_id'   => $productId,
                    'warehouse_id' => $wh,
                    'quantity'     => -$moved,
                    'type'         => 'purchase_return',
                    'reference_id' => $reference,
                    'description'  => $description,
                    'user_id'      => auth()->id(),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            return [
                'cost'       => self::exactSum(array_column($deductions, 'total_cost')),
                'deductions' => $deductions,
            ];
        });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // INTERNALS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Add returned units to a bill's lines: first to the line whose batch the
     * units left, then (for anything left over) to the bill's other lines of
     * the same product in order, never past a line's own quantity.
     *
     * @param array<int, array{batch_id?: string, qty_taken: float}> $deductions
     */
    private function markLinesReturned($tenantId, string $purchaseId, string $productId, array $deductions): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('purchase_items', 'returned_qty')) {
            return;
        }
        $lines = DB::table('purchase_items')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $purchaseId)
            ->where('product_id', $productId)
            ->orderBy('created_at')->orderBy('id')
            ->lockForUpdate()
            ->get(['id', 'qty', 'returned_qty', 'inventory_batch_id']);
        if ($lines->isEmpty()) {
            return;
        }
        $room = [];
        foreach ($lines as $l) {
            $room[$l->id] = max(0.0, (float) $l->qty - (float) ($l->returned_qty ?? 0));
        }
        $add = [];
        $left = 0.0;
        foreach ($deductions as $d) {
            $take = (float) $d['qty_taken'];
            $line = isset($d['batch_id']) ? $lines->firstWhere('inventory_batch_id', $d['batch_id']) : null;
            if ($line) {
                $n = min($take, $room[$line->id]);
                $add[$line->id] = ($add[$line->id] ?? 0) + $n;
                $room[$line->id] -= $n;
                $take -= $n;
            }
            $left += $take;
        }
        foreach ($room as $id => $r) {
            $n = min($left, $r);
            if ($n <= 0) {
                continue;
            }
            $add[$id] = ($add[$id] ?? 0) + $n;
            $left -= $n;
        }
        foreach ($add as $id => $n) {
            if ($n > 0) {
                DB::table('purchase_items')->where('tenant_id', $tenantId)->where('id', $id)->increment('returned_qty', $n);
            }
        }
    }

    private function tenantId()
    {
        return app('current.tenant')->id;
    }

    private function find(string $purchaseId)
    {
        return DB::table('purchases')
            ->where('purchases.tenant_id', $this->tenantId())
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $purchaseId)
            ->select('purchases.*', 'parties.name as supplier_name')
            ->first();
    }

    private function lockPurchase(string $purchaseId)
    {
        return DB::table('purchases')
            ->where('tenant_id', $this->tenantId())
            ->where('id', $purchaseId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    /**
     * Supplier → Party resolution, ported from legacy PurchaseController::store().
     * Accepts either a Party id or a Supplier id, and auto-creates the Party for a
     * Supplier that does not have one yet.
     */
    private function resolvePartyId(array $validated, ?string $fallback = null): string
    {
        $candidate = $validated['supplier_id']
            ?? $validated['vendor_id']
            ?? $validated['party_id']
            ?? $fallback;

        if (! $candidate) {
            throw new \InvalidArgumentException('A supplier is required.');
        }

        $party = \App\Models\Party::find($candidate);
        if ($party) {
            return $party->id;
        }

        $supplier = \App\Models\Supplier::find($candidate);
        if (! $supplier) {
            throw new \InvalidArgumentException('The selected supplier is invalid.');
        }

        if ($supplier->party_id && ($existing = \App\Models\Party::find($supplier->party_id))) {
            return $existing->id;
        }

        $party = \App\Models\Party::create([
            'type'                 => 'supplier',
            'name'                 => $supplier->name,
            'email'                => $supplier->email,
            'phone'                => $supplier->phone,
            'address'              => $supplier->address,
            'notes'                => $supplier->notes,
            'opening_balance'      => 0,
            'opening_balance_type' => 'payable',
            'current_balance'      => 0,
        ]);

        $supplier->update(['party_id' => $party->id]);

        return $party->id;
    }

    /**
     * Default-warehouse fallback, ported from legacy. V3 previously demanded an
     * explicit warehouse_id, which is why the legacy UI could not call it.
     */
    private function resolveWarehouseId(array $validated, ?string $fallback = null): string
    {
        $explicit = $validated['warehouse_id'] ?? $fallback;
        if ($explicit) {
            return $explicit;
        }

        $tenantId = $this->tenantId();

        $default = DB::table('warehouses')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->first();

        if (! $default) {
            throw new \DomainException('No warehouse exists for this store. Create one before recording purchases.');
        }

        return $default->id;
    }

    /**
     * Line maths + header discount + round-off. Tax is computed per line so the
     * recoverable/non-recoverable ITC split is preserved.
     */
    /** Sum currency amounts exactly (integer paisa) and return the currency value. */
    private static function exactSum(array $amounts): float
    {
        $m = 0;
        foreach ($amounts as $a) {
            $m += \App\Support\Money::parseMinor($a, 'amount', false);
        }
        return \App\Support\Money::toFloat($m);
    }

    /** Tax on a base in paisa at a decimal rate (exclusive), half-up, once. */
    private static function taxMinor(int $baseM, mixed $rate): int
    {
        $r = \App\Support\Money::parse($rate ?? 0, 'tax rate', false);
        if (!$r->isPositive() || $baseM <= 0) {
            return 0;
        }
        return \App\Support\Money::divRound($r->getUnscaledValue()->multipliedBy($baseM), \Brick\Math\BigInteger::ten()->power($r->getScale())->multipliedBy(100));
    }

    /** The recoverable part of a line's tax at a business-use percentage. */
    private static function recoverableMinor(int $taxM, mixed $businessPct): int
    {
        $p = \App\Support\Money::parse($businessPct ?? 100, 'business %', false);
        $r = \App\Support\Money::divRound($p->getUnscaledValue()->multipliedBy($taxM), \Brick\Math\BigInteger::ten()->power($p->getScale())->multipliedBy(100));
        return max(0, min($taxM, $r));
    }

    /**
     * Line maths + header discount + round-off, in exact paisa (ZeroDrift
     * Ledger). Each amount is quantized once, half-up; totals are integer sums,
     * so the purchase journal built from them balances by construction. Tax is
     * computed per line so the recoverable/non-recoverable split is preserved.
     */
    private function calculateTotals(array $validated): array
    {
        $minor = fn ($v) => \App\Support\Money::parseMinor($v ?? 0, 'amount', false);
        $toF   = fn (int $m) => \App\Support\Money::toFloat($m);
        $subtotalM = $taxM = $itcM = $expM = 0;
        $lineItems = [];

        foreach ($validated['items'] as $item) {
            $qtyRaw       = $item['qty'] ?? $item['quantity'] ?? 0;
            $costRaw      = $item['unit_cost'] ?? $item['price'] ?? 0;
            $qty          = (float) $qtyRaw;
            $unitCost     = (float) $costRaw;
            $lineDiscount = (float) ($item['discount_amount'] ?? 0);
            /* A line discount larger than the line is worth nothing, not a
               negative (both validators measure the goods the same way). */
            $grossDec  = \App\Support\Money::parse($qtyRaw, 'qty', false)->multipliedBy(\App\Support\Money::parse($costRaw, 'unit cost', false));
            $lineCostM = max(0, \App\Support\Money::toMinor($grossDec) - $minor($item['discount_amount'] ?? 0));

            $businessPct     = isset($item['business_pct']) ? (float) $item['business_pct'] : 100.0;
            $taxLineM        = self::taxMinor($lineCostM, $item['tax_rate'] ?? 0);
            $recoverableM    = self::recoverableMinor($taxLineM, $item['business_pct'] ?? 100);
            $nonRecoverableM = $taxLineM - $recoverableM;

            $subtotalM += $lineCostM;
            $taxM      += $taxLineM;
            $itcM      += $recoverableM;
            $expM      += $nonRecoverableM;

            $lineItems[] = array_merge($item, [
                'qty'                => $qty,
                'unit_cost'          => $unitCost,
                'variant_id'         => $item['variant_id'] ?? null,
                'discount_amount'    => $lineDiscount,
                'line_total'         => $toF($lineCostM),
                'tax_amount'         => $toF($taxLineM),
                'recoverable_tax'    => $toF($recoverableM),
                'nonrecoverable_tax' => $toF($nonRecoverableM),
                'business_pct'       => $businessPct,
            ]);
        }

        /* Round-off adjusts the last paisa of a bill; it cannot rewrite it. It
           is bounded so the total can never fall below zero — a negative total
           posts a credit with no debit behind it. */
        $discountM    = $minor($validated['discount'] ?? 0);
        $beforeRoundM = $subtotalM - $discountM + $taxM;
        $roundOffM    = $minor($validated['round_off'] ?? 0);
        if ($beforeRoundM + $roundOffM < 0) {
            $roundOffM = -$beforeRoundM;
        }

        return [
            'subtotal'  => $toF($subtotalM),
            'taxTotal'  => $toF($taxM),
            'itcTotal'  => $toF($itcM),
            'expTotal'  => $toF($expM),
            'discount'  => $toF($discountM),
            'roundOff'  => $toF($roundOffM),
            'lineItems' => $this->withNetUnitCosts($lineItems, $toF($discountM)),
        ];
    }

    /**
     * What each line of a stored purchase BOOKED, in exact paisa — the same
     * amounts the purchase journal posted, split per line:
     *   goods   line value after its share of the header discount (largest remainder)
     *   landed  its share of the landed costs (by value or quantity, as entered)
     *   itc/exp its recoverable / non-recoverable tax, as calculateTotals() computed it
     * Σ goods + Σ landed = the 1100 debit; Σ itc = 2300; Σ exp = the tax part of 6000.
     *
     * @return array<string, array{goods:int, landed:int, itc:int, exp:int}>
     */
    private function bookedPurchaseLines(string $purchaseId): array
    {
        $tenantId = $this->tenantId();
        $purchase = DB::table('purchases')->where('tenant_id', $tenantId)->where('id', $purchaseId)->first();
        $items    = DB::table('purchase_items')->where('tenant_id', $tenantId)->where('purchase_id', $purchaseId)->orderBy('created_at')->orderBy('id')->get()->values();
        $M = fn ($v) => \App\Support\Money::parseMinor($v ?? 0, 'amount', false);

        $lineM = $items->map(fn ($i) => max(0, $M($i->line_total)))->all();
        $discountM = min(max(0, $M($purchase->discount ?? 0)), array_sum($lineM));
        $discShare = \App\Support\Money::allocate($discountM, $lineM);

        $landed = array_fill(0, count($lineM), 0);
        $extras = DB::table('expenses')->where('tenant_id', $tenantId)->where('purchase_id', $purchaseId)->where('is_landed_cost', true)->get(['amount', 'allocation_method']);
        $qtyW = $items->map(fn ($i) => (int) round(((float) $i->qty) * 10000))->all();
        foreach ($extras as $e) {
            $amt = max(0, $M($e->amount));
            $weights = ($e->allocation_method ?: 'value') === 'quantity' ? $qtyW : array_map(fn ($l, $d) => $l - $d, $lineM, $discShare);
            if (array_sum($weights) <= 0) {
                $weights = $qtyW;
            }
            foreach (\App\Support\Money::allocate($amt, $weights) as $k => $v) {
                $landed[$k] += $v;
            }
        }

        $out = [];
        foreach ($items as $k => $i) {
            $taxM = self::taxMinor($lineM[$k], $i->tax_rate ?? 0);
            $itc  = self::recoverableMinor($taxM, $i->business_pct ?? 100);
            $out[$i->id] = ['goods' => $lineM[$k] - $discShare[$k], 'landed' => $landed[$k], 'itc' => $itc, 'exp' => $taxM - $itc];
        }
        return $out;
    }

    /**
     * What each unit actually cost the shop from the supplier: the line after
     * its own discount, less its pro-rata share (by net line value) of the
     * header discount, per unit. Tax is not in it — recoverable tax sits in
     * 2300 and non-recoverable tax is expensed to 6000 by the purchase journal,
     * so neither is in the 1100 debit either.
     *
     * The FIFO batch used to be priced at the LIST unit cost, while 1100 was
     * debited with the discounted value, so every discounted purchase left
     * the inventory ledger below the batch valuation — and COGS, returns and
     * stock reports priced the goods at money that was never paid.
     *
     * Each line's share is worked out on its own (no "last line takes the
     * rounding"), so the same stored purchase always gives the same costs —
     * store(), receive() and createReturn() all rely on that.
     *
     * @param array $lineItems each with 'qty' and 'line_total'
     */
    private function withNetUnitCosts(array $lineItems, float $headerDiscount): array
    {
        $netGoods = 0.0;
        foreach ($lineItems as $item) {
            $netGoods += (float) $item['line_total'];
        }

        foreach ($lineItems as &$item) {
            $qty       = (float) $item['qty'];
            $lineTotal = (float) $item['line_total'];
            $share     = ($netGoods > 0 && $headerDiscount > 0)
                ? min($lineTotal, $headerDiscount * ($lineTotal / $netGoods))
                : 0.0;

            $item['net_unit_cost'] = $qty > 0 ? round(max(0.0, $lineTotal - $share) / $qty, 4) : 0.0;
        }
        unset($item);

        return $lineItems;
    }

    /**
     * Supplier net unit cost (see withNetUnitCosts) and FIFO unit cost
     * (net + landed cost share) for every stored line of a purchase, keyed by
     * purchase_items.id. Rebuilt from the stored rows so that receiving goods
     * later, or returning them, prices them exactly as store() did.
     *
     * @return array<string, array{net: float, effective: float}>
     */
    private function storedLineCosts(string $purchaseId): array
    {
        $tenantId = $this->tenantId();

        $purchase = DB::table('purchases')->where('tenant_id', $tenantId)->where('id', $purchaseId)->first();
        $items    = DB::table('purchase_items')->where('tenant_id', $tenantId)->where('purchase_id', $purchaseId)->get();

        $lineItems = $items->map(fn ($i) => [
            'id'         => $i->id,
            'qty'        => (float) $i->qty,
            'unit_cost'  => (float) $i->unit_cost,
            'line_total' => (float) $i->line_total,
        ])->all();

        $lineItems = $this->withNetUnitCosts($lineItems, (float) ($purchase->discount ?? 0));

        $extras = DB::table('expenses')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $purchaseId)
            ->where('is_landed_cost', true)
            ->get(['amount', 'allocation_method'])
            ->map(fn ($e) => ['amount' => (float) $e->amount, 'method' => $e->allocation_method ?: 'value'])
            ->all();

        $costs = [];
        foreach ($this->allocateLandedCosts($lineItems, $extras)['lineItems'] as $line) {
            $costs[$line['id']] = [
                'net'       => (float) $line['net_unit_cost'],
                'effective' => (float) $line['effective_unit_cost'],
            ];
        }

        return $costs;
    }

    /**
     * Landed-cost allocation, ported from legacy PurchaseController::store().
     * `value`    — pro-rata by line value
     * `quantity` — pro-rata by unit count
     *
     * Returns the line items with `effective_unit_cost` set. That is the cost
     * locked into the FIFO batch, so it is what eventually reaches COGS.
     */
    private function allocateLandedCosts(array $lineItems, array $extras): array
    {
        $total = self::exactSum(array_map(fn ($e) => $e['amount'] ?? 0, $extras));

        /* The base is what the goods cost from the supplier AFTER discounts
           (withNetUnitCosts), both for the batch price and for spreading the
           landed cost by value. */
        $baseOf = fn (array $item) => (float) ($item['net_unit_cost'] ?? $item['unit_cost']);

        $totalValue = 0.0;
        $totalQty   = 0.0;
        foreach ($lineItems as $item) {
            $totalValue += (float) $item['qty'] * $baseOf($item);
            $totalQty   += (float) $item['qty'];
        }

        foreach ($lineItems as &$item) {
            $qty      = (float) $item['qty'];
            $baseCost = $baseOf($item);
            $perUnit  = 0.0;

            foreach ($extras as $extra) {
                $amount = (float) ($extra['amount'] ?? 0);
                if ($amount <= 0) {
                    continue;
                }
                $method = $extra['method'] ?? 'value';

                if ($method === 'quantity' && $totalQty > 0) {
                    $perUnit += $amount / $totalQty;
                } elseif ($method === 'value' && $totalValue > 0 && $qty > 0) {
                    $share    = (($qty * $baseCost) / $totalValue) * $amount;
                    $perUnit += $share / $qty;
                }
                // 'manual' is per-item input and is not auto-distributed here,
                // matching legacy behaviour.
            }

            $item['base_unit_cost']      = $baseCost;
            $item['effective_unit_cost'] = round($baseCost + $perUnit, 4);
        }
        unset($item);

        return ['lineItems' => $lineItems, 'total' => $total];
    }

    /**
     * The purchase journal.
     *
     *   DR 1100 Inventory            net goods (after header discount) + landed cost
     *   DR 2300 Input Tax            recoverable ITC
     *   DR 6000 Expense              non-recoverable tax
     *   DR 5900 / CR 4900            round-off
     *   CR 1000 Cash | 2000 Payable  grand total + landed cost
     */
    /**
     * How much of this bill was handed over now. A cash purchase that names no
     * figure means paid in full — which is all 'cash' ever meant — and any
     * figure given is capped at the bill so a keying slip cannot credit the
     * supplier with money they were never given.
     */
    private function paidNow(array $validated, float $grandTotal): float
    {
        $grandM = \App\Support\Money::parseMinor($grandTotal, 'total', false);
        if (array_key_exists('amount_paid', $validated) && $validated['amount_paid'] !== null && $validated['amount_paid'] !== '') {
            $paidM = \App\Support\Money::parseMinor($validated['amount_paid'], 'amount paid', false);
            return \App\Support\Money::toFloat(max(0, min($paidM, $grandM)));
        }
        return ($validated['payment_method'] ?? null) === 'cash' ? \App\Support\Money::toFloat($grandM) : 0.0;
    }

    private function postPurchaseJournal(
        string $purchaseId,
        ?string $invoiceNumber,
        ?string $partyId,
        string $date,
        array $totals,
        float $landedCost,
        float $grandTotal,
        ?string $paymentMethod,
        ?float $amountPaid = null,
        ?string $paymentAccountId = null
    ) {
        /* The validator refuses a discount past the net goods value, but this is
           the last place before the ledger and an unbalanced entry is not
           something to discover later. If the goods come to nothing, they come
           to nothing on both sides. */
        $M = fn ($v) => \App\Support\Money::parseMinor($v ?? 0, 'amount', false);
        $F = fn (int $m) => \App\Support\Money::toFloat($m);
        $landedM = $M($landedCost);
        $inventoryDebit = $F(max(0, $M($totals['subtotal']) - $M($totals['discount']) + $landedM));

        $lines = [
            ['account_code' => self::ACC_INVENTORY, 'debit' => $inventoryDebit, 'credit' => 0],
        ];

        if ($totals['itcTotal'] > 0) {
            $lines[] = ['account_code' => self::ACC_INPUT_TAX, 'debit' => $totals['itcTotal'], 'credit' => 0];
        }

        if ($totals['expTotal'] > 0) {
            $lines[] = ['account_code' => self::ACC_NONRECOVER_TAX, 'debit' => $totals['expTotal'], 'credit' => 0];
        }

        $roundOff = (float) $totals['roundOff'];
        if (abs($roundOff) > 0.0001) {
            // A positive round_off increases what we owe → an expense.
            // A negative round_off decreases it → income.
            $lines[] = $roundOff > 0
                ? ['account_code' => self::ACC_ROUNDOFF_EXPENSE, 'debit' => abs($roundOff), 'credit' => 0]
                : ['account_code' => self::ACC_ROUNDOFF_INCOME, 'debit' => 0, 'credit' => abs($roundOff)];
        }

        /* What was handed over now, and what is still owed. The two always add
           up to the bill, so the entry balances whichever way it is split — and
           a purchase settled halfway no longer has to pretend to be either a
           cash purchase or a credit one. */
        /* A bill discounted to nothing (or below, once round-off is applied)
           has nothing to settle. Clamping at zero here keeps `paid + owed` equal
           to what was credited: a negative $owed used to fall through the
           `> 0.0001` guard below, dropping the payable line while the round-off
           line stayed, and the entry came out unbalanced. */
        /* Clamped together with the inventory debit by the caller, so this is
           only ever reached with a bill of zero or more. */
        $billableM = max(0, $M($grandTotal));
        $paidM = $amountPaid === null
            ? ($paymentMethod === 'cash' ? $billableM : 0)
            : max(0, min($M($amountPaid), $billableM));
        $billable = $F($billableM);
        $paid = $F($paidM);
        $owed = $F($billableM - $paidM); // exact: paid + owed = the bill

        if ($paid > 0.0001) {
            /* Out of the account the operator named, or the till if they named
               none — the same rule the sales side uses. */
            $cashLine = [
                'account_code' => self::ACC_CASH,
                'debit'        => 0,
                'credit'       => $paid,
                'party_id'     => $partyId,
            ];
            if ($paymentAccountId) {
                /* The picker sends the sentinel 'CHEQUE' for a cheque, which is
                   not an account id: `find()` returned null and the credit fell
                   through to Cash in Hand, so the till went down by the value of
                   every cheque written and the uncleared cheque was recorded
                   nowhere. A cheque written but not yet cleared is 1020. */
                if (is_string($paymentAccountId) && strtoupper($paymentAccountId) === 'CHEQUE') {
                    unset($cashLine['account_code']);
                    $cashLine['account_id'] = app(\App\Engines\AccountingService::class)
                        ->getAccountByCode('1020', 'Cheques in Hand', 'asset')->id;
                } else {
                    $acc = \App\Models\Account::find($paymentAccountId);
                    if ($acc) {
                        unset($cashLine['account_code']);
                        $cashLine['account_id'] = $acc->id;
                    }
                    $ba = \App\Models\BankAccount::find($paymentAccountId);
                    if ($ba) {
                        $cashLine['bank_account_id'] = $ba->id;
                    }
                }
            }
            $lines[] = $cashLine;
        }

        // The supplier is owed the VENDOR BILL ONLY, less anything paid now.
        if ($owed > 0.0001) {
            $lines[] = [
                'account_code' => self::ACC_PAYABLE,
                'debit'        => 0,
                'credit'       => $owed,
                'party_id'     => $partyId,
            ];
        }

        // Landed cost is owed to whoever provided it — a freight company, customs,
        // a handling agent — NOT to the supplier of the goods. Legacy credited it
        // to the supplier's payable WITH their party_id, which inflated that
        // supplier's balance by money they were never owed and made supplier
        // statements disagree with reality.
        //
        // Here it is accrued to Accounts Payable with NO party attached. The
        // `Expense` row written alongside (is_landed_cost = true) carries the
        // detail and the bank_account_id when it is paid.
        if ($landedCost > 0.0001) {
            $lines[] = [
                'account_code' => self::ACC_PAYABLE,
                'debit'        => 0,
                'credit'       => $F($landedM),
            ];
        }

        return $this->accounting->createEntry([
            'date'           => $date,
            'reference_type' => 'purchase',
            'reference'      => $purchaseId,
            /* Described by what actually happened to the money rather than by
               the cash/credit flag, now that a purchase can be settled part
               way. ($isCash was left behind when this method learned about
               partial payment, and an undefined variable inside a transaction
               takes the whole purchase down with it.) */
            'description'    => ($paid <= 0.0001 ? 'Credit' : ($owed <= 0.0001 ? 'Cash' : 'Part-paid'))
                                . " purchase — {$invoiceNumber}",
            'party_id'       => $partyId,
        ], $lines);
    }

    /**
     * Reverse every live journal entry for this purchase by posting a mirrored
     * counter-entry and flagging the original. The original entry's LINES are
     * never edited — that is what keeps the audit trail intact.
     */
    private function reverseJournals(string $purchaseId, ?string $partyId, string $why): void
    {
        $entries = \App\Models\JournalEntry::where('tenant_id', $this->tenantId())
            ->where('reference', $purchaseId)
            ->whereIn('reference_type', ['purchase', 'purchase_payment'])
            ->where('is_reversed', 0)
            ->get();

        foreach ($entries as $entry) {
            $entry->update(['is_reversed' => 1]);

            /* A reversed legacy payment entry no longer pays anything, so the
               allocation backfilled for it goes with it (the same thing
               AccountingService::reverseEntry() does through voidAllocations).
               Left active, the payment was counted once in the reposted bill's
               paid figure and again as an allocation. */
            if ($entry->reference_type === 'purchase_payment') {
                DB::table('allocations')
                    ->where('tenant_id', $this->tenantId())
                    ->where('payment_journal_entry_id', $entry->id)
                    ->where('status', 'active')
                    ->update(['status' => 'reversed', 'updated_at' => now()]);
            }

            $reversalLines = $entry->items->map(fn ($item) => [
                'account_id' => $item->account_id,
                'debit'      => $item->credit,
                'credit'     => $item->debit,
                'party_id'   => $item->party_id,
            ])->toArray();

            if (empty($reversalLines)) {
                continue;
            }

            $this->accounting->createEntry([
                'date'           => now()->toDateString(),
                'reference_type' => 'purchase_reversal',
                'reference'      => $purchaseId,
                'description'    => 'REVERSAL — ' . $why,
                'party_id'       => $partyId ?? $entry->party_id,
                'is_reversed'    => 1,
            ], $reversalLines);
        }
    }

    /**
     * Void the FIFO batches raised by this purchase. Uses the FifoService so that
     * partially-consumed batches are reported rather than silently destroyed.
     */
    private function releaseBatches(string $purchaseId): void
    {
        $result = $this->inventory->fifo->voidPurchaseBatches($purchaseId);

        if (! empty($result['warnings'])) {
            Log::warning('[V3\\PurchaseService] Partially-consumed batches voided.', [
                'purchase_id' => $purchaseId,
                'warnings'    => $result['warnings'],
            ]);
        }
    }

    /** Reverse the stock aggregates a receipt raised, then drop the item rows. */
    private function removeItems(string $purchaseId): void
    {
        $tenantId = $this->tenantId();

        $items = DB::table('purchase_items')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $purchaseId)
            ->get();

        $warehouseId = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->where('id', $purchaseId)
            ->value('warehouse_id');

        foreach ($items as $item) {
            $received = (float) ($item->received_qty ?? 0);
            if ($received <= 0) {
                continue;
            }

            DB::table('products')->where('tenant_id', $tenantId)
                ->where('id', $item->product_id)->decrement('stock_quantity', $received);

            DB::table('stocks')->where('tenant_id', $tenantId)
                ->where('product_id', $item->product_id)
                ->where('warehouse_id', $warehouseId)
                ->decrement('quantity', $received);

            if (! empty($item->variant_id)) {
                DB::table('product_variants')->where('id', $item->variant_id)
                    ->decrement('stock', $received);
            }
        }

        DB::table('purchase_items')
            ->where('tenant_id', $tenantId)
            ->where('purchase_id', $purchaseId)
            ->delete();
    }

    /** Insert item rows, and receive them immediately when the purchase is posted. */
    private function writeItemsAndReceive(
        string $purchaseId,
        string $warehouseId,
        array $lineItems,
        bool $isReceived,
        string $invoiceNumber
    ): void {
        $tenantId = $this->tenantId();

        foreach ($lineItems as $item) {
            $itemId = Str::uuid()->toString();

            DB::table('purchase_items')->insert([
                'id'              => $itemId,
                'tenant_id'       => $tenantId,
                'purchase_id'     => $purchaseId,
                'product_id'      => $item['product_id'],
                'variant_id'      => $item['variant_id'] ?? null,
                'qty'             => $item['qty'],
                'received_qty'    => $isReceived ? $item['qty'] : 0,
                'unit_cost'       => $item['unit_cost'],
                'discount_amount' => $item['discount_amount'] ?? 0,
                'tax_rate'        => $item['tax_rate'] ?? 0,
                'business_pct'    => $item['business_pct'],
                'line_total'      => $item['line_total'],
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);

            if (! $isReceived) {
                continue;
            }

            $this->receiveLine(
                purchaseId:     $purchaseId,
                warehouseId:    $warehouseId,
                productId:      $item['product_id'],
                variantId:      $item['variant_id'] ?? null,
                qty:            (float) $item['qty'],
                unitCost:       (float) ($item['effective_unit_cost'] ?? $item['unit_cost']),
                reference:      $invoiceNumber,
                purchaseItemId: $itemId
            );
        }
    }

    /**
     * One line of goods physically arriving: FIFO batch, product aggregate,
     * warehouse stock, variant stock, movement log and the cost-update policy.
     */
    private function receiveLine(
        string $purchaseId,
        string $warehouseId,
        string $productId,
        ?string $variantId,
        float $qty,
        float $unitCost,
        string $reference,
        string $purchaseItemId,
        ?string $batchNumber = null,
        ?string $expiryDate = null
    ): void {
        $tenantId = $this->tenantId();

        // receiveBatch — unit_cost locked here, never changed afterwards.
        // Expiry is passed in rather than patched afterwards so the batch is
        // never briefly visible to the FIFO picker without its expiry date.
        $batch = $this->inventory->fifo->receiveBatch(
            productId:   $productId,
            warehouseId: $warehouseId,
            qty:         $qty,
            unitCost:    $unitCost,
            batchType:   'purchase',
            purchaseId:  $purchaseId,
            expiryDate:  $expiryDate
        );

        DB::table('purchase_items')
            ->where('tenant_id', $tenantId)
            ->where('id', $purchaseItemId)
            ->update(['inventory_batch_id' => $batch->id]);

        // `inventory_batches` has no `batch_number` column — only `notes`.
        // The supplier's batch number goes there rather than inventing a column.
        if ($batchNumber) {
            DB::table('inventory_batches')
                ->where('id', $batch->id)
                ->update(['notes' => 'Batch ' . $batchNumber]);
        }

        DB::table('products')->where('tenant_id', $tenantId)
            ->where('id', $productId)->increment('stock_quantity', $qty);

        $stock = DB::table('stocks')->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if ($stock) {
            DB::table('stocks')->where('id', $stock->id)->increment('quantity', $qty);
        } else {
            DB::table('stocks')->insert([
                'id'           => Str::uuid()->toString(),
                'tenant_id'    => $tenantId,
                'product_id'   => $productId,
                'warehouse_id' => $warehouseId,
                'quantity'     => $qty,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        if ($variantId) {
            DB::table('product_variants')->where('id', $variantId)->increment('stock', $qty);
        }

        DB::table('stock_movements')->insert([
            'id'           => Str::uuid()->toString(),
            'tenant_id'    => $tenantId,
            'product_id'   => $productId,
            'warehouse_id' => $warehouseId,
            'quantity'     => $qty,
            'type'         => 'purchase',
            'reference_id' => $reference,
            'description'  => "Goods received — {$reference}",
            'user_id'      => auth()->id(),
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $this->applyCostUpdatePolicy($productId, $unitCost);
    }

    private function applyCostUpdatePolicy(string $productId, float $newCost): void
    {
        $product = Product::find($productId);
        if (! $product) {
            return;
        }

        $policy  = \App\Helpers\SettingsHelper::getProductCostUpdatePolicy();
        $oldCost = (float) $product->cost_price;

        $shouldUpdate = $policy === 'always'
            || ($policy === 'increase_only' && $newCost > $oldCost)
            || ($policy === 'decrease_only' && $newCost < $oldCost);

        if ($shouldUpdate) {
            $product->update(['cost_price' => $newCost]);
        }
    }

    /**
     * Landed costs are recorded as Expense rows for reporting and audit. They are
     * NOT posted to an expense account — the amount is already capitalised into
     * inventory by postPurchaseJournal(). See class docblock, divergence 1.
     */
    private function writeLandedCostExpenses(
        string $purchaseId,
        array $extras,
        string $date,
        string $invoiceNumber
    ): void {
        foreach ($extras as $extra) {
            $amount = (float) ($extra['amount'] ?? 0);
            if ($amount <= 0) {
                continue;
            }

            \App\Models\Expense::create([
                'expense_category_id' => $extra['category_id'] ?? null,
                'category'            => \App\Models\ExpenseCategory::find($extra['category_id'] ?? null)?->name ?? 'Landed Cost',
                'amount'              => $amount,
                'date'                => $date,
                'description'         => 'Landed Cost for ' . $invoiceNumber
                                         . (($extra['description'] ?? null) ? ': ' . $extra['description'] : ''),
                'is_landed_cost'      => true,
                'purchase_id'         => $purchaseId,
                'allocation_method'   => $extra['method'] ?? 'value',
                'bank_account_id'     => $extra['bank_account_id'] ?? null,
            ]);
        }
    }

    private function landedCostTotal(string $purchaseId): float
    {
        return self::exactSum(DB::table('expenses')
            ->where('tenant_id', $this->tenantId())
            ->where('purchase_id', $purchaseId)
            ->where('is_landed_cost', true)
            ->pluck('amount')->all());
    }

    /** Rebuild the tax/subtotal split from stored item rows (used by receive()). */
    private function totalsFromStoredItems(string $purchaseId, float $discount, float $roundOff): array
    {
        $items = DB::table('purchase_items')
            ->where('tenant_id', $this->tenantId())
            ->where('purchase_id', $purchaseId)
            ->get();

        // Exact paisa, the same per-line tax as calculateTotals().
        $subM = $itcM = $expM = 0;
        foreach ($items as $item) {
            $lineM = max(0, \App\Support\Money::parseMinor($item->line_total ?? 0, 'line total', false));
            $taxM  = self::taxMinor($lineM, $item->tax_rate ?? 0);
            $recM  = self::recoverableMinor($taxM, $item->business_pct ?? 100);
            $subM += $lineM;
            $itcM += $recM;
            $expM += $taxM - $recM;
        }
        $F = fn (int $m) => \App\Support\Money::toFloat($m);

        return [
            'subtotal' => $F($subM),
            'taxTotal' => $F($itcM + $expM),
            'itcTotal' => $F($itcM),
            'expTotal' => $F($expM),
            'discount' => $discount,
            'roundOff' => $roundOff,
        ];
    }

    /**
     * `purchases.payment_status` transitions have exactly one writer:
     * PaymentService::updatePurchaseBadge(). The only inline write permitted is
     * the initial value at INSERT time (there are no allocations yet at that
     * point). Everything after that goes through here. Principle 5 of
     * V3_CONSOLIDATION_PLAN.md.
     */
    /**
     * `updatePurchaseBadge` decides the badge purely from allocation rows. A
     * purchase settled inside its own journal has no allocation, so calling it
     * unconditionally after an edit flipped a paid purchase to 'unpaid' — the
     * status written moments earlier in the same transaction. It is only asked
     * when there is something for it to look at.
     */
    private function refreshPaymentStatus(string $purchaseId): void
    {
        try {
            $hasAllocations = DB::table('allocations')
                ->where('tenant_id', app('current.tenant')->id)
                ->where('purchase_id', $purchaseId)
                ->where('status', 'active')
                ->exists();
            if (! $hasAllocations) {
                return;
            }
            app(PaymentService::class)->updatePurchaseBadge($purchaseId);
        } catch (\Throwable $e) {
            Log::warning('[V3\\PurchaseService] Could not refresh payment badge.', [
                'purchase_id' => $purchaseId,
                'error'       => $e->getMessage(),
            ]);
        }
    }
}
