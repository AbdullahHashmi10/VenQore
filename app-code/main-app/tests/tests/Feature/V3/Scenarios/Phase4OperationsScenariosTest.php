<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use App\Services\V3\ManufacturingService;
use App\Services\V3\PurchaseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * PHASE 4 — Production, payroll, expenses, bank and controls.
 *
 * Replaces the Phase 4 "[STUB]" entries of ScenarioStubsTest with real
 * scenarios: S-062, S-013, S-014, S-073, S-078, S-082, S-083, S-095, S-096,
 * S-097, S-098, S-104, S-104b, S-107.
 *
 * House style of ScenarioStubsTest (RefreshDatabase, real tenant/user, real
 * services and the real HTTP routes the app uses), with ONE deliberate
 * difference: the chart of accounts is NOT hand-seeded. setUp() provisions the
 * store through TenantDefaultSeeder::seedFor() — the exact code path a new
 * store goes through — so every scenario proves the posting works on the
 * chart a real store actually has (which does NOT contain 1011, 1350, 2400,
 * 6100, 6400, 6410, 6900, 6950 or 6960 until a posting creates them).
 *
 * Account codes follow system_brain/MASTER_SPEC.md (Financial Bible v3.0):
 *   B7 DR 6100 / CR 2400 · B8 DR 2400 / CR 1000|1010 (+ CR 1350 advance)
 *   B13 DR 6000 (+ DR 2300 input tax) / CR 1000|1010
 *   B16 production DR 6400 / CR 1100, labor DR 6410 / CR 1000|1010 (external)
 *       or CR 2400 (salaried), completion DR 1100 / CR 6400 + CR 6410
 *   B17 bank transfer DR destination / CR source
 *   B28 DR 6900 / CR 1000 (manager-approved, narration mandatory)
 *   B29 DR 6950 / CR 1100, then DR 1000|1010 / CR 6960, both keyed by disaster_claims.id
 */
class Phase4OperationsScenariosTest extends VenQoreTestCase
{
    private const PIN = '482915';
    private const MANAGER_PIN = '731946';

    private Tenant $tenant;
    private User   $user;
    private string $tenantId;
    private string $warehouseId;
    private string $supplierId;

    private ManufacturingService $manufacturing;
    private FifoService          $fifo;
    private AccountingService    $accounting;
    private PurchaseService      $purchases;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant   = Tenant::factory()->create();
        $this->tenantId = $this->tenant->id;
        app()->instance('current.tenant', $this->tenant);

        $this->user = User::factory()->create([
            'last_store_id' => $this->tenant->id,
        ]);
        $this->bindMember($this->user, 'owner');
        DB::table('tenant_users')
            ->where('tenant_id', $this->tenant->id)
            ->where('user_id', $this->user->id)
            ->update(['security_pin' => Hash::make(self::PIN)]);
        $this->actingAs($this->user);

        // Real store provisioning: chart of accounts, default warehouse,
        // expense categories, cash account (same path as store creation).
        $this->seedTenantDefaults($this->tenant);

        $this->warehouseId = (string) DB::table('warehouses')
            ->where('tenant_id', $this->tenantId)
            ->where('is_default', 1)
            ->value('id') ?: $this->seedWarehouse();

        $this->manufacturing = app(ManufacturingService::class);
        $this->fifo          = app(FifoService::class);
        $this->accounting    = app(AccountingService::class);
        $this->purchases     = app(PurchaseService::class);

        $this->supplierId = (string) Str::uuid();
        DB::table('parties')->insert([
            'id'         => $this->supplierId,
            'tenant_id'  => $this->tenantId,
            'name'       => 'Raw Material Supplier',
            'type'       => 'supplier',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // BANK / CASH
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-062 Bank transfer (B16) — correct debit and credit accounts */
    public function s062_bank_transfer_b16_correct_accounts(): void
    {
        // ── (a) V3 endpoint — cash deposited into the main bank ─────────────
        $this->post($this->v3('bank-transfers'), [
            'description'   => 'Daily cash deposit',
            'transfer_date' => now()->toDateString(),
            'amount'        => 2500.75,
            'from_account'  => '1000',
            'to_account'    => '1010',
        ])->assertSessionHasNoErrors();

        $this->assertEntryLines('bank_transfer', [
            ['1010', 2500.75, 0],
            ['1000', 0, 2500.75],
        ]);

        // ── (b) main bank → "Bank Account — Other" (1011). 1011 is an allowed
        //       destination but is not in a new store's chart; the posting
        //       must still land on 1011, not fail. ──────────────────────────
        $this->post($this->v3('bank-transfers'), [
            'description'   => 'Move to payroll bank',
            'transfer_date' => now()->toDateString(),
            'amount'        => 1000.00,
            'from_account'  => '1010',
            'to_account'    => '1011',
        ])->assertSessionHasNoErrors();

        $this->assertEntryLines('bank_transfer', [
            ['1011', 1000.00, 0],
            ['1010', 0, 1000.00],
        ]);

        // Same source and destination is rejected and posts nothing
        $this->post($this->v3('bank-transfers'), [
            'description'   => 'Pointless',
            'transfer_date' => now()->toDateString(),
            'amount'        => 10.00,
            'from_account'  => '1010',
            'to_account'    => '1010',
        ])->assertSessionHasErrors('to_account');
        $this->assertSame(2, $this->entryCount('bank_transfer'));

        $this->assertMoneyEquals(-2500.75, $this->balance('1000'));
        $this->assertMoneyEquals(1500.75, $this->balance('1010'));
        $this->assertMoneyEquals(1000.00, $this->balance('1011'));

        // ── (c) The Funds screen (UI path: /funds/transfer) — cash → bank ──
        // Fund the till first with a real B15 capital injection.
        $this->post($this->v3('funds'), [
            'type'             => 'injection',
            'description'      => 'Owner capital',
            'transaction_date' => now()->toDateString(),
            'amount'           => 10000.00,
            'payment_method'   => 'cash',
            'passcode'         => self::PIN,
        ])->assertSessionHasNoErrors();

        $bankAccountId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankAccountId,
            'tenant_id'       => $this->tenantId,
            'name'            => 'Main Bank',
            'bank_name'       => 'Main Bank',
            'type'            => 'bank',
            'account_type'    => 'current',
            'opening_balance' => 0,
            'current_balance' => 0,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->post("/s/{$this->tenant->slug}/funds/transfer", [
            'from_type'  => 'cash',
            'to_type'    => 'bank',
            'to_bank_id' => $bankAccountId,
            'amount'     => 4000.00,
            'reason'     => 'Deposit',
            'passcode'   => self::PIN,
        ])->assertSessionHasNoErrors()->assertSessionMissing('error');

        $this->assertEntryLines('fund_transfer', [
            ['1010', 4000.00, 0],
            ['1000', 0, 4000.00],
        ]);

        // 1000: -2500.75 + 10000 - 4000 ; 1010: 1500.75 + 4000
        $this->assertMoneyEquals(3499.25, $this->balance('1000'));
        $this->assertMoneyEquals(5500.75, $this->balance('1010'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-083 Operating expense (B13) posts to 6000 */
    public function s083_operating_expense_b13_posts_correctly(): void
    {
        // ── (a) The Expenses screen (UI path: POST /s/{slug}/expenses) ──────
        $categoryId = DB::table('expense_categories')
            ->where('tenant_id', $this->tenantId)
            ->where('name', 'Utilities')
            ->value('id');
        $this->assertNotNull($categoryId, 'TenantDefaultSeeder must provide expense categories');

        $response = $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'date'                => now()->toDateString(),
            'expense_category_id' => $categoryId,
            'amount'              => 12000.00,
            'tax_amount'          => 1800.00,
            'payment_method'      => 'cash',
            'description'         => 'Electricity bill',
        ]);
        $response->assertOk()->assertJson(['success' => true]);
        $expenseId = $response->json('expense.id');

        // DR 6000 net · DR 2300 input tax (recoverable asset, same account the
        // purchase flow and the tax summary use) · CR 1000 cash for the total.
        $this->assertEntryLines('expense', [
            ['6000', 12000.00, 0],
            ['2300', 1800.00, 0],
            ['1000', 0, 13800.00],
        ], $expenseId);

        // The tax summary report must see that input tax.
        $summary = app(\App\Services\FinancialReportingService::class)
            ->getTaxSummary(now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString());
        $this->assertMoneyEquals(1800.00, (float) ($summary['input_tax'] ?? $summary['inputTax'] ?? -1),
            'Input tax on an expense must reach the tax summary (account 2300)');

        // ── (b) V3 endpoint — bank-paid expense, no tax ─────────────────────
        $this->post($this->v3('expenses'), [
            'description'    => 'Shop rent',
            'expense_date'   => now()->toDateString(),
            'amount'         => 30000.00,
            'payment_method' => 'bank',
        ])->assertSessionHasNoErrors();

        $this->assertEntryLines('operating_expense', [
            ['6000', 30000.00, 0],
            ['1010', 0, 30000.00],
        ]);

        $this->assertMoneyEquals(42000.00, $this->balance('6000'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-073 Future-dated transaction blocked beyond 30 days */
    public function s073_future_dated_transaction_blocked(): void
    {
        // Dates are judged on the STORE's clock (TenantMiddleware applies the
        // store timezone), so build them on that clock too.
        $far = $this->storeDate(31);

        $bomProduct = $this->seedProduct('FG-DATE');
        $rawProduct = $this->seedProduct('RM-DATE', 'KG');
        $bomId = $this->seedBom($bomProduct, [['product_id' => $rawProduct, 'qty_per_unit' => 1]]);
        $employeeId = $this->createEmployee('Date Tester', 40000);
        $manager = $this->createMember('manager', self::MANAGER_PIN);

        $attempts = [
            'bank-transfers'  => ['transfer_date', ['description' => 'x', 'amount' => 10, 'from_account' => '1000', 'to_account' => '1010']],
            'expenses'        => ['expense_date',  ['description' => 'x', 'amount' => 10, 'payment_method' => 'cash']],
            'payroll/accrue'  => ['accrual_date',  ['period' => '2026-10', 'lines' => [['employee_id' => $employeeId, 'gross_salary' => 40000]]]],
            'payroll/pay'     => ['payment_date',  ['employee_id' => $employeeId, 'gross_salary' => 40000, 'payment_method' => 'cash']],
            'cash-shortages'  => ['shortage_date', ['amount' => 50, 'narration' => 'Till short at close of shift', 'approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN]],
            'disaster-claims' => ['loss_date',     ['description' => 'Flood', 'items' => [['product_id' => $rawProduct, 'warehouse_id' => $this->warehouseId, 'qty' => 1]]]],
            'production-runs' => ['run_date',      ['bom_id' => $bomId, 'warehouse_id' => $this->warehouseId, 'planned_qty' => 1]],
        ];

        foreach ($attempts as $uri => [$dateField, $payload]) {
            $this->post($this->v3($uri), $payload + [$dateField => $far])
                ->assertSessionHasErrors($dateField);
        }

        // The Expenses screen (legacy UI endpoint) — beyond the 30-day window
        $categoryId = DB::table('expense_categories')->where('tenant_id', $this->tenantId)->value('id');
        $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'date'                => $far,
            'expense_category_id' => $categoryId,
            'amount'              => 500.00,
            'payment_method'      => 'cash',
        ])->assertStatus(422)->assertJsonValidationErrors('date');

        // Nothing at all reached the ledger or the stock/claim tables
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenantId)->count());
        $this->assertSame(0, DB::table('production_runs')->where('tenant_id', $this->tenantId)->count());
        $this->assertSame(0, DB::table('expenses')->where('tenant_id', $this->tenantId)->count());

        // Within the window (rulebook: "allow up to 30 days") the Expenses
        // screen accepts a post-dated bill.
        $this->postJson("/s/{$this->tenant->slug}/expenses", [
            'date'                => $this->storeDate(30),
            'expense_category_id' => $categoryId,
            'amount'              => 500.00,
            'payment_method'      => 'cash',
        ])->assertOk();
        $this->assertSame(1, DB::table('expenses')->where('tenant_id', $this->tenantId)->count());
    }

    // ═══════════════════════════════════════════════════════════════════
    // PAYROLL
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-082 Salary accrual (B7) posts to 6100 and 2400 */
    public function s082_salary_accrual_b7_posts_correctly(): void
    {
        $alice = $this->createEmployee('Alice', 50000);
        $bob   = $this->createEmployee('Bob', 35000.50);

        $this->post($this->v3('payroll/accrue'), [
            'period'       => now()->format('Y-m'),
            'accrual_date' => now()->toDateString(),
            'lines'        => [
                ['employee_id' => $alice, 'gross_salary' => 50000.00],
                ['employee_id' => $bob,   'gross_salary' => 35000.50],
            ],
        ])->assertSessionHasNoErrors();

        // One entry for the whole payroll run, exactly DR 6100 / CR 2400
        $this->assertSame(1, $this->entryCount('salary_accrual'));
        $this->assertEntryLines('salary_accrual', [
            ['6100', 85000.50, 0],
            ['2400', 0, 85000.50],
        ]);

        $this->assertMoneyEquals(85000.50, $this->balance('6100'));
        $this->assertMoneyEquals(-85000.50, $this->balance('2400')); // credit balance = liability owed
        $this->assertMoneyEquals(0.00, $this->balance('1000'), 'Accrual moves no cash');
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-078 Salary payment (B8) with advance deduction */
    public function s078_salary_payment_with_advance_deduction(): void
    {
        $employeeId = $this->createEmployee('Imran', 50000);

        // Advance of Rs.3,000 given earlier (DR 1350 / CR 1000). The product has
        // no endpoint that issues employee advances, so it is posted directly
        // through AccountingService — the same service every endpoint uses.
        $this->accounting->getAccountByCode('1350', 'Employee Advance', 'asset');
        $this->accounting->createEntry([
            'date'           => now()->toDateString(),
            'reference_type' => 'employee_advance',
            'reference'      => $employeeId,
            'description'    => 'Salary advance',
        ], [
            ['account_code' => '1350', 'debit' => 3000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => 3000.00],
        ]);

        // B7 accrue the month
        $this->post($this->v3('payroll/accrue'), [
            'period'       => now()->format('Y-m'),
            'accrual_date' => now()->toDateString(),
            'lines'        => [['employee_id' => $employeeId, 'gross_salary' => 50000.00]],
        ])->assertSessionHasNoErrors();

        // Guard: deduction larger than the outstanding advance is refused
        $this->post($this->v3('payroll/pay'), [
            'employee_id'       => $employeeId,
            'payment_date'      => now()->toDateString(),
            'gross_salary'      => 50000.00,
            'advance_deduction' => 3000.01 + 5,
            'payment_method'    => 'cash',
        ])->assertSessionHasErrors('advance_deduction');
        $this->assertSame(0, $this->entryCount('salary_payment'));

        // B8 pay: gross 50,000 − advance 3,000 = 47,000 net cash
        $this->post($this->v3('payroll/pay'), [
            'employee_id'       => $employeeId,
            'payment_date'      => now()->toDateString(),
            'gross_salary'      => 50000.00,
            'advance_deduction' => 3000.00,
            'payment_method'    => 'cash',
        ])->assertSessionHasNoErrors();

        $this->assertEntryLines('salary_payment', [
            ['2400', 50000.00, 0],
            ['1000', 0, 47000.00],
            ['1350', 0, 3000.00],
        ], $employeeId);

        $this->assertMoneyEquals(0.00, $this->balance('2400'), 'Salary payable fully settled');
        $this->assertMoneyEquals(0.00, $this->balance('1350'), 'Advance fully recovered');
        $this->assertMoneyEquals(-50000.00, $this->balance('1000'), '3,000 advance + 47,000 net pay left the till');
        $this->assertMoneyEquals(50000.00, $this->balance('6100'));

        // The advance is gone, so a second deduction is refused
        $this->post($this->v3('payroll/pay'), [
            'employee_id'       => $employeeId,
            'payment_date'      => now()->toDateString(),
            'gross_salary'      => 1000.00,
            'advance_deduction' => 500.00,
            'payment_method'    => 'cash',
        ])->assertSessionHasErrors('advance_deduction');

        $this->assertTrialBalanceZero($this->tenant);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRODUCTION (B16 in the rulebook numbering)
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-013 Production run deducts BOM materials at FIFO cost */
    public function s013_production_deducts_bom_materials_fifo(): void
    {
        $fg  = $this->seedProduct('TABLE');
        $rm1 = $this->seedProduct('TIMBER', 'KG');
        $rm2 = $this->seedProduct('VARNISH', 'LTR');

        // Two real purchases of timber at different costs, one of varnish
        $this->buyStock($rm1, 6, 50.00);
        $this->buyStock($rm1, 100, 55.00);
        $this->buyStock($rm2, 100, 20.00);
        $inventoryBefore = $this->balance('1100');
        $timberStockBefore = (float) DB::table('products')->where('id', $rm1)->value('stock_quantity');

        // 1 table = 2 KG timber + 1 LTR varnish
        $bomId = $this->seedBom($fg, [
            ['product_id' => $rm1, 'qty_per_unit' => 2],
            ['product_id' => $rm2, 'qty_per_unit' => 1],
        ]);

        $run = $this->manufacturing->startRun([
            'bom_id'       => $bomId,
            'planned_qty'  => 5,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);

        // Timber needs 10 KG: oldest batch 6 @ 50 = 300, then 4 @ 55 = 220
        // Varnish needs 5 LTR @ 20 = 100 → material 620.00
        $this->assertMoneyEquals(620.00, (float) $run->material_cost);

        $materials = DB::table('production_run_materials as m')
            ->join('inventory_batches as b', 'b.id', '=', 'm.inventory_batch_id')
            ->where('m.production_run_id', $run->id)
            ->orderBy('b.product_id')->orderBy('m.unit_cost')
            ->get(['b.product_id', 'm.qty_deducted', 'm.unit_cost', 'm.total_cost'])
            ->map(fn ($r) => [$r->product_id, (float) $r->qty_deducted, (float) $r->unit_cost, (float) $r->total_cost])
            ->all();
        $expected = [
            [$rm1, 6.0, 50.0, 300.0],
            [$rm1, 4.0, 55.0, 220.0],
            [$rm2, 5.0, 20.0, 100.0],
        ];
        usort($expected, fn ($a, $b) => [$a[0], $a[2]] <=> [$b[0], $b[2]]);
        $this->assertEquals($expected, $materials);

        // Oldest batch exhausted, newer one partially used
        $this->assertEquals([0.0, 96.0], DB::table('inventory_batches')
            ->where('product_id', $rm1)->orderBy('unit_cost')
            ->pluck('remaining_qty')->map(fn ($q) => (float) $q)->all());

        // B16 step 1: DR 6400 / CR 1100 at FIFO cost, exactly
        $this->assertEntryLines('production_start', [
            ['6400', 620.00, 0],
            ['1100', 0, 620.00],
        ], $run->id);
        $this->assertMoneyEquals($inventoryBefore - 620.00, $this->balance('1100'));

        // Physical stock follows the batches
        $this->assertMoneyEquals($timberStockBefore - 10,
            (float) DB::table('products')->where('id', $rm1)->value('stock_quantity'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-014 Sub-assembly BOM resolves 5 levels deep */
    public function s014_sub_assembly_bom_five_levels(): void
    {
        $raw = $this->seedProduct('STEEL', 'KG');
        $levels = [];
        for ($i = 1; $i <= 6; $i++) {
            $levels[$i] = $this->seedProduct("ASSY-L{$i}");
        }

        // BOM builder (POST /v3/boms): L1 = 2 KG steel, Ln = 2 × L(n-1)
        $this->postBom($levels[1], $raw)->assertSessionHasNoErrors();
        for ($i = 2; $i <= 5; $i++) {
            $this->postBom($levels[$i], $levels[$i - 1])->assertSessionHasNoErrors();
        }
        $this->assertSame(5, DB::table('bill_of_materials')
            ->where('tenant_id', $this->tenantId)->where('is_active', 1)->count());

        // Depth limit: a 6th level of nesting is refused
        $this->postBom($levels[6], $levels[5])->assertSessionHasErrors('items');
        $this->assertFalse(DB::table('bill_of_materials')->where('product_id', $levels[6])->exists());

        // Circular BOM: making L1 depend on L4 (which already depends on L1)
        // is refused, and L1's existing active BOM survives untouched.
        $l1BomBefore = DB::table('bill_of_materials')->where('product_id', $levels[1])->where('is_active', 1)->value('id');
        $this->postBom($levels[1], $levels[4])->assertSessionHasErrors('items');
        $this->assertSame($l1BomBefore, DB::table('bill_of_materials')
            ->where('product_id', $levels[1])->where('is_active', 1)->value('id'));

        // Resolve all 5 levels bottom-up: 1 × L5 needs 2 L4, 4 L3, 8 L2, 16 L1, 32 KG steel
        $this->buyStock($raw, 32, 50.00);
        $plan = [1 => 16, 2 => 8, 3 => 4, 4 => 2, 5 => 1];
        $unitCosts = [];
        foreach ($plan as $level => $qty) {
            $bomId = DB::table('bill_of_materials')->where('product_id', $levels[$level])->where('is_active', 1)->value('id');
            $run = $this->manufacturing->startRun([
                'bom_id'       => $bomId,
                'planned_qty'  => $qty,
                'warehouse_id' => $this->warehouseId,
                'run_date'     => now()->toDateString(),
            ]);
            $batch = $this->manufacturing->completeRun($run->id, $qty);
            $unitCosts[$level] = (float) $batch->unit_cost;
        }

        // Cost rolls up through every level: 100, 200, 400, 800, 1600
        $this->assertEquals([1 => 100.0, 2 => 200.0, 3 => 400.0, 4 => 800.0, 5 => 1600.0], $unitCosts);

        // All sub-assemblies consumed; only the single top-level unit remains
        foreach ([1, 2, 3, 4] as $level) {
            $this->assertMoneyEquals(0.0, (float) DB::table('inventory_batches')
                ->where('product_id', $levels[$level])->sum('remaining_qty'), "L{$level} fully consumed");
        }
        $this->assertMoneyEquals(0.0, (float) DB::table('inventory_batches')->where('product_id', $raw)->sum('remaining_qty'));
        $this->assertMoneyEquals(1.0, (float) DB::table('inventory_batches')->where('product_id', $levels[5])->sum('remaining_qty'));

        // Value conserved: 1,600 of steel became one 1,600 L5; clearing accounts net to zero
        $this->assertMoneyEquals(1600.00, $this->balance('1100'));
        $this->assertMoneyEquals(0.00, $this->balance('6400'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-095 Production run with external labor (B17 Path A) */
    public function s095_production_external_labor_path_a(): void
    {
        [$fg, $bomId] = $this->standardBom(); // 120.00 of material per unit

        // Path A, paid from the till
        $this->post($this->v3('production-runs'), [
            'bom_id'       => $bomId,
            'warehouse_id' => $this->warehouseId,
            'planned_qty'  => 5,
            'run_date'     => now()->toDateString(),
            'labor_cost'   => 300.00,
            'labor_type'   => 'external',
        ])->assertSessionHasNoErrors();
        $runId = (string) session('run_id');
        $this->assertNotSame('', $runId);

        $this->assertEntryLines('production_labor', [
            ['6410', 300.00, 0],
            ['1000', 0, 300.00],
        ], $runId);

        // Path A, paid by bank
        $this->post($this->v3('production-runs'), [
            'bom_id'       => $bomId,
            'warehouse_id' => $this->warehouseId,
            'planned_qty'  => 1,
            'run_date'     => now()->toDateString(),
            'labor_cost'   => 80.00,
            'labor_type'   => 'external',
            'labor_bank'   => true,
        ])->assertSessionHasNoErrors();
        $bankRunId = (string) session('run_id');

        $this->assertEntryLines('production_labor', [
            ['6410', 80.00, 0],
            ['1010', 0, 80.00],
        ], $bankRunId);

        // Completion capitalises material + external labor into inventory
        $this->post($this->v3("production-runs/{$runId}/complete"), ['actual_qty' => 5])
            ->assertSessionHasNoErrors();

        $this->assertEntryLines('production_complete', [
            ['1100', 900.00, 0],   // 600 material + 300 labor
            ['6400', 0, 600.00],
            ['6410', 0, 300.00],
        ], $runId);

        $this->assertMoneyEquals(-380.00, $this->balance('1000') + $this->balance('1010'),
            'External labor is a real cash outflow (300 cash + 80 bank)');
        $this->assertMoneyEquals(180.00, (float) DB::table('inventory_batches')
            ->where('production_run_id', $runId)->where('product_id', $fg)->value('unit_cost'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-096 Production run with salaried labor (B17 Path B) */
    public function s096_production_salaried_labor_path_b(): void
    {
        [$fg, $bomId] = $this->standardBom();

        // Salaried staff — even if the form's "paid by bank" box is ticked,
        // Path B must never touch cash or bank.
        $this->post($this->v3('production-runs'), [
            'bom_id'       => $bomId,
            'warehouse_id' => $this->warehouseId,
            'planned_qty'  => 5,
            'run_date'     => now()->toDateString(),
            'labor_cost'   => 450.00,
            'labor_type'   => 'internal',
            'labor_bank'   => true,
        ])->assertSessionHasNoErrors();
        $runId = (string) session('run_id');

        $this->assertEntryLines('production_labor', [
            ['6410', 450.00, 0],
            ['2400', 0, 450.00],
        ], $runId);

        $this->post($this->v3("production-runs/{$runId}/complete"), ['actual_qty' => 5])
            ->assertSessionHasNoErrors();

        $this->assertEntryLines('production_complete', [
            ['1100', 1050.00, 0], // 600 material + 450 applied salaried labor
            ['6400', 0, 600.00],
            ['6410', 0, 450.00],
        ], $runId);

        // No cash outflow anywhere in the run
        $cashLines = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.tenant_id', $this->tenantId)
            ->where('je.reference', $runId)
            ->whereIn('a.code', ['1000', '1010', '1011'])
            ->count();
        $this->assertSame(0, $cashLines);
        $this->assertMoneyEquals(-450.00, $this->balance('2400'), 'Owed to salaried staff, not paid out');
        $this->assertMoneyEquals(210.00, (float) DB::table('inventory_batches')
            ->where('production_run_id', $runId)->where('product_id', $fg)->value('unit_cost'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-097 Production run completes with correct per-unit cost */
    public function s097_production_run_correct_unit_cost(): void
    {
        [$fg, $bomId] = $this->standardBom();

        // Planned 5 → material 5 × 120 = 600, external labor 150 → total 750
        $run = $this->manufacturing->startRun([
            'bom_id'       => $bomId,
            'planned_qty'  => 5,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
            'labor_cost'   => 150.00,
            'labor_type'   => 'external',
        ]);

        // Only 4 good units come off the line: the full 750 is carried by 4
        $batch = $this->manufacturing->completeRun($run->id, 4);

        $this->assertSame($fg, $batch->product_id);
        $this->assertSame('manufactured', $batch->batch_type);
        $this->assertEquals(4.0, (float) $batch->initial_qty);
        $this->assertEquals(4.0, (float) $batch->remaining_qty);
        $this->assertMoneyEquals(187.50, (float) $batch->unit_cost);   // 750 / 4

        $updated = DB::table('production_runs')->where('id', $run->id)->first();
        $this->assertSame('completed', $updated->status);
        $this->assertEquals(4.0, (float) $updated->actual_qty);
        $this->assertMoneyEquals(750.00, (float) $updated->total_cost);

        // Batch value equals what was capitalised to 1100
        $this->assertEntryLines('production_complete', [
            ['1100', 750.00, 0],
            ['6400', 0, 600.00],
            ['6410', 0, 150.00],
        ], $run->id);
        $this->assertMoneyEquals(750.00, 4 * (float) $batch->unit_cost);

        // Selling one unit later costs exactly the per-unit production cost
        $cogs = $this->fifo->deductStock($fg, $this->warehouseId, 1);
        $this->assertMoneyEquals(187.50, array_sum(array_column($cogs, 'total_cost')));
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-098 WIP balance clears to zero on production completion */
    public function s098_wip_balance_clears_on_completion(): void
    {
        [$fg, $bomId] = $this->standardBom();

        $run = $this->manufacturing->startRun([
            'bom_id'       => $bomId,
            'planned_qty'  => 5,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
            'labor_cost'   => 250.00,
            'labor_type'   => 'internal',
        ]);

        // While in progress: WIP = material + labor, held in the 6400/6410
        // clearing accounts (this product does not post to 1150).
        $this->assertMoneyEquals(850.00, (float) DB::table('production_runs')->where('id', $run->id)->value('wip_balance'));
        $this->assertMoneyEquals(600.00, $this->balance('6400'));
        $this->assertMoneyEquals(250.00, $this->balance('6410'));

        $this->manufacturing->completeRun($run->id, 5);

        $updated = DB::table('production_runs')->where('id', $run->id)->first();
        $this->assertSame('completed', $updated->status);
        $this->assertMoneyEquals(0.00, (float) $updated->wip_balance);
        $this->assertNotNull($updated->completed_at);

        // Every clearing account is back to zero — nothing is left "in progress"
        $this->assertMoneyEquals(0.00, $this->balance('6400'));
        $this->assertMoneyEquals(0.00, $this->balance('6410'));
        $this->assertFalse(DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenantId)->where('a.code', '1150')->exists(),
            'No WIP (1150) postings are left behind');

        // The run's total cost now sits in finished-goods inventory
        $this->assertMoneyEquals(850.00, (float) DB::table('inventory_batches')
            ->where('production_run_id', $run->id)->where('product_id', $fg)
            ->selectRaw('SUM(remaining_qty * unit_cost) v')->value('v'));

        // A completed run cannot be completed again
        $this->expectException(\Illuminate\Database\RecordNotFoundException::class);
        $this->manufacturing->completeRun($run->id, 5);
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTROLS
    // ═══════════════════════════════════════════════════════════════════

    /** @test S-104 Cash shortage (B28) blocked for non-manager */
    public function s104_cash_shortage_b28_blocked_for_non_manager(): void
    {
        $cashier      = $this->createMember('cashier', '135790');
        $otherCashier = $this->createMember('cashier', '135790');
        $manager      = $this->createMember('manager', self::MANAGER_PIN);

        // A manager of a DIFFERENT store is not a manager here
        $otherTenant  = Tenant::factory()->create();
        $foreignManager = User::factory()->create(['last_store_id' => $otherTenant->id]);
        TenantUser::create([
            'tenant_id' => $otherTenant->id, 'user_id' => $foreignManager->id,
            'role' => 'manager', 'status' => 'active',
            'display_name' => $foreignManager->name, 'joined_at' => now(),
        ]);

        $payload = fn (User $approver) => [
            'amount'        => 750.00,
            'shortage_date' => now()->toDateString(),
            'narration'     => 'Till short by 750 at evening close',
            'approved_by'   => (string) $approver->id,
            'approval_pin'  => $approver->id === $manager->id ? self::MANAGER_PIN : '135790',
        ];

        $this->actingAs($cashier);
        foreach ([$cashier, $otherCashier, $foreignManager] as $approver) {
            $this->post($this->v3('cash-shortages'), $payload($approver))
                ->assertSessionHasErrors('approved_by');
        }
        $this->assertSame(0, $this->entryCount('cash_shortage'));

        // Manager-approved shortage posts DR 6900 / CR 1000
        $this->post($this->v3('cash-shortages'), $payload($manager))->assertSessionHasNoErrors();

        $this->assertEntryLines('cash_shortage', [
            ['6900', 750.00, 0],
            ['1000', 0, 750.00],
        ]);
        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'cash_shortage')->first();
        $this->assertSame((string) $manager->id, (string) $entry->approved_by);
        $this->assertSame((string) $cashier->id, (string) $entry->user_id);
        $this->assertTrialBalanceZero($this->tenant);
    }

    /** @test S-104b Cash shortage (B28) requires mandatory narration */
    public function s104b_cash_shortage_b28_requires_narration(): void
    {
        $manager = $this->createMember('manager', self::MANAGER_PIN);
        $base = [
            'amount'        => 120.00,
            'shortage_date' => now()->toDateString(),
            'approved_by'   => (string) $manager->id,
            'approval_pin'  => self::MANAGER_PIN,
        ];

        $this->post($this->v3('cash-shortages'), $base)->assertSessionHasErrors('narration');
        $this->post($this->v3('cash-shortages'), $base + ['narration' => ''])->assertSessionHasErrors('narration');
        $this->post($this->v3('cash-shortages'), $base + ['narration' => 'short'])->assertSessionHasErrors('narration');
        $this->assertSame(0, $this->entryCount('cash_shortage'));

        $narration = 'Counted 120 short; coins miscounted at shift change';
        $this->post($this->v3('cash-shortages'), $base + ['narration' => $narration])->assertSessionHasNoErrors();

        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'cash_shortage')->first();
        $this->assertSame($narration, $entry->narration, 'Narration is stored on the journal entry');
        $this->assertEntryLines('cash_shortage', [
            ['6900', 120.00, 0],
            ['1000', 0, 120.00],
        ]);
    }

    /** @test S-107 Insurance claim (B29) two steps linked by disaster_claim_id */
    public function s107_insurance_claim_b29_two_steps_linked(): void
    {
        $product = $this->seedProduct('RICE-BAG');
        $this->buyStock($product, 6, 40.00);
        $this->buyStock($product, 10, 45.00);
        $stockBefore = (float) DB::table('products')->where('id', $product)->value('stock_quantity');

        // ── Step 1: flood destroys 10 bags (FIFO: 6 @ 40 + 4 @ 45 = 420) ────
        $this->post($this->v3('disaster-claims'), [
            'description' => 'Warehouse flood',
            'loss_date'   => now()->toDateString(),
            'items'       => [['product_id' => $product, 'warehouse_id' => $this->warehouseId, 'qty' => 10]],
        ])->assertSessionHasNoErrors();

        $claim = DB::table('disaster_claims')->where('tenant_id', $this->tenantId)->first();
        $this->assertNotNull($claim, 'The claim must belong to this store');
        $this->assertMoneyEquals(420.00, (float) $claim->loss_amount);
        $this->assertSame('recovery_pending', $claim->status);

        $this->assertEntryLines('disaster_loss', [
            ['6950', 420.00, 0],
            ['1100', 0, 420.00],
        ], $claim->id);
        $lossEntryId = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'disaster_loss')->value('id');
        $this->assertSame($lossEntryId, $claim->loss_journal_entry_id);

        // Destroyed goods leave both the FIFO batches and the physical stock
        $this->assertMoneyEquals(6.0, (float) DB::table('inventory_batches')->where('product_id', $product)->sum('remaining_qty'));
        $this->assertMoneyEquals($stockBefore - 10,
            (float) DB::table('products')->where('id', $product)->value('stock_quantity'));

        // ── Step 2: insurer pays 300 into the bank ──────────────────────────
        $this->post($this->v3("disaster-claims/{$claim->id}/recover"), [
            'recovery_amount' => 300.00,
            'recovery_date'   => now()->toDateString(),
            'payment_method'  => 'bank',
        ])->assertSessionHasNoErrors();

        $this->assertEntryLines('insurance_recovery', [
            ['1010', 300.00, 0],
            ['6960', 0, 300.00],
        ], $claim->id);

        $closed = DB::table('disaster_claims')->where('id', $claim->id)->first();
        $recoveryEntryId = DB::table('journal_entries')->where('tenant_id', $this->tenantId)
            ->where('reference_type', 'insurance_recovery')->value('id');
        $this->assertSame('closed', $closed->status);
        $this->assertMoneyEquals(300.00, (float) $closed->recovery_amount);
        $this->assertSame($recoveryEntryId, $closed->recovery_journal_entry_id);

        // Both steps carry the same claim id as their reference
        $this->assertEquals(
            ['disaster_loss' => $claim->id, 'insurance_recovery' => $claim->id],
            DB::table('journal_entries')->where('tenant_id', $this->tenantId)
                ->whereIn('reference_type', ['disaster_loss', 'insurance_recovery'])
                ->pluck('reference', 'reference_type')->all()
        );

        // A closed claim cannot be recovered twice
        $this->post($this->v3("disaster-claims/{$claim->id}/recover"), [
            'recovery_amount' => 50.00,
            'recovery_date'   => now()->toDateString(),
            'payment_method'  => 'cash',
        ])->assertSessionHasErrors('claim');
        $this->assertSame(1, $this->entryCount('insurance_recovery'));

        // Net loss after recovery: 420 − 300 = 120
        $this->assertMoneyEquals(120.00, $this->balance('6950') + $this->balance('6960'));
        $this->assertTrialBalanceZero($this->tenant);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    /** Y-m-d on the store's own clock, $days from today. */
    private function storeDate(int $days = 0): string
    {
        $tz = \App\Helpers\SettingsHelper::get('timezone') ?: config('app.timezone');
        return \Illuminate\Support\Carbon::now($tz)->addDays($days)->toDateString();
    }

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/" . ltrim($path, '/');
    }

    private function bindMember(User $user, string $role): void
    {
        TenantUser::create([
            'tenant_id'    => $this->tenant->id,
            'user_id'      => $user->id,
            'role'         => $role,
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
        ]);
    }

    private function createMember(string $role, ?string $pin = null): User
    {
        $user = User::factory()->create(['last_store_id' => $this->tenant->id]);
        $this->bindMember($user, $role);
        if ($pin !== null) {
            // Action PIN: an approver who is not the logged-in user must supply it (ManagerApproval).
            DB::table('tenant_users')->where('tenant_id', $this->tenant->id)->where('user_id', $user->id)
                ->update(['security_pin' => Hash::make($pin)]);
        }
        return $user;
    }

    /** Create an employee through the real endpoint (POST /v3/employees). */
    private function createEmployee(string $name, float $salary): string
    {
        $this->post($this->v3('employees'), [
            'name'           => $name,
            'monthly_salary' => $salary,
            'hire_date'      => now()->subYear()->toDateString(),
        ])->assertSessionHasNoErrors();

        $id = DB::table('employees')->where('tenant_id', $this->tenantId)->where('name', $name)->value('id');
        $this->assertNotNull($id, "Employee {$name} must be created inside this store");
        return (string) $id;
    }

    /** Credit purchase through the real PurchaseService (creates batch + stock + journal). */
    private function buyStock(string $productId, float $qty, float $unitCost): void
    {
        $this->purchases->store([
            'supplier_id'    => $this->supplierId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => now()->toDateString(),
            'payment_method' => 'credit',
            'items'          => [[
                'product_id' => $productId,
                'qty'        => $qty,
                'unit_cost'  => $unitCost,
                'tax_rate'   => 0,
            ]],
        ]);
    }

    /** Finished good + BOM (2 KG @ 50 + 1 LTR @ 20 = 120 per unit), materials in stock. */
    private function standardBom(): array
    {
        $fg  = $this->seedProduct('CHAIR');
        $rm1 = $this->seedProduct('WOOD', 'KG');
        $rm2 = $this->seedProduct('GLUE', 'LTR');
        $this->buyStock($rm1, 100, 50.00);
        $this->buyStock($rm2, 100, 20.00);

        $bomId = $this->seedBom($fg, [
            ['product_id' => $rm1, 'qty_per_unit' => 2],
            ['product_id' => $rm2, 'qty_per_unit' => 1],
        ]);

        return [$fg, $bomId];
    }

    private function postBom(string $productId, string $componentId)
    {
        return $this->post($this->v3('boms'), [
            'product_id'     => $productId,
            'version'        => 1,
            'effective_from' => now()->toDateString(),
            'items'          => [['product_id' => $componentId, 'qty_per_unit' => 2, 'is_byproduct' => false]],
        ]);
    }

    private function seedProduct(string $sku, string $baseUnit = 'PCS'): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id'             => $id,
            'tenant_id'      => $this->tenantId,
            'name'           => $sku,
            'sku'            => $sku . '-' . Str::random(4),
            'price'          => 100.00,
            'cost_price'     => 50.00,
            'base_unit'      => $baseUnit,
            'stock_quantity' => 0,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        return $id;
    }

    private function seedBom(string $productId, array $items): string
    {
        $bomId = (string) Str::uuid();
        DB::table('bill_of_materials')->insert([
            'id'             => $bomId,
            'tenant_id'      => $this->tenantId,
            'product_id'     => $productId,
            'version'        => 1,
            'effective_from' => now()->toDateString(),
            'is_active'      => 1,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        foreach ($items as $item) {
            DB::table('bom_items')->insert([
                'id'            => (string) Str::uuid(),
                'tenant_id'     => $this->tenantId,
                'bom_id'        => $bomId,
                'product_id'    => $item['product_id'],
                'qty_per_unit'  => $item['qty_per_unit'],
                'is_byproduct'  => 0,
                'byproduct_nrv' => 0,
                'created_at'    => now(),
            ]);
        }
        return $bomId;
    }

    private function seedWarehouse(): string
    {
        $id = (string) Str::uuid();
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

    /** Signed balance (debits − credits) of an account over non-reversed entries. */
    private function balance(string $code): float
    {
        return (float) (DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('je.tenant_id', $this->tenantId)
            ->where('a.tenant_id', $this->tenantId)
            ->where('a.code', $code)
            ->where('je.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) AS b')
            ->value('b') ?? 0);
    }

    private function entryCount(string $referenceType): int
    {
        return DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', $referenceType)
            ->count();
    }

    /**
     * Exact line-set of a journal entry identified by reference_type
     * [+ reference]: no missing, extra or wrong lines, and it balances. When
     * several entries share the reference_type, exactly one of them must
     * carry the expected line-set.
     *
     * @param array<int, array{0:string,1:float,2:float}> $expected [code, debit, credit]
     */
    private function assertEntryLines(string $referenceType, array $expected, ?string $reference = null): void
    {
        $q = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('reference_type', $referenceType);
        if ($reference !== null) {
            $q->where('reference', $reference);
        }
        $entryIds = $q->pluck('id')->all();
        $label = $referenceType . ($reference !== null ? " / {$reference}" : '');
        $this->assertNotEmpty($entryIds, "No journal entry for {$label}");

        $norm = function (array $lines): array {
            $lines = array_map(fn ($l) => [(string) $l[0], round((float) $l[1], 2), round((float) $l[2], 2)], $lines);
            sort($lines);
            return $lines;
        };
        $want = $norm($expected);

        $seen = [];
        foreach ($entryIds as $entryId) {
            $seen[] = $norm(DB::table('journal_items as ji')
                ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('ji.journal_entry_id', $entryId)
                ->get(['a.code', 'ji.debit', 'ji.credit'])
                ->map(fn ($r) => [$r->code, $r->debit, $r->credit])->all());
        }
        $matches = array_values(array_filter($seen, fn ($lines) => $lines === $want));

        $this->assertCount(1, $matches, "Journal line-set mismatch for {$label}.\nExpected: "
            . json_encode($want) . "\nActual entries: " . json_encode($seen));
        $this->assertMoneyEquals(
            array_sum(array_column($matches[0], 1)),
            array_sum(array_column($matches[0], 2)),
            "Entry {$label} must balance"
        );
    }
}
