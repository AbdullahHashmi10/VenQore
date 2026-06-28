<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * LargeProductCatalogSeeder — Pre-Launch Checklist §6.1
 *
 * Seeds a test tenant with 3,000+ realistic products to verify:
 *   - POS search performance with large catalog
 *   - Barcode lookup speed
 *   - Report generation with high row counts
 *   - FIFO engine performance under load
 *
 * Usage:
 *   php artisan db:seed --class=LargeProductCatalogSeeder
 *
 * Target tenant is controlled by PERF_TEST_TENANT_SUBDOMAIN env var.
 * Defaults to 'testshop' (must exist in tenants table).
 *
 * After running, verify POS performance:
 *   1. Open https://testshop.venqore.com/pos
 *   2. Search for "Prod-15" — must return results in under 300ms
 *   3. Scan barcode "PERF-1500" — must be instant
 */
class LargeProductCatalogSeeder extends Seeder
{
    private const PRODUCT_COUNT = 3000;

    private array $categories = [
        'Fashion & Apparel', 'Electronics', 'Food & Beverage',
        'Health & Beauty', 'Sports & Fitness', 'Home & Garden',
        'Toys & Games', 'Books & Stationery', 'Automotive', 'Tools & Hardware',
    ];

    private array $brands = [
        'AlphaBrand', 'BetaCo', 'GammaWorks', 'DeltaStudio', 'EpsilonMade',
        'ZetaLine', 'EtaFactory', 'ThetaPro', 'IotaDesign', 'KappaCraft',
    ];

    public function run(): void
    {
        $slug = env('PERF_TEST_TENANT_SUBDOMAIN', 'test-store');
        $tenant    = DB::table('tenants')->where('slug', $slug)->first();

        if (!$tenant) {
            $this->command->error("Tenant '{$slug}' not found. Create it first.");
            $this->command->line("CREATE: php artisan tinker --execute=\"App\\Models\\Tenant::create(['id'=>Str::uuid(),'name'=>'Test Store','slug'=>'test-store','plan'=>'business','status'=>'active','setup_completed'=>true,'currency_symbol'=>'Rs.','currency_code'=>'PKR','timezone'=>'UTC'])\"");
            return;
        }

        $tenantId = $tenant->id;
        $this->command->info("Seeding 3000 products into tenant: {$slug} ({$tenantId})");

        // Clean up existing products, barcodes, and inventory batches to prevent unique key conflicts
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        try {
            DB::table('product_barcodes')->where('tenant_id', $tenantId)->delete();
            DB::table('inventory_batches')->where('tenant_id', $tenantId)->delete();
            DB::table('products')->where('tenant_id', $tenantId)->delete();
        } finally {
            \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();
        }

        // Get or create a unit
        $unit = DB::table('units')->where('tenant_id', $tenantId)->first();
        if (!$unit) {
            $unitId = DB::table('units')->insertGetId([
                'name' => 'Pieces', 'short_name' => 'pcs',
                'operator' => '*', 'operator_value' => 1,
                'tenant_id' => $tenantId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        } else {
            $unitId = $unit->id;
        }

        // Get or create a warehouse
        $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)->first();
        if (!$warehouse) {
            $warehouseId = DB::table('warehouses')->insertGetId([
                'name' => 'Main Store', 'location' => 'Ground Floor',
                'is_default' => true, 'tenant_id' => $tenantId,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        } else {
            $warehouseId = $warehouse->id;
        }

        // Seed categories
        $categoryIds = [];
        foreach ($this->categories as $catName) {
            $code = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $catName), 0, 3));
            $existing = DB::table('categories')->where('tenant_id', $tenantId)->where('name', $catName)->first();
            if ($existing) {
                $categoryIds[] = $existing->id;
            } else {
                $catId = \Illuminate\Support\Str::uuid()->toString();
                DB::table('categories')->insert([
                    'id' => $catId,
                    'name' => $catName,
                    'code' => $code . rand(10, 99),
                    'tenant_id' => $tenantId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $categoryIds[] = $catId;
            }
        }

        // Seed products in batches of 100 for performance
        $bar     = $this->command->getOutput()->createProgressBar(self::PRODUCT_COUNT);
        $batch   = [];
        $batchProductIds = [];
        $barcodesMap = [];

        for ($i = 1; $i <= self::PRODUCT_COUNT; $i++) {
            $brand     = $this->brands[array_rand($this->brands)];
            $cost      = rand(200, 8000);
            $margin    = rand(15, 60) / 100;
            $price     = round($cost * (1 + $margin));
            $qty       = rand(5, 500);
            $catId     = $categoryIds[array_rand($categoryIds)];
            $productId = \Illuminate\Support\Str::uuid()->toString();
            $barcodeVal = "PERF-" . str_pad($i, 4, '0', STR_PAD_LEFT);

            $batch[] = [
                'id'          => $productId,
                'name'        => "Prod-{$i} {$brand} " . $this->categories[array_rand($this->categories)],
                'sku'         => "PERF-{$i}",
                'price'       => $price,
                'cost_price'  => $cost,
                'quantity'    => $qty,
                'stock_quantity' => $qty,
                'type'        => 'standard',
                'category_id' => $catId,
                'unit'        => 'PCS',
                'base_unit'   => 'PCS',
                'is_active'   => true,
                'tenant_id'   => $tenantId,
                'created_at'  => now()->subDays(rand(1, 365)),
                'updated_at'  => now(),
            ];
            $batchProductIds[] = $productId;
            $barcodesMap[$productId] = $barcodeVal;

            // Insert in batches of 100
            if (count($batch) >= 100) {
                DB::table('products')->insert($batch);
                $bar->advance(count($batch));

                // Seed FIFO batches for each
                $fifoBatches = array_map(function($pId) use ($warehouseId, $tenantId) {
                    $q = rand(5, 200);
                    return [
                        'id'            => \Illuminate\Support\Str::uuid()->toString(),
                        'product_id'    => $pId,
                        'warehouse_id'  => $warehouseId,
                        'initial_qty'   => $q,
                        'original_qty'  => $q,
                        'remaining_qty' => $q,
                        'unit_cost'     => rand(200, 5000),
                        'tenant_id'     => $tenantId,
                        'notes'         => 'Perf test batch',
                        'created_at'    => now()->subDays(rand(1, 30)),
                        'updated_at'    => now(),
                    ];
                }, $batchProductIds);

                if (!empty($fifoBatches) && DB::getSchemaBuilder()->hasTable('inventory_batches')) {
                    DB::table('inventory_batches')->insert($fifoBatches);
                }

                // Seed barcodes
                $barcodeBatches = array_map(fn($pId) => [
                    'id'           => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id'    => $tenantId,
                    'product_id'   => $pId,
                    'barcode'      => $barcodesMap[$pId],
                    'barcode_type' => 'code128',
                    'is_primary'   => true,
                    'is_active'    => true,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ], $batchProductIds);

                DB::table('product_barcodes')->insert($barcodeBatches);

                $batch = [];
                $batchProductIds = [];
                $barcodesMap = [];
            }
        }

        // Insert remaining
        if (!empty($batch)) {
            DB::table('products')->insert($batch);
            
            // Seed remaining barcodes
            $barcodeBatches = array_map(fn($pId) => [
                'id'           => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id'    => $tenantId,
                'product_id'   => $pId,
                'barcode'      => $barcodesMap[$pId],
                'barcode_type' => 'code128',
                'is_primary'   => true,
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ], $batchProductIds);

            DB::table('product_barcodes')->insert($barcodeBatches);

            $bar->advance(count($batch));
        }

        $bar->finish();
        $this->command->newLine(2);

        $total = DB::table('products')->where('tenant_id', $tenantId)->count();
        $this->command->info("✅ Done. Total products for {$slug}: {$total}");
        $this->command->newLine();
        $this->command->line("Now test POS performance:");
        $this->command->line("  1. Open https://{$slug}.venqore.com/pos");
        $this->command->line("  2. Search 'Prod-1500' — must return results in <300ms");
        $this->command->line("  3. Scan barcode 'PERF-1500' — must be instant");
    }
}
