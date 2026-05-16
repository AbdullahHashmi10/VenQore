<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InventoryBatch extends Model
{
    use HasUuids, SoftDeletes, HasTenant;

    protected $fillable = [
        'product_id',
        'variant_id',
        'purchase_invoice_id',
        'warehouse_id',
        'original_qty',
        'initial_qty',
        'remaining_qty',
        'unit_cost',
        'expiry_date',
        'notes',
    ];

    protected $casts = [
        'original_qty'  => 'float',
        'remaining_qty' => 'float',
        'unit_cost'     => 'float',
        'expiry_date'   => 'date',
    ];

    // ─── Relationships ──────────────────────────────────────────────────

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function saleItemBatches()
    {
        return $this->hasMany(SaleItemBatch::class);
    }

    // ─── Scopes ─────────────────────────────────────────────────────────

    /**
     * Only batches that still have stock remaining.
     */
    public function scopeAvailable($query)
    {
        return $query->where('remaining_qty', '>', 0);
    }

    /**
     * Batches for the FIFO deduction query — oldest first.
     */
    public function scopeFifoOrder($query)
    {
        return $query->available()->orderBy('created_at', 'asc');
    }
}
