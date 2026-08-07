<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * ResetDemoTenant — Phase 6.2
 *
 * Wipes all runtime data for the demo.venqore.com tenant and re-seeds
 * it with realistic sample data so every visitor gets a clean experience.
 *
 * Schedule: daily at 04:00 (add to routes/console.php):
 *   $schedule->command('demo:reset')->dailyAt('04:00');
 *
 * Manual run: php artisan demo:reset
 *
 * The demo tenant must exist with subdomain = 'demo'.
 * If it doesn't exist, this command is a no-op (exits cleanly).
 *
 * Demo credentials (shown publicly on venqore.com landing page):
 *   Email:    demo@venqore.com
 *   Password: demo1234
 */
class ResetDemoTenant extends Command
{
    protected $signature   = 'demo:reset-legacy {--force : Skip confirmation prompt}';
    protected $description = 'Reset the demo.venqore.com tenant to a clean state with sample data.';

    // Tables to purge for the demo tenant (ordered to avoid FK violations)
    // Note: we use whereRaw to avoid the HasTenant global scope (which requires current.tenant binding)
    private const TABLES_TO_PURGE = [
        'journal_entries',
        'payments',
        'invoice_items',
        'invoices',
        'inventory_batches',
        'stock_adjustments',
        'stock_transfers',
        'stock_take_items',
        'stock_takes',
        'ai_recommendations',
        'party_transactions',
        'parties',
        'products',
        'categories',
        'units',
        'warehouses',
        'bank_accounts',
        'terminals',
        'users',
    ];

    public function handle(): int
    {
        // Find the demo tenant
        $demo = Tenant::where('slug', 'demo')
            ->first();

        if (!$demo) {
            $this->warn('No demo tenant found (subdomain = "demo"). Skipping reset.');
            return self::SUCCESS;
        }

        if (!$this->option('force') && !$this->confirm("This will WIPE all data for tenant [{$demo->name}] (ID: {$demo->id}). Continue?")) {
            $this->line('Aborted.');
            return self::SUCCESS;
        }

        $tenantId = $demo->id;
        $this->info("Resetting demo tenant (ID: {$tenantId})...");

        DB::beginTransaction();
        try {
            // ── 1. Purge all data ──────────────────────────────────────
            foreach (self::TABLES_TO_PURGE as $table) {
                if (DB::getSchemaBuilder()->hasTable($table)) {
                    DB::table($table)->where('tenant_id', $tenantId)->delete();
                    $this->line("  ✓ Purged: {$table}");
                }
            }

            // ── 2. Reset tenant state ──────────────────────────────────
            $demo->update([
                'setup_completed' => true,
                'status'          => 'active',
                'plan'            => 'growth', // Demo shows Growth features
            ]);

            // ── 3. Seed demo admin user ────────────────────────────────
            $adminId = DB::table('users')->insertGetId([
                'name'       => 'Demo User',
                'email'      => 'demo@venqore.com',
                'password'   => Hash::make('demo1234'),
                'role'       => 'platform_admin',
                'tenant_id'  => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->line("  ✓ Demo user created (demo@venqore.com / demo1234)");

            // ── 4. Seed categories ─────────────────────────────────────
            $catFashion = DB::table('categories')->insertGetId([
                'name' => 'Fashion & Apparel', 'code' => 'FAP', 'tenant_id' => $tenantId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $catElec = DB::table('categories')->insertGetId([
                'name' => 'Electronics', 'code' => 'ELC', 'tenant_id' => $tenantId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $catFood = DB::table('categories')->insertGetId([
                'name' => 'Food & Beverage', 'code' => 'FBV', 'tenant_id' => $tenantId,
                'created_at' => now(), 'updated_at' => now(),
            ]);

            // ── 5. Seed unit ───────────────────────────────────────────
            $unitPcs = DB::table('units')->insertGetId([
                'name' => 'Pieces', 'short_name' => 'pcs', 'operator' => '*', 'operator_value' => 1,
                'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // ── 6. Seed main warehouse ─────────────────────────────────
            $warehouseId = DB::table('warehouses')->insertGetId([
                'name' => 'Main Store', 'location' => 'Ground Floor', 'is_default' => true,
                'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // ── 7. Seed bank accounts ──────────────────────────────────
            $cashId = DB::table('bank_accounts')->insertGetId([
                'name' => 'Cash Drawer', 'account_type' => 'cash', 'balance' => 50000,
                'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now(),
            ]);

            // ── 8. Seed demo products (realistic pricing) ──────────────
            $products = [
                ['name' => 'Premium T-Shirt (Blue)',      'sku' => 'TSH-001', 'price' => 1200, 'cost' => 600,  'qty' => 85,  'category_id' => $catFashion],
                ['name' => 'Slim Fit Jeans (Black)',       'sku' => 'JNS-002', 'price' => 3500, 'cost' => 1800, 'qty' => 42,  'category_id' => $catFashion],
                ['name' => 'Running Shoes (Nike Replica)', 'sku' => 'SHO-003', 'price' => 2800, 'cost' => 1400, 'qty' => 30,  'category_id' => $catFashion],
                ['name' => 'USB-C Fast Charger 65W',       'sku' => 'CHG-004', 'price' => 1800, 'cost' => 900,  'qty' => 120, 'category_id' => $catElec],
                ['name' => 'Wireless Earbuds Pro',         'sku' => 'EAR-005', 'price' => 4500, 'cost' => 2000, 'qty' => 25,  'category_id' => $catElec],
                ['name' => 'Phone Case (Universal)',       'sku' => 'CAS-006', 'price' => 350,  'cost' => 120,  'qty' => 200, 'category_id' => $catElec],
                ['name' => 'Green Tea (50 bags)',          'sku' => 'TEA-007', 'price' => 480,  'cost' => 200,  'qty' => 60,  'category_id' => $catFood],
                ['name' => 'Protein Bar Box (12 pcs)',     'sku' => 'PRT-008', 'price' => 1200, 'cost' => 700,  'qty' => 40,  'category_id' => $catFood],
            ];

            foreach ($products as $p) {
                $productId = DB::table('products')->insertGetId([
                    'name'        => $p['name'],
                    'sku'         => $p['sku'],
                    'price'       => $p['price'],
                    'cost'        => $p['cost'],
                    'stock'       => $p['qty'],
                    'category_id' => $p['category_id'],
                    'unit_id'     => $unitPcs,
                    'is_active'   => true,
                    'tenant_id'   => $tenantId,
                    'created_at'  => now()->subDays(rand(5, 90)),
                    'updated_at'  => now(),
                ]);

                // Seed FIFO batch for each product
                DB::table('inventory_batches')->insert([
                    'product_id'    => $productId,
                    'warehouse_id'  => $warehouseId,
                    'quantity'      => $p['qty'],
                    'remaining_qty' => $p['qty'],
                    'unit_cost'     => $p['cost'],
                    'tenant_id'     => $tenantId,
                    'notes'         => 'Demo seed batch',
                    'created_at'    => now()->subDays(30),
                    'updated_at'    => now(),
                ]);
            }
            $this->line("  ✓ " . count($products) . " demo products seeded");

            // ── 9. Seed 5 parties (customers) ─────────────────────────
            $partyNames = ['Ahmed Retail Store', 'Sara Fashion Hub', 'Khan Electronics', 'City Mart', 'Blue Sky Trading'];
            foreach ($partyNames as $name) {
                DB::table('parties')->insert([
                    'name'       => $name,
                    'type'       => 'customer',
                    'phone'      => '03' . rand(0, 3) . rand(1000000, 9999999),
                    'balance'    => rand(-5000, 25000),
                    'tenant_id'  => $tenantId,
                    'created_at' => now()->subDays(rand(10, 120)),
                    'updated_at' => now(),
                ]);
            }
            $this->line("  ✓ 5 demo customers seeded");

            DB::commit();

            $this->newLine();
            $this->info("✅ Demo tenant reset complete.");
            $this->line("   URL: https://demo.venqore.com");
            $this->line("   Login: demo@venqore.com / demo1234");

            Log::info('Demo tenant reset completed', ['tenant_id' => $tenantId, 'at' => now()]);

            return self::SUCCESS;

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Reset failed: " . $e->getMessage());
            Log::error('Demo tenant reset failed', ['error' => $e->getMessage()]);
            return self::FAILURE;
        }
    }
}
