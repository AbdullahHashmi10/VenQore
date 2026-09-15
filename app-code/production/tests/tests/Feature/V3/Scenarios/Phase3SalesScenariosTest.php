<?php

namespace Tests\Feature\V3\Scenarios;

use App\Exceptions\BelowCostSaleException;
use App\Exceptions\OverAllocationException;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\V3\AccountingService;
use App\Services\V3\PaymentService;
use App\Services\V3\SaleService;
use App\Services\V3\TaxService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * PHASE 3 — Sales & Receivables scenarios (VenQore ERP Scenario Rulebook v3.0).
 *
 * Replaces the Phase 3 "[STUB]" entries in ScenarioStubsTest with real tests
 * against the production code paths:
 *   - App\Services\V3\SaleService / PaymentService / AccountingService / TaxService
 *   - the V3 HTTP routes under /s/{store_slug}/v3/... (sales, sales returns,
 *     customer payments, bounce, write-off, customer advances, sales orders,
 *     price tiers, discount limits, invoice PDF).
 *
 * House style follows ScenarioStubsTest: RefreshDatabase + manual tenant /
 * chart-of-accounts / party / warehouse seeding, exact amounts asserted on
 * real rows, and every journal entry the scenario produced must balance.
 *
 * Chart-of-accounts note: accounts 2060 (Customer Advances) and 6700
 * (Bad Debt Expense) are deliberately NOT seeded here — a real tenant chart
 * (database/seeders/TenantDefaultSeeder.php) does not contain them either, so
 * the product itself must provision them when it first posts to them.
 */
class Phase3SalesScenariosTest extends VenQoreTestCase
{
    private const OWNER_PIN   = '111111';
    private const MANAGER_PIN = '246810';

    private Tenant $tenant;
    private User   $user;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;
    private string $supplierId;

    private SaleService       $sales;
    private PaymentService    $payments;
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant   = Tenant::factory()->create();
        $this->tenantId = (string) $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);

        // The acting user is the store OWNER (full permissions) — individual
        // scenarios switch to a cashier / accountant where the rule is about
        // what a lower role may do.
        $this->user = $this->member('owner', self::OWNER_PIN);
        $this->actingAs($this->user);

        $this->sales      = app(SaleService::class);
        $this->payments   = app(PaymentService::class);
        $this->accounting = app(AccountingService::class);

        // ── Chart of accounts (same codes as the product's TenantDefaultSeeder) ──
        $this->seedAccount('1000', 'Cash in Hand',           'asset',     'debit');
        $this->seedAccount('1010', 'Bank Account',           'asset',     'debit');
        $this->seedAccount('1100', 'Inventory Asset',        'asset',     'debit');
        $this->seedAccount('1200', 'Accounts Receivable',    'asset',     'debit');
        $this->seedAccount('2000', 'Accounts Payable',       'liability', 'credit');
        $this->seedAccount('2050', 'Customer Credit Balances','liability', 'credit');
        $this->seedAccount('2100', 'Sales Tax Payable',      'liability', 'credit');
        $this->seedAccount('2300', 'Input Tax Recoverable',  'asset',     'debit');
        $this->seedAccount('3000', "Owner's Capital",        'equity',    'credit');
        $this->seedAccount('4000', 'Sales Revenue',          'income',    'credit');
        $this->seedAccount('5000', 'Cost of Goods Sold',     'expense',   'debit');
        $this->seedAccount('6000', 'Operating Expenses',     'expense',   'debit');
        $this->seedAccount('7000', 'Opening Balance Equity', 'equity',    'credit');

        $this->warehouseId = $this->seedWarehouse();

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
            'address'    => '12 Mall Road, Lahore',
            'phone'      => '0300-1234567',
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
    // S-011 — Below-cost sale requires manager PIN (Task 3.5)
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-011 Below-cost sale requires manager PIN */
    public function s011_below_cost_sale_requires_manager_pin(): void
    {
        $batchId = $this->seedBatch(10, 60.00);

        // ── Engine layer: no approver → BelowCostSaleException, nothing written ──
        try {
            $this->sales->post($this->saleData('cash', [['qty' => 2, 'unit_price' => 50.00]]));
            $this->fail('A below-cost sale without approval must be rejected (S-011).');
        } catch (BelowCostSaleException $e) {
            $this->assertEqualsWithDelta(100.00, $e->unitPrice, 0.001); // line net 2 x 50
            $this->assertEqualsWithDelta(120.00, $e->batchCost, 0.001); // FIFO cost 2 x 60
        }
        $this->assertSame(0, DB::table('sales')->where('tenant_id', $this->tenantId)->count());
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 10]);

        // ── HTTP (V3 checkout route) as a CASHIER ────────────────────────────
        $cashier = $this->member('cashier', '999999');
        $manager = $this->member('manager', self::MANAGER_PIN);
        $this->actingAs($cashier);

        $payload = $this->httpSale('cash', [['qty' => 2, 'unit_price' => 50.00]]);

        // (a) no approval at all → a validation error, not a 500 and not a sale
        $this->from('/pos')->post($this->v3('sales'), $payload)
            ->assertRedirect('/pos')
            ->assertSessionHasErrors('approved_by');

        // (b) the cashier "approving" their own below-cost sale is not a manager approval
        $this->from('/pos')->post($this->v3('sales'), $payload + ['approved_by' => (string) $cashier->id, 'approval_pin' => '999999'])
            ->assertSessionHasErrors('approved_by');

        // (c) naming a manager without the manager's PIN is rejected
        $this->from('/pos')->post($this->v3('sales'), $payload + ['approved_by' => (string) $manager->id])
            ->assertSessionHasErrors('approved_by');
        $this->from('/pos')->post($this->v3('sales'), $payload + ['approved_by' => (string) $manager->id, 'approval_pin' => '000000'])
            ->assertSessionHasErrors('approved_by');

        $this->assertSame(0, DB::table('sales')->where('tenant_id', $this->tenantId)->count(),
            'No below-cost sale may be posted without a verified manager PIN.');
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 10]);

        // (d) manager + correct PIN → the sale posts, at the below-cost price
        $this->from('/pos')->post($this->v3('sales'), $payload + [
            'approved_by'  => (string) $manager->id,
            'approval_pin' => self::MANAGER_PIN,
        ])->assertSessionHasNoErrors();

        $sale = DB::table('sales')->where('tenant_id', $this->tenantId)->first();
        $this->assertNotNull($sale);
        $this->assertEqualsWithDelta(100.00, (float) $sale->invoice_total, 0.001);
        $this->assertSame('paid', $sale->payment_status);
        // The sale is still recorded as rung up by the cashier — the manager only approved it.
        $this->assertSame((string) $cashier->id, (string) $sale->user_id);

        $je = $this->saleEntry($sale->id);
        $this->assertSame((string) $manager->id, (string) $je->approved_by, 'approved_by must be stamped on the journal entry (S-011).');
        $this->assertLine($je->id, '4000', 0, 100.00);
        $this->assertLine($je->id, '1000', 100.00, 0);
        $this->assertLine($je->id, '5000', 120.00, 0);   // true FIFO cost, even though it is a loss
        $this->assertLine($je->id, '1100', 0, 120.00);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 8]);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-018 — Partial payment sets badge to partial (B4)
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-018 Partial payment sets badge (payment_status) to partial */
    public function s018_partial_payment_sets_badge_to_partial(): void
    {
        $this->seedBatch(20, 60.00);

        // Credit invoice of 500 (5 x 100)
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 5, 'unit_price' => 100.00]]));
        $this->assertSame('unpaid', $sale->payment_status);

        // B4 — customer pays 200 of 500 through the real customer-payments route
        $pay1 = $this->receivePayment($sale->id, 200.00);

        $this->assertDatabaseHas('allocations', [
            'payment_journal_entry_id' => $pay1, 'sale_id' => $sale->id,
            'allocated_amount' => 200.00, 'status' => 'active',
        ]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'partial']);
        $this->assertLine($pay1, '1000', 200.00, 0);
        $this->assertLine($pay1, '1200', 0, 200.00, $this->customerId);
        $this->assertEqualsWithDelta(300.00, $this->arBalance(), 0.001);

        // The rest (300) closes it
        $this->receivePayment($sale->id, 300.00);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);

        // B2 split at the till: 300 invoice, 120 tendered → partial, 180 left on AR
        $split = $this->sales->post($this->saleData('cash', [['qty' => 3, 'unit_price' => 100.00]], ['amount_received' => 120.00]));
        $this->assertSame('partial', $split->payment_status);
        $splitJe = $this->saleEntry($split->id);
        $this->assertLine($splitJe->id, '1000', 120.00, 0);
        $this->assertLine($splitJe->id, '1200', 180.00, 0, $this->customerId);
        $this->assertDatabaseHas('allocations', ['sale_id' => $split->id, 'allocated_amount' => 120.00, 'status' => 'active']);
        $this->assertEqualsWithDelta(180.00, $this->arBalance(), 0.001);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-020 — Bounced cheque (B25) reverts invoice to unpaid
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-020 Bounced cheque (B25) reverts invoice to unpaid */
    public function s020_bounced_cheque_b25_reverts_invoice(): void
    {
        $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 5, 'unit_price' => 100.00]]));

        // Cheque deposited to bank — invoice shows paid
        $paymentId = $this->receivePayment($sale->id, 500.00, 'bank');
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);

        // A sale entry can never be "bounced"
        $this->from('/x')->post($this->v3('customer-payments/' . $this->saleEntry($sale->id)->id . '/bounce'), ['reason' => 'nope'])
            ->assertSessionHasErrors('entry');

        // B25 — the cheque bounces
        $this->from('/x')->post($this->v3("customer-payments/{$paymentId}/bounce"), ['reason' => 'Insufficient funds'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'unpaid']);
        $this->assertDatabaseHas('allocations', ['payment_journal_entry_id' => $paymentId, 'sale_id' => $sale->id, 'status' => 'reversed']);
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $sale->id)->where('status', 'active')->count());

        // Mirror entry: DR 1200 AR (customer) / CR 1010 Bank
        $this->assertDatabaseHas('journal_entries', ['id' => $paymentId, 'is_reversed' => 1]);
        $reversal = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reverses_entry_id', $paymentId)->first();
        $this->assertNotNull($reversal);
        $this->assertLine($reversal->id, '1200', 500.00, 0, $this->customerId);
        $this->assertLine($reversal->id, '1010', 0, 500.00);

        // The customer owes the full 500 again; the bank is back to nil
        $this->assertEqualsWithDelta(500.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('1010'), 0.001);

        // Bouncing the same cheque twice is refused
        $this->from('/x')->post($this->v3("customer-payments/{$paymentId}/bounce"), ['reason' => 'again'])
            ->assertSessionHasErrors('entry');
        $this->assertSame(1, DB::table('journal_entries')->where('reverses_entry_id', $paymentId)->count());

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-021 — Bad debt write-off (B26) requires manager approval
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-021 Bad debt write-off (B26) requires manager approval */
    public function s021_bad_debt_writeoff_b26_requires_approval(): void
    {
        $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 5, 'unit_price' => 100.00]]));

        // Write-offs are filed by whoever keeps the books (finance.journal)…
        $accountant = $this->member('accountant', '555555');
        $cashier    = $this->member('cashier', '999999');
        $manager    = $this->member('manager', self::MANAGER_PIN);
        $this->actingAs($accountant);
        $url = $this->v3("sales/{$sale->id}/write-off");

        // (a) no approver at all
        $this->from('/x')->post($url, ['reason' => 'Customer absconded'])
            ->assertSessionHasErrors('approved_by');

        // (b) an approver who is not a manager
        $this->from('/x')->post($url, ['reason' => 'Customer absconded', 'approved_by' => (string) $cashier->id, 'approval_pin' => '999999'])
            ->assertSessionHasErrors('approved_by');

        // (c) a user who does not belong to this store at all
        $stranger = User::factory()->create();
        $this->from('/x')->post($url, ['reason' => 'Customer absconded', 'approved_by' => (string) $stranger->id])
            ->assertSessionHasErrors('approved_by');

        // (d) a manager named without their PIN
        $this->from('/x')->post($url, ['reason' => 'Customer absconded', 'approved_by' => (string) $manager->id, 'approval_pin' => '123456'])
            ->assertSessionHasErrors('approved_by');

        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'bad_debt')->count());
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'unpaid']);

        // (e) manager + PIN → written off, approval stamped on the entry
        $this->from('/x')->post($url, ['reason' => 'Customer absconded', 'approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN])
            ->assertSessionHasNoErrors();

        $je = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'bad_debt')->where('reference', $sale->id)->first();
        $this->assertNotNull($je);
        $this->assertSame((string) $manager->id, (string) $je->approved_by);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'written_off']);

        // written_off is sticky — a later badge rebuild never flips it back
        $this->payments->updatePaymentBadge($sale->id);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'written_off']);

        // …and it cannot be written off twice
        $this->from('/x')->post($url, ['reason' => 'again', 'approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN])
            ->assertSessionHasErrors('sale');
        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'bad_debt')->count());

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-023 — Customer advance (B20) posts to a liability with zero tax
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-023 Customer advance (B20) posts to the Customer Advances liability with zero tax */
    public function s023_customer_advance_b20_zero_tax(): void
    {
        // B20 — 1,170 received in cash before delivery
        $this->from('/x')->post($this->v3('customer-advances'), [
            'customer_id'    => $this->customerId,
            'amount'         => 1170.00,
            'receipt_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'reference'      => 'ADV-1',
        ])->assertSessionHasNoErrors();

        $advJe = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'customer_advance')->first();
        $this->assertNotNull($advJe);

        // In this product 2100 is Sales Tax Payable (TenantDefaultSeeder, TaxService::taxReport,
        // SaleService tax line); customer advances live in 2060 "Customer Advances"
        // (SalesOrderController deposits, PartyBalanceController). The rulebook's "2100
        // Customer Advance" predates the M1-06b renumbering.
        $this->assertDatabaseHas('accounts', [
            'tenant_id' => $this->tenantId, 'code' => '2060', 'type' => 'liability', 'normal_balance' => 'credit',
        ]);
        $this->assertLine($advJe->id, '1000', 1170.00, 0);
        $this->assertLine($advJe->id, '2060', 0, 1170.00, $this->customerId);
        $this->assertSame(2, DB::table('journal_items')->where('journal_entry_id', $advJe->id)->count(),
            'B20 is a two-line entry: cash in, liability up. No tax line.');
        $this->assertNoLine($advJe->id, '2100');

        // Zero tax at receipt: the tax report shows nothing collected
        $tax = app(TaxService::class)->taxReport(Carbon::today()->subDay(), Carbon::today()->addDay());
        $this->assertEqualsWithDelta(0.00, $tax['sales_tax_collected'], 0.001, 'An advance is not a taxable supply (S-048).');
        $this->assertEqualsWithDelta(1170.00, $this->accountBalance('2060') * -1, 0.001);

        // Delivery: 10 x 100 at 17% = 1,000 + 170 tax, settled from the advance
        $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 10, 'unit_price' => 100.00, 'tax_rate' => 17]], ['advance_amount' => 1170.00]));

        $saleJe = $this->saleEntry($sale->id);
        $this->assertLine($saleJe->id, '2100', 0, 170.00);            // tax posted at delivery
        $settle = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'advance_settlement')->where('reference', $sale->id)->first();
        $this->assertNotNull($settle);
        $this->assertLine($settle->id, '2060', 1170.00, 0, $this->customerId);
        $this->assertLine($settle->id, '1200', 0, 1170.00, $this->customerId);

        $tax = app(TaxService::class)->taxReport(Carbon::today()->subDay(), Carbon::today()->addDay());
        $this->assertEqualsWithDelta(170.00, $tax['sales_tax_collected'], 0.001);

        // The advance is fully consumed, the customer owes nothing, and the invoice says so.
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('2060'), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'paid']);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-024 — Sale return after partial payment recalculates badge
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-024 Sale return after partial payment recalculates badge */
    public function s024_sale_return_after_partial_payment(): void
    {
        $batchId = $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 5, 'unit_price' => 100.00]]));
        $saleItemId = DB::table('sale_items')->where('sale_id', $sale->id)->value('id');

        $this->receivePayment($sale->id, 200.00);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'partial']);

        // Return 1 of 5 through the real B9 route → invoice is now worth 400, 200 paid
        $this->from('/x')->post($this->v3("sales/{$sale->id}/return"), [
            'return_date' => now()->toDateString(),
            'reason'      => 'One damaged',
            'items'       => [['sale_item_id' => $saleItemId, 'return_qty' => 1]],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'partially_returned', 'payment_status' => 'partial']);
        $this->assertEqualsWithDelta(200.00, $this->arBalance(), 0.001);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 6]);

        // Only 200 is still owed — trying to collect 300 against this invoice is over-allocation
        $before = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();
        $this->postJson($this->v3('customer-payments'), $this->paymentPayload($sale->id, 300.00))
            ->assertStatus(422)->assertJsonValidationErrors('allocations');
        $this->assertSame($before, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());

        // Return 2 more → invoice worth 200, 200 already paid → badge recalculates to paid
        $this->from('/x')->post($this->v3("sales/{$sale->id}/return"), [
            'return_date' => now()->toDateString(),
            'reason'      => 'Two more damaged',
            'items'       => [['sale_item_id' => $saleItemId, 'return_qty' => 2]],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'partially_returned', 'payment_status' => 'paid']);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 8]);
        $this->assertDatabaseHas('sale_items', ['id' => $saleItemId, 'returned_quantity' => 3]);

        // Ledger: revenue 500 − 300 returned = 200; COGS 300 − 180 = 120
        $this->assertEqualsWithDelta(-200.00, $this->accountBalance('4000'), 0.001);
        $this->assertEqualsWithDelta(120.00, $this->accountBalance('5000'), 0.001);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-028 — Customer overpayment blocked (over-allocation on B4)
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-028 Customer overpayment blocked (over-allocation on B4) */
    public function s028_customer_overpayment_blocked(): void
    {
        $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 5, 'unit_price' => 100.00]]));
        $entriesBefore = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();

        // (a) allocating 600 to a 500 invoice → 422, nothing posted (the B4 entry rolls back)
        $this->postJson($this->v3('customer-payments'), $this->paymentPayload($sale->id, 600.00))
            ->assertStatus(422)->assertJsonValidationErrors('allocations');

        // (b) same via the normal form post → redirect back with the error
        $this->from('/x')->post($this->v3('customer-payments'), $this->paymentPayload($sale->id, 600.00))
            ->assertRedirect('/x')->assertSessionHasErrors('allocations');

        // (c) allocations larger than the money actually received
        $this->from('/x')->post($this->v3('customer-payments'), $this->paymentPayload($sale->id, 100.00, 200.00))
            ->assertSessionHasErrors('allocations');

        $this->assertSame($entriesBefore, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count(),
            'A rejected over-allocation must not leave a half-posted payment in the ledger.');
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $sale->id)->count());
        $this->assertEqualsWithDelta(500.00, $this->arBalance(), 0.001);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'unpaid']);

        // (d) cumulative: 300 is fine, a further 300 is 100 too much
        $this->receivePayment($sale->id, 300.00);
        $this->postJson($this->v3('customer-payments'), $this->paymentPayload($sale->id, 300.00))
            ->assertStatus(422);
        $this->assertEqualsWithDelta(300.00, (float) DB::table('allocations')->where('sale_id', $sale->id)->where('status', 'active')->sum('allocated_amount'), 0.001);

        // (e) engine layer: PaymentService refuses directly too
        $je = $this->accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'customer_payment', 'reference' => (string) Str::uuid(),
            'party_id' => $this->customerId,
        ], [
            ['account_code' => '1000', 'debit' => 250.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0, 'credit' => 250.00, 'party_id' => $this->customerId],
        ]);
        $this->expectException(OverAllocationException::class);
        $this->payments->allocate($je->id, [['sale_id' => $sale->id, 'amount' => 250.00]]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-033 — Credit sale fully returned — AR nets to zero
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-033 Credit sale fully returned — AR nets to zero */
    public function s033_credit_sale_fully_returned_ar_nets_zero(): void
    {
        $batchId = $this->seedBatch(10, 60.00);

        // (1) one-shot full return through the B9 route
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 4, 'unit_price' => 100.00]]));
        $this->assertEqualsWithDelta(400.00, $this->arBalance(), 0.001);

        $this->from('/x')->post($this->v3("sales/{$sale->id}/return"), [
            'return_date' => now()->toDateString(),
            'reason'      => 'Whole order returned',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'status' => 'returned']);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);
        // Raw (unfiltered) AR movements on this customer net to zero as well
        $this->assertEqualsWithDelta(0.00, $this->arBalance(false), 0.001);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 10]);
        foreach (['4000', '5000', '1100', '1200'] as $code) {
            $this->assertEqualsWithDelta(0.00, $this->accountBalance($code), 0.001, "Account {$code} must be back to nil after a full return.");
        }

        // (2) the same invoice value returned in two steps (3 now, the last 1 later)
        $sale2 = $this->sales->post($this->saleData('credit', [['qty' => 4, 'unit_price' => 100.00]]));
        $itemId = DB::table('sale_items')->where('sale_id', $sale2->id)->value('id');
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 6]);

        $this->from('/x')->post($this->v3("sales/{$sale2->id}/return"), [
            'return_date' => now()->toDateString(), 'reason' => 'First three',
            'items' => [['sale_item_id' => $itemId, 'return_qty' => 3]],
        ])->assertSessionHasNoErrors();
        $this->assertEqualsWithDelta(100.00, $this->arBalance(), 0.001);

        $this->from('/x')->post($this->v3("sales/{$sale2->id}/return"), [
            'return_date' => now()->toDateString(), 'reason' => 'The last one',
            'items' => [['sale_item_id' => $itemId, 'return_qty' => 1]],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sales', ['id' => $sale2->id, 'status' => 'returned']);
        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001, 'AR must net to zero — not be credited twice — when the rest of a partly-returned sale comes back.');
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 10]); // each unit restored exactly once
        foreach (['4000', '5000', '1100', '1200'] as $code) {
            $this->assertEqualsWithDelta(0.00, $this->accountBalance($code), 0.001, "Account {$code} must be back to nil after a two-step full return.");
        }

        // A third return has nothing left to take back
        try {
            $this->sales->reverse($sale2->id, 'again');
            $this->fail('A fully returned sale cannot be returned again.');
        } catch (\LogicException $e) {
            $this->assertStringContainsString('already been returned', $e->getMessage());
        }

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-039 — POS tiered pricing — correct blended unit price (S-042)
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-039 POS tiered pricing — correct blended unit price (S-042) */
    public function s039_tiered_pricing_blended_unit_price(): void
    {
        $this->seedBatch(20, 60.00);

        // Configure tiers through the real product screen route: 1–10 @ 100, 11+ @ 90
        $this->from('/x')->post($this->v3("products/{$this->productId}/tiers"), ['min_qty' => 1, 'max_qty' => 10, 'unit_price' => 100])
            ->assertSessionHasNoErrors();
        $this->from('/x')->post($this->v3("products/{$this->productId}/tiers"), ['min_qty' => 11, 'unit_price' => 90])
            ->assertSessionHasNoErrors();
        // Overlapping tier refused
        $this->from('/x')->post($this->v3("products/{$this->productId}/tiers"), ['min_qty' => 5, 'max_qty' => 12, 'unit_price' => 95])
            ->assertSessionHasErrors('min_qty');

        $this->assertSame(2, DB::table('product_price_tiers')->where('tenant_id', $this->tenantId)->where('product_id', $this->productId)->count(),
            'Tiers saved from the product screen must belong to this store, or SaleService can never find them.');

        // Cashier rings up 15 at the list price; the server applies the tiers
        $this->from('/pos')->post($this->v3('sales'), $this->httpSale('cash', [['qty' => 15, 'unit_price' => 100.00]]))
            ->assertSessionHasNoErrors();

        $sale = DB::table('sales')->where('tenant_id', $this->tenantId)->first();
        // 10 x 100 + 5 x 90 = 1,450 → blended 96.67
        $this->assertEqualsWithDelta(1450.00, (float) $sale->net_sales, 0.001);
        $this->assertEqualsWithDelta(1450.00, (float) $sale->invoice_total, 0.001);
        $this->assertEqualsWithDelta(96.67, round((float) $sale->net_sales / 15, 2), 0.001);

        $lines = DB::table('sale_items')->where('sale_id', $sale->id)->orderByDesc('unit_price')->get();
        $this->assertCount(2, $lines, 'S-042: one sale_items row per tier.');
        $this->assertEqualsWithDelta(10, (float) $lines[0]->quantity, 0.0001);
        $this->assertEqualsWithDelta(100.00, (float) $lines[0]->unit_price, 0.001);
        $this->assertEqualsWithDelta(1000.00, (float) $lines[0]->line_total, 0.001);
        $this->assertEqualsWithDelta(5, (float) $lines[1]->quantity, 0.0001);
        $this->assertEqualsWithDelta(90.00, (float) $lines[1]->unit_price, 0.001);
        $this->assertEqualsWithDelta(450.00, (float) $lines[1]->line_total, 0.001);

        $je = $this->saleEntry($sale->id);
        $this->assertLine($je->id, '4000', 0, 1450.00);
        $this->assertLine($je->id, '1000', 1450.00, 0);
        $this->assertLine($je->id, '5000', 900.00, 0); // 15 x 60 FIFO

        // Below the first tier's threshold nothing changes: 1 unit at 100
        $small = $this->sales->post($this->saleData('cash', [['qty' => 1, 'unit_price' => 100.00]]));
        $this->assertEqualsWithDelta(100.00, (float) $small->net_sales, 0.001);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-040 — Promotional free item — zero-price line still carries COGS
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-040 Promotional free item — Rs.0 line with COGS */
    public function s040_promotional_free_item_zero_price_with_cogs(): void
    {
        $batchId = $this->seedBatch(10, 60.00);

        // "Buy 2, get 1 free": 2 paid rows' worth + 1 promotional row, no approver needed
        $sale = $this->sales->post($this->saleData('cash', [
            ['qty' => 2, 'unit_price' => 100.00],
            ['qty' => 1, 'unit_price' => 100.00, 'is_promotional' => true, 'discount_percent' => 50],
        ]));

        $this->assertEqualsWithDelta(200.00, (float) $sale->net_sales, 0.001);
        $this->assertEqualsWithDelta(200.00, (float) $sale->invoice_total, 0.001);

        $promo = DB::table('sale_items')->where('sale_id', $sale->id)->where('free_quantity', '>', 0)->first();
        $this->assertNotNull($promo, 'The promotional line must be flagged via free_quantity.');
        $this->assertEqualsWithDelta(1, (float) $promo->free_quantity, 0.0001);
        $this->assertEqualsWithDelta(0.00, (float) $promo->net_amount, 0.001);
        $this->assertEqualsWithDelta(0.00, (float) $promo->line_total, 0.001);
        $this->assertEqualsWithDelta(60.00, (float) $promo->cost_price, 0.001); // COGS carried on the free line

        $this->assertDatabaseHas('sale_item_batches', [
            'sale_item_id' => $promo->id, 'inventory_batch_id' => $batchId,
            'qty_deducted' => 1, 'unit_cost' => 60.00, 'total_cogs' => 60.00,
        ]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batchId, 'remaining_qty' => 7]);

        // Journal: revenue only for the paid units, COGS for all three
        $je = $this->saleEntry($sale->id);
        $this->assertNull($je->approved_by, 'A promotional line is not a below-cost sale and needs no approval.');
        $this->assertLine($je->id, '4000', 0, 200.00);
        $this->assertLine($je->id, '1000', 200.00, 0);
        $this->assertLine($je->id, '5000', 180.00, 0);
        $this->assertLine($je->id, '1100', 0, 180.00);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-044 — Discount above role limit blocked without manager PIN
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-044 Discount above role limit blocked without manager PIN */
    public function s044_discount_above_limit_blocked(): void
    {
        $this->seedBatch(20, 60.00);

        // Owner sets THIS store's cashier limit to 5% via the settings route
        $this->from('/x')->post($this->v3('settings/discount-limits'), ['role' => 'cashier', 'max_discount_percent' => 5])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('discount_limits', ['tenant_id' => $this->tenantId, 'role' => 'cashier', 'max_discount_percent' => 5.00]);
        // Another store's (stricter) setting must never leak into this one
        DB::table('discount_limits')->insert([
            'tenant_id' => (string) Tenant::factory()->create()->id, 'role' => 'cashier', 'max_discount_percent' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $cashier  = $this->member('cashier', '999999');
        $cashier2 = $this->member('cashier', '888888');
        $manager  = $this->member('manager', self::MANAGER_PIN);   // global default limit 50%
        $this->actingAs($cashier);

        // (a) 4% is inside the cashier's own limit
        $this->from('/pos')->post($this->v3('sales'), $this->httpSale('cash', [['qty' => 1, 'unit_price' => 100.00, 'discount_percent' => 4]]))
            ->assertSessionHasNoErrors();

        // (b) 8% is over this store's 5% → blocked without approval
        $over = $this->httpSale('cash', [['qty' => 2, 'unit_price' => 100.00, 'discount_percent' => 8]]);
        $this->from('/pos')->post($this->v3('sales'), $over)->assertSessionHasErrors('items.0.discount_percent');

        // (c) another cashier cannot approve it, nor can a manager without a PIN
        $this->from('/pos')->post($this->v3('sales'), $over + ['approved_by' => (string) $cashier2->id, 'approval_pin' => '888888'])
            ->assertSessionHasErrors('approved_by');
        $this->from('/pos')->post($this->v3('sales'), $over + ['approved_by' => (string) $manager->id, 'approval_pin' => '000000'])
            ->assertSessionHasErrors('approved_by');

        // (d) 60% is beyond even the manager's own 50% limit
        $this->from('/pos')->post($this->v3('sales'), $this->httpSale('cash', [['qty' => 1, 'unit_price' => 100.00, 'discount_percent' => 60]]) + [
            'approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN,
        ])->assertSessionHasErrors('items.0.discount_percent');

        $this->assertSame(1, DB::table('sales')->where('tenant_id', $this->tenantId)->count(), 'Only the 4% sale may have posted so far.');

        // (e) manager + PIN → 8% goes through: 200 − 16 = 184
        $this->from('/pos')->post($this->v3('sales'), $over + ['approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN])
            ->assertSessionHasNoErrors();

        $sale = DB::table('sales')->where('tenant_id', $this->tenantId)->where('total_item_discounts', '>', 10)->first();
        $this->assertNotNull($sale);
        $this->assertEqualsWithDelta(16.00, (float) $sale->total_item_discounts, 0.001);
        $this->assertEqualsWithDelta(184.00, (float) $sale->net_sales, 0.001);
        $je = $this->saleEntry($sale->id);
        $this->assertSame((string) $manager->id, (string) $je->approved_by);
        $this->assertLine($je->id, '4000', 0, 184.00);

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-045 — Sales order price locked at creation
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-045 Sales order price locked at creation */
    public function s045_sales_order_price_locked(): void
    {
        $this->seedBatch(10, 60.00);

        $this->from('/x')->post($this->v3('sales-orders'), [
            'customer_id'  => $this->customerId,
            'warehouse_id' => $this->warehouseId,
            'order_date'   => now()->toDateString(),
            'items'        => [['product_id' => $this->productId, 'qty' => 5, 'sale_uom' => 'PCS', 'unit_price' => 100.00]],
        ])->assertSessionHasNoErrors();

        $order = DB::table('sales_orders')->where('tenant_id', $this->tenantId)->first();
        $this->assertNotNull($order);
        $this->assertSame('open', $order->status);
        $this->assertEqualsWithDelta(500.00, (float) $order->total_amount, 0.001);
        // A sales order has no ledger effect
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());

        // Prices move after the order is taken: list price up, and a new volume tier appears
        DB::table('products')->where('id', $this->productId)->update(['price' => 150.00]);
        DB::table('product_price_tiers')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'product_id' => $this->productId,
            'min_qty' => 1, 'max_qty' => null, 'unit_price' => 80.00, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->from('/x')->post($this->v3("sales-orders/{$order->id}/convert"), [
            'payment_method' => 'credit',
            'sale_date'      => now()->toDateString(),
        ])->assertSessionHasNoErrors();

        $sale = DB::table('sales')->where('tenant_id', $this->tenantId)->where('source_order_id', $order->id)->first();
        $this->assertNotNull($sale);
        $items = DB::table('sale_items')->where('sale_id', $sale->id)->get();
        $this->assertCount(1, $items);
        $this->assertEqualsWithDelta(100.00, (float) $items[0]->unit_price, 0.001, 'The invoice must use the price locked on the order.');
        $this->assertEqualsWithDelta(500.00, (float) $sale->invoice_total, 0.001);
        $this->assertLine($this->saleEntry($sale->id)->id, '1200', 500.00, 0, $this->customerId);
        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'converted']);

        // A converted order cannot be converted again
        $this->from('/x')->post($this->v3("sales-orders/{$order->id}/convert"), [
            'payment_method' => 'credit', 'sale_date' => now()->toDateString(),
        ])->assertSessionHasErrors('order');
        $this->assertSame(1, DB::table('sales')->where('tenant_id', $this->tenantId)->count());

        $this->assertAllEntriesBalance();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-046 — Invoice PDF generates correctly
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-046 Invoice PDF generates correctly */
    public function s046_invoice_pdf_generates(): void
    {
        $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [
            ['qty' => 3, 'unit_price' => 100.00, 'tax_rate' => 17],
            ['qty' => 1, 'unit_price' => 100.00, 'is_promotional' => true],
        ]));

        $response = $this->get($this->v3("sales/{$sale->id}/pdf"));

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString("invoice-{$sale->reference_number}.pdf", (string) $response->headers->get('Content-Disposition'));

        $bytes = $response->getContent() ?: $response->streamedContent();
        $this->assertStringStartsWith('%PDF-', $bytes);
        $this->assertStringContainsString('%%EOF', substr($bytes, -1024));
        $this->assertGreaterThan(1500, strlen($bytes));
        $this->assertMatchesRegularExpression('/\/Type\s*\/Page\b/', $bytes, 'The PDF must contain at least one page object.');

        // Another store's invoice id is not reachable from this store
        $other = Tenant::factory()->create();
        $otherSaleId = (string) Str::uuid();
        DB::table('sales')->insert([
            'id' => $otherSaleId, 'tenant_id' => $other->id, 'reference_number' => 'SAL-OTHER-1',
            'party_id' => $this->customerId, 'warehouse_id' => $this->warehouseId,
            'subtotal' => 10, 'total' => 10, 'invoice_total' => 10, 'status' => 'posted', 'payment_status' => 'unpaid',
            'user_id' => $this->user->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->get($this->v3("sales/{$otherSaleId}/pdf"))->assertNotFound();
    }

    // ═══════════════════════════════════════════════════════════════════
    // S-090 — Bad debt write-off (B26) — 6700 DR / 1200 CR
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-090 Bad debt write-off (B26) — 6700 DR / 1200 CR */
    public function s090_bad_debt_writeoff_correct_accounts(): void
    {
        $this->seedBatch(10, 60.00);
        $sale = $this->sales->post($this->saleData('credit', [['qty' => 5, 'unit_price' => 100.00]]));
        $this->receivePayment($sale->id, 150.00);
        $this->assertEqualsWithDelta(350.00, $this->arBalance(), 0.001);

        // The owner approves their own write-off (session-authenticated, no second PIN needed)
        $this->from('/x')->post($this->v3("sales/{$sale->id}/write-off"), [
            'reason' => 'Uncollectable', 'approved_by' => (string) $this->user->id,
        ])->assertSessionHasNoErrors();

        // 6700 did not exist in this store's chart — it is provisioned as a debit-normal expense
        $this->assertDatabaseHas('accounts', [
            'tenant_id' => $this->tenantId, 'code' => '6700', 'name' => 'Bad Debt Expense', 'type' => 'expense', 'normal_balance' => 'debit',
        ]);

        $je = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'bad_debt')->where('reference', $sale->id)->first();
        $this->assertNotNull($je);
        $this->assertSame($this->customerId, $je->party_id);
        // Only the OUTSTANDING 350 is written off — never the 150 already collected
        $this->assertLine($je->id, '6700', 350.00, 0);
        $this->assertLine($je->id, '1200', 0, 350.00, $this->customerId);
        $this->assertSame(2, DB::table('journal_items')->where('journal_entry_id', $je->id)->count());

        $this->assertEqualsWithDelta(0.00, $this->arBalance(), 0.001);
        $this->assertEqualsWithDelta(350.00, $this->accountBalance('6700'), 0.001);
        $this->assertEqualsWithDelta(0.00, $this->accountBalance('1200'), 0.001);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'payment_status' => 'written_off']);

        // A fully-paid invoice can never be written off
        $paid = $this->sales->post($this->saleData('cash', [['qty' => 1, 'unit_price' => 100.00]]));
        $this->from('/x')->post($this->v3("sales/{$paid->id}/write-off"), ['reason' => 'x', 'approved_by' => (string) $this->user->id])
            ->assertSessionHasErrors('sale');
        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'bad_debt')->count());

        $this->assertAllEntriesBalance();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/{$path}";
    }

    /** Create a store member with a role and (hashed) action PIN. */
    private function member(string $role, ?string $pin = null): User
    {
        $user = User::factory()->create(['last_store_id' => $this->tenant->id]);
        TenantUser::create([
            'tenant_id'    => $this->tenant->id,
            'user_id'      => $user->id,
            'role'         => $role,
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
            'security_pin' => $pin ? Hash::make($pin) : null,
        ]);
        return $user;
    }

    private function seedBatch(float $qty, float $cost, int $daysAgo = 1): string
    {
        $id = (string) Str::uuid();
        DB::table('inventory_batches')->insert([
            'id' => $id, 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $qty, 'initial_qty' => $qty,
            'remaining_qty' => $qty, 'unit_cost' => $cost,
            'created_at' => now()->subDays($daysAgo), 'updated_at' => now()->subDays($daysAgo),
        ]);
        return $id;
    }

    /** SaleService::post() payload. */
    private function saleData(string $method, array $lines, array $extra = []): array
    {
        return array_merge([
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => now()->toDateString(),
            'payment_method' => $method,
            'items'          => array_map(fn ($l) => array_merge([
                'product_id' => $this->productId, 'sale_uom' => 'PCS',
            ], $l), $lines),
        ], $extra);
    }

    /** V3 checkout (POST /v3/sales) payload. */
    private function httpSale(string $method, array $lines): array
    {
        return $this->saleData($method, $lines);
    }

    private function paymentPayload(string $saleId, float $amount, ?float $allocate = null, string $method = 'cash'): array
    {
        return [
            'customer_id'    => $this->customerId,
            'payment_date'   => now()->toDateString(),
            'payment_method' => $method,
            'amount'         => $amount,
            'allocations'    => [['sale_id' => $saleId, 'amount' => $allocate ?? $amount]],
        ];
    }

    /** B4 through POST /v3/customer-payments; returns the payment journal entry id. */
    private function receivePayment(string $saleId, float $amount, string $method = 'cash'): string
    {
        $before = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'customer_payment')->pluck('id')->all();

        $this->from('/x')->post($this->v3('customer-payments'), $this->paymentPayload($saleId, $amount, null, $method))
            ->assertSessionHasNoErrors();

        $new = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'customer_payment')
            ->whereNotIn('id', $before)->pluck('id')->all();
        $this->assertCount(1, $new, 'Exactly one B4 entry per customer payment.');
        return $new[0];
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
        return $id;
    }

    private function assertLine(string $entryId, string $code, float $debit, float $credit, ?string $partyId = null): void
    {
        $q = DB::table('journal_items')->where('journal_entry_id', $entryId)->where('account_id', $this->accountId($code))
            ->where('debit', $debit)->where('credit', $credit);
        if ($partyId !== null) {
            $q->where('party_id', $partyId);
        }
        $this->assertTrue($q->exists(), sprintf(
            'Expected journal line %s DR %.2f / CR %.2f%s on entry %s. Found: %s',
            $code, $debit, $credit, $partyId ? " (party {$partyId})" : '', $entryId,
            DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('ji.journal_entry_id', $entryId)->get(['a.code', 'ji.debit', 'ji.credit', 'ji.party_id'])->toJson()
        ));
    }

    private function assertNoLine(string $entryId, string $code): void
    {
        $id = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
        $this->assertSame(0, DB::table('journal_items')->where('journal_entry_id', $entryId)->where('account_id', $id)->count(),
            "Entry {$entryId} must not touch account {$code}.");
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

    /** What the test customer owes on 1200 (debit − credit). */
    private function arBalance(bool $liveOnly = true): float
    {
        $q = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $this->tenantId)->where('a.code', '1200')
            ->whereRaw('COALESCE(ji.party_id, je.party_id) = ?', [$this->customerId]);
        if ($liveOnly) {
            $q->where('je.is_reversed', 0);
        }
        return round((float) $q->selectRaw('COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as bal')->value('bal'), 2);
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
            $this->assertEqualsWithDelta((float) $r->dr, (float) $r->cr, 0.001, "Entry {$r->journal_entry_id} is unbalanced (DR {$r->dr} / CR {$r->cr}).");
        }
    }

    private function seedAccount(string $code, string $name, string $type, string $normalBalance): void
    {
        if (!DB::table('accounts')->where('code', $code)->where('tenant_id', $this->tenantId)->exists()) {
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
