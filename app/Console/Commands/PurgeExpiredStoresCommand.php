<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredStoresCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:purge-expired-stores';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently purges stores that have been in View-Only mode for more than 30 days.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting expired stores cleanup sweep...');

        // 30 days ago limit
        $threshold = now()->subDays(30);

        // Find tenants in View-Only mode for > 30 days
        $expiredTenants = Tenant::whereNotNull('view_only_since')
            ->where('view_only_since', '<=', $threshold)
            ->get();

        if ($expiredTenants->isEmpty()) {
            $this->info('No expired stores found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$expiredTenants->count()} expired store(s) to purge.");

        foreach ($expiredTenants as $tenant) {
            $this->info("Purging store: {$tenant->name} (ID: {$tenant->id}, View-Only Since: {$tenant->view_only_since})");
            Log::info("Purging expired store: {$tenant->name} (ID: {$tenant->id})");

            try {
                DB::transaction(function () use ($tenant) {
                    // Clean up all related tables containing tenant_id to bypass constraint issues
                    $tables = [
                        'sales', 'purchase_orders', 'inventory_batches', 
                        'stocks', 'products', 'product_variants', 
                        'product_attributes', 'parties', 'transactions', 'bank_accounts', 
                        'settings', 'chat_sessions', 'chat_messages', 'support_tickets',
                        'tenant_users', 'store_licenses', 'webhooks'
                    ];

                    foreach ($tables as $table) {
                        if (Schema::hasTable($table)) {
                            DB::table($table)->where('tenant_id', $tenant->id)->delete();
                        }
                    }

                    // Delete R2 cloud files
                    try {
                        if (Storage::disk('r2')->exists("tenants/{$tenant->id}")) {
                            Storage::disk('r2')->deleteDirectory("tenants/{$tenant->id}");
                        }
                    } catch (\Throwable $storageError) {
                        $this->warn("Could not delete storage folder for tenant {$tenant->id}: " . $storageError->getMessage());
                    }

                    // Force delete the main record
                    $tenant->forceDelete();
                });

                $this->info("Successfully purged store ID: {$tenant->id}");
            } catch (\Throwable $e) {
                $this->error("Failed to purge store ID {$tenant->id}: " . $e->getMessage());
                Log::error("Failed to purge store ID {$tenant->id}: " . $e->getMessage());
            }
        }

        $this->info('Cleanup sweep completed.');
        return Command::SUCCESS;
    }
}
