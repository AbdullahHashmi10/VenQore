<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Services\StoreProvisioner;
use App\Services\AiBuilder\ApplyConfigurationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NonRestaurantStoreSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure an owner user exists
        $user = User::where('email', 'owner@venqore.com')->first();
        if (!$user) {
            $user = User::create([
                'name'              => 'Store Owner',
                'email'             => 'owner@venqore.com',
                'password'          => Hash::make('password123'),
                'role'              => 'owner',
                'email_verified_at' => now(),
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        } else {
            $user->update(['email_verified_at' => now()]);
        }

        // 2. Build non-restaurant live modules list
        $allModules = config('modules', []);
        $excludedModules = ['table_service', 'cookbook', 'production_runs', 'composite_items'];

        $nonRestaurantLiveModules = [];
        foreach ($allModules as $key => $mod) {
            if (in_array($key, $excludedModules, true)) {
                continue;
            }
            if (($mod['status'] ?? 'live') === 'live') {
                $nonRestaurantLiveModules[] = $key;
            }
        }

        // 3. Provision the Store
        $provisioner = app(StoreProvisioner::class);
        $tenant = $provisioner->create($user, [
            'name'            => 'General Superstore (Non-Restaurant)',
            'business_type'   => 'general_mega_store',
            'preset_key'      => 'all_modules_non_restaurant',
            'country'         => 'US',
            'currency'        => 'USD',
            'timezone'        => 'America/New_York',
            'setup_completed' => true,
            'modules'         => $nonRestaurantLiveModules,
        ]);

        // Explicitly enforce the full 41 non-restaurant modules set
        app(ApplyConfigurationService::class)->apply(
            $tenant,
            [
                'modules'     => $nonRestaurantLiveModules,
                'terminology' => [],
            ],
            'seeder',
            'Seeded store with all non-restaurant modules.'
        );

        // 4. Seed sample categories & products for this new store
        app()->instance('current.tenant', $tenant);

        $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
        if ($warehouse) {
            $category = \App\Models\Category::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => 'General Goods'],
                ['tenant_id' => $tenant->id, 'name' => 'General Goods']
            );

            $product = \App\Models\Product::updateOrCreate(
                ['tenant_id' => $tenant->id, 'sku' => 'GEN-001'],
                [
                    'name'        => 'Universal Multi-Tool',
                    'price'       => 29.99,
                    'cost_price'  => 12.50,
                    'category_id' => $category->id,
                    'is_active'   => true,
                    'base_unit'   => 'pcs',
                ]
            );

            \App\Models\Stock::updateOrCreate(
                ['tenant_id' => $tenant->id, 'product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                ['quantity' => 150, 'reserved_quantity' => 0]
            );
        }

        echo "✅ Created new store: {$tenant->name} (Slug: {$tenant->slug}, ID: {$tenant->id}) with " . count($nonRestaurantLiveModules) . " non-restaurant modules enabled.\n";
    }
}
