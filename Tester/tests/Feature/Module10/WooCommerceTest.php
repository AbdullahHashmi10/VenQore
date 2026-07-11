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

    // Create a connection for signature and tenant resolution
    $conn = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Test Connection',
        'site_url' => 'https://example.com',
        'uuid' => 'test-webhook-uuid',
        'consumer_key' => 'ck_test',
        'consumer_secret' => 'cs_test',
        'webhook_secret' => 'test_secret',
        'status' => 'active',
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

    $body = json_encode($payload);
    $signature = base64_encode(hash_hmac('sha256', $body, 'test_secret', true));

    $response = $this->postJson("/woocommerce/webhook/test-webhook-uuid", $payload, [
        'x-wc-webhook-signature' => $signature
    ]);
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

    // Check if double-entry journal entry was posted
    $this->assertDatabaseHas('journal_entries', [
        'tenant_id' => $tenant->id,
        'reference' => 'WC-9999',
        'reference_type' => 'sale',
    ]);

    // Check if the journal items balance correctly
    $entry = \App\Models\JournalEntry::where('tenant_id', $tenant->id)
        ->where('reference', 'WC-9999')
        ->first();

    $this->assertNotNull($entry, 'Journal entry should be created');

    $this->assertDatabaseHas('journal_items', [
        'journal_entry_id' => $entry->id,
        'account_code' => '1000', // Cash (DR)
        'debit' => 200.00,
        'credit' => 0.00,
    ]);

    $this->assertDatabaseHas('journal_items', [
        'journal_entry_id' => $entry->id,
        'account_code' => '4000', // Sales Revenue (CR)
        'debit' => 0.00,
        'credit' => 200.00,
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

test('webhook_channel_resolution_strictly_isolates_and_verifies_by_uuid', function () {
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

    $conn = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Secure Store',
        'site_url' => 'https://example.com',
        'uuid' => 'secure-connection-uuid',
        'consumer_key' => 'ck_test',
        'consumer_secret' => 'cs_test',
        'webhook_secret' => 'super_secret',
        'status' => 'active',
    ]);

    $payload = [
        'id' => 12345,
        'line_items' => []
    ];
    $body = json_encode($payload);
    $signature = base64_encode(hash_hmac('sha256', $body, 'super_secret', true));

    $response = $this->postJson("/woocommerce/webhook/secure-connection-uuid", $payload, [
        'x-wc-webhook-signature' => $signature
    ]);
    $this->assertTrue(in_array($response->status(), [200, 201, 302]));

    $responseWrongUuid = $this->postJson("/woocommerce/webhook/wrong-connection-uuid", $payload, [
        'x-wc-webhook-signature' => $signature
    ]);
    $responseWrongUuid->assertStatus(404);

    $responseWrongSig = $this->postJson("/woocommerce/webhook/secure-connection-uuid", $payload, [
        'x-wc-webhook-signature' => 'tampered_signature'
    ]);
    $responseWrongSig->assertStatus(401);
});

test('sync_engine_initializes_tenant_binding_context_in_queue_jobs', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $conn = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Queue Store',
        'uuid' => 'queue-connection-uuid',
        'status' => 'active',
    ]);

    app()->forgetInstance('current.tenant');

    expect(app()->bound('current.tenant'))->toBeFalse();

    $engine = new \App\Services\WooSync\SyncEngine($conn);

    expect(app()->bound('current.tenant'))->toBeTrue();
    expect(app('current.tenant')->id)->toEqual($tenant->id);
});

test('unlinked_product_sync_safely_associates_by_sku_without_duplicate_crash', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $conn = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Product Store',
        'uuid' => 'product-connection-uuid',
        'status' => 'active',
    ]);

    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'sku' => 'DUPLICATE-SKU',
        'name' => 'Existing VenQore Product'
    ]);

    $queueEntry = \App\Models\WooSyncQueue::create([
        'connection_id' => $conn->id,
        'direction' => 'from_woo',
        'payload' => [
            'id' => 8888,
            'sku' => 'DUPLICATE-SKU',
            'name' => 'Incoming WooCommerce Product',
            'price' => 500,
            'regular_price' => 500,
            'sale_price' => 500,
            'stock_quantity' => 10,
            'stock_status' => 'instock',
            'description' => 'A test description',
            'short_description' => 'A short description',
            'status' => 'publish',
            'categories' => [],
            'tags' => [],
        ],
        'status' => 'approved',
    ]);

    $engine = new \App\Services\WooSync\SyncEngine($conn);
    $success = $engine->pullFromWoo($queueEntry);

    expect($success)->toBeTrue();

    $link = \App\Models\WooProductLink::where('connection_id', $conn->id)
        ->where('woo_product_id', 8888)
        ->first();

    expect($link)->not->toBeNull();
    expect($link->venqore_product_id)->toEqual($product->id);

    $productCount = Product::where('sku', 'DUPLICATE-SKU')->count();
    expect($productCount)->toEqual(1);
});
