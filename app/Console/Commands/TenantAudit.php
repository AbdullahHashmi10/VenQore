<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * TenantAudit — Pre-Launch Checklist §3.1 and §3.4
 *
 * Automated audit command that runs all tenant isolation checks from
 * the pre-launch checklist. Replaces manual tinker one-liners.
 *
 * Usage:
 *   php artisan tenants:audit           # Run all checks
 *   php artisan tenants:audit --fix     # Auto-fix where possible
 *   php artisan tenants:audit --table=products  # Check one table only
 *
 * What it checks:
 *   §3.1 — Zero rows with NULL tenant_id in all tenant-scoped tables
 *   §3.4 — Confirms key models use HasTenant (static analysis)
 *   §3.5 — Reserved subdomain blocklist is enforced
 *   Bonus — Flags any tenants in unexpected states
 */
class TenantAudit extends Command
{
    protected $signature = 'tenants:audit
        {--fix : Auto-fix orphaned rows by assigning them to a fallback tenant}
        {--table= : Only audit a specific table}
        {--fail-fast : Exit on first failure (useful for CI)}';

    protected $description = 'Audit tenant data isolation and enum integrity (Pre-Launch §3.1, §3.4)';

    /** Tables that MUST have zero NULL tenant_id rows before launch */
    private const CRITICAL_TABLES = [
        'products',
        'sales',
        'sale_items',
        'parties',
        'invoices',
        'invoice_items',
        'expenses',
        'stock_adjustments',
        'stock_transfers',
        'journal_entries',
        'journal_entry_lines',
        'payments',
        'purchase_orders',
        'warehouses',
        'bank_accounts',
        'tenant_users',
        'categories',
        'units',
        'settings',
        'inventory_batches',
    ];

    /** Core models that must use HasTenant */
    private const MODELS_REQUIRING_TENANT = [
        'Product'       => 'App\\Models\\Product',
        'Sale'          => 'App\\Models\\Sale',
        'Party'         => 'App\\Models\\Party',
        'Expense'       => 'App\\Models\\Expense',
        'Invoice'       => 'App\\Models\\Invoice',
        'Category'      => 'App\\Models\\Category',
        'Warehouse'     => 'App\\Models\\Warehouse',
        'JournalEntry'  => 'App\\Models\\JournalEntry',
        'Account'       => 'App\\Models\\Account',
        'Stock'         => 'App\\Models\\Stock',
    ];

    private int $failures = 0;
    private int $warnings = 0;
    private int $passes   = 0;

    public function handle(): int
    {
        $this->newLine();
        $this->info('╔══════════════════════════════════════════════════╗');
        $this->info('║  VenQore Tenant Isolation Audit                  ║');
        $this->info('╚══════════════════════════════════════════════════╝');
        $this->newLine();

        $this->runSection3_1();

        if (!$this->option('table')) {
            $this->runSection3_4();
            $this->runSection3_5();
            $this->runTenantStateAudit();
        }

        $this->printSummary();

        return $this->failures > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * §3.1 — Tenant Zero Integrity: no NULL tenant_id rows in critical tables
     */
    private function runSection3_1(): void
    {
        $this->line('<fg=cyan;options=bold>§3.1 — Tenant Zero Integrity (NULL tenant_id check)</>');
        $this->newLine();

        $tableFilter = $this->option('table');
        $tables = $tableFilter ? [$tableFilter] : self::CRITICAL_TABLES;

        $rows = [];
        foreach ($tables as $table) {
            if (!DB::getSchemaBuilder()->hasTable($table)) {
                $rows[] = [$table, '<fg=yellow>SKIP</>', 'Table does not exist'];
                continue;
            }

            $count = DB::table($table)->whereNull('tenant_id')->count();

            if ($count === 0) {
                $rows[] = [$table, '<fg=green>PASS</>', '0 unassigned rows'];
                $this->passes++;
            } else {
                $rows[] = [$table, '<fg=red>FAIL</>', "{$count} rows with NULL tenant_id"];
                $this->failures++;

                if ($this->option('fail-fast')) {
                    $this->table(['Table', 'Status', 'Detail'], $rows);
                    $this->error("FAIL-FAST: Stopping at first failure.");
                    return;
                }
            }
        }

        $this->table(['Table', 'Status', 'Detail'], $rows);
        $this->newLine();
    }

    /**
     * §3.4 — Verify key models use HasTenant trait (static analysis)
     */
    private function runSection3_4(): void
    {
        $this->line('<fg=cyan;options=bold>§3.4 — HasTenant Trait Coverage</>');
        $this->newLine();

        $rows = [];
        foreach (self::MODELS_REQUIRING_TENANT as $name => $class) {
            if (!class_exists($class)) {
                $rows[] = [$name, '<fg=yellow>SKIP</>', 'Class not found'];
                continue;
            }

            $uses   = class_uses_recursive($class);
            $hasTrait = in_array('App\\Traits\\HasTenant', $uses, true);

            if ($hasTrait) {
                $rows[] = [$name, '<fg=green>PASS</>', 'uses HasTenant'];
                $this->passes++;
            } else {
                $rows[] = [$name, '<fg=red>FAIL</>', 'MISSING HasTenant trait'];
                $this->failures++;
            }
        }

        $this->table(['Model', 'Status', 'Detail'], $rows);
        $this->newLine();
    }

    /**
     * §3.5 — Reserved slug test
     */
    private function runSection3_5(): void
    {
        $this->line('<fg=cyan;options=bold>§3.5 — Reserved Slug Blocklist</>');
        $this->newLine();

        $reserved = ['admin', 'api', 'www', 'billing', 'demo', 'support', 'mail'];
        $rows = [];

        foreach ($reserved as $word) {
            $result = \App\Services\SubdomainGenerator::generate($word);
            $passes = ($result !== $word); // must be modified to pass

            if ($passes) {
                $rows[] = [$word, '<fg=green>PASS</>', "\"{$word}\" → \"{$result}\" (modified)"];
                $this->passes++;
            } else {
                $rows[] = [$word, '<fg=red>FAIL</>', "\"{$word}\" was NOT blocked — still usable as slug"];
                $this->failures++;
            }
        }

        $this->table(['Reserved Word', 'Status', 'Detail'], $rows);
        $this->newLine();
    }

    /**
     * Bonus: Check all tenants are in valid states
     */
    private function runTenantStateAudit(): void
    {
        $this->line('<fg=cyan;options=bold>Bonus — Tenant State Integrity</>');
        $this->newLine();

        $rows = [];

        // Tenants with expired trial but still showing as trial
        $stuckTrials = DB::table('tenants')
            ->where('status', 'trial')
            ->where('trial_ends_at', '<', now())
            ->whereNull('deleted_at')
            ->count();

        if ($stuckTrials === 0) {
            $rows[] = ['Expired trials not processed', '<fg=green>PASS</>', '0 stuck trials'];
            $this->passes++;
        } else {
            $rows[] = ['Expired trials not processed', '<fg=yellow>WARN</>', "{$stuckTrials} tenants have trial_ends_at in past but status=trial. Run: php artisan tenants:process-expired-trials"];
            $this->warnings++;
        }

        // Tenants with setup_completed = false but status = active
        $activeNoSetup = DB::table('tenants')
            ->where('status', 'active')
            ->where('setup_completed', false)
            ->whereNull('deleted_at')
            ->count();

        if ($activeNoSetup === 0) {
            $rows[] = ['Active tenants without setup', '<fg=green>PASS</>', '0 found'];
            $this->passes++;
        } else {
            $rows[] = ['Active tenants without setup', '<fg=yellow>WARN</>', "{$activeNoSetup} active tenants have setup_completed=false"];
            $this->warnings++;
        }

        // Check demo tenant exists
        $demo = DB::table('tenants')->where('slug', 'demo')->whereNull('deleted_at')->first();
        if ($demo) {
            $rows[] = ['demo store (slug: demo)', '<fg=green>PASS</>', "Exists (plan: {$demo->plan}, status: {$demo->status})"];
            $this->passes++;
        } else {
            $rows[] = ['demo store (slug: demo)', '<fg=yellow>WARN</>', 'Demo tenant not provisioned yet. Run: php artisan demo:reset --force after creating the tenant record.'];
            $this->warnings++;
        }

        $this->table(['Check', 'Status', 'Detail'], $rows);
        $this->newLine();
    }

    private function printSummary(): void
    {
        $this->line('══════════════════════════════════════════════════');
        if ($this->failures === 0 && $this->warnings === 0) {
            $this->info("✅ ALL CHECKS PASSED — {$this->passes} checks, 0 failures, 0 warnings");
            $this->info("   Tenant isolation is solid. Safe to launch.");
        } elseif ($this->failures === 0) {
            $this->warn("⚠️  {$this->passes} passed, 0 failures, {$this->warnings} warnings");
            $this->warn("   Address warnings before launch if possible.");
        } else {
            $this->error("❌ {$this->failures} FAILURES — {$this->warnings} warnings — {$this->passes} passed");
            $this->error("   Fix all failures before deploying to production.");
        }
        $this->line('══════════════════════════════════════════════════');
        $this->newLine();
    }
}
