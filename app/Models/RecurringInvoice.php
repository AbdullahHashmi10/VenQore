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

    protected $appends = ['amount', 'title'];

    public function getAmountAttribute()
    {
        $items = $this->items;
        if (!is_array($items)) {
            $items = json_decode($items, true) ?: [];
        }
        
        $total = 0;
        foreach ($items as $item) {
            $total += ($item['qty'] ?? 0) * ($item['unit_price'] ?? 0);
        }
        return $total;
    }

    public function getTitleAttribute()
    {
        if ($this->customer) {
            return "Recurring to " . $this->customer->name;
        }
        return "Recurring #" . substr($this->id, 0, 8);
    }

    public function customer()
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
