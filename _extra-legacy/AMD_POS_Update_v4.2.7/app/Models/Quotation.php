<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quotation extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'quotation_date' => 'date',
        'valid_until'    => 'date',
    ];

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function getCustomerNetBalanceAttribute(): ?float
    {
        if (!$this->party_id || !$this->tenant_id) {
            return null;
        }
        return \App\Services\LedgerService::partyNetBalance(
            $this->party_id,
            $this->tenant_id
        );
    }

    public function getCustomerPrevBalanceAttribute()
    {
        // Quotation does not affect double-entry ledger balance, so previous balance equals current balance
        return $this->customer_net_balance;
    }

    public function customer()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }
}
