<?php

namespace Tests\Feature\V3\Scenarios;

use App\Http\Middleware\DatabaseHealthCheck;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use App\Services\V3\AccountingService;
use App\Services\V3\PurchaseService;
use App\Services\V3\SaleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Phase 5 (Reports & Dashboard) + Phase 6 (Infrastructure) scenarios.
 *
 * Replaces the seven [STUB] entries at the bottom of ScenarioStubsTest.php with
 * real tests against the production code paths:
 *   - PurchaseService / SaleService / FifoService / AccountingService (writers)
 *   - GET /s/{slug}/v3/reports/* (FinancialReportingService — readers)
 *   - GET /s/{slug}/v3/dashboard + Reckoner (dashboard widgets)
 *   - POST /s/{slug}/v3/fiscal-year/close (FiscalYearController)
 *   - DatabaseHealthCheck + DrmOfflineLockMiddleware + /ping (connection guard)
 *   - AuditService (audit_logs)
 *
 * House style follows ScenarioStubsTest: manual tenant/account/party/warehouse
 * seeding, real service calls, exact hand-calculated amounts.
 */
class Phase56ReportsInfraScenariosTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User   $user;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;   // "Widget"  — price 100
    private string $product2Id;  // "Gadget"  — price 30
    private string $customerId;
    private string $customer2Id;
    private string $supplierId;

    private SaleService       $sales;
    private PurchaseService   $purchases;
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();

        // Pin the clock mid-afternoon so posted_at timestamps carry a real
        // time-of-day component (exactly what the POS path writes) and date
        // boundaries are deterministic.
        $this->travelTo(Carbon::now()->setTime(14, 30, 0));

        $this->tenant = Tenant::factory()->create([
            'plan'          => 'ltd_3',
            'status'        => 'active',
            'trial_ends_at' => null,
            'timezone'      => 'UTC',
        ]);
        $this->tenantId = $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);

        $this->user = User::factory()->create(['last_store_id' => $this->tenant->id]);
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
        $this->accounting = app(AccountingService::class);

        $this->seedAccount('1000', 'Cash in Hand',           'asset',     'debit');
        $this->seedAccount('1010', 'Bank Account',           'asset',     'debit');
        $this->seedAccount('1100', 'Inventory Asset',        'asset',     'debit');
        $this->seedAccount('1200', 'Accounts Receivable',    'asset',     'debit');
        $this->seedAccount('2000', 'Accounts Payable',       'liability', 'credit');
        $this->seedAccount('2100', 'Sales Tax Payable',      'liability', 'credit');
        $this->seedAccount('2300', 'Input Tax Recoverable',  'asset',     'debit');
        $this->seedAccount('3000', "Owner's Capital",        'equity',    'credit');
        $this->seedAccount('3100', 'Retained Earnings',      'equity',    'credit');
        $this->seedAccount('4000', 'Sales Revenue',          'income',    'credit');
        $this->seedAccount('5000', 'Cost of Goods Sold',     'expense',   'debit');
        $this->seedAccount('6000', 'Operating Expenses',     'expense',   'debit');
        $this->seedAccount('7000', 'Opening Balance Equity', 'equity',    'credit');

        $this->warehouseId = $this->seedWarehouse();
        $this->productId   = $this->seedProduct('Test Widget', 100.00, 60.00);
        $this->product2Id  = $this->seedProduct('Test Gadget', 30.00, 20.00);
        $this->customerId  = $this->seedParty('Test Customer', 'customer');
        $this->customer2Id = $this->seedParty('Second Customer', 'customer');
        $this->supplierId  = $this->seedParty('Test Supplier', 'supplier');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 5 — Reports & Dashboard
    // ═══════════════════════════════════════════════════════════════════

    /** S-R1: Trial Balance 1100 == SUM(remaining_qty * unit_cost) == Inventory Valuation report */
    #[Test]
    public function s_report_1100_equals_batch_valuation(): void
    {
        // Purchases at deliberately "awkward" unit costs.
        $this->purchase($this->productId, 10, 45.50, 'cash');    // 455.00
        $this->purchase($this->productId, 8, 47.25, 'credit');   // 378.00
        $this->purchase($this->product2Id, 5, 19.99, 'cash');    //  99.95

        // FIFO sale spanning both Widget batches: 10 @ 45.50 + 2 @ 47.25 = 549.50
        $saleA = $this->sale($this->customerId, [[$this->productId, 12, 100.00]], 'credit');
        // Gadget: 2 @ 19.99 = 39.98
        $this->sale($this->customerId, [[$this->product2Id, 2, 30.00]], 'cash', 60.00);

        // Partial return of 1 Widget from sale A restores 1 unit to the batch it came from (47.25).
        $saleItemA = DB::table('sale_items')->where('tenant_id', $this->tenantId)->where('sale_id', $saleA->id)->value('id');
        $this->sales->reverse($saleA->id, 'One widget back', null, [
            ['sale_item_id' => $saleItemA, 'return_qty' => 1],
        ]);

        // Hand-calculated: Widget 7 @ 47.25 = 330.75 ; Gadget 3 @ 19.99 = 59.97 → 390.72
        $expected = 390.72;

        $batchValuation = round((float) DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)
            ->whereNull('deleted_at')
            ->sum(DB::raw('remaining_qty * unit_cost')), 2);
        $this->assertEqualsWithDelta($expected, $batchValuation, 0.001, 'Batch valuation (remaining_qty * unit_cost)');

        $ledger1100 = $this->accounting->getBalance('1100');
        $this->assertEqualsWithDelta($expected, $ledger1100, 0.001, 'Ledger 1100 must equal FIFO batch valuation');

        // Trial Balance report (HTTP, the route the UI uses)
        $tb = $this->getJson($this->v3('reports/trial-balance'))->assertOk()->json();
        $tb1100 = collect($tb['rows'])->firstWhere('code', '1100');
        $this->assertEqualsWithDelta($expected, (float) $tb1100['balance'], 0.001, 'Trial Balance 1100');
        $this->assertTrue($tb['balanced'], 'Trial Balance must balance');
        $this->assertEqualsWithDelta($tb['grand_debit'], $tb['grand_credit'], 0.001);

        // Inventory Valuation report shows the same number (grand total AND sum of rows)
        $iv = $this->getJson($this->v3('reports/inventory-valuation'))->assertOk()->json();
        $this->assertEqualsWithDelta($expected, (float) $iv['grand_total'], 0.001, 'Inventory valuation grand_total');
        $this->assertEqualsWithDelta($expected, round(collect($iv['rows'])->sum('stock_value'), 2), 0.001, 'Sum of valuation rows');

        $widgetRow = collect($iv['rows'])->firstWhere('product_id', $this->productId);
        $this->assertEqualsWithDelta(7.0, (float) $widgetRow['total_qty'], 0.0001);
        $this->assertEqualsWithDelta(330.75, (float) $widgetRow['stock_value'], 0.001);
        $gadgetRow = collect($iv['rows'])->firstWhere('product_id', $this->product2Id);
        $this->assertEqualsWithDelta(3.0, (float) $gadgetRow['total_qty'], 0.0001);
        $this->assertEqualsWithDelta(59.97, (float) $gadgetRow['stock_value'], 0.001);
    }

    /** S-R2: Trial Balance 5000 == SUM(sale_item_batches COGS) == COGS report == P&L cogs */
    #[Test]
    public function s_report_5000_equals_sale_item_batches(): void
    {
        $this->purchase($this->productId, 10, 45.50, 'cash');
        $this->purchase($this->productId, 8, 47.25, 'cash');
        $this->purchase($this->product2Id, 5, 19.99, 'cash');

        // Sale A (V3 path: date-only sale_date → posted_at midnight): 12 Widgets
        //   FIFO 10 @ 45.50 + 2 @ 47.25 = 549.50
        $saleA = $this->sale($this->customerId, [[$this->productId, 12, 100.00]], 'credit');

        // Sale B through the real POS checkout (POST /s/{slug}/sales), which stamps
        // posted_at with the time of day (14:30 today): 2 Gadgets = 39.98
        $saleBId = $this->posSale($this->customerId, $this->product2Id, 2, 30.00);
        $this->assertSame(now()->format('Y-m-d H:i'), Carbon::parse(DB::table('sales')->where('id', $saleBId)->value('posted_at'))->format('Y-m-d H:i'));

        // Sale C: 1 Widget @ 47.25, then fully returned → contributes nothing.
        $saleC = $this->sale($this->customer2Id, [[$this->productId, 1, 100.00]], 'cash', 100.00);
        $this->sales->reverse($saleC->id, 'Full return');

        // Partial return of 2 Widgets from sale A. Restoration walks the newest
        // batch first, so the whole 2 @ 47.25 slice (94.50) comes back:
        // Sale A COGS 549.50 → 455.00, status partially_returned.
        $saleItemA = DB::table('sale_items')->where('tenant_id', $this->tenantId)->where('sale_id', $saleA->id)->value('id');
        $this->sales->reverse($saleA->id, 'Two widgets back', null, [
            ['sale_item_id' => $saleItemA, 'return_qty' => 2],
        ]);
        $this->assertDatabaseHas('sales', ['id' => $saleA->id, 'status' => 'partially_returned']);

        // Hand-calculated: 455.00 + 39.98 = 494.98
        $expected = 494.98;

        $ledger5000 = $this->accounting->getBalance('5000');
        $this->assertEqualsWithDelta($expected, $ledger5000, 0.001, 'Ledger 5000');

        // Every live (non-reversed) sale_item_batches row is the COGS that is still on the books.
        $sibCogs = round((float) DB::table('sale_item_batches')
            ->where('tenant_id', $this->tenantId)
            ->where('is_reversed', 0)
            ->sum('total_cogs'), 2);
        $this->assertEqualsWithDelta($expected, $sibCogs,
            0.001, 'SUM(sale_item_batches.total_cogs WHERE is_reversed = 0) must equal ledger 5000');

        // A sale_item_batches row whose whole slice was returned must be flagged reversed,
        // with the same flag FifoService::restoreStock() uses.
        $this->assertSame(0, DB::table('sale_item_batches')
            ->where('tenant_id', $this->tenantId)
            ->whereNotNull('reversed_at')
            ->where('is_reversed', 0)
            ->count(), 'Partially-returned SIB rows must carry is_reversed = 1 once fully restored');

        $tb = $this->getJson($this->v3('reports/trial-balance'))->assertOk()->json();
        $this->assertEqualsWithDelta($expected, (float) collect($tb['rows'])->firstWhere('code', '5000')['balance'], 0.001, 'Trial Balance 5000');

        $today = now()->toDateString();
        $cogs = $this->getJson($this->v3("reports/cogs?from={$today}&to={$today}"))->assertOk()->json();
        $this->assertEqualsWithDelta($expected, (float) $cogs['total_cogs'], 0.001, 'COGS report total_cogs');
        $this->assertEqualsWithDelta($expected, (float) $cogs['ledger_5000'], 0.001, 'COGS report ledger_5000');
        $this->assertTrue($cogs['reconciled'], 'COGS report must reconcile to ledger 5000');

        $pl = $this->getJson($this->v3("reports/profit-loss?from={$today}&to={$today}"))->assertOk()->json();
        $this->assertEqualsWithDelta($expected, (float) $pl['cogs'], 0.001, 'P&L cogs');
    }

    /** S-R3: Aged receivables total == 1200 balance (credit sales, partial payments, a return) */
    #[Test]
    public function s_report_aged_ar_equals_1200_balance(): void
    {
        $this->purchase($this->productId, 20, 60.00, 'cash');

        // Customer 1: two credit invoices, 150 paid against the first.
        $sale1 = $this->sale($this->customerId, [[$this->productId, 4, 100.00]], 'credit');   // 400
        $sale2 = $this->sale($this->customerId, [[$this->productId, 2, 100.00]], 'credit');   // 200
        $this->customerPayment($this->customerId, 150.00, [[$sale1->id, 150.00]]);

        // Customer 2: credit invoice 3 @ 120 = 360, 100 paid, then 1 unit (120) returned.
        $sale3 = $this->sale($this->customer2Id, [[$this->productId, 3, 120.00]], 'credit');
        $this->customerPayment($this->customer2Id, 100.00, [[$sale3->id, 100.00]]);
        $item3 = DB::table('sale_items')->where('tenant_id', $this->tenantId)->where('sale_id', $sale3->id)->value('id');
        $this->postJson($this->v3("sales/{$sale3->id}/return"), [
            'return_date' => now()->toDateString(),
            'reason'      => 'One unit damaged',
            'items'       => [['sale_item_id' => $item3, 'return_qty' => 1]],
        ])->assertRedirect()->assertSessionHasNoErrors();

        // A fully-paid cash sale must not appear anywhere in AR.
        $this->sale($this->customer2Id, [[$this->productId, 1, 100.00]], 'cash', 100.00);

        $this->assertDatabaseHas('sales', ['id' => $sale1->id, 'payment_status' => 'partial']);
        $this->assertDatabaseHas('sales', ['id' => $sale3->id, 'status' => 'partially_returned']);

        // Hand-calculated: C1 = 250 + 200 = 450 ; C2 = 360 − 100 − 120 = 140 → 590
        $ledger1200 = $this->accounting->getBalance('1200');
        $this->assertEqualsWithDelta(590.00, $ledger1200, 0.001, 'Ledger 1200');

        $aged = $this->getJson($this->v3('reports/aged-receivables'))->assertOk()->json();
        $this->assertEqualsWithDelta($ledger1200, (float) $aged['total'], 0.001, 'Aged receivables total must equal 1200');
        $this->assertEqualsWithDelta($ledger1200, round(array_sum(array_map('floatval', $aged['summary'])), 2), 0.001,
            'Aged bucket summary must add up to 1200');

        // Per-party: each customer's aged rows must equal that customer's own 1200 sub-ledger.
        $rows = collect($aged['rows']);
        foreach ([$this->customerId => 450.00, $this->customer2Id => 140.00] as $partyId => $expected) {
            $agedParty = round($rows->where('party_id', $partyId)->sum('outstanding'), 2);
            $glParty   = $this->partyArBalance($partyId);
            $this->assertEqualsWithDelta($expected, $agedParty, 0.001, "Aged AR for party {$partyId}");
            $this->assertEqualsWithDelta($expected, $glParty, 0.001, "1200 sub-ledger for party {$partyId}");
        }

        // The return credited AR against the customer (not an anonymous 1200 line).
        $this->assertSame(0, DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenantId)
            ->where('a.code', '1200')
            ->whereNull('ji.party_id')
            ->count(), 'Every 1200 line must carry the customer party_id');

        // Dashboard receivables widget shows the same figure.
        $dash = $this->getJson($this->v3('dashboard'))->assertOk()->json();
        $this->assertEqualsWithDelta($ledger1200, (float) $dash['receivables'], 0.001);
    }

    /** S-R4: Dashboard cash widget reads the ledger (AccountingService) and nothing else */
    #[Test]
    public function s_report_dashboard_cash_from_accounting_service(): void
    {
        // Owner capital injection: DR 1000 / CR 3000 2,000.00
        $this->accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'capital', 'reference' => 'CAP-1',
            'description' => 'Owner capital',
        ], [
            ['account_code' => '1000', 'debit' => 2000.00, 'credit' => 0],
            ['account_code' => '3000', 'debit' => 0, 'credit' => 2000.00],
        ]);
        $this->purchase($this->productId, 10, 45.50, 'cash');                          // −455.00
        $this->sale($this->customerId, [[$this->productId, 3, 100.00]], 'cash', 300.00); // +300.00

        $expected = 1845.00;
        $this->assertEqualsWithDelta($expected, $this->accounting->getBalance('1000'), 0.001);
        $this->assertDashboardCash($expected);

        // ── Tamper with every NON-ledger table that "looks like" cash ─────────
        DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1000')->update(['balance' => 999999.99]);
        DB::table('sales')->where('tenant_id', $this->tenantId)->update([
            'total' => 77777, 'invoice_total' => 77777, 'tendered_amount' => 77777,
        ]);
        DB::table('payments')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'party_id' => $this->customerId,
            'amount' => 5000.00, 'type' => 'in', 'method' => 'cash',
            'reference' => 'Rogue payment row (no journal)', 'date' => now()->toDateString(),
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('bank_accounts')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'name' => 'Rogue Till',
            'account_type' => 'cash', 'type' => 'cash',
            'current_balance' => 12345.00, 'opening_balance' => 12345.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        Cache::flush();

        $this->assertDashboardCash($expected);

        // ── A ledger movement MUST move it ─────────────────────────────────────
        $expense = $this->accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'expense', 'reference' => 'EXP-1',
            'description' => 'Tea for staff',
        ], [
            ['account_code' => '6000', 'debit' => 45.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => 45.00],
        ]);
        Cache::flush();
        $this->assertDashboardCash(1800.00);

        // ...and reversing it through the ledger moves it back.
        $this->accounting->reverseEntry($expense->id, 'Entered in error');
        Cache::flush();
        $this->assertDashboardCash($expected);
    }

    /** S-R5 (Task 6.8): 7000 nets to zero after fiscal year close; P&L zeroed into 3100 */
    #[Test]
    public function s_report_7000_nets_zero_after_fiscal_close(): void
    {
        // B19 opening balances (7000 is the auto-mirror): Cash 5,000 + stock 20 @ 60 = 1,200,
        // financed by Owner's Capital 6,200 → 7000 nets to zero.
        $this->postJson($this->v3('opening-balances'), [
            'entry_date' => now()->toDateString(),
            'entries' => [
                ['account_code' => '1000', 'amount' => 5000.00, 'side' => 'debit'],
                ['account_code' => '3000', 'amount' => 6200.00, 'side' => 'credit'],
            ],
            'stock_entries' => [
                ['product_id' => $this->productId, 'warehouse_id' => $this->warehouseId, 'qty' => 20, 'unit_cost' => 60.00],
            ],
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertEqualsWithDelta(0.00, $this->accounting->getBalance('7000'), 0.001, '7000 after B19');

        // Trading: revenue 300, COGS 180, expense 50.25 → net profit 69.75
        $this->sale($this->customerId, [[$this->productId, 3, 100.00]], 'cash', 300.00);
        $this->accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'expense', 'reference' => 'EXP-FY',
            'description' => 'Electricity',
        ], [
            ['account_code' => '6000', 'debit' => 50.25, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => 50.25],
        ]);

        $approver = $this->seedMember('admin', '424242');
        $yearEnd  = now()->toDateString();

        $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => $yearEnd,
            'approved_by'     => $approver->id,
            'approval_pin'    => '424242',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $close = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'fiscal_year_close')
            ->first();
        $this->assertNotNull($close, 'Fiscal year close journal must be posted');
        $this->assertSame((string) $approver->id, (string) $close->approved_by);
        $this->assertSame($yearEnd, Carbon::parse($close->date)->toDateString());

        // Closing entry: DR 4000 300 / CR 5000 180 / CR 6000 50.25 / CR 3100 69.75
        $this->assertJournalLines($close->id, [
            '4000' => [300.00, 0], '5000' => [0, 180.00], '6000' => [0, 50.25], '3100' => [0, 69.75],
        ]);

        // All P&L accounts are now zero; profit sits in Retained Earnings.
        foreach (['4000', '5000', '6000'] as $code) {
            $this->assertEqualsWithDelta(0.00, $this->accounting->getBalance($code), 0.001, "{$code} after close");
        }
        $this->assertEqualsWithDelta(69.75, $this->accounting->getBalance('3100'), 0.001, '3100 after close');

        // 7000 — the scenario under test — still nets to exactly zero and was not touched by the close.
        $this->assertEqualsWithDelta(0.00, $this->accounting->getBalance('7000'), 0.001, '7000 after fiscal close');
        $this->assertGreaterThan(0, DB::table('journal_items')->where('account_id', $this->accountId('7000'))->count(),
            '7000 must have real B19 activity (not trivially zero)');
        $this->assertSame(0, DB::table('journal_items')->where('journal_entry_id', $close->id)
            ->where('account_id', $this->accountId('7000'))->count());

        $tb = $this->getJson($this->v3('reports/trial-balance'))->assertOk()->json();
        $this->assertTrue($tb['balanced']);
        $this->assertEqualsWithDelta(0.00, (float) collect($tb['rows'])->firstWhere('code', '7000')['balance'], 0.001);

        // Guards: same year cannot be closed twice; a non-admin cannot approve.
        $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => $yearEnd, 'approved_by' => $approver->id, 'approval_pin' => '424242',
        ])->assertSessionHasErrors('fiscal_year_end');

        $cashier = $this->seedMember('cashier');
        $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => now()->subDay()->toDateString(), 'approved_by' => $cashier->id,
        ])->assertSessionHasErrors('approved_by');

        $this->assertSame(1, DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'fiscal_year_close')->count());
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 6 — Security & Deployment
    // ═══════════════════════════════════════════════════════════════════

    /**
     * S-I1 (Tasks 6.2/6.3): financial writes are blocked when "offline".
     *
     * ConnectionGuard.jsx is a client component (polls GET /ping, disables submit
     * buttons). Its server-side counterparts are:
     *   (a) GET /ping — the liveness probe ConnectionGuard polls;
     *   (b) DatabaseHealthCheck (web group) — 503 on POST/PUT/PATCH/DELETE when the DB is gone;
     *   (c) DrmOfflineLockMiddleware ('drm' on every /v3 route) — 403 once the store
     *       has not been online for > 30 days.
     */
    #[Test]
    public function s_connection_guard_blocks_offline_writes(): void
    {
        // (a) The probe ConnectionGuard polls answers 200 {ok:true} while online.
        $this->get('/ping')->assertOk()->assertExactJson(['ok' => true]);

        // (b) DatabaseHealthCheck is registered on the web group and blocks writes when the DB is unreachable.
        $webGroup = app(\Illuminate\Contracts\Http\Kernel::class)->getMiddlewareGroups()['web'] ?? [];
        $this->assertContains(DatabaseHealthCheck::class, $webGroup);

        $guard     = new DatabaseHealthCheck();
        $reachedDb = false;
        $next      = function () use (&$reachedDb) {
            $reachedDb = true;
            return response()->json(['posted' => true]);
        };

        $defaultConnection = config('database.default');
        config(['database.connections.vq_offline_probe' => array_merge(
            config("database.connections.{$defaultConnection}"),
            ['host' => '127.0.0.1', 'port' => 1, 'options' => [\PDO::ATTR_TIMEOUT => 1]]
        )]);
        try {
            config(['database.default' => 'vq_offline_probe']);
            DB::purge('vq_offline_probe');

            foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $method) {
                $req = Request::create('/s/x/v3/sales', $method, [], [], [], ['HTTP_ACCEPT' => 'application/json']);
                $res = $guard->handle($req, $next);
                $this->assertSame(503, $res->getStatusCode(), "{$method} must be blocked while the DB is offline");
                $this->assertSame('database_unavailable', json_decode($res->getContent(), true)['error']);
            }
            $this->assertFalse($reachedDb, 'No write handler may run while offline');

            // Reads are still served (view-only while offline).
            $res = $guard->handle(Request::create('/s/x/v3/reports/trial-balance', 'GET'), $next);
            $this->assertSame(200, $res->getStatusCode());
            $this->assertTrue($reachedDb);
        } finally {
            config(['database.default' => $defaultConnection]);
            DB::purge('vq_offline_probe');
        }

        // (c) End-to-end through the real /v3 route stack: offline for 31 days → write refused, nothing posted.
        $sale = $this->seedCreditSale();
        $journalCountBefore = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count();

        DB::table('tenants')->where('id', $this->tenantId)->update(['last_online_at' => now()->subDays(31)]);
        Cache::flush();

        $payload = [
            'customer_id' => $this->customerId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 50.00,
            'allocations' => [['sale_id' => $sale->id, 'amount' => 50.00]],
        ];
        $this->postJson($this->v3('customer-payments'), $payload)
            ->assertForbidden()
            ->assertJson(['error' => 'License offline lock active. Please connect to the internet to reactivate.']);

        $this->assertSame($journalCountBefore, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count(),
            'No journal entry may be written while the offline lock is active');
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $sale->id)->count());

        // Back online → the identical write goes through.
        DB::table('tenants')->where('id', $this->tenantId)->update(['last_online_at' => now()]);
        Cache::flush();

        $this->postJson($this->v3('customer-payments'), $payload)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame($journalCountBefore + 1, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertEqualsWithDelta(50.00, (float) DB::table('allocations')->where('sale_id', $sale->id)->sum('allocated_amount'), 0.001);
    }

    /** S-I2 (Task 6.9): every journal entry has an audit row with user, IP and approved_by */
    #[Test]
    public function s_audit_log_records_full_context(): void
    {
        $ip = '203.0.113.77';
        $sale = $this->seedCreditSale();

        // 1) An ordinary (unapproved) write through HTTP: customer payment.
        $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->withHeader('User-Agent', 'VenQore-POS/Test')
            ->postJson($this->v3('customer-payments'), [
                'customer_id' => $this->customerId, 'payment_date' => now()->toDateString(),
                'payment_method' => 'cash', 'amount' => 40.00,
                'allocations' => [['sale_id' => $sale->id, 'amount' => 40.00]],
            ])->assertRedirect()->assertSessionHasNoErrors();

        $paymentJe = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'customer_payment')->first();
        $this->assertNotNull($paymentJe);

        $audit = $this->auditFor($paymentJe->id);
        $this->assertSame((string) $this->user->id, (string) $audit->user_id);
        $this->assertSame($ip, $audit->ip_address);
        $this->assertSame('VenQore-POS/Test', $audit->user_agent);
        $after = json_decode($audit->after, true);
        $this->assertArrayHasKey('approved_by', $after, 'approved_by must always be recorded (null when not required)');
        $this->assertNull($after['approved_by']);
        $this->assertSame('customer_payment', $after['reference_type']);

        // 2) An approval-gated write: fiscal year close with an admin approver.
        $approver = $this->seedMember('admin', '424242');
        $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson($this->v3('fiscal-year/close'), [
                'fiscal_year_end' => now()->toDateString(),
                'approved_by'     => $approver->id,
                'approval_pin'    => '424242',
            ])->assertRedirect()->assertSessionHasNoErrors();

        $closeJe = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'fiscal_year_close')->first();
        $this->assertNotNull($closeJe);
        $this->assertSame((string) $approver->id, (string) $closeJe->approved_by);

        $audit = $this->auditFor($closeJe->id);
        $this->assertSame((string) $this->user->id, (string) $audit->user_id, 'Actor is the logged-in user');
        $this->assertSame($ip, $audit->ip_address);
        $this->assertSame((string) $approver->id, (string) json_decode($audit->after, true)['approved_by'],
            'Approver must be captured on the audit row');

        // 3) Reversal (B25 bounced cheque route) is audited too, with the actor and IP.
        $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson($this->v3("customer-payments/{$paymentJe->id}/bounce"), ['reason' => 'Insufficient funds'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $reversedAudit = DB::table('audit_logs')->where('model_id', $paymentJe->id)->where('event', 'journal_reversed')->first();
        $this->assertNotNull($reversedAudit);
        $this->assertSame((string) $this->user->id, (string) $reversedAudit->user_id);
        $this->assertSame($ip, $reversedAudit->ip_address);

        // 4) "Every entry": each journal entry of this tenant has exactly one journal_posted row,
        //    each with a user and an IP.
        $jeIds = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->pluck('id');
        // sale + payment + fiscal close + bounce reversal
        $this->assertCount(4, $jeIds);
        foreach ($jeIds as $jeId) {
            $rows = DB::table('audit_logs')->where('model_type', 'journal_entry')
                ->where('model_id', $jeId)->where('event', 'journal_posted')->get();
            $this->assertCount(1, $rows, "Journal entry {$jeId} must have exactly one journal_posted audit row");
            $this->assertNotNull($rows[0]->user_id, "Audit row for {$jeId} has no user");
            $this->assertNotEmpty($rows[0]->ip_address, "Audit row for {$jeId} has no IP");
            $this->assertArrayHasKey('approved_by', json_decode($rows[0]->after, true));
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/" . ltrim($path, '/');
    }

    private function purchase(string $productId, float $qty, float $unitCost, string $method): object
    {
        return $this->purchases->store([
            'supplier_id'    => $this->supplierId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => now()->toDateString(),
            'payment_method' => $method,
            'items' => [[
                'product_id' => $productId,
                'qty'        => $qty,
                'unit_cost'  => $unitCost,
                'tax_rate'   => 0,
            ]],
        ]);
    }

    /**
     * @param array<int, array{0:string,1:float,2:float}> $lines [productId, qty, unitPrice]
     */
    private function sale(string $customerId, array $lines, string $method, ?float $received = null): object
    {
        $data = [
            'customer_id'    => $customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => now()->toDateString(),
            'payment_method' => $method,
            'items'          => array_map(fn ($l) => [
                'product_id' => $l[0], 'qty' => $l[1], 'sale_uom' => 'PCS', 'unit_price' => $l[2],
            ], $lines),
        ];
        if ($received !== null) {
            $data['amount_received'] = $received;
        }

        return $this->sales->post($data);
    }

    /** Cash sale through the POS checkout route (SaleController::store). Returns the sale id. */
    private function posSale(string $customerId, string $productId, float $qty, float $price): string
    {
        $res = $this->postJson("/s/{$this->tenant->slug}/sales", [
            'customer_id'    => $customerId,
            'warehouse_id'   => $this->warehouseId,
            'items'          => [['product_id' => $productId, 'quantity' => $qty, 'price' => $price, 'discount' => 0]],
            'discount'       => 0,
            'amount_paid'    => round($qty * $price, 2),
            'payment_method' => 'cash',
        ]);
        $res->assertOk();
        $saleId = $res->json('sale_id');
        $this->assertNotEmpty($saleId, 'POS checkout must return sale_id: ' . $res->getContent());

        return (string) $saleId;
    }

    private function seedCreditSale(): object
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 10, 'initial_qty' => 10,
            'remaining_qty' => 10, 'unit_cost' => 60.00,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return $this->sale($this->customerId, [[$this->productId, 2, 100.00]], 'credit');
    }

    private function customerPayment(string $customerId, float $amount, array $allocations): void
    {
        $this->postJson($this->v3('customer-payments'), [
            'customer_id'    => $customerId,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => $amount,
            'allocations'    => array_map(fn ($a) => ['sale_id' => $a[0], 'amount' => $a[1]], $allocations),
        ])->assertRedirect()->assertSessionHasNoErrors();
    }

    private function partyArBalance(string $partyId): float
    {
        return round((float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('ji.tenant_id', $this->tenantId)
            ->where('ji.account_id', $this->accountId('1200'))
            ->where('ji.party_id', $partyId)
            ->where('je.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0) AS bal')
            ->value('bal'), 2);
    }

    private function assertDashboardCash(float $expected): void
    {
        $ledger = $this->accounting->getBalance('1000');
        $this->assertEqualsWithDelta($expected, $ledger, 0.001, 'AccountingService::getBalance(1000)');

        // V3 dashboard JSON widget
        $dash = $this->getJson($this->v3('dashboard'))->assertOk()->json();
        $this->assertEqualsWithDelta($ledger, (float) $dash['cash'], 0.001, 'V3 dashboard cash widget');

        // Main (Inertia) dashboard cash card
        $res = $this->get("/s/{$this->tenant->slug}/dashboard")->assertOk();
        $props = $res->original->getData()['page']['props'];
        $this->assertEqualsWithDelta($ledger, (float) $props['cashData']['balance'], 0.001, 'Main dashboard cashData.balance');

        // Reckoner "Total Liquidity" (1000–1099 ledger; 1010 is empty in this fixture)
        app()->instance('current.tenant', $this->tenant);
        $reading = (new Reckoner)->read(new ReckonerRequest('finance.total_liquidity', 'live'), $this->user, $this->tenant);
        $this->assertTrue($reading->ok, 'Reckoner finance.total_liquidity must resolve: ' . json_encode($reading));
        $this->assertEqualsWithDelta($ledger, (float) $reading->data['value'], 0.001, 'Reckoner total liquidity');
    }

    private function assertJournalLines(string $journalEntryId, array $expected): void
    {
        $lines = DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $journalEntryId)
            ->get(['a.code', 'ji.debit', 'ji.credit']);

        $this->assertCount(count($expected), $lines, 'Unexpected number of journal lines: ' . json_encode($lines));
        foreach ($expected as $code => [$debit, $credit]) {
            $line = $lines->firstWhere('code', (string) $code);
            $this->assertNotNull($line, "Missing journal line for {$code}");
            $this->assertEqualsWithDelta($debit, (float) $line->debit, 0.001, "{$code} debit");
            $this->assertEqualsWithDelta($credit, (float) $line->credit, 0.001, "{$code} credit");
        }
    }

    private function auditFor(string $journalEntryId): object
    {
        $row = DB::table('audit_logs')
            ->where('model_type', 'journal_entry')
            ->where('model_id', $journalEntryId)
            ->where('event', 'journal_posted')
            ->first();
        $this->assertNotNull($row, "No journal_posted audit row for {$journalEntryId}");

        return $row;
    }

    private function accountId(string $code): string
    {
        return (string) DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', $code)->value('id');
    }

    private function seedMember(string $role, ?string $pin = null): User
    {
        $member = User::factory()->create(['last_store_id' => $this->tenant->id]);
        TenantUser::create([
            'tenant_id'    => $this->tenant->id,
            'user_id'      => $member->id,
            'role'         => $role,
            'status'       => 'active',
            'display_name' => $member->name,
            'joined_at'    => now(),
            // Action PIN: an approver who is not the logged-in user must supply it (ManagerApproval).
            'security_pin' => $pin ? Hash::make($pin) : null,
        ]);

        return $member;
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

    private function seedProduct(string $name, float $price, float $cost): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id'             => $id,
            'tenant_id'      => $this->tenantId,
            'name'           => $name,
            'sku'            => strtoupper(Str::slug($name)) . '-' . Str::random(6),
            'price'          => $price,
            'cost_price'     => $cost,
            'base_unit'      => 'PCS',
            'stock_quantity' => 0,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return $id;
    }

    private function seedParty(string $name, string $type): string
    {
        $id = (string) Str::uuid();
        DB::table('parties')->insert([
            'id'         => $id,
            'tenant_id'  => $this->tenantId,
            'name'       => $name,
            'type'       => $type,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }
}
