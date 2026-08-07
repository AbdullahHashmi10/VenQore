<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Sale;
use App\Services\V3\SaleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * SaleFinancialValueGuardTest — silent-money-corruption guard.
 *
 * WHY THIS IS NOT A DOPAMINE TEST
 * -------------------------------
 * The dangerous failure mode on the POS path is NOT "the sale crashed". It is
 * "the sale posted, returned 200, the row exists — but net_sales / invoice_total
 * / tax landed WRONG or 0". A test that only asserts assertDatabaseHas(['id'])
 * or a 200 status sails straight past it. So this test asserts the EXACT stored
 * value of every money column on a sale with a non-trivial discount AND tax, and
 * the accounting invariants around it.
 *
 * It also guards a real structural risk in this schema: the sales table keeps
 * BOTH new columns (net_sales, invoice_total, total_tax, subtotal_gross) and
 * legacy aliases (total, tax, subtotal). If any writer or report ever updates
 * one side but not the other, figures silently drift. This test pins the
 * aliases to their canonical columns so that drift fails the build.
 *
 * Scenario (hand-computable):
 *   1 line: qty 2 × unit_price 100 = 200 gross
 *           10% line discount      = -20   → net_sales     = 180
 *           5% tax on net          = +9    → invoice_total = 189
 *           COGS from FIFO batch @50 × 2   → cogs          = 100
 */
class SaleFinancialValueGuardTest extends VenQoreTestCase
{
    public function test_sale_stores_exact_money_values_and_holds_invariants(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Guard Main',
            'code'      => 'GRD-1',
        ]);

        $product = Product::factory()->create([
            'tenant_id'  => $tenant->id,
            'price'      => 100,
            'cost_price' => 50,
        ]);

        // Seed a single FIFO stock batch: 10 units @ cost 50.
        DB::table('inventory_batches')->insert([
            'tenant_id'    => $tenant->id,
            'id'           => Str::uuid()->toString(),
            'product_id'   => $product->id,
            'warehouse_id' => $warehouse->id,
            'batch_type'   => 'purchase',
            'unit_cost'    => 50.00,
            'original_qty' => 10.00,
            'initial_qty'  => 10.00,
            'remaining_qty' => 10.00,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $sale = app(SaleService::class)->post([
            'tenant_id'      => $tenant->id,
            'customer_id'    => null,
            'warehouse_id'   => $warehouse->id,
            'sale_date'      => now()->toDateString(),
            'payment_method' => 'cash',
            'items'          => [[
                'product_id'       => $product->id,
                'qty'              => 2,
                'sale_uom'         => 'PCS',
                'unit_price'       => 100,
                'discount_percent' => 10,
                'tax_rate'         => 5,
            ]],
        ]);

        $row = DB::table('sales')->where('id', $sale->id)->first();
        $this->assertNotNull($row, 'Sale row was not written.');

        // ── Exact stored values ────────────────────────────────────────────
        $this->assertMoneyEquals(200.00, (float) $row->subtotal_gross,       'subtotal_gross wrong');
        $this->assertMoneyEquals(20.00,  (float) $row->total_item_discounts, 'total_item_discounts wrong');
        $this->assertMoneyEquals(180.00, (float) $row->net_sales,            'net_sales wrong — silent revenue corruption');
        $this->assertMoneyEquals(9.00,   (float) $row->total_tax,            'total_tax wrong');
        $this->assertMoneyEquals(189.00, (float) $row->invoice_total,        'invoice_total wrong — silent total corruption');

        // ── None of the critical figures may be silently zero ──────────────
        $this->assertGreaterThan(0, (float) $row->net_sales,     'net_sales is 0 — the exact silent-corruption bug this guards.');
        $this->assertGreaterThan(0, (float) $row->invoice_total, 'invoice_total is 0 — the exact silent-corruption bug this guards.');

        // ── Legacy aliases must equal their canonical columns ──────────────
        // If a writer/report updates one side but not the other, reports drift.
        $this->assertMoneyEquals((float) $row->invoice_total, (float) $row->total, 'legacy `total` diverged from `invoice_total`');
        $this->assertMoneyEquals((float) $row->total_tax,     (float) $row->tax,   'legacy `tax` diverged from `total_tax`');

        // ── Money invariants (must always hold, any scenario) ──────────────
        $this->assertMoneyEquals(
            (float) $row->subtotal_gross - (float) $row->total_item_discounts,
            (float) $row->net_sales,
            'Invariant broken: net_sales != subtotal_gross - discounts'
        );
        $this->assertMoneyEquals(
            (float) $row->net_sales + (float) $row->total_tax,
            (float) $row->invoice_total,
            'Invariant broken: invoice_total != net_sales + tax'
        );

        // ── COGS recognised (2 units × 50) ─────────────────────────────────
        $cogs = (float) DB::table('sale_items')->where('sale_id', $sale->id)->sum('cost_price');
        $this->assertMoneyEquals(100.00, $cogs, 'COGS not recognised correctly from FIFO batch.');

        // ── Double-entry must balance after the sale ───────────────────────
        $this->assertTrialBalanceZero($tenant);
    }

    public function test_credit_sale_stores_exact_money_values_and_updates_customer_balance(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Guard Credit WH',
            'code'      => 'GRD-CR-1',
        ]);

        $product = Product::factory()->create([
            'tenant_id'  => $tenant->id,
            'price'      => 120,
            'cost_price' => 60,
        ]);

        // Seed FIFO stock batch: 10 units @ cost 60.
        DB::table('inventory_batches')->insert([
            'tenant_id'    => $tenant->id,
            'id'           => Str::uuid()->toString(),
            'product_id'   => $product->id,
            'warehouse_id' => $warehouse->id,
            'batch_type'   => 'purchase',
            'unit_cost'    => 60.00,
            'original_qty' => 10.00,
            'initial_qty'  => 10.00,
            'remaining_qty' => 10.00,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // Create a customer party
        $customer = \App\Models\Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'John Credit Customer',
            'type'      => 'customer',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
        ]);

        // Post a credit sale: 2 units @ 120 = 240 gross, 10% discount, 5% tax.
        // Gross: 240, Discount: 24, Net: 216, Tax: 10.80, Total: 226.80
        $sale = app(SaleService::class)->post([
            'tenant_id'      => $tenant->id,
            'customer_id'    => $customer->id,
            'warehouse_id'   => $warehouse->id,
            'sale_date'      => now()->toDateString(),
            'payment_method' => 'credit',
            'items'          => [[
                'product_id'       => $product->id,
                'qty'              => 2,
                'sale_uom'         => 'PCS',
                'unit_price'       => 120,
                'discount_percent' => 10,
                'tax_rate'         => 5,
            ]],
        ]);

        $row = DB::table('sales')->where('id', $sale->id)->first();
        $this->assertNotNull($row, 'Credit sale row was not written.');

        $this->assertMoneyEquals(240.00, (float) $row->subtotal_gross,       'subtotal_gross wrong');
        $this->assertMoneyEquals(24.00,  (float) $row->total_item_discounts, 'total_item_discounts wrong');
        $this->assertMoneyEquals(216.00, (float) $row->net_sales,            'net_sales wrong');
        $this->assertMoneyEquals(10.80,  (float) $row->total_tax,            'total_tax wrong');
        $this->assertMoneyEquals(226.80, (float) $row->invoice_total,        'invoice_total wrong');

        // Customer balance should be updated (receivable increased)
        $balance = app(\App\Services\V3\PartyService::class)->getBalance($customer->id, '1200');
        $this->assertMoneyEquals(226.80, $balance, 'customer AR balance not updated in ledger');

        $this->assertTrialBalanceZero($tenant);
    }

    public function test_sale_reversal_restores_financials_and_stocks(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Guard Reversal WH',
            'code'      => 'GRD-REV-1',
        ]);

        $product = Product::factory()->create([
            'tenant_id'  => $tenant->id,
            'price'      => 100,
            'cost_price' => 50,
        ]);

        $batchId = Str::uuid()->toString();
        // Seed FIFO stock batch: 10 units @ cost 50.
        DB::table('inventory_batches')->insert([
            'tenant_id'    => $tenant->id,
            'id'           => $batchId,
            'product_id'   => $product->id,
            'warehouse_id' => $warehouse->id,
            'batch_type'   => 'purchase',
            'unit_cost'    => 50.00,
            'original_qty' => 10.00,
            'initial_qty'  => 10.00,
            'remaining_qty' => 10.00,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $sale = app(SaleService::class)->post([
            'tenant_id'      => $tenant->id,
            'customer_id'    => null,
            'warehouse_id'   => $warehouse->id,
            'sale_date'      => now()->toDateString(),
            'payment_method' => 'cash',
            'items'          => [[
                'product_id'       => $product->id,
                'qty'              => 2,
                'sale_uom'         => 'PCS',
                'unit_price'       => 100,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);

        // Remaining qty in batch should be 8.
        $batchBefore = DB::table('inventory_batches')->where('id', $batchId)->first();
        $this->assertEquals(8.00, (float) $batchBefore->remaining_qty);

        // Fetch the Sale Eloquent model
        $saleModel = Sale::findOrFail($sale->id);

        // Perform reversal
        $ownerUser = $this->createTenantUser($tenant, 'owner');
        $reversalSummary = DB::transaction(fn () => app(\App\Services\SaleReversalService::class)->reverse(
            $saleModel,
            'returned',
            'Customer changed mind',
            $ownerUser->id
        ));

        $this->assertTrue($reversalSummary['journal_reversed']);
        $this->assertTrue($reversalSummary['fifo_restored']);

        // Remaining qty in batch should be restored to 10.
        $batchAfter = DB::table('inventory_batches')->where('id', $batchId)->first();
        $this->assertEquals(10.00, (float) $batchAfter->remaining_qty);

        // Sale status should be updated to returned
        $freshSale = Sale::find($sale->id);
        $this->assertEquals('returned', $freshSale->status);

        $this->assertTrialBalanceZero($tenant);
    }

    public function test_purchase_stores_exact_money_values(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price'     => 150,
        ]);

        $supplier = \App\Models\Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Guard Supplier',
            'type'      => 'supplier',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
        ]);

        // Create an unpaid purchase bill: 5 units @ 80 = 400 gross. Discount: 40. Tax: 20. Total: 380.
        $purchase = app(\App\Services\PurchaseService::class)->createPurchase([
            'supplier_id'    => $supplier->id,
            'date'           => now()->toDateString(),
            'payment_status' => 'unpaid',
            'discount'       => 40.00,
            'tax'            => 20.00,
            'items'          => [[
                'product_id' => $product->id,
                'quantity'   => 5,
                'unit_price' => 80.00,
                'discount'   => 40.00,
                'tax'        => 20.00,
            ]],
        ]);

        $row = DB::table('invoices')->where('id', $purchase->id)->first();
        $this->assertNotNull($row, 'Purchase bill was not written.');

        $this->assertMoneyEquals(400.00, (float) $row->subtotal,        'subtotal wrong');
        $this->assertMoneyEquals(40.00,  (float) $row->discount_amount, 'discount_amount wrong');
        $this->assertMoneyEquals(20.00,  (float) $row->tax_amount,      'tax_amount wrong');
        $this->assertMoneyEquals(380.00, (float) $row->total_amount,    'total_amount wrong');

        // Supplier balance should be updated (since it is unpaid, we owe them 380, i.e. balance = -380)
        $freshSupplier = \App\Models\Party::find($supplier->id);
        $this->assertMoneyEquals(-380.00, (float) $freshSupplier->current_balance, 'supplier balance wrong');

        $this->assertTrialBalanceZero($tenant);
    }
}
