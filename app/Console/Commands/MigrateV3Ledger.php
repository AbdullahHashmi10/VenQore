<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class MigrateV3Ledger extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:v3-ledger';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate legacy data into the V3 journal ledger (Parties, Invoices, Sales, Expenses)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting V3 Ledger Migration...');

        // Login as the first admin user
        $admin = null;
        if (Schema::hasColumn('users', 'role')) {
            $admin = DB::table('users')->where('role', 'admin')->orderBy('created_at')->first();
        }
        
        if (!$admin && Schema::hasColumn('users', 'is_platform_admin')) {
            $admin = DB::table('users')->where('is_platform_admin', true)->orderBy('created_at')->first();
        }

        if (!$admin && Schema::hasTable('tenant_users')) {
            $tenantUser = DB::table('tenant_users')
                ->whereIn('role', ['owner', 'admin'])
                ->orderBy('created_at')
                ->first();
            if ($tenantUser) {
                $admin = DB::table('users')->where('id', $tenantUser->user_id)->first();
            }
        }

        if (!$admin) {
            $admin = DB::table('users')->orderBy('created_at')->first();
        }

        if (!$admin) {
            $this->error('No admin user found to associate with journal entries.');
            return 1;
        }
        auth()->loginUsingId($admin->id);
        $this->info("Logged in as Admin: {$admin->name} ({$admin->id})");

        // Step 1: Party Opening Balances
        $this->migratePartyOpeningBalances();

        // Step 2: Legacy Purchases
        $this->migrateLegacyPurchases();

        // Step 3: Legacy Sales
        $this->migrateLegacySales();

        // Step 4: Legacy Expenses
        $this->migrateLegacyExpenses();

        // Step 5: Trial Balance Check
        $this->checkTrialBalance();

        $this->info('All steps completed.');
        return 0;
    }

    private function migratePartyOpeningBalances()
    {
        $this->info('Step 1 — Migrating Party Opening Balances...');
        $parties = DB::table('parties')->where('current_balance', '!=', 0)->get();
        $this->output->progressStart($parties->count());

        $migrated = 0;
        $skipped = 0;

        foreach ($parties as $party) {
            try {
                $tenantId = $party->tenant_id ?? null;
                $arAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1200')->first()
                    ?? DB::table('accounts')->where('code', '1200')->first();
                $apAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '2000')->first()
                    ?? DB::table('accounts')->where('code', '2000')->first();
                $obeAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '7000')->first()
                    ?? DB::table('accounts')->where('code', '7000')->first();

                if (!$arAccount || !$apAccount || !$obeAccount) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                // Idempotency check
                $exists = DB::table('journal_entries')
                    ->where('reference_type', 'opening_balance')
                    ->where('reference', $party->id)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                $balance = (float) $party->current_balance;
                $absBalance = abs($balance);

                if ($party->type === 'customer' && $balance > 0) {
                    // Customer owes us money -> DR 1200 (AR) / CR 7000 (OBE)
                    $this->createDoubleEntry(
                        $absBalance,
                        $arAccount->id,
                        $obeAccount->id,
                        'opening_balance',
                        $party->id,
                        "Legacy Opening Balance: {$party->name}",
                        $party->id
                    );
                } elseif ($party->type === 'supplier' && $balance > 0) {
                    // We owe supplier money -> DR 7000 (OBE) / CR 2000 (AP)
                    $this->createDoubleEntry(
                        $absBalance,
                        $obeAccount->id,
                        $apAccount->id,
                        'opening_balance',
                        $party->id,
                        "Legacy Opening Balance: {$party->name}",
                        $party->id
                    );
                } else {
                    // Handling negative balances or other types (if needed)
                    // Following user instructions to only handle balance > 0 explicitly
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                $migrated++;
            } catch (Throwable $e) {
                $this->error("\nError migrating party [{$party->name}]: " . $e->getMessage());
            }
            $this->output->progressAdvance();
        }

        $this->output->progressFinish();
        $this->info("Migrated: {$migrated}, Skipped: {$skipped}");
    }

    private function migrateLegacyPurchases()
    {
        $this->info('Step 2 — Migrating Legacy Purchases...');
        $invoices = DB::table('invoices')->where('type', 'purchase')->get();
        $this->output->progressStart($invoices->count());

        $migrated = 0;
        $skipped = 0;

        foreach ($invoices as $invoice) {
            try {
                $tenantId = $invoice->tenant_id ?? null;
                $inventoryAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1100')->first()
                    ?? DB::table('accounts')->where('code', '1100')->first();
                $apAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '2000')->first()
                    ?? DB::table('accounts')->where('code', '2000')->first();
                $cashAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1000')->first()
                    ?? DB::table('accounts')->where('code', '1000')->first();

                if (!$inventoryAccount || !$apAccount || !$cashAccount) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                // Idempotency check for primary purchase entry
                $exists = DB::table('journal_entries')
                    ->where('reference_type', 'purchase')
                    ->where('reference', $invoice->id)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                // DR 1100 (Inventory) / CR 2000 (AP) total_amount
                $this->createDoubleEntry(
                    (float) $invoice->total_amount,
                    $inventoryAccount->id,
                    $apAccount->id,
                    'purchase',
                    $invoice->party_id,
                    "Legacy Purchase: {$invoice->invoice_number}",
                    $invoice->id
                );

                // If paid_amount > 0: DR 2000 / CR 1000 (Cash) paid_amount as purchase_payment
                if ((float) $invoice->paid_amount > 0) {
                    $this->createDoubleEntry(
                        (float) $invoice->paid_amount,
                        $apAccount->id,
                        $cashAccount->id,
                        'purchase_payment',
                        $invoice->party_id,
                        "Legacy Purchase Payment: {$invoice->invoice_number}",
                        $invoice->id
                    );
                }

                $migrated++;
            } catch (Throwable $e) {
                $this->error("\nError migrating purchase [{$invoice->invoice_number}]: " . $e->getMessage());
            }
            $this->output->progressAdvance();
        }

        $this->output->progressFinish();
        $this->info("Migrated: {$migrated}, Skipped: {$skipped}");
    }

    private function migrateLegacySales()
    {
        $this->info('Step 3 — Migrating Legacy Sales...');
        $sales = DB::table('sales')->get();
        $this->output->progressStart($sales->count());

        $migrated = 0;
        $skipped = 0;

        foreach ($sales as $sale) {
            try {
                $tenantId = $sale->tenant_id ?? null;
                $cashAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1000')->first()
                    ?? DB::table('accounts')->where('code', '1000')->first();
                $arAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1200')->first()
                    ?? DB::table('accounts')->where('code', '1200')->first();
                $revenueAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '4000')->first()
                    ?? DB::table('accounts')->where('code', '4000')->first();

                if (!$cashAccount || !$arAccount || !$revenueAccount) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                // Idempotency check
                $exists = DB::table('journal_entries')
                    ->where('reference_type', 'sale')
                    ->where('reference', $sale->id)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                $total = (float) $sale->total;
                $cashAmount = (float) $sale->amount_paid;
                $arAmount = (float) $sale->unpaid;

                // DR 1000 (Cash) amount_paid / DR 1200 (AR) unpaid / CR 4000 (Revenue) total
                $jeId = (string) Str::orderedUuid();
                DB::table('journal_entries')->insert([
                    'id' => $jeId,
                    'date' => $sale->created_at ? date('Y-m-d', strtotime($sale->created_at)) : now()->toDateString(),
                    'description' => "Legacy Sale: {$sale->reference_number}",
                    'reference' => $sale->id,
                    'reference_type' => 'sale',
                    'party_id' => $sale->party_id,
                    'user_id' => auth()->id(),
                    'created_at' => $sale->created_at ?: now(),
                    'updated_at' => $sale->updated_at ?: now(),
                ]);

                // Items
                if ($cashAmount > 0) {
                    $this->insertJournalItem($jeId, $cashAccount->id, $cashAmount, 0, $sale->party_id);
                }
                if ($arAmount > 0) {
                    $this->insertJournalItem($jeId, $arAccount->id, $arAmount, 0, $sale->party_id);
                }
                $this->insertJournalItem($jeId, $revenueAccount->id, 0, $total, null);

                $migrated++;
            } catch (Throwable $e) {
                $this->error("\nError migrating sale [{$sale->reference_number}]: " . $e->getMessage());
            }
            $this->output->progressAdvance();
        }

        $this->output->progressFinish();
        $this->info("Migrated: {$migrated}, Skipped: {$skipped}");
    }

    private function migrateLegacyExpenses()
    {
        $this->info('Step 4 — Migrating Legacy Expenses...');
        $expenses = DB::table('expenses')->get();
        $this->output->progressStart($expenses->count());

        $migrated = 0;
        $skipped = 0;

        foreach ($expenses as $expense) {
            try {
                $tenantId = $expense->tenant_id ?? null;
                $expenseAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '6000')->first()
                    ?? DB::table('accounts')->where('code', '6000')->first();
                $cashAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1000')->first()
                    ?? DB::table('accounts')->where('code', '1000')->first();

                if (!$expenseAccount || !$cashAccount) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                // Idempotency check
                $exists = DB::table('journal_entries')
                    ->where('reference_type', 'expense')
                    ->where('reference', $expense->id)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    $this->output->progressAdvance();
                    continue;
                }

                // DR 6000 (Expenses) / CR 1000 (Cash) amount
                $this->createDoubleEntry(
                    (float) $expense->amount,
                    $expenseAccount->id,
                    $cashAccount->id,
                    'expense',
                    null,
                    "Legacy Expense: {$expense->category} - " . ($expense->description ?: 'N/A'),
                    $expense->id
                );

                $migrated++;
            } catch (Throwable $e) {
                $this->error("\nError migrating expense [{$expense->id}]: " . $e->getMessage());
            }
            $this->output->progressAdvance();
        }

        $this->output->progressFinish();
        $this->info("Migrated: {$migrated}, Skipped: {$skipped}");
    }

    private function createDoubleEntry($amount, $drAccountId, $crAccountId, $type, $partyId, $desc, $reference)
    {
        $jeId = (string) Str::orderedUuid();
        DB::table('journal_entries')->insert([
            'id' => $jeId,
            'date' => now()->toDateString(),
            'description' => $desc,
            'reference' => $reference,
            'reference_type' => $type,
            'party_id' => $partyId,
            'user_id' => auth()->id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->insertJournalItem($jeId, $drAccountId, $amount, 0, $partyId);
        $this->insertJournalItem($jeId, $crAccountId, 0, $amount, $partyId);
    }

    private function insertJournalItem($jeId, $accountId, $debit, $credit, $partyId)
    {
        DB::table('journal_items')->insert([
            'id' => (string) Str::orderedUuid(),
            'journal_entry_id' => $jeId,
            'account_id' => $accountId,
            'party_id' => $partyId,
            'debit' => $debit,
            'credit' => $credit,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function checkTrialBalance()
    {
        $this->info('Step 5 — Trial Balance Check...');
        $result = DB::table('journal_items')
            ->selectRaw('SUM(debit) - SUM(credit) as imbalance')
            ->first();

        $imbalance = (float) ($result->imbalance ?? 0);
        $this->line("Trial Balance Difference: " . number_format($imbalance, 2));

        if (abs($imbalance) > 0.01) {
            $this->warn('WARNING: The Trial Balance is NOT 0.00! Total Difference: ' . number_format($imbalance, 2));
        } else {
            $this->info('Trial Balance is healthy (0.00).');
        }
    }
}
