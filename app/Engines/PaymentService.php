<?php

namespace App\Engines;

use App\Exceptions\OverAllocationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __get($name) {
        if ($name === 'tenantId') {
            return app('current.tenant')->id;
        }
        return null;
    }

    public function __construct() {
    }
    /**
     * OWNS: allocations, sales.payment_status, purchases.payment_status
     * NEVER called directly for reversals — voidAllocations() is called only
     * by AccountingService::reverseEntry().
     */

    /**
     * Allocate a payment journal entry against one or more invoices.
     * Enforces over-allocation at app layer (DB trigger is the final guard).
     *
     * @param string $paymentJournalEntryId
     * @param array  $allocations  [{sale_id, amount} | {purchase_id, amount}]
     */
    public function allocate(string $paymentJournalEntryId, array $allocations): void
    {
        DB::transaction(function () use ($paymentJournalEntryId, $allocations) {

            foreach ($allocations as $allocation) {
                $isSale = isset($allocation['sale_id']);

                if ($isSale) {
                    $this->checkOverAllocation(
                        $allocation['sale_id'],
                        $allocation['amount'],
                        'sale',
                        $paymentJournalEntryId
                    );
                } else {
                    $this->checkOverAllocation(
                        $allocation['purchase_id'],
                        $allocation['amount'],
                        'purchase',
                        $paymentJournalEntryId
                    );
                }

                $tid = $this->tenantId;
                DB::table('allocations')->insert([
                    'id'                        => Str::uuid()->toString(),
                    'tenant_id'                 => $tid,
                    'payment_journal_entry_id'  => $paymentJournalEntryId,
                    'sale_id'                   => $allocation['sale_id']     ?? null,
                    'purchase_id'               => $allocation['purchase_id'] ?? null,
                    'allocated_amount'          => $allocation['amount'],
                    'status'                    => 'active',
                    'created_at'                => now(),
                    'updated_at'                => now(),
                ]);

                // Update badge immediately after each allocation
                if ($isSale) {
                    $this->updatePaymentBadge($allocation['sale_id']);
                } else {
                    $this->updatePurchaseBadge($allocation['purchase_id']);
                }
            }
        });
    }

    /**
     * Recompute and write sales.payment_status from live allocation data.
     * THIS IS THE ONLY METHOD THAT WRITES payment_status FOR SALES.
     */
    public function updatePaymentBadge(string $saleId): void
    {
        $tid = $this->tenantId;
        $sale = DB::table('sales')->where('tenant_id', $tid)->where('id', $saleId)->first();
        if (!$sale) return;

        // Already written-off — never change the badge
        if ($sale->payment_status === 'written_off') return;

        $tolerance = (float) (DB::table('system_settings')
            ->where('tenant_id', $tid)
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        /* Paid = allocations + what was taken at the till outside them (the
           legacy POS books its tender inside the sale entry and allocates
           nothing), owed = the invoice less returns — the same reading the
           Payments screen allocates against (saleSettlementSummary). Counting
           allocations alone left a till-part-paid invoice 'partial' forever
           once the rest was received, and the aged receivables with it. */
        $summary     = $this->saleSettlementSummary($sale);
        $paid        = $summary['paid'];
        $outstanding = $this->effectiveSaleTotal($sale) - $paid;

        if ($paid <= 0.005) {
            $status = 'unpaid';
        } elseif ($outstanding <= $tolerance) {
            // Within round-off tolerance — auto-close as paid
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        DB::table('sales')
            ->where('tenant_id', $tid)
            ->where('id', $saleId)
            ->update([
                'payment_status' => $status,
                'updated_at'     => now(),
            ]);
    }

    /**
     * Recompute and write purchases.payment_status from live allocation data.
     * THIS IS THE ONLY METHOD THAT WRITES payment_status FOR PURCHASES.
     */
    public function updatePurchaseBadge(string $purchaseId): void
    {
        $tid = $this->tenantId;
        $purchase = DB::table('purchases')->where('tenant_id', $tid)->where('id', $purchaseId)->first();
        if (!$purchase) return;

        $allocated = (float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('purchase_id', $purchaseId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $total     = (float) ($purchase->total ?? 0);
        $tolerance = (float) (DB::table('system_settings')
            ->where('tenant_id', $tid)
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        // A purchase can be part-paid at the counter and reduced by debit
        // notes; neither leaves an allocation row, but both count here.
        $settlement = $this->purchaseSettlement($purchase);
        $paid       = $settlement['at_counter'] + $allocated;
        $owed       = $total - $settlement['returned'];

        $outstanding = $owed - $paid;

        if ($paid <= 0.005) {
            $status = 'unpaid';
        } elseif ($outstanding <= $tolerance) {
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        DB::table('purchases')
            ->where('tenant_id', $tid)
            ->where('id', $purchaseId)
            ->update([
                'payment_status' => $status,
                'updated_at'     => now(),
            ]);
    }

    /**
     * Void all active allocations for a given payment journal entry.
     *
     * CRITICAL: Called ONLY by AccountingService::reverseEntry().
     * Never call this directly from a controller.
     *
     * After voiding, rebuilds the payment badge for every affected sale/purchase.
     */
    public function voidAllocations(string $paymentJournalEntryId): void
    {
        DB::transaction(function () use ($paymentJournalEntryId) {

            $tid = $this->tenantId;
            // Collect affected sale/purchase IDs before voiding
            $affected = DB::table('allocations')
                ->where('tenant_id', $tid)
                ->where('payment_journal_entry_id', $paymentJournalEntryId)
                ->where('status', 'active')
                ->get();

            // Void all active rows
            DB::table('allocations')
                ->where('tenant_id', $tid)
                ->where('payment_journal_entry_id', $paymentJournalEntryId)
                ->where('status', 'active')
                ->update([
                    'status'     => 'reversed',
                    'updated_at' => now(),
                ]);

            // Rebuild badge for every affected invoice
            foreach ($affected as $row) {
                if ($row->sale_id) {
                    $this->updatePaymentBadge($row->sale_id);
                } elseif ($row->purchase_id) {
                    $this->updatePurchaseBadge($row->purchase_id);
                }
            }
        });
    }

    /**
     * Where a purchase stands, from the same sources the badge reads
     * (updatePurchaseBadge) and the over-allocation guard enforces:
     *
     *  total       — the bill
     *  at_counter  — settled when the purchase was posted (see purchaseSettlements)
     *  allocated   — active allocation rows: v3 supplier payments, the Payments
     *                screen, and backfilled legacy purchase_payment entries
     *  returned    — taken off the payable by purchase returns and by debit
     *                notes raised against this bill
     *  paid        — at_counter + allocated
     *  outstanding — what can still take a payment on account
     *
     * One reading for every screen, so the purchase list, show, edit and the
     * Payments screen's auto-allocation cannot disagree with the badge.
     *
     * @return array{total: float, at_counter: float, allocated: float, returned: float, paid: float, outstanding: float}
     */
    public function purchaseSettlementSummary(object|string $purchase): array
    {
        $tid = $this->tenantId;

        if (is_string($purchase)) {
            $purchase = DB::table('purchases')->where('tenant_id', $tid)->where('id', $purchase)->first();
        }
        if (! $purchase) {
            return ['total' => 0.0, 'at_counter' => 0.0, 'allocated' => 0.0, 'returned' => 0.0, 'paid' => 0.0, 'outstanding' => 0.0];
        }

        return $this->purchaseSettlementSummaries([$purchase])[(string) $purchase->id];
    }

    /**
     * purchaseSettlementSummary() for many purchases at once — three grouped
     * queries per 500 purchases instead of three per purchase — for lists and
     * their totals. Keyed by purchase id. Each purchase needs `id` and `total`.
     *
     * @param  iterable<object> $purchases
     * @return array<string, array{total: float, at_counter: float, allocated: float, returned: float, paid: float, outstanding: float}>
     */
    public function purchaseSettlementSummaries(iterable $purchases): array
    {
        $tid  = $this->tenantId;
        $rows = [];
        foreach ($purchases as $p) {
            $rows[(string) $p->id] = $p;
        }
        if (! $rows) {
            return [];
        }

        $allocated  = [];
        foreach (array_chunk(array_keys($rows), 500) as $ids) {
            $allocated += DB::table('allocations')
                ->where('tenant_id', $tid)
                ->whereIn('purchase_id', $ids)
                ->where('status', 'active')
                ->groupBy('purchase_id')
                ->selectRaw('purchase_id, SUM(allocated_amount) as amt')
                ->pluck('amt', 'purchase_id')
                ->all();
        }
        $settlements = $this->purchaseSettlements(array_keys($rows));

        $out = [];
        foreach ($rows as $id => $purchase) {
            $alloc      = round((float) ($allocated[$id] ?? 0), 2);
            $settlement = $settlements[$id];
            $total      = round((float) ($purchase->total ?? 0), 2);
            $paid       = round($settlement['at_counter'] + $alloc, 2);

            $out[$id] = [
                'total'       => $total,
                'at_counter'  => $settlement['at_counter'],
                'allocated'   => $alloc,
                'returned'    => $settlement['returned'],
                'paid'        => $paid,
                'outstanding' => max(0.0, round($total - $settlement['returned'] - $paid, 2)),
            ];
        }

        return $out;
    }

    /**
     * Where a sale stands — the customer-side twin of purchaseSettlementSummary(),
     * and what the Payments screen allocates a receipt against:
     *
     *  total       — the invoice
     *  returned    — credited back by returns (effectiveSaleTotal); all of it
     *                once the sale is returned, cancelled or voided
     *  at_counter  — tendered at the till but NOT recorded as an allocation
     *                (see saleCounterSettlement): the legacy POS books its
     *                payment legs inside the sale entry and allocates nothing
     *  allocated   — active allocation rows: the v3 till's own payment, advance
     *                settlements, v3 customer payments, the Payments screen
     *  paid        — at_counter + allocated
     *  outstanding — what can still take a payment on account
     *
     * @return array{total: float, at_counter: float, allocated: float, returned: float, paid: float, outstanding: float}
     */
    public function saleSettlementSummary(object|string $sale): array
    {
        $tid = $this->tenantId;

        if (is_string($sale)) {
            $sale = DB::table('sales')->where('tenant_id', $tid)->where('id', $sale)->first();
        }
        if (! $sale) {
            return ['total' => 0.0, 'at_counter' => 0.0, 'allocated' => 0.0, 'returned' => 0.0, 'paid' => 0.0, 'outstanding' => 0.0];
        }

        $allocated = round((float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $sale->id)
            ->where('status', 'active')
            ->sum('allocated_amount'), 2);

        $total     = round((float) ($sale->total ?? 0), 2);
        $owed      = in_array($sale->status ?? null, self::CLOSED_SALE_STATUSES, true)
            ? 0.0
            : $this->effectiveSaleTotal($sale);
        $atCounter = $this->saleCounterSettlement($sale);
        $paid      = round($atCounter + $allocated, 2);

        return [
            'total'       => $total,
            'at_counter'  => $atCounter,
            'allocated'   => $allocated,
            'returned'    => max(0.0, round($total - $owed, 2)),
            'paid'        => $paid,
            'outstanding' => max(0.0, round($owed - $paid, 2)),
        ];
    }

    /** A sale in one of these owes nothing, whatever its badge says. */
    public const CLOSED_SALE_STATUSES = ['returned', 'cancelled', 'void', 'voided', 'refunded', 'draft'];

    // ─── Private Helpers ──────────────────────────────────────────────

    /**
     * The part of a sale settled at the till that no allocation row records.
     *
     * The sale's own live 'sale' entry debits Accounts Receivable (1200) with
     * only the part left on account; the rest of the invoice was tendered —
     * cash, bank, card legs. The v3 engine then allocates that tender to the
     * sale against the sale entry itself (SaleService::post step 7), so it is
     * already in `allocated`; the legacy POS (SaleController::postSaleJournal)
     * does not. What is left after the entry's own allocations is the till
     * payment nothing else counts.
     *
     * @param string|null $pendingEntryId  an allocation about to be written
     * @param float       $pendingAmount   (the guard asks before inserting it)
     */
    private function saleCounterSettlement(object $sale, ?string $pendingEntryId = null, float $pendingAmount = 0.0): float
    {
        $tid = $this->tenantId;

        $entryIds = DB::table('journal_entries')
            ->where('tenant_id', $tid)
            ->where('is_reversed', 0)
            ->where('reference_type', 'sale')
            ->where('reference', $sale->id)
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();
        if (! $entryIds) {
            return 0.0;
        }

        $arAccountId = DB::table('accounts')->where('tenant_id', $tid)->where('code', '1200')->value('id');
        $onAccount   = $arAccountId ? (float) DB::table('journal_items')
            ->whereIn('journal_entry_id', $entryIds)
            ->where('account_id', $arAccountId)
            ->selectRaw('COALESCE(SUM(debit) - SUM(credit), 0) as v')
            ->value('v') : 0.0;

        $settledAtTill = max(0.0, (float) ($sale->total ?? 0) - $onAccount);

        $selfAllocated = (float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $sale->id)
            ->where('status', 'active')
            ->whereIn('payment_journal_entry_id', $entryIds)
            ->sum('allocated_amount');
        if ($pendingEntryId !== null && in_array($pendingEntryId, $entryIds, true)) {
            $selfAllocated += $pendingAmount;
        }

        return max(0.0, round($settledAtTill - $selfAllocated, 2));
    }

    /**
     * What the customer can still be asked to pay on a sale: the invoice total
     * less the value already credited back by returns (S-024).
     *
     * - A partial return (SaleService::reverse() partial path, SaleController::returnSale())
     *   credits the returned units' net value plus their tax share to the customer, so it
     *   no longer counts toward what is owed. Mirrors that path's valuation: net_amount +
     *   tax_amount per unit, or unit_price when net_amount is absent.
     * - A full return reverses the whole sale entry, so nothing is owed on it.
     */
    private function effectiveSaleTotal(object $sale): float
    {
        $total = (float) ($sale->total ?? 0);

        if (($sale->status ?? null) === 'returned') {
            return 0.0;
        }

        $returned = (float) DB::table('sale_items')
            ->where('tenant_id', $this->tenantId)
            ->where('sale_id', $sale->id)
            ->where('returned_quantity', '>', 0)
            // A return credits the units' net value AND their share of the tax
            // (B9: DR 4000 + DR 2100 / CR 1200), so both come off what is owed.
            ->selectRaw('COALESCE(SUM(returned_quantity * CASE WHEN net_amount > 0 AND quantity > 0 THEN (net_amount + COALESCE(tax_amount, 0)) / quantity ELSE unit_price END), 0) as v')
            ->value('v');

        return max(0.0, round($total - $returned, 2));
    }

    /**
     * The part of a purchase settled or cancelled OUTSIDE the allocations table.
     *
     * @return array{at_counter: float, returned: float}
     */
    private function purchaseSettlement(object $purchase): array
    {
        return $this->purchaseSettlements([(string) $purchase->id])[(string) $purchase->id];
    }

    /**
     * purchaseSettlement() for many purchases, keyed by id.
     *
     *  at_counter — paid when the purchase was posted: the credits on its live
     *               'purchase' journal entry to anything other than Accounts
     *               Payable (2000) and round-off income (4900), i.e. the cash /
     *               bank / cheque leg of a cash or part-paid purchase.
     *  returned   — the AP (2000) debits on the live journal entries of its
     *               purchase_returns, and of the approved debit notes raised
     *               against it. A cash purchase's refund debits cash, not AP,
     *               so it is not counted — it was never owed. A debit note the
     *               supplier has since REFUNDED in cash no longer reduces the
     *               bill: the refund put the amount back on the payable.
     *
     * @param  string[] $purchaseIds
     * @return array<string, array{at_counter: float, returned: float}>
     */
    private function purchaseSettlements(array $purchaseIds): array
    {
        $tid = $this->tenantId;

        $apAccountId = DB::table('accounts')->where('tenant_id', $tid)->where('code', '2000')->value('id');
        $excluded    = array_values(array_filter([
            $apAccountId,
            DB::table('accounts')->where('tenant_id', $tid)->where('code', '4900')->value('id'),
        ]));

        $atCounter = [];
        $returned  = [];
        foreach (array_chunk($purchaseIds, 500) as $ids) {
            $atCounter += DB::table('journal_items as ji')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->where('je.tenant_id', $tid)
                ->where('je.is_reversed', 0)
                ->where('je.reference_type', 'purchase')
                ->whereIn('je.reference', $ids)
                ->when($excluded, fn ($q) => $q->whereNotIn('ji.account_id', $excluded))
                ->groupBy('je.reference')
                ->selectRaw('je.reference as pid, SUM(ji.credit) as amt')
                ->pluck('amt', 'pid')
                ->all();

            if (! $apAccountId) {
                continue;
            }

            foreach (DB::table('journal_items as ji')
                ->join('purchase_returns as pr', 'pr.journal_entry_id', '=', 'ji.journal_entry_id')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->where('pr.tenant_id', $tid)
                ->whereIn('pr.purchase_id', $ids)
                ->where('je.is_reversed', 0)
                ->where('ji.account_id', $apAccountId)
                ->groupBy('pr.purchase_id')
                ->selectRaw('pr.purchase_id as pid, SUM(ji.debit) as amt')
                ->get() as $r) {
                $returned[(string) $r->pid] = ($returned[(string) $r->pid] ?? 0) + (float) $r->amt;
            }

            foreach (DB::table('journal_items as ji')
                ->join('debit_notes as dn', 'dn.journal_entry_id', '=', 'ji.journal_entry_id')
                ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                ->where('dn.tenant_id', $tid)
                ->whereIn('dn.purchase_id', $ids)
                ->where('dn.status', 'approved')
                ->whereNull('dn.deleted_at')
                ->where('je.is_reversed', 0)
                ->where('ji.account_id', $apAccountId)
                ->groupBy('dn.purchase_id')
                ->selectRaw('dn.purchase_id as pid, SUM(ji.debit) as amt')
                ->get() as $r) {
                $returned[(string) $r->pid] = ($returned[(string) $r->pid] ?? 0) + (float) $r->amt;
            }
        }

        $out = [];
        foreach ($purchaseIds as $id) {
            $out[(string) $id] = [
                'at_counter' => round((float) ($atCounter[$id] ?? 0), 2),
                'returned'   => round((float) ($returned[$id] ?? 0), 2),
            ];
        }

        return $out;
    }

    private function checkOverAllocation(
        string $invoiceId,
        float  $attemptedAmount,
        string $type,  // 'sale' or 'purchase'
        ?string $paymentJournalEntryId = null
    ): void {
        $tid = $this->tenantId;

        if ($type === 'sale') {
            $invoice = DB::table('sales')
                ->where('tenant_id', $tid)
                ->where('id', $invoiceId)
                ->first();
            $invoiceTotal = $invoice ? $this->effectiveSaleTotal($invoice) : 0.0;

            // Nor the part taken at the till outside the allocations table
            // (legacy POS). The v3 till's own allocation of its tender is that
            // very payment, so it is not counted against itself.
            if ($invoice) {
                $invoiceTotal = max(0.0, round(
                    $invoiceTotal - $this->saleCounterSettlement($invoice, $paymentJournalEntryId, $attemptedAmount),
                    2
                ));
            }
        } else {
            // V3 purchases live in the `purchases` table. This must stay in step
            // with V3\PurchaseService, V3\PurchaseController, V3\SupplierStatementController
            // and GoldenCompanySeeder, which all write/read `purchases`.
            $invoice = DB::table('purchases')
                ->where('tenant_id', $tid)
                ->where('id', $invoiceId)
                ->first();
            $invoiceTotal = (float) ($invoice->total ?? 0);

            // Only what is still owed ON ACCOUNT can take a payment: not the
            // part paid at the counter, nor the part returned on a debit note.
            if ($invoice) {
                $settlement   = $this->purchaseSettlement($invoice);
                $invoiceTotal = max(0.0, round($invoiceTotal - $settlement['at_counter'] - $settlement['returned'], 2));
            }
        }

        if (!$invoice) {
            throw new \InvalidArgumentException(
                "Invoice not found: {$invoiceId}. Tenant: {$tid}. Type: {$type}."
            );
        }

        $idColumn = $type === 'sale' ? 'sale_id' : 'purchase_id';

        $alreadyAllocated = (float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where($idColumn, $invoiceId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        if (($alreadyAllocated + $attemptedAmount) > ($invoiceTotal + 0.001)) {
            throw new OverAllocationException(
                $invoiceId,
                $invoiceTotal,
                $alreadyAllocated,
                $attemptedAmount
            );
        }
    }

}
