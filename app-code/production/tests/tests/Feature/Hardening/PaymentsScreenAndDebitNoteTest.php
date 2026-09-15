<?php

namespace Tests\Feature\Hardening;

use App\Engines\SaleService;
use App\Helpers\SettingsHelper;
use App\Models\Tenant;
use App\Models\User;
use App\Services\V3\PurchaseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Payments screen (customer side), purchase show / list settlement figures and
 * stock-returning debit notes.
 *
 * Same house style as PurchaseAccountingTest / SalesReturnAccountingTest: the
 * REAL production path (engines or the HTTP route the UI posts to), exact
 * amounts, every entry balanced, 1100 == Σ remaining_qty × unit_cost,
 * 1200 per customer == aged AR, 2000 per supplier == what the purchases say is
 * still owed, and stocks / products.stock_quantity == the batches.
 */
class PaymentsScreenAndDebitNoteTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User   $user;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;
    private string $supplierId;

    private PurchaseService $purchases;

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
        $this->purchases   = app(PurchaseService::class);

        $this->productId  = $this->seedProduct('Payments Widget');
        $this->customerId = $this->seedParty('Payments Customer', 'customer');
        $this->supplierId = $this->seedParty('Payments Supplier', 'supplier');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1 — Payments/In auto-allocation: effective outstanding, receipts only
    // ═══════════════════════════════════════════════════════════════════

    public function test_payments_screen_customer_receipt_allocates_only_effective_outstanding(): void
    {
        $this->openingStock(40, 60.00);

        // V: the oldest invoice, fully returned — nothing is owed on it.
        $v = $this->v3Sale('credit', 5, now()->subDays(5));
        app(SaleService::class)->reverse($v->id, 'Wrong goods', now()->toDateString());
        $this->assertDatabaseHas('sales', ['id' => $v->id, 'status' => 'returned']);

        // A: 1000 rung up at the till (legacy POS route), 400 paid there → 600 on account.
        $a = $this->legacySale(10, 400.00, now()->subDays(4));
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $a)->count(),
            'Premise: the legacy till records its payment in the sale entry, not as an allocation.');

        // B: 1000 on credit, 4 units returned → 600 owed.
        $b = $this->v3Sale('credit', 10, now()->subDays(3));
        $bItem = (string) DB::table('sale_items')->where('sale_id', $b->id)->value('id');
        app(SaleService::class)->reverse($b->id, 'Damaged', now()->toDateString(), [['sale_item_id' => $bItem, 'return_qty' => 4]]);

        // C: 500 on credit, newest.
        $c = $this->v3Sale('credit', 5, now()->subDays(2));

        $this->assertEqualsWithDelta(1700.00, $this->customerReceivable(), 0.001);

        // 1500 received through the Payments screen (Payments/In → payments.store).
        $this->postJson(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
            'date' => now()->toDateString(), 'type' => 'in', 'party_id' => $this->customerId,
            'amount' => 1500.00, 'payment_method' => 'cash',
        ])->assertOk()->assertJson(['success' => true]);

        // Oldest first, each only up to what is still owed on it.
        $this->assertEqualsWithDelta(0.00, $this->saleAllocated($v->id, true), 0.001, 'A returned sale owes nothing.');
        $this->assertEqualsWithDelta(600.00, $this->saleAllocated($a), 0.001, 'The 400 paid at the till is not owed again.');
        $this->assertEqualsWithDelta(600.00, $this->saleAllocated($b->id, true), 0.001, 'The 400 returned is not owed.');
        $this->assertEqualsWithDelta(300.00, $this->saleAllocated($c->id, true), 0.001);
        $this->assertDatabaseHas('sales', ['id' => $a, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('sales', ['id' => $b->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('sales', ['id' => $c->id, 'payment_status' => 'partial']);

        // The per-invoice reading the screen now uses.
        $summary = app(\App\Engines\PaymentService::class)->saleSettlementSummary($a);
        $this->assertEqualsWithDelta(400.00, $summary['at_counter'], 0.001);
        $this->assertEqualsWithDelta(1000.00, $summary['paid'], 0.001);
        $this->assertEqualsWithDelta(0.00, $summary['outstanding'], 0.001);
        $summary = app(\App\Engines\PaymentService::class)->saleSettlementSummary($b->id);
        $this->assertEqualsWithDelta(400.00, $summary['returned'], 0.001);
        $this->assertEqualsWithDelta(0.00, $summary['at_counter'], 0.001, 'A v3 counter payment is an allocation, not counted twice.');

        // Allocations agree with the ledger: 200 still owed, all on C, and the
        // aged receivables report says the same.
        $this->assertEqualsWithDelta(200.00, $this->customerReceivable(), 0.001);
        $this->assertEqualsWithDelta(200.00, $this->agedReceivable(), 0.001);

        // A refund PAID TO the customer is not a receipt against their invoices.
        $this->postJson(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
            'date' => now()->toDateString(), 'type' => 'out', 'party_id' => $this->customerId,
            'amount' => 50.00, 'payment_method' => 'cash',
        ])->assertOk();
        $this->assertEqualsWithDelta(300.00, $this->saleAllocated($c->id, true), 0.001);
        $this->assertDatabaseHas('sales', ['id' => $c->id, 'payment_status' => 'partial']);
        $this->assertEqualsWithDelta(250.00, $this->customerReceivable(), 0.001);

        $this->assertAllEntriesBalanced();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2 — Purchase show: outstanding is served, net of returns
    // ═══════════════════════════════════════════════════════════════════

    public function test_purchase_show_serves_outstanding_net_of_returns(): void
    {
        $p = $this->creditPurchase(10, 100.00);
        $this->supplierPayment($p->id, 300.00);

        $item = DB::table('purchase_items')->where('purchase_id', $p->id)->first();
        $this->purchases->createReturn($p->id, [
            'return_date' => now()->toDateString(), 'reason' => 'Damaged',
            'items' => [['purchase_item_id' => $item->id, 'return_qty' => 4]],
        ]);

        $show = $this->get(route('store.purchases.show', ['store_slug' => $this->tenant->slug, 'purchase' => $p->id]));
        $show->assertOk();

        $settlement = (array) $this->prop($show, 'settlement');
        $this->assertNotEmpty($settlement, 'The show page must be sent the settlement summary.');
        $this->assertEqualsWithDelta(1000.00, (float) $settlement['total'], 0.001);
        $this->assertEqualsWithDelta(300.00, (float) $settlement['paid'], 0.001);
        $this->assertEqualsWithDelta(400.00, (float) $settlement['returned'], 0.001);
        // 1000 − 400 returned − 300 paid; total − paid would have said 700.
        $this->assertEqualsWithDelta(300.00, (float) $settlement['outstanding'], 0.001);
        $this->assertEqualsWithDelta(300.00, (float) $this->prop($show, 'paidAmount'), 0.001);

        $this->assertEqualsWithDelta(300.00, $this->supplierPayable(), 0.001);
        $this->assertDatabaseHas('purchases', ['id' => $p->id, 'payment_status' => 'partial']);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3 — Purchase list summary: paid counts supplier payments
    // ═══════════════════════════════════════════════════════════════════

    public function test_purchase_list_summary_counts_every_payment_like_the_badge(): void
    {
        // P1: 1000, 400 paid at the counter.
        $p1 = $this->creditPurchase(10, 100.00, ['amount_paid' => 400.00], now()->subDays(3));
        // P2: 500 on credit, 200 paid through Supplier Payments, 1 unit (100) returned.
        $p2 = $this->creditPurchase(5, 100.00, [], now()->subDays(2));
        $this->supplierPayment($p2->id, 200.00);
        $p2Item = DB::table('purchase_items')->where('purchase_id', $p2->id)->first();
        $this->purchases->createReturn($p2->id, [
            'return_date' => now()->toDateString(), 'reason' => 'Short',
            'items' => [['purchase_item_id' => $p2Item->id, 'return_qty' => 1]],
        ]);
        // P3: 300 on credit.
        $this->creditPurchase(3, 100.00, [], now()->subDay());
        // A voided purchase and an unreceived one are not owed.
        $void = $this->creditPurchase(2, 100.00, [], now()->subDays(6));
        $this->purchases->void($void->id, 'Duplicate');
        $this->creditPurchase(4, 100.00, ['workflow_status' => 'pending']);

        // 100 through the Payments screen: lands on P1, the oldest still owed.
        $this->postJson(route('store.payments.store', ['store_slug' => $this->tenant->slug]), [
            'date' => now()->toDateString(), 'type' => 'out', 'party_id' => $this->supplierId,
            'amount' => 100.00, 'payment_method' => 'cash',
        ])->assertOk()->assertJson(['success' => true]);

        $list = $this->get(route('store.purchases.index', ['store_slug' => $this->tenant->slug]));
        $list->assertOk();
        $stats = (array) $this->prop($list, 'stats');

        $this->assertEqualsWithDelta(1800.00, (float) $stats['total_purchase'], 0.001);
        // 400 at the counter + 100 Payments screen + 200 Supplier Payments.
        $this->assertEqualsWithDelta(700.00, (float) $stats['total_paid'], 0.001);
        // P1 500 + P2 (500 − 100 returned − 200) + P3 300.
        $this->assertEqualsWithDelta(1000.00, (float) $stats['total_due'], 0.001);
        // …which is exactly what the ledger says the supplier is owed.
        $this->assertEqualsWithDelta($this->supplierPayable(), (float) $stats['total_due'], 0.001);

        // The rows agree with the summary.
        $rows = collect($this->getJson(route('store.purchases.index', ['store_slug' => $this->tenant->slug]))
            ->assertOk()->json('data'))->whereNotIn('status', ['cancelled', 'pending']);
        $this->assertEqualsWithDelta(700.00, (float) $rows->sum('paid'), 0.001);
        $this->assertEqualsWithDelta(1000.00, (float) $rows->sum('balance'), 0.001);

        // The date filter narrows the summary to the purchases in range.
        $day = (string) DB::table('purchases')->where('id', $p1->id)->value('purchase_date');
        $stats = (array) $this->prop($this->get(route('store.purchases.index', [
            'store_slug' => $this->tenant->slug, 'from_date' => $day, 'to_date' => $day,
        ])), 'stats');
        $this->assertEqualsWithDelta(1000.00, (float) $stats['total_purchase'], 0.001);
        $this->assertEqualsWithDelta(500.00, (float) $stats['total_paid'], 0.001);
        $this->assertEqualsWithDelta(500.00, (float) $stats['total_due'], 0.001);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4 — Stock-returning debit notes move the FIFO batches
    // ═══════════════════════════════════════════════════════════════════

    public function test_stock_returning_debit_note_consumes_batches_and_keeps_1100_in_step(): void
    {
        $p1 = $this->creditPurchase(10, 80.00, [], now()->subDays(3));
        $p2 = $this->creditPurchase(10, 100.00, [], now()->subDays(2));
        $p3 = $this->creditPurchase(10, 120.00, [], now()->subDay());
        $this->assertInventoryInStep(30);
        $this->assertEqualsWithDelta(3000.00, $this->glBalance('1100'), 0.001);

        // (a) No bill named: FIFO — all 10 of P1 at 80, then 2 of P2 at 100.
        //     Supplier credits 12 × 90 = 1080; 1000 of stock leaves at cost and
        //     the 80 over cost goes where a purchase return sends the difference.
        $this->debitNote([
            'returns_stock' => true, 'warehouse_id' => $this->warehouseId, 'reason' => 'Surplus',
            'items' => [['product_id' => $this->productId, 'quantity' => 12, 'unit_price' => 90.00]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $entry = $this->noteEntry('Surplus');
        $this->assertPartyLine($entry, '2000', 1080.00, 0);
        $this->assertLine($entry, '1100', 0, 1000.00);
        $this->assertLine($entry, '6000', 0, 80.00);
        $this->assertEntryBalanced($entry);
        $this->assertEqualsWithDelta(0.0, $this->batchRemaining($p1->id), 0.0001);
        $this->assertEqualsWithDelta(8.0, $this->batchRemaining($p2->id), 0.0001);
        $this->assertEqualsWithDelta(10.0, $this->batchRemaining($p3->id), 0.0001);
        $this->assertInventoryInStep(18);
        $this->assertEqualsWithDelta(2000.00, $this->glBalance('1100'), 0.001);

        // (b) Against P3: its own batch, not the oldest. 2 × 110 + 37.40 tax;
        //     stock leaves at 120, the 20 the supplier does not credit is
        //     written off to 6000 exactly as a purchase return does.
        $this->debitNote([
            'purchase_id' => $p3->id, 'returns_stock' => true, 'warehouse_id' => $this->warehouseId,
            'reason' => 'Defective', 'tax' => 37.40, 'tax_rate' => 17,
            'items' => [['product_id' => $this->productId, 'quantity' => 2, 'unit_price' => 110.00]],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $entry = $this->noteEntry('Defective');
        $this->assertPartyLine($entry, '2000', 257.40, 0);
        $this->assertLine($entry, '1100', 0, 240.00);
        $this->assertLine($entry, '2300', 0, 37.40);
        $this->assertLine($entry, '6000', 20.00, 0);
        $this->assertEntryBalanced($entry);
        $this->assertDatabaseHas('debit_notes', ['journal_entry_id' => $entry, 'purchase_id' => $p3->id]);
        // …and the note comes off what that bill still owes, like a purchase return.
        $p3Standing = app(\App\Engines\PaymentService::class)->purchaseSettlementSummary($p3->id);
        $this->assertEqualsWithDelta(257.40, $p3Standing['returned'], 0.001);
        $this->assertEqualsWithDelta(942.60, $p3Standing['outstanding'], 0.001);
        $this->assertEqualsWithDelta(8.0, $this->batchRemaining($p2->id), 0.0001);
        $this->assertEqualsWithDelta(8.0, $this->batchRemaining($p3->id), 0.0001);
        $this->assertInventoryInStep(16);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->productId, 'type' => 'purchase_return', 'quantity' => -2,
        ]);

        // (c) More than is left of the named bill's batch: refused, nothing moves.
        $entries = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();
        $this->debitNote([
            'purchase_id' => $p3->id, 'returns_stock' => true, 'warehouse_id' => $this->warehouseId,
            'reason' => 'Too many',
            'items' => [['product_id' => $this->productId, 'quantity' => 9, 'unit_price' => 120.00]],
        ])->assertSessionHasErrors('items');
        $this->assertSame($entries, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertEqualsWithDelta(8.0, $this->batchRemaining($p3->id), 0.0001);
        $this->assertInventoryInStep(16);

        // (d) A billing-only note moves no stock and never touches 1100.
        $before = $this->glBalance('1100');
        $this->debitNote([
            'reason' => 'Overcharged',
            'items' => [['product_id' => $this->productId, 'quantity' => 1, 'unit_price' => 50.00]],
        ])->assertSessionHasNoErrors();
        $this->assertEqualsWithDelta($before, $this->glBalance('1100'), 0.001);
        $this->assertInventoryInStep(16);

        // Supplier: 3000 billed − 1080 − 257.40 − 50.
        $this->assertEqualsWithDelta(1612.60, $this->supplierPayable(), 0.001);
        $this->assertAllEntriesBalanced();
    }

    public function test_approved_debit_note_can_be_refunded(): void
    {
        $this->creditPurchase(10, 100.00);
        $this->debitNote([
            'reason' => 'Overcharged',
            'items' => [['product_id' => $this->productId, 'quantity' => 1, 'unit_price' => 100.00]],
        ])->assertSessionHasNoErrors();
        $note = DB::table('debit_notes')->where('tenant_id', $this->tenantId)->first();
        $this->assertEqualsWithDelta(900.00, $this->supplierPayable(), 0.001);

        $this->from('/x')->post(route('store.debit-notes.refund', ['store_slug' => $this->tenant->slug, 'id' => $note->id]), [
            'refund_method' => 'cash', 'refund_date' => now()->toDateString(),
        ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertDatabaseHas('debit_notes', ['id' => $note->id, 'status' => 'refunded']);
        $this->assertEqualsWithDelta(100.00, $this->glBalance('1000'), 0.001);
        $this->assertEqualsWithDelta(1000.00, $this->supplierPayable(), 0.001);
        $this->assertAllEntriesBalanced();
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private function v3Sale(string $method, float $qty, $date): object
    {
        return app(SaleService::class)->post([
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => $date->toDateString(),
            'payment_method' => $method,
            'items'          => [[
                'product_id' => $this->productId, 'qty' => $qty, 'sale_uom' => 'PCS',
                'unit_price' => 100.00, 'tax_rate' => 0,
            ]],
        ]);
    }

    /** POST /sales — the legacy till. Returns the sale id. */
    private function legacySale(float $qty, float $paid, $date): string
    {
        $res = $this->postJson($this->storeUrl($this->tenant, 'sales'), [
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => $date->toDateString(),
            'items'          => [['product_id' => $this->productId, 'quantity' => $qty, 'price' => 100.00, 'discount' => 0]],
            'payment_method' => 'cash',
            'amount_paid'    => $paid,
        ]);
        $res->assertOk()->assertJson(['success' => true]);
        return (string) $res->json('sale_id');
    }

    private function creditPurchase(float $qty, float $unitCost, array $extra = [], $date = null)
    {
        return $this->purchases->store(array_merge([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId,
            'purchase_date' => ($date ?? now())->toDateString(), 'payment_method' => 'credit',
            'items' => [['product_id' => $this->productId, 'qty' => $qty, 'unit_cost' => $unitCost, 'tax_rate' => 0]],
        ], $extra));
    }

    private function supplierPayment(string $purchaseId, float $amount): void
    {
        $this->post("/s/{$this->tenant->slug}/v3/supplier-payments", [
            'supplier_id' => $this->supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => $amount,
            'allocations' => [['purchase_id' => $purchaseId, 'amount' => $amount]],
        ])->assertSessionHasNoErrors();
    }

    private function debitNote(array $data)
    {
        return $this->from('/x')->post(route('store.debit-notes.store', ['store_slug' => $this->tenant->slug]), array_merge([
            'supplier_id' => $this->supplierId, 'date' => now()->toDateString(), 'status' => 'approved',
        ], $data));
    }

    private function noteEntry(string $reason): string
    {
        $id = DB::table('debit_notes')->where('tenant_id', $this->tenantId)
            ->where('reason', $reason)->value('journal_entry_id');
        $this->assertNotNull($id, "The '{$reason}' note posted no entry.");
        return (string) $id;
    }

    /** Opening stock: batch + stocks + product master, DR 1100 / CR 7000. */
    private function openingStock(float $qty, float $cost): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $qty, 'initial_qty' => $qty,
            'remaining_qty' => $qty, 'unit_cost' => $cost,
            'created_at' => now()->subDays(10), 'updated_at' => now()->subDays(10),
        ]);
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'quantity' => $qty, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('products')->where('id', $this->productId)->increment('stock_quantity', $qty);
        app(\App\Engines\AccountingService::class)->createEntry([
            'date' => now()->subDays(10)->toDateString(), 'reference_type' => 'opening_stock',
            'reference' => (string) Str::uuid(),
        ], [
            ['account_code' => '1100', 'debit' => round($qty * $cost, 2), 'credit' => 0],
            ['account_code' => '7000', 'debit' => 0, 'credit' => round($qty * $cost, 2)],
        ]);
    }

    private function prop($response, string $key)
    {
        $page = $response->viewData('page');
        return $page['props'][$key] ?? null;
    }

    /** Active allocations on a sale; $excludeOwnEntry drops the v3 till's self-allocation. */
    private function saleAllocated(string $saleId, bool $excludeOwnEntry = false): float
    {
        $q = DB::table('allocations')->where('tenant_id', $this->tenantId)
            ->where('sale_id', $saleId)->where('status', 'active');
        if ($excludeOwnEntry) {
            $own = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
                ->where('reference_type', 'sale')->where('reference', $saleId)->pluck('id');
            $q->whereNotIn('payment_journal_entry_id', $own);
        }
        return round((float) $q->sum('allocated_amount'), 2);
    }

    private function batchRemaining(string $purchaseId): float
    {
        return (float) DB::table('inventory_batches')->where('tenant_id', $this->tenantId)
            ->where('purchase_invoice_id', $purchaseId)->where('product_id', $this->productId)
            ->sum('remaining_qty');
    }

    private function assertInventoryInStep(float $units): void
    {
        $batches = (float) DB::table('inventory_batches')->where('tenant_id', $this->tenantId)
            ->where('product_id', $this->productId)->whereNull('deleted_at')->sum('remaining_qty');
        $stocks  = (float) DB::table('stocks')->where('tenant_id', $this->tenantId)
            ->where('product_id', $this->productId)->sum('quantity');
        $master  = (float) DB::table('products')->where('id', $this->productId)->value('stock_quantity');

        $this->assertEqualsWithDelta($units, $batches, 0.0001, 'Batch units');
        $this->assertEqualsWithDelta($units, $stocks, 0.0001, 'stocks must agree with the batches');
        $this->assertEqualsWithDelta($units, $master, 0.0001, 'products.stock_quantity must agree with the batches');
        $this->assertEqualsWithDelta($this->glBalance('1100'), $this->fifoValuation(), 0.001, '1100 must equal the FIFO valuation');
    }

    private function fifoValuation(): float
    {
        return round((float) (DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->whereNull('deleted_at')
            ->selectRaw('COALESCE(SUM(remaining_qty * unit_cost),0) as v')->value('v') ?? 0), 2);
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
        $id = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
        $this->assertNotNull($id, "Account {$code} does not exist for this tenant.");
        return (string) $id;
    }

    private function assertLine(string $entryId, string $code, float $debit, float $credit): void
    {
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entryId, 'account_id' => $this->accountId($code),
            'debit' => $debit, 'credit' => $credit,
        ]);
    }

    private function assertPartyLine(string $entryId, string $code, float $debit, float $credit): void
    {
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $entryId, 'account_id' => $this->accountId($code),
            'party_id' => $this->supplierId, 'debit' => $debit, 'credit' => $credit,
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

    /** debit − credit on 1200 tagged to the customer. */
    private function customerReceivable(): float
    {
        return round((float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenantId)->where('je.is_reversed', 0)
            ->where('ji.account_id', $this->accountId('1200'))
            ->where('ji.party_id', $this->customerId)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as bal')
            ->value('bal') ?? 0), 2);
    }

    private function agedReceivable(): float
    {
        $aged = app(\App\Services\FinancialReportingService::class)->getAgedReceivables();
        return round((float) collect($aged['rows'])->where('party_id', $this->customerId)->sum('outstanding'), 2);
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
}
