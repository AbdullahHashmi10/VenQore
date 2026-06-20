<?php

use App\Models\Product;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Services\PlanGate;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

beforeEach(function () {
    // Flush cache to ensure no stale plan limits are kept
    \Illuminate\Support\Facades\Cache::flush();

    // Seed the PlanFeatureMatrixSeeder to load the exact rules we defined
    $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);
});

test('M1-11: WooCommerce is blocked for Growth and Business', function () {
    // Growth Tenant
    $growthTenant = $this->createTenant('growth-test-store', 'ltd_2'); // ltd_2 maps to growth
    $this->actingAsTenantUser($growthTenant, 'owner');

    // Assert PlanGate::check is false
    $this->assertFalse(PlanGate::check('woocommerce'));

    // Direct request to WooCommerce route returns 403
    $response = $this->get("/s/{$growthTenant->slug}/woo/connections");
    $response->assertStatus(403);

    // Business Tenant
    $businessTenant = $this->createTenant('business-test-store', 'ltd_3'); // ltd_3 maps to business
    $this->actingAsTenantUser($businessTenant, 'owner');

    // Assert PlanGate::check is false
    $this->assertFalse(PlanGate::check('woocommerce'));

    // Direct request to WooCommerce route returns 403
    $response = $this->get("/s/{$businessTenant->slug}/woo/connections");
    $response->assertStatus(403);
});

test('M1-11: Cookbook create/update/delete are blocked on a plan without bill_of_materials', function () {
    $starterTenant = $this->createTenant('starter-test-store', 'ltd_1'); // ltd_1 maps to starter
    $this->actingAsTenantUser($starterTenant, 'owner');

    // Assert PlanGate::check is false
    $this->assertFalse(PlanGate::check('bill_of_materials'));

    // Direct requests to Cookbook store, update, and destroy return 403
    $this->postJson("/s/{$starterTenant->slug}/cookbook", [
        'name' => 'Gated Recipe',
        'product_id' => 1,
        'yield_quantity' => 1,
        'ingredients' => []
    ])->assertStatus(403);

    $this->putJson("/s/{$starterTenant->slug}/cookbook/1", [
        'name' => 'Updated Gated Recipe',
        'product_id' => 1,
        'yield_quantity' => 1,
        'ingredients' => []
    ])->assertStatus(403);

    $this->deleteJson("/s/{$starterTenant->slug}/cookbook/1")->assertStatus(403);
});

test('M1-11: Cookbook works on a plan WITH bill_of_materials', function () {
    $growthTenant = $this->createTenant('growth-cb-store', 'ltd_2'); // ltd_2 maps to growth (has bill_of_materials)
    $this->actingAsTenantUser($growthTenant, 'owner');

    // Seed defaults (categories, warehouses, etc.)
    $this->seedTenantDefaults($growthTenant);
    $warehouseId = DB::table('warehouses')->where('tenant_id', $growthTenant->id)->value('id');

    // Assert PlanGate::check is true
    $this->assertTrue(PlanGate::check('bill_of_materials'));

    // Create products
    $productRecipe = Product::factory()->create([
        'tenant_id' => $growthTenant->id,
        'name' => 'Finished Dish',
        'cost_price' => 10,
        'price' => 20
    ]);

    $ingredientProduct = Product::factory()->create([
        'tenant_id' => $growthTenant->id,
        'name' => 'Raw Material',
        'cost_price' => 2,
        'price' => 3
    ]);

    // Perform positive case test: store recipe
    $payload = [
        'name' => 'Valid Recipe',
        'description' => 'Test description',
        'product_id' => $productRecipe->id,
        'yield_quantity' => 1.0,
        'prep_time_minutes' => 15,
        'ingredients' => [
            [
                'product_id' => $ingredientProduct->id,
                'quantity' => 2.0,
                'unit' => 'pcs',
                'wastage_percent' => 5
            ]
        ]
    ];

    $response = $this->post("/s/{$growthTenant->slug}/cookbook", $payload);
    $response->assertRedirect();

    // Verify recipe was created
    $this->assertDatabaseHas('recipes', [
        'tenant_id' => $growthTenant->id,
        'name' => 'Valid Recipe',
        'product_id' => $productRecipe->id
    ]);
});

test('F17: legacy /sales route enforces the monthly transaction limit', function () {
    // We can use starter plan, since it maps to ltd_1
    $tenant = $this->createTenant('legacy-sales-limit-store', 'starter');
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);
    $warehouseId = DB::table("warehouses")->where("tenant_id", $tenant->id)->value("id");

    // Set transactions_per_month limit to 2 for this plan
    $plan = \App\Models\Plan::where('slug', 'starter')->first();
    $plan->limits()->updateOrCreate(['key' => 'transactions_per_month'], ['value' => '2']);
    \App\Services\PlanRepository::invalidatePlanCache('starter');

    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'cost_price' => 10,
        'price' => 20
    ]);
    \App\Models\Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $warehouseId],
        ['quantity' => 100]
    );

    $payload = [
        "warehouse_id" => $warehouseId,
        "items" => [
            [
                "product_id" => $product->id,
                "quantity" => 1,
                "price" => 20.00,
                "discount" => 0
            ]
        ],
        "discount" => 0,
        "amount_paid" => 20.00,
        "payment_method" => "cash",
        "add_to_ledger" => true,
    ];

    // Post 1st sale -> OK
    $this->postJson("/s/{$tenant->slug}/sales", $payload)->assertStatus(200);

    // Post 2nd sale -> OK
    $this->postJson("/s/{$tenant->slug}/sales", $payload)->assertStatus(200);

    // Post 3rd sale -> 403 Forbidden
    $response = $this->postJson("/s/{$tenant->slug}/sales", $payload);
    $response->assertStatus(403);
    $this->assertEquals('plan_limit', $response->json('type'));
    $this->assertEquals('transactions_per_month', $response->json('feature'));
});

test('F17: a tenant under the limit can still post a sale via /sales', function () {
    $tenant = $this->createTenant('legacy-sales-ok-store', 'starter');
    $this->actingAsTenantUser($tenant, 'owner');
    $this->seedTenantDefaults($tenant);
    $warehouseId = DB::table("warehouses")->where("tenant_id", $tenant->id)->value("id");

    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'cost_price' => 10,
        'price' => 20
    ]);
    \App\Models\Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $warehouseId],
        ['quantity' => 100]
    );

    $payload = [
        "warehouse_id" => $warehouseId,
        "items" => [
            [
                "product_id" => $product->id,
                "quantity" => 1,
                "price" => 20.00,
                "discount" => 0
            ]
        ],
        "discount" => 0,
        "amount_paid" => 20.00,
        "payment_method" => "cash",
        "add_to_ledger" => true,
    ];

    $this->postJson("/s/{$tenant->slug}/sales", $payload)->assertStatus(200);
});

test('Tenant featuresArray returns correct feature availability flags based on plan', function () {
    // 1. Business Plan
    $businessTenant = $this->createTenant('business-features-test', 'business');
    $featuresBusiness = $businessTenant->featuresArray();
    expect($featuresBusiness['production'])->toBeTrue()
        ->and($featuresBusiness['bill_of_materials'])->toBeTrue()
        ->and($featuresBusiness['e_invoicing'])->toBeTrue()
        ->and($featuresBusiness['invoice_reminders'])->toBeTrue();

    // 2. Starter Plan
    $starterTenant = $this->createTenant('starter-features-test', 'starter');
    $featuresStarter = $starterTenant->featuresArray();
    expect($featuresStarter['production'])->toBeFalse()
        ->and($featuresStarter['bill_of_materials'])->toBeFalse()
        ->and($featuresStarter['e_invoicing'])->toBeFalse()
        ->and($featuresStarter['invoice_reminders'])->toBeFalse();
});

