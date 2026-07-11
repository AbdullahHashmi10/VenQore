<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Services\FinancialReportingService;
use App\Services\LedgerService;

/**
 * ============================================================
 * Phase 4 — Financial Core Verification
 * ============================================================
 *
 * DOCTRINE (Phase 4):
 *  Given the SEEDED Golden Company ledger, every derived financial
 *  computation produced by FinancialReportingService must EXACTLY
 *  equal the pre-declared values in manifest.json.
 *
 *  The manifest was computed by an INDEPENDENT calculator (calculator.php)
 *  that shares zero code with the app. Agreement between the service and
 *  the manifest is evidence of correctness, not tautology.
 *
 * METHOD:
 *  - Uses DatabaseTransactions: each test rolls back; Golden Company
 *    seeded data stays pristine for all tests in this run.
 *  - Does NOT re-seed per-test. Seed once with:
 *      php artisan db:seed --class=GoldenCompanySeeder --env=testing
 *  - All expected values come from manifest.json — never hardcoded here.
 *  - Tolerance: ±0.02 (accounts for rounding at 2dp per line level).
 *
 * COVERAGE:
 *  [F-01]  Annual P&L: revenue, COGS, gross profit, opex, net profit
 *  [F-02]  Balance Sheet totals as of year-end
 *  [F-03]  Balance Sheet equation (A = L + E) at year-end
 *  [F-04]  Balance Sheet balances for EVERY date in the 365-day window
 *  [F-05]  Trial Balance: Σ DR = Σ CR at year-end
 *  [F-06]  Per-account GL balances match manifest at year-end
 *  [F-07]  Inventory value (FIFO) = GL 1100 balance (three-way tie)
 *  [F-08]  AR control: GL 1200 = Σ individual customer balances
 *  [F-09]  AP control: GL 2000 = Σ individual vendor balances
 *  [F-10]  Cash balance matches manifest (GL 1000)
 *  [F-11]  Bank balance matches manifest (GL 1010)
 *  [F-12]  Receivables from getReceivables() matches manifest
 *  [F-13]  Payables from getPayables() matches manifest
 *  [F-14]  Monthly P&Ls sum to annual P&L (to the paisa)
 *  [F-15]  Tax summary: output tax, input tax, net payable
 *  [F-16]  Tenant 2 isolation: its revenue never appears in T1 P&L
 *  [F-17]  Reversal property: event + full reversal → pre-event state
 *  [F-18]  Cash flow: net change = closing balance - opening balance
 *
 * TO RUN:
 *   # Seed golden company (once per test run):
 *   E:\Software\xampp\php\php.exe artisan db:seed --class=GoldenCompanySeeder --env=testing
 *   # Run suite:
 *   vendor/bin/phpunit --testsuite Phase4
 *
 * @group golden
 * @group phase4
 */
class FinancialCoreVerificationTest extends VenQoreTestCase
{
    use DatabaseTransactions;

    // ─── Constants ────────────────────────────────────────────────────────────
    private const TENANT_ID   = '999991';
    private const TENANT_2_ID = '999992';
    private const YEAR_START  = '2025-01-01';
    private const YEAR_END    = '2025-12-31';
    private const TOLERANCE   = 0.02;

    private static array $manifest = [];
    private static bool  $seeded   = false;

    private FinancialReportingService $reporting;
    private Tenant                    $tenant;

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────

    protected function setUp(): void
    {
        parent::setUp();

        $this->loadManifest();
        $this->ensureGoldenCompanySeeded();

        $this->tenant = Tenant::findOrFail(self::TENANT_ID);
        $this->bindTenantContext($this->tenant);

        $this->reporting = app(FinancialReportingService::class);
    }

    private function loadManifest(): void
    {
        if (!empty(self::$manifest)) return;

        $path = base_path('verification/golden_company/manifest.json');
        if (!file_exists($path)) {
            $this->markTestSkipped(
                'manifest.json not found. Run: php verification/golden_company/calculator.php'
            );
        }
        self::$manifest = json_decode(file_get_contents($path), true);
    }

    private function ensureGoldenCompanySeeded(): void
    {
        $exists = DB::table('tenants')->where('id', self::TENANT_ID)->exists();
        if (!$exists) {
            DB::commit();
            Artisan::call('db:seed', ['--class' => 'GoldenCompanySeeder', '--force' => true]);
            DB::beginTransaction();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSERTION HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function M(string ...$keys): mixed
    {
        $val = self::$manifest;
        foreach ($keys as $k) {
            $val = $val[$k] ?? null;
            if ($val === null) return null;
        }
        return $val;
    }

    private function assertMoney(float $expected, float $actual, string $label): void
    {
        $this->assertEqualsWithDelta(
            $expected, $actual, self::TOLERANCE,
            sprintf('%s: expected Rs.%s, got Rs.%s (diff Rs.%s)',
                $label,
                number_format($expected, 2),
                number_format($actual, 2),
                number_format(abs($expected - $actual), 2)
            )
        );
    }

    private function assertBalanceSheetIsBalanced(array $bs, string $context = ''): void
    {
        $liabPlusEquity = round($bs['total_liabilities'] + $bs['total_equity'], 2);
        $this->assertEqualsWithDelta(
            $bs['total_assets'], $liabPlusEquity, self::TOLERANCE,
            "Balance Sheet not balanced{$context}: " .
            "Assets={$bs['total_assets']}, L+E={$liabPlusEquity}"
        );
        $this->assertTrue($bs['is_balanced'],
            "FinancialReportingService::getBalanceSheet()->is_balanced is FALSE{$context}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-01] ANNUAL P&L
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The full-year P&L must match the manifest exactly (within tolerance).
     */
    public function test_F01_annual_pl_matches_manifest(): void
    {
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $expected = self::$manifest['year_end']['profit_and_loss'];

        $this->assertMoney($expected['revenue'],      $pl['revenue'],      '[F-01] Annual Revenue');
        $this->assertMoney($expected['cogs'],         $pl['cogs'],         '[F-01] Annual COGS');
        $this->assertMoney($expected['gross_profit'], $pl['gross_profit'], '[F-01] Annual Gross Profit');
        $this->assertMoney($expected['net_profit'],   $pl['net_profit'],   '[F-01] Annual Net Profit');

        // Arithmetic constraint: gross_profit = revenue - cogs
        $this->assertMoney(
            $pl['revenue'] - $pl['cogs'],
            $pl['gross_profit'],
            '[F-01] Gross Profit arithmetic: revenue - cogs'
        );

        // Arithmetic constraint: net_profit = gross_profit - operating_expenses
        $this->assertMoney(
            $pl['gross_profit'] - $pl['operating_expenses'],
            $pl['net_profit'],
            '[F-01] Net Profit arithmetic: gross_profit - opex'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-02] BALANCE SHEET TOTALS AT YEAR-END
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Balance Sheet totals as of 2025-12-31 must match manifest.
     */
    public function test_F02_year_end_balance_sheet_totals_match_manifest(): void
    {
        $bs       = $this->reporting->getBalanceSheet(self::YEAR_END);
        $expected = self::$manifest['year_end']['balance_sheet'];

        $this->assertMoney($expected['total_assets'],     $bs['total_assets'],     '[F-02] Total Assets');
        $this->assertMoney($expected['total_liabilities'], $bs['total_liabilities'], '[F-02] Total Liabilities');
        $this->assertMoney($expected['total_equity'],     $bs['total_equity'],     '[F-02] Total Equity');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-03] BALANCE SHEET EQUATION AT YEAR-END
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A = L + E must hold at year-end. This is the fundamental accounting identity.
     */
    public function test_F03_balance_sheet_equation_holds_at_year_end(): void
    {
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);
        $this->assertBalanceSheetIsBalanced($bs, ' at year-end (2025-12-31)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-04] BALANCE SHEET FOR EVERY DATE IN THE 365-DAY WINDOW
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The Balance Sheet must balance (A = L + E) for EVERY date in the
     * Golden Company's 365-day window. This is the "brutal and cheap" test.
     *
     * If it fails on date X, a transaction on that date has a broken journal.
     */
    public function test_F04_balance_sheet_balances_on_every_date_in_year(): void
    {
        $failures = [];
        $current  = Carbon::parse(self::YEAR_START);
        $end      = Carbon::parse(self::YEAR_END);

        while ($current->lte($end)) {
            $date = $current->toDateString();
            $bs   = $this->reporting->getBalanceSheet($date);

            if (!$bs['is_balanced']) {
                $diff = abs($bs['total_assets'] - ($bs['total_liabilities'] + $bs['total_equity']));
                $failures[] = sprintf(
                    '%s: Assets=%.2f, L+E=%.2f, diff=%.2f',
                    $date,
                    $bs['total_assets'],
                    $bs['total_liabilities'] + $bs['total_equity'],
                    $diff
                );
            }

            $current->addDay();
        }

        $this->assertEmpty($failures,
            count($failures) . " date(s) failed the Balance Sheet equation:\n" .
            implode("\n", array_slice($failures, 0, 20)) .
            (count($failures) > 20 ? "\n... and " . (count($failures) - 20) . " more" : '')
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-05] TRIAL BALANCE NETS TO ZERO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Trial balance as of year-end: Σ all debits = Σ all credits.
     * Also validates the manifest's declared totals.
     */
    public function test_F05_trial_balance_nets_to_zero_at_year_end(): void
    {
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);

        $this->assertTrue($tb['balanced'],
            sprintf(
                '[F-05] Trial Balance not zero: Σ DR=%.2f, Σ CR=%.2f, diff=%.2f',
                $tb['grand_debit'],
                $tb['grand_credit'],
                abs($tb['grand_debit'] - $tb['grand_credit'])
            )
        );

        // Cross-check with manifest's declared totals
        $manifestDr = self::$manifest['consistency_assertions']['trial_balance_must_zero']['total_debits']  ?? null;
        $manifestCr = self::$manifest['consistency_assertions']['trial_balance_must_zero']['total_credits'] ?? null;

        if ($manifestDr !== null) {
            $this->assertMoney($manifestDr, $tb['grand_debit'],  '[F-05] Trial Balance Σ DR vs manifest');
            $this->assertMoney($manifestCr, $tb['grand_credit'], '[F-05] Trial Balance Σ CR vs manifest');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-06] PER-ACCOUNT GL BALANCES MATCH MANIFEST
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * For each account in the manifest's trial_balance section, the live GL balance
     * must match to the exact declared amount.
     */
    public function test_F06_per_account_gl_balances_match_manifest(): void
    {
        $manifestTb = self::$manifest['trial_balance'] ?? [];
        if (empty($manifestTb)) {
            $this->markTestSkipped('manifest.json has no trial_balance section');
        }

        $tb      = $this->reporting->getTrialBalance(self::YEAR_END);
        $tbByCode = collect($tb['rows'])->keyBy('code');
        $failures = [];

        foreach ($manifestTb as $code => $expected) {
            if (!isset($tbByCode[$code])) {
                $failures[] = "GL {$code} ({$expected['name']}): not found in trial balance";
                continue;
            }

            $row     = $tbByCode[$code];
            $expDr   = (float)($expected['debit']  ?? 0);
            $expCr   = (float)($expected['credit'] ?? 0);

            $liveDr = 0.00;
            $liveCr = 0.00;
            if ($row['normal_balance'] === 'debit') {
                if ($row['balance'] >= 0) {
                    $liveDr = $row['balance'];
                } else {
                    $liveCr = abs($row['balance']);
                }
            } else {
                if ($row['balance'] >= 0) {
                    $liveCr = $row['balance'];
                } else {
                    $liveDr = abs($row['balance']);
                }
            }

            if (abs($expDr - $liveDr) > self::TOLERANCE) {
                $failures[] = "GL {$code} Debit: expected " . number_format($expDr, 2) . ", got " . number_format($liveDr, 2);
            }
            if (abs($expCr - $liveCr) > self::TOLERANCE) {
                $failures[] = "GL {$code} Credit: expected " . number_format($expCr, 2) . ", got " . number_format($liveCr, 2);
            }
        }

        $this->assertEmpty($failures,
            "[F-06] Per-account GL balance mismatches:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-07] INVENTORY THREE-WAY TIE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Inventory valuation must agree across three independent sources:
     *   1. GL 1100 balance (from journal_items)
     *   2. FIFO sum (Σ remaining_qty × unit_cost from inventory_batches)
     *   3. Manifest's declared value
     */
    public function test_F07_inventory_three_way_tie_at_year_end(): void
    {
        // 1. GL 1100 balance as of year-end
        $gl1100 = $this->glBalanceAsOf('1100', self::YEAR_END);

        // 2. FIFO sum
        $fifoValue = (float) DB::table('inventory_batches')
            ->where('tenant_id', self::TENANT_ID)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > 0')
            ->selectRaw('SUM(remaining_qty * unit_cost) as val')
            ->value('val');

        // 3. Manifest
        $manifestValue = (float)($this->M('inventory', 'total_value') ?? 0);

        $this->assertMoney($manifestValue, $gl1100,   '[F-07] GL 1100 vs manifest inventory value');
        $this->assertMoney($manifestValue, $fifoValue, '[F-07] FIFO sum vs manifest inventory value');
        $this->assertMoney($gl1100,        $fifoValue, '[F-07] GL 1100 vs FIFO (three-way tie)');

        // Reporting service matches too
        $serviceValue = $this->reporting->getInventoryValue();
        $this->assertMoney($manifestValue, $serviceValue, '[F-07] getInventoryValue() vs manifest');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-08] AR CONTROL ACCOUNT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GL 1200 (AR) = Σ individual customer balances = manifest value.
     * All three must agree — the "control account tie" test.
     */
    public function test_F08_ar_control_account_matches_customer_sum_and_manifest(): void
    {
        // GL 1200 balance as of year-end
        $gl1200 = $this->reporting->getReceivables(self::YEAR_END);

        // Σ individual customer balances via LedgerService
        $tenantId   = self::TENANT_ID;
        $customerIds = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->pluck('id');

        $sumCustomerBalances = $customerIds->sum(function($id) use ($tenantId) {
            return LedgerService::partyNetBalance($id, $tenantId, 'customer');
        });

        // Manifest
        $manifestAr = (float)($this->M('ar_balances', 'total') ?? 0);

        $this->assertMoney($manifestAr, $gl1200,              '[F-08] GL 1200 vs manifest AR');
        $this->assertMoney($manifestAr, $sumCustomerBalances, '[F-08] Σ customer balances vs manifest AR');
        $this->assertMoney($gl1200,     $sumCustomerBalances, '[F-08] GL 1200 vs Σ customers (control tie)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-09] AP CONTROL ACCOUNT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GL 2000 (AP) = Σ individual vendor balances = manifest value.
     */
    public function test_F09_ap_control_account_matches_vendor_sum_and_manifest(): void
    {
        $gl2000 = $this->reporting->getPayables(self::YEAR_END);

        $tenantId  = self::TENANT_ID;
        $vendorIds = DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'supplier')
            ->pluck('id');

        $sumVendorBalances = $vendorIds->sum(function($id) use ($tenantId) {
            return LedgerService::partyNetBalance($id, $tenantId, 'supplier');
        });

        $manifestAp = (float)($this->M('ap_balances', 'total') ?? 0);

        $this->assertMoney($manifestAp, $gl2000,           '[F-09] GL 2000 vs manifest AP');
        $this->assertMoney($manifestAp, $sumVendorBalances, '[F-09] Σ vendor balances vs manifest AP');
        $this->assertMoney($gl2000,     $sumVendorBalances, '[F-09] GL 2000 vs Σ vendors (control tie)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-10] CASH BALANCE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GL 1000 (Cash in Hand) as of year-end must match manifest.
     */
    public function test_F10_cash_balance_matches_manifest(): void
    {
        $expected = (float)($this->M('year_end', 'account_balances', '1000') ?? 0);
        $actual   = $this->glBalanceAsOf('1000', self::YEAR_END);

        $this->assertMoney($expected, $actual, '[F-10] GL 1000 (Cash) vs manifest');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-11] BANK BALANCE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GL 1010 (Bank) as of year-end must match manifest.
     */
    public function test_F11_bank_balance_matches_manifest(): void
    {
        $expected = (float)($this->M('year_end', 'account_balances', '1010') ?? 0);
        $actual   = $this->glBalanceAsOf('1010', self::YEAR_END);

        $this->assertMoney($expected, $actual, '[F-11] GL 1010 (Bank) vs manifest');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-12] RECEIVABLES FROM SERVICE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * FinancialReportingService::getReceivables() as of year-end must match
     * manifest. This test confirms the SERVICE method is correct (not just the raw GL).
     */
    public function test_F12_getReceivables_matches_manifest(): void
    {
        $expected = (float)($this->M('ar_balances', 'total') ?? 0);
        $actual   = $this->reporting->getReceivables(self::YEAR_END);

        $this->assertMoney($expected, $actual, '[F-12] getReceivables() vs manifest AR total');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-13] PAYABLES FROM SERVICE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * FinancialReportingService::getPayables() as of year-end must match manifest.
     */
    public function test_F13_getPayables_matches_manifest(): void
    {
        $expected = (float)($this->M('ap_balances', 'total') ?? 0);
        $actual   = $this->reporting->getPayables(self::YEAR_END);

        $this->assertMoney($expected, $actual, '[F-13] getPayables() vs manifest AP total');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-14] MONTHLY P&Ls SUM TO ANNUAL P&L (to the paisa)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The sum of all 12 monthly P&Ls must equal the full-year P&L.
     *
     * This is the "rounding property" test: if each month rounds at 2dp,
     * the cumulative rounding error must not exceed 12× tolerance.
     */
    public function test_F14_monthly_pls_sum_to_annual_pl(): void
    {
        $annualPl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $sumRevenue    = 0.0;
        $sumCogs       = 0.0;
        $sumNetProfit  = 0.0;
        $months        = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create(2025, $m, 1)->startOfMonth()->toDateString();
            $monthEnd   = Carbon::create(2025, $m, 1)->endOfMonth()->toDateString();
            $monthly    = $this->reporting->getProfitAndLoss($monthStart, $monthEnd);

            $sumRevenue   += $monthly['revenue'];
            $sumCogs      += $monthly['cogs'];
            $sumNetProfit += $monthly['net_profit'];
            $months[$m]    = $monthly;
        }

        // Allow 12× single-entry tolerance for rounding accumulation across months
        $multiMonthTolerance = self::TOLERANCE * 12;

        $this->assertEqualsWithDelta(
            $annualPl['revenue'], $sumRevenue, $multiMonthTolerance,
            '[F-14] Σ monthly revenue must equal annual revenue'
        );
        $this->assertEqualsWithDelta(
            $annualPl['cogs'], $sumCogs, $multiMonthTolerance,
            '[F-14] Σ monthly COGS must equal annual COGS'
        );
        $this->assertEqualsWithDelta(
            $annualPl['net_profit'], $sumNetProfit, $multiMonthTolerance,
            '[F-14] Σ monthly net profit must equal annual net profit'
        );

        // Spot-check: any month with declared spec transactions must have non-zero revenue
        // TXN-SAL-010 is in December — December must have revenue
        $this->assertGreaterThan(0.0, $months[12]['revenue'],
            '[F-14] December (month 12) must have positive revenue (TXN-SAL-010 is a strong month)');

        // TXN-ZERO-DAY is July 4 — July may have activity from other transactions
        // Just assert July P&L is internally consistent (no negative revenue)
        $this->assertGreaterThanOrEqual(0.0, $months[7]['revenue'],
            '[F-14] July revenue must be ≥ 0 (boundary test for zero-activity day)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-15] TAX SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Tax summary for the full year:
     *   - Output tax (GL 2100 credits) = manifest GL 2100 balance
     *   - Input tax (GL 2300 debits) = manifest GL 2300 balance
     *   - Net payable = output - input
     */
    public function test_F15_tax_summary_matches_manifest_accounts(): void
    {
        $tax = $this->reporting->getTaxSummary(self::YEAR_START, self::YEAR_END);

        $expectedOutputTax = (float)($this->M('year_end', 'account_balances', '2100') ?? 0);
        $expectedInputTax  = (float)($this->M('year_end', 'account_balances', '2300') ?? 0);
        $expectedNetPayable = round($expectedOutputTax - $expectedInputTax, 2);

        $this->assertMoney($expectedOutputTax,  $tax['output_tax'],  '[F-15] Output Tax (GL 2100)');
        $this->assertMoney($expectedInputTax,   $tax['input_tax'],   '[F-15] Input Tax (GL 2300)');
        $this->assertMoney($expectedNetPayable, $tax['net_payable'], '[F-15] Net Tax Payable');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-16] TENANT 2 ISOLATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * With Tenant 2 bound in context, its revenue must NOT be zero
     * (ensuring it was seeded), AND when we query Tenant 1's P&L,
     * Tenant 2's revenue must never appear.
     */
    public function test_F16_tenant_2_revenue_never_appears_in_tenant_1_pl(): void
    {
        $t2Revenue = (float)($this->M('isolation_check', 'tenant_2_revenue') ?? 0);

        // Query T2 P&L in T2 context
        $tenant2 = Tenant::find(self::TENANT_2_ID);
        if (!$tenant2) {
            $this->markTestSkipped('Tenant 2 not seeded. Run GoldenCompanySeeder first.');
        }

        $this->bindTenantContext($tenant2);
        $t2Pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $this->assertMoney($t2Revenue, $t2Pl['revenue'],
            '[F-16] Tenant 2 must have its own revenue in its own context');

        // Now query T1 P&L in T1 context — T2 revenue must be absent
        $this->bindTenantContext($this->tenant);
        $t1Pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $expectedT1Revenue = (float)($this->M('year_end', 'profit_and_loss', 'revenue') ?? 0);

        $this->assertMoney($expectedT1Revenue, $t1Pl['revenue'],
            '[F-16] T1 revenue must not include T2 revenue');

        // The "impossible" check: T1 revenue must not equal T1+T2
        $this->assertGreaterThan(self::TOLERANCE,
            abs($t1Pl['revenue'] - ($expectedT1Revenue + $t2Revenue)),
            '[F-16] T1 P&L revenue should NOT equal T1+T2 combined (isolation leak test)'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-17] REVERSAL PROPERTY (generic over sale events)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * For any sale in the Golden Company that has a corresponding reversal:
     * the net effect on revenue and COGS must be zero (event + reversal = pre-event).
     *
     * The Golden Company includes TXN-RET-001 (a sale return). After the reversal:
     * the net revenue contribution of the reversed pair must be zero.
     */
    public function test_F17_reversed_sale_has_zero_net_contribution_to_pl(): void
    {
        // Find all reversed journal entries in the Golden Company
        $reversedEntries = DB::table('journal_entries as je')
            ->where('je.tenant_id', self::TENANT_ID)
            ->where('je.is_reversed', true)
            ->join('journal_entries as rev', 'rev.reverses_entry_id', '=', 'je.id')
            ->select('je.id as original_id', 'rev.id as reversal_id')
            ->get();

        if ($reversedEntries->isEmpty()) {
            $this->markTestSkipped('No reversed entries found in Golden Company — seed may not include sale returns');
        }

        foreach ($reversedEntries as $pair) {
            $origLines = DB::table('journal_items as ji')
                ->where('ji.journal_entry_id', $pair->original_id)
                ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->select('a.code', 'ji.debit', 'ji.credit')
                ->get();

            $revLines = DB::table('journal_items as ji')
                ->where('ji.journal_entry_id', $pair->reversal_id)
                ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->select('a.code', 'ji.debit', 'ji.credit')
                ->get();

            // For each account code, sum original + reversal — net must be ~0
            $byCode = [];
            foreach ($origLines as $l) {
                $byCode[$l->code]['dr'] = ($byCode[$l->code]['dr'] ?? 0) + (float)$l->debit;
                $byCode[$l->code]['cr'] = ($byCode[$l->code]['cr'] ?? 0) + (float)$l->credit;
            }
            foreach ($revLines as $l) {
                $byCode[$l->code]['dr'] = ($byCode[$l->code]['dr'] ?? 0) + (float)$l->debit;
                $byCode[$l->code]['cr'] = ($byCode[$l->code]['cr'] ?? 0) + (float)$l->credit;
            }

            foreach ($byCode as $code => $amounts) {
                $netEffect = abs($amounts['dr'] - $amounts['cr']);
                $this->assertEqualsWithDelta(0.0, $netEffect, self::TOLERANCE,
                    "[F-17] GL {$code}: reversed pair {$pair->original_id} → {$pair->reversal_id} " .
                    "has non-zero net effect: DR={$amounts['dr']}, CR={$amounts['cr']}, net={$netEffect}"
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-18] CASH FLOW: NET CHANGE = CLOSING BALANCE − OPENING BALANCE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The Cash Flow Statement's net_change_in_cash must equal the change in
     * cash/bank balance over the period. (Opening + net change = closing.)
     */
    public function test_F18_cash_flow_net_change_equals_balance_movement(): void
    {
        $cf = $this->reporting->getCashFlowReport(self::YEAR_START, self::YEAR_END);

        // Opening cash+bank = GL 1000+1010 balance as of day BEFORE year start
        $openingCash = $this->glBalanceAsOf('1000', '2024-12-31')
                     + $this->glBalanceAsOf('1010', '2024-12-31');

        // Closing cash+bank = GL 1000+1010 balance as of year end
        $closingCash = $this->glBalanceAsOf('1000', self::YEAR_END)
                     + $this->glBalanceAsOf('1010', self::YEAR_END);

        $expectedNetChange = round($closingCash - $openingCash, 2);

        $this->assertMoney($expectedNetChange, $cf['net_change_in_cash'],
            '[F-18] Cash Flow net_change_in_cash must equal closing − opening cash balance'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-19] PERIOD P&L USING getProfitByPeriod MATCHES getProfitAndLoss
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * getProfitByPeriod() with monthly granularity must produce the same
     * total revenue and COGS as summing 12× getProfitAndLoss() calls.
     *
     * This confirms the single-query conditional aggregation gives the same
     * answer as the per-account loop.
     */
    public function test_F19_getProfitByPeriod_matches_getProfitAndLoss(): void
    {
        $byPeriod = $this->reporting->getProfitByPeriod(
            self::YEAR_START, self::YEAR_END, 'monthly'
        );

        $directRevenue = 0.0;
        $directCogs    = 0.0;

        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create(2025, $m, 1)->startOfMonth()->toDateString();
            $monthEnd   = Carbon::create(2025, $m, 1)->endOfMonth()->toDateString();
            $pl         = $this->reporting->getProfitAndLoss($monthStart, $monthEnd);
            $directRevenue += $pl['revenue'];
            $directCogs    += $pl['cogs'];
        }

        $periodRevenue = array_sum(array_column($byPeriod, 'revenue'));
        $periodCogs    = array_sum(array_column($byPeriod, 'cogs'));

        $this->assertEqualsWithDelta($directRevenue, $periodRevenue, self::TOLERANCE * 12,
            '[F-19] getProfitByPeriod revenue must match Σ getProfitAndLoss revenue'
        );
        $this->assertEqualsWithDelta($directCogs, $periodCogs, self::TOLERANCE * 12,
            '[F-19] getProfitByPeriod COGS must match Σ getProfitAndLoss COGS'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [F-20] CROSS-YEAR DATE RANGE — PARTIAL YEAR QUERY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A P&L for a custom range that doesn't align with month boundaries
     * must still be mathematically consistent:
     *   - revenue(Q1) + revenue(Q2) + revenue(Q3) + revenue(Q4) = revenue(full year)
     */
    public function test_F20_quarterly_pls_sum_to_annual(): void
    {
        $quarters = [
            ['2025-01-01', '2025-03-31'],
            ['2025-04-01', '2025-06-30'],
            ['2025-07-01', '2025-09-30'],
            ['2025-10-01', '2025-12-31'],
        ];

        $sumRevenue   = 0.0;
        $sumCogs      = 0.0;
        $sumNetProfit = 0.0;

        foreach ($quarters as [$qStart, $qEnd]) {
            $qPl           = $this->reporting->getProfitAndLoss($qStart, $qEnd);
            $sumRevenue   += $qPl['revenue'];
            $sumCogs      += $qPl['cogs'];
            $sumNetProfit += $qPl['net_profit'];
        }

        $annual = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $this->assertEqualsWithDelta($annual['revenue'],    $sumRevenue,    self::TOLERANCE * 4,
            '[F-20] Σ quarterly revenue = annual revenue');
        $this->assertEqualsWithDelta($annual['cogs'],       $sumCogs,       self::TOLERANCE * 4,
            '[F-20] Σ quarterly COGS = annual COGS');
        $this->assertEqualsWithDelta($annual['net_profit'], $sumNetProfit,  self::TOLERANCE * 4,
            '[F-20] Σ quarterly net profit = annual net profit');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compute GL balance for this tenant's account code as of $asOf (cumulative from all time).
     */
    private function glBalanceAsOf(string $code, string $asOf): float
    {
        $row = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('a.code', $code)
            ->where('je.date', '<=', $asOf)
            ->where('je.is_reversed', false)
            ->selectRaw('SUM(ji.debit) as dr, SUM(ji.credit) as cr')
            ->first();

        $normal = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', $code)
            ->value('normal_balance');

        $dr = (float)($row->dr ?? 0);
        $cr = (float)($row->cr ?? 0);
        return round($normal === 'credit' ? $cr - $dr : $dr - $cr, 2);
    }
}
