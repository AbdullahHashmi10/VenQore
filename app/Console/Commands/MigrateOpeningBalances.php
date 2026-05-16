<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * MigrateOpeningBalances
 *
 * Seeds every party's opening balance into the V3 journal ledger as a
 * single "Opening Balance" journal entry.
 *
 * SAFE TO RE-RUN: It checks for an existing idempotency key before
 * inserting, so running it twice does nothing.
 *
 * REVERSIBLE: Run with --dry-run to preview without writing anything.
 *             Run with --reverse to delete all entries created by this
 *             command (idempotency_key LIKE 'ob_migrate_%').
 *
 * Usage:
 *   php artisan migrate:opening-balances            # live run
 *   php artisan migrate:opening-balances --dry-run  # preview only
 *   php artisan migrate:opening-balances --reverse  # undo all
 */
class MigrateOpeningBalances extends Command
{
    protected $signature = 'migrate:opening-balances
                            {--tenant-id= : Required — the tenant ID to migrate. Prevents cross-tenant data mixing.}
                            {--dry-run : Print what would be inserted without touching the DB}
                            {--reverse : Delete all journal entries created by this command}';

    protected $description = 'Seed party opening balances from the parties table into the V3 journal ledger';

    public function handle(): int
    {
        $tenantId = $this->option('tenant-id');
        if (!$tenantId) {
            $this->error('--tenant-id is required. Run: php artisan migrate:opening-balances --tenant-id=<id>');
            return self::FAILURE;
        }

        if ($this->option('reverse')) {
            return $this->reverse($tenantId);
        }

        $dryRun = $this->option('dry-run');

        // Load accounts we need
        $arAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '1200')->first(); // Accounts Receivable
        $apAccount = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '2000')->first(); // Accounts Payable
        $obEquity  = DB::table('accounts')->where('tenant_id', $tenantId)->where('code', '7000')->first(); // Opening Balance Equity

        if (!$arAccount || !$apAccount || !$obEquity) {
            $this->error('Required accounts (1200, 2000, 7000) not found. Run seeders first.');
            return self::FAILURE;
        }

        $this->info('Accounts loaded:');
        $this->line("  AR  1200: {$arAccount->name} ({$arAccount->id})");
        $this->line("  AP  2000: {$apAccount->name} ({$apAccount->id})");
        $this->line("  OBE 7000: {$obEquity->name} ({$obEquity->id})");

        // Load all parties with a non-zero opening balance
        $parties = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('opening_balance', '!=', 0)
                  ->orWhere('current_balance', '!=', 0);
            })
            ->get(['id', 'name', 'type', 'opening_balance', 'current_balance']);

        $this->info("Found {$parties->count()} parties with non-zero balance.");

        // Determine the migration date — earliest possible to not distort reports
        // We use 2000-01-01 so it always appears before any real transaction in reports
        $migrationDate = '2000-01-01';
        $adminUserId   = DB::table('users')->orderBy('created_at')->value('id');

        $inserted = 0;
        $skipped  = 0;
        $totalAR  = 0;
        $totalAP  = 0;

        foreach ($parties as $party) {
            // Priority: opening_balance_type (the explicit intention during import)
            // Fallback: Use the sign of current_balance for existing records
            $balance = (float) $party->current_balance;
            if ($balance == 0) {
                $skipped++;
                continue;
            }

            // Determine if it should be an Accounts Receivable (DR 1200) or Accounts Payable (CR 2000) balance
            // Rule:
            // - Receivable: DR 1200 (AR), CR 7000 (OBE)
            // - Payable:    DR 7000 (OBE), CR 2000 (AP)
            
            $typeColumn = $party->opening_balance_type ?? null;
            $isReceivable = false;

            if ($typeColumn === 'receivable') {
                $isReceivable = true;
            } elseif ($typeColumn === 'payable') {
                $isReceivable = false;
            } else {
                // Fallback: Infer from sign and party type for old data
                if ($party->type === 'customer') {
                    $isReceivable = ($balance > 0);
                } else { // supplier
                    $isReceivable = ($balance < 0); // supplier with negative means they owe us
                }
            }

            $absBalance = abs($balance);
            if ($isReceivable) {
                // DR AR, CR OBE
                $drAccountId = $arAccount->id;
                $crAccountId = $obEquity->id;
                $totalAR    += $absBalance;
                $desc        = "Opening Balance — " . ($party->type === 'customer' ? 'Customer' : 'Supplier') . " receivable: {$party->name}";
            } else {
                // DR OBE, CR AP
                $drAccountId = $obEquity->id;
                $crAccountId = $apAccount->id;
                $totalAP    += $absBalance;
                $desc        = "Opening Balance — " . ($party->type === 'customer' ? 'Customer' : 'Supplier') . " payable: {$party->name}";
            }

            $idempKey = 'ob_migrate_' . $party->id;

            // Skip if already migrated
            $exists = DB::table('journal_entries')
                ->where('tenant_id', $tenantId)
                ->where('idempotency_key', $idempKey)
                ->exists();

            if ($exists) {
                $this->line("  SKIP [{$party->name}] — already migrated");
                $skipped++;
                continue;
            }

            $this->line(sprintf(
                "  %s [%s] %.2f — DR %s CR %s",
                $dryRun ? 'PREVIEW' : 'INSERT',
                $party->name,
                $absBalance,
                $drAccountId === $arAccount->id ? 'AR' : 'OBE',
                $crAccountId === $apAccount->id ? 'AP' : 'OBE'
            ));

            if (!$dryRun) {
                $jeId = (string) Str::orderedUuid();
                $now  = now()->toDateTimeString();

                $entry = [
                    'id'               => $jeId,
                    'tenant_id'        => $tenantId,
                    'date'             => $migrationDate,
                    'reference'        => 'OB-MIGRATE-' . strtoupper(substr($party->id, -8)),
                    'description'      => $desc,
                    'idempotency_key'  => $idempKey,
                    'is_reversed'      => 0,
                    'is_reversal'      => 0,
                    'reference_type'   => 'opening_balance_migration',
                    'party_id'         => $party->id,
                    'user_id'          => $adminUserId,
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ];

                // insertOrIgnore: skip silently if idempotency_key already exists
                $affected = DB::table('journal_entries')->insertOrIgnore($entry);

                if ($affected === 0) {
                    // Already existed — skip items too
                    $this->line("  SKIP (already in DB) [{$party->name}]");
                    $skipped++;
                    $inserted--;  // undo the increment below
                } else {
                    DB::table('journal_items')->insert([
                        [
                            'id'               => (string) Str::orderedUuid(),
                            'tenant_id'        => $tenantId,
                            'journal_entry_id' => $jeId,
                            'account_id'       => $drAccountId,
                            'debit'            => $absBalance,
                            'credit'           => 0,
                            'description'      => $desc,
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ],
                        [
                            'id'               => (string) Str::orderedUuid(),
                            'tenant_id'        => $tenantId,
                            'journal_entry_id' => $jeId,
                            'account_id'       => $crAccountId,
                            'debit'            => 0,
                            'credit'           => $absBalance,
                            'description'      => $desc,
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ],
                    ]);
                }
            }

            $inserted++;
        }

        $this->newLine();
        $this->info($dryRun
            ? "DRY RUN complete. Would insert {$inserted} journal entries, skip {$skipped}."
            : "Migration complete. Inserted {$inserted} journal entries, skipped {$skipped} (already done or zero)."
        );
        $this->info("  Total AR seeded: Rs " . number_format($totalAR, 2));
        $this->info("  Total AP seeded: Rs " . number_format($totalAP, 2));

        return self::SUCCESS;
    }

    private function reverse(string $tenantId): int
    {
        $entries = DB::table('journal_entries')
            ->where('tenant_id', $tenantId)
            ->where('idempotency_key', 'LIKE', 'ob_migrate_%')
            ->pluck('id');

        if ($entries->isEmpty()) {
            $this->warn('No migration journal entries found to reverse.');
            return self::SUCCESS;
        }

        $this->warn("Deleting {$entries->count()} journal entries and their items...");

        DB::table('journal_items')->whereIn('journal_entry_id', $entries)->delete();
        DB::table('journal_entries')->whereIn('id', $entries)->delete();

        $this->info("Reversed. All ob_migrate journal entries have been deleted.");
        return self::SUCCESS;
    }
}
