<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasTenant;

class BankAccount extends Model
{
    use HasUuids, HasTenant;

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
                ->where('journal_entries.tenant_id', $this->tenant_id)
                ->where('accounts.code', '1000')
                ->where('journal_entries.is_reversed', 0)
                ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as balance')
                ->value('balance');
        }

        // For non-cash banks, return the subledger tracked balance from the source tables
        $opening = (float) $this->opening_balance;

        $hasBankAccount = \Illuminate\Support\Facades\Schema::hasColumn('payments', 'bank_account_id');

        $deposits = 0.0;
        $withdrawals = 0.0;

        if ($hasBankAccount) {
            $deposits = (float) \Illuminate\Support\Facades\DB::table('payments')
                ->where('tenant_id', $this->tenant_id)
                ->where('bank_account_id', $this->id)
                ->whereIn('type', ['in', 'received'])
                ->sum('amount');

            $withdrawals = (float) \Illuminate\Support\Facades\DB::table('payments')
                ->where('tenant_id', $this->tenant_id)
                ->where('bank_account_id', $this->id)
                ->whereIn('type', ['out', 'sent'])
                ->sum('amount');
        }

        $expenses = (float) \Illuminate\Support\Facades\DB::table('expenses')
            ->where('tenant_id', $this->tenant_id)
            ->where('bank_account_id', $this->id)
            ->sum('amount');

        $transfersIn = (float) \Illuminate\Support\Facades\DB::table('fund_transactions')
            ->where('tenant_id', $this->tenant_id)
            ->where('to_account_id', $this->id)
            ->sum('amount');

        $transfersOut = (float) \Illuminate\Support\Facades\DB::table('fund_transactions')
            ->where('tenant_id', $this->tenant_id)
            ->where('from_account_id', $this->id)
            ->sum('amount');

        return $opening + $deposits + $transfersIn - $withdrawals - $expenses - $transfersOut;
    }
}
