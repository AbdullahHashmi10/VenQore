<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReckonerBackfillBankDimensionCommand extends Command
{
    protected $signature = 'reckoner:backfill-bank-dimension {--tenant= : Specific tenant ID or slug to backfill}';
    protected $description = 'Backfill bank_account_id on journal_items from source documents (payments, expenses, fund transfers)';

    public function handle(): int
    {
        $tenantId = $this->option('tenant');
        $this->info("Starting backfill of bank_account_id for tenant: " . ($tenantId ?: 'ALL'));

        $tenantsQuery = DB::table('tenants');
        if ($tenantId) {
            $tenantsQuery->where('id', $tenantId)->orWhere('slug', $tenantId);
        }
        $tenants = $tenantsQuery->get();

        foreach ($tenants as $tenant) {
            $this->info("Processing tenant: {$tenant->name} ({$tenant->id})");
            $updatedCount = 0;

            // 1. Backfill from payments table
            $payments = DB::table('payments')
                ->where('tenant_id', $tenant->id)
                ->whereNotNull('bank_account_id')
                ->get();

            foreach ($payments as $payment) {
                $affected = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                    ->where('je.tenant_id', $tenant->id)
                    ->where('ji.tenant_id', $tenant->id)
                    ->where('je.reference_type', 'payment')
                    ->where('je.reference', $payment->id)
                    ->whereIn('a.role', ['bank', 'cash'])
                    ->whereNull('ji.bank_account_id')
                    ->update(['ji.bank_account_id' => $payment->bank_account_id]);

                $updatedCount += $affected;
            }

            // 2. Backfill from expenses table
            $expenses = DB::table('expenses')
                ->where('tenant_id', $tenant->id)
                ->whereNotNull('bank_account_id')
                ->get();

            foreach ($expenses as $expense) {
                $affected = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                    ->where('je.tenant_id', $tenant->id)
                    ->where('ji.tenant_id', $tenant->id)
                    ->where('je.reference_type', 'expense')
                    ->where('je.reference', $expense->id)
                    ->whereIn('a.role', ['bank', 'cash'])
                    ->whereNull('ji.bank_account_id')
                    ->update(['ji.bank_account_id' => $expense->bank_account_id]);

                $updatedCount += $affected;
            }

            // 3. Backfill from fund_transactions (transfers)
            $fundTxs = DB::table('fund_transactions')
                ->where('tenant_id', $tenant->id)
                ->get();

            foreach ($fundTxs as $tx) {
                if ($tx->to_account_id) {
                    $affectedTo = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenant->id)
                        ->where('ji.tenant_id', $tenant->id)
                        ->where('je.reference_type', 'fund_transfer')
                        ->where(function ($q) use ($tx) {
                            $q->where('je.reference', $tx->id)
                              ->orWhere('je.reference', $tx->to_account_id)
                              ->orWhere('je.reference', $tx->from_account_id)
                              ->orWhere('je.source_id', $tx->id);
                        })
                        ->where('ji.debit', '>', 0)
                        ->whereIn('a.role', ['bank', 'cash'])
                        ->whereNull('ji.bank_account_id')
                        ->update(['ji.bank_account_id' => $tx->to_account_id]);

                    $updatedCount += $affectedTo;
                }

                if ($tx->from_account_id) {
                    $affectedFrom = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenant->id)
                        ->where('ji.tenant_id', $tenant->id)
                        ->where('je.reference_type', 'fund_transfer')
                        ->where(function ($q) use ($tx) {
                            $q->where('je.reference', $tx->id)
                              ->orWhere('je.reference', $tx->to_account_id)
                              ->orWhere('je.reference', $tx->from_account_id)
                              ->orWhere('je.source_id', $tx->id);
                        })
                        ->where('ji.credit', '>', 0)
                        ->whereIn('a.role', ['bank', 'cash'])
                        ->whereNull('ji.bank_account_id')
                        ->update(['ji.bank_account_id' => $tx->from_account_id]);

                    $updatedCount += $affectedFrom;
                }
            }

            // 4. Backfill from sales where bank tender
            $hasSalesBankCol = \Illuminate\Support\Facades\Schema::hasColumn('sales', 'bank_account_id');
            $salesWithBank = DB::table('sales')
                ->where('tenant_id', $tenant->id)
                ->where(function ($q) use ($hasSalesBankCol) {
                    $q->whereIn('payment_method', ['bank', 'card', 'online', 'upi']);
                    if ($hasSalesBankCol) {
                        $q->orWhereNotNull('bank_account_id');
                    }
                })
                ->get();

            foreach ($salesWithBank as $s) {
                $bankId = ($hasSalesBankCol && !empty($s->bank_account_id)) ? $s->bank_account_id : ($s->payment_account_id ?? null);
                if ($bankId) {
                    $affected = DB::table('journal_items as ji')
                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                        ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                        ->where('je.tenant_id', $tenant->id)
                        ->where('ji.tenant_id', $tenant->id)
                        ->where('je.reference_type', 'sale')
                        ->where('je.reference', $s->id)
                        ->whereIn('a.role', ['bank', 'cash'])
                        ->whereNull('ji.bank_account_id')
                        ->update(['ji.bank_account_id' => $bankId]);

                    $updatedCount += $affected;
                }
            }

            // 5. Fallback for unlinked bank lines when tenant has exactly 1 bank account
            $tenantBankAccounts = DB::table('bank_accounts')
                ->where('tenant_id', $tenant->id)
                ->where('type', 'bank')
                ->get();

            if ($tenantBankAccounts->count() === 1) {
                $singleBankId = $tenantBankAccounts->first()->id;
                $affectedSingle = DB::table('journal_items as ji')
                    ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                    ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                    ->where('je.tenant_id', $tenant->id)
                    ->where('ji.tenant_id', $tenant->id)
                    ->where('a.role', 'bank')
                    ->whereNull('ji.bank_account_id')
                    ->update(['ji.bank_account_id' => $singleBankId]);

                $updatedCount += $affectedSingle;
            }

            $this->info("Tenant {$tenant->name}: updated {$updatedCount} journal_items rows with bank_account_id.");
        }

        $this->info("Bank dimension backfill completed.");
        return Command::SUCCESS;
    }
}
