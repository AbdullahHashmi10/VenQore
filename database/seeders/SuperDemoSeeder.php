<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Database\Seeders\Demo\DemoSalesSeeder;
use Database\Seeders\Demo\DemoExpenseSeeder;
use Database\Seeders\Demo\DemoProductSeeder;
use Database\Seeders\Demo\DemoCategorySeeder;

class SuperDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌟 Initializing SUPER DEMO Seed Package...');

        // 1. Target the Demo Store
        $demo = Tenant::where('slug', 'demo')->first();
        
        if (!$demo) {
            $this->command->warn('Demo store (slug: demo) not found. Creating it...');
            $demo = Tenant::create([
                'name' => 'VenQore Demo Store',
                'slug' => 'demo',
                'plan' => 'business',
                'status' => 'active',
                'currency_symbol' => '$',
                'currency_code' => 'USD',
                'setup_completed' => true,
                'is_demo' => true,
            ]);
        }

        // Set current tenant context for any global scopes
        app()->instance('current.tenant', $demo);

        // Seed default charts and settings for the tenant
        TenantDefaultSeeder::seedFor($demo);

        // 2. Clear existing demo data to avoid duplicates
        $this->command->info('🧹 Cleaning existing demo data...');
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        $tables = [
            'sales', 'sale_items', 'purchases', 'purchase_items', 
            'expenses', 'expense_categories', 'bank_accounts', 
            'products', 'categories', 'stocks', 'warehouses',
            'journal_entries', 'journal_items', 'payments'
        ];

        foreach ($tables as $table) {
            if (Schema::hasColumn($table, 'tenant_id')) {
                DB::table($table)->where('tenant_id', $demo->id)->delete();
            } else {
                // If it doesn't have tenant_id directly, we might need a truncate or skip
                // For demo purpose, we skip to avoid unintentional global data loss
                $this->command->warn("Skipping table $table as it lacks tenant_id column.");
            }
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 3. Run Sub-Seeders with explicit tenant context
        $this->command->info('📦 Seeding Core Modules...');
        
        // Warehouses
        $warehouse = Warehouse::create([
            'tenant_id' => $demo->id,
            'name' => 'Main Showroom',
            'is_default' => true
        ]);

        // Categories & Products
        $this->call(DemoCategorySeeder::class, false, ['tenantId' => $demo->id]);
        $this->call(DemoProductSeeder::class, false, ['tenantId' => $demo->id]);

        // Financial Infrastructure
        $this->command->info('💰 Setting up Bank Accounts & Cash...');
        BankAccount::create([
            'tenant_id' => $demo->id,
            'name' => 'Business Operating Account',
            'account_type' => 'bank',
            'bank_name' => 'Demo Bank Corp',
            'account_number' => '123456789',
            'opening_balance' => 25000.00,
            'current_balance' => 25000.00
        ]);

        BankAccount::create([
            'tenant_id' => $demo->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 5000.00,
            'current_balance' => 5000.00
        ]);

        // Customers & Suppliers
        $this->call(\Database\Seeders\Demo\DemoCustomerSeeder::class, false, ['tenantId' => $demo->id]);
        $this->call(\Database\Seeders\Demo\DemoSupplierSeeder::class, false, ['tenantId' => $demo->id]);

        // Sales & Expenses
        $this->command->info('📈 Generating Transaction History (This may take a minute)...');
        $this->call(DemoSalesSeeder::class, false, ['tenantId' => $demo->id]);
        $this->call(DemoExpenseSeeder::class, false, ['tenantId' => $demo->id]);

        // 4. Force some Low Stock and Out of Stock products
        $this->command->info('⚠️ Simulating Inventory Scarcity...');
        $products = Product::where('tenant_id', $demo->id)->take(10)->get();
        if ($products->count() >= 5) {
            // 2 Out of Stock
            Stock::where('product_id', $products[0]->id)->update(['quantity' => 0]);
            Stock::where('product_id', $products[1]->id)->update(['quantity' => 0]);
            
            // 3 Low Stock
            Stock::where('product_id', $products[2]->id)->update(['quantity' => 2]);
            $products[2]->update(['alert_quantity' => 5]);
            
            Stock::where('product_id', $products[3]->id)->update(['quantity' => 1]);
            $products[3]->update(['alert_quantity' => 10]);
            
            Stock::where('product_id', $products[4]->id)->update(['quantity' => 4]);
            $products[4]->update(['alert_quantity' => 8]);
        }

        // 5. Generate RBAC Testing Users!
        $this->command->info('👥 Generating RBAC Testing Users...');
        $roles = ['owner', 'admin', 'manager', 'cashier', 'accountant', 'purchasing_officer', 'viewer'];
        foreach ($roles as $role) {
            $email = "{$role}@venqore-demo.internal";
            $user = User::firstOrCreate(['email' => $email], [
                'name' => ucfirst(str_replace('_', ' ', $role)) . ' Tester',
                'password' => bcrypt('password'),
                'last_store_id' => $demo->id,
            ]);

            DB::table('tenant_users')->updateOrInsert(
                ['tenant_id' => $demo->id, 'user_id' => $user->id],
                ['role' => $role, 'status' => 'active', 'display_name' => ucfirst($role), 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $this->command->info('✅ SUPER DEMO Seeding Complete! The dashboard should now be vibrant and full.');
    }
}
