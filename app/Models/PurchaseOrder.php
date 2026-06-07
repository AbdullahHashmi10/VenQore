<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchaseOrder extends Model
{
    use HasUuids, HasFactory, SoftDeletes, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'order_date'              => 'date',
        'expected_delivery_date'  => 'date',
        'is_jit'                  => 'boolean',
        'fee_estimate_used'       => 'boolean',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ─── VenSynQ Relationships ────────────────────────────────────────────────

    /**
     * The channel sale that triggered this auto-generated JIT draft purchase.
     */
    public function jitSale()
    {
        return $this->belongsTo(Sale::class, 'jit_sale_id');
    }

    // ─── VenSynQ Scopes ───────────────────────────────────────────────────────

    public function scopeJitDrafts($query)
    {
        return $query->where('is_jit', true)->where('approval_status', 'draft');
    }

    public function scopeJitApproved($query)
    {
        return $query->where('is_jit', true)->where('approval_status', 'approved');
    }
}
