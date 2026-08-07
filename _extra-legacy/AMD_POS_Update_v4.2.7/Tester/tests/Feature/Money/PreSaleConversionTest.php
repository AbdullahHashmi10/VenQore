<?php

use App\Models\SalesOrder;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Party;
use App\Models\Sale;
use App\Models\JournalEntry;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = $this->createTenant('conversion-store', 'ltd_3');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
});

test('M1-05: converting a pre-sale posts COGS and keeps the books balanced', function () {
    // 1. Create customer and product
    $party = Party::factory()->customer()->create(['tenant_id' => $this->tenant->id]);
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 50.00,
        'price' => 200.00,
        'tax_rate' => 10, // 10% tax rate
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 50]
    );

    // Seed FIFO batch with unit cost 50
    DB::table('inventory_batches')->insert([
        'id' => Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 50.00,
        'original_qty' => 50,
        'initial_qty' => 50,
        'remaining_qty' => 50,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // 2. Create a SalesOrder (pre_sale)
    $response = $this->postJson("/s/{$this->tenant->slug}/sales-orders", [
        'customer_id' => $party->id,
        'order_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'unit_price' => 200.00,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'shipping_charges' => 0,
        'warehouse_id' => $this->warehouseId,
    ]);
    $response->assertStatus(200);

    $order = SalesOrder::first();
    $this->assertNotNull($order);

    // 3. Convert it
    $convertResponse = $this->post("/s/{$this->tenant->slug}/sales-orders/{$order->id}/convert");
    $convertResponse->assertJson(['success' => true]);

    $sale = Sale::first();
    $this->assertNotNull($sale);

    // Assert: journal entry for the sale exists with correct COGS & revenue legs
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '5000', // COGS
        'debit' => 500.00, // 10 units * 50 cost
    ]);
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1100', // Inventory Asset
        'credit' => 500.00,
    ]);

    // Revenue: pre-tax revenue is 10 * 200 = 2000. Tax is 10% = 200. Total invoice = 2200.
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '1200', // AR
        'debit' => 2200.00,
    ]);
    $this->assertJournalEntry([
        'tenant_id' => $this->tenant->id,
        'account_code' => '4000', // Revenue
        'credit' => 2000.00,
    ]);
    $this->assertJournalEntry([
        'tenant_id'    => $this->tenant->id,
        'account_code' => '2100', // Sales Tax Payable (was '2200' = Loans Payable — M1-06b correction)
        'credit'       => 200.00,
    ]);

    // Assert: trial balance remains zero
    $this->assertTrialBalanceZero($this->tenant);

    // Assert: gross profit report shows correct COGS
    $gpService = resolve(FinancialReportingService::class);
    $report = $gpService->getGrossProfitByProduct(now()->toDateString(), now()->toDateString());
    
    $productRow = collect($report)->firstWhere('product_id', $product->id);
    $this->assertNotNull($productRow);
    $this->assertEquals(500.00, $productRow['cogs']);
    $this->assertEquals(2000.00, $productRow['net_revenue']);
    $this->assertEquals(1500.00, $productRow['gross_profit']);
});
