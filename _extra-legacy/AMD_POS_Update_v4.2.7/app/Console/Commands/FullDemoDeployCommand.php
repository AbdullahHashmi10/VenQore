<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;
use App\Models\Tenant;

class FullDemoDeployCommand extends Command
{
    protected $signature   = 'demo:full-deploy 
                            {--only= : Comma-separated list of modules to seed (e.g. warehouse, bank_accounts, categories, products, customers, suppliers, expenses, sales, purchases, proposals, cookbook, staff)}
                            {--except= : Comma-separated list of modules to skip}
                            {--interactive : Interactive selection of modules}';
    protected $description = 'Full nuclear demo store deploy: wipe + seed 5-year data across all modules with options.';

    public function handle(): int
    {
        $this->info('🚀 Starting Demo Deploy...');

        // ── 1. Find / create demo tenant ─────────────────────────────────
        $demo = Tenant::where('is_demo', true)->first();

        if (!$demo) {
            $this->warn('No demo tenant found — creating one...');
            $demo = Tenant::create([
                'name'             => 'VenQore Demo Store',
                'slug'             => 'demo',
                'plan'             => 'business',
                'status'           => 'active',
                'currency_symbol'  => '$',
                'currency_code'    => 'USD',
                'setup_completed'  => true,
                'is_demo'          => true,
            ]);
        }

        app()->instance('current.tenant', $demo);
        $tenantId = $demo->id;

        // Ensure default Chart of Accounts and settings exist
        if (!DB::table('accounts')->where('tenant_id', $tenantId)->exists()) {
            $this->info('🌱 Seeding tenant default Chart of Accounts and settings...');
            \Database\Seeders\TenantDefaultSeeder::seedFor($demo);
        }

        // ── 1.5 Parse Seeder modules ─────────────────────────────────────
        $seeders = [
            'warehouse'       => [\Database\Seeders\Demo\DemoWarehouseSeeder::class, 'Warehouse'],
            'bank_accounts'   => [\Database\Seeders\Demo\DemoBankAccountSeeder::class, 'Bank Accounts'],
            'categories'      => [\Database\Seeders\Demo\DemoCategorySeeder::class, 'Categories'],
            'products'        => [\Database\Seeders\Demo\DemoProductSeeder::class, 'Products'],
            'customers'       => [\Database\Seeders\Demo\DemoCustomerSeeder::class, 'Customers'],
            'suppliers'       => [\Database\Seeders\Demo\DemoSupplierSeeder::class, 'Suppliers'],
            'expenses'        => [\Database\Seeders\Demo\DemoExpenseSeeder::class, 'Expenses (5-year)'],
            'sales'           => [\Database\Seeders\Demo\DemoSalesSeeder::class, 'Sales (5-year)'],
            'purchases'       => [\Database\Seeders\Demo\DemoPurchaseSeeder::class, 'Purchases'],
            'proposals'       => [\Database\Seeders\Demo\DemoProposalSeeder::class, 'Proposals'],
            'cookbook'        => [\Database\Seeders\Demo\DemoCookbookSeeder::class, 'Cookbook Recipes'],
            'staff'           => [\Database\Seeders\Demo\DemoStaffSeeder::class, 'Staff & Attendance'],
        ];

        $chosenModules = null;

        if ($this->option('interactive')) {
            $selected = $this->choice(
                'Which modules would you like to seed? (Select multiple, comma-separated)',
                array_merge(['all'], array_keys($seeders)),
                0,
                null,
                true
            );
            if (in_array('all', $selected)) {
                $chosenModules = array_keys($seeders);
            } else {
                $chosenModules = $selected;
            }
        }

        if (!$chosenModules && $this->option('only')) {
            $only = $this->option('only');
            $chosenModules = array_map('trim', array_filter(explode(',', $only)));
        }

        if (!$chosenModules) {
            $chosenModules = array_keys($seeders);
        }

        if ($this->option('except')) {
            $except = $this->option('except');
            $excluded = array_map('trim', array_filter(explode(',', $except)));
            $chosenModules = array_diff($chosenModules, $excluded);
        }

        // Validate modules
        foreach ($chosenModules as $module) {
            if (!array_key_exists($module, $seeders)) {
                $this->error("Invalid module: '$module'. Available modules: " . implode(', ', array_keys($seeders)));
                return 1;
            }
        }

        $tableMapping = [
            'warehouse'     => ['warehouses'],
            'bank_accounts' => ['bank_accounts', 'bank_transactions'],
            'categories'    => ['categories'],
            'products'      => ['products', 'product_barcodes', 'product_uom_conversions', 'stocks', 'inventory_batches'],
            'customers'     => ['parties'],
            'suppliers'     => ['parties'],
            'expenses'      => ['expenses', 'expense_categories'],
            'sales'         => ['sales', 'sale_items', 'sale_payments'],
            'purchases'     => ['purchases', 'purchase_items', 'purchase_payments'],
            'proposals'     => ['proposals', 'proposal_items'],
            'cookbook'      => ['recipes', 'recipe_products'],
            'staff'         => ['staff_attendances'],
        ];

        // ── 2. Wipe existing demo data for selected modules ───────────────
        $this->info('🧹 Wiping existing demo data for selected modules...');
        if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection) {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        $isFullWipe = (count($chosenModules) === count($seeders));

        if ($isFullWipe) {
            $allTables = [
                'sales', 'sale_items', 'sale_payments',
                'purchases', 'purchase_items', 'purchase_payments',
                'expenses', 'expense_categories',
                'proposals', 'proposal_items',
                'bank_accounts', 'bank_transactions',
                'products', 'product_barcodes', 'product_uom_conversions',
                'categories', 'stocks', 'inventory_batches',
                'parties',
                'warehouses',
                'journal_entries', 'journal_items',
                'payments',
                'recipe_products', 'recipes',
                'staff_attendances',
            ];
            foreach ($allTables as $table) {
                try {
                    if (Schema::hasColumn($table, 'tenant_id')) {
                        DB::table($table)->where('tenant_id', $tenantId)->delete();
                    }
                } catch (\Exception $e) {
                    $this->warn("  Skipped wiping $table: " . $e->getMessage());
                }
            }
        } else {
            foreach ($chosenModules as $module) {
                if ($module === 'customers') {
                    DB::table('parties')->where('tenant_id', $tenantId)->where('type', 'customer')->delete();
                    $this->info("  Wiped: Customers (type='customer')");
                    continue;
                }
                if ($module === 'suppliers') {
                    DB::table('parties')->where('tenant_id', $tenantId)->where('type', 'supplier')->delete();
                    $this->info("  Wiped: Suppliers (type='supplier')");
                    continue;
                }
                if (isset($tableMapping[$module])) {
                    foreach ($tableMapping[$module] as $table) {
                        try {
                            if (Schema::hasColumn($table, 'tenant_id')) {
                                DB::table($table)->where('tenant_id', $tenantId)->delete();
                            } else {
                                DB::table($table)->delete();
                            }
                            $this->info("  Wiped table: $table");
                        } catch (\Exception $e) {
                            $this->warn("  Skipped wiping $table: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection) {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
        $this->info('  ✅ Wipe completed.');

        // ── 3. Run selected seeders in order ──────────────────────────────
        $totalModules = count($chosenModules);
        $currentIndex = 0;

        foreach ($chosenModules as $moduleKey) {
            $currentIndex++;
            $seederClass = $seeders[$moduleKey][0];
            $label       = $seeders[$moduleKey][1];
            $modulesLeft = $totalModules - $currentIndex;

            $this->info("\n📦 [{$currentIndex}/{$totalModules}] Seeding: {$label}... ({$modulesLeft} modules left)");
            try {
                $seeder = app($seederClass);
                $seeder->setCommand($this);
                $seeder->run($tenantId);
                $this->info("  ✅ Seeding {$label} completed successfully.");
            } catch (\Exception $e) {
                $this->warn("  ⚠️ {$label} failed: " . $e->getMessage());
            }
        }

        // ── 4. Force realistic stock levels ──────────────────────────────
        $this->info('⚠️  Setting low-stock / out-of-stock products...');
        $products = \App\Models\Product::where('tenant_id', $tenantId)->take(10)->get();
        if ($products->count() >= 5) {
            \App\Models\Stock::where('product_id', $products[0]->id)->update(['quantity' => 0]);
            \App\Models\Stock::where('product_id', $products[1]->id)->update(['quantity' => 0]);
            \App\Models\Stock::where('product_id', $products[2]->id)->update(['quantity' => 2]);
            $products[2]->update(['alert_quantity' => 5]);
            \App\Models\Stock::where('product_id', $products[3]->id)->update(['quantity' => 1]);
            $products[3]->update(['alert_quantity' => 10]);
            \App\Models\Stock::where('product_id', $products[4]->id)->update(['quantity' => 4]);
            $products[4]->update(['alert_quantity' => 8]);
        }

        // ── 5. Ensure RBAC users exist ────────────────────────────────────
        $this->info('👥 Ensuring demo role users...');
        $roles = ['owner', 'admin', 'manager', 'cashier', 'accountant', 'purchasing_officer', 'viewer'];
        foreach ($roles as $role) {
            $dbRole = $role;
            if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection) {
                if (!in_array($role, ['owner', 'admin', 'manager', 'cashier', 'viewer'])) {
                    $dbRole = 'viewer';
                }
            }
            $email = "demo-{$role}@venqore-demo.internal";
            $user = \App\Models\User::firstOrCreate(['email' => $email], [
                'name'         => 'Demo ' . ucfirst(str_replace('_', ' ', $role)),
                'password'     => bcrypt(\Illuminate\Support\Str::random(64)),
                'last_store_id'=> $tenantId,
            ]);
            DB::table('tenant_users')->updateOrInsert(
                ['tenant_id' => $tenantId, 'user_id' => $user->id],
                ['role' => $dbRole, 'status' => 'active', 'display_name' => ucfirst($role), 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // ── 6. Reset tracking fields ──────────────────────────────────────
        $demo->update([
            'demo_reset_at'    => now(),
            'demo_visit_today' => 0,
        ]);
        Cache::put('demo_visit_live', 0);

        $this->info('');
        $this->info('✅ Full Demo Deploy complete! All modules seeded with 5-year data.');

        return 0;
    }
}
