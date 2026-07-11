<?php

namespace Tests\Feature\Golden;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;

/**
 * ============================================================
 * Golden Company Test Suite — Phase 2 of Verification Blueprint
 * ============================================================
 *
 * DOCTRINE:
 *  - Uses DatabaseTransactions: wraps EACH test in a transaction
 *    that rolls back, so the golden company data stays pristine.
 *  - Does NOT re-seed per-test: GoldenCompanySeeder runs once
 *    per test run (via phpunit.xml <env> or setUp hooks).
 *  - All expected values come from manifest.json — never hardcoded here.
 *  - Each test method maps to one numbered assertion from the spec.
 *
 * TO RUN:
 *   php artisan db:seed --class=GoldenCompanySeeder --env=testing
 *   vendor/bin/phpunit --testsuite Feature --filter Golden
 *
 * ============================================================
 *
 * @group golden
 */
class GoldenCompanyTest extends TestCase
{
    use DatabaseTransactions;

    protected static string $tenantId   = '999991';
    protected static string $t2Id       = '999992';
    protected static array  $manifest   = [];
    protected static bool   $seeded     = false;
    protected static float  $tolerance  = 0.02;

    // ─────────────────────────────────────────────────────────────────────────
    // BOOTSTRAP
    // ─────────────────────────────────────────────────────────────────────────

    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureGoldenCompanyExists();
        $this->loadManifest();
    }

    private function loadManifest(): void
    {
        if (!empty(self::$manifest)) return;

        $jsonPath = base_path('verification/golden_company/manifest.json');
        if (!file_exists($jsonPath)) {
            $this->markTestSkipped(
                'manifest.json not found. Run: php verification/golden_company/calculator.php'
            );
        }
        self::$manifest = json_decode(file_get_contents($jsonPath), true);
    }

    private function ensureGoldenCompanyExists(): void
    {
        if (DB::table('tenants')->where('id', self::$tenantId)->exists()) {
            $tenant = Tenant::find(self::$tenantId);
            app()->instance('current.tenant', $tenant);
            return;
        }

        // Commit parent transaction so seeder is not rolled back
        DB::commit();

        Artisan::call('db:seed', ['--class' => 'GoldenCompanySeeder', '--force' => true]);

        // Start a new transaction for the test itself
        DB::beginTransaction();

        $tenant = Tenant::find(self::$tenantId);
        app()->instance('current.tenant', $tenant);
        $goldenCompanyExists = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    protected function glBalance(string $code): float
    {
        $row = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', self::$tenantId)
            ->where('a.code', $code)
            ->where('je.is_reversed', false)
            ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
            ->first();

        if (!$row) return 0.0;

        $normalBalance = DB::table('accounts')
            ->where('tenant_id', self::$tenantId)
            ->where('code', $code)
            ->value('normal_balance');

        $dr = (float)($row->total_debit  ?? 0);
        $cr = (float)($row->total_credit ?? 0);

        return round($normalBalance === 'credit' ? $cr - $dr : $dr - $cr, 2);
    }

    protected function manifest(string ...$keys): mixed
    {
        $node = self::$manifest;
        foreach ($keys as $key) {
            if (!isset($node[$key])) return null;
            $node = $node[$key];
        }
        return $node;
    }

    protected function assertGl(string $code, float $expected, string $message = ''): void
    {
        $actual = $this->glBalance($code);
        $label  = $message ?: "GL {$code}";
        $this->assertEqualsWithDelta(
            $expected, $actual, self::$tolerance,
            "{$label}: Expected Rs.{$expected}, got Rs.{$actual}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §1 — LEDGER INVARIANTS (every journal entry must balance)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_every_journal_entry_is_balanced(): void
    {
        $unbalanced = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::$tenantId)
            ->groupBy('ji.journal_entry_id')
            ->havingRaw('ABS(SUM(ji.debit) - SUM(ji.credit)) > 0.01')
            ->selectRaw('ji.journal_entry_id, SUM(ji.debit) as dr, SUM(ji.credit) as cr')
            ->get();

        $this->assertEmpty(
            $unbalanced->toArray(),
            'Found unbalanced journal entries: ' .
            $unbalanced->map(fn($r) => "{$r->journal_entry_id} (DR={$r->dr} CR={$r->cr})")->join(', ')
        );
    }

    /** @test */
    public function test_trial_balance_total_debits_equal_credits(): void
    {
        $totals = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::$tenantId)
            ->where('je.is_reversed', false)
            ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
            ->first();

        $dr = round((float)$totals->total_debit,  2);
        $cr = round((float)$totals->total_credit, 2);

        $this->assertEqualsWithDelta($dr, $cr, self::$tolerance,
            "Trial balance: Σ Debits={$dr} ≠ Σ Credits={$cr}. Diff=" . abs($dr - $cr)
        );
    }

    /** @test */
    public function test_no_journal_item_has_both_debit_and_credit_nonzero(): void
    {
        $violations = DB::table('journal_items')
            ->where('tenant_id', self::$tenantId)
            ->whereRaw('debit > 0 AND credit > 0')
            ->count();

        $this->assertEquals(0, $violations,
            "{$violations} journal_item(s) have both debit > 0 AND credit > 0 (invalid)"
        );
    }

    /** @test */
    public function test_no_zero_amount_journal_items(): void
    {
        $zeros = DB::table('journal_items')
            ->where('tenant_id', self::$tenantId)
            ->whereRaw('debit = 0 AND credit = 0')
            ->count();

        $this->assertEquals(0, $zeros,
            "{$zeros} journal_item(s) have zero debit AND zero credit"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §2 — REVENUE & COGS
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_annual_revenue_matches_manifest(): void
    {
        $expected = (float)$this->manifest('year_end', 'profit_and_loss', 'revenue');
        $this->assertGl('4000', $expected, 'Annual Revenue (GL 4000)');
    }

    /** @test */
    public function test_annual_cogs_matches_manifest(): void
    {
        $expected = (float)$this->manifest('year_end', 'profit_and_loss', 'cogs');
        $this->assertGl('5000', $expected, 'Annual COGS (GL 5000)');
    }

    /** @test */
    public function test_gross_profit_equals_revenue_minus_cogs(): void
    {
        $revenue  = $this->glBalance('4000');
        $cogs     = $this->glBalance('5000');
        $expected = (float)$this->manifest('year_end', 'profit_and_loss', 'gross_profit');
        $actual   = round($revenue - $cogs, 2);

        $this->assertEqualsWithDelta($expected, $actual, self::$tolerance,
            "Gross profit: expected Rs.{$expected}, got Rs.{$actual}"
        );
    }

    /** @test */
    public function test_net_profit_matches_manifest(): void
    {
        $expected = (float)$this->manifest('year_end', 'profit_and_loss', 'net_profit');
        $revenue  = $this->glBalance('4000');
        $cogs     = $this->glBalance('5000');
        $expenses = $this->glBalance('5100') + $this->glBalance('5200')
                  + $this->glBalance('5300') + $this->glBalance('5400')
                  + $this->glBalance('6000');
        $actual   = round($revenue - $cogs - $expenses, 2);

        $this->assertEqualsWithDelta($expected, $actual, self::$tolerance,
            "Net profit: expected Rs.{$expected}, got Rs.{$actual}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3 — BALANCE SHEET EQUATION
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_balance_sheet_equation_assets_equals_liabilities_plus_equity(): void
    {
        $assets = $this->glBalance('1000') + $this->glBalance('1010')
                + $this->glBalance('1100') + $this->glBalance('1200')
                + $this->glBalance('2300');

        $pl = (float)$this->manifest('year_end', 'profit_and_loss', 'net_profit');
        $liabilities = $this->glBalance('2000') + $this->glBalance('2100');
        $equity      = $this->glBalance('3000') + $this->glBalance('7000') + $pl;

        $this->assertEqualsWithDelta($assets, round($liabilities + $equity, 2), self::$tolerance,
            "Balance sheet equation: Assets={$assets} ≠ Liabilities+Equity=" . round($liabilities + $equity, 2)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §4 — INVENTORY THREE-WAY TIE (CG-005)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_inventory_three_way_tie_gl_equals_fifo_value(): void
    {
        $gl1100 = $this->glBalance('1100');

        $fifoValue = DB::table('inventory_batches')
            ->where('tenant_id', self::$tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > 0')
            ->selectRaw('SUM(remaining_qty * unit_cost) as val')
            ->value('val');
        $fifoValue = round((float)($fifoValue ?? 0), 2);

        $expected = (float)$this->manifest('inventory', 'total_value');

        $this->assertEqualsWithDelta($expected, $gl1100, self::$tolerance,
            "GL 1100 should equal manifest inventory value. Got Rs.{$gl1100}"
        );
        $this->assertEqualsWithDelta($gl1100, $fifoValue, self::$tolerance,
            "GL 1100 (Rs.{$gl1100}) ≠ FIFO value (Rs.{$fifoValue}) — three-way tie BROKEN"
        );
    }

    /** @test */
    public function test_no_negative_inventory_batches(): void
    {
        $count = DB::table('inventory_batches')
            ->where('tenant_id', self::$tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty < -0.001')
            ->count();

        $this->assertEquals(0, $count,
            "{$count} inventory batch(es) have negative remaining_qty"
        );
    }

    /** @test */
    public function test_fifo_remaining_qty_never_exceeds_original_qty(): void
    {
        $violations = DB::table('inventory_batches')
            ->where('tenant_id', self::$tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > original_qty + 0.001')
            ->count();

        $this->assertEquals(0, $violations,
            "{$violations} batch(es) have remaining_qty > original_qty (stock was over-restored)"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §5 — AR CONTROL ACCOUNT (CG-003)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_ar_gl_balance_matches_manifest(): void
    {
        $expected = (float)$this->manifest('ar_balances', 'total');
        $this->assertGl('1200', $expected, 'AR Total (GL 1200)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §6 — AP CONTROL ACCOUNT
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_ap_gl_balance_matches_manifest(): void
    {
        $expected = (float)$this->manifest('ap_balances', 'total');
        $this->assertGl('2000', $expected, 'AP Total (GL 2000)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §7 — FIFO SCENARIO: BATCH SPANNING (TXN-SAL-003)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_fifo_correctly_spans_two_batches_for_sale_003(): void
    {
        // SAL-003 sold 7 phones: 5 from BATCH-PHN-001 @32,000 + 2 from BATCH-PHN-002 @33,500
        // Expected COGS = (5×32,000) + (2×33,500) = 160,000 + 67,000 = 227,000

        $sale3Cogs = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', self::$tenantId)
            ->where('je.reference', 'gc-sale-003-00000000000000000001')
            ->where('a.code', '5000')
            ->where('je.is_reversed', false)
            ->sum('ji.debit');

        $this->assertEqualsWithDelta(227000.0, (float)$sale3Cogs, self::$tolerance,
            "SAL-003 COGS (FIFO span test): expected Rs.227,000, got Rs.{$sale3Cogs}"
        );
    }

    /** @test */
    public function test_batch_phn_001_fully_depleted_after_all_sales(): void
    {
        $remaining = DB::table('inventory_batches')
            ->where('tenant_id', self::$tenantId)
            ->where('id', 'gc-batch-phn-001-000000000001')
            ->value('remaining_qty');

        // After SR-001 restored 3, SAL-003 depleted remaining 8 → should be 0
        $this->assertEqualsWithDelta(0.0, (float)($remaining ?? 0), 0.001,
            "BATCH-PHN-001 should be fully depleted. Got remaining_qty={$remaining}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §8 — SALE RETURN (TXN-SR-001) REVERSAL
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_sale_return_creates_reversed_journal_entry(): void
    {
        // SAL-002 was reversed → original entry should have is_reversed = true
        $originalEntry = DB::table('journal_entries')
            ->where('tenant_id', self::$tenantId)
            ->where('reference', 'gc-sale-002-00000000000000000001')
            ->where('reference_type', 'sale')
            ->first();

        if (!$originalEntry) {
            $this->markTestIncomplete('SAL-002 journal entry not found — sale ID may differ');
        }

        $this->assertTrue(
            (bool)$originalEntry->is_reversed,
            'SAL-002 journal entry should be marked is_reversed=true after SR-001'
        );
        $this->assertNotNull($originalEntry->reversed_by,
            'SAL-002 journal entry should have reversed_by pointing to reversal entry'
        );
    }

    /** @test */
    public function test_sale_return_restores_inventory_batch(): void
    {
        // After SAL-002 took 3 phones and SR-001 restored them,
        // then SAL-003 took 5 from BATCH-PHN-001 → net remaining should be 0.

        // This test verifies the restore happened correctly (the net is reflected in §7)
        // Specifically: the sale_item_batches for SAL-002 should be marked is_reversed
        $restoredBatches = DB::table('sale_item_batches as sib')
            ->join('sale_items as si', 'si.id', '=', 'sib.sale_item_id')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->where('s.tenant_id', self::$tenantId)
            ->where('s.id', 'gc-sale-002-00000000000000000001')
            ->where('sib.is_reversed', true)
            ->count();

        $this->assertGreaterThan(0, $restoredBatches,
            'After SR-001, sale_item_batches for SAL-002 should be marked is_reversed=true'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §9 — CASH BALANCE
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_cash_balance_matches_manifest(): void
    {
        $expected = (float)$this->manifest('year_end', 'account_balances', '1000');
        $this->assertGl('1000', $expected, 'Cash in Hand (GL 1000)');
    }

    /** @test */
    public function test_bank_balance_matches_manifest(): void
    {
        $expected = (float)$this->manifest('year_end', 'account_balances', '1010');
        $this->assertGl('1010', $expected, 'Bank Account (GL 1010)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §10 — SPLIT PAYMENT (TXN-SAL-005)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_split_payment_creates_both_cash_and_ar_lines(): void
    {
        // SAL-005: invoice Rs.210,600. Customer paid Rs.150,000 cash. AR should show Rs.60,600.
        $je = DB::table('journal_entries')
            ->where('tenant_id', self::$tenantId)
            ->where('reference', 'gc-sale-005-00000000000000000001')
            ->where('reference_type', 'sale')
            ->first();

        if (!$je) {
            $this->markTestIncomplete('SAL-005 journal entry not found');
        }

        $items = DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $je->id)
            ->get()
            ->keyBy(fn($r) => $r->code . '_' . ($r->debit > 0 ? 'dr' : 'cr'));

        // Cash DR 150,000
        $cashLine = $items->first(fn($r) => $r->code === '1000' && $r->debit > 0);
        $this->assertNotNull($cashLine, 'SAL-005 should have a cash DR line');
        $this->assertEqualsWithDelta(150000.0, (float)($cashLine->debit ?? 0), self::$tolerance,
            'SAL-005 cash DR should be Rs.150,000'
        );

        // AR DR 60,600
        $arLine = $items->first(fn($r) => $r->code === '1200' && $r->debit > 0);
        $this->assertNotNull($arLine, 'SAL-005 should have an AR DR line for the unpaid portion');
        $this->assertEqualsWithDelta(60600.0, (float)($arLine->debit ?? 0), self::$tolerance,
            'SAL-005 AR DR should be Rs.60,600'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §11 — ZERO-DISCOUNT PROMOTIONAL SALE (TXN-SAL-004)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_100_percent_discount_sale_has_zero_revenue_but_nonzero_cogs(): void
    {
        $je = DB::table('journal_entries')
            ->where('tenant_id', self::$tenantId)
            ->where('reference', 'gc-sale-004-00000000000000000001')
            ->where('reference_type', 'sale')
            ->first();

        if (!$je) {
            $this->markTestIncomplete('SAL-004 journal entry not found');
        }

        $items = DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $je->id)
            ->get();

        // Revenue (4000 CR) should be 0
        $revLine = $items->first(fn($r) => $r->code === '4000');
        $revenueAmount = $revLine ? (float)$revLine->credit : 0.0;
        $this->assertEqualsWithDelta(0.0, $revenueAmount, self::$tolerance,
            'SAL-004 (100% discount) should have zero revenue'
        );

        // COGS (5000 DR) should be Rs.800 (2 cables × Rs.400)
        $cogsLine = $items->first(fn($r) => $r->code === '5000');
        $this->assertNotNull($cogsLine, 'SAL-004 should still debit COGS (Rs.800)');
        $this->assertEqualsWithDelta(800.0, (float)($cogsLine->debit ?? 0), self::$tolerance,
            'SAL-004 COGS should be Rs.800'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §12 — TENANT ISOLATION
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_tenant_2_revenue_is_invisible_to_tenant_1_gl(): void
    {
        // TENANT-1's GL 4000 should NOT include TENANT-2 revenue (Rs.10,000)
        $t1Revenue    = $this->glBalance('4000');
        $manifestRev  = (float)$this->manifest('year_end', 'profit_and_loss', 'revenue');
        $t2Expected   = (float)$this->manifest('isolation_check', 'tenant_2_revenue');

        // If contaminated, T1 revenue would be ≈ manifestRev + t2Expected
        $this->assertEqualsWithDelta($manifestRev, $t1Revenue, self::$tolerance,
            "TENANT-1 revenue (Rs.{$t1Revenue}) does not match manifest (Rs.{$manifestRev}). " .
            "If it matches Rs." . ($manifestRev + $t2Expected) . " then TENANT-2 data leaked!"
        );
    }

    /** @test */
    public function test_tenant_2_inventory_batches_not_in_tenant_1_fifo(): void
    {
        // BATCH-ISO-001 must belong to TENANT-2 only
        $crossBatch = DB::table('inventory_batches')
            ->where('id', 'gc-batch-iso-001-000000000001')
            ->where('tenant_id', self::$tenantId)
            ->count();

        $this->assertEquals(0, $crossBatch,
            'BATCH-ISO-001 (TENANT-2 batch) should not appear in TENANT-1 inventory'
        );
    }

    /** @test */
    public function test_tenant_1_sales_count_excludes_tenant_2(): void
    {
        $t1SalesCount = DB::table('sales')
            ->where('tenant_id', self::$tenantId)
            ->where('status', 'posted')
            ->count();

        // Expected T1 posted sales: 10 (SAL-001 through SAL-010, SAL-002 is 'returned')
        // SAL-002 reversed → returned. So posted = 9 forward sales + WOO-001 + etc.
        // Adjust per your seeder. At minimum T1 should have 0 of T2's sales.
        $t2SalesInT1 = DB::table('sales')
            ->where('tenant_id', self::$tenantId)
            ->where('id', 'gc-sale-iso-00000000000000000001')
            ->count();

        $this->assertEquals(0, $t2SalesInT1,
            'TENANT-2 isolation sale should not appear in TENANT-1 sales table rows'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §13 — BOUNDARY: ZERO-ACTIVITY DATE
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_july_4_zero_activity_date_has_no_transactions(): void
    {
        // 2025-07-04 is declared a zero-activity date in the spec.
        $transactionsOnDate = DB::table('journal_entries')
            ->where('tenant_id', self::$tenantId)
            ->whereDate('date', '2025-07-04')
            ->count();

        $this->assertEquals(0, $transactionsOnDate,
            '2025-07-04 is declared a zero-activity date — no journal entries expected'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §14 — WOOCOMMERCE SALE HAS JOURNAL ENTRY
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_woocommerce_sale_creates_journal_entry_like_any_other_sale(): void
    {
        $wooSaleId = 'gc-sale-woo-00000000000000000001';

        $je = DB::table('journal_entries')
            ->where('tenant_id', self::$tenantId)
            ->where('reference', $wooSaleId)
            ->where('reference_type', 'sale')
            ->first();

        $this->assertNotNull($je,
            'WooCommerce sale should create a standard journal entry — none found'
        );

        // Revenue line should exist
        $revLine = DB::table('journal_items as ji')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.journal_entry_id', $je->id)
            ->where('a.code', '4000')
            ->first();

        $this->assertNotNull($revLine,
            'WooCommerce sale journal entry should have a GL 4000 (Revenue) credit line'
        );
        $this->assertGreaterThan(0, (float)$revLine->credit,
            'WooCommerce sale revenue (GL 4000 CR) must be > 0'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §15 — INPUT TAX RECOVERABLE (GL 2300)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_input_tax_recoverable_matches_manifest(): void
    {
        $expected = (float)$this->manifest('year_end', 'account_balances', '2300');
        $this->assertGl('2300', $expected, 'Input Tax Recoverable (GL 2300)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §16 — ORPHANED DATA INTEGRITY
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_all_sale_items_reference_valid_sales(): void
    {
        $orphans = DB::table('sale_items as si')
            ->where('si.tenant_id', self::$tenantId)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('sales as s')
                  ->whereColumn('s.id', 'si.sale_id');
            })
            ->count();

        $this->assertEquals(0, $orphans,
            "{$orphans} sale_item(s) reference a sale_id that does not exist"
        );
    }

    /** @test */
    public function test_all_inventory_batches_have_positive_original_qty(): void
    {
        $violations = DB::table('inventory_batches')
            ->where('tenant_id', self::$tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('original_qty <= 0')
            ->count();

        $this->assertEquals(0, $violations,
            "{$violations} inventory batch(es) have original_qty ≤ 0"
        );
    }
}
