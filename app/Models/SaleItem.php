<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * SaleItem — One line of a Sale invoice.
 *
 * Phase 2.1: Stores the full financial waterfall per line:
 *   gross_amount    = quantity × unit_price
 *   discount_amount = item-level discount
 *   net_amount      = gross_amount - discount_amount  ← taxable base
 *   tax_rate        = % (0 until per-item tax is implemented)
 *   tax_amount      = net_amount × (tax_rate / 100)
 *   line_total      = net_amount + tax_amount
 *   cost_price      = FIFO weighted average cost (from sale_item_batches)
 *
 * RULE: Never compute Gross Profit from sale_items alone.
 *       Always read total_cogs from the related sale_item_batches records.
 *       sale_items.cost_price is a display convenience — not authoritative.
 */
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleItem extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'quantity'        => 'float',
        'free_quantity'   => 'float',
        'unit_price'      => 'float',
        'cost_price'      => 'float',
        'gross_amount'    => 'float',
        'discount_amount' => 'float',
        'net_amount'      => 'float',
        'tax_rate'        => 'float',
        'tax_amount'      => 'float',
        'line_total'      => 'float',
        'subtotal'        => 'float',
    ];

    // ─── Computed Attributes ──────────────────────────────────────────────────

    /**
     * True FIFO COGS for this line — authoritative source.
     * Sum of all non-reversed batch deductions for this sale item.
     *
     * @return float
     */
    public function getFifoCogAttribute(): float
    {
        return (float) $this->saleItemBatches()->active()->sum('total_cogs');
    }

    /**
     * Gross Profit for this line.
     * Uses FIFO COGS if batches exist, falls back to cost_price × quantity.
     *
     * @return float
     */
    public function getGrossProfitAttribute(): float
    {
        $cogs = $this->saleItemBatches()->active()->exists()
            ? $this->fifo_cog
            : ($this->cost_price * ($this->quantity + ($this->free_quantity ?? 0)));

        return ($this->net_amount ?? $this->subtotal) - $cogs;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * FIFO deduction records for this sale item.
     * Each row = one inventory batch that contributed stock to this sale line.
     * This is the authoritative COGS source (Phase 2.1+).
     */
    public function saleItemBatches()
    {
        return $this->hasMany(SaleItemBatch::class);
    }
}
