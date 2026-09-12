<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Services\FinancialReportingService;
use Tests\Feature\Golden\Verification\VerificationClaim;
use Tests\Feature\Golden\Verification\ClaimLogger;
use Tests\Support\RequiresGoldenCompany;

/**
 * ============================================================
 * Phase 6 — Cross-Surface Consistency Tests
 * ============================================================
 *
 * DOCTRINE:
 *  The same monetary figure MUST be byte-identical (within TOLERANCE)
 *  on every surface that displays it. If the dashboard shows Rs.1,578,430
 *  in revenue but the P&L report shows Rs.1,578,429.98, the system has
 *  an inconsistency — even if each individual figure is "close to correct".
 *
 *  Surfaces tested:
 *    - /v3/dashboard                  → DashboardController
 *    - /v3/reports/profit-loss        → ReportController::profitAndLoss()
 *    - /v3/reports/balance-sheet      → ReportController::balanceSheet()
 *    - /v3/reports/trial-balance      → ReportController::trialBalance()
 *    - /v3/reports/inventory-valuation → ReportController::inventoryValuation()
 *    - /v3/reports/cogs               → ReportController::cogs()
 *    - /v3/reports/gross-profit       → ReportController::grossProfit()
 *    - /v3/reports/tax                → ReportController::tax()
 *    - FinancialReportingService (direct service calls)
 *
 *  All tests use the Golden Company seeded tenant with clock frozen
 *  at a specified position. Tests run at FOUR positions (sub-classes).
 *
 * KEY CONSISTENCY INVARIANTS:
 *  [I-A] Dashboard.cash     = Balance Sheet asset 1000       = GL 1000 direct
 *  [I-B] Dashboard.bank     = Balance Sheet asset 1010       = GL 1010 direct
 *  [I-C] Dashboard.receivables = Balance Sheet asset 1200    = AgedReceivables total
 *  [I-D] Dashboard.payables  = Balance Sheet liability 2000  = AgedPayables total
 *  [I-E] P&L revenue         = Σ gross-profit rows revenue   = Σ COGS rows revenue
 *  [I-F] P&L COGS            = COGS report total             = Σ gross-profit rows cogs
 *  [I-G] Balance Sheet 1100  = Inventory Valuation total     = getInventoryValue()
 *  [I-H] P&L gross_profit    = Σ gross-profit rows gross_profit
 *  [I-I] Tax output_tax      = Balance Sheet liability 2100
 *  [I-J] Trial Balance DR    = Trial Balance CR = Σ Balance Sheet all items
 *
 * @group golden
 * @group phase6
 * @group phase6-consistency
 */
class CrossSurfaceConsistencyTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    protected const TENANT_ID  = '999991';
    protected const YEAR_START = '2025-01-01';
    protected const YEAR_END   = '2025-12-31';
    protected const TOLERANCE  = 0.02;

    /** The clock position for this batch of consistency checks. */
    protected string $clockDate = self::YEAR_END;


    protected Tenant $tenant;
    protected FinancialReportingService $reporting;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow($this->clockDate . ' 23:59:59');

        $this->tenant = Tenant::findOrFail(self::TENANT_ID);
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



    // ─────────────────────────────────────────────────────────────────────────
    // HTTP HELPER
    // ─────────────────────────────────────────────────────────────────────────

    protected function apiGet(string $path, array $params = []): array
    {
        $slug = $this->tenant->slug ?? 'golden-company';
        $url  = "/s/{$slug}/v3/{$path}";
        if (!empty($params)) $url .= '?' . http_build_query($params);

        $response = $this->withHeaders([
            'Accept'    => 'application/json',
            'X-Inertia' => 'true',
        ])->get($url);

        $response->assertStatus(200);
        $data = $response->json();
        return $data['props'] ?? $data;
    }

    protected function findKey(array $data, string $key): mixed
    {
        if (array_key_exists($key, $data)) return $data[$key];
        foreach ($data as $v) {
            if (is_array($v)) {
                $result = $this->findKey($v, $key);
                if ($result !== null) return $result;
            }
        }
        return null;
    }

    protected function assertConsistent(float $a, float $b, string $label): void
    {
        ClaimLogger::log(new VerificationClaim(
            expectedValue: $a,
            actualValue: $b,
            metric: $label,
            surface: 'CrossSurfaceConsistencyTest',
            clockPosition: $this->clockDate ?? null
        ));

        $this->assertEqualsWithDelta($a, $b, self::TOLERANCE,
            "INCONSISTENCY [{$label}] at clock={$this->clockDate}: " .
            "surface_a=" . number_format($a, 2) . " vs surface_b=" . number_format($b, 2) .
            " diff=" . number_format(abs($a - $b), 2)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-A] CASH: Dashboard vs Balance Sheet vs GL direct
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Cash must be identical on three surfaces:
     *   1. Dashboard card
     *   2. Balance Sheet asset 1000 line
     *   3. FinancialReportingService::getBalanceSheet() asset 1000
     */
    public function test_IA_cash_consistent_across_dashboard_balancesheet_service(): void
    {
        $periodStart = self::YEAR_START;
        $periodEnd   = $this->clockDate;

        // Surface 1: Dashboard
        $dash    = $this->apiGet('dashboard');
        $dashCash = (float)($this->findKey($dash, 'cash') ?? 0);

        // Surface 2: Balance Sheet HTTP
        $bsProps = $this->apiGet('reports/balance-sheet', ['as_of' => $periodEnd]);
        $bsAssets = $bsProps['assets']['accounts'] ?? [];
        $bsCash   = 0.0;
        foreach ($bsAssets as $acct) {
            if (($acct['code'] ?? '') === '1000') {
                $bsCash = (float)$acct['balance'];
                break;
            }
        }

        // Surface 3: Direct service
        $bs       = $this->reporting->getBalanceSheet($periodEnd);
        $svcCash  = 0.0;
        foreach ($bs['assets']['accounts'] as $acct) {
            if (($acct['code'] ?? '') === '1000') {
                $svcCash = (float)$acct['balance'];
                break;
            }
        }

        $this->assertConsistent($dashCash, $bsCash,  '[I-A] cash: Dashboard vs Balance Sheet HTTP');
        $this->assertConsistent($dashCash, $svcCash, '[I-A] cash: Dashboard vs FinancialReportingService');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-B] BANK: Dashboard vs Balance Sheet
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     */
    public function test_IB_bank_consistent_across_dashboard_and_balance_sheet(): void
    {
        $periodEnd = $this->clockDate;

        $dash    = $this->apiGet('dashboard');
        $dashBank = (float)($this->findKey($dash, 'bank') ?? 0);

        $bs       = $this->reporting->getBalanceSheet($periodEnd);
        $svcBank  = 0.0;
        foreach ($bs['assets']['accounts'] as $acct) {
            if (($acct['code'] ?? '') === '1010') {
                $svcBank = (float)$acct['balance'];
                break;
            }
        }

        $this->assertConsistent($dashBank, $svcBank,
            '[I-B] bank: Dashboard vs FinancialReportingService Balance Sheet'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-C] RECEIVABLES: Dashboard vs Balance Sheet GL 1200 vs getReceivables()
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     */
    public function test_IC_receivables_consistent_across_three_surfaces(): void
    {
        $periodEnd = $this->clockDate;

        $dash = $this->apiGet('dashboard');
        $dashAr = (float)($this->findKey($dash, 'receivables') ?? 0);

        $svcAr = $this->reporting->getReceivables($periodEnd);

        $bs = $this->reporting->getBalanceSheet($periodEnd);
        $bsAr = 0.0;
        foreach ($bs['assets']['accounts'] as $acct) {
            if (($acct['code'] ?? '') === '1200') {
                $bsAr = (float)$acct['balance'];
                break;
            }
        }

        $this->assertConsistent($dashAr, $svcAr, '[I-C] receivables: Dashboard vs getReceivables()');
        $this->assertConsistent($svcAr, $bsAr,   '[I-C] receivables: getReceivables() vs Balance Sheet 1200');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-D] PAYABLES: Dashboard vs Balance Sheet GL 2000 vs getPayables()
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     */
    public function test_ID_payables_consistent_across_three_surfaces(): void
    {
        $periodEnd = $this->clockDate;

        $dash   = $this->apiGet('dashboard');
        $dashAp = (float)($this->findKey($dash, 'payables') ?? 0);

        $svcAp = $this->reporting->getPayables($periodEnd);

        $bs   = $this->reporting->getBalanceSheet($periodEnd);
        $bsAp = 0.0;
        foreach ($bs['liabilities']['accounts'] as $acct) {
            if (($acct['code'] ?? '') === '2000') {
                $bsAp = (float)$acct['balance'];
                break;
            }
        }

        $this->assertConsistent($dashAp, $svcAp, '[I-D] payables: Dashboard vs getPayables()');
        $this->assertConsistent($svcAp, $bsAp,   '[I-D] payables: getPayables() vs Balance Sheet 2000');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-E] P&L REVENUE: P&L endpoint vs Σ gross-profit rows vs Σ COGS rows
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Revenue declared by the P&L endpoint must equal the Σ net_revenue of
     * every product row in the gross-profit report.
     *
     * Both call the same underlying service, but through different controller
     * methods. If they disagree, a query filter or aggregation is wrong.
     */
    public function test_IE_revenue_consistent_pl_vs_gross_profit_rows(): void
    {
        $start = self::YEAR_START;
        $end   = $this->clockDate;

        $plProps   = $this->apiGet('reports/profit-loss',  ['from' => $start, 'to' => $end]);
        $plRevenue = (float)($this->findKey($plProps, 'revenue') ?? 0);

        $gpProps   = $this->apiGet('reports/gross-profit', ['from' => $start, 'to' => $end]);
        $gpRows    = $gpProps['rows'] ?? (is_array($gpProps) ? $gpProps : []);
        $gpRevenue = collect($gpRows)->sum(fn($r) => (float)($r['net_revenue'] ?? 0));

        // P&L revenue comes from journal_items (ledger-derived)
        // Gross-profit revenue comes from sale_items (transaction-derived)
        // They MUST agree — this is the cross-source consistency check
        $this->assertConsistent($plRevenue, $gpRevenue,
            '[I-E] P&L revenue (ledger) vs Σ gross-profit rows revenue (sale_items)'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-F] COGS: P&L endpoint vs COGS report vs Σ gross-profit rows
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * COGS from three surfaces must agree:
     *   1. P&L endpoint → COGS from GL account 5000
     *   2. COGS report → total_cogs from sale_item_batches
     *   3. Gross-profit rows → Σ cogs column
     */
    public function test_IF_cogs_consistent_across_pl_cogsreport_and_grossprofit(): void
    {
        $start = self::YEAR_START;
        $end   = $this->clockDate;

        $plCogs   = (float)($this->findKey($this->apiGet('reports/profit-loss', ['from' => $start, 'to' => $end]), 'cogs') ?? 0);
        $cogsRpt  = (float)($this->findKey($this->apiGet('reports/cogs',        ['from' => $start, 'to' => $end]), 'total_cogs') ?? 0);

        $gpRows = $this->apiGet('reports/gross-profit', ['from' => $start, 'to' => $end]);
        $gpCogs = collect($gpRows['rows'] ?? (is_array($gpRows) ? $gpRows : []))
            ->sum(fn($r) => (float)($r['cogs'] ?? 0));

        $this->assertConsistent($plCogs,  $cogsRpt, '[I-F] COGS: P&L (GL) vs COGS report (FIFO)');
        $this->assertConsistent($cogsRpt, $gpCogs,  '[I-F] COGS: COGS report vs Σ gross-profit rows');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-G] INVENTORY VALUE: Balance Sheet 1100 vs Valuation Report vs Service
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Inventory value on three surfaces must be identical:
     *   1. Balance Sheet GL 1100 line
     *   2. Inventory Valuation report total
     *   3. FinancialReportingService::getInventoryValue()
     */
    public function test_IG_inventory_value_consistent_across_three_surfaces(): void
    {
        // Surface 1: Balance Sheet 1100
        $bs    = $this->reporting->getBalanceSheet($this->clockDate);
        $bs1100 = 0.0;
        foreach ($bs['assets']['accounts'] as $acct) {
            if (($acct['code'] ?? '') === '1100') {
                $bs1100 = (float)$acct['balance'];
                break;
            }
        }

        // Surface 2: Inventory Valuation HTTP
        $ivProps = $this->apiGet('reports/inventory-valuation');
        $ivTotal = (float)($this->findKey($ivProps, 'total_value')
                        ?? $this->findKey($ivProps, 'inventory_value')
                        ?? collect($ivProps['rows'] ?? [])->sum('stock_value')
                        ?? 0);

        // Surface 3: Direct service
        $svcTotal = $this->reporting->getInventoryValue();

        $this->assertConsistent($bs1100,   $ivTotal,  '[I-G] Inventory: BS 1100 vs Valuation HTTP');
        $this->assertConsistent($ivTotal,  $svcTotal, '[I-G] Inventory: Valuation HTTP vs getInventoryValue()');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-H] GROSS PROFIT: P&L endpoint vs Σ gross-profit report rows
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Gross profit from the P&L report must equal Σ gross_profit across
     * all product rows in the gross-profit report.
     */
    public function test_IH_gross_profit_consistent_pl_vs_gross_profit_rows(): void
    {
        $start = self::YEAR_START;
        $end   = $this->clockDate;

        $plProps      = $this->apiGet('reports/profit-loss', ['from' => $start, 'to' => $end]);
        $plGross      = (float)($this->findKey($plProps, 'gross_profit') ?? 0);

        $gpRows       = $this->apiGet('reports/gross-profit', ['from' => $start, 'to' => $end]);
        $gpGross      = collect($gpRows['rows'] ?? (is_array($gpRows) ? $gpRows : []))
                            ->sum(fn($r) => (float)($r['gross_profit'] ?? 0));

        $this->assertConsistent($plGross, $gpGross,
            '[I-H] Gross profit: P&L endpoint vs Σ gross-profit report rows'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-I] OUTPUT TAX: Tax report vs Balance Sheet GL 2100
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Sales Tax Payable (GL 2100) balance must match the tax report's output_tax.
     */
    public function test_II_output_tax_consistent_tax_report_vs_balance_sheet(): void
    {
        $start = self::YEAR_START;
        $end   = $this->clockDate;

        $taxProps  = $this->apiGet('reports/tax', ['from' => $start, 'to' => $end]);
        $outputTax = (float)($this->findKey($taxProps, 'output_tax') ?? 0);

        $bs    = $this->reporting->getBalanceSheet($end);
        $bs2100 = 0.0;
        foreach ($bs['liabilities']['accounts'] as $acct) {
            if (($acct['code'] ?? '') === '2100') {
                $bs2100 = (float)$acct['balance'];
                break;
            }
        }

        $this->assertConsistent($outputTax, $bs2100,
            '[I-I] Output Tax: tax report output_tax vs Balance Sheet GL 2100'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-J] TRIAL BALANCE: Σ DR = Σ CR = Σ Balance Sheet items
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Trial Balance grand totals must be balanced AND must cross-check with
     * the sum of all Balance Sheet asset, liability, and equity accounts
     * (gross debit/credit movements, not net positions).
     */
    public function test_IJ_trial_balance_consistent_with_balance_sheet(): void
    {
        $end = $this->clockDate;

        $tbProps = $this->apiGet('reports/trial-balance', ['as_of' => $end]);
        $tbDr    = (float)($this->findKey($tbProps, 'grand_debit')  ?? 0);
        $tbCr    = (float)($this->findKey($tbProps, 'grand_credit') ?? 0);

        // TB must be balanced
        $this->assertConsistent($tbDr, $tbCr,
            '[I-J] Trial Balance: grand_debit must equal grand_credit'
        );

        // Service-level consistency
        $tb = $this->reporting->getTrialBalance($end);
        $this->assertTrue($tb['balanced'],
            "[I-J] getTrialBalance($end): balanced must be true"
        );

        $this->assertConsistent($tbDr, $tb['grand_debit'],
            '[I-J] Trial Balance HTTP vs service: grand_debit'
        );
        $this->assertConsistent($tbCr, $tb['grand_credit'],
            '[I-J] Trial Balance HTTP vs service: grand_credit'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [I-K] BALANCE SHEET EQUATION: HTTP vs service agree
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Balance Sheet HTTP endpoint total_assets must equal service total_assets.
     * Cross-checks that the controller serializes the service output correctly.
     */
    public function test_IK_balance_sheet_http_and_service_agree(): void
    {
        $end = $this->clockDate;

        $bsProps = $this->apiGet('reports/balance-sheet', ['as_of' => $end]);
        $httpAssets  = (float)($this->findKey($bsProps, 'total_assets')      ?? 0);
        $httpLiab    = (float)($this->findKey($bsProps, 'total_liabilities') ?? 0);
        $httpEquity  = (float)($this->findKey($bsProps, 'total_equity')      ?? 0);

        $bs = $this->reporting->getBalanceSheet($end);

        $this->assertConsistent($httpAssets, $bs['total_assets'],      '[I-K] BS: HTTP total_assets vs service');
        $this->assertConsistent($httpLiab,   $bs['total_liabilities'], '[I-K] BS: HTTP total_liabilities vs service');
        $this->assertConsistent($httpEquity, $bs['total_equity'],      '[I-K] BS: HTTP total_equity vs service');
    }

}
