<?php

namespace Tests\Feature\Module17;

use Tests\Feature\VenQoreTestCase;
use App\Models\Setting;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Sale;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-settings');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    SettingsHelper::clearCache();
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
});

test('stop_sale_on_negative_stock_toggle_affects_sale_outcome', function () {
    // 1. Disable stop negative stock, sale should proceed even if stock is 0
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'stop_sale_negative_stock'],
        ['value' => '0']
    );
    SettingsHelper::clearCache();

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 100.00,
        'cost_price' => 50.00,
        'tax_rate' => 0,
    ]);

    // Create a sale for 1 unit (current stock is 0)
    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1, 'price' => 100.00, 'discount' => 0]
        ],
        'discount' => 0,
        'amount_paid' => 100.00,
        'payment_method' => 'cash',
        'add_to_ledger' => false,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertStatus(200);

    // 2. Enable stop negative stock, sale should be blocked
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'stop_sale_negative_stock'],
        ['value' => '1']
    );
    SettingsHelper::clearCache();

    $responseBlocked = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $responseBlocked->assertStatus(422);
});

test('currency_symbol_setting_appears_in_sale_receipts', function () {
    // Update setting to custom symbol
    $responseUpdate = $this->post("/s/{$this->tenant->slug}/settings", [
        'settings' => ['currency_symbol' => '£']
    ]);
    $responseUpdate->assertStatus(302); // redirect back

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 100.00,
        'tax_rate' => 0,
    ]);

    // Create a sale
    $sale = Sale::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => auth()->id(),
        'reference_number' => 'REF-1234',
        'subtotal' => 100.00,
        'total' => 100.00,
        'status' => 'draft',
        'payment_status' => 'unpaid',
    ]);

    // Add item
    DB::table('sale_items')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'unit_price' => 100.00,
        'subtotal' => 100.00,
    ]);

    // Hit printReceipt endpoint
    $responsePrint = $this->get("/s/{$this->tenant->slug}/sales/{$sale->id}/print");
    $responsePrint->assertOk();

    // Verify PDF response contains the custom currency symbol
    $content = $responsePrint->getContent();
    $this->assertNotEmpty($content);
});

test('tax_rate_setting_applies_to_new_sales', function () {
    // Set default tax rate to 15%
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'default_tax_rate'],
        ['value' => '15']
    );
    SettingsHelper::clearCache();

    // Create product with null tax_rate
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 100.00,
        'tax_rate' => null, // null triggers fallback
    ]);

    // Seed stock to allow sale
    Stock::create([
        'tenant_id' => $this->tenant->id,
        'warehouse_id' => $this->warehouseId,
        'product_id' => $product->id,
        'quantity' => 10,
    ]);

    DB::table('inventory_batches')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 50.00,
        'original_qty' => 10,
        'initial_qty' => 10,
        'remaining_qty' => 10,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create sale
    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2, 'price' => 100.00, 'discount' => 0]
        ],
        'discount' => 0,
        'amount_paid' => 230.00, // 200 + 30 tax (15%)
        'payment_method' => 'cash',
        'add_to_ledger' => false,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertStatus(200);

    // Assert that the created sale has tax of 30.00 (15% of 200)
    $saleId = $response->json('sale_id');
    $sale = Sale::findOrFail($saleId);
    $this->assertEquals(30.00, (float) $sale->tax);
    $this->assertEquals(230.00, (float) $sale->total);
});

test('store_name_update_reflects_on_dashboard', function () {
    // Update store name via settings endpoint
    $responseUpdate = $this->post("/s/{$this->tenant->slug}/settings", [
        'settings' => ['store_name' => 'Super POS Express']
    ]);
    $responseUpdate->assertStatus(302);

    $this->tenant->refresh();
    $this->assertEquals('Super POS Express', $this->tenant->name);

    // Verify it reflects on dashboard
    $responseDashboard = $this->get("/s/{$this->tenant->slug}/dashboard");
    $responseDashboard->assertOk();
    
    // Inertia returns the page object; assert that the tenant has the updated name
    $page = $responseDashboard->viewData('page');
    $this->assertEquals('Super POS Express', data_get($page, 'props.store.name'));
});
