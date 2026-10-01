<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class Invoice extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'tenant_id', 'invoice_number', 'date', 'due_date', 'party_id', 'user_id',
        'type', 'status', 'approval_status', 'subtotal', 'discount', 'discount_amount',
        'tax', 'tax_amount', 'round_off', 'total_amount', 'paid_amount', 'notes',
        'reference', 'is_jit', 'jit_sale_id', 'channel_order_id',
    ];

    protected $casts = [
        'date' => 'date',
        'is_jit' => 'boolean',
    ];

    protected $appends = ['paid_amount'];

    public function getPaidAmountAttribute()
    {
        if ($this->relationLoaded('payments')) {
            return (float) $this->payments->sum('amount');
        }
        return (float) $this->payments()->sum('amount');
    }
    public function getTotalAttribute()
    {
        return $this->total_amount;
    }
    public function getCustomerNetBalanceAttribute(): ?float
    {
        if (!$this->party_id || !$this->tenant_id) {
            return null;
        }
        return \App\Queries\PartyBalanceQuery::partyNetBalance(
            $this->party_id,
            $this->tenant_id
        );
    }

    public function getCustomerPrevBalanceAttribute()
    {
        $net = $this->customer_net_balance;
        if ($net === null) {
            return null;
        }
        $invoiceTotal = (float) ($this->total ?? 0);
        $amountPaid = (float) $this->paid_amount;
        $balanceDue = max(0, $invoiceTotal - $amountPaid);
        return $net - $balanceDue;
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'purchase_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'reference', 'invoice_number');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
