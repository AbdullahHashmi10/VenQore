<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class DemoMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting VenQore Golden Master Seeding Process...');

        // 1. Create or Reset Golden Master Tenant
        $tenant = Tenant::updateOrCreate(
            ['slug' => 'demo-master'],
            [
                'name' => 'VenQore Golden Master',
                'plan' => 'business',
                'status' => 'active',
                'currency_symbol' => '$',
                'currency_code' => 'USD',
                'setup_completed' => true,
                'is_demo' => false,
                'is_golden_master' => true,
            ]
        );

        // Ensure Master User is linked to this tenant
        $user = \App\Models\User::firstOrCreate(['email' => 'master@venqore.com'], [
            'name' => 'Demo Admin',
            'password' => bcrypt('password'),
            'last_store_id' => $tenant->id,
        ]);

        DB::table('tenant_users')->updateOrInsert(
            ['tenant_id' => $tenant->id, 'user_id' => $user->id],
            ['role' => 'owner', 'status' => 'active', 'display_name' => 'John (VenQore Demo)', 'created_at' => now(), 'updated_at' => now()]
        );

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('product_barcodes')->truncate();
        DB::table('product_uom_conversions')->truncate();
        DB::table('inventory_batches')->where('tenant_id', $tenant->id)->delete();
        DB::table('sale_item_batches')->where('tenant_id', $tenant->id)->delete();
        DB::table('stocks')->where('tenant_id', $tenant->id)->delete();
        DB::table('sale_items')->where('tenant_id', $tenant->id)->delete();
        DB::table('sales')->where('tenant_id', $tenant->id)->delete();
        DB::table('journal_items')->where('tenant_id', $tenant->id)->delete();
        DB::table('journal_entries')->where('tenant_id', $tenant->id)->delete();
        DB::table('expenses')->where('tenant_id', $tenant->id)->delete();
        DB::table('expense_categories')->where('tenant_id', $tenant->id)->delete();
        DB::table('customers')->where('tenant_id', $tenant->id)->delete();
        DB::table('suppliers')->where('tenant_id', $tenant->id)->delete();
        DB::table('bank_accounts')->where('tenant_id', $tenant->id)->delete();
        DB::table('products')->where('tenant_id', $tenant->id)->delete();
        DB::table('categories')->where('tenant_id', $tenant->id)->delete();
        DB::table('warehouses')->where('tenant_id', $tenant->id)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Set tenant context for scoped queries
        // Assuming there is a helper to set current tenant if package requires
        // Here we just pass tenant_id to the sub-seeders

        $this->call([
            Demo\DemoWarehouseSeeder::class,
            Demo\DemoCategorySeeder::class,
            Demo\DemoProductSeeder::class,
            Demo\DemoCustomerSeeder::class,
            Demo\DemoSupplierSeeder::class,
            Demo\DemoSalesSeeder::class,
            Demo\DemoExpenseSeeder::class,
            Demo\DemoBankAccountSeeder::class,
            Demo\DemoFinancialVerifier::class,
        ], false, ['tenantId' => $tenant->id]);

        $this->command->info('✅ Master Seeding Data Successfully Generated.');
    }
}
