<?php

namespace Tests\Feature\Hardening;

use App\Engines\SaleService;
use App\Engines\TaxService;
use App\Helpers\SettingsHelper;
use App\Models\ProductSerial;
use App\Models\SalesOrder;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * The LEGACY sales / return paths (SaleController, PosReturnController, the
 * legacy SalesOrderController) against the same rules the V3 engine keeps:
 *
 *   1. a legacy partial return posts exactly the engine's B9 partial return
 *      (tax share, AR-first credit, reference_type, returned_quantity /
 *      status / payment badge);
 *   2. delete / cancel of a partly returned sale reverses the remainder, once;
 *   3. a POS open return moves products.stock_quantity and stocks with FIFO;
 *   4. a sale made in a pack UOM comes back in base units correctly;
 *   5. converting a pre-sale below FIFO cost needs a manager approval;
 *   6. a sold serial is stamped with its store.
 *
 * Every entry balances; after a full unwind 4000/5000/2100/1200/1000/1010 net
 * to zero; ledger 1100 == FIFO valuation; stocks / stock_quantity == batches.
 */
class LegacySalesPathsTest extends VenQoreTestCase
{
    private const MANAGER_PIN = '246810';

    private Tenant $tenant;
    private User $owner;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant   = $this->createTenant('legacy-paths-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->tenantId = (string) $this->tenant->id;
        $this->seedTenantDefaults($this->tenant);
        $this->owner    = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        SettingsHelper::clearCache();

        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');

        $this->productId = $this->makeProduct('Legacy Widget', 'PCS', 60.00, 17);

        $this->customerId = (string) Str::uuid();
        DB::table('parties')->insert([
            'id' => $this->customerId, 'tenant_id' => $this->tenantId, 'name' => 'Legacy Customer',
            'type' => 'customer', 'created_at' => now(), 'updated_at' => now(),
        ]);

        // 10 units on the shelf at 60 — batches, stocks and the product master agree.
        $this->receive($this->productId, 10, 60.00);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Legacy partial return == engine partial return
    // ═══════════════════════════════════════════════════════════════════

    /** @test Legacy partial return of a part-paid sale debits tax and credits what is still owed first */
    public function legacy_partial_return_posts_the_engine_entry_on_a_part_paid_sale(): void
    {
        // 5 × 100 + 17% = 585; 200 at the till, 385 left on account.
        $saleId = $this->legacySale('cash', 5, 100.00, 200.00);
        $itemId = $this->itemId($saleId);
        $ref    = DB::table('sales')->where('id', $saleId)->value('reference_number');
        $this->assertEqualsWithDelta(385.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(200.00, $this->accountBalance('1000'), 0.001);

        $this->legacyReturn($saleId, [['id' => $itemId, 'quantity' => 2]])->assertSessionHasNoErrors();

        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale_return')->where('source_id', $saleId)->first();
        $this->assertNotNull($entry, 'The legacy partial return must carry reference_type sale_return.');
        $this->assertSame('PRET-' . $ref, $entry->reference);

        $this->assertLine($entry->id, '4000', 200.00, 0);
        $this->assertLine($entry->id, '2100', 34.00, 0);                       // was missing
        $this->assertLine($entry->id, '1200', 0, 234.00, $this->customerId);   // was CR 1000 200
        $this->assertLine($entry->id, '1100', 120.00, 0);
        $this->assertLine($entry->id, '5000', 0, 120.00);
        $this->assertSame(0, DB::table('journal_items')->where('journal_entry_id', $entry->id)
            ->where('account_id', $this->accountId('1000'))->count(), 'Nothing leaves the drawer while the customer still owes.');

        $this->assertDatabaseHas('sale_items', ['id' => $itemId, 'returned_quantity' => 2]);
        $this->assertDatabaseHas('sales', ['id' => $saleId, 'status' => 'partially_returned', 'payment_status' => 'partial']);
        $this->assertEqualsWithDelta(151.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(200.00, $this->accountBalance('1000'), 0.001);
        $this->assertStockAggregates($this->productId, 7.0);
        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();

        // The rest through the legacy full-return path: the drawer gives back the 200.
        $this->legacyReturn($saleId, [['id' => $itemId, 'quantity' => 3]])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', ['id' => $saleId, 'status' => 'returned']);
        $this->assertSaleFullyUnwound();
    }

    /** @test The legacy route and the V3 route post identical partial-return entries */
    public function legacy_and_engine_partial_returns_post_identical_lines(): void
    {
        $legacy = $this->legacySale('credit', 3, 100.00, 0.00);
        $this->legacyReturn($legacy, [['id' => $this->itemId($legacy), 'quantity' => 1]])->assertSessionHasNoErrors();

        $engine = app(SaleService::class)->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 3, 'sale_uom' => 'PCS', 'unit_price' => 100.00, 'tax_rate' => 17]],
        ]);
        $this->from('/x')->post($this->storeUrl($this->tenant, "v3/sales/{$engine->id}/return"), [
            'return_date' => now()->toDateString(), 'reason' => 'Customer return',
            'items' => [['sale_item_id' => $this->itemId($engine->id), 'return_qty' => 1]],
        ])->assertSessionHasNoErrors();

        $this->assertSame($this->returnLines($engine->id), $this->returnLines($legacy));
        $this->assertDatabaseHas('sales', ['id' => $legacy, 'status' => 'partially_returned', 'payment_status' => 'unpaid']);
        $this->assertAllEntriesBalance();
    }

    /** @test A fully paid legacy cash sale stays 'paid' after a partial return, and the refund leaves the drawer */
    public function legacy_paid_cash_sale_keeps_its_badge_after_a_partial_return(): void
    {
        $saleId = $this->legacySale('cash', 2, 100.00, 234.00);
        $this->assertDatabaseHas('sales', ['id' => $saleId, 'payment_status' => 'paid']);

        $this->legacyReturn($saleId, [['id' => $this->itemId($saleId), 'quantity' => 1]])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $saleId, 'status' => 'partially_returned', 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(117.00, $this->accountBalance('1000'), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);
        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Delete / cancel of a partially returned sale
    // ═══════════════════════════════════════════════════════════════════

    /** @test Deleting a partly returned legacy sale reverses the remainder once and soft-deletes it */
    public function deleting_a_partially_returned_sale_reverses_the_remainder_once(): void
    {
        $saleId = $this->legacySale('credit', 5, 100.00, 0.00);
        $this->legacyReturn($saleId, [['id' => $this->itemId($saleId), 'quantity' => 2]])->assertSessionHasNoErrors();
        $this->assertEqualsWithDelta(351.00, $this->arBalance(), 0.001);

        $this->delete($this->storeUrl($this->tenant, "sales/{$saleId}"))->assertSessionHasNoErrors();

        $this->assertSoftDeleted('sales', ['id' => $saleId]);
        $this->assertSame('cancelled', DB::table('sales')->where('id', $saleId)->value('status'));
        $this->assertSaleFullyUnwound();
        $entries = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();

        // A second delete finds nothing to delete and reverses nothing.
        $this->delete($this->storeUrl($this->tenant, "sales/{$saleId}"));
        $this->assertSame($entries, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertSaleFullyUnwound();
    }

    /** @test Cancelling a partly returned sale reverses the remainder; cancel/delete afterwards changes nothing */
    public function cancelling_a_partially_returned_sale_reverses_the_remainder_once(): void
    {
        $saleId = $this->legacySale('cash', 5, 100.00, 585.00);
        $this->legacyReturn($saleId, [['id' => $this->itemId($saleId), 'quantity' => 1]])->assertSessionHasNoErrors();

        $this->postJson($this->storeUrl($this->tenant, "sales/{$saleId}/cancel"))->assertOk()->assertJson(['success' => true]);
        $this->assertSame('cancelled', DB::table('sales')->where('id', $saleId)->value('status'));
        $this->assertSaleFullyUnwound();
        $entries = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();

        $this->post($this->storeUrl($this->tenant, "sales/{$saleId}/cancel"));
        $this->delete($this->storeUrl($this->tenant, "sales/{$saleId}"))->assertSessionHasNoErrors();

        $this->assertSoftDeleted('sales', ['id' => $saleId]);
        $this->assertSame($entries, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertSaleFullyUnwound();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. POS open return
    // ═══════════════════════════════════════════════════════════════════

    /** @test An open POS return moves stocks and products.stock_quantity with the FIFO batch it creates */
    public function pos_open_return_keeps_stock_aggregates_in_step_with_fifo(): void
    {
        $payload = [
            'items'           => [['product_id' => $this->productId, 'quantity' => 3, 'price' => 100.00]],
            'warehouse_id'    => $this->warehouseId,
            'idempotency_key' => 'open-return-' . Str::random(8),
            'refund_method'   => 'cash',
        ];

        $this->postJson($this->storeUrl($this->tenant, 'pos/return'), $payload)->assertOk()->assertJson(['success' => true]);

        $this->assertStockAggregates($this->productId, 13.0);
        $batch = DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->where('batch_type', 'return')->first();
        $this->assertEqualsWithDelta(3.0, (float) $batch->remaining_qty, 0.0001);
        $this->assertEqualsWithDelta(60.00, (float) $batch->unit_cost, 0.0001);
        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();

        // A retry of the same request is idempotent — no second batch, no second count.
        $this->postJson($this->storeUrl($this->tenant, 'pos/return'), $payload)->assertOk();
        $this->assertStockAggregates($this->productId, 13.0);
        $this->assertInventoryReconciles();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Partial return in a pack UOM
    // ═══════════════════════════════════════════════════════════════════

    /** @test Sell 2 CTN (= 24 PCS), return 1 CTN: exactly 12 PCS back, half the revenue and COGS reversed */
    public function partial_return_in_a_carton_uom_restores_base_units(): void
    {
        $cartonProduct = $this->makeProduct('Carton Soap', 'PCS', 5.00, 0);
        DB::table('product_uom_conversions')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'product_id' => $cartonProduct,
            'sale_uom' => 'CTN', 'conversion_factor' => round(1 / 12, 6),   // 1 PCS = 0.083333 CTN
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->receive($cartonProduct, 48, 5.00);

        $sale = app(SaleService::class)->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $cartonProduct, 'qty' => 2, 'sale_uom' => 'CTN', 'unit_price' => 100.00, 'tax_rate' => 0]],
        ]);
        $itemId = $this->itemId($sale->id);
        $this->assertStockAggregates($cartonProduct, 24.0);                 // exactly 24, not 24.0001
        $this->assertEqualsWithDelta(120.00, $this->accountBalance('5000'), 0.001);

        // 1 CTN back through the legacy return screen.
        $this->legacyReturn($sale->id, [['id' => $itemId, 'quantity' => 1]])->assertSessionHasNoErrors();

        $this->assertStockAggregates($cartonProduct, 36.0);                 // 12 PCS, not 1
        $this->assertDatabaseHas('sale_items', ['id' => $itemId, 'returned_quantity' => 1]);
        $this->assertEqualsWithDelta(100.00, -$this->accountBalance('4000'), 0.001);   // 200 − 100
        $this->assertEqualsWithDelta(60.00, $this->accountBalance('5000'), 0.001);     // 120 − 60
        $this->assertEqualsWithDelta(100.00, $this->arBalance(), 0.001);
        $this->assertInventoryReconciles();

        // The last carton through the V3 route: everything is back, exactly once.
        $this->from('/x')->post($this->storeUrl($this->tenant, "v3/sales/{$sale->id}/return"), [
            'return_date' => now()->toDateString(), 'reason' => 'Rest',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertStockAggregates($cartonProduct, 48.0);
        foreach (['4000', '5000', '1200'] as $code) {
            $this->assertEqualsWithDelta(0.00, $this->accountBalance($code), 0.001, "{$code} must net to zero.");
        }
        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Pre-sale conversion below cost (S-011)
    // ═══════════════════════════════════════════════════════════════════

    /** @test Converting a below-cost pre-sale needs a manager approval: 422 approval_required, nothing written */
    public function legacy_pre_sale_conversion_below_cost_requires_approval(): void
    {
        $order   = $this->preSale(2, 50.00);                      // 2 × 50 = 100 against FIFO 2 × 60 = 120
        $seller  = $this->member('sales_executive');
        $manager = $this->member('manager', self::MANAGER_PIN);
        $this->actingAsTenantUserModel($seller, $this->tenant);

        $before = $this->footprint();
        $res = $this->postJson($this->storeUrl($this->tenant, "sales/pre-sales/{$order->id}/convert"));
        $res->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'approval_required')
            ->assertJsonPath('reason', 'below_cost')
            ->assertJsonPath('lines.0.cost', 120)
            ->assertJsonPath('lines.0.revenue', 100);
        $this->assertSame($before, $this->footprint(), 'A refused conversion writes nothing.');
        $this->assertNotSame('completed', $order->fresh()->status);

        // A wrong PIN is still refused.
        $this->postJson($this->storeUrl($this->tenant, "sales/pre-sales/{$order->id}/convert"), [
            'approved_by' => (string) $manager->id, 'approval_pin' => '000000',
        ])->assertStatus(422)->assertJsonPath('code', 'approval_required');
        $this->assertSame($before, $this->footprint());

        // With the manager's approval it converts, and the approval is stamped on the entry.
        $this->postJson($this->storeUrl($this->tenant, "sales/pre-sales/{$order->id}/convert"), [
            'approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN,
        ])->assertOk()->assertJson(['success' => true]);

        $saleId = (string) DB::table('sales')->where('tenant_id', $this->tenantId)->value('id');
        $je = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale')->where('reference', $saleId)->first();
        $this->assertNotNull($je);
        $this->assertSame((string) $manager->id, (string) $je->approved_by);
        $this->assertSame('completed', $order->fresh()->status);
        $this->assertStockAggregates($this->productId, 8.0);
        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();
    }

    /** @test A pre-sale priced above cost converts without any approval */
    public function legacy_pre_sale_conversion_above_cost_needs_no_approval(): void
    {
        $order = $this->preSale(2, 100.00);
        $this->actingAsTenantUserModel($this->member('sales_executive'), $this->tenant);

        $this->postJson($this->storeUrl($this->tenant, "sales/pre-sales/{$order->id}/convert"))
            ->assertOk()->assertJson(['success' => true]);

        // One sale entry — not the real one plus SaleObserver's stand-in
        // "DR 1000 / CR income", which doubled revenue and invented cash.
        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'sale')->count());
        $je = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'sale')->first();
        $this->assertNull($je->approved_by);
        $this->assertEqualsWithDelta(-200.00, $this->accountBalance('4000'), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('1000'), 0.001);
        $this->assertEqualsWithDelta(234.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(120.00, $this->accountBalance('5000'), 0.001);
        $this->assertStockAggregates($this->productId, 8.0);
        $this->assertInventoryReconciles();
        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Serials sold at the POS belong to the store
    // ═══════════════════════════════════════════════════════════════════

    /** @test A serial sold through the legacy POS is stamped with the store and invisible to another store */
    public function sold_serial_is_stamped_with_the_store(): void
    {
        DB::table('products')->where('id', $this->productId)->update(['track_serial' => true]);

        // One serial already on the shelf from a purchase — it must keep its id.
        $receivedId = (string) Str::uuid();
        DB::table('product_serials')->insert([
            'id' => $receivedId, 'tenant_id' => $this->tenantId, 'product_id' => $this->productId,
            'serial_number' => 'LSP-SN-0001', 'status' => 'available', 'warehouse_id' => $this->warehouseId,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $saleId = $this->legacySale('cash', 2, 100.00, 234.00, ['serials' => ['LSP-SN-0001', 'LSP-SN-0002']]);

        $rows = DB::table('product_serials')->whereIn('serial_number', ['LSP-SN-0001', 'LSP-SN-0002'])->get();
        $this->assertCount(2, $rows);
        foreach ($rows as $row) {
            $this->assertSame($this->tenantId, (string) $row->tenant_id, 'The serial must carry the store id (was NULL).');
            $this->assertSame('sold', $row->status);
            $this->assertSame($saleId, $row->sale_id);
        }
        $this->assertSame($receivedId, (string) $rows->firstWhere('serial_number', 'LSP-SN-0001')->id,
            'Selling a received serial must not rewrite its primary key.');

        // Visible to its own store through the tenant-scoped model...
        $this->assertSame(2, ProductSerial::whereIn('serial_number', ['LSP-SN-0001', 'LSP-SN-0002'])->count());

        // ...and not to another store.
        $other = $this->createTenant('legacy-paths-other-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->actingAsTenantUserModel($this->createTenantUser($other, 'owner'), $other);
        $this->assertSame(0, ProductSerial::whereIn('serial_number', ['LSP-SN-0001', 'LSP-SN-0002'])->count());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function makeProduct(string $name, string $baseUnit, float $cost, float $taxRate): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $this->tenantId, 'name' => $name, 'sku' => 'LSP-' . Str::random(6),
            'price' => 100.00, 'cost_price' => $cost, 'tax_rate' => $taxRate, 'base_unit' => $baseUnit,
            'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    /** Stock in, with the opening entry, so ledger 1100 == FIFO from the start. */
    private function receive(string $productId, float $qty, float $cost): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $qty, 'initial_qty' => $qty,
            'remaining_qty' => $qty, 'unit_cost' => $cost,
            'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $productId, 'warehouse_id' => $this->warehouseId,
            'quantity' => $qty, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('products')->where('id', $productId)->increment('stock_quantity', $qty);

        app(\App\Engines\AccountingService::class)->createEntry([
            'date' => now()->subDay()->toDateString(), 'reference_type' => 'opening_stock',
            'reference' => (string) Str::uuid(),
        ], [
            ['account_code' => '1100', 'debit' => round($qty * $cost, 2), 'credit' => 0],
            ['account_code' => '7000', 'debit' => 0, 'credit' => round($qty * $cost, 2)],
        ]);
    }

    /** A sale through the legacy POS checkout (POST /s/{store}/sales). */
    private function legacySale(string $method, float $qty, float $price, float $paid, array $line = []): string
    {
        $res = $this->postJson($this->storeUrl($this->tenant, 'sales'), [
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'items'          => [array_merge(['product_id' => $this->productId, 'quantity' => $qty, 'price' => $price, 'discount' => 0], $line)],
            'discount'       => 0,
            'amount_paid'    => $paid,
            'payment_method' => $method,
            'source'         => 'pos',
        ]);
        $res->assertOk()->assertJson(['success' => true]);
        return (string) $res->json('sale_id');
    }

    private function legacyReturn(string $saleId, array $items): \Illuminate\Testing\TestResponse
    {
        return $this->from('/x')->post($this->storeUrl($this->tenant, "sales/{$saleId}/return"), [
            'refund_method' => 'cash', 'refund_source' => 'cash_drawer',
            'reason' => 'Customer return', 'items' => $items,
        ]);
    }

    private function preSale(float $qty, float $price): SalesOrder
    {
        $this->postJson($this->storeUrl($this->tenant, 'sales/pre-sales'), [
            'customer_id' => $this->customerId,
            'order_date'  => now()->toDateString(),
            'items'       => [['product_id' => $this->productId, 'quantity' => $qty, 'unit_price' => $price, 'discount' => 0]],
        ])->assertOk();
        return SalesOrder::where('tenant_id', $this->tenantId)->latest()->firstOrFail();
    }

    private function member(string $role, ?string $pin = null): User
    {
        $user = $this->createTenantUser($this->tenant, $role);
        if ($pin !== null) {
            TenantUser::where('tenant_id', $this->tenant->id)->where('user_id', $user->id)->update(['security_pin' => Hash::make($pin)]);
        }
        return $user;
    }

    /** @return array<string, int|float> */
    private function footprint(): array
    {
        $t = $this->tenantId;
        return [
            'sales'        => DB::table('sales')->where('tenant_id', $t)->count(),
            'journal'      => DB::table('journal_entries')->where('tenant_id', $t)->count(),
            'sale_batches' => DB::table('sale_item_batches')->where('tenant_id', $t)->count(),
            'batch_left'   => (float) DB::table('inventory_batches')->where('tenant_id', $t)->sum('remaining_qty'),
            'stock'        => (float) DB::table('stocks')->where('tenant_id', $t)->sum('quantity'),
            'master'       => (float) DB::table('products')->where('tenant_id', $t)->sum('stock_quantity'),
        ];
    }

    /** code → [debit, credit] of a sale's partial-return entry. */
    private function returnLines(string $saleId): array
    {
        $entryId = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale_return')->where('source_id', $saleId)->value('id');
        $this->assertNotNull($entryId, "No partial-return entry for {$saleId}");
        return DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $entryId)->orderBy('a.code')
            ->get(['a.code', 'ji.debit', 'ji.credit'])
            ->mapWithKeys(fn ($r) => [$r->code => [round((float) $r->debit, 2), round((float) $r->credit, 2)]])
            ->all();
    }

    private function itemId(string $saleId): string
    {
        return (string) DB::table('sale_items')->where('sale_id', $saleId)->value('id');
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

    private function accountBalance(string $code): float
    {
        return round((float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $this->tenantId)->where('a.tenant_id', $this->tenantId)
            ->where('a.code', $code)->where('je.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as bal')->value('bal'), 2);
    }

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

    private function batchUnits(string $productId): float
    {
        return (float) DB::table('inventory_batches')->where('tenant_id', $this->tenantId)
            ->where('product_id', $productId)->whereNull('deleted_at')->sum('remaining_qty');
    }

    private function fifoValuation(): float
    {
        return round((float) DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->whereNull('deleted_at')
            ->selectRaw('COALESCE(SUM(remaining_qty * unit_cost), 0) as v')->value('v'), 2);
    }

    private function assertInventoryReconciles(): void
    {
        $this->assertEqualsWithDelta($this->fifoValuation(), $this->accountBalance('1100'), 0.001,
            'Ledger 1100 must equal the FIFO batch valuation.');
    }

    private function assertStockAggregates(string $productId, float $expected): void
    {
        $this->assertEqualsWithDelta($expected, $this->batchUnits($productId), 0.00001, 'FIFO batches');
        $this->assertEqualsWithDelta($expected, (float) DB::table('stocks')->where('tenant_id', $this->tenantId)
            ->where('product_id', $productId)->where('warehouse_id', $this->warehouseId)->sum('quantity'), 0.00001,
            'stocks.quantity must track the FIFO batches.');
        $this->assertEqualsWithDelta($expected, (float) DB::table('products')->where('id', $productId)->value('stock_quantity'), 0.00001,
            'products.stock_quantity must track the FIFO batches.');
    }

    /** Every unit of the main product is back exactly once and no account keeps a residue. */
    private function assertSaleFullyUnwound(): void
    {
        $this->assertStockAggregates($this->productId, 10.0);
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
