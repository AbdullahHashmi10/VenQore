<?php

namespace Tests\Feature\Money;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class LowStockWarehouseTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * test 'B3: low-stock honors the warehouse filter'
     *   - One product, stock 2 in Warehouse A and 50 in Warehouse B, threshold 5.
     *   - lowStock with warehouse_id = A → product IS low (qty 2 ≤ 5).
     *   - lowStock with warehouse_id = B → product is NOT low (qty 50 > 5).
     *   - lowStock with NO warehouse → uses combined 52 (not low). (proves per-warehouse vs total)
     */
    public function test_B3_low_stock_honors_the_warehouse_filter()
    {
        $tenant = $this->createTenant("lowstock-shop", "ltd_3");
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // Create two warehouses
        $warehouseA = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name' => 'Warehouse A',
            'slug' => 'warehouse-a',
        ]);
        $warehouseB = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name' => 'Warehouse B',
            'slug' => 'warehouse-b',
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'alert_quantity' => 5,
        ]);

        // Stock 2 in Warehouse A
        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'quantity' => 2,
        ]);

        // Stock 50 in Warehouse B
        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseB->id,
            'quantity' => 50,
        ]);

        // 1. lowStock with warehouse_id = A -> product IS low (qty 2 <= 5)
        $responseA = $this->get("/s/{$tenant->slug}/reports/low-stock?warehouse_id={$warehouseA->id}");
        $responseA->assertStatus(200);
        $propsA = $responseA->viewData('page')['props'];
        $productsA = collect($propsA['products']);
        $this->assertCount(1, $productsA);
        $this->assertEquals($product->id, $productsA->first()['id']);
        $this->assertEquals(2.0, (float) $productsA->first()['stock_quantity']);

        // 2. lowStock with warehouse_id = B -> product is NOT low (qty 50 > 5)
        $responseB = $this->get("/s/{$tenant->slug}/reports/low-stock?warehouse_id={$warehouseB->id}");
        $responseB->assertStatus(200);
        $propsB = $responseB->viewData('page')['props'];
        $productsB = collect($propsB['products']);
        $this->assertCount(0, $productsB);

        // 3. lowStock with NO warehouse -> uses combined 52 (not low)
        $responseNone = $this->get("/s/{$tenant->slug}/reports/low-stock");
        $responseNone->assertStatus(200);
        $propsNone = $responseNone->viewData('page')['props'];
        $productsNone = collect($propsNone['products']);
        $this->assertCount(0, $productsNone);
    }

    /**
     * test 'B3: low-stock issues a bounded number of queries (no N+1)'
     *   - Seed ~20 products. Wrap the lowStock call in DB::enableQueryLog(); assert
     *     count(DB::getQueryLog()) is small/constant (e.g. < 8), NOT ~20+. (Proves N+1 gone.)
     */
    public function test_B3_low_stock_issues_a_bounded_number_of_queries_no_n_plus_one()
    {
        $tenant = $this->createTenant("nplusone-shop", "ltd_3");
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name' => 'Warehouse A',
            'slug' => 'warehouse-a',
        ]);

        // Seed 20 products and stocks
        for ($i = 0; $i < 20; $i++) {
            $product = Product::factory()->create([
                'tenant_id' => $tenant->id,
                'alert_quantity' => 5,
            ]);

            Stock::create([
                'tenant_id' => $tenant->id,
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'quantity' => 2,
            ]);
        }

        // Call the controller method directly to measure queries of the method only
        $request = new \Illuminate\Http\Request();
        $controller = app(\App\Http\Controllers\ReportController::class);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $controller->lowStock($request);

        $queries = DB::getQueryLog();
        $queryCount = count($queries);

        // We expect exactly 5-6 queries (Product get, Category get, Warehouse get, Stock pluck, plus maybe a gate/settings lookup).
        // With N+1, it would be 20+ queries.
        $this->assertLessThan(10, $queryCount, "Query count was {$queryCount}, which indicates an N+1 query loop!");
    }
}
