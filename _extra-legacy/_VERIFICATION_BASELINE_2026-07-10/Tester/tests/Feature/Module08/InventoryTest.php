<?php

namespace Tests\Feature\Module08;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\TenantUser;
use Illuminate\Support\Facades\Hash;
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

    // Seed inventory_batches table (V3)
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'product_id' => $product->id,
        'warehouse_id' => $warehouseA->id,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

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

test('v3_stock_adjustments_synchronize_physical_stock_and_movement_records', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create Stock Adjustment Loss (6300) and Gain (4200) accounts
    \App\Models\Account::forceCreate([
        'tenant_id' => $tenant->id,
        'code' => '6300',
        'name' => 'Stock Adjustment Loss',
        'type' => 'expense',
        'normal_balance' => 'debit',
    ]);
    \App\Models\Account::forceCreate([
        'tenant_id' => $tenant->id,
        'code' => '4200',
        'name' => 'Stock Adjustment Gain',
        'type' => 'revenue',
        'normal_balance' => 'credit',
    ]);

    $warehouse = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main', 'code' => 'MAIN']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 100.00, 'stock_quantity' => 10]);

    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10,
    ]);

    // Seed a FIFO batch of 10
    $batchId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => $batchId,
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

    // 1. Trigger decrease of 3 units
    $payloadDecrease = [
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'direction' => 'decrease',
        'qty' => 3,
        'reason' => 'Damaged inventory',
    ];

    $response1 = $this->post("/s/{$tenant->slug}/v3/stock-adjustments", $payloadDecrease);
    $response1->assertRedirect();

    // Assert stock levels decremented to 7
    expect($product->fresh()->stock_quantity)->toEqual(7.0);
    $stock = \Illuminate\Support\Facades\DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->first();
    expect((float) $stock->quantity)->toEqual(7.0);

    // Assert FIFO batch decremented to 7
    $batch = \Illuminate\Support\Facades\DB::table('inventory_batches')->where('id', $batchId)->first();
    expect((float) $batch->remaining_qty)->toEqual(7.0);

    // Assert stock movement logged
    $movement = \Illuminate\Support\Facades\DB::table('stock_movements')
        ->where('product_id', $product->id)
        ->where('warehouse_id', $warehouse->id)
        ->where('quantity', -3.0)
        ->first();
    expect($movement)->not->toBeNull();
});

test('v3_stock_transfers_enforce_tenant_isolation_and_update_physical_stock', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseA = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'A', 'code' => 'W-A']);
    $warehouseB = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'B', 'code' => 'W-B']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 10]);

    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $warehouseA->id,
        'quantity' => 10,
    ]);

    $batchId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => $batchId,
        'product_id' => $product->id,
        'warehouse_id' => $warehouseA->id,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $payload = [
        'product_id' => $product->id,
        'from_warehouse_id' => $warehouseA->id,
        'to_warehouse_id' => $warehouseB->id,
        'qty' => 4,
        'reason' => 'Internal transfer',
    ];

    $response = $this->post("/s/{$tenant->slug}/v3/stock-transfers", $payload);
    $response->assertRedirect();

    // Assert Warehouse A stock = 6, Warehouse B stock = 4
    $stockA = \Illuminate\Support\Facades\DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouseA->id)->first();
    expect((float) $stockA->quantity)->toEqual(6.0);

    $stockB = \Illuminate\Support\Facades\DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouseB->id)->first();
    expect((float) $stockB->quantity)->toEqual(4.0);

    // Assert destination batch is created with correct tenant ID (isolation boundary)
    $destBatch = \Illuminate\Support\Facades\DB::table('inventory_batches')
        ->where('product_id', $product->id)
        ->where('warehouse_id', $warehouseB->id)
        ->first();
    expect($destBatch)->not->toBeNull();
    expect($destBatch->tenant_id)->toEqual($tenant->id);
    expect((float) $destBatch->remaining_qty)->toEqual(4.0);

    // Assert stock movements generated
    $outMovement = \Illuminate\Support\Facades\DB::table('stock_movements')
        ->where('product_id', $product->id)
        ->where('warehouse_id', $warehouseA->id)
        ->where('quantity', -4.0)
        ->first();
    expect($outMovement)->not->toBeNull();

    $inMovement = \Illuminate\Support\Facades\DB::table('stock_movements')
        ->where('product_id', $product->id)
        ->where('warehouse_id', $warehouseB->id)
        ->where('quantity', 4.0)
        ->first();
    expect($inMovement)->not->toBeNull();
});

test('prevents v3 stock transfer from reading or mutating another tenants batches', function () {
    $tenantA = $this->createTenant();
    $tenantB = $this->createTenant();

    $this->actingAsOwner($tenantA);
    $this->seedTenantDefaults($tenantA);

    $warehouseA = Warehouse::create(['tenant_id' => $tenantA->id, 'name' => 'A', 'code' => 'W-A']);
    $warehouseB = Warehouse::create(['tenant_id' => $tenantA->id, 'name' => 'B', 'code' => 'W-B']);
    $product = Product::factory()->create(['tenant_id' => $tenantA->id, 'cost_price' => 50, 'stock_quantity' => 10]);

    // Batch for Tenant B (should be invisible to Tenant A)
    $batchIdB = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenantB->id,
        'id' => $batchIdB,
        'product_id' => $product->id,
        'warehouse_id' => $warehouseA->id,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Attempt to transfer stock by tenant A (which has no batches in warehouse A)
    $payload = [
        'product_id' => $product->id,
        'from_warehouse_id' => $warehouseA->id,
        'to_warehouse_id' => $warehouseB->id,
        'qty' => 4,
        'reason' => 'Attacking tenant B stock',
    ];

    // Request should throw InsufficientStockException and fail
    $failed = false;
    try {
        $this->withoutExceptionHandling()->post("/s/{$tenantA->slug}/v3/stock-transfers", $payload);
    } catch (\App\Exceptions\InsufficientStockException $e) {
        $failed = true;
    }
    expect($failed)->toBeTrue();

    // Assert database has NOT modified Tenant B's batch
    $batchB = \Illuminate\Support\Facades\DB::table('inventory_batches')->where('id', $batchIdB)->first();
    expect((float) $batchB->remaining_qty)->toEqual(10.0);
});

test('manual stock adjustment requires correct passcode when enable_passcode is enabled', function () {
    $tenant = $this->createTenant();
    $owner = $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create Stock Adjustment Loss and Gain accounts
    \App\Models\Account::forceCreate([
        'tenant_id' => $tenant->id,
        'code' => '6300',
        'name' => 'Stock Adjustment Loss',
        'type' => 'expense',
        'normal_balance' => 'debit',
    ]);
    \App\Models\Account::forceCreate([
        'tenant_id' => $tenant->id,
        'code' => '4200',
        'name' => 'Stock Adjustment Gain',
        'type' => 'revenue',
        'normal_balance' => 'credit',
    ]);

    $warehouse = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main', 'code' => 'MAIN']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 100.00, 'stock_quantity' => 10]);

    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10,
    ]);

    $batchId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => $batchId,
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

    // Enable passcode setting
    \App\Models\Setting::updateOrCreate(['key' => 'enable_passcode'], ['value' => '1']);
    \App\Helpers\SettingsHelper::clearCache();

    // Set Owner Security PIN
    $membership = TenantUser::where('tenant_id', $tenant->id)
        ->where('user_id', auth()->id())
        ->first();
    $membership->update(['security_pin' => Hash::make('654321')]);

    $payload = [
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'direction' => 'decrease',
        'qty' => 2,
        'reason' => 'Damaged inventory',
        'passcode' => '000000', // Incorrect
    ];

    // 1. Assert request fails with incorrect passcode
    $response = $this->postJson("/s/{$tenant->slug}/v3/stock-adjustments", $payload);
    $response->assertStatus(403);
    expect($product->fresh()->stock_quantity)->toEqual(10.0);

    // 2. Assert request succeeds with correct passcode
    $payload['passcode'] = '654321';
    $response = $this->post("/s/{$tenant->slug}/v3/stock-adjustments", $payload);
    if (session('error')) {
        dd('Session error: ' . session('error'));
    }
    if (session('success')) {
        // Log success
    } else {
        dd('No success or error in session', session()->all());
    }
    $response->assertRedirect();
    expect($product->fresh()->stock_quantity)->toEqual(8.0);
});

