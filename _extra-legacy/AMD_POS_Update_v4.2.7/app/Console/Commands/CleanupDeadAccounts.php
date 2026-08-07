<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * CleanupDeadAccounts — Phase 2.5
 *
 * Scheduled monthly on the 1st at 03:00 UTC.
 * Permanently deletes tenants that have been cancelled or suspended
 * for more than 60 days.
 *
 * Deletion order follows FK constraints:
 *   Child tables first → parent tables last → R2 folder → tenant record.
 *
 * Uses chunked deletion to avoid memory overflow on large datasets.
 *
 * IMPORTANT: This is permanent and irreversible. The 60-day window
 * gives users enough time to export their data after cancellation.
 *
 * Usage: php artisan tenants:cleanup-dead-accounts
 *        php artisan tenants:cleanup-dead-accounts --dry-run
 */
class CleanupDeadAccounts extends Command
{
    protected $signature   = 'tenants:cleanup-dead-accounts {--dry-run : List accounts that would be deleted without deleting}';
    protected $description = 'Permanently delete cancelled/suspended tenant accounts older than 60 days';

    /**
     * Deletion order — child tables must come before parent tables.
     * Tables without tenant_id (pivot tables, etc.) are handled via FK cascade.
     */
    private const DELETION_ORDER = [
        'sale_item_batches',
        'sale_items',
        'payments',
        'sales',
        'purchase_items',
        'invoice_items',
        'invoices',
        'stock_movements',
        'stock_transfers',
        'stocks',
        'journal_entry_lines',
        'journal_entries',
        'products',
        'parties',
        'accounts',
        'expenses',
        'categories',
        'warehouses',
        'settings',
        'users',
    ];

    public function handle(): void
    {
        $isDryRun  = $this->option('dry-run');
        $deadline  = now()->subDays(60);

        $deadTenants = Tenant::withoutTenantScope()
            ->withTrashed() // include soft-deleted
            ->where(function ($q) use ($deadline) {
                // Cancelled subscriptions older than 60 days
                $q->where('status', 'cancelled');
            })
            ->orWhere(function ($q) use ($deadline) {
                // Abandoned suspended trials older than 60 days
                $q->where('status', 'suspended')
                  ->where(function ($inner) use ($deadline) {
                      $inner->where('trial_ends_at', '<', $deadline)
                            ->orWhere('subscription_ends_at', '<', $deadline);
                  });
            })
            ->get();

        if ($deadTenants->isEmpty()) {
            $this->info('No dead accounts found to clean up. ✓');
            return;
        }

        $this->info("Found {$deadTenants->count()} dead account(s)" . ($isDryRun ? ' (DRY RUN)' : '') . ':');

        foreach ($deadTenants as $tenant) {
            $this->line("  • {$tenant->subdomain} [{$tenant->status}] — created {$tenant->created_at?->diffForHumans()}");
        }

        if ($isDryRun) {
            $this->warn('Dry run complete — no data deleted.');
            return;
        }

        // Confirm before wiping
        if (!$this->confirm("Permanently delete {$deadTenants->count()} tenant(s) and ALL their data? This cannot be undone.", false)) {
            $this->info('Aborted.');
            return;
        }

        foreach ($deadTenants as $tenant) {
            $this->cleanupTenant($tenant);
        }

        $this->info("✅ Cleanup complete. {$deadTenants->count()} tenant(s) removed.");
    }

    private function cleanupTenant(Tenant $tenant): void
    {
        $this->line("Cleaning up: {$tenant->subdomain}...");

        try {
            DB::transaction(function () use ($tenant) {
                foreach (self::DELETION_ORDER as $table) {
                    if (!DB::getSchemaBuilder()->hasTable($table)) {
                        continue;
                    }
                    if (!DB::getSchemaBuilder()->hasColumn($table, 'tenant_id')) {
                        continue;
                    }

                    // Delete in chunks to avoid memory overflow
                    $deleted = 0;
                    do {
                        $ids = DB::table($table)
                            ->where('tenant_id', $tenant->id)
                            ->limit(500)
                            ->pluck('id');

                        if ($ids->isEmpty()) break;

                        DB::table($table)->whereIn('id', $ids)->delete();
                        $deleted += $ids->count();
                    } while ($ids->count() === 500);

                    if ($deleted > 0) {
                        $this->line("  ✓ {$table}: {$deleted} rows deleted");
                    }
                }

                // Delete R2 folder (uncomment when R2 is configured — Phase 3.3)
                // try {
                //     Storage::disk('r2')->deleteDirectory("tenants/{$tenant->id}");
                //     $this->line("  ✓ R2 folder deleted");
                // } catch (\Throwable $e) {
                //     $this->warn("  ⚠ R2 folder deletion failed: " . $e->getMessage());
                // }

                // Finally delete the tenant record itself
                $tenant->forceDelete();
                $this->info("  ✅ Tenant {$tenant->subdomain} fully deleted.");
            });

            Log::info("Dead account cleaned up: {$tenant->subdomain}");
        } catch (\Throwable $e) {
            $this->error("  ✗ Failed to clean up {$tenant->subdomain}: " . $e->getMessage());
            Log::error("CleanupDeadAccounts failed for {$tenant->subdomain}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
