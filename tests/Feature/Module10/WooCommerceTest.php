<?php

namespace Tests\Feature\Module10;

use App\Models\Product;
use Tests\Feature\VenQoreTestCase;


test('woocommerce_failure_does_not_affect_sale_creation', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Disable woo sync via settings or mock
    \App\Models\Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => 'woocommerce_sync_enabled'], ['value' => 'true']);
    \App\Models\Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => 'woocommerce_store_url'], ['value' => 'https://invalid.example.com']);
    \App\Models\Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => 'woocommerce_consumer_key'], ['value' => 'invalid']);
    \App\Models\Setting::updateOrCreate(['tenant_id' => $tenant->id, 'key' => 'woocommerce_consumer_secret'], ['value' => 'invalid']);

    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 1000]);

    $party = \App\Models\Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();

    $payload = [
        'customer_id' => $party->id,
        'warehouse_id' => $warehouse->id,
        'sale_date' => now()->toDateString(),
        'tenant_id' => $tenant->id,
        'status' => 'completed',
        'payment_status' => 'paid',
        'payment_method' => 'cash',
        'amount_paid' => 1000,
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 1,
                'sale_uom' => 'pcs',
                'unit_price' => 1000,
                'subtotal' => 1000
            ]
        ]
    ];

    $response = $this->postJson("/s/{$tenant->slug}/v3/sales", $payload);
    $this->assertTrue(in_array($response->status(), [200, 201, 302]));

    // Assert sale is in DB
    $this->assertDatabaseHas('sales', [
        'tenant_id' => $tenant->id
    ]);
});

test('webhook_creates_party_and_records_transaction', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Override WooCommerce plan limit so PlanGate allows the webhook
    \Illuminate\Support\Facades\DB::table('tenant_plan_overrides')->insert([
        'tenant_id' => $tenant->id,
        'override_key' => 'woocommerce',
        'override_value' => '1',
        'applied_by' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'sku' => 'TEST-SKU', 'price' => 100]);

    // Seed stock for standard item deduction
    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'warehouse_id' => \App\Models\Warehouse::where('tenant_id', $tenant->id)->first()->id,
        'product_id' => $product->id,
        'quantity' => 1000,
        'status' => 'available',
    ]);

    $payload = [
        'id' => 9999,
        'status' => 'processing',
        'billing' => [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ],
        'line_items' => [
            [
                'sku' => 'TEST-SKU',
                'quantity' => 2,
            ]
        ],
        'total' => '200.00'
    ];

    $response = $this->postJson("/woocommerce/webhook", $payload);
    $response->assertOk();
    
    // Check if a party was created
    $this->assertDatabaseHas('parties', [
        'tenant_id' => $tenant->id,
        'name' => 'Web Customer'
    ]);

    // Check if transaction was recorded
    $this->assertDatabaseHas('transactions', [
        'tenant_id' => $tenant->id,
        'invoice_id' => 'WC-9999'
    ]);
});

test('tampered_webhook_rejected', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create a WooConnection for signature verification
    $conn = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Woo Store',
        'site_url' => 'https://example.com',
        'uuid' => 'some-test-uuid',
        'consumer_key' => 'ck_test',
        'consumer_secret' => 'cs_test',
        'webhook_secret' => 'valid_secret',
        'status' => 'active',
    ]);

    $payload = [
        'id' => 9999,
        'status' => 'processing'
    ];

    $response = $this->postJson("/api/woo/webhook/some-test-uuid", $payload, [
        'x-wc-webhook-signature' => 'invalid_signature'
    ]);
    
    // It should be rejected with 401
    $response->assertStatus(401);
});
