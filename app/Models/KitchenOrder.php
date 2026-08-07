<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitchenOrder extends Model
{
    protected $fillable = [
        'tenant_id',
        'order_number',
        'table_id',
        'table_number',
        'items',
        'status',
        'time_elapsed_mins',
    ];

    protected $casts = [
        'items' => 'array',
        'time_elapsed_mins' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }
}
