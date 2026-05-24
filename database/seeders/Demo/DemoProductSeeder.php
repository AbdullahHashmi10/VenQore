<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Warehouse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DemoProductSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoProductSeeder.");
            return;
        }

        $categories = Category::where('tenant_id', $tenantId)->get()->keyBy('name');
        $warehouse = Warehouse::where('tenant_id', $tenantId)->first();

        if (!$warehouse) {
            $this->command->error("Warehouse not found. Run DemoWarehouseSeeder first.");
            return;
        }

        // Product Catalog definition based on plan
        $catalog = [
            // Smartphones
            ['name' => 'Samsung Galaxy S24 FE 128GB', 'sku' => 'SAM-GS24FE-128-BLK', 'cat' => 'Smartphones', 'price' => 599, 'cost' => 450, 'qty' => 45],
            ['name' => 'Apple iPhone 15 Pro 256GB', 'sku' => 'APL-IP15P-256-TI', 'cat' => 'Smartphones', 'price' => 1099, 'cost' => 880, 'qty' => 30],
            ['name' => 'Google Pixel 8 128GB', 'sku' => 'GGL-PX8-128-OBS', 'cat' => 'Smartphones', 'price' => 699, 'cost' => 540, 'qty' => 20],
            ['name' => 'OnePlus 12 256GB', 'sku' => 'ONP-12-256-BLK', 'cat' => 'Smartphones', 'price' => 799, 'cost' => 620, 'qty' => 15],
            ['name' => 'Motorola Edge 2024', 'sku' => 'MOT-EDGE-24', 'cat' => 'Smartphones', 'price' => 499, 'cost' => 380, 'qty' => 22],
            
            // Laptops
            ['name' => 'Apple MacBook Air M3', 'sku' => 'APL-MBA-M3-256', 'cat' => 'Laptops', 'price' => 1099, 'cost' => 900, 'qty' => 18],
            ['name' => 'Dell XPS 15', 'sku' => 'DEL-XPS15-512', 'cat' => 'Laptops', 'price' => 1499, 'cost' => 1150, 'qty' => 10],
            ['name' => 'Lenovo ThinkPad X1 Carbon', 'sku' => 'LEN-X1C-G11', 'cat' => 'Laptops', 'price' => 1699, 'cost' => 1300, 'qty' => 8],
            ['name' => 'ASUS ROG Zephyrus G14', 'sku' => 'ASUS-G14-RTX4060', 'cat' => 'Laptops', 'price' => 1399, 'cost' => 1100, 'qty' => 12],
            
            // Audio
            ['name' => 'Sony WH-1000XM5 Wireless', 'sku' => 'SNY-XM5-BLK', 'cat' => 'Audio', 'price' => 398, 'cost' => 290, 'qty' => 40],
            ['name' => 'Apple AirPods Pro (2nd Gen)', 'sku' => 'APL-APP2', 'cat' => 'Audio', 'price' => 249, 'cost' => 185, 'qty' => 60],
            ['name' => 'Bose QuietComfort Earbuds', 'sku' => 'BOS-QCE', 'cat' => 'Audio', 'price' => 299, 'cost' => 220, 'qty' => 25],
            
            // Accessories
            ['name' => 'Anker 735 Charger (Nano II 65W)', 'sku' => 'ANK-735-65W', 'cat' => 'Accessories', 'price' => 49, 'cost' => 32, 'qty' => 80],
            ['name' => 'Spigen Tough Armor Case iPhone 15 Pro', 'sku' => 'SPI-TA-IP15P', 'cat' => 'Accessories', 'price' => 25, 'cost' => 12, 'qty' => 120],
            ['name' => 'Belkin BoostCharge Pro 3-in-1', 'sku' => 'BEL-BCP-3IN1', 'cat' => 'Accessories', 'price' => 149, 'cost' => 95, 'qty' => 35],
            
            // Networking
            ['name' => 'Netgear Nighthawk AX5400', 'sku' => 'NET-AX5400', 'cat' => 'Networking', 'price' => 199, 'cost' => 145, 'qty' => 20],
            ['name' => 'TP-Link Deco XE75 Pro', 'sku' => 'TPL-DEC-XE75', 'cat' => 'Networking', 'price' => 299, 'cost' => 220, 'qty' => 15],
            
            // Storage
            ['name' => 'Samsung 990 PRO 2TB NVMe SSD', 'sku' => 'SAM-990P-2TB', 'cat' => 'Storage', 'price' => 149, 'cost' => 115, 'qty' => 45],
            ['name' => 'WD Black SN850X 1TB', 'sku' => 'WD-SN850X-1TB', 'cat' => 'Storage', 'price' => 89, 'cost' => 65, 'qty' => 65],
            
            // Displays
            ['name' => 'Dell UltraSharp 27 4K USB-C Hub Monitor', 'sku' => 'DEL-U2723QE', 'cat' => 'Displays', 'price' => 549, 'cost' => 420, 'qty' => 12],
            ['name' => 'LG 27GP850-B Ultragear', 'sku' => 'LG-27GP850', 'cat' => 'Displays', 'price' => 349, 'cost' => 270, 'qty' => 20],
            
            // Peripherals
            ['name' => 'Logitech MX Master 3S Mouse', 'sku' => 'LOG-MXM3S', 'cat' => 'Peripherals', 'price' => 99, 'cost' => 75, 'qty' => 50],
            ['name' => 'Keychron Q1 Pro Mechanical Keyboard', 'sku' => 'KEY-Q1P-RGB', 'cat' => 'Peripherals', 'price' => 199, 'cost' => 145, 'qty' => 25],
        ];

        // Ensure exactly 50 products eventually, seeded 23 as base sample to start
        
        $barcodePrefix = 1000000;

        foreach ($catalog as $index => $item) {
            $catId = isset($categories[$item['cat']]) ? $categories[$item['cat']]->id : null;
            
            $product = Product::firstOrCreate([
                'tenant_id' => $tenantId,
                'sku' => $item['sku']
            ], [
                'id' => Str::uuid()->toString(),
                'name' => $item['name'],
                'category_id' => $catId,
                'price' => $item['price'],
                'cost_price' => $item['cost'],
                'unit' => 'PCS',
                'type' => 'standard',
                'alert_quantity' => 5,
                // generate a fake summary description
                'description' => 'A beautifully designed ' . $item['cat'] . ' item perfect for all your needs.',
            ]);

            // Create Barcode
            DB::table('product_barcodes')->updateOrInsert(
                ['product_id' => $product->id],
                ['id' => Str::uuid()->toString(), 'barcode' => (string)($barcodePrefix + $index)]
            );

            // Create Initial Stock
            DB::table('stocks')->updateOrInsert(
                ['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'tenant_id' => $tenantId],
                ['id' => Str::uuid()->toString(), 'quantity' => 10000, 'created_at' => \Carbon\Carbon::parse('2010-01-01'), 'updated_at' => now()]
            );

            DB::table('product_uom_conversions')->updateOrInsert(
                ['product_id' => $product->id, 'sale_uom' => 'PCS'],
                ['id' => Str::uuid()->toString(), 'conversion_factor' => 1]
            );

            // Create Inventory Batch for FIFO valuation
            DB::table('inventory_batches')->updateOrInsert(
                ['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'tenant_id' => $tenantId, 'batch_type' => 'manual'],
                [
                    'id' => Str::uuid()->toString(),
                    'initial_qty' => 10000,
                    'original_qty' => 10000,
                    'remaining_qty' => 10000,
                    'unit_cost' => $item['cost'],
                    'created_at' => \Carbon\Carbon::parse('2010-01-01'), // Add stock before 2015
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info("✓ " . count($catalog) . " Products seeded for Golden Master with initial stock and batches.");
    }
}
