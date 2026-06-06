<?php

namespace Tests\Feature\Module07;

use App\Models\Product;
use App\Models\Party;
use App\Models\Invoice as Purchase;
use App\Models\PurchaseItem;
use App\Models\InventoryBatch;
use Tests\Feature\VenQoreTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('fifo_batch_creation_on_purchase', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 60]);
    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main Warehouse']);

    $payload = [
        'tenant_id' => $tenant->id,
        'warehouse_id' => $warehouse->id,
        'date' => now()->toDateString(),
        'party_id' => $supplier->id,
        'status' => 'received',
        'payment_status' => 'paid',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 20,
                'price' => 60,
                'subtotal' => 1200
            ]
        ],
        'total_amount' => 1200,
        'amount_paid' => 1200,
        'payment_method' => 'cash',
    ];

    $response = $this->postJson("/s/{$tenant->slug}/purchases", $payload);
    $response->assertOk();

    // Assert one inventory_batches row exists with qty=20, cost=60, remaining_qty=20
    $this->assertDatabaseHas('inventory_batches', [
        'tenant_id' => $tenant->id,
        'product_id' => $product->id,
        'initial_qty' => 20,
        'remaining_qty' => 20,
        'unit_cost' => 60
    ]);
});

test('purchase_does_not_overwrite_product_base_cost_price', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50]);
    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main Warehouse']);

    $payload = [
        'tenant_id' => $tenant->id,
        'warehouse_id' => $warehouse->id,
        'date' => now()->toDateString(),
        'party_id' => $supplier->id,
        'status' => 'received',
        'payment_status' => 'paid',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 80,
                'subtotal' => 800
            ]
        ],
        'total_amount' => 800,
        'amount_paid' => 800,
        'payment_method' => 'cash',
    ];

    $response = $this->postJson("/s/{$tenant->slug}/purchases", $payload);
    $response->assertOk();

    // Assert product cost_price is still 50
    $this->assertEquals(50, $product->fresh()->cost_price);

    // Assert the batch stores 80
    $this->assertDatabaseHas('inventory_batches', [
        'tenant_id' => $tenant->id,
        'product_id' => $product->id,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'unit_cost' => 80
    ]);
});

test('partial_receiving_updates_order_status_and_stock_correctly', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 0]);
    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main Warehouse']);

    // 1. Create Purchase Order for 50 units
    $orderPayload = [
        'party_id' => $supplier->id,
        'date' => now()->toDateString(),
        'status' => 'pending',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 50,
                'price' => 50,
            ]
        ],
        'amount_paid' => 0,
        'payment_method' => 'credit',
    ];

    $response = $this->postJson("/s/{$tenant->slug}/purchases", $orderPayload);
    $response->assertSuccessful();

    $purchase = Purchase::latest()->first();
    $this->assertNotNull($purchase);
    $this->assertEquals('pending', $purchase->status);

    $invoiceItem = \Illuminate\Support\Facades\DB::table('invoice_items')->where('invoice_id', $purchase->id)->first();
    $this->assertNotNull($invoiceItem);

    // 2. Receive 30 units
    $receivePayload = [
        'items' => [
            [
                'item_id' => $invoiceItem->id,
                'receiving_qty' => 30,
            ]
        ]
    ];

    $receiveResponse = $this->postJson("/s/{$tenant->slug}/purchases/{$purchase->id}/receive", $receivePayload);
    $receiveResponse->assertOk();

    $purchase->refresh();

    // Assert received_qty=30 on invoice item
    $item = \Illuminate\Support\Facades\DB::table('invoice_items')->where('id', $invoiceItem->id)->first();
    $this->assertEquals(30, $item->received_qty);

    // Assert only 30 units added to stock
    $this->assertEquals(30, $product->fresh()->stock_quantity);

    // Assert order status is partial
    $this->assertEquals('partial', $purchase->status);
});

test('fifo_batch_poisoning_prevented_on_negative_or_zero_values', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $fifo = app(\App\Services\V3\FifoService::class);
    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id]);

    // Assert receive negative throws exception
    $failed = false;
    try {
        $fifo->receiveBatch($product->id, $warehouse->id, 10, -5.00);
    } catch (\InvalidArgumentException $e) {
        $failed = true;
        expect($e->getMessage())->toBe('Unit cost cannot be negative.');
    }
    expect($failed)->toBeTrue();

    // Assert receive zero or negative quantity throws exception
    $failedQty = false;
    try {
        $fifo->receiveBatch($product->id, $warehouse->id, 0, 10.00);
    } catch (\InvalidArgumentException $e) {
        $failedQty = true;
        expect($e->getMessage())->toBe('Quantity must be strictly positive.');
    }
    expect($failedQty)->toBeTrue();
});

test('multi_click_receiving_prevents_duplicate_batches_and_stock_bloat', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 0]);
    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main']);

    $purchase = \App\Models\Invoice::create([
        'tenant_id' => $tenant->id,
        'type' => 'purchase',
        'invoice_number' => 'PUR-12345',
        'party_id' => $supplier->id,
        'date' => now()->toDateString(),
        'total_amount' => 500,
        'status' => 'pending',
        'user_id' => auth()->id() ?? 1,
    ]);

    $invoiceItemId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('invoice_items')->insert([
        'id' => $invoiceItemId,
        'tenant_id' => $tenant->id,
        'invoice_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'unit_price' => 50,
        'base_unit_cost' => 50,
        'effective_unit_cost' => 50,
        'total' => 500,
        'received_qty' => 0,
    ]);

    // Mock first receive request
    $payload = [
        'items' => [
            [
                'item_id' => $invoiceItemId,
                'receiving_qty' => 10,
            ]
        ]
    ];

    // Send first request - should succeed
    $response1 = $this->postJson("/s/{$tenant->slug}/purchases/{$purchase->id}/receive", $payload);
    $response1->assertOk();

    // Send duplicate request - should fail with 422 because item is fully received
    $response2 = $this->postJson("/s/{$tenant->slug}/purchases/{$purchase->id}/receive", $payload);
    $response2->assertStatus(422);

    // Assert final stock is exactly 10, not 20
    expect($product->fresh()->stock_quantity)->toEqual(10.0);
    expect(InventoryBatch::where('product_id', $product->id)->count())->toEqual(1);
});

test('purchase_returns_synchronizes_physical_stock_and_movement_records', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 10]);
    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main']);

    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10,
    ]);

    $purchaseId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('purchases')->insert([
        'id' => $purchaseId,
        'tenant_id' => $tenant->id,
        'invoice_number' => 'PUR-RET',
        'party_id' => $supplier->id,
        'warehouse_id' => $warehouse->id,
        'purchase_date' => now()->toDateString(),
        'subtotal' => 500,
        'tax' => 0,
        'total' => 500,
        'payment_status' => 'paid',
        'payment_method' => 'cash',
        'journal_entry_id' => \Illuminate\Support\Str::uuid()->toString(),
        'created_by' => auth()->id() ?? 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $batchId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => $batchId,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'purchase_invoice_id' => $purchaseId,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $purchaseItemId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('purchase_items')->insert([
        'id' => $purchaseItemId,
        'tenant_id' => $tenant->id,
        'purchase_id' => $purchaseId,
        'product_id' => $product->id,
        'qty' => 10,
        'unit_cost' => 50.00,
        'line_total' => 500.00,
        'inventory_batch_id' => $batchId,
        'created_at' => now(),
    ]);

    $payload = [
        'return_date' => now()->toDateString(),
        'reason' => 'Defective batch',
        'items' => [
            [
                'purchase_item_id' => $purchaseItemId,
                'inventory_batch_id' => $batchId,
                'return_qty' => 6, // returning 6 units
            ]
        ]
    ];

    $response = $this->post("/s/{$tenant->slug}/v3/purchases/{$purchaseId}/return", $payload);
    $response->assertRedirect();

    // Assert FIFO batch updated (remaining_qty = 10 - 6 = 4)
    $batch = \Illuminate\Support\Facades\DB::table('inventory_batches')->where('id', $batchId)->first();
    expect((float) $batch->remaining_qty)->toEqual(4.0);

    // Assert physical product and stock quantities updated (10 - 6 = 4)
    expect($product->fresh()->stock_quantity)->toEqual(4.0);
    $stock = \Illuminate\Support\Facades\DB::table('stocks')->where('product_id', $product->id)->first();
    expect((float) $stock->quantity)->toEqual(4.0);

    // Assert StockMovement generated
    $movement = \Illuminate\Support\Facades\DB::table('stock_movements')
        ->where('product_id', $product->id)
        ->where('type', 'purchase_return')
        ->first();
    expect($movement)->not->toBeNull();
    expect((float) $movement->quantity)->toEqual(-6.0);
});
