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

    protected $appends = ['paid_amount', 'customer_prev_balance', 'customer_net_balance'];

    public function getPaidAmountAttribute()
    {
        // Simple manual query or relationship check to avoid deep recursion
        return (float) \Illuminate\Support\Facades\DB::table('payments')
            ->join('payment_allocations', 'payments.id', '=', 'payment_allocations.payment_id')
            ->where('payment_allocations.invoice_id', $this->id)
            ->sum('payments.amount');
    }

    public function getCustomerNetBalanceAttribute()
    {
        if (!$this->relationLoaded('party') || !$this->party) {
            return null;
        }

        $tenantId = $this->tenant_id;
        $arAccount = \App\Models\Account::where('code', '1200')->where('tenant_id', $tenantId)->value('id') ?? 0;
        $apAccount = \App\Models\Account::where('code', '2000')->where('tenant_id', $tenantId)->value('id') ?? 0;

        $netAR = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', function($join) use ($tenantId) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId);
            })
            ->where('journal_entries.party_id', $this->party_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $arAccount)
            ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
            ->value('balance') ?? 0;

        $netAP = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', function($join) use ($tenantId) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId);
            })
            ->where('journal_entries.party_id', $this->party_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
            ->value('balance') ?? 0;

        $isCustomer = $this->party->type === 'customer';
        $balance = $isCustomer ? ($netAR - $netAP) : ($netAP - $netAR);
        return (float) $balance;
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
