<?php

namespace Tests\Feature\Module08;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use Tests\Feature\VenQoreTestCase;



test('stock transfer between warehouses preserves total stock', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseA = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Warehouse A', 'code' => 'W-A']);
    $warehouseB = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Warehouse B', 'code' => 'W-B']);

    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'stock_quantity' => 10,
    ]);

    \App\Models\Stock::firstOrCreate(
        ['tenant_id' => $tenant->id, 'product_id' => $product->id, 'warehouse_id' => $warehouseA->id],
        ['quantity' => 10]
    );

    $payload = [
        'from_warehouse_id' => $warehouseA->id,
        'to_warehouse_id' => $warehouseB->id,
        'transfer_date' => now()->toDateString(),
        'status' => 'completed',
        'notes' => 'Transferring some stock',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 4,
            ]
        ]
    ];

    $response = $this->postJson("/s/{$tenant->slug}/stock-transfers", $payload);
    $response->assertRedirect();

    // Assert Warehouse A has 6
    $stockA = \App\Models\Stock::where('product_id', $product->id)->where('warehouse_id', $warehouseA->id)->first()->quantity;
    $this->assertEquals(6, $stockA);

    // Assert Warehouse B has 4
    $stockB = \App\Models\Stock::where('product_id', $product->id)->where('warehouse_id', $warehouseB->id)->first()->quantity;
    $this->assertEquals(4, $stockB);

    // Total stock unchanged at 10
    $this->assertEquals(10, $product->fresh()->stock_quantity);
});

test('stock take records discrepancy and adjusts stock', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create Stock Adjustment Loss account (6300) so adjustStock doesn't fail
    \App\Models\Account::forceCreate([
        'tenant_id' => $tenant->id,
        'code' => '6300',
        'name' => 'Stock Adjustment Loss',
        'type' => 'expense',
        'normal_balance' => 'debit',
    ]);

    $warehouse = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main', 'code' => 'MAIN']);

    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'stock_quantity' => 10,
        'cost_price' => 100.00,
    ]);

    // Seed Stock table (legacy)
    \App\Models\Stock::firstOrCreate(
        ['tenant_id' => $tenant->id, 'product_id' => $product->id, 'warehouse_id' => $warehouse->id],
        ['quantity' => 10]
    );

    // Seed inventory_batches table (V3)
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'batch_type' => 'purchase',
        'unit_cost' => 100.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'warehouse_id' => $warehouse->id,
        'date' => now()->toDateString(),
        'status' => 'completed',
        'notes' => 'Lost in transit',
        'items' => [
            [
                'product_id' => $product->id,
                'counted_quantity' => 8,
            ]
        ]
    ];

    $response = $this->postJson("/s/{$tenant->slug}/stock-audit", $payload);
    $response->assertRedirect();

    // Assert discrepancy logged in stock_take_items
    $this->assertDatabaseHas('stock_take_items', [
        'product_id' => $product->id,
        'counted_quantity' => 8,
        'difference' => -2,
    ]);

    // Assert V3 inventory batches adjusted to 8
    $totalRemaining = \Illuminate\Support\Facades\DB::table('inventory_batches')
        ->where('product_id', $product->id)
        ->where('warehouse_id', $warehouse->id)
        ->sum('remaining_qty');
    $this->assertEquals(8, $totalRemaining);
});

test('autoHealStockIntegrity is not called in normal flow', function () {
    $dashboardCode = file_get_contents(app_path('Http/Controllers/DashboardController.php'));
    $inventoryCode = file_get_contents(app_path('Http/Controllers/InventoryController.php'));

    $this->assertStringNotContainsString('$this->autoHealStockIntegrity();', $dashboardCode);
    $this->assertStringNotContainsString('$this->autoHealStockIntegrity();', $inventoryCode);
});

test('product edit does not reset stock', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'name' => 'Old Name',
        'price' => 100,
        'stock_quantity' => 10,
    ]);

    $payload = [
        'name' => 'New Name',
        'sale_price' => 200,
        'sku' => $product->sku,
        'base_unit' => $product->base_unit ?? 'pcs',
        'cost_price' => $product->cost_price ?? 100,
        // specifically NOT sending stock_quantity
    ];

    $response = $this->putJson("/s/{$tenant->slug}/v3/products/{$product->id}", $payload);
    $response->assertRedirect();

    $product->refresh();
    $this->assertEquals('New Name', $product->name);
    $this->assertEquals(200, $product->price);
    $this->assertEquals(10, $product->stock_quantity); // Stock must remain 10
});
