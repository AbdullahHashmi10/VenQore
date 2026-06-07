<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Warehouse;

DB::beginTransaction();

try {
    // 1. Find or create the user test@venqore.com
    $user = User::where('email', 'test@venqore.com')->first();
    if (!$user) {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@venqore.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
    }

    // 2. Create the proper tenant "AMD General Store"
    $tenant = Tenant::updateOrCreate(
        ['slug' => 'amd-store'],
        [
            'name' => 'AMD General Store',
            'plan' => 'business', // Business level gives you unlimited access to all features!
            'status' => 'active',
            'timezone' => 'Asia/Karachi',
            'currency_code' => 'PKR',
            'currency_symbol' => 'Rs.',
            'country_code' => 'PK',
            'language_code' => 'en',
            'setup_completed' => true,
            'is_demo' => false, // Set to false to make it a real proper store!
            'is_golden_master' => false,
            'feature_variants' => true,
            'feature_serials' => true,
            'feature_batches' => true,
            'feature_manufacturing' => true,
        ]
    );

    // 3. Link user to the new proper store as owner
    TenantUser::updateOrCreate(
        [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ],
        [
            'role' => 'owner',
            'status' => 'active',
        ]
    );

    // Set user's last store ID to this proper store
    $user->last_store_id = $tenant->id;
    $user->save();

    // Bind current tenant to the container so scopes work for seeding
    app()->instance('current.tenant', $tenant);

    // 4. Create Main Warehouse
    $warehouse = Warehouse::updateOrCreate(
        ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse'],
        ['is_default' => true]
    );

    // 5. Seed some beautiful proper catalog categories and products
    $categories = [
        'Electronics' => [
            [
                'name' => 'iPhone 15 Pro Max',
                'sku' => 'IPHONE15PM-256',
                'price' => 335000.00,
                'cost_price' => 295000.00,
                'base_unit' => 'pcs',
            ],
            [
                'name' => 'MacBook Pro M3 Max',
                'sku' => 'MACBOOK-M3-16',
                'price' => 745000.00,
                'cost_price' => 670000.00,
                'base_unit' => 'pcs',
            ],
            [
                'name' => 'Sony WH-1000XM5 Headphones',
                'sku' => 'SONY-XM5-BLK',
                'price' => 95000.00,
                'cost_price' => 81000.00,
                'base_unit' => 'pcs',
            ]
        ],
        'Apparel' => [
            [
                'name' => 'Premium Leather Jacket',
                'sku' => 'JKT-LTHR-01',
                'price' => 15000.00,
                'cost_price' => 7500.00,
                'base_unit' => 'pcs',
            ],
            [
                'name' => 'Classic Blue Jeans',
                'sku' => 'JEANS-BLU-M',
                'price' => 3500.00,
                'cost_price' => 1800.00,
                'base_unit' => 'pcs',
            ]
        ]
    ];

    foreach ($categories as $catName => $products) {
        $category = Category::updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => $catName],
            ['name' => $catName]
        );

        foreach ($products as $p) {
            $product = Product::updateOrCreate(
                ['tenant_id' => $tenant->id, 'sku' => $p['sku']],
                [
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'cost_price' => $p['cost_price'],
                    'category_id' => $category->id,
                    'is_active' => true,
                    'base_unit' => $p['base_unit'],
                ]
            );

            // Add Stock
            Stock::updateOrCreate(
                ['tenant_id' => $tenant->id, 'product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                ['quantity' => 150, 'reserved_quantity' => 0]
            );
        }
    }

    DB::commit();
    echo "SUCCESS: Created store 'AMD General Store' (id: " . $tenant->id . ", slug: amd-store) and linked user test@venqore.com successfully!\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
