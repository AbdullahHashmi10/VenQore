<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\JournalEntry;
use App\Models\Sale;
use App\Models\Account;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class CleanOrphanJournalEntries extends Command
{
    protected $signature = 'journals:clean-orphans {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Soft-delete orphan journal entries (per tenant) and recalculate account balances';

    public function handle()
    {
        // 6C FIX: Run per tenant — never process all tenants globally
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
            $this->processForTenant($tenant->id);
        }

        return 0;
    }

    private function processForTenant(int $tenantId): void
    {
        $this->info('   Checking for orphan journal entries...');

        // 6C FIX: Scope journal entries to this tenant
        $journalEntries = JournalEntry::where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('reference', 'like', 'INV-%')
                  ->orWhere('reference', 'like', 'SALE%');
            })
            ->get();

        $orphanCount = 0;
        $affectedAccountIds = [];

        foreach ($journalEntries as $entry) {
            // Check if the referenced sale exists (scoped to this tenant)
            $saleExists = Sale::where('tenant_id', $tenantId)
                ->where('reference_number', $entry->reference)
                ->exists();

            if (!$saleExists) {
                $this->line("   Orphan: {$entry->reference} — {$entry->description}");

                // Collect affected accounts
                $accountIds = $entry->items->pluck('account_id')->toArray();
                $affectedAccountIds = array_merge($affectedAccountIds, $accountIds);

                // 6C FIX: Soft delete instead of hard delete
                // Hard-deleting journal lines corrupts the double-entry ledger.
                // We mark them as reversed so they're excluded from balance calculations.
                $entry->update(['is_reversed' => 1]);
                // Soft delete the entry and items via Eloquent SoftDeletes
                $entry->items()->delete();
                $entry->delete();

                $orphanCount++;
            }
        }

        if ($orphanCount > 0) {
            $this->info("   Soft-deleted {$orphanCount} orphan entries for tenant {$tenantId}.");

            // Recalculate only affected accounts, scoped to this tenant
            $affectedAccountIds = array_unique($affectedAccountIds);
            foreach ($affectedAccountIds as $accountId) {
                $account = Account::where('tenant_id', $tenantId)->find($accountId);
                if (!$account) continue;

                // Exclude reversed entries from balance calculation
                $totalDebit  = DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.account_id', $accountId)
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_entries.is_reversed', 0)
                    ->sum('journal_items.debit');

                $totalCredit = DB::table('journal_items')
                    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                    ->where('journal_items.account_id', $accountId)
                    ->where('journal_entries.tenant_id', $tenantId)
                    ->where('journal_entries.is_reversed', 0)
                    ->sum('journal_items.credit');

                $newBalance = in_array($account->type, ['asset', 'expense'])
                    ? $totalDebit - $totalCredit
                    : $totalCredit - $totalDebit;

                $account->balance = $newBalance;
                $account->save();
                $this->line("   Recalculated: {$account->name} = {$newBalance}");
            }
        } else {
            $this->info('   No orphan journal entries found.');
        }
    }
}
