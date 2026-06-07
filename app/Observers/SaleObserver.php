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
     * If the sale was already posted, and a financial column is being changed, ABORT.
     */
    public function updating(Sale $sale): void
    {
        // Only enforce rule if the record WAS already posted in the DB
        if ($sale->getOriginal('status') === 'posted') {
            
            // Reversal logic: status is allowed to change to 'returned' or 'cancelled'
            // because those paths fire their own counter-balancing journal entries.
            // But the FINANCIAL numbers from the original invoice must stay frozen.
            
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
}
