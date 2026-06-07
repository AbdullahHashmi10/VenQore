<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class StockTakeItem extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'stock_take_id',
        'product_id',
        'expected_quantity',
        'counted_quantity',
        'difference',
        'cost_price'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
