<?php

namespace Tests\Feature\Module14;

use App\Models\Product;
use App\Models\Account;
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
        'user_id' => 1,
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
        'user_id' => 1,
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
        'reference_type' => 'manual', 'user_id' => 1, 'is_reversed' => 0, 'created_at' => now(), 'updated_at' => now()
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
