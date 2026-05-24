<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ProductionLogIngredient extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'quantity_used' => 'decimal:3',
        'cost_at_time' => 'decimal:2',
    ];

    public function productionLog()
    {
        return $this->belongsTo(ProductionLog::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
