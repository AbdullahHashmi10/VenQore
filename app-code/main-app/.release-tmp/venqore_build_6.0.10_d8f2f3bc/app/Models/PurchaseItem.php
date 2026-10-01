<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchaseItem extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'qty'          => 'float',
        'unit_cost'    => 'decimal:4',
        'tax_rate'     => 'float',
        'line_total'   => 'decimal:4',
        'business_pct' => 'float',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class); // Note: Purchase model doesn't exist yet, but for future proofing
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
