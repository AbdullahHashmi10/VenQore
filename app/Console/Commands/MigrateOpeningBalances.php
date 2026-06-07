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
                            {--dry-run : Print what would be inserted without touching the DB}
                            {--reverse : Delete all journal entries created by this command}';

    protected $description = 'Seed party opening balances from the parties table into the V3 journal ledger';

    public function handle(): int
    {
        if ($this->option('reverse')) {
            return $this->reverse();
        }

        $dryRun = $this->option('dry-run');

        // Check if we are running in a specific tenant context (e.g. from web request)
        if (app()->bound('current.tenant')) {
            $tenants = collect([app('current.tenant')]);
        } else {
            // Load all tenants
            $tenants = \App\Models\Tenant::all();
        }

        if ($tenants->isEmpty()) {
            $this->warn('No tenants found.');
            return self::SUCCESS;
        }

        $totalInserted = 0;
        $totalSkipped = 0;
        $globalAR = 0;
        $globalAP = 0;

        foreach ($tenants as $tenant) {
            $this->info("Processing Tenant: {$tenant->name} (ID: {$tenant->id}, Slug: {$tenant->slug})");

            // Load accounts for this tenant
            $arAccount = DB::table('accounts')->where('tenant_id', $tenant->id)->where('code', '1200')->first();
            $apAccount = DB::table('accounts')->where('tenant_id', $tenant->id)->where('code', '2000')->first();
            $obEquity  = DB::table('accounts')->where('tenant_id', $tenant->id)->where('code', '7000')->first();

            if ($arAccount && $apAccount && !$obEquity) {
                $obEquityId = (string) Str::orderedUuid();
                DB::table('accounts')->insert([
                    'id' => $obEquityId,
                    'tenant_id' => $tenant->id,
                    'code' => '7000',
                    'name' => 'Historical Balances',
                    'type' => 'equity',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $obEquity = DB::table('accounts')->where('id', $obEquityId)->first();
            }

            if (!$arAccount || !$apAccount || !$obEquity) {
                $this->warn("  Missing required accounts (1200, 2000, 7000) for tenant {$tenant->name}. Skipping.");
                continue;
            }

            // Load all parties for this tenant with a non-zero opening balance
            $parties = DB::table('parties')
                ->where('tenant_id', $tenant->id)
                ->where(function($q) {
                    $q->where('opening_balance', '!=', 0)
                      ->orWhere('current_balance', '!=', 0);
                })
                ->get(['id', 'name', 'type', 'opening_balance', 'opening_balance_type', 'current_balance']);

            if ($parties->isEmpty()) {
                $this->line("  No parties with non-zero balance found.");
                continue;
            }

            $this->info("  Found {$parties->count()} parties with non-zero balance.");

            $migrationDate = '2000-01-01';
            // Find admin or first user for this tenant
            $adminUserId = DB::table('tenant_users')
                ->where('tenant_id', $tenant->id)
                ->where('role', 'owner')
                ->value('user_id') ?: DB::table('users')->orderBy('created_at')->value('id');

            foreach ($parties as $party) {
                $balance = (float) $party->current_balance;
                if ($balance == 0) {
                    $totalSkipped++;
                    continue;
                }

                $typeColumn = $party->opening_balance_type ?? null;
                $isReceivable = false;

                if ($typeColumn === 'receivable') {
                    $isReceivable = true;
                } elseif ($typeColumn === 'payable') {
                    $isReceivable = false;
                } else {
                    if ($party->type === 'customer') {
                        $isReceivable = ($balance > 0);
                    } else {
                        $isReceivable = ($balance < 0);
                    }
                }

                $absBalance = abs($balance);
                if ($isReceivable) {
                    $drAccountId = $arAccount->id;
                    $crAccountId = $obEquity->id;
                    $globalAR    += $absBalance;
                    $desc        = "Opening Balance — " . ($party->type === 'customer' ? 'Customer' : 'Supplier') . " receivable: {$party->name}";
                } else {
                    $drAccountId = $obEquity->id;
                    $crAccountId = $apAccount->id;
                    $globalAP    += $absBalance;
                    $desc        = "Opening Balance — " . ($party->type === 'customer' ? 'Customer' : 'Supplier') . " payable: {$party->name}";
                }

                $idempKey = 'ob_migrate_' . $party->id;

                $exists = DB::table('journal_entries')
                    ->where('idempotency_key', $idempKey)
                    ->exists();

                if ($exists) {
                    $totalSkipped++;
                    continue;
                }

                if (!$dryRun) {
                    $jeId = (string) Str::orderedUuid();
                    $now  = now()->toDateTimeString();

                    $entry = [
                        'id'               => $jeId,
                        'tenant_id'        => $tenant->id,
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

                    $affected = DB::table('journal_entries')->insertOrIgnore($entry);

                    if ($affected > 0) {
                        DB::table('journal_items')->insert([
                            [
                                'id'               => (string) Str::orderedUuid(),
                                'tenant_id'        => $tenant->id,
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
                                'tenant_id'        => $tenant->id,
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

                $totalInserted++;
            }
        }

        $this->newLine();
        $this->info($dryRun
            ? "DRY RUN complete. Would insert {$totalInserted} journal entries, skip {$totalSkipped}."
            : "Migration complete. Inserted {$totalInserted} journal entries, skipped {$totalSkipped}."
        );
        $this->info("  Total AR seeded globally: Rs " . number_format($globalAR, 2));
        $this->info("  Total AP seeded globally: Rs " . number_format($globalAP, 2));

        return self::SUCCESS;
    }

    private function reverse(): int
    {
        $entries = DB::table('journal_entries')
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
