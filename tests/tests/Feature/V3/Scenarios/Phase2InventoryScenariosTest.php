<?php

namespace Tests\Feature\V3\Scenarios;

use App\Exceptions\InsufficientStockException;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use App\Services\V3\InventoryService;
use App\Services\V3\PaymentService;
use App\Services\V3\PurchaseService;
use App\Services\V3\SaleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * PHASE 2 — INVENTORY & PURCHASING SCENARIOS (Scenario Rulebook v3.0)
 *
 * Real implementations of the Phase 2 [STUB] entries of ScenarioStubsTest:
 *   S-006, S-007, S-010, S-025, S-050, S-059, S-101, S-102, S-105.
 *
 * Same house style as the implemented tests in ScenarioStubsTest (s003, s049 …):
 * RefreshDatabase, manual tenant / chart / warehouse / party seeding, then the
 * REAL production code path — the V3 engines, or the HTTP route the UI posts to
 * — with exact amounts asserted against inventory_batches, journal_entries,
 * journal_items, purchases and allocations, and every journal entry balanced.
 */
class Phase2InventoryScenariosTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User   $user;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;
    private string $supplierId;

    private SaleService       $sales;
    private PurchaseService   $purchases;
    private PaymentService    $payments;
    private AccountingService $accounting;
    private InventoryService  $inventory;
    private FifoService       $fifo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->tenantId = $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);

        $this->user = User::factory()->create([
            'last_store_id' => $this->tenant->id,
        ]);

        // Owner membership so the HTTP routes (tenant + permission middleware)
        // resolve this store exactly as they do in production.
        TenantUser::create([
            'tenant_id'    => $this->tenant->id,
            'user_id'      => $this->user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => $this->user->name,
            'joined_at'    => now(),
        ]);
        $this->actingAs($this->user);

        $this->sales      = app(SaleService::class);
        $this->purchases  = app(PurchaseService::class);
        $this->payments   = app(PaymentService::class);
        $this->accounting = app(AccountingService::class);
        $this->inventory  = app(InventoryService::class);
        $this->fifo       = app(FifoService::class);

        // Chart of accounts — codes per database/seeders/TenantDefaultSeeder.php
        $this->seedAccount('1000', 'Cash in Hand',           'asset',     'debit');
        $this->seedAccount('1010', 'Bank Account',            'asset',     'debit');
        $this->seedAccount('1100', 'Inventory Asset',         'asset',     'debit');
        $this->seedAccount('1200', 'Accounts Receivable',     'asset',     'debit');
        $this->seedAccount('2000', 'Accounts Payable',        'liability', 'credit');
        $this->seedAccount('2100', 'Sales Tax Payable',       'liability', 'credit');
        $this->seedAccount('2300', 'Input Tax Recoverable',   'asset',     'debit');
        $this->seedAccount('3000', "Owner's Capital",         'equity',    'credit');
        $this->seedAccount('4000', 'Sales Revenue',           'income',    'credit');
        $this->seedAccount('4200', 'Stock Adjustment Gain',   'income',    'credit');
        $this->seedAccount('5000', 'Cost of Goods Sold',      'expense',   'debit');
        $this->seedAccount('6000', 'Operating Expenses',      'expense',   'debit');
        $this->seedAccount('6300', 'Stock Adjustment Loss',   'expense',   'debit');
        $this->seedAccount('7000', 'Opening Balance Equity',  'equity',    'credit');

        $this->warehouseId = $this->seedWarehouse('Default Warehouse', true);

        $this->productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id'             => $this->productId,
            'tenant_id'      => $this->tenantId,
            'name'           => 'Test Widget',
            'sku'            => 'WIDGET-' . Str::random(6),
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
            'name'       => 'Test Customer',
            'type'       => 'customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->supplierId = (string) Str::uuid();
        DB::table('parties')->insert([
            'id'         => $this->supplierId,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Test Supplier',
            'type'       => 'supplier',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-006 — Multi-warehouse FIFO
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-006 Multi-warehouse FIFO — deduction is per warehouse only */
    public function s006_fifo_is_per_warehouse(): void
    {
        // Warehouse CRUD: another store already owns a warehouse called
        // "Branch B". Warehouse names are per store, so this store must still
        // be able to create its own "Branch B" through the real V3 route.
        $otherTenant = Tenant::factory()->create();
        DB::table('warehouses')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $otherTenant->id,
            'name' => 'Branch B', 'is_default' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // A single-location plan (the factory's 'trial') may not open a second site.
        $this->post("/s/{$this->tenant->slug}/v3/warehouses", [
            'name' => 'Branch B', 'address' => 'Second site',
        ])->assertForbidden();
        $this->assertSame(1, DB::table('warehouses')->where('tenant_id', $this->tenantId)->count());

        // On a multi-location plan it can.
        $this->tenant->update(['plan' => 'business']);
        \Illuminate\Support\Facades\Cache::flush();

        $this->post("/s/{$this->tenant->slug}/v3/warehouses", [
            'name'    => 'Branch B',
            'address' => 'Second site',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $branchId = DB::table('warehouses')
            ->where('tenant_id', $this->tenantId)->where('name', 'Branch B')->value('id');
        $this->assertNotNull($branchId, 'Second warehouse must be created for this store.');
        $this->assertDatabaseHas('warehouses', ['id' => $branchId, 'is_default' => 0]);
        $this->assertDatabaseHas('warehouses', ['id' => $this->warehouseId, 'is_default' => 1]);

        // Warehouse A holds the OLDEST and CHEAPEST batch in the whole store.
        $batchA = $this->insertBatch($this->warehouseId, 10, 50.00, now()->subDays(5));
        // Warehouse B holds a newer, dearer batch.
        $batchB = $this->insertBatch($branchId, 5, 70.00, now()->subDay());

        // Sell 3 from Warehouse B. Global FIFO would take the Rs.50 batch in A;
        // per-warehouse FIFO must take them from B's Rs.70 batch.
        $sale = $this->sales->post([
            'customer_id'     => $this->customerId,
            'warehouse_id'    => $branchId,
            'sale_date'       => now()->toDateString(),
            'payment_method'  => 'cash',
            'amount_received' => 300.00,
            'items' => [
                ['product_id' => $this->productId, 'qty' => 3, 'sale_uom' => 'PCS', 'unit_price' => 100.00],
            ],
        ]);

        $this->assertDatabaseHas('inventory_batches', ['id' => $batchB, 'remaining_qty' => 2]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchA, 'remaining_qty' => 10]);

        $saleItemId = DB::table('sale_items')->where('sale_id', $sale->id)->value('id');
        $this->assertSame(1, DB::table('sale_item_batches')->where('sale_item_id', $saleItemId)->count());
        $this->assertDatabaseHas('sale_item_batches', [
            'sale_item_id' => $saleItemId, 'inventory_batch_id' => $batchB,
            'qty_deducted' => 3, 'unit_cost' => 70.00, 'total_cogs' => 210.00,
        ]);

        // COGS in the ledger is Warehouse B's cost (3 × 70 = 210), not A's (150).
        $entryId = $this->entryId('sale', $sale->id);
        $this->assertLine($entryId, '5000', 210.00, 0);
        $this->assertLine($entryId, '1100', 0, 210.00);
        $this->assertEntryBalanced($entryId);

        // Availability is per warehouse too.
        $this->assertFalse($this->fifo->checkAvailability($this->productId, $branchId, 3));
        $this->assertTrue($this->fifo->checkAvailability($this->productId, $this->warehouseId, 10));

        // With negative stock blocked, B cannot "borrow" stock that only A holds.
        \App\Models\Setting::updateOrCreate(
            ['tenant_id' => $this->tenantId, 'key' => 'stop_sale_negative_stock'],
            ['value' => '1']
        );
        \App\Helpers\SettingsHelper::clearCache();

        try {
            $this->fifo->deductStock($this->productId, $branchId, 4);
            $this->fail('Deducting 4 from Warehouse B (holds 2) must throw even though Warehouse A holds 10.');
        } catch (InsufficientStockException $e) {
            // expected
        }
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchA, 'remaining_qty' => 10]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchB, 'remaining_qty' => 2]);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-007 — B10 stock adjustment decrease, FIFO oldest-first
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-007 Stock adjustment decrease uses FIFO oldest-first (B10) */
    public function s007_stock_adjustment_decrease_fifo(): void
    {
        // Newest batch inserted FIRST so insertion order cannot fake FIFO.
        $newest = $this->insertBatch($this->warehouseId, 5, 30.00, now()->subDay());
        $oldest = $this->insertBatch($this->warehouseId, 5, 10.00, now()->subDays(4));
        $this->seedStockRow($this->warehouseId, 10);

        // Decrease 7: 5 × 10 from the oldest + 2 × 30 from the newest = 110.
        $entry = $this->inventory->adjustStock(
            productId:   $this->productId,
            warehouseId: $this->warehouseId,
            qty:         7,
            direction:   'decrease',
            reason:      'Cycle count shortfall'
        );

        $this->assertDatabaseHas('inventory_batches', ['id' => $oldest, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $newest, 'remaining_qty' => 3]);

        $this->assertDatabaseHas('journal_entries', [
            'id' => $entry->id, 'tenant_id' => $this->tenantId, 'reference_type' => 'stock_adjustment',
        ]);
        $this->assertLine($entry->id, '6300', 110.00, 0);
        $this->assertLine($entry->id, '1100', 0, 110.00);
        $this->assertSame(2, DB::table('journal_items')->where('journal_entry_id', $entry->id)->count());
        $this->assertEntryBalanced($entry->id);

        // Physical quantities follow the ledger.
        $this->assertDatabaseHas('stocks', [
            'tenant_id' => $this->tenantId, 'product_id' => $this->productId,
            'warehouse_id' => $this->warehouseId, 'quantity' => 3,
        ]);
        $this->assertDatabaseHas('products', ['id' => $this->productId, 'stock_quantity' => 3]);
        $this->assertDatabaseHas('stock_movements', [
            'tenant_id' => $this->tenantId, 'product_id' => $this->productId,
            'warehouse_id' => $this->warehouseId, 'type' => 'adjustment_out', 'quantity' => -7,
        ]);

        // FIFO valuation fell by exactly the amount credited to 1100: 200 → 90 (3 × 30).
        $this->assertEqualsWithDelta(-110.00, $this->glBalance('1100'), 0.001);
        $this->assertEqualsWithDelta(90.00, $this->fifoValuation(), 0.001);
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-010 — B6 credit purchase
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-010 Credit purchase creates AP and inventory batch (B6) */
    public function s010_credit_purchase_creates_ap_and_batch(): void
    {
        $purchase = $this->purchases->store([
            'supplier_id'    => $this->supplierId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => now()->toDateString(),
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $this->productId, 'qty' => 8, 'unit_cost' => 125.00, 'tax_rate' => 0],
            ],
        ]);

        // FIFO batch at the exact purchase cost, linked to the purchase and its line.
        $batch = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)->where('purchase_invoice_id', $purchase->id)->first();
        $this->assertNotNull($batch);
        $this->assertSame($this->warehouseId, $batch->warehouse_id);
        $this->assertSame('purchase', $batch->batch_type);
        $this->assertEqualsWithDelta(125.00, (float) $batch->unit_cost, 0.0001);
        $this->assertEqualsWithDelta(8, (float) $batch->original_qty, 0.0001);
        $this->assertEqualsWithDelta(8, (float) $batch->remaining_qty, 0.0001);
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id, 'inventory_batch_id' => $batch->id, 'qty' => 8, 'received_qty' => 8,
        ]);

        // B6: DR 1100 1000 / CR 2000 1000 tagged to the supplier — no cash leg.
        $entryId = $this->entryId('purchase', $purchase->id);
        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id, 'total' => 1000.00, 'payment_status' => 'unpaid',
            'journal_entry_id' => $entryId, 'party_id' => $this->supplierId,
        ]);
        $this->assertLine($entryId, '1100', 1000.00, 0);
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entryId, 'account_id' => $this->accountId('2000'),
            'party_id' => $this->supplierId, 'debit' => 0, 'credit' => 1000.00,
        ]);
        $this->assertSame(0, DB::table('journal_items')
            ->where('journal_entry_id', $entryId)->where('account_id', $this->accountId('1000'))->count());
        $this->assertEntryBalanced($entryId);

        // AP is owed to THIS supplier, and the party snapshot agrees.
        $this->assertEqualsWithDelta(1000.00, $this->supplierPayable(), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->glBalance('1000'), 0.001);
        $snapshot = DB::table('party_snapshots')
            ->where('tenant_id', $this->tenantId)->where('party_id', $this->supplierId)
            ->where('account_id', $this->accountId('2000'))->first();
        $this->assertNotNull($snapshot, 'Supplier snapshot must be rebuilt after a credit purchase.');
        $this->assertEqualsWithDelta(1000.00, abs((float) $snapshot->cached_balance), 0.001);

        // Stock aggregates
        $this->assertDatabaseHas('products', ['id' => $this->productId, 'stock_quantity' => 8]);
        $this->assertDatabaseHas('stocks', [
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId, 'quantity' => 8,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-050 — partial input-tax recovery
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-050 Partial input tax recovery splits 2300 and 6000 */
    public function s050_partial_input_tax_recovery(): void
    {
        // Through the real V3 purchase route (StorePurchaseRequest → PurchaseService).
        // 10 × 100 = 1000 net, 17% tax = 170; only 60% is business use:
        //   recoverable 102 → DR 2300, non-recoverable 68 → DR 6000.
        $response = $this->postJson("/s/{$this->tenant->slug}/v3/purchases", [
            'supplier_id'    => $this->supplierId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => now()->toDateString(),
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00,
                 'tax_rate' => 17, 'business_pct' => 60],
            ],
        ]);
        $response->assertOk()->assertJson(['success' => true]);
        $purchaseId = $response->json('purchase.id');

        $this->assertDatabaseHas('purchases', [
            'id' => $purchaseId, 'subtotal' => 1000.00, 'tax' => 170.00, 'total' => 1170.00,
        ]);
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchaseId, 'tax_rate' => 17, 'business_pct' => 60, 'line_total' => 1000.00,
        ]);

        $entryId = $this->entryId('purchase', $purchaseId);
        $this->assertLine($entryId, '1100', 1000.00, 0);
        $this->assertLine($entryId, '2300', 102.00, 0);
        $this->assertLine($entryId, '6000', 68.00, 0);
        $this->assertLine($entryId, '2000', 0, 1170.00);
        $this->assertSame(4, DB::table('journal_items')->where('journal_entry_id', $entryId)->count());
        $this->assertEntryBalanced($entryId);

        // Inventory carries the goods at net cost only.
        $this->assertDatabaseHas('inventory_batches', [
            'purchase_invoice_id' => $purchaseId, 'unit_cost' => 100.00, 'remaining_qty' => 10,
        ]);

        // Control: a fully-business purchase recovers ALL the tax — nothing to 6000.
        $full = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 2, 'unit_cost' => 50.00, 'tax_rate' => 17]],
        ]);
        $fullEntry = $this->entryId('purchase', $full->id);
        $this->assertLine($fullEntry, '2300', 17.00, 0);
        $this->assertSame(0, DB::table('journal_items')
            ->where('journal_entry_id', $fullEntry)->where('account_id', $this->accountId('6000'))->count());

        $this->assertEqualsWithDelta(119.00, $this->glBalance('2300'), 0.001);
        $this->assertEqualsWithDelta(68.00, $this->glBalance('6000'), 0.001);
        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-059 — B18 purchase return
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-059 Purchase return (B18) reverses inventory and AP correctly */
    public function s059_purchase_return_b18_correct(): void
    {
        // Credit purchase: 10 × 100 + 17% tax → DR 1100 1000, DR 2300 170 / CR 2000 1170.
        $purchase = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->subDays(2)->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'tax_rate' => 17]],
        ]);
        $item = DB::table('purchase_items')->where('purchase_id', $purchase->id)->first();
        $this->assertEqualsWithDelta(1170.00, $this->supplierPayable(), 0.001);

        // 3 units are sold, so only 7 remain in the purchase batch.
        $this->sales->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 3, 'sale_uom' => 'PCS', 'unit_price' => 150.00]],
        ]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $item->inventory_batch_id, 'remaining_qty' => 7]);

        $returnUrl = "/s/{$this->tenant->slug}/v3/purchases/{$purchase->id}/return";

        // Guard: sold stock cannot be sent back to the supplier.
        $threw = false;
        try {
            $this->withoutExceptionHandling()->post($returnUrl, [
                'return_date' => now()->toDateString(), 'reason' => 'Too many',
                'items' => [['purchase_item_id' => $item->id, 'inventory_batch_id' => $item->inventory_batch_id, 'return_qty' => 8]],
            ]);
        } catch (\InvalidArgumentException $e) {
            $threw = true;
            $this->assertStringContainsString('already been sold', $e->getMessage());
        }
        $this->withExceptionHandling();
        $this->assertTrue($threw, 'Returning 8 when only 7 remain must be refused.');
        $this->assertSame(0, DB::table('purchase_returns')->where('purchase_id', $purchase->id)->count());

        $stockQtyBefore = (float) DB::table('products')->where('id', $this->productId)->value('stock_quantity');
        $whQtyBefore    = (float) DB::table('stocks')
            ->where('product_id', $this->productId)->where('warehouse_id', $this->warehouseId)->value('quantity');

        // Return 4 through the real route.
        $this->post($returnUrl, [
            'return_date' => now()->toDateString(), 'reason' => 'Defective',
            'items' => [['purchase_item_id' => $item->id, 'inventory_batch_id' => $item->inventory_batch_id, 'return_qty' => 4]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        // Stock leaves the ORIGINAL batch.
        $this->assertDatabaseHas('inventory_batches', ['id' => $item->inventory_batch_id, 'remaining_qty' => 3]);
        // (SaleService::post leaves the stock aggregates to its HTTP callers, so
        //  measure the return's own effect on them rather than an absolute.)
        $this->assertEqualsWithDelta($stockQtyBefore - 4, (float) DB::table('products')
            ->where('id', $this->productId)->value('stock_quantity'), 0.0001);
        $this->assertEqualsWithDelta($whQtyBefore - 4, (float) DB::table('stocks')
            ->where('product_id', $this->productId)->where('warehouse_id', $this->warehouseId)->value('quantity'), 0.0001);
        $this->assertDatabaseHas('stock_movements', [
            'tenant_id' => $this->tenantId, 'product_id' => $this->productId,
            'type' => 'purchase_return', 'quantity' => -4,
        ]);

        // B18 debit note: goods at original batch cost (4 × 100 = 400) plus the
        // input tax that was claimed on them (4 × 17 = 68) come off the payable.
        $return = DB::table('purchase_returns')->where('purchase_id', $purchase->id)->first();
        $this->assertNotNull($return);
        $this->assertEqualsWithDelta(468.00, (float) $return->total_amount, 0.001);
        $this->assertDatabaseHas('journal_entries', [
            'id' => $return->journal_entry_id, 'reference_type' => 'purchase_return', 'reference' => $return->id,
        ]);
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $return->journal_entry_id, 'account_id' => $this->accountId('2000'),
            'party_id' => $this->supplierId, 'debit' => 468.00, 'credit' => 0,
        ]);
        $this->assertLine($return->journal_entry_id, '1100', 0, 400.00);
        $this->assertLine($return->journal_entry_id, '2300', 0, 68.00);
        $this->assertEntryBalanced($return->journal_entry_id);

        // Net effect: supplier owes-back fully reflected, ITC only on kept goods.
        $this->assertEqualsWithDelta(702.00, $this->supplierPayable(), 0.001);   // 6 × 117
        $this->assertEqualsWithDelta(102.00, $this->glBalance('2300'), 0.001);   // 6 × 17
        // 1100: +1000 purchase − 300 COGS − 400 return = 300 = FIFO valuation (3 × 100)
        $this->assertEqualsWithDelta(300.00, $this->glBalance('1100'), 0.001);
        $this->assertEqualsWithDelta(300.00, $this->fifoValuation(), 0.001);

        // After the debit note only 702 is owed: a payment for the original
        // 1170 cannot be allocated, and paying the 702 settles the invoice.
        $payUrl = "/s/{$this->tenant->slug}/v3/supplier-payments";
        $this->post($payUrl, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 1170.00,
            'allocations' => [['purchase_id' => $purchase->id, 'amount' => 1170.00]],
        ])->assertSessionHasErrors('allocations');

        $this->post($payUrl, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 702.00,
            'allocations' => [['purchase_id' => $purchase->id, 'amount' => 702.00]],
        ])->assertSessionHasNoErrors()->assertRedirect();
        $this->assertDatabaseHas('purchases', ['id' => $purchase->id, 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(0.00, $this->supplierPayable(), 0.001);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-101 — B12 stock transfer
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-101 Stock transfer between warehouses (B12) — no journal */
    public function s101_stock_transfer_no_journal(): void
    {
        $branchId = $this->seedWarehouse('Branch Store', false);

        $old = $this->insertBatch($this->warehouseId, 4, 50.00, now()->subDays(3));
        $new = $this->insertBatch($this->warehouseId, 6, 55.00, now()->subDay());
        $this->seedStockRow($this->warehouseId, 10);

        $journalCountBefore = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();
        $valuationBefore    = $this->fifoValuation();

        // The Stock Operations screen posts here (store.stock-operations.transfer).
        $this->post("/s/{$this->tenant->slug}/stock-operations/transfer", [
            'product_id'        => $this->productId,
            'from_warehouse_id' => $this->warehouseId,
            'to_warehouse_id'   => $branchId,
            'quantity'          => 7,
            'notes'             => 'Restock branch',
        ])->assertSessionHasNoErrors()->assertRedirect();

        // Source: oldest-first — all 4 of the Rs.50 batch, 3 of the Rs.55 batch.
        $this->assertDatabaseHas('inventory_batches', ['id' => $old, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $new, 'remaining_qty' => 3]);

        // Destination: the same layers, at the same cost and the same age.
        $dest = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)->where('warehouse_id', $branchId)
            ->orderBy('created_at')->get();
        $this->assertCount(2, $dest);
        $this->assertEqualsWithDelta(4, (float) $dest[0]->remaining_qty, 0.0001);
        $this->assertEqualsWithDelta(50.00, (float) $dest[0]->unit_cost, 0.0001);
        $this->assertEqualsWithDelta(3, (float) $dest[1]->remaining_qty, 0.0001);
        $this->assertEqualsWithDelta(55.00, (float) $dest[1]->unit_cost, 0.0001);
        $oldCreatedAt = DB::table('inventory_batches')->where('id', $old)->value('created_at');
        $this->assertEquals($oldCreatedAt, $dest[0]->created_at, 'Transferred layer must keep its FIFO age.');

        // B12: logistics only — ZERO journal effect, valuation unchanged.
        $this->assertSame($journalCountBefore, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertEqualsWithDelta($valuationBefore, $this->fifoValuation(), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->glBalance('1100'), 0.001);

        $this->assertDatabaseHas('stocks', ['product_id' => $this->productId, 'warehouse_id' => $this->warehouseId, 'quantity' => 3]);
        $this->assertDatabaseHas('stocks', ['product_id' => $this->productId, 'warehouse_id' => $branchId, 'quantity' => 7]);
        $this->assertDatabaseHas('stock_movements', ['warehouse_id' => $this->warehouseId, 'type' => 'transfer_out', 'quantity' => -7]);
        $this->assertDatabaseHas('stock_movements', ['warehouse_id' => $branchId, 'type' => 'transfer_in', 'quantity' => 7]);

        // Selling 5 at the branch consumes the transferred layers in FIFO order:
        // 4 × 50 + 1 × 55 = 255.
        $sale = $this->sales->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $branchId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'cash', 'amount_received' => 500.00,
            'items' => [['product_id' => $this->productId, 'qty' => 5, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ]);
        $this->assertLine($this->entryId('sale', $sale->id), '5000', 255.00, 0);

        // Guard: cannot transfer more than the source warehouse holds (3 left).
        $this->withoutExceptionHandling();
        try {
            $this->post("/s/{$this->tenant->slug}/stock-operations/transfer", [
                'product_id' => $this->productId, 'from_warehouse_id' => $this->warehouseId,
                'to_warehouse_id' => $branchId, 'quantity' => 4,
            ]);
            $this->fail('Transferring 4 when the source holds 3 must be refused.');
        } catch (InsufficientStockException $e) {
            // expected
        }
        $this->assertDatabaseHas('inventory_batches', ['id' => $new, 'remaining_qty' => 3]);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-102 — B10 write-off at FIFO cost
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-102 Stock write-off (B10) posts to 6300 at FIFO cost */
    public function s102_stock_writeoff_posts_to_6300(): void
    {
        // The product master says cost_price = 60. The FIFO layers say 40 and 45.
        $older = $this->insertBatch($this->warehouseId, 3, 40.00, now()->subDays(6));
        $newer = $this->insertBatch($this->warehouseId, 10, 45.00, now()->subDays(2));
        $this->seedStockRow($this->warehouseId, 13);

        // Write off 5 damaged units through the Stock Operations screen's route.
        $this->post("/s/{$this->tenant->slug}/stock-operations/adjust", [
            'product_id'      => $this->productId,
            'warehouse_id'    => $this->warehouseId,
            'adjustment_type' => 'remove',
            'quantity'        => 5,
            'reason'          => 'Damaged',
            'notes'           => 'Water damage in storeroom',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertDatabaseHas('inventory_batches', ['id' => $older, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $newer, 'remaining_qty' => 8]);

        // FIFO cost = 3 × 40 + 2 × 45 = 210 — NOT 5 × 60 = 300 from the product master.
        $entryId = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)->where('reference_type', 'stock_adjustment')->value('id');
        $this->assertNotNull($entryId);
        $this->assertLine($entryId, '6300', 210.00, 0);
        $this->assertLine($entryId, '1100', 0, 210.00);
        $this->assertEntryBalanced($entryId);

        $this->assertEqualsWithDelta(210.00, $this->glBalance('6300'), 0.001);
        $this->assertEqualsWithDelta(360.00, $this->fifoValuation(), 0.001); // 8 × 45

        $this->assertDatabaseHas('stocks', ['product_id' => $this->productId, 'warehouse_id' => $this->warehouseId, 'quantity' => 8]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->productId, 'type' => 'adjustment_out', 'quantity' => -5,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-105 — B11 stock adjustment gain
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-105 Stock adjustment gain (B11) posts to 4200 */
    public function s105_stock_adjustment_gain_posts_to_4200(): void
    {
        // V3 route: an increase is refused without a unit cost to value it at.
        $this->post("/s/{$this->tenant->slug}/v3/stock-adjustments", [
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'direction' => 'increase', 'qty' => 4, 'reason' => 'Found in back room',
        ])->assertSessionHasErrors('unit_cost');
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());

        // With a unit cost: 4 × 62.50 = 250 → DR 1100 / CR 4200.
        $this->post("/s/{$this->tenant->slug}/v3/stock-adjustments", [
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'direction' => 'increase', 'qty' => 4, 'unit_cost' => 62.50, 'reason' => 'Found in back room',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $batch = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)->where('product_id', $this->productId)->first();
        $this->assertNotNull($batch);
        $this->assertSame('adjustment', $batch->batch_type);
        $this->assertSame($this->warehouseId, $batch->warehouse_id);
        $this->assertEqualsWithDelta(62.50, (float) $batch->unit_cost, 0.0001);
        $this->assertEqualsWithDelta(4, (float) $batch->remaining_qty, 0.0001);

        $entryId = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)->where('reference_type', 'stock_adjustment')->value('id');
        $this->assertLine($entryId, '1100', 250.00, 0);
        $this->assertLine($entryId, '4200', 0, 250.00);
        $this->assertSame(2, DB::table('journal_items')->where('journal_entry_id', $entryId)->count());
        $this->assertEntryBalanced($entryId);

        // The gain is income (credit-normal) and inventory ledger == FIFO layers.
        $this->assertEqualsWithDelta(-250.00, $this->glBalance('4200'), 0.001); // debit − credit
        $this->assertEqualsWithDelta(250.00, $this->glBalance('1100'), 0.001);
        $this->assertEqualsWithDelta(250.00, $this->fifoValuation(), 0.001);

        $this->assertDatabaseHas('products', ['id' => $this->productId, 'stock_quantity' => 4]);
        $this->assertDatabaseHas('stocks', ['product_id' => $this->productId, 'warehouse_id' => $this->warehouseId, 'quantity' => 4]);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $this->productId, 'type' => 'adjustment_in', 'quantity' => 4]);

        // The new layer is sellable at its adjustment cost.
        $sale = $this->sales->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'cash', 'amount_received' => 100.00,
            'items' => [['product_id' => $this->productId, 'qty' => 1, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ]);
        $this->assertLine($this->entryId('sale', $sale->id), '5000', 62.50, 0);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-025 — B5 supplier payment with allocation
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-025 Supplier payment (B5) allocates to purchase invoice */
    public function s025_supplier_payment_b5_allocates(): void
    {
        // Two credit purchases from the same supplier.
        $purchaseA = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->subDays(3)->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 5, 'unit_cost' => 80.00, 'tax_rate' => 0]],
        ]); // 400
        $purchaseB = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->subDay()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 65.00, 'tax_rate' => 0]],
        ]); // 650
        $this->assertEqualsWithDelta(1050.00, $this->supplierPayable(), 0.001);

        $url = "/s/{$this->tenant->slug}/v3/supplier-payments";

        // Guard: allocations may not exceed the payment.
        $this->post($url, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 100.00,
            'allocations' => [['purchase_id' => $purchaseB->id, 'amount' => 150.00]],
        ])->assertSessionHasErrors('allocations');

        // Guard: cannot allocate more than the invoice total (over-allocation).
        $this->post($url, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 700.00,
            'allocations' => [['purchase_id' => $purchaseB->id, 'amount' => 700.00]],
        ])->assertSessionHasErrors('allocations');
        $this->assertSame(0, DB::table('allocations')->where('tenant_id', $this->tenantId)->count());
        $this->assertSame(0, DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)->where('reference_type', 'supplier_payment')->count());

        // B5: pay 250 by bank against invoice B (the NEWER one) specifically.
        $this->post($url, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'bank', 'amount' => 250.00, 'reference' => 'CHQ-001',
            'allocations' => [['purchase_id' => $purchaseB->id, 'amount' => 250.00]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $payment1 = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)->where('reference_type', 'supplier_payment')->first();
        $this->assertNotNull($payment1);
        $this->assertSame($this->supplierId, $payment1->party_id);
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $payment1->id, 'account_id' => $this->accountId('2000'),
            'party_id' => $this->supplierId, 'debit' => 250.00, 'credit' => 0,
        ]);
        $this->assertLine($payment1->id, '1010', 0, 250.00);
        $this->assertEntryBalanced($payment1->id);

        $this->assertDatabaseHas('allocations', [
            'payment_journal_entry_id' => $payment1->id, 'purchase_id' => $purchaseB->id,
            'allocated_amount' => 250.00, 'status' => 'active',
        ]);
        $this->assertSame(0, DB::table('allocations')->where('purchase_id', $purchaseA->id)->count());
        $this->assertDatabaseHas('purchases', ['id' => $purchaseB->id, 'payment_status' => 'partial']);
        $this->assertDatabaseHas('purchases', ['id' => $purchaseA->id, 'payment_status' => 'unpaid']);

        // Second payment of 800 in cash settles B (400) and A (400) in one go.
        $this->post($url, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 800.00,
            'allocations' => [
                ['purchase_id' => $purchaseB->id, 'amount' => 400.00],
                ['purchase_id' => $purchaseA->id, 'amount' => 400.00],
            ],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertDatabaseHas('purchases', ['id' => $purchaseB->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('purchases', ['id' => $purchaseA->id, 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(650.00, (float) DB::table('allocations')
            ->where('purchase_id', $purchaseB->id)->where('status', 'active')->sum('allocated_amount'), 0.001);

        // Ledger: supplier fully settled; 250 left the bank, 800 left the till.
        $this->assertEqualsWithDelta(0.00, $this->supplierPayable(), 0.001);
        $this->assertEqualsWithDelta(-250.00, $this->glBalance('1010'), 0.001);
        $this->assertEqualsWithDelta(-800.00, $this->glBalance('1000'), 0.001);

        // A purchase part-paid at the counter: 1000 billed, 400 paid on the spot,
        // so only 600 is on the supplier's account and only 600 may be allocated.
        $purchaseC = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit', 'amount_paid' => 400.00,
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'tax_rate' => 0]],
        ]);
        $this->assertDatabaseHas('purchases', ['id' => $purchaseC->id, 'total' => 1000.00, 'payment_status' => 'partial']);
        $this->assertEqualsWithDelta(600.00, $this->supplierPayable(), 0.001);

        $this->post($url, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 700.00,
            'allocations' => [['purchase_id' => $purchaseC->id, 'amount' => 700.00]],
        ])->assertSessionHasErrors('allocations');
        $this->assertSame(0, DB::table('allocations')->where('purchase_id', $purchaseC->id)->count());

        $this->post($url, [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 600.00,
            'allocations' => [['purchase_id' => $purchaseC->id, 'amount' => 600.00]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        // 400 at the counter + 600 allocated = 1000: settled, not "partial".
        $this->assertDatabaseHas('purchases', ['id' => $purchaseC->id, 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(0.00, $this->supplierPayable(), 0.001);

        $this->assertAllEntriesBalanced();
    }

    // ─── Helpers (house style — mirrors ScenarioStubsTest.php) ─────────

    private function seedAccount(string $code, string $name, string $type, string $normalBalance): void
    {
        $exists = DB::table('accounts')->where('code', $code)->where('tenant_id', $this->tenantId)->exists();
        if (!$exists) {
            DB::table('accounts')->insert([
                'id'             => Str::uuid()->toString(),
                'tenant_id'      => $this->tenantId,
                'code'           => $code,
                'name'           => $name,
                'type'           => $type,
                'normal_balance' => $normalBalance,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    private function seedWarehouse(string $name = 'Default Warehouse', bool $isDefault = true): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $id,
            'tenant_id'  => $this->tenantId,
            'name'       => $name,
            'is_default' => $isDefault ? 1 : 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function insertBatch(string $warehouseId, float $qty, float $unitCost, \DateTimeInterface $createdAt): string
    {
        $id = (string) Str::uuid();
        DB::table('inventory_batches')->insert([
            'id' => $id, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $qty, 'initial_qty' => $qty,
            'remaining_qty' => $qty, 'unit_cost' => $unitCost,
            'created_at' => $createdAt, 'updated_at' => $createdAt,
        ]);
        return $id;
    }

    private function seedStockRow(string $warehouseId, float $qty): void
    {
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $warehouseId,
            'quantity' => $qty, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('products')->where('id', $this->productId)->increment('stock_quantity', $qty);
    }

    private function accountId(string $code): string
    {
        return (string) DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
    }

    private function entryId(string $referenceType, string $reference): string
    {
        $id = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', $referenceType)
            ->where('reference', $reference)
            ->value('id');
        $this->assertNotNull($id, "No {$referenceType} journal entry for {$reference}.");
        return (string) $id;
    }

    private function assertLine(string $entryId, string $code, float $debit, float $credit): void
    {
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entryId,
            'account_id'       => $this->accountId($code),
            'debit'            => $debit,
            'credit'           => $credit,
        ]);
    }

    private function assertEntryBalanced(string $entryId): void
    {
        $t = DB::table('journal_items')->where('journal_entry_id', $entryId)
            ->selectRaw('COALESCE(SUM(debit),0) d, COALESCE(SUM(credit),0) c, COUNT(*) n')->first();
        $this->assertGreaterThanOrEqual(2, (int) $t->n, "Entry {$entryId} must have at least two lines.");
        $this->assertEqualsWithDelta((float) $t->d, (float) $t->c, 0.001, "Entry {$entryId} is unbalanced.");
    }

    private function assertAllEntriesBalanced(): void
    {
        $ids = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->pluck('id');
        $this->assertNotEmpty($ids);
        foreach ($ids as $id) {
            $this->assertEntryBalanced((string) $id);
        }
    }

    /** Net (debit − credit) on live (non-reversed) entries for an account code. */
    private function glBalance(string $code): float
    {
        return round((float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)
            ->where('je.is_reversed', 0)
            ->where('ji.account_id', $this->accountId($code))
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as bal')
            ->value('bal') ?? 0), 2);
    }

    /** Amount currently owed to the supplier (credit − debit on 2000 tagged to them). */
    private function supplierPayable(): float
    {
        return round((float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)
            ->where('je.is_reversed', 0)
            ->where('ji.account_id', $this->accountId('2000'))
            ->where('ji.party_id', $this->supplierId)
            ->selectRaw('COALESCE(SUM(ji.credit),0) - COALESCE(SUM(ji.debit),0) as bal')
            ->value('bal') ?? 0), 2);
    }

    /** Σ remaining_qty × unit_cost over live batches of the test product. */
    private function fifoValuation(): float
    {
        return round((float) (DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)
            ->where('product_id', $this->productId)
            ->whereNull('deleted_at')
            ->selectRaw('COALESCE(SUM(remaining_qty * unit_cost),0) as v')
            ->value('v') ?? 0), 2);
    }
}
