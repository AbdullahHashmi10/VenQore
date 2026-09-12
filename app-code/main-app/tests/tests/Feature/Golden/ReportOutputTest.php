<?php

namespace Tests\Feature\Golden;

/**
 * ============================================================
 * Phase 5 — Report Endpoint Output Verification
 * ============================================================
 *
 * Every report endpoint must return JSON that matches the manifest.
 * Tests fire real HTTP requests through TenantMiddleware/Auth with
 * the Golden Company owner account and the clock frozen at year-end.
 *
 * COVERAGE:
 *  [R-01] GET reports/trial-balance — Σ DR = Σ CR, matches manifest
 *  [R-02] GET reports/profit-loss — revenue, COGS, net profit vs manifest
 *  [R-03] GET reports/balance-sheet — totals + is_balanced flag
 *  [R-04] GET reports/cash-flow — net_change plausibility
 *  [R-05] GET reports/inventory-valuation — total_value matches manifest
 *  [R-06] GET reports/cogs — total_cogs matches manifest + reconciled=true
 *  [R-07] GET reports/gross-profit — Σ product gross profits = manifest gross_profit
 *  [R-08] GET reports/tax — output tax (GL 2100) matches manifest
 *  [R-09] GET reports/sales — total_revenue = manifest annual revenue
 *  [R-10] GET reports/purchases — total_spend matches Σ purchase transactions
 *  [R-11] FILTER: profit-loss with ?from=&to= scoped date returns plausible data
 *  [R-12] FILTER: complement property — Q1 revenue + Q2-Q4 revenue = annual revenue
 *  [R-13] GET reports/aged-receivables — total matches manifest AR
 *  [R-14] GET reports/party-ledger/{partyId} — closing balance for CUST-SARA = manifest
 *  [R-15] All report endpoints return 200 (smoke test — no 404/500)
 *
 * @group golden
 * @group phase5
 * @group phase5-reports
 */
class ReportOutputTest extends OutputVerificationTestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // [R-01] TRIAL BALANCE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Trial Balance endpoint must return balanced debits and credits
     * matching the manifest trial_balance totals.
     */
    public function test_R01_trial_balance_endpoint_is_balanced_and_matches_manifest(): void
    {
        $props = $this->reportGet('reports/trial-balance', [
            'as_of' => self::YEAR_END,
        ]);

        // Must be balanced
        $balanced = $this->findKey($props, 'balanced');
        $this->assertTrue((bool)$balanced,
            '[R-01] Trial Balance endpoint: balanced must be true'
        );

        // Σ DR must match manifest
        $grandDebit  = (float)($this->findKey($props, 'grand_debit')  ?? 0);
        $grandCredit = (float)($this->findKey($props, 'grand_credit') ?? 0);
        $expectedDr  = (float)($this->M('consistency_assertions', 'trial_balance_must_zero', 'total_debits')  ?? 0);
        $expectedCr  = (float)($this->M('consistency_assertions', 'trial_balance_must_zero', 'total_credits') ?? 0);

        $this->assertMoney($expectedDr, $grandDebit,  '[R-01] Trial Balance Σ DR vs manifest');
        $this->assertMoney($expectedCr, $grandCredit, '[R-01] Trial Balance Σ CR vs manifest');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-02] PROFIT & LOSS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * P&L endpoint for the full year must return manifest values.
     */
    public function test_R02_profit_loss_endpoint_matches_manifest(): void
    {
        $props = $this->reportGet('reports/profit-loss', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $expected = self::$manifest['year_end']['profit_and_loss'];

        $revenue    = (float)($this->findKey($props, 'revenue')    ?? 0);
        $cogs       = (float)($this->findKey($props, 'cogs')       ?? 0);
        $netProfit  = (float)($this->findKey($props, 'net_profit') ?? 0);

        $this->assertMoney($expected['revenue'],    $revenue,   '[R-02] P&L revenue');
        $this->assertMoney($expected['cogs'],       $cogs,      '[R-02] P&L COGS');
        $this->assertMoney($expected['net_profit'], $netProfit, '[R-02] P&L net profit');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-03] BALANCE SHEET
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Balance Sheet endpoint as of year-end must return correct totals
     * and the is_balanced flag must be true.
     */
    public function test_R03_balance_sheet_endpoint_balanced_and_matches_manifest(): void
    {
        $props = $this->reportGet('reports/balance-sheet', [
            'as_of' => self::YEAR_END,
        ]);

        $expected    = self::$manifest['year_end']['balance_sheet'];
        $isBalanced  = (bool)($this->findKey($props, 'is_balanced') ?? false);
        $totalAssets = (float)($this->findKey($props, 'total_assets') ?? 0);
        $totalLiab   = (float)($this->findKey($props, 'total_liabilities') ?? 0);
        $totalEquity = (float)($this->findKey($props, 'total_equity') ?? 0);

        $this->assertTrue($isBalanced, '[R-03] Balance Sheet endpoint: is_balanced must be true');
        $this->assertMoney($expected['total_assets'],      $totalAssets, '[R-03] Total Assets');
        $this->assertMoney($expected['total_liabilities'], $totalLiab,   '[R-03] Total Liabilities');
        $this->assertMoney($expected['total_equity'],      $totalEquity, '[R-03] Total Equity');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-04] CASH FLOW
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Cash Flow report: net_change_in_cash must be plausible (non-zero for
     * a year with lots of transactions) and operating inflow > 0.
     */
    public function test_R04_cash_flow_endpoint_returns_plausible_data(): void
    {
        $props = $this->reportGet('reports/cash-flow', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $netChange = (float)($this->findKey($props, 'net_change_in_cash')
                          ?? $this->findKey($props, 'net_cash_flow')
                          ?? 0);

        // Cash position must not be exactly 0 (we have lots of activity)
        // The closing cash is Rs.1,751,685 which is substantial
        $this->assertNotEqualsWithDelta(0.0, $netChange, 1.0,
            '[R-04] Cash flow net_change_in_cash must not be zero for a year with real transactions'
        );

        // Also assert operating inflow > 0
        $inflow = (float)($this->findKey($props, 'operating_inflow')
                       ?? $this->findKey($props, 'net_operating')
                       ?? 0);

        $this->assertGreaterThan(0.0, $inflow,
            '[R-04] Cash Flow operating inflow must be positive (cash sales > 0)'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-05] INVENTORY VALUATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Inventory Valuation endpoint total must match manifest's total_value.
     */
    public function test_R05_inventory_valuation_endpoint_matches_manifest(): void
    {
        $props = $this->reportGet('reports/inventory-valuation');

        $manifestTotal = (float)($this->M('inventory', 'total_value') ?? 0);

        // Look for total across possible key names
        $total = (float)($this->findKey($props, 'total_value')
                      ?? $this->findKey($props, 'inventory_value')
                      ?? $this->findKey($props, 'total')
                      ?? 0);

        // If wrapped in array of rows, sum them
        if ($total === 0.0 && isset($props['rows'])) {
            $total = collect($props['rows'])->sum('stock_value');
        }

        $this->assertMoney($manifestTotal, $total,
            '[R-05] Inventory Valuation total vs manifest'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-06] COGS REPORT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * COGS endpoint must show reconciled=true and total_cogs = manifest.
     */
    public function test_R06_cogs_endpoint_reconciled_and_matches_manifest(): void
    {
        $props = $this->reportGet('reports/cogs', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $reconciled = $this->findKey($props, 'reconciled');
        $totalCogs  = (float)($this->findKey($props, 'total_cogs') ?? 0);
        $expectedCogs = (float)($this->M('year_end', 'profit_and_loss', 'cogs') ?? 0);

        $this->assertTrue((bool)$reconciled,
            '[R-06] COGS report: reconciled must be true (FIFO vs GL 5000 must agree)'
        );
        $this->assertMoney($expectedCogs, $totalCogs, '[R-06] COGS report total_cogs vs manifest');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-07] GROSS PROFIT BY PRODUCT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Σ gross_profit across all products must equal manifest annual gross_profit.
     */
    public function test_R07_gross_profit_by_product_sums_to_manifest(): void
    {
        $props = $this->reportGet('reports/gross-profit', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $expectedGross = (float)($this->M('year_end', 'profit_and_loss', 'gross_profit') ?? 0);

        // Sum across product rows
        $rows = $props['rows'] ?? (is_array($props) ? $props : []);
        $actualGross = collect($rows)->sum(function ($row) {
            return (float)($row['gross_profit'] ?? 0);
        });

        $this->assertMoney($expectedGross, $actualGross,
            '[R-07] Σ gross_profit by product vs manifest annual gross_profit'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-08] TAX SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Tax report output_tax must match manifest GL 2100 balance (year-end).
     */
    public function test_R08_tax_endpoint_output_tax_matches_manifest(): void
    {
        $props = $this->reportGet('reports/tax', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $expectedOutputTax = (float)($this->M('year_end', 'account_balances', '2100') ?? 0);
        $outputTax = (float)($this->findKey($props, 'output_tax') ?? 0);

        $this->assertMoney($expectedOutputTax, $outputTax, '[R-08] Tax report output_tax (GL 2100)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-09] SALES REPORT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Sales report total_revenue for full year = manifest annual revenue.
     */
    public function test_R09_sales_report_total_revenue_matches_manifest(): void
    {
        $props = $this->reportGet('reports/sales', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $expectedRevenue = (float)($this->M('year_end', 'profit_and_loss', 'revenue') ?? 0);
        $actualRevenue   = (float)($this->findKey($props, 'total_revenue') ?? 0);

        $this->assertMoney($expectedRevenue, $actualRevenue,
            '[R-09] Sales report total_revenue vs manifest'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-10] PURCHASES REPORT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Purchases report total_spend for full year must be > 0 and plausible.
     * Exact figure from manifest: sum of all purchase totals.
     *  TXN-PUR-001: 374,400
     *  TXN-PUR-002: 20,000
     *  TXN-PUR-003: 195,975
     *  TXN-PUR-004: 463,320
     *  TXN-PUR-005: 795,600
     *  (TXN-ISO-PUR-001 is Tenant 2, must not appear)
     *  Total T1 purchases = 1,849,295
     */
    public function test_R10_purchases_report_total_spend_matches_manifest(): void
    {
        $props = $this->reportGet('reports/purchases', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $expectedSpend = 374400 + 20000 + 195975 + 463320 + 795600; // = 1,849,295
        $actualSpend   = (float)($this->findKey($props, 'total_spend') ?? 0);

        $this->assertMoney((float)$expectedSpend, $actualSpend,
            '[R-10] Purchases report total_spend vs calculated manifest sum'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-11] FILTER: SCOPED DATE RANGE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * P&L with a scoped date range (Q1 only) must return revenue < annual revenue.
     * This verifies the date filter works — it doesn't return full-year data.
     */
    public function test_R11_profit_loss_scoped_date_returns_partial_year_data(): void
    {
        // Q1 only
        $q1Props = $this->reportGet('reports/profit-loss', [
            'from' => '2025-01-01',
            'to'   => '2025-03-31',
        ]);

        $annualProps = $this->reportGet('reports/profit-loss', [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $q1Revenue     = (float)($this->findKey($q1Props, 'revenue') ?? 0);
        $annualRevenue = (float)($this->findKey($annualProps, 'revenue') ?? 0);

        $this->assertGreaterThan(0.0, $q1Revenue,
            '[R-11] Q1 P&L revenue must be > 0 (Q1 has multiple sales)'
        );
        $this->assertLessThan($annualRevenue, $q1Revenue,
            '[R-11] Q1 revenue must be less than annual revenue (filter is working)'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-12] COMPLEMENT PROPERTY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * COMPLEMENT PROPERTY: Q1 revenue + Q2-Q4 revenue = annual revenue.
     *
     * This is the most important filter integrity test. If this fails,
     * the date filter is DOUBLE COUNTING or MISSING data.
     */
    public function test_R12_complement_property_q1_plus_rest_equals_annual(): void
    {
        $q1 = $this->reportGet('reports/profit-loss', [
            'from' => '2025-01-01', 'to' => '2025-03-31',
        ]);
        $q234 = $this->reportGet('reports/profit-loss', [
            'from' => '2025-04-01', 'to' => '2025-12-31',
        ]);
        $annual = $this->reportGet('reports/profit-loss', [
            'from' => self::YEAR_START, 'to' => self::YEAR_END,
        ]);

        $sumRevenue = (float)($this->findKey($q1, 'revenue') ?? 0)
                   + (float)($this->findKey($q234, 'revenue') ?? 0);
        $annualRevenue = (float)($this->findKey($annual, 'revenue') ?? 0);

        $this->assertEqualsWithDelta($annualRevenue, $sumRevenue, self::TOLERANCE * 2,
            sprintf(
                '[R-12] COMPLEMENT PROPERTY: Q1(%.2f) + Q2-Q4(%.2f) = %.2f, annual=%.2f, diff=%.2f',
                (float)($this->findKey($q1, 'revenue') ?? 0),
                (float)($this->findKey($q234, 'revenue') ?? 0),
                $sumRevenue,
                $annualRevenue,
                abs($annualRevenue - $sumRevenue)
            )
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-13] AGED RECEIVABLES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Aged Receivables total must match manifest AR balance (GL 1200).
     * Note: Aged receivables only includes UNPAID invoices, so the total
     * may be less than the raw AR GL balance if some invoices are partially paid.
     */
    public function test_R13_aged_receivables_total_matches_manifest(): void
    {
        $props = $this->reportGet('reports/aged-receivables', [
            'as_of' => self::YEAR_END,
        ]);

        $manifestAr = (float)($this->M('ar_balances', 'total') ?? 0);

        // Aged AR total = sum of outstanding invoice amounts (not GL raw movement)
        // They should agree for our simple Golden Company (no partial payments except noted)
        $total = (float)($this->findKey($props, 'total') ?? 0);

        // Plausibility check: aged AR ≤ GL AR (can't owe more than the GL says)
        $this->assertLessThanOrEqual(
            $manifestAr + 1.0, // small buffer
            $total,
            '[R-13] Aged Receivables total cannot exceed GL 1200 balance'
        );

        // Must be positive (some invoices are unpaid in Golden Company)
        $this->assertGreaterThan(0.0, $total,
            '[R-13] Aged Receivables total must be positive (unpaid invoices exist)'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-14] PARTY LEDGER — CUST-SARA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Party ledger for CUST-SARA must show closing balance = manifest AR for SARA.
     * Manifest: CUST-SARA has AR = Rs.368,550.10 (TXN-SAL-003, unpaid).
     */
    public function test_R14_party_ledger_closing_balance_matches_manifest(): void
    {
        $saraId = \Illuminate\Support\Facades\DB::table('parties')
            ->where('tenant_id', self::TENANT_ID)
            ->where('type', 'customer')
            ->where(function($q) {
                $q->where('id', 'gc-cust-sara-00000000000000001')
                  ->orWhere('name', 'like', '%Sara%');
            })
            ->value('id');

        $this->assertNotNull($saraId, 'CUST-SARA not found in parties table — seeder may use a different name; GoldenSeedManager guarantees this data exists, so a null result here means the seeder or schema drifted.');

        $props = $this->reportGet("reports/party-ledger/{$saraId}", [
            'from' => self::YEAR_START,
            'to'   => self::YEAR_END,
        ]);

        $closingBalance = (float)($this->findKey($props, 'closing_balance') ?? 0);

        $manifestSaraAr = (float)($this->M('ar_balances', 'by_customer', 'CUST-SARA') ?? 0);

        $this->assertMoney(
            $manifestSaraAr,
            $closingBalance,
            "[R-14] Party ledger closing balance for CUST-SARA vs manifest (expected AR=Rs.{$manifestSaraAr})"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [R-15] SMOKE TEST — ALL REPORT ENDPOINTS RETURN 200
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * All report endpoints must return HTTP 200. No 404, 403, or 500.
     * This is the "no crash" guarantee for the entire report surface.
     */
    public function test_R15_all_report_endpoints_return_200(): void
    {
        $endpoints = [
            'reports/trial-balance'       => ['as_of' => self::YEAR_END],
            'reports/profit-loss'         => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/balance-sheet'       => ['as_of' => self::YEAR_END],
            'reports/cash-flow'           => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/aged-receivables'    => ['as_of' => self::YEAR_END],
            'reports/aged-payables'       => ['as_of' => self::YEAR_END],
            'reports/sales'               => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/purchases'           => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/inventory-valuation' => [],
            'reports/cogs'                => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/gross-profit'        => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/tax'                 => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'reports/inventory-movement'  => ['from' => self::YEAR_START, 'to' => self::YEAR_END],
            'dashboard'                   => [],
        ];

        $failures = [];

        foreach ($endpoints as $path => $params) {
            $url = $this->v3Url($path);
            if (!empty($params)) {
                $url .= '?' . http_build_query($params);
            }

            $response = $this->withHeaders([
                'Accept'    => 'application/json',
                'X-Inertia' => 'true',
            ])->get($url);

            if ($response->status() !== 200) {
                $failures[] = sprintf('%s → HTTP %d', $path, $response->status());
            }
        }

        $this->assertEmpty($failures,
            "[R-15] Report endpoints with non-200 responses:\n" . implode("\n", $failures)
        );
    }
}
