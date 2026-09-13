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
use App\Traits\HasTenant;

class SaleItem extends Model
{
    use HasUuids, HasFactory, SoftDeletes, HasTenant;

    protected $fillable = [
        'tenant_id',
        'sale_id',
        'product_id',
        'product_variant_id',
        'quantity',
        'free_quantity',
        'unit_price',
        'cost_price',
        'gross_amount',
        'discount_amount',
        'net_amount',
        'tax_rate',
        'tax_amount',
        'line_total',
        'subtotal',
        'returned_quantity',
        /* Which line of the original sale a return line gives back. Without it
           on this list the column was never written, so the cap on how much
           could be returned had nothing to measure against and never fired. */
        'original_sale_item_id',
    ];

    protected $casts = [
        'quantity'        => 'decimal:4',
        'free_quantity'   => 'decimal:4',
        'unit_price'      => 'decimal:4',
        'cost_price'      => 'decimal:4',
        'gross_amount'    => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'net_amount'      => 'decimal:4',
        'tax_rate'        => 'float',
        'tax_amount'      => 'decimal:4',
        'line_total'      => 'decimal:4',
        'subtotal'        => 'decimal:4',
        'returned_quantity' => 'decimal:4',
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
