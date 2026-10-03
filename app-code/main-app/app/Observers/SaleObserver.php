<?php

namespace App\Observers;

use App\Models\Sale;
use App\Services\CanonicalPostingScope;

/**
 * SaleObserver — The Immutable Lock for Posted Sales (Phase 1.2)
 *
 * This observer is the programmatic deadbolt. It sits at the Eloquent layer —
 * below the controller, below the route, below any middleware. There is no way
 * to UPDATE or DELETE a posted sale or directly CREATE a posted sale outside canonical
 * posting services.
 *
 * THE LAW:
 * A sale with status='posted' is a legally finalized financial document.
 * Its financial columns are immutable.
 */
class SaleObserver
{
    /**
     * The columns that define financial reality for a posted sale.
     * Changing any of these without a reversal is prohibited.
     */
    private const IMMUTABLE_COLUMNS = [
        'net_sales',
        'subtotal_gross',
        'subtotal',
        'total_item_discounts',
        'global_discount',
        'total',
        'invoice_total',
        'total_tax',
        'tax',
        'discount',
        'shipping_charges',
        'posted_at',
        'party_id',
        'warehouse_id',
        'user_id',
    ];

    /**
     * Fires BEFORE an UPDATE is committed to the database.
     * If the sale was already posted, and a financial column is being changed, ABORT.
     */
    public function updating(Sale $sale): void
    {
        if ($sale->getOriginal('status') === 'posted') {
            foreach (self::IMMUTABLE_COLUMNS as $col) {
                if ($sale->isDirty($col)) {
                    abort(403, "Accounting Safety Lock: Cannot modify financial data on a 'posted' sale. Please use the Return/Credit Note flow for corrections.");
                }
            }
        }
    }

    /**
     * Fires BEFORE a DELETE command.
     * Prevent deleting posted sales — they must be returned/reversed to maintain the ledger trail.
     */
    public function deleting(Sale $sale): void
    {
        if ($sale->status === 'posted') {
            abort(403, "Accounting Safety Lock: Posted sales cannot be deleted. This is an authoritative financial document. Use the Return flow to reverse stock and income.");
        }
    }

    /**
     * Fires BEFORE a sale is created in the database.
     * Prevents unauthorized direct creation of 'posted' sales outside canonical posting services.
     */
    public function creating(Sale $sale): void
    {
        $this->fillNetSales($sale);

        if ($sale->status === 'posted') {
            if (!CanonicalPostingScope::isActive()) {
                abort(403, "Direct posted sale creation prohibited. Sales must be posted via SaleService or the Approval Engine.");
            }
        }
    }

    /**
     * `net_sales` is the revenue figure (ex-tax) that the ledger credits to 4000.
     * A sale saved with total and tax but a zero/empty net_sales reads as zero
     * revenue everywhere and breaks the revenue-ties-to-ledger control, so it is
     * derived here from the figures the sale already carries. Returns (negative
     * totals) are left to their own services.
     */
    private function fillNetSales(Sale $sale): void
    {
        $net   = (float) ($sale->net_sales ?? 0);
        $total = (float) ($sale->total ?? 0);
        if (abs($net) > 0.00001 || $total <= 0 || $sale->status === 'returned') {
            return;
        }
        $tax = (float) ($sale->tax ?: ($sale->total_tax ?? 0));
        $sale->net_sales = round($total - $tax, 4);
    }
}
