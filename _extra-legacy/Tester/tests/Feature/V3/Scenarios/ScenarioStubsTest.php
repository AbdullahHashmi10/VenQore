<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\V3\SaleService;
use App\Services\V3\PurchaseService;
use App\Services\V3\PaymentService;
use App\Services\V3\AccountingService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * SCENARIO STUB REGISTRY
 *
 * Every named scenario from VenQore ERP Scenario Rulebook v3.0.
 * Stubs are organised by the Phase that will implement them.
 *
 * Status key:
 *   [COVERED]  — Already tested in a dedicated service test file
 *   [STUB]     — Pending implementation in the listed phase
 *
 * When a stub is implemented, replace markTestIncomplete() with
 * real assertions and remove the [STUB] tag.
 *
 * F1 (Batch 5) NOTE: The 9 tests below (s003, s005, s009, s017, s029, s049,
 * s002, s053, s054) were implemented against REAL production service code
 * (SaleService, PurchaseService, PaymentService, AccountingService,
 * OpeningBalanceController) per LAUNCH_VERIFICATION_AUDIT_2026-08-02.md
 * item F1. They use RefreshDatabase + manual tenant/account/party/warehouse
 * seeding, following the house style of PaymentServiceTest.php and
 * SmokeTest.php — NOT the Golden Company suite.
 */
class ScenarioStubsTest extends TestCase
{
    use RefreshDatabase;

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

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->tenantId = $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);

        $this->user = User::factory()->create([
            'last_store_id' => $this->tenant->id,
        ]);
        $this->actingAs($this->user);

        $this->sales      = app(SaleService::class);
        $this->purchases  = app(PurchaseService::class);
        $this->payments   = app(PaymentService::class);
        $this->accounting = app(AccountingService::class);

        // ── Standard chart of accounts used across B1/B2/B3/B4/B19 scenarios ──
        $this->seedAccount('1000', 'Cash in Hand',           'asset',     'debit');
        $this->seedAccount('1010', 'Bank Account',            'asset',     'debit');
        $this->seedAccount('1100', 'Inventory Asset',         'asset',     'debit');
        $this->seedAccount('1200', 'Accounts Receivable',     'asset',     'debit');
        $this->seedAccount('2000', 'Accounts Payable',        'liability', 'credit');
        $this->seedAccount('2100', 'Sales Tax Payable',       'liability', 'credit');
        $this->seedAccount('2300', 'Input Tax Recoverable',   'asset',     'debit');
        $this->seedAccount('4000', 'Sales Revenue',           'income',    'credit');
        $this->seedAccount('5000', 'Cost of Goods Sold',      'expense',   'debit');
        $this->seedAccount('6000', 'Operating Expenses',      'expense',   'debit');
        $this->seedAccount('7000', 'Opening Balance Equity',  'equity',    'credit');
        $this->seedAccount('3000', "Owner's Capital",         'equity',    'credit');

        $this->warehouseId = $this->seedWarehouse();

        // A base-unit-PCS product so SaleService/UomService never needs a
        // product_uom_conversions row (base_unit === sale_uom short-circuits).
        $this->productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id'         => $this->productId,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Test Widget',
            'sku'        => 'WIDGET-' . Str::random(6),
            'price'      => 100.00,
            'cost_price' => 60.00,
            'base_unit'  => 'PCS',
            'stock_quantity' => 0,
            'created_at' => now(),
            'updated_at' => now(),
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
    // ALREADY COVERED — documented here for traceability only
    // These pass in their dedicated test files.
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-001 FIFO deduction from oldest batch — FifoServiceTest */
    public function s001_fifo_deducts_oldest_batch_first(): void
    {
        $this->assertTrue(true); // Covered: FifoServiceTest::it_deducts_from_oldest_batch_first
    }

    /** @test S-004 Zero-cost item warning — FifoServiceTest */
    public function s004_zero_cost_item_warning(): void
    {
        $this->assertTrue(true); // Covered: FifoServiceTest::it_creates_a_new_batch_on_receive
    }

    /** @test S-012 UOM conversion on sale — TaxAndUomServiceTest */
    public function s012_uom_conversion_on_sale(): void
    {
        $this->assertTrue(true); // Covered: TaxAndUomServiceTest::it_converts_grams_to_kg_correctly
    }

    /** @test S-015 Partial production reversal — ManufacturingServiceTest */
    public function s015_partial_production_reversal_blocks_sold_units(): void
    {
        $this->assertTrue(true); // Covered: ManufacturingServiceTest::partial_reverse_throws_when_attempting_to_reverse_sold_units
    }

    /** @test S-022 Round-off tolerance auto-closes invoice — PaymentServiceTest */
    public function s022_roundoff_tolerance_auto_closes_invoice(): void
    {
        $this->assertTrue(true); // Covered: PaymentServiceTest::it_auto_closes_invoice_within_roundoff_tolerance
    }

    /** @test S-048 Tax on advance posted at delivery not receipt — TaxAndUomServiceTest */
    public function s048_tax_on_advance_posted_at_delivery_not_receipt(): void
    {
        $this->assertTrue(true); // Covered: TaxAndUomServiceTest::advance_receipt_produces_zero_tax
    }

    /** @test S-055 Zero-cost opening stock is blocked — FifoServiceTest */
    public function s055_zero_cost_opening_stock_blocked(): void
    {
        $this->assertTrue(true); // Covered: Phase 2 gate test (B19 migration constraint)
    }

    /** @test S-068 Over-allocation blocked at app and DB layer — PaymentServiceTest */
    public function s068_over_allocation_blocked(): void
    {
        $this->assertTrue(true); // Covered: PaymentServiceTest::it_blocks_over_allocation_at_app_layer
    }

    /** @test S-074 WIP balance correct during production — ManufacturingServiceTest */
    public function s074_wip_balance_correct_during_production(): void
    {
        $this->assertTrue(true); // Covered: ManufacturingServiceTest::start_production_run_posts_wip_journal_entry
    }

    /** @test S-080 B27 final settlement composite entry — SettlementAndReportServiceTest */
    public function s080_b27_final_settlement_composite_entry(): void
    {
        $this->assertTrue(true); // Covered: SettlementAndReportServiceTest::b27_posts_correct_composite_journal_entry
    }

    /** @test S-094 By-product NRV reduces main product cost — ManufacturingServiceTest */
    public function s094_byproduct_nrv_reduces_main_cost(): void
    {
        $this->assertTrue(true); // Covered: ManufacturingServiceTest::by_product_nrv_reduces_main_product_cost_on_completion
    }

    /** @test S-108 B30 disassembly allocates cost correctly — ManufacturingServiceTest */
    public function s108_b30_disassembly_allocates_cost_correctly(): void
    {
        $this->assertTrue(true); // Covered: ManufacturingServiceTest::disassemble_posts_b30_and_creates_component_batches
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2 STUBS — Inventory & Purchasing
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-003 Cash purchase creates inventory batch at correct unit cost */
    public function s003_cash_purchase_creates_batch_at_correct_cost(): void
    {
        $purchase = $this->purchases->store([
            'supplier_id'      => $this->supplierId,
            'warehouse_id'     => $this->warehouseId,
            'purchase_date'    => now()->toDateString(),
            'payment_method'   => 'cash',
            'items' => [
                [
                    'product_id' => $this->productId,
                    'qty'        => 10,
                    'unit_cost'  => 45.50,
                    'tax_rate'   => 0,
                ],
            ],
        ]);

        // Real inventory_batches row created at the EXACT unit cost from the purchase line
        $this->assertDatabaseHas('inventory_batches', [
            'product_id'    => $this->productId,
            'warehouse_id'  => $this->warehouseId,
            'batch_type'    => 'purchase',
            'purchase_invoice_id' => $purchase->id,
            'unit_cost'     => 45.50,
            'original_qty'  => 10,
            'remaining_qty' => 10,
        ]);

        // Journal: DR 1100 Inventory 455.00 / CR 1000 Cash 455.00 (B3 — cash leaves immediately)
        $this->assertDatabaseHas('journal_entries', [
            'reference_type' => 'purchase',
            'reference'      => $purchase->id,
        ]);

        $journalEntryId = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'purchase')
            ->where('reference', $purchase->id)
            ->value('id');

        $inventoryAccountId = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1100')->value('id');
        $cashAccountId      = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->value('id');

        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $journalEntryId,
            'account_id'       => $inventoryAccountId,
            'debit'            => 455.00,
            'credit'           => 0,
        ]);
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $journalEntryId,
            'account_id'       => $cashAccountId,
            'debit'            => 0,
            'credit'           => 455.00,
        ]);

        $this->assertDatabaseHas('purchases', [
            'id'             => $purchase->id,
            'total'          => 455.00,
            'payment_status' => 'paid',
        ]);
    }

    /** @test S-006 Multi-warehouse FIFO — deduction is per warehouse only */
    public function s006_fifo_is_per_warehouse(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.4 — Warehouse CRUD + FifoService warehouse filter');
    }

    /** @test S-007 Stock adjustment decrease uses FIFO oldest-first (B10) */
    public function s007_stock_adjustment_decrease_fifo(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.13 — B10 Stock Adjustment Decrease');
    }

    /** @test S-010 Credit purchase creates AP and inventory batch */
    public function s010_credit_purchase_creates_ap_and_batch(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.6 — B6 Credit Purchase');
    }

    /** @test S-050 Partial input tax recovery splits 2300 and 6000 */
    public function s050_partial_input_tax_recovery(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.7 — Purchase with partial ITC');
    }

    /** @test S-053 Opening balance entry (B19) posts correctly */
    public function s053_opening_balance_b19_posts_correctly(): void
    {
        // Real runtime mechanism: App\Http\Controllers\V3\OpeningBalanceController::store()
        // (routed at POST /s/{store_slug}/v3/opening-balances). Bind a TenantUser so the
        // 'tenant' middleware resolves the store, exactly like SmokeTest::dashboard_endpoint_returns_200().
        TenantUser::create([
            'tenant_id'    => $this->tenant->id,
            'user_id'      => $this->user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => $this->user->name,
            'joined_at'    => now(),
        ]);

        $response = $this->actingAs($this->user)->post(
            "/s/{$this->tenant->slug}/v3/opening-balances",
            [
                'entry_date' => now()->toDateString(),
                'entries' => [
                    ['account_code' => '1000', 'amount' => 5000.00, 'side' => 'debit'],
                    ['account_code' => '1200', 'amount' => 5000.00, 'side' => 'debit', 'party_id' => $this->customerId],
                    ['account_code' => '2000', 'amount' => 10000.00, 'side' => 'credit', 'party_id' => $this->supplierId],
                ],
            ]
        );

        $response->assertSessionHasNoErrors();

        // The real account line for 1000 was posted DR 5000
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenantId,
            'reference_type' => 'opening_balance',
            'reference'      => '1000',
        ]);

        $cashAccountId = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->value('id');
        $this->assertDatabaseHas('journal_items', [
            'tenant_id'  => $this->tenantId,
            'account_id' => $cashAccountId,
            'debit'      => 5000.00,
            'credit'     => 0,
        ]);

        // The controller auto-posts the mirror leg to 7000 for every entry — never
        // supplied by the caller (blocked by StoreOpeningBalanceRequest::withValidator()).
        $equityAccountId = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '7000')->value('id');
        $this->assertDatabaseHas('journal_items', [
            'tenant_id'  => $this->tenantId,
            'account_id' => $equityAccountId,
            'debit'      => 0,
            'credit'     => 5000.00,
        ]);
    }

    /** @test S-054 Account 7000 nets to zero after all B19 entries */
    public function s054_account_7000_nets_to_zero(): void
    {
        TenantUser::create([
            'tenant_id'    => $this->tenant->id,
            'user_id'      => $this->user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => $this->user->name,
            'joined_at'    => now(),
        ]);

        // Post several opening balances on different sides/accounts. 7000 is the
        // per-line mirror on every single entry (OpeningBalanceController::store()),
        // so it nets to zero only once the full opening trial balance is supplied —
        // i.e. once the asset/liability lines are matched by an equity line. That
        // is standard double-entry practice for an "Opening Balance Equity" suspense
        // account (see the controller's own success/warning copy: "Post remaining
        // entries to bring it to zero"): it is a plug account, not something that
        // self-cancels from asset/liability postings alone.
        //
        // The four asset/liability lines below plus the 20 @ Rs.60 opening stock
        // line net to Rs.13,200.50 of un-plugged equity (Assets 21,900.75 −
        // Liabilities 8,700.25). A real opening trial balance would include that as
        // an Owner's Capital line — add it explicitly so this test exercises the
        // full, correctly-balanced scenario B19 describes instead of a deliberately
        // incomplete one.
        $response = $this->actingAs($this->user)->post(
            "/s/{$this->tenant->slug}/v3/opening-balances",
            [
                'entry_date' => now()->toDateString(),
                'entries' => [
                    ['account_code' => '1000', 'amount' => 5000.00, 'side' => 'debit'],
                    ['account_code' => '1010', 'amount' => 12500.75, 'side' => 'debit'],
                    ['account_code' => '1200', 'amount' => 3200.00, 'side' => 'debit', 'party_id' => $this->customerId],
                    ['account_code' => '2000', 'amount' => 8700.25, 'side' => 'credit', 'party_id' => $this->supplierId],
                    ['account_code' => '3000', 'amount' => 13200.50, 'side' => 'credit'],
                ],
                'stock_entries' => [
                    [
                        'product_id'   => $this->productId,
                        'warehouse_id' => $this->warehouseId,
                        'qty'          => 20,
                        'unit_cost'    => 60.00,
                    ],
                ],
            ]
        );

        $response->assertSessionHasNoErrors();

        $balance7000 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('a.tenant_id', $this->tenantId)
            ->where('a.code', '7000')
            ->where('je.is_reversed', 0)
            ->selectRaw('SUM(ji.credit) - SUM(ji.debit) as balance')
            ->value('balance') ?? 0;

        $this->assertEqualsWithDelta(0.00, $balance7000, 0.01,
            "Account 7000 must net to zero after B19 opening entries — found {$balance7000}."
        );

        // Sanity: 7000 actually has activity (it isn't trivially zero because nothing posted)
        $entryCount = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'opening_balance')
            ->count();
        $this->assertGreaterThanOrEqual(6, $entryCount);
    }

    /** @test S-059 Purchase return (B18) reverses inventory and AP correctly */
    public function s059_purchase_return_b18_correct(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.9 — B18 Purchase Return');
    }

    /** @test S-101 Stock transfer between warehouses (B12) — no journal */
    public function s101_stock_transfer_no_journal(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.14 — B12 Stock Transfer');
    }

    /** @test S-102 Stock write-off (B10) posts to 6300 at FIFO cost */
    public function s102_stock_writeoff_posts_to_6300(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.13 — B10 Stock Write-off');
    }

    /** @test S-105 Stock adjustment gain (B11) posts to 4200 */
    public function s105_stock_adjustment_gain_posts_to_4200(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.13 — B11 Stock Adjustment Gain');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3 STUBS — Sales, POS & Customer Management
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-002 Sale return restores stock to exact original batch */
    public function s002_sale_return_restores_to_exact_batch(): void
    {
        // Two distinct batches at two distinct costs, so we can prove the return
        // restores EXACTLY the batch(es) it was deducted from — not just any batch.
        $batchOldId = (string) Str::uuid();
        DB::table('inventory_batches')->insert([
            'id' => $batchOldId, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 5, 'initial_qty' => 5,
            'remaining_qty' => 5, 'unit_cost' => 40.00,
            'created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2),
        ]);

        $batchNewId = (string) Str::uuid();
        DB::table('inventory_batches')->insert([
            'id' => $batchNewId, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 20, 'initial_qty' => 20,
            'remaining_qty' => 20, 'unit_cost' => 70.00,
            'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);

        // Sell 5 units — FIFO takes the entire old batch (5 @ 40) and nothing else.
        $sale = $this->sales->post([
            'customer_id'      => $this->customerId,
            'warehouse_id'     => $this->warehouseId,
            'sale_date'        => now()->toDateString(),
            'payment_method'   => 'cash',
            'amount_received'  => 200.00, // 5 * 40 = 200 net (below cost check bypassed since equal, no approval needed)
            'items' => [
                ['product_id' => $this->productId, 'qty' => 5, 'sale_uom' => 'PCS', 'unit_price' => 40.00],
            ],
        ]);

        // Confirm FIFO deducted only from the old batch, leaving the new batch untouched
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchOldId, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchNewId, 'remaining_qty' => 20]);

        $saleItemId = DB::table('sale_items')->where('tenant_id', $this->tenantId)->where('sale_id', $sale->id)->value('id');
        $this->assertDatabaseHas('sale_item_batches', [
            'sale_item_id'       => $saleItemId,
            'inventory_batch_id' => $batchOldId,
            'qty_deducted'       => 5,
            'unit_cost'          => 40.00,
        ]);

        // Now fully reverse the sale (B9 full return path in SaleService::reverse())
        $this->sales->reverse($sale->id, 'Customer changed mind');

        // The EXACT original batch (old, cost 40) must be restored — not the new one.
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchOldId, 'remaining_qty' => 5]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchNewId, 'remaining_qty' => 20]);

        // sale_item_batches row is marked reversed (FifoService::restoreStock)
        $this->assertDatabaseHas('sale_item_batches', [
            'sale_item_id'       => $saleItemId,
            'inventory_batch_id' => $batchOldId,
            'is_reversed'        => 1,
        ]);

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);

        // The original sale journal entry must be reversed
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenantId,
            'reference_type' => 'sale',
            'reference'      => $sale->id,
            'is_reversed'    => 1,
        ]);
    }

    /** @test S-005 Cash sale (B1) posts correct journal — no AR touched */
    public function s005_cash_sale_b1_no_ar(): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 10, 'initial_qty' => 10,
            'remaining_qty' => 10, 'unit_cost' => 60.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $sale = $this->sales->post([
            'customer_id'      => $this->customerId,
            'warehouse_id'     => $this->warehouseId,
            'sale_date'        => now()->toDateString(),
            'payment_method'   => 'cash',
            'amount_received'  => 300.00, // 3 * 100 net sales
            'items' => [
                ['product_id' => $this->productId, 'qty' => 3, 'sale_uom' => 'PCS', 'unit_price' => 100.00],
            ],
        ]);

        $journalEntryId = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale')
            ->where('reference', $sale->id)
            ->value('id');
        $this->assertNotNull($journalEntryId);

        $revenueId  = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '4000')->value('id');
        $cogsId     = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '5000')->value('id');
        $inventoryId= DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1100')->value('id');
        $cashId     = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->value('id');
        $arId       = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1200')->value('id');

        // DR 5000 COGS 180 (3 * 60) / CR 1100 Inventory 180
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $journalEntryId, 'account_id' => $cogsId, 'debit' => 180.00, 'credit' => 0]);
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $journalEntryId, 'account_id' => $inventoryId, 'debit' => 0, 'credit' => 180.00]);

        // CR 4000 Revenue 300 / DR 1000 Cash 300
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $journalEntryId, 'account_id' => $revenueId, 'debit' => 0, 'credit' => 300.00]);
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $journalEntryId, 'account_id' => $cashId, 'debit' => 300.00, 'credit' => 0]);

        // No AR (1200) line touched at all for this journal entry — B1 is pure cash
        $arLineCount = DB::table('journal_items')
            ->where('journal_entry_id', $journalEntryId)
            ->where('account_id', $arId)
            ->count();
        $this->assertEquals(0, $arLineCount, 'Cash sale (B1) must never touch Accounts Receivable (1200).');

        $this->assertDatabaseHas('sales', [
            'id'             => $sale->id,
            'payment_status' => 'paid',
            'payment_method' => 'cash',
        ]);
    }

    /** @test S-009 Credit sale (B2) creates AR entry */
    public function s009_credit_sale_b2_creates_ar(): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 10, 'initial_qty' => 10,
            'remaining_qty' => 10, 'unit_cost' => 60.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $sale = $this->sales->post([
            'customer_id'      => $this->customerId,
            'warehouse_id'     => $this->warehouseId,
            'sale_date'        => now()->toDateString(),
            'payment_method'   => 'credit',
            'items' => [
                ['product_id' => $this->productId, 'qty' => 4, 'sale_uom' => 'PCS', 'unit_price' => 100.00],
            ],
        ]);

        $journalEntryId = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale')
            ->where('reference', $sale->id)
            ->value('id');

        $arId    = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1200')->value('id');
        $cashId  = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->value('id');

        // B2 — full invoice total (400) posted as AR debit against the customer party
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $journalEntryId,
            'account_id'       => $arId,
            'party_id'         => $this->customerId,
            'debit'            => 400.00,
            'credit'           => 0,
        ]);

        // No cash touched on a pure credit sale
        $cashLineCount = DB::table('journal_items')
            ->where('journal_entry_id', $journalEntryId)
            ->where('account_id', $cashId)
            ->count();
        $this->assertEquals(0, $cashLineCount, 'Credit sale (B2) must not touch Cash (1000).');

        $this->assertDatabaseHas('sales', [
            'id'             => $sale->id,
            'payment_status' => 'unpaid',
            'payment_method' => 'credit',
            'invoice_total'  => 400.00,
        ]);
    }

    /** @test S-011 Below-cost sale requires manager PIN */
    public function s011_below_cost_sale_requires_manager_pin(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.5 — Below-cost PIN enforcement');
    }

    /** @test S-017 Customer payment (B4) allocates to correct invoice */
    public function s017_customer_payment_b4_allocates_correctly(): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 20, 'initial_qty' => 20,
            'remaining_qty' => 20, 'unit_cost' => 60.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Two separate credit-sale invoices for the SAME customer — the payment
        // must land against the invoice we explicitly target, not the other one.
        $saleA = $this->sales->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 2, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ]);
        $saleB = $this->sales->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 3, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ]);

        // B4 — customer pays off invoice B (300) in cash only
        $paymentJournalEntryId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $saleB->id,
            'description'    => 'B4 customer payment',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1000', 'debit' => 300.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0,      'credit' => 300.00, 'party_id' => $this->customerId],
        ])->id;

        $this->payments->allocate($paymentJournalEntryId, [
            ['sale_id' => $saleB->id, 'amount' => 300.00],
        ]);

        $this->assertDatabaseHas('payment_allocations', [
            'payment_journal_entry_id' => $paymentJournalEntryId,
            'sale_id'                  => $saleB->id,
            'allocated_amount'         => 300.00,
            'status'                   => 'active',
        ]);

        // Invoice B is now paid; invoice A is untouched (still unpaid)
        $this->assertDatabaseHas('sales', ['id' => $saleB->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('sales', ['id' => $saleA->id, 'payment_status' => 'unpaid']);

        // No allocation row exists against invoice A
        $this->assertEquals(0, DB::table('payment_allocations')
            ->where('sale_id', $saleA->id)->count());
    }

    /** @test S-018 Partial payment sets badge to partial */
    public function s018_partial_payment_sets_badge_to_partial(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.10 — B4 partial payment badge');
    }

    /** @test S-020 Bounced cheque (B25) reverts invoice to unpaid */
    public function s020_bounced_cheque_b25_reverts_invoice(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.11 — B25 Bounced Cheque');
    }

    /** @test S-021 Bad debt write-off (B26) requires manager approval */
    public function s021_bad_debt_writeoff_b26_requires_approval(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.12 — B26 Bad Debt');
    }

    /** @test S-023 Customer advance (B20) posts to 2100 with zero tax */
    public function s023_customer_advance_b20_zero_tax(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.13 — B20 Customer Advance');
    }

    /** @test S-024 Sale return after partial payment recalculates badge */
    public function s024_sale_return_after_partial_payment(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.9 + 3.10 — Return after payment');
    }

    /** @test S-028 Customer overpayment blocked */
    public function s028_customer_overpayment_blocked(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.10 — Over-allocation on B4');
    }

    /** @test S-029 Split payment across cash and bank */
    public function s029_split_payment_cash_and_bank(): void
    {
        // PaymentService::allocate() allocates ONE payment journal entry against
        // one or more invoices — it has no API for splitting a single payment call
        // across two GL accounts (1000 + 1010) in one shot. SaleService::post()
        // likewise only supports a single cash/bank account code per sale (see
        // SaleService.php line ~248: $cashAccount = payment_method === 'bank' ? '1010' : '1000').
        // The REAL supported mechanism for a split cash+bank settlement is to post
        // TWO separate payment journal entries (one per GL account) and call
        // PaymentService::allocate() against each — exactly as PaymentServiceTest's
        // "fully paid in two allocations" test already does for two cash payments.
        // This test proves the same capability works across two DIFFERENT accounts.
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 20, 'initial_qty' => 20,
            'remaining_qty' => 20, 'unit_cost' => 60.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Credit sale invoice of 1000 (10 units @ 100)
        $sale = $this->sales->post([
            'customer_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'sale_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'invoice_total' => 1000.00, 'payment_status' => 'unpaid']);

        // Leg 1 — Rs.400 paid in CASH (1000)
        $cashLegId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $sale->id,
            'description'    => 'Split payment — cash leg',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1000', 'debit' => 400.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0,      'credit' => 400.00, 'party_id' => $this->customerId],
        ])->id;
        $this->payments->allocate($cashLegId, [
            ['sale_id' => $sale->id, 'amount' => 400.00],
        ]);

        // Leg 2 — Rs.600 paid via BANK (1010)
        $bankLegId = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'payment',
            'reference_id'   => $sale->id,
            'description'    => 'Split payment — bank leg',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1010', 'debit' => 600.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0,      'credit' => 600.00, 'party_id' => $this->customerId],
        ])->id;
        $this->payments->allocate($bankLegId, [
            ['sale_id' => $sale->id, 'amount' => 600.00],
        ]);

        // Both allocation rows exist, against two DIFFERENT payment journal entries
        $this->assertDatabaseHas('payment_allocations', [
            'payment_journal_entry_id' => $cashLegId, 'sale_id' => $sale->id, 'allocated_amount' => 400.00, 'status' => 'active',
        ]);
        $this->assertDatabaseHas('payment_allocations', [
            'payment_journal_entry_id' => $bankLegId, 'sale_id' => $sale->id, 'allocated_amount' => 600.00, 'status' => 'active',
        ]);

        // Total allocated (400 + 600) fully covers the 1000 invoice
        $totalAllocated = (float) DB::table('payment_allocations')
            ->where('tenant_id', $this->tenantId)
            ->where('sale_id', $sale->id)
            ->where('status', 'active')
            ->sum('allocated_amount');
        $this->assertEqualsWithDelta(1000.00, $totalAllocated, 0.01);

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'paid']);

        // Confirm the cash leg actually posted to 1000 and the bank leg to 1010 —
        // proving they are genuinely different GL accounts, not the same one twice.
        $cashAccountId = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->value('id');
        $bankAccountId = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1010')->value('id');
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $cashLegId, 'account_id' => $cashAccountId, 'debit' => 400.00]);
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $bankLegId, 'account_id' => $bankAccountId, 'debit' => 600.00]);
    }

    /** @test S-033 Credit sale fully returned — AR nets to zero */
    public function s033_credit_sale_fully_returned_ar_nets_zero(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.9 — Full sale return');
    }

    /** @test S-039 POS tiered pricing — correct blended unit price (S-042) */
    public function s039_tiered_pricing_blended_unit_price(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.7 — S-042 Tiered Pricing');
    }

    /** @test S-040 Promotional free item — Rs.0 line with COGS */
    public function s040_promotional_free_item_zero_price_with_cogs(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.6 — S-040 Promotional Items');
    }

    /** @test S-044 Discount above role limit blocked without manager PIN */
    public function s044_discount_above_limit_blocked(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.4 — S-044 Discount Limits');
    }

    /** @test S-045 Sales order price locked at creation */
    public function s045_sales_order_price_locked(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.15 — S-045 Sales Order price lock');
    }

    /** @test S-046 Invoice PDF generates correctly */
    public function s046_invoice_pdf_generates(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.19 — Invoice PDF');
    }

    /** @test S-049 Cash sale FIFO spans three batches — correct COGS */
    public function s049_cash_sale_fifo_spans_three_batches(): void
    {
        // Three batches, oldest → newest, each at a different unit cost.
        $batch1Id = (string) Str::uuid(); // oldest — fully consumed
        DB::table('inventory_batches')->insert([
            'id' => $batch1Id, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 5, 'initial_qty' => 5,
            'remaining_qty' => 5, 'unit_cost' => 50.00,
            'created_at' => now()->subDays(3), 'updated_at' => now()->subDays(3),
        ]);

        $batch2Id = (string) Str::uuid(); // middle — fully consumed
        DB::table('inventory_batches')->insert([
            'id' => $batch2Id, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 5, 'initial_qty' => 5,
            'remaining_qty' => 5, 'unit_cost' => 55.00,
            'created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2),
        ]);

        $batch3Id = (string) Str::uuid(); // newest — partially consumed
        DB::table('inventory_batches')->insert([
            'id' => $batch3Id, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 10, 'initial_qty' => 10,
            'remaining_qty' => 10, 'unit_cost' => 60.00,
            'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);

        // Sell 12 units: 5 from batch1 + 5 from batch2 + 2 from batch3
        // Expected COGS = 5*50 + 5*55 + 2*60 = 250 + 275 + 120 = 645
        $expectedCogs = 645.00;

        $sale = $this->sales->post([
            'customer_id'      => $this->customerId,
            'warehouse_id'     => $this->warehouseId,
            'sale_date'        => now()->toDateString(),
            'payment_method'   => 'cash',
            'amount_received'  => 1500.00, // 12 * 125 sale price — comfortably above cost
            'items' => [
                ['product_id' => $this->productId, 'qty' => 12, 'sale_uom' => 'PCS', 'unit_price' => 125.00],
            ],
        ]);

        // Batches decremented in exact FIFO order
        $this->assertDatabaseHas('inventory_batches', ['id' => $batch1Id, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batch2Id, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batch3Id, 'remaining_qty' => 8]);

        $saleItemId = DB::table('sale_items')->where('tenant_id', $this->tenantId)->where('sale_id', $sale->id)->value('id');

        // Exactly THREE sale_item_batches rows — one per batch touched
        $sibRows = DB::table('sale_item_batches')->where('sale_item_id', $saleItemId)->orderBy('unit_cost')->get();
        $this->assertCount(3, $sibRows);

        $this->assertDatabaseHas('sale_item_batches', ['sale_item_id' => $saleItemId, 'inventory_batch_id' => $batch1Id, 'qty_deducted' => 5, 'unit_cost' => 50.00, 'total_cogs' => 250.00]);
        $this->assertDatabaseHas('sale_item_batches', ['sale_item_id' => $saleItemId, 'inventory_batch_id' => $batch2Id, 'qty_deducted' => 5, 'unit_cost' => 55.00, 'total_cogs' => 275.00]);
        $this->assertDatabaseHas('sale_item_batches', ['sale_item_id' => $saleItemId, 'inventory_batch_id' => $batch3Id, 'qty_deducted' => 2, 'unit_cost' => 60.00, 'total_cogs' => 120.00]);

        // Sum of sale_item_batches.total_cogs equals the weighted FIFO sum
        $sumTotalCogs = (float) DB::table('sale_item_batches')->where('sale_item_id', $saleItemId)->sum('total_cogs');
        $this->assertEqualsWithDelta($expectedCogs, $sumTotalCogs, 0.01);

        // The journal's 5000 COGS debit / 1100 credit equal the exact weighted sum — not an average or a guess
        $journalEntryId = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'sale')
            ->where('reference', $sale->id)
            ->value('id');

        $cogsAccountId      = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '5000')->value('id');
        $inventoryAccountId = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1100')->value('id');

        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $journalEntryId, 'account_id' => $cogsAccountId, 'debit' => $expectedCogs, 'credit' => 0]);
        $this->assertDatabaseHas('journal_items', ['journal_entry_id' => $journalEntryId, 'account_id' => $inventoryAccountId, 'debit' => 0, 'credit' => $expectedCogs]);
    }

    /** @test S-062 Bank transfer (B16) — correct debit and credit accounts */
    public function s062_bank_transfer_b16_correct_accounts(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.18 — B16 Bank Transfer');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 4 STUBS — Manufacturing, HR & Special Transactions
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-013 Production run deducts BOM materials at FIFO cost */
    public function s013_production_deducts_bom_materials_fifo(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.3 — Production Run Start (already partially covered in ManufacturingServiceTest)');
    }

    /** @test S-014 Sub-assembly BOM resolves 5 levels deep */
    public function s014_sub_assembly_bom_five_levels(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.1 — BOM Builder depth limit');
    }

    /** @test S-025 Supplier payment (B5) allocates to purchase invoice */
    public function s025_supplier_payment_b5_allocates(): void
    {
        $this->markTestIncomplete('[STUB] Phase 2, Task 2.10 — B5 Supplier Payment');
    }

    /** @test S-073 Future-dated transaction blocked beyond 30 days */
    public function s073_future_dated_transaction_blocked(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4 / Phase 6 — DatePicker + controller validation');
    }

    /** @test S-078 Salary payment (B8) with advance deduction */
    public function s078_salary_payment_with_advance_deduction(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.8 — B8 Salary Payment');
    }

    /** @test S-082 Salary accrual (B7) posts to 6100 and 2400 */
    public function s082_salary_accrual_b7_posts_correctly(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.8 — B7 Salary Accrual');
    }

    /** @test S-083 Operating expense (B13) posts to 6000 */
    public function s083_operating_expense_b13_posts_correctly(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.16 — B13 Operating Expense');
    }

    /** @test S-090 Bad debt write-off (B26) — 6700 DR / 1200 CR */
    public function s090_bad_debt_writeoff_correct_accounts(): void
    {
        $this->markTestIncomplete('[STUB] Phase 3, Task 3.12 — B26 (account-level verification)');
    }

    /** @test S-095 Production run with external labor (B17 Path A) */
    public function s095_production_external_labor_path_a(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.3 — B17 external labor');
    }

    /** @test S-096 Production run with salaried labor (B17 Path B) */
    public function s096_production_salaried_labor_path_b(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.3 — B17 internal labor (no cash outflow)');
    }

    /** @test S-097 Production run completes with correct per-unit cost */
    public function s097_production_run_correct_unit_cost(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.4 — B16 completion unit cost');
    }

    /** @test S-098 WIP balance clears to zero on production completion */
    public function s098_wip_balance_clears_on_completion(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.4 — WIP = 0 after B32 close');
    }

    /** @test S-104 Cash shortage (B28) blocked for non-manager */
    public function s104_cash_shortage_b28_blocked_for_non_manager(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.10 — B28 role check');
    }

    /** @test S-104b Cash shortage (B28) requires mandatory narration */
    public function s104b_cash_shortage_b28_requires_narration(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.10 — B28 narration required');
    }

    /** @test S-107 Insurance claim (B29) two steps linked by disaster_claim_id */
    public function s107_insurance_claim_b29_two_steps_linked(): void
    {
        $this->markTestIncomplete('[STUB] Phase 4, Task 4.11 — B29 Insurance Claim');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 5 STUBS — Reports & Dashboard
    // ═══════════════════════════════════════════════════════════════════

    /** @test Trial Balance — account 1100 equals batch valuation */
    public function s_report_1100_equals_batch_valuation(): void
    {
        $this->markTestIncomplete('[STUB] Phase 5, Task 5.1 + 5.9 — 1100 vs inventory valuation reconciliation');
    }

    /** @test Trial Balance — account 5000 equals sale_item_batches total */
    public function s_report_5000_equals_sale_item_batches(): void
    {
        $this->markTestIncomplete('[STUB] Phase 5, Task 5.1 + 5.10 — 5000 vs COGS report reconciliation');
    }

    /** @test Aged receivables total equals account 1200 balance */
    public function s_report_aged_ar_equals_1200_balance(): void
    {
        $this->markTestIncomplete('[STUB] Phase 5, Task 5.5 — AR aging reconciliation');
    }

    /** @test Dashboard cash widget reads from AccountingService only */
    public function s_report_dashboard_cash_from_accounting_service(): void
    {
        $this->markTestIncomplete('[STUB] Phase 5, Task 5.12 — Dashboard widget source verification');
    }

    /** @test Account 7000 nets to zero after fiscal year close */
    public function s_report_7000_nets_zero_after_fiscal_close(): void
    {
        $this->markTestIncomplete('[STUB] Phase 6, Task 6.8 — Fiscal Year Close');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 6 STUBS — Security & Deployment
    // ═══════════════════════════════════════════════════════════════════

    /** @test ConnectionGuard blocks financial writes when offline */
    public function s_connection_guard_blocks_offline_writes(): void
    {
        $this->markTestIncomplete('[STUB] Phase 6, Task 6.3 — ConnectionGuard middleware');
    }

    /** @test Audit log records user, IP, and approved_by on every entry */
    public function s_audit_log_records_full_context(): void
    {
        $this->markTestIncomplete('[STUB] Phase 6, Task 6.9 — Audit logging');
    }

    // ─── Helpers (house style — mirrors PaymentServiceTest.php) ───────────

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

    private function seedWarehouse(): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insertOrIgnore([
            'id'         => $id,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Default Warehouse',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }
}
