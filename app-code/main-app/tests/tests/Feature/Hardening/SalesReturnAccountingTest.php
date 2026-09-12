<?php

namespace Tests\Feature\Hardening;

use App\Engines\SaleReversalService;
use App\Engines\SaleService;
use App\Engines\TaxService;
use App\Helpers\SettingsHelper;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Sales-return / reversal accounting (rulebook B9) across every entry point:
 *
 *   - V3 engine            SaleService::reverse()          (POST /v3/sales/{id}/return)
 *   - legacy full return   SaleReversalService::reverse()  (POST /sales/{id}/return, cancel, delete)
 *   - Returns screen       ReturnController::store()       (POST /returns)
 *
 * Whatever mix of those paths a sale goes through, once every unit is back:
 *   revenue (4000), COGS (5000), output tax (2100), AR (1200) / cash and
 *   inventory (1100) net to exactly zero for that sale, every unit is restored
 *   to its FIFO batch exactly once, ledger 1100 == FIFO batch valuation, and
 *   stocks / products.stock_quantity agree with the batches.
 */
class SalesReturnAccountingTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $user;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant   = $this->createTenant();
        $this->tenantId = (string) $this->tenant->id;
        $this->user     = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->user, $this->tenant);
        $this->seedTenantDefaults($this->tenant);
        SettingsHelper::clearCache();

        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');

        $this->productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id'             => $this->productId,
            'tenant_id'      => $this->tenantId,
            'name'           => 'Hardening Widget',
            'sku'            => 'HW-' . Str::random(6),
            'price'          => 100.00,
            'cost_price'     => 60.00,
            'base_unit'      => 'PCS',
            'stock_quantity' => 0,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $this->customerId = (string) Str::uuid();
        DB::table('parties')->insert([
            'id'         => $this->customerId,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Return Customer',
            'type'       => 'customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 10 units on the shelf at 60 — batches, stocks and the product master agree.
        $this->receive(10, 60.00);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Full return after an earlier partial return
    // ═══════════════════════════════════════════════════════════════════

    /** @test Partial then full return through the V3 route nets a taxed credit sale to zero */
    public function v3_partial_then_full_return_of_taxed_sale_nets_to_zero(): void
    {
        $sale   = $this->sell('credit', 5, 100.00, 17);            // 500 + 85 tax = 585
        $itemId = $this->itemId($sale->id);

        $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => 2]]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'partially_returned']);
        $this->assertEqualsWithDelta(351.00, $this->arBalance(), 0.001);   // 585 − 2 × 117

        $this->v3Return($sale->id);                                          // "return everything"

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertDatabaseHas('sale_items', ['id' => $itemId, 'returned_quantity' => 5]);
        $this->assertSaleFullyUnwound();
    }

    /** @test A Returns-screen return followed by a full V3 return does not reverse the returned units twice */
    public function returns_screen_partial_then_v3_full_return_does_not_double_reverse(): void
    {
        $sale   = $this->sell('credit', 5, 100.00, 17);
        $itemId = $this->itemId($sale->id);

        $this->returnsScreen($sale->id, $itemId, 2, 100.00, 17)->assertOk()->assertJson(['success' => true]);
        $this->assertEqualsWithDelta(351.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(7.0, $this->batchUnits(), 0.0001);

        // The original now knows two units already came back.
        $this->assertDatabaseHas('sale_items', ['id' => $itemId, 'returned_quantity' => 2]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'partially_returned']);

        $this->v3Return($sale->id);

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertSaleFullyUnwound();
    }

    /** @test A Returns-screen return followed by a legacy full return / cancel does not reverse twice */
    public function returns_screen_partial_then_legacy_full_reversal_does_not_double_reverse(): void
    {
        $sale   = $this->sell('cash', 5, 100.00, 17);               // paid 585 in cash
        $itemId = $this->itemId($sale->id);

        $this->returnsScreen($sale->id, $itemId, 2, 100.00, 17, 'cash', 234.00)->assertOk();
        $this->assertEqualsWithDelta(351.00, $this->accountBalance('1000'), 0.001);

        // Legacy engine (sales.return full / sales.cancel / sales.destroy all land here).
        DB::transaction(fn () => (new SaleReversalService())->reverse(
            Sale::findOrFail($sale->id), 'cancelled', 'Voided after a partial return', (string) $this->user->id
        ));

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'cancelled']);
        $this->assertSaleFullyUnwound();
    }

    /** @test The legacy full-return route finishes a sale that was partly returned through the V3 route */
    public function v3_partial_then_legacy_full_return_route_nets_to_zero(): void
    {
        $sale   = $this->sell('credit', 5, 100.00, 17);
        $itemId = $this->itemId($sale->id);

        $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => 3]]);

        $this->post($this->storeUrl($this->tenant, "sales/{$sale->id}/return"), [
            'refund_method' => 'ledger',
            'refund_source' => 'cash_drawer',
            'reason'        => 'Rest of the order',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertSaleFullyUnwound();
    }

    /** @test Units already returned through the V3 route cannot be returned again on the Returns screen */
    public function returns_screen_cap_counts_units_returned_through_the_engine(): void
    {
        $sale   = $this->sell('credit', 5, 100.00, 0);
        $itemId = $this->itemId($sale->id);

        $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => 3]]);

        $entries = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();
        $this->returnsScreen($sale->id, $itemId, 5, 100.00, 0)->assertStatus(422);
        $this->assertSame($entries, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertEqualsWithDelta(8.0, $this->batchUnits(), 0.0001);

        // The two that are genuinely still out can come back.
        $this->returnsScreen($sale->id, $itemId, 2, 100.00, 0)->assertOk();
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertSaleFullyUnwound();

        // Returns history lists the credit note once, not the original beside it.
        $list = $this->getJson($this->storeUrl($this->tenant, 'returns-history'))->assertOk()->json('data');
        $this->assertCount(1, $list);
        $this->assertEqualsWithDelta(-200.00, (float) $list[0]['total'], 0.001);
    }

    /** @test Part-paid cash sale: returning everything in two steps nets cash and AR separately */
    public function split_tender_sale_returned_in_two_steps_nets_cash_and_ar(): void
    {
        // 300 invoice, 120 at the till, 180 left on account.
        $sale   = $this->sell('cash', 3, 100.00, 0, ['amount_received' => 120.00]);
        $itemId = $this->itemId($sale->id);
        $this->assertEqualsWithDelta(180.00, $this->arBalance(), 0.001);

        $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => 1]]);
        // The returned unit comes off what is still owed — no cash leaves the drawer.
        $this->assertEqualsWithDelta(80.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(120.00, $this->accountBalance('1000'), 0.001);

        $this->v3Return($sale->id);

        $this->assertSaleFullyUnwound();
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('1000'), 0.001);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Partial returns reverse their share of output tax
    // ═══════════════════════════════════════════════════════════════════

    /** @test A partial return debits 2100 for its tax share and the tax report shows the net */
    public function partial_return_reverses_proportional_output_tax(): void
    {
        $sale   = $this->sell('credit', 5, 100.00, 17);
        $itemId = $this->itemId($sale->id);

        $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => 2]]);

        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale_return')->first();
        $this->assertNotNull($entry, 'The partial-return entry must carry reference_type sale_return.');
        $this->assertSame('PRET-' . $sale->reference_number, $entry->reference);
        $this->assertSame($sale->id, $entry->source_id);

        $this->assertLine($entry->id, '4000', 200.00, 0);
        $this->assertLine($entry->id, '2100', 34.00, 0);
        $this->assertLine($entry->id, '1200', 0, 234.00, $this->customerId);
        $this->assertLine($entry->id, '1100', 120.00, 0);
        $this->assertLine($entry->id, '5000', 0, 120.00);

        $tax = app(TaxService::class)->taxReport(Carbon::today()->subDay(), Carbon::today()->addDay());
        $this->assertEqualsWithDelta(51.00, $tax['sales_tax_collected'], 0.001);   // 85 − 34

        // What is still owed on the invoice agrees with AR: 351, badge still unpaid.
        $this->assertEqualsWithDelta(351.00, $this->arBalance(), 0.001);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'unpaid']);

        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();
    }

    /** @test Odd-cent tax splits across three partial returns still reverse exactly the tax charged */
    public function partial_returns_with_rounding_reverse_exactly_the_tax_charged(): void
    {
        $sale   = $this->sell('credit', 3, 83.33, 17);    // net 249.99, tax 42.50 (42.4983), total 292.49
        $itemId = $this->itemId($sale->id);
        $this->assertEqualsWithDelta(42.50, (float) $sale->total_tax, 0.001);

        foreach ([1, 1, 1] as $qty) {
            $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => $qty]]);
        }

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertSaleFullyUnwound();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Overpaid cash sale — surplus is a customer advance, not tax
    // ═══════════════════════════════════════════════════════════════════

    /** @test Overpaying a cash sale leaves the tax report untouched and books the surplus to 2060 */
    public function overpaid_cash_sale_does_not_touch_the_tax_report(): void
    {
        $sale = $this->sell('cash', 1, 100.00, 17, ['amount_received' => 150.00]);   // 117 due
        $je   = $this->saleEntry($sale->id);

        $this->assertLine($je->id, '2100', 0, 17.00);                                   // tax only
        $this->assertLine($je->id, '1000', 150.00, 0);
        $this->assertLine($je->id, '2060', 0, 33.00, $this->customerId);                // customer advance
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'paid']);

        $tax = app(TaxService::class)->taxReport(Carbon::today()->subDay(), Carbon::today()->addDay());
        $this->assertEqualsWithDelta(17.00, $tax['sales_tax_collected'], 0.001);

        // The advance is the customer's, and can pay a later invoice (S-048).
        $next = $this->sell('credit', 1, 100.00, 0, ['advance_amount' => 33.00]);
        $this->assertDatabaseHas('sales', ['id' => $next->id, 'payment_status' => 'partial']);
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('2060'), 0.001);
        $this->assertEqualsWithDelta(67.00, $this->arBalance(), 0.001);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. stocks / products.stock_quantity stay in step with FIFO
    // ═══════════════════════════════════════════════════════════════════

    /** @test V3 checkout, partial and full return keep stocks and stock_quantity equal to the FIFO batches */
    public function v3_post_and_returns_keep_stock_aggregates_in_step_with_fifo(): void
    {
        $this->from('/pos')->post($this->v3('sales'), [
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'cash',
            'items' => [['product_id' => $this->productId, 'qty' => 4, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ])->assertSessionHasNoErrors();
        $sale   = DB::table('sales')->where('tenant_id', $this->tenantId)->first();
        $itemId = $this->itemId($sale->id);
        $this->assertStockAggregates(6.0);

        $this->v3Return($sale->id, [['sale_item_id' => $itemId, 'return_qty' => 1]]);
        $this->assertStockAggregates(7.0);

        $this->v3Return($sale->id);
        $this->assertStockAggregates(10.0);

        // One-shot full return of a fresh sale too.
        $second = $this->sell('cash', 3, 100.00, 0);
        $this->assertStockAggregates(7.0);
        $this->v3Return($second->id);
        $this->assertStockAggregates(10.0);

        $this->assertInventoryReconciles();
    }

    /** @test Cancelling an engine-posted sale (legacy reversal) restores promo units once, not twice */
    public function legacy_cancel_of_engine_sale_with_promo_line_restores_each_unit_once(): void
    {
        $sale = app(SaleService::class)->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->productId, 'qty' => 2, 'sale_uom' => 'PCS', 'unit_price' => 100.00],
                ['product_id' => $this->productId, 'qty' => 1, 'sale_uom' => 'PCS', 'unit_price' => 100.00, 'is_promotional' => true],
            ],
        ]);
        $this->assertStockAggregates(7.0);

        DB::transaction(fn () => (new SaleReversalService())->reverse(
            Sale::findOrFail($sale->id), 'cancelled', 'Voided', (string) $this->user->id
        ));

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'cancelled']);
        $this->assertStockAggregates(10.0);
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('4000'), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('1000'), 0.001);
        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/{$path}";
    }

    /** Stock in through the purchase engine's own aggregate conventions. */
    private function receive(float $qty, float $cost): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $qty, 'initial_qty' => $qty,
            'remaining_qty' => $qty, 'unit_cost' => $cost,
            'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'quantity' => $qty, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('products')->where('id', $this->productId)->increment('stock_quantity', $qty);

        // Opening stock: DR 1100 / CR 7000, so ledger 1100 == FIFO from the start.
        app(\App\Engines\AccountingService::class)->createEntry([
            'date' => now()->subDay()->toDateString(), 'reference_type' => 'opening_stock',
            'reference' => (string) Str::uuid(),
        ], [
            ['account_code' => '1100', 'debit' => round($qty * $cost, 2), 'credit' => 0],
            ['account_code' => '7000', 'debit' => 0, 'credit' => round($qty * $cost, 2)],
        ]);
    }

    private function sell(string $method, float $qty, float $price, float $taxRate, array $extra = []): object
    {
        return app(SaleService::class)->post(array_merge([
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => now()->toDateString(),
            'payment_method' => $method,
            'items'          => [[
                'product_id' => $this->productId, 'qty' => $qty, 'sale_uom' => 'PCS',
                'unit_price' => $price, 'tax_rate' => $taxRate,
            ]],
        ], $extra));
    }

    private function v3Return(string $saleId, array $items = []): void
    {
        $this->from('/x')->post($this->v3("sales/{$saleId}/return"), array_filter([
            'return_date' => now()->toDateString(),
            'reason'      => 'Customer return',
            'items'       => $items ?: null,
        ]))->assertSessionHasNoErrors();
    }

    private function returnsScreen(
        string $saleId, string $itemId, float $qty, float $price, float $taxRate,
        string $method = 'credit', float $refund = 0.0
    ): \Illuminate\Testing\TestResponse {
        return $this->postJson($this->storeUrl($this->tenant, 'returns'), [
            'customer_id'      => $this->customerId,
            'original_sale_id' => $saleId,
            'warehouse_id'     => $this->warehouseId,
            'items'            => [[
                'product_id' => $this->productId, 'original_sale_item_id' => $itemId,
                'quantity' => $qty, 'price' => $price, 'tax_rate' => $taxRate, 'discount' => 0,
            ]],
            'payment_method'  => $method,
            'amount_refunded' => $refund,
        ]);
    }

    private function itemId(string $saleId): string
    {
        return (string) DB::table('sale_items')->where('sale_id', $saleId)->value('id');
    }

    private function saleEntry(string $saleId): object
    {
        $je = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale')->where('reference', $saleId)->first();
        $this->assertNotNull($je, "No sale journal entry for {$saleId}");
        return $je;
    }

    private function accountId(string $code): string
    {
        $id = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
        $this->assertNotNull($id, "Account {$code} does not exist for this tenant.");
        return (string) $id;
    }

    private function assertLine(string $entryId, string $code, float $debit, float $credit, ?string $partyId = null): void
    {
        $q = DB::table('journal_items')->where('journal_entry_id', $entryId)->where('account_id', $this->accountId($code))
            ->where('debit', $debit)->where('credit', $credit);
        if ($partyId !== null) {
            $q->where('party_id', $partyId);
        }
        $this->assertTrue($q->exists(), sprintf(
            'Expected journal line %s DR %.2f / CR %.2f on entry %s. Found: %s',
            $code, $debit, $credit, $entryId,
            DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('ji.journal_entry_id', $entryId)->get(['a.code', 'ji.debit', 'ji.credit', 'ji.party_id'])->toJson()
        ));
    }

    /** Debit − credit on an account, live (non-reversed) entries only. */
    private function accountBalance(string $code): float
    {
        return round((float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $this->tenantId)->where('a.tenant_id', $this->tenantId)
            ->where('a.code', $code)->where('je.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as bal')->value('bal'), 2);
    }

    /** What the test customer owes on 1200 (debit − credit), live entries. */
    private function arBalance(): float
    {
        return round((float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $this->tenantId)->where('a.tenant_id', $this->tenantId)
            ->where('a.code', '1200')->where('je.is_reversed', 0)
            ->whereRaw('COALESCE(ji.party_id, je.party_id) = ?', [$this->customerId])
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as bal')->value('bal'), 2);
    }

    private function batchUnits(): float
    {
        return (float) DB::table('inventory_batches')->where('tenant_id', $this->tenantId)
            ->where('product_id', $this->productId)->sum('remaining_qty');
    }

    private function fifoValuation(): float
    {
        return round((float) DB::table('inventory_batches')->where('tenant_id', $this->tenantId)
            ->selectRaw('COALESCE(SUM(remaining_qty * unit_cost), 0) as v')->value('v'), 2);
    }

    private function assertInventoryReconciles(): void
    {
        $this->assertEqualsWithDelta($this->fifoValuation(), $this->accountBalance('1100'), 0.001,
            'Ledger 1100 must equal the FIFO batch valuation.');
    }

    private function assertStockAggregates(float $expected): void
    {
        $this->assertEqualsWithDelta($expected, $this->batchUnits(), 0.0001, 'FIFO batches');
        $this->assertEqualsWithDelta($expected, (float) DB::table('stocks')->where('tenant_id', $this->tenantId)
            ->where('product_id', $this->productId)->where('warehouse_id', $this->warehouseId)->sum('quantity'), 0.0001,
            'stocks.quantity must track the FIFO batches.');
        $this->assertEqualsWithDelta($expected, (float) DB::table('products')->where('id', $this->productId)->value('stock_quantity'), 0.0001,
            'products.stock_quantity must track the FIFO batches.');
    }

    /** Every unit is back exactly once and the sale has no residue on any account. */
    private function assertSaleFullyUnwound(): void
    {
        $this->assertEqualsWithDelta(10.0, $this->batchUnits(), 0.0001, 'Each unit restored to stock exactly once.');
        $this->assertStockAggregates(10.0);
        foreach (['4000', '5000', '2100', '1200', '1000', '1010'] as $code) {
            $this->assertEqualsWithDelta(0.00, $this->accountBalance($code), 0.001,
                "Account {$code} must net to zero once the whole sale has come back.");
        }
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001, 'Customer AR sub-ledger must be nil.');
        $this->assertEqualsWithDelta(600.00, $this->accountBalance('1100'), 0.001);
        $this->assertInventoryReconciles();

        $tax = app(TaxService::class)->taxReport(Carbon::today()->subDay(), Carbon::today()->addDay());
        $this->assertEqualsWithDelta(0.00, $tax['sales_tax_collected'], 0.001, 'Tax report must net to zero.');

        $this->assertAllEntriesBalance();
    }

    private function assertAllEntriesBalance(): void
    {
        $rows = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)
            ->groupBy('ji.journal_entry_id')
            ->selectRaw('ji.journal_entry_id, SUM(ji.debit) as dr, SUM(ji.credit) as cr, COUNT(*) as n')
            ->get();
        $this->assertNotEmpty($rows);
        foreach ($rows as $r) {
            $this->assertGreaterThanOrEqual(2, (int) $r->n, "Entry {$r->journal_entry_id} has fewer than two lines.");
            $this->assertEqualsWithDelta((float) $r->dr, (float) $r->cr, 0.001, "Entry {$r->journal_entry_id} is unbalanced.");
        }
    }
}
