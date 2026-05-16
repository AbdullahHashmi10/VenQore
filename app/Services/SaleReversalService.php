<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\InventoryBatch;
use App\Models\SaleItemBatch;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SaleReversalService — The Financial Reversal Engine (Phase 1.2)
 *
 * This service is the ONLY authorised path for undoing a posted sale's
 * financial footprint. It implements the core principle of double-entry accounting:
 *
 *   YOU DO NOT EDIT THE PAST. YOU REVERSE IT.
 *
 * When called, this service atomically:
 *   1. Validates the sale can be reversed (is it posted? already reversed?)
 *   2. Posts a counter journal entry (mirrors the original, all signs flipped)
 *   3. Restores FIFO stock to the exact batches it was taken from
 *   4. Restores the stock quantity aggregates
 *   5. Marks the original sale as 'returned' or 'cancelled'
 *   6. Creates an audit trail
 *
 * The original sale record is NEVER modified (except for the status transition).
 * Its financial columns remain frozen as a historical record.
 *
 * The counter journal entry is the proof that the reversal happened. The trial
 * balance will still zero out, because every debit has a matching credit.
 *
 * TYPES OF REVERSALS:
 *   - 'cancelled': Sale was voided before fulfillment (customer changed mind)
 *                  All stock goes back. Full AR reversal.
 *   - 'returned':  Goods were sold and returned. Stock goes back.
 *                  Full AR reversal. (Partial returns are a separate feature.)
 */
class SaleReversalService
{
    /**
     * Execute a full reversal of a posted sale.
     *
     * This MUST be called inside a DB::transaction() at the controller level.
     * If any step fails, the entire reversal rolls back — no partial state is possible.
     *
     * @param  Sale    $sale     The posted sale to reverse
     * @param  string  $type     'cancelled' or 'returned'
     * @param  string  $reason   Human-readable reason (for audit trail)
     * @param  string  $userId   The user authorizing the reversal
     * @return array   Summary of what was reversed
     *
     * @throws \RuntimeException if sale is not in a reversible state
     */
    public function reverse(Sale $sale, string $type, string $reason, string $userId): array
    {
        // ─── Guard: Only posted sales can be reversed ─────────────────────────
        if ($sale->status !== 'posted') {
            throw new \RuntimeException(
                "Cannot reverse Sale {$sale->reference_number}: " .
                "status is '{$sale->status}'. Only 'posted' sales can be reversed."
            );
        }

        // ─── Guard: Valid reversal types only ──────────────────────────────────
        if (!in_array($type, ['cancelled', 'returned'])) {
            throw new \RuntimeException("Invalid reversal type: '{$type}'. Must be 'cancelled' or 'returned'.");
        }

        $summary = [
            'sale_id'           => $sale->id,
            'reference'         => $sale->reference_number,
            'reversal_type'     => $type,
            'journal_reversed'  => false,
            'fifo_restored'     => false,
            'stock_restored'    => false,
            'items_restored'    => 0,
        ];

        // ─── Step 1: Reverse the Journal Entry ───────────────────────────────
        // Find the original journal entry for this sale
        $originalEntry = JournalEntry::where('reference', $sale->reference_number)->first();

        if ($originalEntry) {
            // Create a new, counter journal entry — every debit becomes a credit and vice versa.
            // This is not a deletion. This is a new entry in the permanent ledger.
            $reversalEntry = JournalEntry::create([
                'date'        => now()->toDateString(),
                'reference'   => 'REV-' . $sale->reference_number,
                'description' => "[{$type}] Reversal of {$sale->reference_number}: {$reason}",
                'party_id'    => $sale->party_id,
                'created_by'  => $userId,
            ]);

            // Mirror every journal item with flipped debit/credit
            foreach ($originalEntry->items as $originalItem) {
                JournalItem::create([
                    'journal_entry_id' => $reversalEntry->id,
                    'account_id'       => $originalItem->account_id,
                    'debit'            => $originalItem->credit,  // Flip: original credit → reversal debit
                    'credit'           => $originalItem->debit,   // Flip: original debit → reversal credit
                    'description'      => "[REVERSAL] " . $originalItem->description,
                ]);

                // Update account balance in real time
                $account = Account::find($originalItem->account_id);
                if ($account) {
                    // Undo the original effect:
                    // If original was a credit to this account, reversal debits it (subtracts from balance)
                    // If original was a debit to this account, reversal credits it (adds to balance)
                    $netEffectToReverse = $originalItem->credit - $originalItem->debit;
                    if (in_array($account->type, ['asset', 'expense'])) {
                        $account->balance -= $netEffectToReverse;
                    } else {
                        $account->balance += $netEffectToReverse;
                    }
                    $account->save();
                }
            }

            $summary['journal_reversed'] = true;
            Log::info("SaleReversalService: Journal reversed for {$sale->reference_number}", [
                'original_entry_id' => $originalEntry->id,
                'reversal_entry_id' => $reversalEntry->id,
            ]);
        } else {
            Log::warning("SaleReversalService: No journal entry found for {$sale->reference_number}. Stock will still be restored.");
        }

        // ─── Step 2: Restore FIFO Stock ───────────────────────────────────────
        // Read the sale_item_batches paper trail — this tells us EXACTLY which
        // inventory_batch was decremented and by how much. We put it back precisely.
        $fifoItemsRestored = 0;

        // Build the reversal note once — stamped on every affected batch record
        $reversalNote = "[{$type}] Reversal of {$sale->reference_number}: {$reason}";

        foreach ($sale->items()->with('saleItemBatches')->get() as $saleItem) {
            // scopeActive() ensures we only process deductions that have not already
            // been reversed by a prior reversal (prevents double-restoration)
            $saleItemBatches = $saleItem->saleItemBatches()->active()->get();

            if ($saleItemBatches->isNotEmpty()) {
                // FIFO restoration: return each batch's exact quantity
                foreach ($saleItemBatches as $sib) {
                    $batch = InventoryBatch::find($sib->inventory_batch_id);
                    if ($batch) {
                        // Restore the exact quantity taken from this batch.
                        // Guard: cannot restore more than was ever deducted from this batch
                        // (original_qty - current remaining_qty = total ever deducted)
                        $restoredQty = min(
                            $sib->qty_deducted,
                            $batch->original_qty - $batch->remaining_qty
                        );
                        $batch->increment('remaining_qty', $restoredQty);

                        Log::info("FIFO restoration: batch {$batch->id}, restored {$restoredQty} units");
                    }

                    // ─── THE FIX: Mark, never delete ──────────────────────────
                    // The row stays in the database permanently as proof that
                    // these items were deducted and then legally restored.
                    // A forensic auditor sees: deducted → reversed. Nothing is hidden.
                    $sib->markReversed($reversalNote);
                }
                $fifoItemsRestored++;
            } else {
                // No FIFO records — this item predates the FIFO engine.
                // Fall back to simple stock counter restoration.
                $this->restoreStockSimple($saleItem);
            }
        }

        $summary['fifo_restored']   = true;
        $summary['items_restored']  = $fifoItemsRestored;

        // ─── Step 3: Restore Stock Aggregates ────────────────────────────────
        // Regardless of FIFO restoration above, we must also update the
        // stocks table (the denormalised quantity cache used by the dashboard
        // and low-stock alerts).
        foreach ($sale->items as $saleItem) {
            $stock = \App\Models\Stock::where('product_id', $saleItem->product_id)
                ->where('warehouse_id', $sale->warehouse_id)
                ->first();
            if ($stock) {
                $totalQty = $saleItem->quantity + ($saleItem->free_quantity ?? 0);
                $stock->increment('quantity', $totalQty);
            }
            // Also restore the Product master stock quantity
            \App\Models\Product::where('id', $saleItem->product_id)
                ->increment('stock_quantity', $saleItem->quantity + ($saleItem->free_quantity ?? 0));
        }
        $summary['stock_restored'] = true;

        // ─── Step 4: Transition the Sale Status ──────────────────────────────
        // This is the ONLY permissible mutation of a posted sale.
        // We use DB::statement to bypass the SaleObserver's financial column lock
        // (the observer allows status transitions to 'returned'/'cancelled').
        // The sale's financial columns are untouched — they remain as the
        // permanent historical record of what was originally sold.
        DB::statement(
            "UPDATE sales SET status = ?, updated_at = ? WHERE id = ?",
            [$type, now(), $sale->id]
        );

        Log::info("SaleReversalService: Sale {$sale->reference_number} reversed as '{$type}'", $summary);

        return $summary;
    }

    /**
     * Fallback stock restoration for items sold before FIFO was active.
     * Uses the simple Stock model counter — not FIFO-aware.
     */
    private function restoreStockSimple(SaleItem $saleItem): void
    {
        if ($saleItem->product_variant_id ?? null) {
            \App\Models\ProductVariant::find($saleItem->product_variant_id)
                ?->increment('stock', $saleItem->quantity);
        }
        // The Product + Stock table restoration is handled in Step 3 above
    }
}
