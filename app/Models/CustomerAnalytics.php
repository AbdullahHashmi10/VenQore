<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class CustomerAnalytics extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id',             // WOUND 3 FIX — explicit tenant stamp required
        'party_id',
        'total_orders',
        'total_spent',
        'average_order_value',
        'avg_days_between_orders',
        'last_order_date',
        'predicted_next_order',
        'status',
    ];

    protected $casts = [
        'total_spent'          => 'decimal:2',
        'average_order_value'  => 'decimal:2',
        'last_order_date'      => 'date',
        'predicted_next_order' => 'date',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }
}
