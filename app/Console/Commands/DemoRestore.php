<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use App\Models\Tenant;

class DemoRestore extends Command
{
    protected $signature = 'demo:restore {--force : Skip confirmation}';
    protected $description = 'Restores the demo tenant to its Golden Master state from JSON snapshot';

    private const TABLES = [
        'journal_entries',
        'payments',
        'invoice_items',
        'invoices',
        'inventory_batches',
        'stock_adjustments',
        'stock_transfers',
        'stock_take_items',
        'stock_takes',
        'party_transactions',
        'parties',
        'customers',
        'suppliers',
        'products',
        'categories',
        'warehouses',
        'tenant_users',
        'settings',
    ];

    public function handle()
    {
        $this->info("Restoring Demo Store to Golden Master state...");

        $path = storage_path('demo-snapshots/golden_master.json');

        if (!file_exists($path)) {
            $this->warn("Golden Master snapshot not found at {$path}. Falling back to full deploy...");
            Artisan::call('demo:full-deploy');
            $this->info("Full deploy fallback complete.");
            return 0;
        }

        $snapshot = json_decode(file_get_contents($path), true);
        if (!$snapshot || empty($snapshot['tenant'])) {
            $this->error("Invalid golden master snapshot format!");
            return 1;
        }

        $tenantData = $snapshot['tenant'];

        // Find or recreate demo tenant
        $demoTenant = Tenant::where('is_demo', true)->first();
        if (!$demoTenant) {
            $demoTenant = Tenant::create($tenantData);
        } else {
            // Protect Golden Master from deletion/modification
            $demoTenant->update([
                'is_demo' => true,
                'is_golden_master' => true,
                'subdomain' => $tenantData['subdomain'] ?? 'demo',
            ]);
        }

        // Wipe existing data for this tenant
        DB::transaction(function () use ($snapshot, $demoTenant) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach (self::TABLES as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->where('tenant_id', $demoTenant->id)->delete();
                }
            }

            // Restore from snapshot
            // Note: tables in snapshot data are stored by key. Insert in reverse table order to avoid FK errors.
            $insertOrder = array_reverse(self::TABLES);
            foreach ($insertOrder as $table) {
                if (empty($snapshot['data'][$table]) || !Schema::hasTable($table)) {
                    continue;
                }
                foreach ($snapshot['data'][$table] as $row) {
                    // Update tenant_id just in case the ID changed
                    $row['tenant_id'] = $demoTenant->id;
                    DB::table($table)->insert($row);
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        });

        $this->info("Demo store Golden Master restore successful!");
        return 0;
    }
}
