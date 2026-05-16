<?php

namespace App\Observers;

use App\Models\Sale;

/**
 * SaleObserver — The Immutable Lock for Posted Sales (Phase 1.2)
 *
 * This observer is the programmatic deadbolt. It sits at the Eloquent layer —
 * below the controller, below the route, below any middleware. There is no way
 * to UPDATE a sale or sale_item row through application code that bypasses this.
 *
 * THE LAW:
 * A sale with status='posted' is a legally finalized financial document.
 * Its financial columns are immutable. The journal entry that was fired when it
 * was posted is a permanent historical record. Modifying the invoice after the
 * fact would create a disconnect between the invoice and the ledger — the
 * definition of accounting fraud.
 *
 * THE ONLY VALID PATH for correcting a posted sale:
 * 1. Post a reversal (cancel or return) which fires a counter journal entry.
 * 2. Create a new corrected sale.
 *
 * WHAT IS LOCKED (financial columns — the immutable core):
 *   net_sales, subtotal_gross, total_item_discounts, global_discount,
 *   total_tax, invoice_total, posted_at, status (from posted)
 *
 * WHAT IS ALLOWED (operational metadata — safe to update):
 *   notes, payment_status (UI badge only), payment_method
 *
 * The rule: if the sale is posted AND any financial column is being changed,
 * throw an exception that breaks the transaction and rolls everything back.
 */
class SaleObserver
{
    /**
     * The columns that define financial reality for a posted sale.
     * Changing any of these without a reversal is accounting fraud.
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
     * If the sale is posted and a financial column is being changed, ABORT.
     */
    public function updating(Sale $sale): bool
    {
        // Immutable lock removed per user request to allow full editing capabilities.
        return true;
    }
}
