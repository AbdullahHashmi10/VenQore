<?php

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Models\Sale;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = $this->createTenant("pos-open-return-store", "ltd_3");
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table("warehouses")->where("tenant_id", $this->tenant->id)->value("id");
});

test('M1-09: a POS open-return REDUCES revenue, not increases it', function () {
    // 1. Create product & stock & FIFO batch
    $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 50.00,
        'price' => 100.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 10]
    );

    DB::table('inventory_batches')->insert([
        'id' => Str::uuid()->toString(),
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

    // 2. Post one normal sale of the product first so there's revenue
    $saleResponse = $this->postJson("/s/{$this->tenant->slug}/sales", [
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 100.00,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'amount_paid' => 100.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ]);
    $saleResponse->assertStatus(200);

    // Record baseline revenue
    $gpService = resolve(FinancialReportingService::class);
    $report = $gpService->getGrossProfitByProduct(now()->toDateString(), now()->toDateString());
    $productRow = collect($report)->firstWhere('product_id', $product->id);
    $this->assertNotNull($productRow);
    $baselineRevenue = (float) $productRow['net_revenue'];
    $this->assertEquals(100.00, $baselineRevenue);

    // 3. POST a POS open-return of qty 1 @ 100 for that product/warehouse
    $returnResponse = $this->postJson("/s/{$this->tenant->slug}/pos/return", [
        'warehouse_id' => $this->warehouseId,
        'idempotency_key' => Str::random(10),
        'refund_method' => 'cash',
        'reason' => 'Test POS return',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 100.00,
            ]
        ]
    ]);
    $returnResponse->assertStatus(200);

    // Assert: getGrossProfitByProduct net_revenue is LOWER by 100 (which means it must be 0)
    $reportAfter = $gpService->getGrossProfitByProduct(now()->toDateString(), now()->toDateString());
    $productRowAfter = collect($reportAfter)->firstWhere('product_id', $product->id);
    $this->assertNotNull($productRowAfter);
    $this->assertEquals(0.00, (float) $productRowAfter['net_revenue']);
    $this->assertEquals(0.00, (float) $productRowAfter['cogs']);

    // assertTrialBalanceZero
    $this->assertTrialBalanceZero($this->tenant);
});

test('M1-09: open-return restores stock to the SPECIFIED warehouse', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 50.00,
        'price' => 100.00,
    ]);

    // Create a second warehouse
    $w2Id = (string) Str::uuid();
    DB::table('warehouses')->insert([
        'id' => $w2Id,
        'tenant_id' => $this->tenant->id,
        'name' => 'Warehouse 2',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Seed stock of 5 in W1 and W2
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId, 'tenant_id' => $this->tenant->id],
        ['quantity' => 5]
    );
    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $w2Id, 'tenant_id' => $this->tenant->id],
        ['quantity' => 5]
    );

    // Post open-return for W2
    $returnResponse = $this->postJson("/s/{$this->tenant->slug}/pos/return", [
        'warehouse_id' => $w2Id,
        'idempotency_key' => Str::random(10),
        'refund_method' => 'cash',
        'reason' => 'Test restore warehouse',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 100.00,
            ]
        ]
    ]);
    $returnResponse->assertStatus(200);

    // Assert W2 stock increased by 2 (5 -> 7), W1 unchanged (5)
    $this->assertEquals(5, DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $this->warehouseId)->value('quantity'));
    $this->assertEquals(7, DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $w2Id)->value('quantity'));
});

test('M1-09: a double-submitted open-return refunds only once', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 50.00,
        'price' => 100.00,
    ]);

    $idempotencyKey = Str::random(16);

    $payload = [
        'warehouse_id' => $this->warehouseId,
        'idempotency_key' => $idempotencyKey,
        'refund_method' => 'cash',
        'reason' => 'Duplicate submit test',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 100.00,
            ]
        ]
    ];

    // Fire the same open-return twice
    $response1 = $this->postJson("/s/{$this->tenant->slug}/pos/return", $payload);
    $response2 = $this->postJson("/s/{$this->tenant->slug}/pos/return", $payload);

    $response1->assertStatus(200);
    $response2->assertStatus(200);

    // Assert: only ONE return Sale exists; total refund == one return, not two
    $salesCount = DB::table('sales')->where('tenant_id', $this->tenant->id)->where('status', 'returned')->count();
    $this->assertEquals(1, $salesCount);

    $sale = Sale::where('tenant_id', $this->tenant->id)->where('status', 'returned')->first();
    $this->assertEquals(-100.00, (float)$sale->total);

    // Also assert only one journal entry exists for this return
    $journalCount = DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference', $sale->id)->count();
    $this->assertEquals(1, $journalCount);
});
