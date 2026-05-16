<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class CleanExpiredDemoSessions extends Command
{
    protected $signature = 'demo:cleanup';
    protected $description = 'Deletes expired demo tenants and purges their data to free database storage.';

    public function handle()
    {
        $expiredTenants = Tenant::where('is_demo', true)
                                ->where('demo_expires_at', '<', now())
                                ->get();

        if ($expiredTenants->isEmpty()) {
            $this->info("No expired demo sessions to clean.");
            return;
        }

        foreach ($expiredTenants as $tenant) {
            $this->info("Cleaning up Demo Tenant: {$tenant->slug}");
            
            DB::beginTransaction();
            try {
                // Since this is a single DB model, we must delete rows. 
                // Relying on Eloquent Cascade is risky for performance. We can manually bulk delete rows if no DB cascades.
                
                $tablesToClean = [
                    'transactions', 'expenses', 'sale_items', 'sales', 'stocks', 'inventory_batches',
                    'product_barcodes', 'products', 'parties', 'bank_accounts', 'expense_categories',
                    'categories', 'warehouses', 'tenant_users'
                ];

                foreach($tablesToClean as $table) {
                     DB::table($table)->where('tenant_id', $tenant->id)->delete();
                }

                $tenant->forceDelete();
                DB::commit();
                $this->info("✓ Cleaned.");

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to clean {$tenant->slug}: " . $e->getMessage());
            }
        }
    }
}
