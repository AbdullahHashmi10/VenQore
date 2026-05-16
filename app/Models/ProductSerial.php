<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductSerial extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'product_id',
        'serial_number',
        'status',
        'warehouse_id',
        'purchase_id',
        'sale_id',
        'notes'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
    
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
