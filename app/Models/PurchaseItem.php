<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchaseItem extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'qty'          => 'float',
        'unit_cost'    => 'float',
        'tax_rate'     => 'float',
        'line_total'   => 'float',
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
