<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesOrder extends Model
{
    use HasUuids, SoftDeletes, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function getCustomerNetBalanceAttribute(): ?float
    {
        if (!$this->customer_id || !$this->tenant_id) {
            return null;
        }
        return \App\Queries\PartyBalanceQuery::partyNetBalance(
            $this->customer_id,
            $this->tenant_id
        );
    }

    public function getCustomerPrevBalanceAttribute()
    {
        // SalesOrder does not affect double-entry ledger balance, so previous balance equals current balance
        return $this->customer_net_balance;
    }

    public function customer()
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
