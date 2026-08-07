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
 * Phase 6 — Formatting & Rounding Consistency Tests
 * ============================================================
 *
 * DOCTRINE:
 *  Numbers in transit between layers must not accumulate drift from
 *  inconsistent rounding. This suite verifies:
 *
 *   1. ROUNDING POLICY: All monetary values stored/returned at 2dp
 *   2. NO FLOAT STRINGS: API responses use numeric types, not "1,234.5"
 *   3. IDEMPOTENT ROUNDING: round(round(x, 2), 2) = round(x, 2)
 *   4. LINE-LEVEL VS AGGREGATE: Σ round(line, 2) ≈ round(Σ line, 2) within tolerance
 *   5. NEGATIVE REPRESENTATION: Negative values are negative floats, not "(1234.00)"
 *   6. ZERO REPRESENTATION: Zero is 0.0 not null/empty/"0.00"/"-0"
 *
 * COVERAGE:
 *  [FMT-01] All monetary values in P&L response are numeric (not strings)
 *  [FMT-02] All monetary values in Balance Sheet are numeric
 *  [FMT-03] All monetary values in Trial Balance rows are numeric
 *  [FMT-04] Line-level sum vs aggregate: Σ income_accounts.balance = revenue
 *  [FMT-05] Line-level sum vs aggregate: Σ expense_accounts.balance = total_expenses
 *  [FMT-06] Balance Sheet: Σ asset account balances = total_assets
 *  [FMT-07] Zero balances are returned as 0 or 0.0, not null/empty
 *  [FMT-08] Rounding idempotency: no value changes when re-rounded to 2dp
 *  [FMT-09] P&L operating_expenses = Σ individual expense line balances
 *  [FMT-10] Inventory Valuation: Σ row.stock_value = total reported
 *
 * @group golden
 * @group phase6
 * @group phase6-formatting
 */
class FormattingConsistencyTest extends VenQoreTestCase
{
    use DatabaseTransactions;

    private const TENANT_ID  = '999991';
    private const YEAR_START = '2025-01-01';
    private const YEAR_END   = '2025-12-31';
    private const TOLERANCE  = 0.02;
    private const LINE_TOL   = 0.50; // Allow up to 50p rounding drift across many lines

    private static bool $seeded = false;

    private Tenant $tenant;
    private FinancialReportingService $reporting;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureSeeded();
        Carbon::setTestNow(self::YEAR_END . ' 02:00:00');
        $this->tenant    = Tenant::findOrFail(self::TENANT_ID);
        $this->bindTenantContext($this->tenant);
        $this->reporting = app(FinancialReportingService::class);

        $ownerUserId = DB::table('tenant_users')
            ->where('tenant_id', self::TENANT_ID)
            ->where('role', 'owner')
            ->value('user_id');

        if ($ownerUserId) {
            $ownerModel = \App\Models\User::find($ownerUserId);
            if ($ownerModel) {
                $this->actingAs($ownerModel);
            }
        }
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

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-01] P&L RESPONSE VALUES ARE NUMERIC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Every top-level monetary field in the P&L response must be a PHP float/int,
     * not a string. React will silently treat a string as NaN in arithmetic.
     */
    public function test_FMT01_pl_response_values_are_numeric(): void
    {
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $monetaryFields = ['revenue', 'cogs', 'gross_profit', 'operating_expenses',
                           'total_expenses', 'net_profit'];

        foreach ($monetaryFields as $field) {
            $this->assertTrue(
                is_float($pl[$field]) || is_int($pl[$field]),
                "[FMT-01] P&L field '{$field}' must be numeric, got: " . gettype($pl[$field])
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-02] BALANCE SHEET VALUES ARE NUMERIC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     */
    public function test_FMT02_balance_sheet_values_are_numeric(): void
    {
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);

        $topLevel = ['total_assets', 'total_liabilities', 'total_equity'];
        foreach ($topLevel as $field) {
            $this->assertTrue(
                is_float($bs[$field]) || is_int($bs[$field]),
                "[FMT-02] Balance Sheet field '{$field}' must be numeric, got: " . gettype($bs[$field])
            );
        }

        // Account-level balance fields
        foreach (['assets', 'liabilities', 'equity'] as $section) {
            foreach ($bs[$section]['accounts'] as $acct) {
                $this->assertTrue(
                    is_float($acct['balance']) || is_int($acct['balance']),
                    "[FMT-02] Balance Sheet account '{$acct['code']}' balance must be numeric"
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-03] TRIAL BALANCE ROW VALUES ARE NUMERIC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     */
    public function test_FMT03_trial_balance_row_values_are_numeric(): void
    {
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);

        foreach ($tb['rows'] as $row) {
            foreach (['total_debit', 'total_credit', 'balance'] as $field) {
                $this->assertTrue(
                    is_float($row[$field]) || is_int($row[$field]),
                    "[FMT-03] Trial Balance row '{$row['code']}' field '{$field}' must be numeric"
                );
            }
        }

        $this->assertTrue(
            is_float($tb['grand_debit']) || is_int($tb['grand_debit']),
            "[FMT-03] Trial Balance grand_debit must be numeric"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-04] LINE-SUM VS AGGREGATE: income_accounts Σ = revenue
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The P&L response includes income_accounts detail lines AND a top-level
     * revenue total. The sum of line balances must equal the reported total.
     *
     * If these diverge, the report has a "total vs detail" inconsistency that
     * means the user sees a subtotal that doesn't add up to the grand total.
     */
    public function test_FMT04_pl_income_account_lines_sum_to_revenue(): void
    {
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $sumLines = collect($pl['income_accounts'])->sum('balance');
        $reported = $pl['revenue'];

        $this->assertEqualsWithDelta($reported, $sumLines, self::LINE_TOL,
            "[FMT-04] P&L: Σ income_account line balances ({$sumLines}) ≠ reported revenue ({$reported})"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-05] LINE-SUM VS AGGREGATE: expense_accounts Σ = operating_expenses
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     */
    public function test_FMT05_pl_expense_account_lines_sum_to_opex(): void
    {
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $sumLines = collect($pl['expense_accounts'])->sum('balance');
        $reported = $pl['operating_expenses'];

        $this->assertEqualsWithDelta($reported, $sumLines, self::LINE_TOL,
            "[FMT-05] P&L: Σ expense_account lines ({$sumLines}) ≠ reported operating_expenses ({$reported})"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-06] BALANCE SHEET: Σ asset account balances = total_assets
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The sum of all individual asset account lines must equal total_assets.
     */
    public function test_FMT06_balance_sheet_asset_lines_sum_to_total_assets(): void
    {
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);

        $sumAssets = collect($bs['assets']['accounts'])->sum('balance');
        $reported  = $bs['total_assets'];

        $this->assertEqualsWithDelta($reported, $sumAssets, self::LINE_TOL,
            "[FMT-06] Balance Sheet: Σ asset lines ({$sumAssets}) ≠ total_assets ({$reported})"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-07] ZERO BALANCES ARE 0 NOT NULL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The P&L for a known zero-activity period must return numeric 0, not null.
     * Returning null for a zero-revenue period causes React to display "—" or crash.
     */
    public function test_FMT07_zero_period_pl_returns_numeric_zeros_not_nulls(): void
    {
        // Use a date that has no transactions (before the Golden Company starts)
        $pl = $this->reporting->getProfitAndLoss('2020-01-01', '2020-12-31');

        $this->assertSame(0.0, $pl['revenue'],
            '[FMT-07] P&L revenue for an empty period must return 0.0 (not null/"")'
        );
        $this->assertSame(0.0, $pl['cogs'],
            '[FMT-07] P&L COGS for an empty period must return 0.0'
        );
        $this->assertSame(0.0, $pl['net_profit'],
            '[FMT-07] P&L net_profit for an empty period must return 0.0'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-08] ROUNDING IDEMPOTENCY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * For every monetary value returned by the service, round(value, 2) must
     * equal the original value. This detects when values are returned with
     * excessive decimal places (e.g., 1578429.999999... instead of 1578430.00).
     */
    public function test_FMT08_monetary_values_are_idempotently_rounded_to_2dp(): void
    {
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);
        $bs = $this->reporting->getBalanceSheet(self::YEAR_END);
        $tb = $this->reporting->getTrialBalance(self::YEAR_END);

        $failures = [];

        // Check P&L top-level values
        foreach (['revenue', 'cogs', 'gross_profit', 'operating_expenses', 'net_profit'] as $f) {
            $v = (float)$pl[$f];
            if (abs($v - round($v, 2)) > 0.0001) {
                $failures[] = "P&L.{$f}={$v} has >2dp precision";
            }
        }

        // Check Balance Sheet totals
        foreach (['total_assets', 'total_liabilities', 'total_equity'] as $f) {
            $v = (float)$bs[$f];
            if (abs($v - round($v, 2)) > 0.0001) {
                $failures[] = "BalanceSheet.{$f}={$v} has >2dp precision";
            }
        }

        // Check Trial Balance account rows
        foreach ($tb['rows'] as $row) {
            foreach (['total_debit', 'total_credit', 'balance'] as $f) {
                $v = (float)$row[$f];
                if (abs($v - round($v, 2)) > 0.0001) {
                    $failures[] = "TrialBalance.{$row['code']}.{$f}={$v} has >2dp precision";
                }
            }
        }

        $this->assertEmpty($failures,
            "[FMT-08] Values with more than 2 decimal places:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-09] P&L OPERATING_EXPENSES = Σ expense_accounts
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * operating_expenses = Σ expense_accounts.balance (excluding COGS)
     * This is a direct test of the service's own arithmetic consistency.
     */
    public function test_FMT09_pl_operating_expenses_equals_sum_of_expense_lines(): void
    {
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);

        $sumExpenseLines = collect($pl['expense_accounts'])->sum('balance');
        $reportedOpex    = $pl['operating_expenses'];

        // Verify COGS is NOT included in expense_accounts lines
        $cogsInExpenses = collect($pl['expense_accounts'])
            ->filter(fn($a) => ($a['code'] ?? '') === '5000')
            ->count();

        $this->assertEquals(0, $cogsInExpenses,
            '[FMT-09] COGS (account 5000) must NOT appear in expense_accounts lines'
        );

        $this->assertEqualsWithDelta($reportedOpex, $sumExpenseLines, self::LINE_TOL,
            "[FMT-09] operating_expenses ({$reportedOpex}) ≠ Σ expense_accounts ({$sumExpenseLines})"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FMT-10] INVENTORY VALUATION: Σ row.stock_value = total
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The inventory valuation report's per-product rows must sum to the
     * reported total. This prevents a "subtotals don't add up" UI bug.
     */
    public function test_FMT10_inventory_valuation_row_sum_equals_reported_total(): void
    {
        $report = $this->reporting->getInventoryValuationReport();
        $rowSum = $report->sum('stock_value');
        $total  = $this->reporting->getInventoryValue();

        $this->assertEqualsWithDelta($total, $rowSum, self::LINE_TOL,
            "[FMT-10] getInventoryValue() ({$total}) ≠ Σ getInventoryValuationReport() stock_value ({$rowSum})"
        );
    }
}
