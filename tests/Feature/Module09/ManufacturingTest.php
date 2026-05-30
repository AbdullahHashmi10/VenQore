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
    $tenant = $this->createTenant();
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
    $tenant = $this->createTenant();
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
    $this->assertTrue(in_array($response->status(), [200, 201, 302]), "Production run returned {$response->status()}");

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
    $tenant = $this->createTenant();
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
    $this->assertTrue(in_array($startResponse->status(), [200, 201, 302]));

    $run = DB::table('production_runs')->where('bom_id', $bomId)->first();
    $this->assertNotNull($run);
    $this->assertEquals('in_progress', $run->status);

    // Complete run with actual_qty = 10
    $completeResponse = $this->post("/s/{$tenant->slug}/v3/production-runs/{$run->id}/complete", [
        'actual_qty' => 10,
    ]);
    $this->assertTrue(in_array($completeResponse->status(), [200, 201, 302]), "Complete returned {$completeResponse->status()}");

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
    $tenant = $this->createTenant();
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
    $this->assertTrue(in_array($response->status(), [200, 201, 302]), "Production run returned {$response->status()}");

    $run = DB::table('production_runs')->where('bom_id', $bomId)->first();
    $this->assertNotNull($run);

    // (3 mat1 × 2 × $20) + (1 mat2 × 2 × $50) = 120 + 100 = $220
    $this->assertEquals(220.0, (float) $run->material_cost, 'Assembly material_cost should be auto-calculated from FIFO batch unit costs.');
});
