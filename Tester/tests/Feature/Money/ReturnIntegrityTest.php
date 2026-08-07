<?php

uses(\Tests\Feature\VenQoreTestCase::class);

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  SELLABLE-BLOCKER ACCEPTANCE TESTS — Returns money-integrity
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  These tests assert CORRECT accounting behaviour around returns.
 *  They are RUTHLESS and UNBIASED by design:
 *
 *    - They are EXPECTED TO FAIL (red) on the current code base.
 *    - They go green ONLY when the real fixes land:
 *        • M1-01  add `returned_quantity` to sale_items + cap partial returns
 *        • M1-02  net returned qty/revenue/COGS out of the profit reports
 *
 *  DO NOT weaken these assertions to make the bar green.
 *  The bar is the spec. Fix the code until the spec passes.
 *
 *  Ref: VenQore_Forensic_Audit_Report.md  (Findings F1, F2)
 *       VenQore_Implementation_Plan.md     (Items M1-01, M1-02)
 *
 *  NOTE on test DB: this suite currently runs on SQLite :memory: (see
 *  VenQoreTestCase). Money-math here is DB-agnostic so SQLite is acceptable,
 *  but the harness MUST be moved to MySQL (amd_pos_test) before the
 *  fractional-quantity suite (F9) can be trusted. See build log Tester-Fix-0.
 */

use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;



beforeEach(function () {
    $this->tenant = $this->createTenant('money-store');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
    SettingsHelper::clearCache();
});

/**
 * Insert a FIFO inventory batch for a product.
 */
$makeBatch = function ($tenant, $warehouseId, $productId, $cost, $qty, $createdAt = null) {
    DB::table('inventory_batches')->insert([
        'id'            => Str::uuid()->toString(),
        'tenant_id'     => $tenant->id,
        'product_id'    => $productId,
        'warehouse_id'  => $warehouseId,
        'unit_cost'     => $cost,
        'original_qty'  => $qty,
        'initial_qty'   => $qty,
        'remaining_qty' => $qty,
        'created_at'    => $createdAt ?? now(),
        'updated_at'    => now(),
    ]);
};

/* ───────────────────────────────────────────────────────────────────────────
 *  M1-01 — A partial return can NEVER refund more than was sold.
 *
 *  Scenario (the F1 exploit):
 *    Sell 5 units @ Rs 200  →  net_sales = Rs 1,000.
 *    Return 3 units  → legal (refund Rs 600).
 *    Return 3 units AGAIN → only 2 remain; system must cap at 2 then block.
 *    Return 3 units a THIRD time → must be fully blocked.
 *
 *  INVARIANT (money can't be conjured):
 *    Σ |refund payments|  ≤  net_sales (Rs 1,000)
 *    total units returned  ≤  units sold (5)
 *  Today the code refunds 3+3+3 = 9 units (Rs 1,800) → this test FAILS until M1-01.
 * ─────────────────────────────────────────────────────────────────────────── */
test('M1-01: repeated partial returns cannot refund more than was sold', function () use ($makeBatch) {
    $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
    $product  = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price'     => 200.00,
        'cost_price'=> 100.00,
        'tax_rate'  => 0,
    ]);
    Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);
    $makeBatch($this->tenant, $this->warehouseId, $product->id, 100.00, 10);

    // Sell 5 units @ 200 = 1,000 (cash, fully paid)
    $sale = $this->post($this->storeUrl($this->tenant, 'sales'), [
        'customer_id'    => $customer->id,
        'warehouse_id'   => $this->warehouseId,
        'items'          => [['product_id' => $product->id, 'quantity' => 5, 'price' => 200.00, 'discount' => 0]],
        'payment_method' => 'cash',
        'amount_paid'    => 1000.00,
    ]);
    $sale->assertStatus(200);
    $saleId = $sale->json('sale_id');
    $netSales = (float) DB::table('sales')->where('id', $saleId)->value('net_sales');
    $itemId   = DB::table('sale_items')->where('sale_id', $saleId)->value('id');

    // Fire three partial returns of 3 units each (9 > 5 sold).
    foreach (range(1, 3) as $_) {
        $this->post($this->storeUrl($this->tenant, "sales/{$saleId}/return"), [
            'items'         => [['id' => $itemId, 'quantity' => 3]],
            'refund_method' => 'cash',
            'refund_source' => 'cash_drawer',
            'reason'        => 'test repeated partial',
        ]);
    }

    // INVARIANT 1 — total refunded cannot exceed what was actually sold.
    $refunded = (float) abs(DB::table('payments')->where('sale_id', $saleId)->where('amount', '<', 0)->sum('amount'));
    expect($refunded)->toBeLessThanOrEqual(round($netSales, 2),
        "GHOST REFUND: refunded Rs {$refunded} against a Rs {$netSales} sale. Partial returns are not capped (F1 / M1-01).");

    // INVARIANT 2 — books still balance after the returns.
    $this->assertTrialBalanceZero($this->tenant);
});

/* ───────────────────────────────────────────────────────────────────────────
 *  M1-02 (NORTH STAR) — The golden transaction.
 *
 *    Buy 10 @ Rs 50, then 10 @ Rs 100.
 *    Sell 15 @ Rs 200 on credit  → FIFO COGS = 10×50 + 5×100 = 1,000; revenue 3,000.
 *    Partially return 2 units.
 *
 *  The Item-wise Profit report MUST then show the 13 KEPT units, not 15:
 *    quantity     = 13         (not 15 — the 2 returned units are gone)
 *    net_revenue  = 2,600      (13 × 200, not 3,000)
 *
 *  Today the report reads sale_items by status incl. 'partially_returned' at
 *  FULL original value → shows 15 units / 3,000 (ghost revenue). FAILS until M1-02.
 * ─────────────────────────────────────────────────────────────────────────── */
test('M1-02 north-star: item-wise profit nets the 2 returned units (shows 13, not 15)', function () use ($makeBatch) {
    $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer', 'credit_limit' => null]);
    $product  = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'price'     => 200.00,
        'cost_price'=> 50.00,
        'tax_rate'  => 0,
    ]);
    Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 20]);
    // Two batches, oldest first (FIFO): 10 @ 50, then 10 @ 100.
    $makeBatch($this->tenant, $this->warehouseId, $product->id, 50.00, 10, now()->subMinutes(10));
    $makeBatch($this->tenant, $this->warehouseId, $product->id, 100.00, 10, now()->subMinutes(5));

    // Sell 15 @ 200 on credit.
    $sale = $this->post($this->storeUrl($this->tenant, 'sales'), [
        'customer_id'    => $customer->id,
        'warehouse_id'   => $this->warehouseId,
        'items'          => [['product_id' => $product->id, 'quantity' => 15, 'price' => 200.00, 'discount' => 0]],
        'payment_method' => 'credit',
        'amount_paid'    => 0,
        'add_to_ledger'  => true,
    ]);
    $sale->assertStatus(200);
    $saleId = $sale->json('sale_id');
    $itemId = DB::table('sale_items')->where('sale_id', $saleId)->value('id');

    // Partially return 2 units.
    $this->post($this->storeUrl($this->tenant, "sales/{$saleId}/return"), [
        'items'         => [['id' => $itemId, 'quantity' => 2]],
        'refund_method' => 'ledger',
        'refund_source' => 'cash_drawer',
        'reason'        => 'golden txn partial return',
    ]);

    // Item-wise profit report = ReportController::itemWiseProfit data source.
    $rows = app(\App\Services\FinancialReportingService::class)
        ->getGrossProfitByProduct(now()->toDateString(), now()->toDateString());
    $row = collect($rows)->firstWhere('product_id', $product->id);

    expect($row)->not->toBeNull('Item-wise profit report returned no row for the product.');

    // THE PROOF: kept units = 13, not 15.
    expect(round((float) $row['quantity'], 2))->toEqual(13.00,
        'GHOST REVENUE: item-wise report still counts returned units (F2 / M1-02). Expected 13 kept units.');

    // Kept revenue = 13 × 200 = 2,600 (not 3,000).
    expect(round((float) $row['net_revenue'], 2))->toEqual(2600.00,
        'GHOST REVENUE: item-wise revenue not netted for the return. Expected Rs 2,600.');

    // Books still balance.
    $this->assertTrialBalanceZero($this->tenant);
});
