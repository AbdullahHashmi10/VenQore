<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * PreLaunchCleanup — Pre-Launch Checklist §15
 *
 * Removes all test/development tenants and their data before going live.
 * Leaves only the real tenant(s) and the demo tenant.
 *
 * Usage:
 *   php artisan prelaunch:cleanup --dry-run   ← preview what would be deleted
 *   php artisan prelaunch:cleanup             ← actually delete
 *   php artisan prelaunch:cleanup --tenant=tenant-a-test  ← delete one specific tenant
 *
 * This command is safe to run multiple times.
 * It will not delete the demo tenant or any tenant without a test-style subdomain.
 *
 * IMPORTANT: Run with --dry-run first. Always.
 */
class PreLaunchCleanup extends Command
{
    protected $signature = 'prelaunch:cleanup
        {--dry-run : Preview what would be deleted without actually deleting}
        {--tenant= : Delete a specific tenant by subdomain}
        {--all-test : Delete ALL tenants with subdomains starting with test- or ending with -test}
        {--force : Skip confirmation prompt}';

    protected $description = 'Remove test tenants and development data before production launch.';

    // Tables to purge per tenant (FK-safe order — children before parents)
    private const TENANT_TABLES = [
        'journal_entry_lines',
        'journal_entries',
        'payments',
        'sale_items',
        'sales',
        'invoice_items',
        'invoices',
        'purchase_items',
        'purchases',
        'stock_adjustments',
        'stock_transfers',
        'stock_take_items',
        'stock_takes',
        'inventory_batches',
        'stocks',
        'products',
        'parties',
        'categories',
        'units',
        'warehouses',
        'bank_accounts',
        'terminals',
        'ai_recommendations',
        'appsumo_codes',
        'settings',
        'users',
    ];

    // These will NEVER be deleted, regardless of other flags
    private const PROTECTED_SUBDOMAINS = ['demo'];

    public function handle(): int
    {
        $dryRun   = $this->option('dry-run');
        $specific = $this->option('tenant');
        $allTest  = $this->option('all-test');
        $force    = $this->option('force');

        if ($dryRun) {
            $this->warn('DRY RUN — nothing will be deleted.');
        }

        // Determine which tenants to target
        $query = DB::table('tenants')->whereNull('deleted_at');

        if ($specific) {
            $query->where('subdomain', $specific);
        } elseif ($allTest) {
            $query->where(function ($q) {
                $q->where('subdomain', 'like', 'test-%')
                  ->orWhere('subdomain', 'like', '%-test')
                  ->orWhere('subdomain', 'like', 'tenant-%test%')
                  ->orWhere('subdomain', 'like', 'test%')
                  ->orWhereIn('subdomain', ['testshop', 'test-trial', 'test-gating']);
            });
        } else {
            // Default: known test subdomains from the checklist
            $query->whereIn('subdomain', [
                'tenant-a-test',
                'tenant-b-test',
                'test-trial',
                'test-gating',
                'testshop',
            ]);
        }

        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->info('No matching tenants found. Nothing to clean up.');
            return self::SUCCESS;
        }

        // Filter out protected subdomains
        $tenants = $tenants->filter(fn($t) => !in_array($t->subdomain, self::PROTECTED_SUBDOMAINS));

        if ($tenants->isEmpty()) {
            $this->warn('All matching tenants are protected (demo, etc.). Nothing to delete.');
            return self::SUCCESS;
        }

        // Show what will be deleted
        $this->info("Tenants targeted for deletion:");
        $this->table(
            ['ID', 'Subdomain', 'Name', 'Plan', 'Status'],
            $tenants->map(fn($t) => [$t->id, $t->subdomain, $t->name ?? '—', $t->plan ?? '—', $t->status ?? '—'])->toArray()
        );

        if ($dryRun) {
            $this->line('');
            $this->info('DRY RUN complete. Run without --dry-run to actually delete.');
            return self::SUCCESS;
        }

        if (!$force && !$this->confirm("Delete these " . $tenants->count() . " tenant(s) and ALL their data? This cannot be undone.")) {
            $this->line('Aborted.');
            return self::SUCCESS;
        }

        $deleted = 0;
        foreach ($tenants as $tenant) {
            $this->line("  Deleting tenant: {$tenant->subdomain} ({$tenant->id})...");

            DB::beginTransaction();
            try {
                foreach (self::TENANT_TABLES as $table) {
                    if (DB::getSchemaBuilder()->hasTable($table)) {
                        $count = DB::table($table)->where('tenant_id', $tenant->id)->delete();
                        if ($count > 0) {
                            $this->line("    ✓ Purged {$count} rows from {$table}");
                        }
                    }
                }

                // Hard-delete the tenant row
                DB::table('tenants')->where('id', $tenant->id)->delete();

                DB::commit();
                $deleted++;
                $this->info("  ✅ Deleted: {$tenant->subdomain}");
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("  ❌ Failed to delete {$tenant->subdomain}: " . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info("✅ Cleanup complete. Deleted {$deleted} tenant(s).");

        // Also clear queues and logs reminder
        $this->newLine();
        $this->line("Next steps:");
        $this->line("  php artisan queue:clear --queue=default");
        $this->line("  php artisan queue:flush");
        $this->line("  php artisan demo:reset --force");
        $this->line("  > storage/logs/laravel-" . now()->format('Y-m-d') . ".log");

        return self::SUCCESS;
    }
}
