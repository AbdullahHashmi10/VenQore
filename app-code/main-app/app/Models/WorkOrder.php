<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrder extends Model
{
    protected $table = 'work_orders';

    protected $fillable = [
        'tenant_id',
        'kind',
        'order_number',
        'items',
        'status',
        'time_elapsed_mins',
    ];

    protected $casts = [
        'items'             => 'array',
        'time_elapsed_mins' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
