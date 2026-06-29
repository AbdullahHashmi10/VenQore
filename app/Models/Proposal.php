<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proposal extends Model
{
    use HasUuids, SoftDeletes, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'valid_until' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(ProposalItem::class);
    }

    public function getCustomerNetBalanceAttribute(): ?float
    {
        if (!$this->customer_id || !$this->tenant_id) {
            return null;
        }
        return \App\Services\LedgerService::partyNetBalance(
            $this->customer_id,
            $this->tenant_id
        );
    }

    public function getCustomerPrevBalanceAttribute()
    {
        // Proposal does not affect double-entry ledger balance, so previous balance equals current balance
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
