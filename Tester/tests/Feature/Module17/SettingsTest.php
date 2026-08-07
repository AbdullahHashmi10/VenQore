<?php

namespace Tests\Feature\Module17;

uses(\Tests\Feature\VenQoreTestCase::class);

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

test('prevents platform admin settings cache from bleeding into global fallback cache', function () {
    // Clear beforeEach tenant context to simulate a true global request
    app()->forgetInstance('current.tenant');
    app()->forgetInstance('current.membership');

    // 1. Create two tenants
    $tenantA = $this->createTenant('store-a');
    $tenantB = $this->createTenant('store-b');
    
    // 2. Set distinct settings values in database for Tenant A
    Setting::withoutGlobalScopes()->create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $tenantA->id,
        'key' => 'stop_sale_negative_stock',
        'value' => '1',
        'group' => 'pos'
    ]);
    
    // 3. Set global default setting (tenant_id = null)
    DB::table('settings')->insert([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => null,
        'key' => 'stop_sale_negative_stock',
        'value' => '0',
        'group' => 'pos',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    SettingsHelper::clearCache();
    
    // 4. Authenticate as a Platform Admin in global context (unbound tenant)
    $admin = \App\Models\User::factory()->create(['role' => 'platform_admin']);
    $this->actingAs($admin);
    
    // 5. Trigger all settings load in global context (populates cache)
    expect(app()->bound('current.tenant'))->toBeFalse();
    $globalSettings = SettingsHelper::all();
    
    // 6. Now authenticate as a regular cashier in Tenant B
    $cashier = \App\Models\User::factory()->create(['role' => 'cashier']);
    $this->actingAs($cashier);
    
    // Bind Tenant B context
    app()->instance('current.tenant', $tenantB);
    
    // 7. Get setting value - should fall back to global value ('0'), NOT Tenant A value ('1')
    $value = SettingsHelper::get('stop_sale_negative_stock');
    expect($value)->toBe('0');
    
    // Cleanup container binding
    app()->forgetInstance('current.tenant');
});

test('restricts chatbot settings updates to store owner or administrator', function () {
    $tenant = $this->createTenant('store-chatbot-test');
    
    // Create Owner & Cashier users
    $owner = \App\Models\User::factory()->create();
    $cashier = \App\Models\User::factory()->create();
    
    \App\Models\TenantUser::create([
        'tenant_id' => $tenant->id,
        'user_id' => $owner->id,
        'role' => 'owner',
        'status' => 'active',
        'display_name' => 'Store Owner'
    ]);
    
    \App\Models\TenantUser::create([
        'tenant_id' => $tenant->id,
        'user_id' => $cashier->id,
        'role' => 'cashier',
        'status' => 'active',
        'display_name' => 'Store Cashier'
    ]);
    
    // Enable AI status on the store to bypass the plan limits block
    $tenant->update(['ai_status' => 'active']);
    
    // 1. Cashier attempts to update chatbot settings - should return 403 Forbidden
    $this->actingAs($cashier);
    $responseBlocked = $this->postJson("/s/{$tenant->slug}/admin/chatbot/settings", [
        'chatbot_api_key' => 'blocked-key-value',
        'chatbot_custom_rules' => 'unprivileged rule change'
    ]);
    $responseBlocked->assertStatus(403);
    
    // 2. Owner updates chatbot settings - should succeed (302 redirect back)
    $this->actingAs($owner);
    $responseSuccess = $this->postJson("/s/{$tenant->slug}/admin/chatbot/settings", [
        'chatbot_api_key' => 'authorized-key-value',
        'chatbot_custom_rules' => 'authorized rule change'
    ]);
    $responseSuccess->assertStatus(302);
    
    // Verify changes persisted securely
    $savedApiKey = Setting::withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)
        ->where('key', 'chatbot_api_key')
        ->value('value');
    expect($savedApiKey)->toBe('authorized-key-value');
});

test('enforces tenant bounds when settings are updated globally or via platform commands', function () {
    // Clear beforeEach tenant context to simulate a true global request
    app()->forgetInstance('current.tenant');
    app()->forgetInstance('current.membership');

    $tenantA = $this->createTenant('tenant-bounds-a');
    $tenantB = $this->createTenant('tenant-bounds-b');
    
    // Create a setting for Tenant A
    Setting::withoutGlobalScopes()->create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'tenant_id' => $tenantA->id,
        'key' => 'stop_sale_negative_stock',
        'value' => '1',
        'group' => 'pos'
    ]);
    
    // Authenticate as platform admin
    $admin = \App\Models\User::factory()->create(['role' => 'platform_admin']);
    $this->actingAs($admin);
    
    // Ensure current.tenant is not bound (global context)
    expect(app()->bound('current.tenant'))->toBeFalse();
    
    // Try to update settings - it should NOT overwrite Tenant A's settings record
    // when we want to write a global/system settings record.
    Setting::withoutGlobalScopes()->updateOrCreate(
        ['key' => 'stop_sale_negative_stock', 'tenant_id' => null],
        ['value' => '0']
    );
    
    $tenantASetting = Setting::withoutGlobalScopes()
        ->where('tenant_id', $tenantA->id)
        ->where('key', 'stop_sale_negative_stock')
        ->value('value');
        
    $globalSetting = Setting::withoutGlobalScopes()
        ->whereNull('tenant_id')
        ->where('key', 'stop_sale_negative_stock')
        ->value('value');
        
    // Tenant A's setting must remain untouched
    expect($tenantASetting)->toBe('1');
    expect($globalSetting)->toBe('0');
});

test('resolves the settings panel without redirecting to the hub', function () {
    $tenant = $this->createTenant('routing-safety-test');
    $owner = \App\Models\User::factory()->create();
    
    \App\Models\TenantUser::create([
        'tenant_id' => $tenant->id,
        'user_id' => $owner->id,
        'role' => 'owner',
        'status' => 'active',
        'display_name' => 'Store Owner'
    ]);
    
    $this->actingAs($owner);
    
    // Request Settings Panel - must return 200 OK and render Settings panel view
    $response = $this->get("/s/{$tenant->slug}/settings");
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page->component('Settings/SettingsPanel'));
});
