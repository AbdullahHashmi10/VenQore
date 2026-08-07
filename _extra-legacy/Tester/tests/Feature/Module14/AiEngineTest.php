<?php

namespace Tests\Feature\Module14;

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\Product;
use App\Models\Account;
use App\Models\User;
use App\Models\TenantPlanOverride;
use App\Services\PlanRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Module 14 — AI Engine (post-launch feature)
 * AI-powered recommendations, smart reorder, and predictive analytics.
 */
test('ai_product_recommendation_returns_relevant_suggestions', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);
    $ownerId = auth()->id();

    $productA = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Pizza Crust']);
    $productB = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Tomato Sauce']);
    $productC = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Napkins']);

    $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

    // Create a sale containing both A and B (co-purchase)
    $saleId = Str::uuid()->toString();
    DB::table('sales')->insert([
        'id' => $saleId,
        'tenant_id' => $tenant->id,
        'reference_number' => 'INV-TEST-CO',
        'warehouse_id' => $warehouseId,
        'subtotal' => 150,
        'subtotal_gross' => 150,
        'total_item_discounts' => 0,
        'net_sales' => 150,
        'total_tax' => 0,
        'tax' => 0,
        'invoice_total' => 150,
        'total' => 150,
        'status' => 'completed',
        'payment_status' => 'paid',
        'payment_method' => 'cash',
        'user_id' => $ownerId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('sale_items')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'sale_id' => $saleId, 'product_id' => $productA->id, 'quantity' => 1, 'unit_price' => 100, 'gross_amount' => 100, 'discount_amount' => 0, 'net_amount' => 100, 'tax_amount' => 0, 'subtotal' => 100, 'line_total' => 100, 'created_at' => now()],
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'sale_id' => $saleId, 'product_id' => $productB->id, 'quantity' => 1, 'unit_price' => 50, 'gross_amount' => 50, 'discount_amount' => 0, 'net_amount' => 50, 'tax_amount' => 0, 'subtotal' => 50, 'line_total' => 50, 'created_at' => now()],
    ]);

    // Query co-purchases for Product A
    $response = $this->getJson("/s/{$tenant->slug}/ai/recommendations?product_id={$productA->id}");

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'success');
    
    // Assert B is in co-purchases lists
    $data = $response->json('data');
    $this->assertNotEmpty($data);
    $this->assertEquals($productB->id, $data[0]['product_id']);
    $this->assertEquals('Tomato Sauce', $data[0]['name']);
});

test('smart_reorder_alert_triggers_at_correct_threshold', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);
    $ownerId = auth()->id();

    $productA = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Low Stock Item']);
    $productB = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'High Stock Item']);

    $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

    // Seed stocks: Low Stock has 2 units, High Stock has 50 units
    DB::table('stocks')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'product_id' => $productA->id, 'warehouse_id' => $warehouseId, 'quantity' => 2.0, 'created_at' => now()],
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'product_id' => $productB->id, 'warehouse_id' => $warehouseId, 'quantity' => 50.0, 'created_at' => now()],
    ]);

    // Create 30 units of sales for A over the last 30 days (avg daily sales = 1.0/day)
    $saleId = Str::uuid()->toString();
    DB::table('sales')->insert([
        'id' => $saleId,
        'tenant_id' => $tenant->id,
        'reference_number' => 'INV-TEST-SO',
        'warehouse_id' => $warehouseId,
        'subtotal' => 300,
        'subtotal_gross' => 300,
        'total_item_discounts' => 0,
        'net_sales' => 300,
        'total_tax' => 0,
        'tax' => 0,
        'invoice_total' => 300,
        'total' => 300,
        'status' => 'completed',
        'payment_status' => 'paid',
        'payment_method' => 'cash',
        'user_id' => $ownerId,
        'created_at' => now()->subDays(10),
        'updated_at' => now()->subDays(10),
    ]);

    DB::table('sale_items')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'sale_id' => $saleId, 'product_id' => $productA->id, 'quantity' => 30, 'unit_price' => 10, 'gross_amount' => 300, 'discount_amount' => 0, 'net_amount' => 300, 'tax_amount' => 0, 'subtotal' => 300, 'line_total' => 300, 'created_at' => now()->subDays(10)],
    ]);

    // Reorder query with lead time of 7 days (threshold = 1.0 * 7 = 7)
    // Low Stock current stock is 2 <= 7, so it triggers.
    // High Stock current stock is 50 > 0, so it does not.
    $response = $this->getJson("/s/{$tenant->slug}/ai/smart-reorder?lead_time=7");

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'success');

    $data = $response->json('data');
    $this->assertNotEmpty($data);
    
    // Low stock should be present
    $lowStockIds = collect($data)->pluck('id');
    $this->assertTrue($lowStockIds->contains($productA->id));
    $this->assertFalse($lowStockIds->contains($productB->id));
});

test('predictive_cash_flow_forecast_is_reasonable', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Create accounts 1000 and 1010
    $acc1 = Account::firstOrCreate(
        ['code' => '1000', 'tenant_id' => $tenant->id],
        ['name' => 'Cash', 'type' => 'asset', 'tenant_id' => $tenant->id]
    );
    $acc2 = Account::firstOrCreate(
        ['code' => '1010', 'tenant_id' => $tenant->id],
        ['name' => 'Bank', 'type' => 'asset', 'tenant_id' => $tenant->id]
    );

    // Seed initial cash balance
    $entry1 = Str::uuid()->toString();
    DB::table('journal_entries')->insert([
        'id' => $entry1, 'tenant_id' => $tenant->id, 'date' => now()->subDays(15)->toDateString(),
        'reference_type' => 'manual', 'user_id' => auth()->id(), 'is_reversed' => 0, 'created_at' => now(), 'updated_at' => now()
    ]);
    DB::table('journal_items')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'journal_entry_id' => $entry1, 'account_id' => $acc1->id, 'debit' => 3000.0, 'credit' => 0.0],
        ['id' => Str::uuid(), 'tenant_id' => $tenant->id, 'journal_entry_id' => $entry1, 'account_id' => $acc2->id, 'debit' => 0.0, 'credit' => 3000.0],
    ]);

    // Query forecast
    $response = $this->getJson("/s/{$tenant->slug}/ai/cash-flow-forecast?days=15");

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'success');
    $response->assertJsonStructure([
        'status',
        'current_balance',
        'avg_daily_net',
        'forecast' => [
            '*' => [
                'date',
                'projected_net_change',
                'projected_balance'
            ]
        ]
    ]);
});

test('prevents co-purchase recommendations from leaking across tenants', function () {
    $tenantA = $this->createTenant();
    $tenantB = $this->createTenant();

    // Seed same product IDs or names in both stores
    $productA1 = Product::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'Pizza Crust']);
    $productA2 = Product::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'Tomato Sauce']);

    $productB1 = Product::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'Pizza Crust']);
    $productB2 = Product::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'Napkins']);

    $warehouseA = DB::table('warehouses')->where('tenant_id', $tenantA->id)->value('id');
    $warehouseB = DB::table('warehouses')->where('tenant_id', $tenantB->id)->value('id');

    // Create a sale for Tenant B containing Pizza Crust and Napkins
    $saleIdB = Str::uuid()->toString();
    DB::table('sales')->insert([
        'id' => $saleIdB, 'tenant_id' => $tenantB->id, 'reference_number' => 'INV-TB-1',
        'warehouse_id' => $warehouseB, 'subtotal' => 150, 'subtotal_gross' => 150,
        'total_item_discounts' => 0, 'net_sales' => 150, 'total_tax' => 0, 'tax' => 0,
        'invoice_total' => 150, 'total' => 150, 'status' => 'completed', 'payment_status' => 'paid',
        'payment_method' => 'cash', 'user_id' => User::factory()->create()->id, 'created_at' => now(), 'posted_at' => now()
    ]);
    DB::table('sale_items')->insert([
        ['id' => Str::uuid(), 'tenant_id' => $tenantB->id, 'sale_id' => $saleIdB, 'product_id' => $productB1->id, 'quantity' => 1, 'unit_price' => 100, 'gross_amount' => 100, 'discount_amount' => 0, 'net_amount' => 100, 'tax_amount' => 0, 'subtotal' => 100, 'line_total' => 100, 'created_at' => now()],
        ['id' => Str::uuid(), 'tenant_id' => $tenantB->id, 'sale_id' => $saleIdB, 'product_id' => $productB2->id, 'quantity' => 1, 'unit_price' => 50, 'gross_amount' => 50, 'discount_amount' => 0, 'net_amount' => 50, 'tax_amount' => 0, 'subtotal' => 50, 'line_total' => 50, 'created_at' => now()],
    ]);

    // Query Tenant A co-purchases for Pizza Crust (A1).
    // Since it is Tenant A, it should return 0 recommendations (Napkins should not leak).
    $this->actingAsOwner($tenantA);
    $response = $this->getJson("/s/{$tenantA->slug}/ai/recommendations?product_id={$productA1->id}");
    
    $response->assertStatus(200);
    $response->assertJsonCount(0, 'data');
});

test('isolates ai settings per tenant', function () {
    $tenantA = $this->createTenant();
    $tenantB = $this->createTenant();

    // growth_engine is an add-on, OFF by default on every plan tier
    // (see PlanFeatureMatrixSeeder.php) — the route is gated by
    // 'plan.feature:growth_engine', so both tenants need it explicitly
    // enabled via a TenantPlanOverride the same way PaymentProcessingTest does.
    foreach ([$tenantA, $tenantB] as $t) {
        TenantPlanOverride::create([
            'tenant_id'      => $t->id,
            'override_key'   => 'growth_engine',
            'override_value' => '1',
            'applied_by'     => auth()->id() ?? 1,
        ]);
        PlanRepository::invalidateTenantCache($t->id);
    }

    // Configure settings for Tenant A
    $this->actingAsOwner($tenantA);
    $responseA = $this->postJson("/s/{$tenantA->slug}/growth-engine/settings", [
        'regular_customer_min_orders' => 5,
        'regular_customer_period_days' => 15,
        'min_order_value_filter' => 1000,
        'lookahead_days' => 10,
        'loyalty_points_per_amount' => 100,
        'loyalty_points_earned_per_unit' => 2,
        'loyalty_redemption_rate' => 5,
    ]);
    $responseA->assertRedirect();

    // Verify Tenant B has original defaults and not Tenant A's settings
    $this->actingAsOwner($tenantB);
    $responseB = $this->get("/s/{$tenantB->slug}/growth-engine/settings");
    $responseB->assertOk();
    
    $props = $responseB->original->getData()['page']['props']['settings'];
    expect((int)$props['regular_customer_min_orders'])->toBe(3); // Default value, not 5
});

test('clamps days parameter in cash flow forecast to prevent memory overflow', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $response = $this->getJson("/s/{$tenant->slug}/ai/cash-flow-forecast?days=1000000");
    $response->assertStatus(200);
    
    // The forecast count should be clamped to maximum (90 days) instead of 1 million
    $data = $response->json('forecast');
    expect(count($data))->toBeLessThanOrEqual(90);
});

test('handles onboarding cash flow forecast with empty tables gracefully', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    // No journal items are seeded. Request forecast.
    $response = $this->getJson("/s/{$tenant->slug}/ai/cash-flow-forecast?days=30");
    $response->assertStatus(200);
    $response->assertJsonPath('current_balance', 0);
    $response->assertJsonPath('avg_daily_net', 0);
});

test('resolves tenant context for Vena Assist chatbot widget', function () {
    $tenant = $this->createTenant();
    $session = \App\Models\ChatSession::create([
        'tenant_id' => $tenant->id,
        'session_uuid' => Str::uuid()->toString(),
        'visitor_name' => 'John Doe',
        'status' => 'bot_active'
    ]);

    // Seed a message in the session
    \App\Models\ChatMessage::create([
        'session_id' => $session->id,
        'sender_type' => 'visitor',
        'body' => 'How can I pay my invoice?'
    ]);

    // Seed similar verified KB answer
    \App\Models\VenaKnowledgeBase::create([
        'category' => 'billing',
        'question' => 'How do I pay invoices?',
        'agent_answer' => 'You can pay online via cards.',
        'times_seen' => 5,
        'ai_autonomous' => true
    ]);

    // Mock ChatAIService responses
    $this->mock(\App\Services\ChatAIService::class, function ($mock) {
        $mock->shouldReceive('respond')->andReturn(['text' => 'You can pay online via cards.']);
        $mock->shouldReceive('classifyCategory')->andReturn('billing');
    });

    // Call public/agent assist co-pilot endpoint with slug
    $response = $this->postJson("/api/{$tenant->slug}/vena/assist", [
        'session_uuid' => $session->session_uuid
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('confidence', 'high');
});
