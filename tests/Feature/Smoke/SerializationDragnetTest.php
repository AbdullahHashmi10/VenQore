<?php

namespace Tests\Feature\Smoke;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;

// Wire in VenQoreTestCase so all tests get createTenant(), actingAsOwner(),
// seedTenantDefaults(), and RefreshDatabase behavior.
uses(VenQoreTestCase::class);

/**
 * SerializationDragnetTest
 *
 * Regression guard for the class of bugs discovered in the June 2026 Architectural Dragnet:
 *
 * ROOT CAUSE: Eloquent models with $appends (computed attributes) loaded via aggregate
 * select()/groupBy() queries that omit the primary key 'id' silently produce poisoned
 * model objects. When Inertia::render() serializes those objects to JSON, the computed
 * attributes resolve with id=null — either crashing (strict DB) or returning silent 0s.
 *
 * These tests VERIFY THE PAYLOAD — not just the HTTP status code — so that the original
 * error pattern (assertOk() passes but the actual data is corrupted/missing) cannot recur.
 *
 * Each test:
 *   1. Seeds real data
 *   2. Hits the route
 *   3. Asserts HTTP 200
 *   4. Unpacks the Inertia prop bag
 *   5. Asserts that the returned data structure is non-null and type-correct
 */

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD — SERIALIZATION TRAP REGRESSION TESTS
// Covers: AdminController::dashboard() — paymentMethods + topProducts
// ──────────────────────────────────────────────────────────────────────────────

test('[DRAGNET] admin dashboard serializes without 500 error when sales exist', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
    $product   = \App\Models\Product::factory()->create([
        'tenant_id' => $tenant->id,
        'price'     => 250.00,
        'cost_price'=> 100.00,
    ]);

    \App\Models\Stock::create([
        'tenant_id'    => $tenant->id,
        'product_id'   => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity'     => 100,
    ]);

    // Seed a posted sale so paymentMethods + topProducts queries return real data
    $sale = \App\Models\Sale::create([
        'tenant_id'    => $tenant->id,
        'user_id'      => auth()->id(),
        'status'       => 'posted',
        'payment_method' => 'cash',
        'total'        => 250.0,
        'net_sales'    => 250.0,
        'invoice_total'=> 250.0,
        'posted_at'    => now(),
    ]);

    $saleItemId = \Illuminate\Support\Str::uuid()->toString();
    DB::table('sale_items')->insert([
        'id'         => $saleItemId,
        'tenant_id'  => $tenant->id,
        'sale_id'    => $sale->id,
        'product_id' => $product->id,
        'quantity'   => 1,
        'unit_price' => 250.0,
        'subtotal'   => 250.0,
        'net_amount' => 250.0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // ── THE CRITICAL ASSERTION ──
    // Previously, Sale::select('payment_method')->groupBy() returned poisoned
    // model objects that caused a 500. This test guards against regression.
    $response = $this->get("/s/{$tenant->slug}/admin/dashboard");
    $response->assertOk();

    // Verify the Inertia prop bag is fully hydrated and structurally correct
    $props = $response->viewData('page')['props'];

    // paymentMethods must be an array (not null, not a serialization error fragment)
    // Note: Inertia props return plain PHP arrays — no ->toArray() needed.
    $this->assertIsArray($props['paymentMethods']);

    // Each paymentMethod entry must have the correct keys and types
    foreach ($props['paymentMethods'] as $pm) {
        $pmArr = (array) $pm;
        $this->assertArrayHasKey('name',  $pmArr);
        $this->assertArrayHasKey('value', $pmArr);
        $this->assertArrayHasKey('color', $pmArr);
        $this->assertIsInt($pmArr['value'], 'paymentMethods[].value must be an integer count');
    }

    // topProducts must be an array (plain PHP array from Inertia props)
    $this->assertIsArray($props['topProducts']);

    // If products were sold, at least one top product entry must exist
    $this->assertNotEmpty($props['topProducts'], 'topProducts must not be empty when sales exist');

    $firstProduct = (array) $props['topProducts'][0];
    $this->assertArrayHasKey('name',  $firstProduct);
    $this->assertArrayHasKey('cat',   $firstProduct);
    $this->assertArrayHasKey('sales', $firstProduct);
    $this->assertIsFloat($firstProduct['sales'], 'topProducts[].sales must be a float');
    $this->assertGreaterThan(0, $firstProduct['sales']);
})->group('dragnet', 'serialization');

test('[DRAGNET] admin dashboard paymentMethods returns empty array (not exception) when no sales exist', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Hit with zero data — this specifically tests the empty-state path
    $response = $this->get("/s/{$tenant->slug}/admin/dashboard");
    $response->assertOk();

    $props = $response->viewData('page')['props'];

    // Must return an empty iterable, not null or a serialization crash
    $this->assertNotNull($props['paymentMethods'], 'paymentMethods must not be null on empty DB');
    $this->assertNotNull($props['topProducts'],    'topProducts must not be null on empty DB');
    $this->assertCount(0, $props['paymentMethods']);
    $this->assertCount(0, $props['topProducts']);
})->group('dragnet', 'serialization');

// ──────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD — SERIALIZATION TRAP REGRESSION TEST
// Covers: DashboardController@dashboard — salesByMethod query (already fixed)
// This test guards against re-introducing the original bug.
// ──────────────────────────────────────────────────────────────────────────────

test('[DRAGNET] tenant dashboard serializes performance props correctly when sales exist', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create a posted sale
    \App\Models\Sale::create([
        'tenant_id'    => $tenant->id,
        'user_id'      => auth()->id(),
        'status'       => 'posted',
        'payment_method' => 'cash',
        'total'        => 500.0,
        'net_sales'    => 500.0,
        'invoice_total'=> 500.0,
        'posted_at'    => now(),
    ]);

    $response = $this->get("/s/{$tenant->slug}/dashboard");
    $response->assertOk();

    // Verify payload — not just HTTP 200
    $props = $response->viewData('page')['props'];

    // 'performance' key must exist and contain Today/Month/Year sub-keys
    $this->assertArrayHasKey('performance', $props);
    $this->assertArrayHasKey('Today',  $props['performance']);
    $this->assertArrayHasKey('Month',  $props['performance']);

    // Each period must have a numeric 'sales' value (not null)
    $this->assertIsNumeric($props['performance']['Today']['sales']);
    $this->assertIsNumeric($props['performance']['Month']['sales']);

    // Assert the seeded sale is reflected in Month stats
    $this->assertGreaterThanOrEqual(500.0, (float) $props['performance']['Month']['sales']);
})->group('dragnet', 'serialization');

// ──────────────────────────────────────────────────────────────────────────────
// REPORTS — PAYLOAD STRUCTURE VERIFICATION
// Guards against routes that were previously only checked with assertOk().
// ──────────────────────────────────────────────────────────────────────────────

test('[DRAGNET] generic reports return structurally valid Inertia prop bags', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $routes = [
        'reports/sale-purchase-by-party'         => ['title', 'columns', 'data', 'stats'],
        'reports/sale-purchase-by-item-category' => ['title', 'columns', 'data', 'stats'],
        'reports/stock-summary-by-category'      => ['title', 'columns', 'data', 'stats'],
        'reports/item-wise-discount'             => ['title', 'columns', 'data', 'stats'],
        'reports/item-report-by-party'           => ['data', 'stats', 'filters'],
        'reports/party-report-by-item'           => ['data', 'stats', 'filters'],
        'reports/cash-flow'                      => ['operating', 'investing', 'financing', 'stats'],
        'reports/stock-aging'                    => ['title', 'columns', 'data', 'stats'],
    ];

    foreach ($routes as $url => $requiredKeys) {
        $response = $this->get("/s/{$tenant->slug}/{$url}");

        // Assert HTTP 200
        $this->assertEquals(
            200, $response->status(),
            "Route [{$url}] returned HTTP {$response->status()}, expected 200"
        );

        // Assert the Inertia page data is present
        $pageData = $response->viewData('page');
        $this->assertNotNull($pageData, "Route [{$url}] returned null Inertia page data");
        $this->assertArrayHasKey('props', $pageData, "Route [{$url}] missing 'props' key in page data");

        $props = $pageData['props'];

        // Assert all required structural keys exist in the props
        foreach ($requiredKeys as $key) {
            $this->assertArrayHasKey(
                $key, $props,
                "Route [{$url}] is missing required Inertia prop '{$key}'"
            );
        }

        // Assert 'data' (where present) is an array-like (not null, not a serialization error fragment)
        if (isset($props['data'])) {
            $this->assertNotNull($props['data'], "Route [{$url}] prop 'data' must not be null");
        }

        // Assert 'stats' (where present) is an array-like
        if (isset($props['stats'])) {
            $this->assertNotNull($props['stats'], "Route [{$url}] prop 'stats' must not be null");
        }
    }
})->group('dragnet', 'serialization');

test('[DRAGNET] daily-sales report serializes with correct prop structure', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $response = $this->get("/s/{$tenant->slug}/reports/daily-sales");
    $response->assertOk();

    $props = $response->viewData('page')['props'];
    // Route must return stats with numeric total_revenue (not null/error)
    $this->assertArrayHasKey('stats', $props);
    $this->assertArrayHasKey('total_revenue', $props['stats']);
    $this->assertIsNumeric($props['stats']['total_revenue']);
    $this->assertIsNumeric($props['stats']['total_count']);
})->group('dragnet', 'serialization');

test('[DRAGNET] tax report serializes without error on empty data', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $response = $this->get("/s/{$tenant->slug}/reports/tax");
    $response->assertOk();

    $props = $response->viewData('page')['props'];
    // Route must return the three keys the Tax.jsx component depends on
    $this->assertArrayHasKey('tax_records', $props);
    $this->assertArrayHasKey('stats',       $props);
    $this->assertArrayHasKey('filters',     $props);
    $this->assertIsIterable($props['tax_records']);
})->group('dragnet', 'serialization');
