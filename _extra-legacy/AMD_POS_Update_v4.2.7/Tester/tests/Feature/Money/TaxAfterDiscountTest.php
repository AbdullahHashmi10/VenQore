<?php

/**
 * M1-06 — Tax After Discount Test
 *
 * Verifies that the order-level (global/invoice) discount reduces the taxable
 * base BEFORE tax is computed.  This is the correct accounting waterfall:
 *
 *   gross           = Σ(qty × unit_price)
 *   item_discounts  = Σ per-line discounts
 *   order_discount  = invoice/global discount
 *   net_sales       = gross − item_discounts − order_discount   ← taxable base
 *   tax             = net_sales × tax_rate
 *   invoice_total   = net_sales + tax
 *
 * Finding F7 / Plan item M1-06.
 */

use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant      = $this->createTenant('tax-discount-store', 'ltd_4');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')
        ->where('tenant_id', $this->tenant->id)
        ->value('id');
});

test('M1-06: order discount reduces the tax base — simple case', function () {
    // ─── SETUP ────────────────────────────────────────────────────────────────
    // 1 item, price 100, qty 1 → gross = 100
    // No item discount → net_line = 100
    // Order (global) discount = 50
    // Tax rate = 10%
    //
    // CORRECT waterfall:
    //   net_sales     = 100 − 0 − 50 = 50   ← taxable base
    //   tax           = 50 × 10%    = 5.00
    //   invoice_total = 50 + 5      = 55.00
    //
    // WRONG (pre-fix) result:
    //   tax           = 100 × 10%   = 10.00  (global discount ignored)
    //   invoice_total = 50 + 10     = 60.00

    $product = Product::factory()->create([
        'tenant_id'  => $this->tenant->id,
        'price'      => 100.00,
        'tax_rate'   => 10,        // 10%
        'cost_price' => 40.00,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 50]
    );

    DB::table('inventory_batches')->insert([
        'id'            => Str::uuid()->toString(),
        'tenant_id'     => $this->tenant->id,
        'product_id'    => $product->id,
        'warehouse_id'  => $this->warehouseId,
        'unit_cost'     => 40.00,
        'original_qty'  => 50,
        'initial_qty'   => 50,
        'remaining_qty' => 50,
        'created_at'    => now(),
        'updated_at'    => now(),
    ]);

    $customer = Party::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type'      => 'customer',
    ]);

    // ─── ACT ──────────────────────────────────────────────────────────────────
    $response = $this->post("/s/{$this->tenant->slug}/sales", [
        'customer_id'    => $customer->id,
        'warehouse_id'   => $this->warehouseId,
        'items'          => [[
            'product_id' => $product->id,
            'quantity'   => 1,
            'price'      => 100.00,
            'discount'   => 0.00,  // no item-level discount
        ]],
        'discount'       => 50.00, // order-level global discount
        'payment_method' => 'cash',
        'amount_paid'    => 55.00, // net 50 + tax 5
    ]);

    $response->assertStatus(200);

    // ─── ASSERT: sale header numbers ──────────────────────────────────────────
    $saleId = $response->json('sale_id');
    $sale   = DB::table('sales')->where('id', $saleId)->first();

    $this->assertNotNull($sale, 'Sale record must exist after POST');

    // subtotal = gross (no free-qty, no item discount on the gross line)
    $this->assertEquals(
        100.00,
        (float) $sale->subtotal,
        'Subtotal (gross) should be 100.00'
    );

    // net_sales = taxable base = gross − item discounts − order discount
    $this->assertEquals(
        50.00,
        (float) $sale->net_sales,
        'net_sales must be 50.00 (100 gross − 0 item discount − 50 order discount)'
    );

    // total_tax = 10% of 50.00 = 5.00  (NOT 10% of 100.00 = 10.00)
    $this->assertEquals(
        5.00,
        (float) $sale->total_tax,
        'total_tax must be 5.00 — tax computed on net_sales (50), NOT on pre-discount gross (100)'
    );

    // invoice_total = net_sales + tax = 55.00
    $this->assertEquals(
        55.00,
        (float) $sale->invoice_total,
        'invoice_total must be 55.00 (50 net + 5 tax)'
    );

    // ─── ASSERT: journal entry — Sales Tax Payable (2100) credit = 5.00 ───────
    // SaleController::postSaleJournal() credits account 2100 with $totalTax.
    $this->assertJournalEntry([
        'tenant_id'    => $this->tenant->id,
        'account_code' => '2100', // Sales Tax Payable
        'credit'       => 5.00,
    ]);

    // Revenue (4000) credited with net_sales = 50.00
    $this->assertJournalEntry([
        'tenant_id'    => $this->tenant->id,
        'account_code' => '4000',
        'credit'       => 50.00,
    ]);

    // Cash (1000) debited with invoice_total = 55.00
    $this->assertJournalEntry([
        'tenant_id'    => $this->tenant->id,
        'account_code' => '1000',
        'debit'        => 55.00,
    ]);

    // ─── ASSERT: double-entry invariant ───────────────────────────────────────
    $this->assertTrialBalanceZero($this->tenant);
});
