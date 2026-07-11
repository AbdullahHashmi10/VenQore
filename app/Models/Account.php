<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;

class Account extends Model
{
    use HasFactory, HasUuids, HasTenant, SoftDeletes;

    protected static function booted()
    {
        static::creating(function ($account) {
            $tenantId = $account->tenant_id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
            if ($tenantId && $account->code) {
                $exists = static::withoutGlobalScopes()
                    ->where('tenant_id', $tenantId)
                    ->where('code', $account->code)
                    ->exists();
                if ($exists) {
                    return false; // cancel creation as it already exists
                }
            }
        });
    }

    protected $fillable = [
        'name',
        'code',
        'type',
        'parent_id',
        'balance',
        'depreciation_rate',
        'is_active',
    ];

    public function parent()
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Account::class, 'parent_id');
    }

    public function journalItems()
    {
        return $this->hasMany(JournalItem::class);
    }

    public function getBalanceAttribute($cachedValue)
    {
        if (!$this->journalItems()->exists()) {
            return (float) ($cachedValue ?? 0.0);
        }

        $totals = $this->journalItems()
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('SUM(journal_items.debit) as total_debit, SUM(journal_items.credit) as total_credit')
            ->first();

        $debit  = (float) ($totals->total_debit ?? 0.0);
        $credit = (float) ($totals->total_credit ?? 0.0);

        if (in_array($this->type, ['asset', 'expense'])) {
            return $debit - $credit;
        }

        return $credit - $debit;
    }
}
