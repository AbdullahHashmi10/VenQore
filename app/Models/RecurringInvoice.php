<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

class RecurringInvoice extends Model
{
    use HasFactory, SoftDeletes, HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'items' => 'array',
        'next_run_date' => 'date',
        'last_run_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
