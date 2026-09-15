<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Warehouse;

class DemoStoreSeeder extends Seeder
{
    public function run(): void
    {
        $demo = Tenant::where('slug', 'demo')->firstOrFail();
        // Bind the tenant to the container so HasTenant scope works during seeding
        app()->instance('current.tenant', $demo);

        // Clean up any orphan warehouses (added by migrations or bugs)
        \App\Models\Warehouse::withoutTenantScope()->whereNull('tenant_id')->delete();

        $categoriesData = [
            ['name' => 'Men\'s Clothing'],
            ['name' => 'Women\'s Clothing'],
            ['name' => 'Footwear'],
            ['name' => 'Accessories'],
            ['name' => 'Kids'],
        ];

        foreach ($categoriesData as $cat) {
            Category::updateOrCreate(
                ['tenant_id' => $demo->id, 'name' => $cat['name']],
                $cat
            );
        }

        // Create Default Warehouse
        $warehouse = Warehouse::updateOrCreate(
            ['tenant_id' => $demo->id, 'name' => 'Main Showroom'],
            ['is_default' => true]
        );

        $productsData = [
            [
                'name'        => 'Classic White Oxford Shirt',
                'sku'         => 'SHIRT-WHT-001',
                'price'       => 49.99,
                'cost_price'  => 18.00,
                'category'    => 'Men\'s Clothing',
                'base_unit'   => 'pcs',
            ],
            [
                'name'        => 'Slim Fit Dark Jeans',
                'sku'         => 'JEANS-DRK-001',
                'price'       => 79.99,
                'cost_price'  => 28.00,
                'category'    => 'Men\'s Clothing',
                'base_unit'   => 'pcs',
            ],
            [
                'name'        => 'Women\'s Floral Summer Dress',
                'sku'         => 'DRESS-FLR-001',
                'price'       => 64.99,
                'cost_price'  => 22.00,
                'category'    => 'Women\'s Clothing',
                'base_unit'   => 'pcs',
            ],
            [
                'name'        => 'White Leather Sneakers',
                'sku'         => 'SHOE-WHT-001',
                'price'       => 89.99,
                'cost_price'  => 32.00,
                'category'    => 'Footwear',
                'base_unit'   => 'pcs',
            ],
            [
                'name'        => 'Leather Belt - Brown',
                'sku'         => 'BELT-BRN-001',
                'price'       => 34.99,
                'cost_price'  => 12.00,
                'category'    => 'Accessories',
                'base_unit'   => 'pcs',
            ],
        ];

        foreach ($productsData as $p) {
            $category = Category::where('tenant_id', $demo->id)
                                ->where('name', $p['category'])->first();
            
            $product = Product::updateOrCreate(
                ['tenant_id' => $demo->id, 'sku' => $p['sku']],
                [
                    'name'        => $p['name'],
                    'price'       => $p['price'],
                    'cost_price'  => $p['cost_price'],
                    'category_id' => $category?->id,
                    'is_active'   => true,
                    'base_unit'   => $p['base_unit'],
                ]
            );

            Stock::updateOrCreate(
                ['tenant_id' => $demo->id, 'product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                ['quantity' => 100, 'reserved_quantity' => 0]
            );
        }
    }
}
