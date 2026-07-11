<?php

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    \Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-06-15 12:00:00', 'UTC'));
});

afterEach(function () {
    \Carbon\Carbon::setTestNow();
});

test('M1-XX: sales list month filter includes sales created in the current month', function () {
    $tenant = $this->createTenant('sales-filter-store', 'ltd_3');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouseId = DB::table('warehouses')
        ->where('tenant_id', $tenant->id)
        ->value('id');

    $customer = \App\Models\Party::factory()->customer()->create(['tenant_id' => $tenant->id]);

    // Create one posted Sale for this tenant with created_at/posted_at set to now (June 15)
    $sale = Sale::create([
        'tenant_id' => $tenant->id,
        'reference_number' => 'SAL-FIL-0001',
        'source' => 'manual',
        'party_id' => $customer->id,
        'user_id' => auth()->id() ?? 1,
        'warehouse_id' => $warehouseId,
        'subtotal' => 200.00,
        'tax' => 0.00,
        'discount' => 0.00,
        'total' => 200.00,
        'net_sales' => 200.00,
        'status' => 'posted',
        'posted_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Hit the sales-list route with the month filter
    $response = $this->get("/s/{$tenant->slug}/sales/list?filter=month");
    $response->assertOk();

    $props = $response->viewData('page')['props'];

    // Verify sales data contains the created sale
    $this->assertArrayHasKey('sales', $props);
    $this->assertArrayHasKey('data', $props['sales']);
    
    $saleIds = collect($props['sales']['data'])->pluck('id')->all();
    $this->assertContains($sale->id, $saleIds, "Sales list with 'filter=month' is missing the sale from the current month.");
});
