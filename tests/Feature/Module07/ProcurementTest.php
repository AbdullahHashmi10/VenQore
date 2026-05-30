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
