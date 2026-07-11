<?php

use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = $this->createTenant('golden-store', 'ltd_3');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
});

test('GOLDEN: full lifecycle — buy, sell on credit, partial return — every number correct', function () {
    // 1. Setup customer and product
    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'customer',
        'credit_limit' => 100000.00
    ]);
    
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price' => 200.00,
        'cost_price' => 50.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 20]
    );

    // 2. PURCHASE/receive stock as TWO FIFO batches: 10 units @ cost 50, then 10 units @ cost 100
    DB::table('inventory_batches')->insert([
        [
            'id' => Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouseId,
            'unit_cost' => 50.00,
            'original_qty' => 10.00,
            'initial_qty' => 10.00,
            'remaining_qty' => 10.00,
            'created_at' => now()->subMinutes(10),
            'updated_at' => now(),
        ],
        [
            'id' => Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouseId,
            'unit_cost' => 100.00,
            'original_qty' => 10.00,
            'initial_qty' => 10.00,
            'remaining_qty' => 10.00,
            'created_at' => now()->subMinutes(5),
            'updated_at' => now(),
        ]
    ]);

    // 3. SELL 15 units @ price 200 on CREDIT (add_to_ledger)
    $payload = [
        'customer_id' => $customer->id,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 15,
                'price' => 200.00,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'amount_paid' => 0, // credit
        'payment_method' => 'credit',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertStatus(200);

    $saleId = $response->json('sale_id');
    $this->assertNotNull($saleId);

    // Independent check: sale header net_sales
    $saleHeader = DB::table('sales')->where('id', $saleId)->first();
    $this->assertEquals(3000.0000, (float) $saleHeader->net_sales);

    // Independent check: FIFO COGS for the sale (10*50 + 5*100 = 1000)
    $itemId = DB::table('sale_items')->where('sale_id', $saleId)->value('id');
    $cogs = (float) DB::table('sale_item_batches')->where('sale_item_id', $itemId)->sum(DB::raw('qty_deducted * unit_cost'));
    $this->assertEquals(1000.00, $cogs);

    // 4. PARTIAL RETURN of 2 units
    $returnResponse = $this->postJson("/s/{$this->tenant->slug}/sales/{$saleId}/return", [
        'items' => [['id' => $itemId, 'quantity' => 2]],
        'refund_method' => 'ledger',
        'refund_source' => 'cash_drawer',
        'reason' => 'golden return',
    ]);
    $returnResponse->assertRedirect();

    // Assert (a) sale_items / sale header reflect the sale; returned_quantity = 2 after the return
    $saleItem = DB::table('sale_items')->where('id', $itemId)->first();
    $this->assertEquals(2.0000, (float) $saleItem->returned_quantity);

    // Assert (b) FIFO: sale_item_batches COGS for the sale == 1000 pre-return; batches deducted oldest-first
    // We already verified the pre-return COGS was 1000. Let's make sure the oldest-first FIFO queue was consumed correctly:
    // 10 units of the first batch (cost 50) and 5 units of the second batch (cost 100).
    $deductions = DB::table('sale_item_batches')
        ->join('inventory_batches', 'sale_item_batches.inventory_batch_id', '=', 'inventory_batches.id')
        ->where('sale_item_id', $itemId)
        ->select('inventory_batches.unit_cost', 'sale_item_batches.qty_deducted')
        ->orderBy('inventory_batches.created_at', 'asc')
        ->get();

    $this->assertCount(2, $deductions);
    $this->assertEquals(50.00, (float) $deductions[0]->unit_cost);
    $this->assertEquals(10.00, (float) $deductions[0]->qty_deducted);
    $this->assertEquals(100.00, (float) $deductions[1]->unit_cost);
    $this->assertEquals(3.00, (float) $deductions[1]->qty_deducted);

    // Assert (c) Item-wise Profit report (getGrossProfitByProduct) shows quantity == 13 and net_revenue == 2600
    $reportingService = app(\App\Services\FinancialReportingService::class);
    $rows = collect($reportingService->getGrossProfitByProduct(now()->toDateString(), now()->toDateString()));
    $productProfit = $rows->firstWhere('product_id', $product->id);
    
    $this->assertNotNull($productProfit);
    $this->assertEquals(13.00, (float) $productProfit['quantity']);
    $this->assertEquals(2600.00, (float) $productProfit['net_revenue']);

    // Assert (d) P&L gross profit == item-wise gross profit (the two must agree to the cent)
    $itemWiseGP = (float) $productProfit['gross_profit'];
    $profitReport = $reportingService->getProfitAndLoss(now()->toDateString(), now()->toDateString());
    $plGP = (float) $profitReport['gross_profit'];

    $this->assertEquals(round($plGP, 2), round($itemWiseGP, 2),
        'Item-wise GP and P&L GP MUST agree to the cent after a return');
    $this->assertEquals(1800.00, round($plGP, 2));


    // Assert (e) Trial balance: SUM(journal_items.debit) == SUM(credit) — exact
    $debits = (float) DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.tenant_id', $this->tenant->id)
        ->sum('debit');
    $credits = (float) DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.tenant_id', $this->tenant->id)
        ->sum('credit');
    $this->assertEquals($debits, $credits);
    $this->assertTrialBalanceZero($this->tenant);

    // Assert (f) AR/customer ledger reflects the credit sale minus the return credit
    // Credit Sale = 3000.00, Return Credit = 400.00. Expected AR balance = 2600.00.
    $responseStatement = $this->get("/s/{$this->tenant->slug}/reports/party-statement?party_id={$customer->id}");
    $responseStatement->assertOk();
    $props = $responseStatement->viewData("page")["props"];
    $customerBalance = (float) $props["closingBalance"];
    $this->assertEquals(2600.00, $customerBalance);

    // Assert (g) Stock: remaining_qty across batches == 20 purchased - 13 kept-sold = 7 (returned 2 went back)
    $remainingQty = (float) DB::table('inventory_batches')
        ->where('product_id', $product->id)
        ->sum('remaining_qty');
    $this->assertEquals(7.0000, $remainingQty);
});
