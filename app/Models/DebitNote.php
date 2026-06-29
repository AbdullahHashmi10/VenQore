<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class DebitNote extends Model
{
    use SoftDeletes, HasUuids, HasTenant;

    protected $fillable = [
        'reference_number',
        'supplier_id',
        'purchase_id',
        'date',
        'amount',
        'reason',
        'status',
        'created_by'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->reference_number) {
                $model->reference_number = 'DN-' . strtoupper(Str::random(8));
            }
        });
    }

    protected $appends = ['customer_prev_balance', 'customer_net_balance'];

    public function getCustomerNetBalanceAttribute()
    {
        if (!$this->relationLoaded('supplier') || !$this->supplier) {
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
            ->where('journal_entries.party_id', $this->supplier_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $arAccount)
            ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
            ->value('balance') ?? 0;

        $netAP = \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', function($join) use ($tenantId) {
                $join->on('journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_entries.tenant_id', $tenantId);
            })
            ->where('journal_entries.party_id', $this->supplier_id)
            ->where('journal_entries.is_reversed', 0)
            ->where('journal_items.account_id', $apAccount)
            ->selectRaw('SUM(COALESCE(journal_items.credit,0)) - SUM(COALESCE(journal_items.debit,0)) as balance')
            ->value('balance') ?? 0;

        $isCustomer = $this->supplier->type === 'customer';
        $balance = $isCustomer ? ($netAR - $netAP) : ($netAP - $netAR);
        return (float) $balance;
    }

    public function getCustomerPrevBalanceAttribute()
    {
        $net = $this->customer_net_balance;
        if ($net === null) {
            return null;
        }
        $balanceDue = (float) ($this->amount ?? 0);
        return $net + $balanceDue;
    }

    public function supplier()
    {
        return $this->belongsTo(Party::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(DebitNoteItem::class);
    }
}
