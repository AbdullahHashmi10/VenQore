<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Account;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class RecalculateAccountBalances extends Command
{
    protected $signature = 'accounts:recalculate {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Recalculate all account balances from journal entries (per tenant)';

    public function handle()
    {
        // 6D FIX: Run per tenant — never mix balances across tenants
        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', (int) $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        if ($tenants->isEmpty()) {
            $this->warn('No active tenants found.');
            return 0;
        }

        foreach ($tenants as $tenant) {
            $this->info("\n🏪 Tenant [{$tenant->id}] {$tenant->name}");
            $this->recalculateForTenant($tenant->id);
        }

        return 0;
    }

    private function recalculateForTenant(int $tenantId): void
    {
        $this->info('   Recalculating account balances...');

        // 6D FIX: Scope accounts to this tenant only
        $accounts = Account::where('tenant_id', $tenantId)->get();
        $count = 0;

        foreach ($accounts as $account) {
            // 6D FIX: Scope journal items to non-reversed entries for this tenant
            $totalDebit = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_items.account_id', $account->id)
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.debit');

            $totalCredit = DB::table('journal_items')
                ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_items.account_id', $account->id)
                ->where('journal_entries.tenant_id', $tenantId)
                ->where('journal_entries.is_reversed', 0)
                ->sum('journal_items.credit');

            // For asset/expense accounts: balance = debit - credit
            // For liability/equity/income accounts: balance = credit - debit
            $newBalance = in_array($account->type, ['asset', 'expense'])
                ? $totalDebit - $totalCredit
                : $totalCredit - $totalDebit;

            if (abs((float)$account->balance - (float)$newBalance) > 0.001) {
                $this->line("   Account '{$account->name}': {$account->balance} → {$newBalance}");
                $account->balance = $newBalance;
                $account->save();
                $count++;
            }
        }

        $this->info("   Updated {$count} accounts for tenant {$tenantId}.");
    }
}
