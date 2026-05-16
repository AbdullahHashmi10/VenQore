<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BankAccount extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * Get the true balance.
     * For Cash, the single source of truth is the V3 GL Ledger (Account 1000).
     * For Banks, the V3 GL Ledger (Account 1010) combines all banks, so we must 
     * use the local current_balance as the bank-specific subledger.
     */
    public function v3Balance(): float
    {
        if ($this->account_type === 'cash' || $this->type === 'cash') {
            return (float) \Illuminate\Support\Facades\DB::table('journal_items')
                ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_items.tenant_id', $this->tenant_id)
                ->where('accounts.code', '1000')
                ->where('journal_entries.is_reversed', 0)
                ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as balance')
                ->value('balance');
        }

        // For non-cash banks, return the subledger tracked balance from the journal using reference
        return (float) \Illuminate\Support\Facades\DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_items.tenant_id', $this->tenant_id)
            ->where('accounts.code', '1010')
            ->where('journal_entries.reference', $this->id)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as balance')
            ->value('balance');
    }
}
