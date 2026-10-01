<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Party;
use App\Models\Product;
use App\Models\Category;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\ProductBarcode;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure a Warehouse exists
        $warehouse = Warehouse::firstOrCreate(
            ['name' => 'Main Warehouse'],
            [
                'location' => 'Main Location',
                // 'is_active' => true 
            ]
        );

        // 2. Create Categories
        $categories = [];
        $catNames = ['Electronics', 'Groceries', 'Clothing', 'Furniture', 'Toys'];
        foreach ($catNames as $name) {
            $categories[] = Category::firstOrCreate(['name' => $name]);
        }

        // 3. Create 10 Suppliers
        for ($i = 1; $i <= 10; $i++) {
            $balance = ($i % 4 == 0) ? 0 : rand(5000, 50000);
            $type = ($i % 7 == 0) ? 'receivable' : 'payable'; // Most are payable, some exception

            Party::create([
                'name' => "Supplier $i",
                'email' => "supplier$i@example.com",
                'phone' => "555-020$i",
                'type' => 'supplier',
                'opening_balance' => $balance,
                'opening_balance_type' => $type,
            ]);
        }

        // 4. Create 10 Customers
        for ($i = 1; $i <= 10; $i++) {
            $balance = ($i % 3 == 0) ? 0 : rand(1000, 20000);
            $type = ($i % 8 == 0) ? 'payable' : 'receivable'; // Most are receivable, some exception

            Party::create([
                'name' => "Customer $i",
                'email' => "customer$i@example.com",
                'phone' => "555-030$i",
                'type' => 'customer',
                'opening_balance' => $balance,
                'opening_balance_type' => $type,
            ]);
        }

        // 5. Create 10 Products with Stock
        for ($i = 1; $i <= 10; $i++) {
            $cat = $categories[array_rand($categories)];
            $price = rand(10, 1000);
            $cost = $price * 0.7;
            
            $product = Product::create([
                'name' => "Demo Product $i",
                'sku' => "SKU-" . str_pad($i, 5, '0', STR_PAD_LEFT),
                'description' => "This is a demo product description for item $i",
                'category_id' => $cat->id,
                'price' => $price,
                'cost_price' => $cost,
                'wholesale_price' => $cost * 1.1,
                'alert_quantity' => 5,
                'unit' => 'pc',
                'type' => 'standard',
                // 'manage_stock' => true
            ]);

            // Add Barcode
            ProductBarcode::create([
                'product_id' => $product->id,
                'barcode' => "88000" . str_pad($i, 5, '0', STR_PAD_LEFT),
            ]);

            // Add Stock
            Stock::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'quantity' => $qty = rand(50, 200),
            ]);

            // V3 Logic: Must create inventory batch for valuation
            \App\Models\InventoryBatch::create([
                'product_id'    => $product->id,
                'warehouse_id'  => $warehouse->id,
                'original_qty'  => $qty,
                'initial_qty'   => $qty,
                'remaining_qty' => $qty,
                'unit_cost'     => $cost,
                'notes'         => 'Seeded Demo Stock',
            ]);
        }

        $this->command->info('Successfully added 10 Suppliers, 10 Customers, and 10 Products with Stock!');
    }
}
