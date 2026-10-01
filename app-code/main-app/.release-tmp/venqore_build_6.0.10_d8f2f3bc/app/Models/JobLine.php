<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobLine extends Model
{
    protected $table = 'job_lines';

    protected $fillable = [
        'job_id',
        'kind',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'unit_cost',
        'tax_rate',
        'warehouse_id',
        'consumed_at',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'tax_rate' => 'float',
        'consumed_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(ServiceJob::class, 'job_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}
