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
        $subdomain = env('PERF_TEST_TENANT_SUBDOMAIN', 'testshop');
        $tenant    = DB::table('tenants')->where('subdomain', $subdomain)->first();

        if (!$tenant) {
            $this->command->error("Tenant '{$subdomain}' not found. Create it first.");
            $this->command->line("CREATE: php artisan tinker --execute=\"App\\Models\\Tenant::create(['id'=>Str::uuid(),'name'=>'Test Shop','subdomain'=>'testshop','plan'=>'business','status'=>'active','setup_completed'=>true,'currency_symbol'=>'Rs.','currency_code'=>'PKR','timezone'=>'UTC'])\"");
            return;
        }

        $tenantId = $tenant->id;
        $this->command->info("Seeding {self::PRODUCT_COUNT} products into tenant: {$subdomain} ({$tenantId})");

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
                $categoryIds[] = DB::table('categories')->insertGetId([
                    'name' => $catName, 'code' => $code . rand(10, 99),
                    'tenant_id' => $tenantId,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        // Seed products in batches of 100 for performance
        $bar     = $this->command->getOutput()->createProgressBar(self::PRODUCT_COUNT);
        $batch   = [];
        $batches = [];

        for ($i = 1; $i <= self::PRODUCT_COUNT; $i++) {
            $brand    = $this->brands[array_rand($this->brands)];
            $cost     = rand(200, 8000);
            $margin   = rand(15, 60) / 100;
            $price    = round($cost * (1 + $margin));
            $qty      = rand(5, 500);
            $catId    = $categoryIds[array_rand($categoryIds)];

            $batch[] = [
                'name'        => "Prod-{$i} {$brand} " . $this->categories[array_rand($this->categories)],
                'sku'         => "PERF-{$i}",
                'barcode'     => "PERF-" . str_pad($i, 4, '0', STR_PAD_LEFT),
                'price'       => $price,
                'cost'        => $cost,
                'stock'       => $qty,
                'category_id' => $catId,
                'unit_id'     => $unitId,
                'is_active'   => true,
                'tenant_id'   => $tenantId,
                'created_at'  => now()->subDays(rand(1, 365)),
                'updated_at'  => now(),
            ];

            // Insert in batches of 100
            if (count($batch) >= 100) {
                DB::table('products')->insert($batch);
                $bar->advance(count($batch));

                // Seed FIFO batches for each
                $productIds = DB::table('products')
                    ->where('tenant_id', $tenantId)
                    ->orderByDesc('id')
                    ->take(100)
                    ->pluck('id')
                    ->toArray();

                $fifoBatches = array_map(fn($pId) => [
                    'product_id'    => $pId,
                    'warehouse_id'  => $warehouseId,
                    'quantity'      => rand(5, 200),
                    'remaining_qty' => rand(5, 200),
                    'unit_cost'     => rand(200, 5000),
                    'tenant_id'     => $tenantId,
                    'notes'         => 'Perf test batch',
                    'created_at'    => now()->subDays(rand(1, 30)),
                    'updated_at'    => now(),
                ], $productIds);

                if (!empty($fifoBatches) && DB::getSchemaBuilder()->hasTable('inventory_batches')) {
                    DB::table('inventory_batches')->insert($fifoBatches);
                }

                $batch = [];
            }
        }

        // Insert remaining
        if (!empty($batch)) {
            DB::table('products')->insert($batch);
            $bar->advance(count($batch));
        }

        $bar->finish();
        $this->command->newLine(2);

        $total = DB::table('products')->where('tenant_id', $tenantId)->count();
        $this->command->info("✅ Done. Total products for {$subdomain}: {$total}");
        $this->command->newLine();
        $this->command->line("Now test POS performance:");
        $this->command->line("  1. Open https://{$subdomain}.venqore.com/pos");
        $this->command->line("  2. Search 'Prod-1500' — must return results in <300ms");
        $this->command->line("  3. Scan barcode 'PERF-1500' — must be instant");
    }
}
