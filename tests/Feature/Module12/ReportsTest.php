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
    // TODO: Calculates correct revenue
})->todo();

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
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $cashAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '1000')->first();
    
    $outputTaxAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '2200')->first();
    if (!$outputTaxAccount) {
        $outputTaxAccount = \App\Models\Account::forceCreate([
            'tenant_id' => $tenant->id,
            'code' => '2200',
            'name' => 'Output Tax',
            'type' => 'liability',
            'normal_balance' => 'credit',
        ]);
    }

    $inputTaxAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '2300')->first();
    if (!$inputTaxAccount) {
        $inputTaxAccount = \App\Models\Account::forceCreate([
            'tenant_id' => $tenant->id,
            'code' => '2300',
            'name' => 'Input Tax',
            'type' => 'asset',
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
