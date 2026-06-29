<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class Invoice extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
        'is_jit' => 'boolean',
    ];

    protected $appends = ['paid_amount'];

    public function getPaidAmountAttribute()
    {
        // Simple manual query or relationship check to avoid deep recursion
        return (float) \Illuminate\Support\Facades\DB::table('payments')
            ->join('payment_allocations', 'payments.id', '=', 'payment_allocations.payment_id')
            ->where('payment_allocations.invoice_id', $this->id)
            ->sum('payments.amount');
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
        return $this->hasManyThrough(Payment::class, PaymentAllocation::class, 'invoice_id', 'id', 'id', 'payment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
