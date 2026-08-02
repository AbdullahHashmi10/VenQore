<?php

namespace Tests\Feature\Module09;

use App\Models\Product;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

// ─── Shared test helper ───────────────────────────────────────────────────────

/**
 * Seed a raw material product into inventory (both stocks and inventory_batches).
 * Uses the columns that actually exist in the FIFO migration:
 *   id, product_id, warehouse_id, original_qty, remaining_qty, unit_cost,
 *   batch_type (V3), created_at, updated_at
 */
function seedRawMaterial(object $tenant, string $warehouseId, Product $product, float $qty, float $unitCost = 50.0): void
{
    DB::table('inventory_batches')->insert([
        'id'            => Str::uuid()->toString(),
        'tenant_id'     => $tenant->id,
        'product_id'    => $product->id,
        'warehouse_id'  => $warehouseId,
        'original_qty'  => $qty,
        'remaining_qty' => $qty,
        'unit_cost'     => $unitCost,
        'batch_type'    => 'purchase',
        'created_at'    => now(),
        'updated_at'    => now(),
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $warehouseId],
        ['quantity' => $qty]
    );
}

// ─── Test 1: BOM Defined Correctly ───────────────────────────────────────────
test('bill_of_materials_defined_correctly', function () {
    $tenant = $this->createTenant(null, 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $rawMaterial1 = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Flour',       'is_manufactured' => 0]);
    $rawMaterial2 = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Sugar',       'is_manufactured' => 0]);
    $cake         = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Cake (Mfg)', 'is_manufactured' => 1]);

    // POST to /v3/boms to define the recipe
    $bomResponse = $this->post("/s/{$tenant->slug}/v3/boms", [
        'product_id'     => $cake->id,
        'version'        => 1,
        'effective_from' => today()->toDateString(),
        'items'          => [
            ['product_id' => $rawMaterial1->id, 'qty_per_unit' => 2.0],
            ['product_id' => $rawMaterial2->id, 'qty_per_unit' => 1.0],
        ],
    ]);
    // BomController::store() returns redirect(back()) on success
    $this->assertTrue(in_array($bomResponse->status(), [200, 201, 302]), "BOM creation returned {$bomResponse->status()}");

    // Assert the BOM header exists in bill_of_materials
    $bom = DB::table('bill_of_materials')
        ->where('product_id', $cake->id)
        ->where('is_active', 1)
        ->first();
    $this->assertNotNull($bom, 'Active BOM header should be created for the finished product.');

    // Assert both ingredients exist as bom_items
    $this->assertDatabaseHas('bom_items', [
        'bom_id'     => $bom->id,
        'product_id' => $rawMaterial1->id,
    ]);
    $this->assertDatabaseHas('bom_items', [
        'bom_id'     => $bom->id,
        'product_id' => $rawMaterial2->id,
    ]);
});

// ─── Test 2: Production Run Consumes Raw Materials ────────────────────────────
test('production run consumes raw materials', function () {
    $tenant = $this->createTenant(null, 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

    $cake  = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Cake PR', 'is_manufactured' => 1]);
    $flour = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Flour PR', 'is_manufactured' => 0]);
    $sugar = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Sugar PR', 'is_manufactured' => 0]);

    // Stock: 20 flour at $50 each, 10 sugar at $100 each
    seedRawMaterial($tenant, $warehouseId, $flour, 20.0, 50.0);
    seedRawMaterial($tenant, $warehouseId, $sugar, 10.0, 100.0);

    // Create BOM directly (bypassing controller for setup speed)
    $bomId = Str::uuid()->toString();
    DB::table('bill_of_materials')->insert([
        'id'             => $bomId,
        'tenant_id'      => $tenant->id,
        'product_id'     => $cake->id,
        'version'        => 1,
        'effective_from' => today()->toDateString(),
        'is_active'      => 1,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);
    DB::table('bom_items')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId, 'product_id' => $flour->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0, 'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now()],
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId, 'product_id' => $sugar->id, 'qty_per_unit' => 1.0, 'is_byproduct' => 0, 'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now()],
    ]);

    // Start production run for 5 cakes → uses 10 flour + 5 sugar
    $response = $this->post("/s/{$tenant->slug}/v3/production-runs", [
        'bom_id'       => $bomId,
        'warehouse_id' => $warehouseId,
        'planned_qty'  => 5,
        'run_date'     => today()->toDateString(),
    ]);
    // ProductionRunController::store() always redirect()->back() — it never
    // returns 200/201 on success, so those were dead branches, not real
    // alternate outcomes. assertRedirect + no session errors catches both a
    // validation failure (still 302, but with 'errors' in session) and a
    // genuine 4xx/5xx, which the old multi-status check could not.
    $response->assertRedirect();
    $response->assertSessionDoesntHaveErrors();

    // Assert flour FIFO: 20 - 10 = 10
    $flourRemaining = DB::table('inventory_batches')
        ->where('product_id', $flour->id)->sum('remaining_qty');
    $this->assertEquals(10.0, (float) $flourRemaining, 'Flour consumed: 2/unit × 5 units = 10.');

    // Assert sugar FIFO: 10 - 5 = 5
    $sugarRemaining = DB::table('inventory_batches')
        ->where('product_id', $sugar->id)->sum('remaining_qty');
    $this->assertEquals(5.0, (float) $sugarRemaining, 'Sugar consumed: 1/unit × 5 units = 5.');
});

// ─── Test 3: Production Run Produces Finished Goods ──────────────────────────
test('production run produces finished goods', function () {
    $tenant = $this->createTenant(null, 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

    $bread = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Bread FG', 'is_manufactured' => 1]);
    $wheat = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Wheat FG', 'is_manufactured' => 0]);

    seedRawMaterial($tenant, $warehouseId, $wheat, 50.0, 40.0);

    $bomId = Str::uuid()->toString();
    DB::table('bill_of_materials')->insert([
        'id'             => $bomId, 'tenant_id' => $tenant->id, 'product_id' => $bread->id,
        'version'        => 1, 'effective_from' => today()->toDateString(), 'is_active' => 1,
        'created_at'     => now(), 'updated_at' => now(),
    ]);
    DB::table('bom_items')->insert([
        'id' => Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId,
        'product_id' => $wheat->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0,
        'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now(),
    ]);

    // Start run
    $startResponse = $this->post("/s/{$tenant->slug}/v3/production-runs", [
        'bom_id' => $bomId, 'warehouse_id' => $warehouseId,
        'planned_qty' => 10, 'run_date' => today()->toDateString(),
    ]);
    // Both endpoints always redirect()->back() — see the fix note in
    // 'production run consumes raw materials' above for why 200/201 were
    // dead branches that couldn't actually occur.
    $startResponse->assertRedirect();
    $startResponse->assertSessionDoesntHaveErrors();

    $run = DB::table('production_runs')->where('bom_id', $bomId)->first();
    $this->assertNotNull($run);
    $this->assertEquals('in_progress', $run->status);

    // Complete run with actual_qty = 10
    $completeResponse = $this->post("/s/{$tenant->slug}/v3/production-runs/{$run->id}/complete", [
        'actual_qty' => 10,
    ]);
    $completeResponse->assertRedirect();
    $completeResponse->assertSessionDoesntHaveErrors();

    // Assert a manufactured FIFO batch was created for the finished-good
    $finishedBatch = DB::table('inventory_batches')
        ->where('product_id', $bread->id)
        ->where('batch_type', 'manufactured')
        ->first();
    $this->assertNotNull($finishedBatch, 'A manufactured FIFO batch should be created for the finished good.');
    $this->assertEquals(10.0, (float) $finishedBatch->original_qty);

    // Run should be 'completed'
    $completedRun = DB::table('production_runs')->where('id', $run->id)->first();
    $this->assertEquals('completed', $completedRun->status);
});

// ─── Test 4: Auto-Calculate Assembly Cost ────────────────────────────────────
test('auto calculate assembly cost', function () {
    $tenant = $this->createTenant(null, 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Assembly FG', 'is_manufactured' => 1]);
    $mat1    = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Mat A AC',   'is_manufactured' => 0]);
    $mat2    = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Mat B AC',   'is_manufactured' => 0]);

    // mat1: $20 each, mat2: $50 each
    // BOM: 3 mat1 per finished unit + 1 mat2 per finished unit
    // For 2 finished units: (3×2×$20) + (1×2×$50) = $120 + $100 = $220
    seedRawMaterial($tenant, $warehouseId, $mat1, 30.0, 20.0);
    seedRawMaterial($tenant, $warehouseId, $mat2, 10.0, 50.0);

    $bomId = Str::uuid()->toString();
    DB::table('bill_of_materials')->insert([
        'id' => $bomId, 'tenant_id' => $tenant->id, 'product_id' => $product->id,
        'version' => 1, 'effective_from' => today()->toDateString(), 'is_active' => 1,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    DB::table('bom_items')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId, 'product_id' => $mat1->id, 'qty_per_unit' => 3.0, 'is_byproduct' => 0, 'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now()],
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId, 'product_id' => $mat2->id, 'qty_per_unit' => 1.0, 'is_byproduct' => 0, 'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now()],
    ]);

    $response = $this->post("/s/{$tenant->slug}/v3/production-runs", [
        'bom_id'       => $bomId,
        'warehouse_id' => $warehouseId,
        'planned_qty'  => 2,
        'run_date'     => today()->toDateString(),
    ]);
    $response->assertRedirect();
    $response->assertSessionDoesntHaveErrors();

    $run = DB::table('production_runs')->where('bom_id', $bomId)->first();
    $this->assertNotNull($run);

    // (3 mat1 × 2 × $20) + (1 mat2 × 2 × $50) = 120 + 100 = $220
    $this->assertEquals(220.0, (float) $run->material_cost, 'Assembly material_cost should be auto-calculated from FIFO batch unit costs.');
});

test('v3_production_runs_synchronize_physical_stock_and_movement_records', function () {
    $tenant = $this->createTenant(null, 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseId = \Illuminate\Support\Facades\DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
    $cake = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Cake FG', 'is_manufactured' => 1]);
    $flour = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Flour RM', 'is_manufactured' => 0]);

    seedRawMaterial($tenant, $warehouseId, $flour, 20.0, 50.0);

    $bomId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('bill_of_materials')->insert([
        'id'             => $bomId,
        'tenant_id'      => $tenant->id,
        'product_id'     => $cake->id,
        'version'        => 1,
        'effective_from' => today()->toDateString(),
        'is_active'      => 1,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);
    \Illuminate\Support\Facades\DB::table('bom_items')->insert([
        'id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId,
        'product_id' => $flour->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0,
        'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now(),
    ]);

    // Start run (consumes 10 flour)
    $response = $this->post("/s/{$tenant->slug}/v3/production-runs", [
        'bom_id'       => $bomId,
        'warehouse_id' => $warehouseId,
        'planned_qty'  => 5,
        'run_date'     => today()->toDateString(),
    ]);
    $response->assertRedirect();

    // Assert physical Flour stock decremented to 10
    $flourStock = \App\Models\Stock::where('product_id', $flour->id)->where('warehouse_id', $warehouseId)->first()->quantity;
    expect((float) $flourStock)->toEqual(10.0);

    // Assert Flour stock movement logged
    $flourMovement = \Illuminate\Support\Facades\DB::table('stock_movements')
        ->where('product_id', $flour->id)
        ->where('warehouse_id', $warehouseId)
        ->where('quantity', -10.0)
        ->first();
    expect($flourMovement)->not->toBeNull();

    $run = \Illuminate\Support\Facades\DB::table('production_runs')->where('bom_id', $bomId)->first();

    // Complete run
    $responseComplete = $this->post("/s/{$tenant->slug}/v3/production-runs/{$run->id}/complete", [
        'actual_qty' => 5,
    ]);
    $responseComplete->assertRedirect();

    // Assert physical Cake stock incremented to 5
    $cakeStock = \App\Models\Stock::where('product_id', $cake->id)->where('warehouse_id', $warehouseId)->first()->quantity;
    expect((float) $cakeStock)->toEqual(5.0);

    // Assert Cake stock movement logged
    $cakeMovement = \Illuminate\Support\Facades\DB::table('stock_movements')
        ->where('product_id', $cake->id)
        ->where('warehouse_id', $warehouseId)
        ->where('quantity', 5.0)
        ->first();
    expect($cakeMovement)->not->toBeNull();
});

test('prevents_concurrent_deductions_from_violating_negative_stock_helper_rule', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseId = \Illuminate\Support\Facades\DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50.0]);

    // Seed 10 items
    seedRawMaterial($tenant, $warehouseId, $product, 10.0, 50.0);

    // Enforce stop negative stock
    $setting = \Illuminate\Support\Facades\DB::table('settings')
        ->where('tenant_id', $tenant->id)
        ->where('key', 'stop_sale_negative_stock')
        ->first();

    if ($setting) {
        \Illuminate\Support\Facades\DB::table('settings')
            ->where('id', $setting->id)
            ->update(['value' => '1', 'updated_at' => now()]);
    } else {
        \Illuminate\Support\Facades\DB::table('settings')->insert([
            'id'         => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id'  => $tenant->id,
            'key'        => 'stop_sale_negative_stock',
            'value'      => '1',
            'group'      => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    \App\Helpers\SettingsHelper::clearCache();

    $fifo = resolve(\App\Services\V3\FifoService::class);

    // Deducting 8 should succeed
    $fifo->deductStock($product->id, $warehouseId, 8.0);

    // Deducting another 8 should throw InsufficientStockException and NOT generate negative stock
    $failed = false;
    try {
        $fifo->deductStock($product->id, $warehouseId, 8.0);
    } catch (\App\Exceptions\InsufficientStockException $e) {
        $failed = true;
    }

    expect($failed)->toBeTrue();
    $remaining = \Illuminate\Support\Facades\DB::table('inventory_batches')
        ->where('product_id', $product->id)
        ->where('warehouse_id', $warehouseId)
        ->sum('remaining_qty');
    expect((float) $remaining)->toEqual(2.0); // Remains at 2, not -6
});

test('prevents_deleting_or_archiving_product_when_active_in_any_bom', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $rawMaterial = Product::factory()->create(['tenant_id' => $tenant->id, 'is_manufactured' => 0]);
    $finishedGood = Product::factory()->create(['tenant_id' => $tenant->id, 'is_manufactured' => 1]);

    $bomId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('bill_of_materials')->insert([
        'id'             => $bomId,
        'tenant_id'      => $tenant->id,
        'product_id'     => $finishedGood->id,
        'version'        => 1,
        'effective_from' => today()->toDateString(),
        'is_active'      => 1,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);
    \Illuminate\Support\Facades\DB::table('bom_items')->insert([
        'id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId,
        'product_id' => $rawMaterial->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0,
        'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now(),
    ]);

    // Attempting to delete $rawMaterial should fail with validation error because it is in a BOM
    $response = $this->delete("/s/{$tenant->slug}/v3/products/{$rawMaterial->id}");
    $response->assertSessionHasErrors();

    // Verify product is still active and in database
    $rawMaterial = $rawMaterial->fresh();
    expect($rawMaterial->deleted_at)->toBeNull();
    expect($rawMaterial->is_active)->toEqual(1);
});
