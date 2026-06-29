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

    protected $appends = ['customer_prev_balance', 'customer_net_balance'];

    public function getCustomerNetBalanceAttribute()
    {
        if (!$this->relationLoaded('customer') || !$this->customer) {
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
            ->where('journal_entries.party_id', $this->customer_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $arAccount)
            ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
            ->value('balance') ?? 0;

        $netAP = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', function($join) use ($tenantId) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId);
            })
            ->where('journal_entries.party_id', $this->customer_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
            ->value('balance') ?? 0;

        $isCustomer = $this->customer->type === 'customer';
        $balance = $isCustomer ? ($netAR - $netAP) : ($netAP - $netAR);
        return (float) $balance;
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
