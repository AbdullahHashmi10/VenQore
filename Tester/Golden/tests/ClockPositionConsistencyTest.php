<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Services\FinancialReportingService;

/**
 * ============================================================
 * Phase 6 — Four-Clock-Position Consistency Test
 * ============================================================
 *
 * DOCTRINE:
 *  Every financial invariant must hold not just at year-end, but at
 *  ALL meaningful points during the accounting year. This test sweeps
 *  through four frozen clock positions and asserts at each:
 *
 *    1. Balance Sheet is_balanced (A = L + E)
 *    2. Trial Balance grand_debit = grand_credit
 *    3. Inventory three-way tie (GL 1100 = FIFO value)
 *    4. AR control (GL 1200 = Σ customer balances)
 *    5. P&L net_profit = gross_profit - opex
 *    6. Cross-surface: Dashboard vs Service agree
 *
 * CLOCK POSITIONS:
 *  - POSITION-1: 2025-03-31 (end of Q1 — sale return TXN-SR-001 just happened)
 *  - POSITION-2: 2025-06-30 (mid-year — bank transfer TXN-TRF-001 posted)
 *  - POSITION-3: 2025-09-01 (post TXN-CP-002 customer payment)
 *  - POSITION-4: 2025-12-31 (year-end — full Golden Company state)
 *
 * DESIGN:
 *  Uses data-provider pattern over the four clock positions so each
 *  invariant is tested independently per position. A failure message
 *  always includes the clock date so the exact failing state is clear.
 *
 * @group golden
 * @group phase6
 * @group phase6-clocks
 */
class ClockPositionConsistencyTest extends VenQoreTestCase
{
    use DatabaseTransactions;

    private const TENANT_ID = '999991';
    private const TOLERANCE = 0.02;

    private static bool $seeded = false;

    private Tenant $tenant;
    private FinancialReportingService $reporting;

    /** Four clock positions to test. Each is: [description, as_of_date, period_start] */
    private static array $clockPositions = [
        'Q1-end'           => ['2025-03-31', '2025-01-01'],
        'mid-year'         => ['2025-06-30', '2025-01-01'],
        'post-cp002'       => ['2025-09-01', '2025-01-01'],
        'year-end'         => ['2025-12-31', '2025-01-01'],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureSeeded();
        $this->tenant    = Tenant::findOrFail(self::TENANT_ID);
        $this->reporting = app(FinancialReportingService::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function ensureSeeded(): void
    {
        if (!DB::table('tenants')->where('id', self::TENANT_ID)->exists()) {
            DB::commit();
            Artisan::call('db:seed', ['--class' => 'GoldenCompanySeeder', '--force' => true]);
            DB::beginTransaction();
        }
    }

    private function freezeAt(string $date): void
    {
        Carbon::setTestNow($date . ' 23:59:59');
        $this->bindTenantContext($this->tenant);
    }

    private function assertAt(float $expected, float $actual, string $label, string $clockDate): void
    {
        $this->assertEqualsWithDelta($expected, $actual, self::TOLERANCE,
            "CLOCK={$clockDate} [{$label}]: " .
            "expected=" . number_format($expected, 2) .
            " actual=" . number_format($actual, 2) .
            " diff=" . number_format(abs($expected - $actual), 2)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-01] BALANCE SHEET BALANCED AT ALL 4 POSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A = L + E must hold at every clock position.
     */
    public function test_CP01_balance_sheet_balanced_at_all_clock_positions(): void
    {
        $failures = [];

        foreach (self::$clockPositions as $label => [$asOf, $periodStart]) {
            $this->freezeAt($asOf);
            $bs = $this->reporting->getBalanceSheet($asOf);

            if (!$bs['is_balanced']) {
                $failures[] = sprintf(
                    'POSITION %s (%s): A=%.2f, L+E=%.2f, diff=%.2f',
                    $label, $asOf,
                    $bs['total_assets'],
                    $bs['total_liabilities'] + $bs['total_equity'],
                    abs($bs['total_assets'] - ($bs['total_liabilities'] + $bs['total_equity']))
                );
            }
        }

        $this->assertEmpty($failures,
            "[CP-01] Balance Sheet unbalanced at these positions:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-02] TRIAL BALANCE BALANCED AT ALL 4 POSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Σ DR = Σ CR must hold at every clock position.
     */
    public function test_CP02_trial_balance_balanced_at_all_clock_positions(): void
    {
        $failures = [];

        foreach (self::$clockPositions as $label => [$asOf, $periodStart]) {
            $this->freezeAt($asOf);
            $tb = $this->reporting->getTrialBalance($asOf);

            if (!$tb['balanced']) {
                $failures[] = sprintf(
                    'POSITION %s (%s): DR=%.2f, CR=%.2f, diff=%.2f',
                    $label, $asOf,
                    $tb['grand_debit'],
                    $tb['grand_credit'],
                    abs($tb['grand_debit'] - $tb['grand_credit'])
                );
            }
        }

        $this->assertEmpty($failures,
            "[CP-02] Trial Balance unbalanced at:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-03] INVENTORY THREE-WAY TIE AT ALL 4 POSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GL 1100 = FIFO Σ(remaining_qty × unit_cost) at every clock position.
     *
     * Note: This is a "real-time snapshot" test — inventory_batches is not
     * time-stamped so we only check the CURRENT state of FIFO vs GL 1100
     * cumulative balance at each as_of date.
     */
    public function test_CP03_inventory_three_way_tie_at_all_clock_positions(): void
    {
        $failures = [];

        foreach (self::$clockPositions as $label => [$asOf, $periodStart]) {
            $this->freezeAt($asOf);

            // GL 1100 balance as of this date
            $account1100 = DB::table('accounts')
                ->where('tenant_id', self::TENANT_ID)
                ->where('code', '1100')
                ->first();

            if (!$account1100) continue;

            $gl1100 = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->where('ji.tenant_id', self::TENANT_ID)
                ->where('ji.account_id', $account1100->id)
                ->where('je.date', '<=', $asOf)
                ->where('je.is_reversed', false)
                ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
                ->value('net');

            // FIFO value (time-scoped)
            $fifoValue = (float) DB::table('inventory_batches as ib')
                ->where('ib.tenant_id', self::TENANT_ID)
                ->whereNull('ib.deleted_at')
                ->where('ib.created_at', '<=', $asOf . ' 23:59:59')
                ->get()
                ->sum(function ($ib) use ($asOf) {
                    $consumedAfter = (float) DB::table('sale_item_batches as sib')
                        ->join('sale_items as si', 'si.id', '=', 'sib.sale_item_id')
                        ->join('sales as s', 's.id', '=', 'si.sale_id')
                        ->where('sib.inventory_batch_id', $ib->id)
                        ->where('s.tenant_id', self::TENANT_ID)
                        ->where('sib.tenant_id', self::TENANT_ID)
                        ->where('sib.is_reversed', 0)
                        ->whereIn('s.status', ['posted', 'partially_returned'])
                        ->whereRaw('DATE(s.posted_at) > ?', [$asOf])
                        ->sum('sib.qty_deducted');
                    return round(($ib->remaining_qty + $consumedAfter) * $ib->unit_cost, 0);
                });

            // At year-end these MUST be equal. At other positions, GL 1100 may
            // reflect historical purchases/COGS while FIFO is always current.
            // For the Golden Company (no partial-period seeding), they should
            // always agree since all txns are posted.
            if (abs($gl1100 - $fifoValue) > self::TOLERANCE) {
                $failures[] = sprintf(
                    'POSITION %s (%s): GL1100=%.2f, FIFO=%.2f, diff=%.2f',
                    $label, $asOf, $gl1100, $fifoValue, abs($gl1100 - $fifoValue)
                );
            }
        }

        $this->assertEmpty($failures,
            "[CP-03] Inventory three-way tie failures:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-04] AR CONTROL ACCOUNT AT ALL 4 POSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GL 1200 = getReceivables() at every clock position.
     */
    public function test_CP04_ar_control_matches_getReceivables_at_all_positions(): void
    {
        $failures = [];

        foreach (self::$clockPositions as $label => [$asOf, $periodStart]) {
            $this->freezeAt($asOf);

            $account1200 = DB::table('accounts')
                ->where('tenant_id', self::TENANT_ID)
                ->where('code', '1200')
                ->first();

            if (!$account1200) continue;

            $gl1200 = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->where('ji.tenant_id', self::TENANT_ID)
                ->where('ji.account_id', $account1200->id)
                ->where('je.date', '<=', $asOf)
                ->where('je.is_reversed', false)
                ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
                ->value('net');

            $svcAr = $this->reporting->getReceivables($asOf);

            if (abs($gl1200 - $svcAr) > self::TOLERANCE) {
                $failures[] = sprintf(
                    'POSITION %s (%s): GL1200=%.2f, getReceivables()=%.2f, diff=%.2f',
                    $label, $asOf, $gl1200, $svcAr, abs($gl1200 - $svcAr)
                );
            }
        }

        $this->assertEmpty($failures,
            "[CP-04] AR control failures:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-05] P&L ARITHMETIC CONSISTENT AT ALL 4 POSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * At every clock position, the P&L service method must satisfy:
     *   gross_profit = revenue - cogs
     *   net_profit   = gross_profit - operating_expenses
     */
    public function test_CP05_pl_arithmetic_consistent_at_all_clock_positions(): void
    {
        $failures = [];

        foreach (self::$clockPositions as $label => [$asOf, $periodStart]) {
            $this->freezeAt($asOf);

            $pl = $this->reporting->getProfitAndLoss($periodStart, $asOf);

            $expectedGross = round($pl['revenue'] - $pl['cogs'], 2);
            $expectedNet   = round($pl['gross_profit'] - $pl['operating_expenses'], 2);

            if (abs($expectedGross - $pl['gross_profit']) > self::TOLERANCE) {
                $failures[] = "POSITION {$label} ({$asOf}): gross_profit arithmetic: "
                    . "revenue({$pl['revenue']}) - cogs({$pl['cogs']}) = {$expectedGross} "
                    . "≠ returned({$pl['gross_profit']})";
            }
            if (abs($expectedNet - $pl['net_profit']) > self::TOLERANCE) {
                $failures[] = "POSITION {$label} ({$asOf}): net_profit arithmetic: "
                    . "gross({$pl['gross_profit']}) - opex({$pl['operating_expenses']}) = {$expectedNet} "
                    . "≠ returned({$pl['net_profit']})";
            }
        }

        $this->assertEmpty($failures,
            "[CP-05] P&L arithmetic failures:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-06] MONOTONICITY: LATER DATE HAS ≥ REVENUE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * P&L revenue for a wider date range must be ≥ P&L revenue for a narrower range.
     *   R(Jan-Sep) ≤ R(Jan-Dec)
     *   R(Jan-Mar) ≤ R(Jan-Jun)
     *   R(Jan-Mar) ≤ R(Jan-Sep)
     */
    public function test_CP06_pl_revenue_monotonically_non_decreasing_over_time(): void
    {
        $positions = [
            'Q1'  => ['2025-01-01', '2025-03-31'],
            'H1'  => ['2025-01-01', '2025-06-30'],
            '3Q'  => ['2025-01-01', '2025-09-01'],
            'FY'  => ['2025-01-01', '2025-12-31'],
        ];

        $revenues = [];
        foreach ($positions as $label => [$start, $end]) {
            $this->freezeAt($end);
            $pl = $this->reporting->getProfitAndLoss($start, $end);
            $revenues[$label] = $pl['revenue'];
        }

        // Assert non-decreasing order
        $this->assertLessThanOrEqual($revenues['FY'], $revenues['H1'],
            "[CP-06] FY revenue must be ≥ H1 revenue"
        );
        $this->assertLessThanOrEqual($revenues['FY'], $revenues['3Q'],
            "[CP-06] FY revenue must be ≥ 3Q revenue"
        );
        $this->assertLessThanOrEqual($revenues['H1'], $revenues['Q1'],
            "[CP-06] H1 revenue must be ≥ Q1 revenue"
        );
        $this->assertLessThanOrEqual($revenues['3Q'], $revenues['Q1'],
            "[CP-06] 3Q revenue must be ≥ Q1 revenue"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [CP-07] RETAINED EARNINGS IN BALANCE SHEET = NET PROFIT FROM P&L
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The Balance Sheet appends Retained Earnings = getProfitAndLoss('1900-01-01', $asOf).
     * This must equal the P&L net_profit for the same period, at each clock position.
     */
    public function test_CP07_retained_earnings_equals_pl_net_profit_at_all_positions(): void
    {
        $failures = [];

        foreach (self::$clockPositions as $label => [$asOf, $periodStart]) {
            $this->freezeAt($asOf);

            // Balance Sheet retained earnings (all-time net profit up to $asOf)
            $bs = $this->reporting->getBalanceSheet($asOf);
            $reRow = collect($bs['equity']['accounts'])
                ->first(fn($a) => ($a['code'] ?? '') === 'RE');

            if (!$reRow) continue;

            $bsRetainedEarnings = (float)$reRow['balance'];

            // P&L net_profit for all-time up to $asOf (mirrors getBalanceSheet's internal call)
            $pl = $this->reporting->getProfitAndLoss('1900-01-01', $asOf);
            $plNetProfit = (float)$pl['net_profit'];

            if (abs($bsRetainedEarnings - $plNetProfit) > self::TOLERANCE) {
                $failures[] = sprintf(
                    'POSITION %s (%s): BS retained_earnings=%.2f, P&L net_profit=%.2f, diff=%.2f',
                    $label, $asOf, $bsRetainedEarnings, $plNetProfit,
                    abs($bsRetainedEarnings - $plNetProfit)
                );
            }
        }

        $this->assertEmpty($failures,
            "[CP-07] Retained Earnings vs P&L net profit discrepancies:\n" . implode("\n", $failures)
        );
    }
}
