<?php

use App\Models\Product;
use App\Models\Stock;
use App\Models\Party;
use App\Models\Sale;
use App\Models\JournalEntry;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = $this->createTenant('cascade-delete-store', 'ltd_3');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
});

test('C3: deleting a product directly at DB level is blocked or does not cascade-delete financial rows', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    $batchId = Str::uuid()->toString();
    DB::table('inventory_batches')->insert([
        'id' => $batchId,
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $party = Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);

    $payload = [
        'customer_id' => $party->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 200.00,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'amount_paid' => 400.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    // Verify records exist
    $saleItemCount = DB::table('sale_items')->where('product_id', $product->id)->count();
    $inventoryBatchCount = DB::table('inventory_batches')->where('product_id', $product->id)->count();
    $this->assertGreaterThan(0, $saleItemCount);
    $this->assertGreaterThan(0, $inventoryBatchCount);

    // Attempt to delete product
    try {
        DB::table('products')->where('id', $product->id)->delete();
    } catch (\Throwable $e) {
        // FK RESTRICT constraint threw an error, which is an expected safe outcome.
    }

    // Assert that the counts are unchanged
    $this->assertEquals($saleItemCount, DB::table('sale_items')->where('product_id', $product->id)->count());
    $this->assertEquals($inventoryBatchCount, DB::table('inventory_batches')->where('product_id', $product->id)->count());
});

test('C3: deleting a party directly at DB level is blocked or does not cascade-delete financial rows', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    $party = Party::factory()->customer()->create([
        'tenant_id' => $this->tenant->id,
        'credit_limit' => 10000.00,
    ]);

    $payload = [
        'customer_id' => $party->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 200.00,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'amount_paid' => 0, // unpaid
        'payment_method' => 'credit',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    // Verify records exist. Note: some systems populate transactions or journal entries/items referencing the party.
    // Let's verify ledger entries or transactions.
    $salesCount = DB::table('sales')->where('party_id', $party->id)->count();
    $this->assertGreaterThan(0, $salesCount);

    // Let's check journal_entries party reference
    $journalEntriesCount = DB::table('journal_entries')->where('party_id', $party->id)->count();
    $this->assertGreaterThan(0, $journalEntriesCount);

    // Attempt to delete party
    try {
        DB::table('parties')->where('id', $party->id)->delete();
    } catch (\Throwable $e) {
        // FK RESTRICT threw an error, which is safe.
    }

    // Verify financial rows still exist: either we blocked the delete OR party_id was set null but row survives.
    // If party still exists:
    if (DB::table('parties')->where('id', $party->id)->exists()) {
        $this->assertEquals($salesCount, DB::table('sales')->where('party_id', $party->id)->count());
        $this->assertEquals($journalEntriesCount, DB::table('journal_entries')->where('party_id', $party->id)->count());
    } else {
        // If deleted (e.g. SET NULL was configured for journal_entries.party_id), the rows themselves must survive
        $this->assertEquals($salesCount, DB::table('sales')->count());
        $this->assertEquals($journalEntriesCount, DB::table('journal_entries')->count());
    }
});

test('C3: deleting a warehouse directly at DB level is blocked or does not cascade-delete financial rows', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
        'tax_rate' => 0,
    ]);

    $warehouse = Warehouse::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'C3 Test Warehouse',
        'address' => '123 Test St',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],
        ['quantity' => 10]
    );

    $batchId = Str::uuid()->toString();
    DB::table('inventory_batches')->insert([
        'id' => $batchId,
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'unit_cost' => 100.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $party = Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);

    $payload = [
        'customer_id' => $party->id,
        'warehouse_id' => $warehouse->id,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 200.00,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'amount_paid' => 400.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    // Verify records exist
    $salesCount = DB::table('sales')->where('warehouse_id', $warehouse->id)->count();
    $inventoryBatchCount = DB::table('inventory_batches')->where('warehouse_id', $warehouse->id)->count();
    $this->assertGreaterThan(0, $salesCount);
    $this->assertGreaterThan(0, $inventoryBatchCount);

    // Attempt to delete warehouse
    try {
        DB::table('warehouses')->where('id', $warehouse->id)->delete();
    } catch (\Throwable $e) {
        // Expected blocked or safe.
    }

    if (DB::table('warehouses')->where('id', $warehouse->id)->exists()) {
        $this->assertEquals($salesCount, DB::table('sales')->where('warehouse_id', $warehouse->id)->count());
        $this->assertEquals($inventoryBatchCount, DB::table('inventory_batches')->where('warehouse_id', $warehouse->id)->count());
    } else {
        // If deleted, check that the referenced records still exist (warehouse_id was nulled, not cascaded)
        // inventory_batches.warehouse_id is SET NULL.
        // sales.warehouse_id is RESTRICT. Thus, deleting the warehouse must have failed.
        $this->fail('Warehouse was deleted, but it has RESTRICT foreign keys on sales!');
    }
});

test('C3: deleting a product directly at DB level does not delete its stock movements', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
        'tax_rate' => 0,
    ]);

    // Insert a stock movement directly
    DB::table('stock_movements')->insert([
        'id' => Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'quantity' => 10.00,
        'type' => 'in',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $movementCount = DB::table('stock_movements')->where('product_id', $product->id)->count();
    $this->assertEquals(1, $movementCount);

    // Attempt to delete product
    try {
        DB::table('products')->where('id', $product->id)->delete();
    } catch (\Throwable $e) {
        // FK RESTRICT blocks the delete.
    }

    // Verify stock movement still exists
    $this->assertEquals(1, DB::table('stock_movements')->where('product_id', $product->id)->count());
});

test('C3: deleting a sale directly at DB level does not delete its manufacturing logs', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
    ]);

    $sale = Sale::create([
        'tenant_id' => $this->tenant->id,
        'warehouse_id' => $this->warehouseId,
        'subtotal' => 500,
        'discount' => 0,
        'tax' => 0,
        'total' => 500,
        'net_sales' => 500,
        'invoice_total' => 500,
        'payment_method' => 'cash',
        'user_id' => auth()->id(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Insert manufacturing rule and log referencing the sale
    $ruleId = Str::uuid()->toString();
    DB::table('manufacturing_rules')->insert([
        'id' => $ruleId,
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('manufacturing_logs')->insert([
        'id' => Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'rule_id' => $ruleId,
        'sale_id' => $sale->id,
        'user_id' => auth()->id(),
        'quantity_produced' => 1.00,
        'manufactured_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $mfgLogCount = DB::table('manufacturing_logs')->where('sale_id', $sale->id)->count();
    $this->assertEquals(1, $mfgLogCount);

    // Attempt to delete sale
    try {
        DB::table('sales')->where('id', $sale->id)->delete();
    } catch (\Throwable $e) {
        // FK RESTRICT blocks the delete.
    }

    // Verify manufacturing log still exists
    $this->assertEquals(1, DB::table('manufacturing_logs')->where('sale_id', $sale->id)->count());
});

