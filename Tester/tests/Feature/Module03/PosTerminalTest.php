<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Party;
use App\Models\Customer;
use App\Models\Setting;
use App\Models\Stock;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-1');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);

    // Dynamically retrieve the seeded warehouse ID for this tenant
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');

    // Clear cache and settings cache to guarantee isolation
    Cache::flush();
    SettingsHelper::clearCache();
});

// ─── Test 1: Featured Products Query Bug ──────────────────────────────────────
// This test FIRST demonstrates the bug (DATE_SUB + HAVING alias incompatible with SQLite),
// then shows it green after the fix is applied.

test('featured products endpoint returns top sold items with positive stock', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'name'      => 'Featured POS Product',
        'price'     => 150.00,
    ]);

    // Add stock so HAVING COALESCE(SUM(s.quantity), 0) > 0 matches
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 15]
    );

    // Hit the featured products endpoint via the web store-context route
    $response = $this->get("/s/{$this->tenant->slug}/pos/products/featured");

    // RED: before fix → 500 (SQLite: "near '30': syntax error" from DATE_SUB)
    // GREEN: after fix → 200 with database-agnostic date filter
    $response->assertStatus(200);
    $response->assertJsonFragment(['name' => 'Featured POS Product']);
});

// ─── Test 2: Rate Limiting ────────────────────────────────────────────────────
// Plan: 300 requests/min per tenant.
// Strategy: send 1 request (assert 200), manually exhaust the limiter bucket,
// then send one more and assert 429 — without actually sending 300 HTTP requests.

test('pos api rate limiter blocks requests after 300 hits per minute', function () {
    // IMPORTANT: By default ThrottleRequests hashes named-limiter keys as
    // md5($limiterName . $limit->key), making them impossible to pre-seed
    // manually in a test. We disable hashing temporarily so the key becomes
    // the predictable format '$limiterName:$rawKey', then restore it after.
    \Illuminate\Routing\Middleware\ThrottleRequests::shouldHashKeys(false);

    try {
        // With hashing off: middleware key = 'pos:pos-tenant:{id}'
        $rawKey    = 'pos-tenant:' . $this->tenant->id;
        $actualKey = 'pos:' . $rawKey;

        RateLimiter::clear($actualKey);

        // 1. One clean request — must succeed (middleware counts 1 hit internally)
        $response1 = $this->getJson("/api/pos/categories");
        $response1->assertStatus(200);

        // 2. Fill the bucket to exactly 300 (1 already counted by the request above)
        for ($i = 0; $i < 299; $i++) {
            RateLimiter::hit($actualKey, 60);
        }

        // 3. The next request exceeds the 300/min limit — must return 429
        $response2 = $this->getJson("/api/pos/categories");
        $response2->assertStatus(429);
    } finally {
        // Restore hashing so subsequent tests are not affected
        \Illuminate\Routing\Middleware\ThrottleRequests::shouldHashKeys(true);
    }
});

// ─── Test 3: Cross-Tenant Product Search Isolation ────────────────────────────
// Regression guard: every time the search query is touched we verify isolation.

test('product search is strictly isolated between tenants', function () {
    $tenantB = $this->createTenant('store-2');

    $productA = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'name'      => 'Tenant A Product',
    ]);
    Stock::updateOrCreate(
        ['product_id' => $productA->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 5]
    );

    $warehouseB = DB::table('warehouses')->where('tenant_id', $tenantB->id)->value('id');
    $productB = Product::factory()->create([
        'tenant_id' => $tenantB->id,
        'name'      => 'Tenant B Product',
    ]);
    Stock::updateOrCreate(
        ['product_id' => $productB->id, 'warehouse_id' => $warehouseB],
        ['quantity' => 5]
    );

    // Search as Tenant A — must only see Tenant A results
    $response = $this->get("/s/{$this->tenant->slug}/pos/products?q=Product");
    $response->assertStatus(200);

    $response->assertJsonFragment(['name' => 'Tenant A Product']);
    $response->assertJsonMissing(['name' => 'Tenant B Product']);
});

// ─── Test 4: Wholesale vs Retail Pricing ─────────────────────────────────────
// When wholesale_price_enabled is on, the search must return the wholesale price
// for customers whose `type = 'wholesale'`, and the retail price for everyone else.

test('product search returns wholesale price for wholesale customers when pricing is enabled', function () {
    // 1. Enable wholesale pricing setting for this tenant
    Setting::updateOrCreate(
        ['tenant_id' => $this->tenant->id, 'key' => 'wholesale_price_enabled'],
        ['value' => '1']
    );
    SettingsHelper::clearCache();

    // 2. Product with both retail (100) and wholesale (75) prices
    $product = Product::factory()->create([
        'tenant_id'              => $this->tenant->id,
        'name'                   => 'Pricing Product',
        'price'                  => 100.00,
        'wholesale_price'        => 75.00,
        'wholesale_min_quantity' => 1,
    ]);
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    // 3. Create customers via raw DB insert to bypass fillable restrictions
    //    The customers table has: id, tenant_id, party_id, name, type (added by migration)
    $regularParty   = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
    $wholesaleParty = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);

    $regularId   = \Illuminate\Support\Str::uuid()->toString();
    $wholesaleId = \Illuminate\Support\Str::uuid()->toString();

    DB::table('customers')->insert([
        'id'         => $regularId,
        'tenant_id'  => $this->tenant->id,
        'party_id'   => $regularParty->id,
        'name'       => 'Regular Cust',
        'type'       => 'regular',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('customers')->insert([
        'id'         => $wholesaleId,
        'tenant_id'  => $this->tenant->id,
        'party_id'   => $wholesaleParty->id,
        'name'       => 'Wholesale Cust',
        'type'       => 'wholesale',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // 4. Regular customer → retail price (100.00)
    $responseRegular = $this->get("/s/{$this->tenant->slug}/pos/products?q=Pricing&customer_id={$regularId}");
    $responseRegular->assertStatus(200);
    $dataRegular = $responseRegular->json('data');
    $this->assertNotEmpty($dataRegular, 'Regular customer search returned no products.');
    $this->assertEquals(100.00, $dataRegular[0]['price'], 'Regular customer should see retail price 100.00');

    // 5. Wholesale customer → wholesale price (75.00)
    $responseWholesale = $this->get("/s/{$this->tenant->slug}/pos/products?q=Pricing&customer_id={$wholesaleId}");
    $responseWholesale->assertStatus(200);
    $dataWholesale = $responseWholesale->json('data');
    $this->assertNotEmpty($dataWholesale, 'Wholesale customer search returned no products.');
    $this->assertEquals(75.00, $dataWholesale[0]['price'], 'Wholesale customer should see wholesale price 75.00');
});

// ─── Test 5: DRM Offline Lock (Todo — not implemented) ────────────────────────
test('drm offline lock restricts usage when license is invalid offline', function () {
    // Not yet implemented in the application
})->todo();

// ─── Test 6: Serial Tracking at Checkout (Todo — not implemented) ─────────────
test('serial tracking validation checks serial numbers at checkout', function () {
    // Not yet implemented in the application
})->todo();

// ─── Test 7: Barcode Generation (Todo — not implemented) ──────────────────────
test('barcode generator renders valid barcode svg or png', function () {
    // Not yet implemented in the application
})->todo();
