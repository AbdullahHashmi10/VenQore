<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * SaleItemBatch — The FIFO Deduction Paper Trail
 *
 * This model is an APPEND-ONLY financial audit record.
 * Every row permanently documents that:
 *   - a specific sale_item consumed
 *   - a specific qty_deducted units from
 *   - a specific inventory_batch
 *   - at a locked-in unit_cost (cost snapshot at the moment of sale)
 *   - generating a total_cogs that feeds directly into Gross Profit
 *
 * IMMUTABILITY RULES:
 *   ❌ NEVER physically DELETE a row — it is an accounting document
 *   ❌ NEVER update qty_deducted or unit_cost after the sale is posted
 *   ✅ When a sale is reversed, mark is_reversed = true with reversed_at timestamp
 *   ✅ SoftDeletes is the safety net — accidental ->delete() calls soft-delete only
 *
 * REVERSAL PROTOCOL:
 * When SaleReversalService reverses a sale, it calls markReversed() on each record.
 * The inventory_batch.remaining_qty is then restored by incrementing it by qty_deducted.
 * The original row stays in the database as permanent proof of what happened.
 *
 * A forensic auditor sees:
 *   Row 1: qty_deducted=10, is_reversed=0  → Stock was taken at time of sale
 *   Row 1: qty_deducted=10, is_reversed=1  → Stock was legally restored on reversal
 * They can trace the full lifecycle. Nothing is hidden.
 */
class SaleItemBatch extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'sale_item_id',
        'inventory_batch_id',
        'qty_deducted',
        'unit_cost',
        'total_cogs',
        'is_reversed',
        'reversed_at',
        'reversal_reason',
    ];

    protected $casts = [
        'qty_deducted'   => 'float',
        'unit_cost'      => 'float',
        'total_cogs'     => 'float',
        'is_reversed'    => 'boolean',
        'reversed_at'    => 'datetime',
    ];

    // ─── Scopes ──────────────────────────────────────────────────────────────

    /**
     * Only return active (non-reversed) deductions.
     * Use this in all COGS calculations — reversed deductions must not count.
     */
    public function scopeActive($query)
    {
        return $query->where('is_reversed', false);
    }

    /**
     * Return only the reversed records — for audit and reconciliation queries.
     */
    public function scopeReversed($query)
    {
        return $query->where('is_reversed', true);
    }

    // ─── Business Logic ───────────────────────────────────────────────────────

    /**
     * Mark this batch deduction as reversed.
     * Called by SaleReversalService. NEVER called from anywhere else.
     *
     * This does NOT delete the row. It stamps it with the reversal metadata,
     * preserving the complete lifecycle record in the database permanently.
     *
     * @param  string  $reason  Human-readable explanation of the reversal
     */
    public function markReversed(string $reason): void
    {
        $this->update([
            'is_reversed'    => true,
            'reversed_at'    => now(),
            'reversal_reason' => $reason,
        ]);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function inventoryBatch()
    {
        return $this->belongsTo(InventoryBatch::class);
    }
}
