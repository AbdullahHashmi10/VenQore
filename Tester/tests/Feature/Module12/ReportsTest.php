<?php

namespace Tests\Feature\Module12;

use Tests\Feature\VenQoreTestCase;

test('profit_and_loss_revenue_equals_sum_of_net_sales', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100]);
    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => 1000,
    ]);

    // Create 3 sales via endpoint to trigger all observers properly
    $amounts = [100, 250, 400];
    foreach ($amounts as $amount) {
        $payload = [
            'customer_id' => null,
            'warehouse_id' => $warehouse->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'price' => $amount,
                    'discount' => 0,
                ]
            ],
            'discount' => 0,
            'amount_paid' => $amount,
            'payment_method' => 'cash',
            'add_to_ledger' => false,
        ];
        $response = $this->postJson("/s/{$tenant->slug}/sales", $payload);
        if ($response->status() !== 200 && $response->status() !== 201) {
            $response->dump();
        }
        $response->assertOk();
    }

    // Hit P&L endpoint
    $response = $this->get("/s/{$tenant->slug}/reports/profit-loss");
    $response->assertOk();

    // Assert revenue figure matches the sum ($750)
    $props = $response->viewData('page')['props'];
    $this->assertEquals(750, $props['stats']['revenue']);
});

test('daily sales report calculates correct revenue', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100]);
    $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();
    \App\Models\Stock::create([
        'tenant_id' => $tenant->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => 1000,
    ]);

    // Create a sale via endpoint
    $payload = [
        'customer_id' => null,
        'warehouse_id' => $warehouse->id,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 150,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 300,
        'payment_method' => 'cash',
        'add_to_ledger' => false,
    ];

    $response = $this->postJson("/s/{$tenant->slug}/sales", $payload);
    $response->assertOk();

    // Hit the daily-sales endpoint
    $responseReport = $this->get("/s/{$tenant->slug}/reports/daily-sales");
    $responseReport->assertOk();

    $props = $responseReport->viewData('page')['props'];
    $this->assertEquals(300, $props['stats']['total_revenue']);
    $this->assertEquals(1, $props['stats']['total_count']);
});

test('stock valuation report calculates correct value based on fifo', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Valuation Main', 'code' => 'VM-1']);
    $product1 = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Prod A', 'sku' => 'SKU-A']);
    $product2 = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Prod B', 'sku' => 'SKU-B']);

    // Seed inventory_batches
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        [
            'tenant_id' => $tenant->id,
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'product_id' => $product1->id,
            'warehouse_id' => $warehouse->id,
            'batch_type' => 'purchase',
            'unit_cost' => 10.00,
            'original_qty' => 5.00,
            'initial_qty' => 5.00,
            'remaining_qty' => 5.00,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'tenant_id' => $tenant->id,
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'product_id' => $product1->id,
            'warehouse_id' => $warehouse->id,
            'batch_type' => 'purchase',
            'unit_cost' => 12.00,
            'original_qty' => 10.00,
            'initial_qty' => 10.00,
            'remaining_qty' => 10.00,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'tenant_id' => $tenant->id,
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'product_id' => $product2->id,
            'warehouse_id' => $warehouse->id,
            'batch_type' => 'purchase',
            'unit_cost' => 20.00,
            'original_qty' => 8.00,
            'initial_qty' => 8.00,
            'remaining_qty' => 8.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]
    ]);

    $response = $this->getJson("/s/{$tenant->slug}/v3/reports/inventory-valuation");
    $response->assertOk();

    $data = $response->json();
    
    // Total value: (5 * 10) + (10 * 12) + (8 * 20) = 50 + 120 + 160 = 330.00
    $this->assertEquals(330.00, (float) $data['grand_total']);
    
    // Assert there are 2 rows (grouped by product and warehouse)
    $this->assertCount(2, $data['rows']);

    $rowA = collect($data['rows'])->firstWhere('product_id', $product1->id);
    $this->assertNotNull($rowA);
    $this->assertEquals(15.00, (float) $rowA['total_qty']);
    $this->assertEquals(170.00, (float) $rowA['total_value']);

    $rowB = collect($data['rows'])->firstWhere('product_id', $product2->id);
    $this->assertNotNull($rowB);
    $this->assertEquals(8.00, (float) $rowB['total_qty']);
    $this->assertEquals(160.00, (float) $rowB['total_value']);
});

test('tax report calculates correct tax payable', function () {
    $tenant = $this->createTenant(plan: 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $cashAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '1000')->first();
    
    // M1-06b correction: 2100 = Sales Tax Payable (2200 = Loans Payable — wrong account).
    $outputTaxAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '2100')->first();
    if (!$outputTaxAccount) {
        $outputTaxAccount = \App\Models\Account::forceCreate([
            'tenant_id'      => $tenant->id,
            'code'           => '2100',
            'name'           => 'Sales Tax Payable',
            'type'           => 'liability',
            'normal_balance' => 'credit',
        ]);
    }

    $inputTaxAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '2300')->first();
    if (!$inputTaxAccount) {
        $inputTaxAccount = \App\Models\Account::forceCreate([
            'tenant_id'      => $tenant->id,
            'code'           => '2300',
            'name'           => 'Input Tax',
            'type'           => 'asset',
            'normal_balance' => 'debit',
        ]);
    }

    $this->assertNotNull($cashAccount);
    $this->assertNotNull($outputTaxAccount);
    $this->assertNotNull($inputTaxAccount);

    $accountingSvc = app(\App\Services\V3\AccountingService::class);

    // Inject entries within transaction to satisfy AccountingService golden rules
    \Illuminate\Support\Facades\DB::transaction(function () use ($accountingSvc, $cashAccount, $outputTaxAccount, $inputTaxAccount) {
        // 1. Inject Entry for Output Tax: DR Cash 50 / CR Output Tax 50
        $accountingSvc->createEntry([
            'date'           => now()->format('Y-m-d'),
            'reference_type' => 'sale',
            'reference'      => 'TAX-TEST-OUT',
            'description'    => 'Test output tax',
            'created_by'     => auth()->id(),
        ], [
            ['account_id' => $cashAccount->id,        'debit' => 50, 'credit' => 0],
            ['account_id' => $outputTaxAccount->id,   'debit' => 0,  'credit' => 50],
        ]);

        // 2. Inject Entry for Input Tax: DR Input Tax 30 / CR Cash 30
        $accountingSvc->createEntry([
            'date'           => now()->format('Y-m-d'),
            'reference_type' => 'purchase',
            'reference'      => 'TAX-TEST-IN',
            'description'    => 'Test input tax',
            'created_by'     => auth()->id(),
        ], [
            ['account_id' => $inputTaxAccount->id,    'debit' => 30, 'credit' => 0],
            ['account_id' => $cashAccount->id,        'debit' => 0,  'credit' => 30],
        ]);
    });

    $response = $this->getJson("/s/{$tenant->slug}/v3/reports/tax?from=" . now()->toDateString() . "&to=" . now()->toDateString());
    $response->assertOk();

    $data = $response->json();
    $this->assertEquals(50.00, (float) $data['output_tax']);
    $this->assertEquals(30.00, (float) $data['input_tax']);
    $this->assertEquals(20.00, (float) $data['net_payable']);
});

test('sales_orders_and_sales_order_items_reports_load_real_data', function () {
    $tenant = $this->createTenant(null, 'ltd_3');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $customer = \App\Models\Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100]);

    // Create a Sales Order
    $order = \App\Models\SalesOrder::create([
        'tenant_id' => $tenant->id,
        'order_number' => 'SO-' . time() . '-' . rand(1000, 9999),
        'customer_id' => $customer->id,
        'customer_name' => $customer->name,
        'order_date' => now()->toDateString(),
        'status' => 'pending',
        'total_amount' => 500,
        'user_id' => auth()->id(),
    ]);

    // Create a Sales Order Item
    \App\Models\SalesOrderItem::create([
        'tenant_id' => $tenant->id,
        'sales_order_id' => $order->id,
        'product_id' => $product->id,
        'quantity_requested' => 5,
        'quantity_reserved' => 5,
        'unit_price' => 100,
        'subtotal' => 500,
    ]);

    // Hit the sale-orders report endpoint
    $responseOrders = $this->get("/s/{$tenant->slug}/reports/sale-orders");
    $responseOrders->assertOk();
    $ordersProps = $responseOrders->viewData('page')['props'];
    expect($ordersProps['orders'])->not->toBeEmpty();
    expect($ordersProps['orders'][0]['order_number'])->toBe($order->order_number);

    // Hit the sale-order-items report endpoint
    $responseItems = $this->get("/s/{$tenant->slug}/reports/sale-order-items");
    $responseItems->assertOk();
    $itemsProps = $responseItems->viewData('page')['props'];
    expect($itemsProps['items'])->not->toBeEmpty();
    expect($itemsProps['items'][0]['sales_order']['order_number'])->toBe($order->order_number);
    expect($itemsProps['items'][0]['product']['name'])->toBe($product->name);
});

test('cash_flow_report_loads_with_filters_and_data', function () {
    $tenant = $this->createTenant(null, 'ltd_3');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $response = $this->get("/s/{$tenant->slug}/reports/cash-flow");
    $response->assertOk();
    $props = $response->viewData('page')['props'];
    expect($props)->toHaveKeys(['operating', 'investing', 'financing', 'stats']);
});

test('tax_report_returns_mapped_columns_to_match_tax_jsx', function () {
    $tenant = $this->createTenant(null, 'ltd_3');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $response = $this->get("/s/{$tenant->slug}/reports/tax");
    $response->assertOk();
    $props = $response->viewData('page')['props'];
    expect($props)->toHaveKeys(['tax_records', 'stats', 'filters']);
});

test('customer_and_item_party_reports_render_correct_inertia_views', function () {
    $tenant = $this->createTenant(null, 'ltd_3');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    // Hit Item Report by Customer
    $responseItemReport = $this->get("/s/{$tenant->slug}/reports/item-report-by-party");
    $responseItemReport->assertOk();
    $propsItem = $responseItemReport->viewData('page')['props'];
    expect($propsItem)->toHaveKeys(['data', 'stats', 'filters']);

    // Hit Customer Report by Item
    $responsePartyReport = $this->get("/s/{$tenant->slug}/reports/party-report-by-item");
    $responsePartyReport->assertOk();
    $propsParty = $responsePartyReport->viewData('page')['props'];
    expect($propsParty)->toHaveKeys(['data', 'stats', 'filters']);
});

test('excludes returned sales and reversed cogs from gross profit calculations', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Valuation Main', 'code' => 'VM-1']);
    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100, 'cost_price' => 50]);

    // Seed stock batch
    $batchId = \Illuminate\Support\Str::uuid()->toString();
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => $batchId,
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create a sale service instance and post it
    $saleService = app(\App\Services\V3\SaleService::class);
    $sale = $saleService->post([
        'tenant_id' => $tenant->id,
        'customer_id' => null,
        'warehouse_id' => $warehouse->id,
        'sale_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 2,
                'sale_uom' => 'PCS',
                'unit_price' => 100,
            ]
        ]
    ]);

    // Gross profit check before return: net revenue = 200, COGS = 100, profit = 100
    $report = app(\App\Services\FinancialReportingService::class)->getGrossProfitByProduct(
        now()->toDateString(),
        now()->toDateString()
    );
    
    $row = $report->firstWhere('product_id', $product->id);
    expect($row)->not->toBeNull();
    expect((float) $row['net_revenue'])->toBe(200.0);
    expect((float) $row['cogs'])->toBe(100.0);
    expect((float) $row['gross_profit'])->toBe(100.0);

    // Now reverse/return the sale
    $saleService->reverse($sale->id, 'Returned by customer');

    // Gross profit check after return: should reflect 0 revenue/COGS/profit
    $reportAfter = app(\App\Services\FinancialReportingService::class)->getGrossProfitByProduct(
        now()->toDateString(),
        now()->toDateString()
    );

    $rowAfter = $reportAfter->firstWhere('product_id', $product->id);
    // Since it's fully returned, it should not contribute to gross profit or be returned as 0
    if ($rowAfter) {
        expect((float) $rowAfter['net_revenue'])->toBe(0.0);
        expect((float) $rowAfter['cogs'])->toBe(0.0);
        expect((float) $rowAfter['gross_profit'])->toBe(0.0);
    } else {
        expect($rowAfter)->toBeNull();
    }
});

test('excludes reversed journal entries from party statement reports', function () {
    $tenant = $this->createTenant(plan: 'business');
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $party = \App\Models\Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
    $arAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '1200')->first();
    $cashAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '1000')->first();

    $accountingSvc = app(\App\Services\V3\AccountingService::class);
    
    // Post transaction
    $entry = \Illuminate\Support\Facades\DB::transaction(function () use ($accountingSvc, $party, $arAccount, $cashAccount) {
        return $accountingSvc->createEntry([
            'date'           => now()->format('Y-m-d'),
            'reference_type' => 'sale',
            'reference'      => 'REV-TEST-SALE',
            'description'    => 'Test party entry',
            'party_id'       => $party->id,
            'created_by'     => auth()->id(),
        ], [
            ['account_id' => $arAccount->id,   'debit' => 150, 'credit' => 0, 'party_id' => $party->id],
            ['account_id' => $cashAccount->id, 'debit' => 0,   'credit' => 150],
        ]);
    });

    // Reverse it
    $accountingSvc->reverseEntry($entry->id, 'Returned');

    // Fetch party statement via controller logic simulation or HTTP endpoint
    $response = $this->get("/s/{$tenant->slug}/reports/party-statement?party_id={$party->id}");
    $response->assertOk();

    $props = $response->viewData('page')['props'];
    
    // Both opening and closing balances should remain 0, and the transactions list should be empty
    expect((float) $props['openingBalance'])->toBe(0.0);
    expect((float) $props['closingBalance'])->toBe(0.0);
    expect($props['transactions'])->toBeEmpty();
});

test('strictly isolates tenant data in v3 reports and exports', function () {
    $tenantA = $this->createTenant(plan: 'business');
    $tenantB = $this->createTenant(plan: 'business');

    // Create data in Tenant B
    $partyB = \App\Models\Party::factory()->create(['tenant_id' => $tenantB->id, 'type' => 'customer', 'name' => 'Foreign Client']);

    // Act as Tenant A
    $this->actingAsOwner($tenantA);
    $this->seedTenantDefaults($tenantA);

    // Attempt to access party statement of Tenant B's customer under Tenant A's route
    $response = $this->get("/s/{$tenantA->slug}/reports/party-statement?party_id={$partyB->id}");
    $response->assertOk();

    // Verify B's customer and its transactions are completely invisible to A
    $props = $response->viewData('page')['props'];
    expect($props['party'])->toBeNull();
    expect($props['transactions'])->toBeEmpty();
});

test('prevents DivisionByZeroError on zero or fractional stock quantities in valuation reports', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Zero Val Store', 'code' => 'ZVS-1']);
    $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100]);

    // Seed an inventory batch with extremely tiny fractional remaining quantity (simulating rounding errors)
    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 0.0001, // extremely small quantity that fits in decimal(12,4)
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Request valuation report
    $response = $this->getJson("/s/{$tenant->slug}/v3/reports/inventory-valuation");
    
    // Should load successfully without dividing by zero or throwing float precision crashes
    $response->assertOk();
    
    $data = $response->json();
    expect($data['rows'])->not->toBeEmpty();
});


