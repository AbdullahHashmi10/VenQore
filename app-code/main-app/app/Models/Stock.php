<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class Stock extends Model
{
    use HasUuids, HasTenant;
    protected $guarded = [];

    protected $appends = ['available_quantity'];

    public function getAvailableQuantityAttribute()
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
