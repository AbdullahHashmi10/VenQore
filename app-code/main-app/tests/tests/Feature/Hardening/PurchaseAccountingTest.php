<?php

namespace Tests\Feature\Hardening;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\V3\PurchaseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Purchasing / payables hardening.
 *
 * Same house style as V3/Scenarios/Phase2InventoryScenariosTest: RefreshDatabase,
 * manual tenant / chart / warehouse / party seeding, the REAL production path
 * (V3 engines or the HTTP route the UI posts to), exact amounts, every journal
 * entry balanced, 1100 == Σ remaining_qty × unit_cost and 2000-per-supplier ==
 * the supplier's balance.
 */
class PurchaseAccountingTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User   $user;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $productB;
    private string $supplierId;

    private PurchaseService $purchases;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->tenantId = $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);

        $this->user = User::factory()->create(['last_store_id' => $this->tenant->id]);
        TenantUser::create([
            'tenant_id' => $this->tenant->id, 'user_id' => $this->user->id,
            'role' => 'owner', 'status' => 'active',
            'display_name' => $this->user->name, 'joined_at' => now(),
        ]);
        $this->actingAs($this->user);

        $this->purchases = app(PurchaseService::class);

        $this->seedAccount('1000', 'Cash in Hand',          'asset',     'debit');
        $this->seedAccount('1010', 'Bank Account',          'asset',     'debit');
        $this->seedAccount('1100', 'Inventory Asset',       'asset',     'debit');
        $this->seedAccount('1200', 'Accounts Receivable',   'asset',     'debit');
        $this->seedAccount('1300', 'Prepaid Expenses',      'asset',     'debit');
        $this->seedAccount('2000', 'Accounts Payable',      'liability', 'credit');
        $this->seedAccount('2100', 'Sales Tax Payable',     'liability', 'credit');
        $this->seedAccount('2300', 'Input Tax Recoverable', 'asset',     'debit');
        $this->seedAccount('3000', "Owner's Capital",       'equity',    'credit');
        $this->seedAccount('5000', 'Cost of Goods Sold',    'expense',   'debit');
        $this->seedAccount('6000', 'Operating Expenses',    'expense',   'debit');

        $this->warehouseId = (string) Str::uuid();
        DB::table('warehouses')->insert([
            'id' => $this->warehouseId, 'tenant_id' => $this->tenantId,
            'name' => 'Default Warehouse', 'is_default' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->productId = $this->seedProduct('Test Widget');
        $this->productB  = $this->seedProduct('Other Widget');

        $this->supplierId = $this->seedParty('Test Supplier', 'supplier');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1 — Payments/Out auto-allocation counts counter payments and returns
    // ═══════════════════════════════════════════════════════════════════

    public function test_payments_screen_auto_allocation_only_allocates_what_is_still_owed(): void
    {
        // A: 1000 billed, 400 paid at the counter → 600 on account.
        $a = $this->creditPurchase(10, 100.00, ['amount_paid' => 400.00], now()->subDays(3));
        // B: 1000 billed on credit, 4 units returned on a debit note → 600 on account.
        $b = $this->creditPurchase(10, 100.00, [], now()->subDays(2));
        $bItem = DB::table('purchase_items')->where('purchase_id', $b->id)->first();
        $this->purchases->createReturn($b->id, [
            'return_date' => now()->toDateString(), 'reason' => 'Damaged',
            'items' => [['purchase_item_id' => $bItem->id, 'return_qty' => 4]],
        ]);
        // C: 500 on credit, newest.
        $c = $this->creditPurchase(5, 100.00, [], now()->subDay());
        // V: the oldest bill, voided — nothing is owed on it.
        $v = $this->creditPurchase(5, 100.00, [], now()->subDays(5));
        $this->purchases->void($v->id, 'Entered twice');

        $this->assertEqualsWithDelta(1700.00, $this->supplierPayable(), 0.001);

        // 1500 through the Payments screen (Payments/Out → payments.store).
        $this->postJson(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
            'date' => now()->toDateString(), 'type' => 'out', 'party_id' => $this->supplierId,
            'amount' => 1500.00, 'payment_method' => 'cash',
        ])->assertOk()->assertJson(['success' => true]);

        // Oldest first, each only up to what is still owed on it.
        $this->assertEqualsWithDelta(0.00, $this->allocated($v->id), 0.001);
        $this->assertEqualsWithDelta(600.00, $this->allocated($a->id), 0.001);
        $this->assertEqualsWithDelta(600.00, $this->allocated($b->id), 0.001);
        $this->assertEqualsWithDelta(300.00, $this->allocated($c->id), 0.001);
        $this->assertDatabaseHas('purchases', ['id' => $a->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('purchases', ['id' => $b->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('purchases', ['id' => $c->id, 'payment_status' => 'partial']);

        // Allocations agree with the ledger: 200 still owed, all on C.
        $this->assertEqualsWithDelta(200.00, $this->supplierPayable(), 0.001);

        // A refund RECEIVED from the supplier is not a payment of their bills.
        $this->postJson(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
            'date' => now()->toDateString(), 'type' => 'in', 'party_id' => $this->supplierId,
            'amount' => 50.00, 'payment_method' => 'cash',
        ])->assertOk();
        $this->assertEqualsWithDelta(300.00, $this->allocated($c->id), 0.001);
        $this->assertDatabaseHas('purchases', ['id' => $c->id, 'payment_status' => 'partial']);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2 — Paid figure on show / edit = badge source of truth
    // ═══════════════════════════════════════════════════════════════════

    public function test_purchase_show_and_edit_paid_amount_counts_supplier_payments(): void
    {
        $p = $this->creditPurchase(10, 100.00, ['amount_paid' => 400.00]);

        $this->post("/s/{$this->tenant->slug}/v3/supplier-payments", [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 250.00,
            'allocations' => [['purchase_id' => $p->id, 'amount' => 250.00]],
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'payment_status' => 'partial']);

        $show = $this->get(route('store.purchases.show', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]));
        $show->assertOk();
        $this->assertEqualsWithDelta(650.00, (float) $this->prop($show, 'paidAmount'), 0.001);

        $edit = $this->get(route('store.purchases.edit', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]));
        $edit->assertOk();
        $this->assertEqualsWithDelta(650.00, (float) ((array) $this->prop($edit, 'purchase'))['amount_paid'], 0.001);

        // The purchase list reads the same figures.
        $row = collect($this->getJson(route('store.purchases.index', ['store_slug' => $this->tenant->slug]))
            ->assertOk()->json('data'))->firstWhere('id', $p->id);
        $this->assertEqualsWithDelta(650.00, (float) $row['paid'], 0.001);
        $this->assertEqualsWithDelta(350.00, (float) $row['balance'], 0.001);

        // The edit form sends that figure straight back. Re-saving must not
        // count the supplier payment a second time as money paid at the counter.
        $cashBefore = $this->glBalance('1000');
        $this->put(route('store.purchases.update', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]), [
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit', 'amount_paid' => 650.00,
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'tax_rate' => 0]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertEqualsWithDelta($cashBefore, $this->glBalance('1000'), 0.001, 'An edit must not pay the supplier again.');
        $this->assertEqualsWithDelta(350.00, $this->supplierPayable(), 0.001);
        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'payment_status' => 'partial']);
        $show = $this->get(route('store.purchases.show', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]));
        $this->assertEqualsWithDelta(650.00, (float) $this->prop($show, 'paidAmount'), 0.001);

        // Settled in full by a supplier payment: the form then sends the whole
        // bill as "paid". None of it was handed over at the counter.
        $this->post("/s/{$this->tenant->slug}/v3/supplier-payments", [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 350.00,
            'allocations' => [['purchase_id' => $p->id, 'amount' => 350.00]],
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'payment_status' => 'paid']);

        $cashBefore = $this->glBalance('1000');
        $this->put(route('store.purchases.update', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]), [
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit', 'amount_paid' => 1000.00,
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'tax_rate' => 0]],
        ])->assertSessionHasNoErrors();
        $this->assertEqualsWithDelta($cashBefore, $this->glBalance('1000'), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->supplierPayable(), 0.001);
        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'payment_status' => 'paid']);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3 — Return journal entries shown on the purchase
    // ═══════════════════════════════════════════════════════════════════

    public function test_purchase_show_lists_return_journal_entries_once(): void
    {
        $p = $this->creditPurchase(10, 100.00);
        $item = DB::table('purchase_items')->where('purchase_id', $p->id)->first();
        $returnId = $this->purchases->createReturn($p->id, [
            'return_date' => now()->toDateString(), 'reason' => 'Damaged',
            'items' => [['purchase_item_id' => $item->id, 'return_qty' => 2]],
        ]);
        $returnEntry = DB::table('purchase_returns')->where('id', $returnId)->value('journal_entry_id');

        $show = $this->get(route('store.purchases.show', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]));
        $show->assertOk();

        $ids = collect($this->prop($show, 'journalEntries'))->pluck('id')->map(fn ($v) => (string) $v);
        $this->assertSame(2, $ids->count(), 'Purchase entry + return entry, nothing twice.');
        $this->assertSame(1, $ids->filter(fn ($id) => $id === (string) $returnEntry)->count());
        $this->assertSame(1, $ids->filter(fn ($id) => $id === (string) $p->journal_entry_id)->count());

        $lines = collect($this->prop($show, 'journalLines'))
            ->filter(fn ($l) => (string) ((array) $l)['journal_entry_id'] === (string) $returnEntry);
        $this->assertCount(2, $lines, 'The return entry\'s lines come with it.');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4 — Return of a landed-cost batch: AP only takes back the supplier's price
    // ═══════════════════════════════════════════════════════════════════

    public function test_purchase_return_on_landed_cost_batch_debits_ap_with_supplier_price_only(): void
    {
        // 10 × 100 + 17% tax, 200 freight capitalised → batch 120/unit.
        $p = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items'  => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'tax_rate' => 17]],
            'extras' => [['amount' => 200.00, 'method' => 'value', 'description' => 'Freight']],
        ]);
        $item  = DB::table('purchase_items')->where('purchase_id', $p->id)->first();
        $batch = DB::table('inventory_batches')->where('id', $item->inventory_batch_id)->first();
        $this->assertEqualsWithDelta(120.00, (float) $batch->unit_cost, 0.0001);
        $this->assertEqualsWithDelta(1170.00, $this->supplierPayable(), 0.001);
        $this->assertEqualsWithDelta(1200.00, $this->glBalance('1100'), 0.001);
        $this->assertEqualsWithDelta(1200.00, $this->fifoValuation(), 0.001);

        $this->post("/s/{$this->tenant->slug}/v3/purchases/{$p->id}/return", [
            'return_date' => now()->toDateString(), 'reason' => 'Defective',
            'items' => [['purchase_item_id' => $item->id, 'inventory_batch_id' => $item->inventory_batch_id, 'return_qty' => 4]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $return = DB::table('purchase_returns')->where('purchase_id', $p->id)->first();
        $entry  = $return->journal_entry_id;

        // Supplier: 4 × 100 goods + 4 × 17 tax = 468 — NOT 4 × 120 + 68 = 548.
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry, 'account_id' => $this->accountId('2000'),
            'party_id' => $this->supplierId, 'debit' => 468.00, 'credit' => 0,
        ]);
        $this->assertLine($entry, '1100', 0, 480.00);      // stock leaves at batch cost
        $this->assertLine($entry, '2300', 0, 68.00);       // ITC on returned goods
        $this->assertLine($entry, '6000', 80.00, 0);       // freight on returned goods is sunk
        $this->assertSame(4, DB::table('journal_items')->where('journal_entry_id', $entry)->count());
        $this->assertEntryBalanced($entry);
        $this->assertEqualsWithDelta(468.00, (float) $return->total_amount, 0.001);

        // Supplier owes-back exactly their invoice; the freight accrual is untouched.
        $this->assertEqualsWithDelta(702.00, $this->supplierPayable(), 0.001);        // 6 × 117
        $this->assertEqualsWithDelta(-200.00, $this->unassignedPayable(), 0.001);     // freight still owed
        $this->assertEqualsWithDelta(720.00, $this->glBalance('1100'), 0.001);
        $this->assertEqualsWithDelta(720.00, $this->fifoValuation(), 0.001);          // 6 × 120

        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'payment_status' => 'unpaid']);
        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5 — Discounts reach the batch cost
    // ═══════════════════════════════════════════════════════════════════

    public function test_line_and_header_discounts_are_reflected_in_batch_unit_cost(): void
    {
        // Line A: 10 × 100 − 100 line discount = 900 → 90/unit.
        // Line B: 5 × 40 = 200.
        $p = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [
                ['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'discount_amount' => 100.00, 'tax_rate' => 0],
                ['product_id' => $this->productB,  'qty' => 5,  'unit_cost' => 40.00,  'tax_rate' => 0],
            ],
        ]);
        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'subtotal' => 1100.00, 'total' => 1100.00]);
        $this->assertLine($p->journal_entry_id, '1100', 1100.00, 0);
        $this->assertBatchCost($p->id, $this->productId, 90.00);
        $this->assertBatchCost($p->id, $this->productB, 40.00);
        $this->assertEqualsWithDelta($this->glBalance('1100'), $this->fifoValuation(null), 0.001);

        // Header discount 110 (10%) spread by net value: A 90 → 81, B 40 → 36.
        $h = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit', 'discount' => 110.00,
            'items' => [
                ['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'discount_amount' => 100.00, 'tax_rate' => 0],
                ['product_id' => $this->productB,  'qty' => 5,  'unit_cost' => 40.00,  'tax_rate' => 0],
            ],
        ]);
        $this->assertLine($h->journal_entry_id, '1100', 990.00, 0);
        $this->assertBatchCost($h->id, $this->productId, 81.00);
        $this->assertBatchCost($h->id, $this->productB, 36.00);
        $this->assertEqualsWithDelta($this->glBalance('1100'), $this->fifoValuation(null), 0.001);

        // Tax on a discounted line: goods at net 90, tax to 2300/6000, never into stock.
        $t = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00,
                         'discount_amount' => 100.00, 'tax_rate' => 10, 'business_pct' => 50]],
        ]);
        $this->assertLine($t->journal_entry_id, '1100', 900.00, 0);
        $this->assertLine($t->journal_entry_id, '2300', 45.00, 0);
        $this->assertLine($t->journal_entry_id, '6000', 45.00, 0);
        $this->assertBatchCost($t->id, $this->productId, 90.00);

        // A pending purchase received later gets the same net cost.
        $pending = $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'workflow_status' => 'pending', 'discount' => 50.00,
            'items' => [['product_id' => $this->productB, 'qty' => 10, 'unit_cost' => 60.00, 'discount_amount' => 50.00, 'tax_rate' => 0]],
        ]);
        $pi = DB::table('purchase_items')->where('purchase_id', $pending->id)->first();
        $this->purchases->receive($pending->id, [['purchase_item_id' => $pi->id, 'receiving_qty' => 10]]);
        $this->assertBatchCost($pending->id, $this->productB, 50.00);   // (600 − 50 − 50) / 10
        $this->assertEqualsWithDelta($this->glBalance('1100'), $this->fifoValuation(null), 0.001);

        // A return from the discounted batch takes back exactly what was paid.
        $item = DB::table('purchase_items')->where('purchase_id', $h->id)->where('product_id', $this->productB)->first();
        $retId = $this->purchases->createReturn($h->id, [
            'return_date' => now()->toDateString(), 'reason' => 'Wrong item',
            'items' => [['purchase_item_id' => $item->id, 'return_qty' => 5]],
        ]);
        $retEntry = DB::table('purchase_returns')->where('id', $retId)->value('journal_entry_id');
        $this->assertLine($retEntry, '1100', 0, 180.00);
        $this->assertLine($retEntry, '2000', 180.00, 0);
        $this->assertSame(2, DB::table('journal_items')->where('journal_entry_id', $retEntry)->count());
        $this->assertEqualsWithDelta($this->glBalance('1100'), $this->fifoValuation(null), 0.001);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6 — Debit note reverses input tax on 2300
    // ═══════════════════════════════════════════════════════════════════

    public function test_debit_note_reverses_input_tax_on_2300_not_1300(): void
    {
        // Purchase claims 170 input tax.
        $this->purchases->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => 10, 'unit_cost' => 100.00, 'tax_rate' => 17]],
        ]);

        // Price adjustment of 100 + 17 tax, nothing leaves the shelf.
        $this->post(route('store.debit-notes.store', ['store_slug' => $this->tenant->slug]), [
            'supplier_id' => $this->supplierId, 'date' => now()->toDateString(), 'status' => 'approved',
            'reason' => 'Overcharged', 'tax' => 17.00, 'tax_rate' => 17,
            'items' => [['product_id' => $this->productId, 'quantity' => 1, 'unit_price' => 100.00]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'debit_note')->value('id');
        $this->assertNotNull($entry);
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entry, 'account_id' => $this->accountId('2000'),
            'party_id' => $this->supplierId, 'debit' => 117.00, 'credit' => 0,
        ]);
        $this->assertLine($entry, '5000', 0, 100.00);
        $this->assertLine($entry, '2300', 0, 17.00);
        $this->assertEntryBalanced($entry);
        $this->assertEqualsWithDelta(0.00, $this->glBalance('1300'), 0.001, 'Prepaid expenses must not move.');

        // Tax summary: input tax is 170 claimed − 17 reversed = 153.
        $this->assertEqualsWithDelta(153.00, $this->glBalance('2300'), 0.001);
        $from = now()->startOfMonth()->toDateString();
        $to   = now()->endOfMonth()->toDateString();
        $summary = app(\App\Services\FinancialReportingService::class)->getTaxSummary($from, $to);
        $this->assertEqualsWithDelta(153.00, (float) $summary['input_tax'], 0.001);
        $report = app(\App\Engines\TaxService::class)->taxReport(now()->startOfMonth(), now()->endOfMonth());
        $this->assertEqualsWithDelta(153.00, $report['input_tax_recoverable'], 0.001);
        $this->assertEqualsWithDelta(-153.00, $report['net_tax_payable'], 0.001);

        $this->assertEqualsWithDelta(1053.00, $this->supplierPayable(), 0.001);
        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7 — V3 PurchaseService::createPurchase keeps business_pct
    // ═══════════════════════════════════════════════════════════════════

    public function test_create_purchase_passes_business_pct_through(): void
    {
        $p = $this->purchases->createPurchase([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'quantity' => 10, 'unit_price' => 100.00,
                         'tax_rate' => 17, 'business_pct' => 60]],
        ]);

        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $p->id, 'tax_rate' => 17, 'business_pct' => 60, 'line_total' => 1000.00,
        ]);
        $this->assertSame($this->warehouseId, $p->warehouse_id);
        $this->assertLine($p->journal_entry_id, '1100', 1000.00, 0);
        $this->assertLine($p->journal_entry_id, '2300', 102.00, 0);
        $this->assertLine($p->journal_entry_id, '6000', 68.00, 0);
        $this->assertLine($p->journal_entry_id, '2000', 0, 1170.00);
        $this->assertEntryBalanced($p->journal_entry_id);

        // Without business_pct the whole tax is still recoverable.
        $q = $this->purchases->createPurchase([
            'supplier_id' => $this->supplierId, 'purchase_date' => now()->toDateString(),
            'items' => [['product_id' => $this->productId, 'quantity' => 2, 'unit_price' => 50.00, 'tax_rate' => 17]],
        ]);
        $this->assertLine($q->journal_entry_id, '2300', 17.00, 0);
        $this->assertSame(0, DB::table('journal_items')
            ->where('journal_entry_id', $q->journal_entry_id)->where('account_id', $this->accountId('6000'))->count());
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private function creditPurchase(float $qty, float $unitCost, array $extra = [], $date = null)
    {
        return $this->purchases->store(array_merge([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => ($date ?? now())->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => $qty, 'unit_cost' => $unitCost, 'tax_rate' => 0]],
        ], $extra));
    }

    private function prop($response, string $key)
    {
        $page = $response->viewData('page');
        return $page['props'][$key] ?? null;
    }

    private function allocated(string $purchaseId): float
    {
        return round((float) DB::table('allocations')->where('tenant_id', $this->tenantId)
            ->where('purchase_id', $purchaseId)->where('status', 'active')->sum('allocated_amount'), 2);
    }

    private function assertBatchCost(string $purchaseId, string $productId, float $unitCost): void
    {
        $batch = DB::table('inventory_batches')->where('tenant_id', $this->tenantId)
            ->where('purchase_invoice_id', $purchaseId)->where('product_id', $productId)->first();
        $this->assertNotNull($batch, 'No batch for the purchase line.');
        $this->assertEqualsWithDelta($unitCost, (float) $batch->unit_cost, 0.0001);
    }

    private function seedAccount(string $code, string $name, string $type, string $normalBalance): void
    {
        DB::table('accounts')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'code' => $code,
            'name' => $name, 'type' => $type, 'normal_balance' => $normalBalance,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function seedProduct(string $name): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $this->tenantId, 'name' => $name,
            'sku' => 'SKU-' . Str::random(6), 'price' => 100.00, 'cost_price' => 60.00,
            'base_unit' => 'PCS', 'stock_quantity' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedParty(string $name, string $type): string
    {
        $id = (string) Str::uuid();
        DB::table('parties')->insert([
            'id' => $id, 'tenant_id' => $this->tenantId, 'name' => $name, 'type' => $type,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function accountId(string $code): string
    {
        return (string) DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
    }

    private function assertLine(string $entryId, string $code, float $debit, float $credit): void
    {
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entryId, 'account_id' => $this->accountId($code),
            'debit' => $debit, 'credit' => $credit,
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

    private function glBalance(string $code): float
    {
        return round((float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)->where('je.is_reversed', 0)
            ->where('ji.account_id', $this->accountId($code))
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as bal')
            ->value('bal') ?? 0), 2);
    }

    /** credit − debit on 2000 tagged to the supplier. */
    private function supplierPayable(): float
    {
        return round((float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)->where('je.is_reversed', 0)
            ->where('ji.account_id', $this->accountId('2000'))
            ->where('ji.party_id', $this->supplierId)
            ->selectRaw('COALESCE(SUM(ji.credit),0) - COALESCE(SUM(ji.debit),0) as bal')
            ->value('bal') ?? 0), 2);
    }

    /** debit − credit on 2000 with no party (landed-cost accruals). */
    private function unassignedPayable(): float
    {
        return round((float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)->where('je.is_reversed', 0)
            ->where('ji.account_id', $this->accountId('2000'))
            ->whereNull('ji.party_id')
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as bal')
            ->value('bal') ?? 0), 2);
    }

    /** Σ remaining_qty × unit_cost over live batches (one product, or all when null). */
    private function fifoValuation(?string $productId = 'default'): float
    {
        $q = DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->whereNull('deleted_at');
        if ($productId !== null) {
            $q->where('product_id', $productId === 'default' ? $this->productId : $productId);
        }
        return round((float) ($q->selectRaw('COALESCE(SUM(remaining_qty * unit_cost),0) as v')->value('v') ?? 0), 2);
    }
}
