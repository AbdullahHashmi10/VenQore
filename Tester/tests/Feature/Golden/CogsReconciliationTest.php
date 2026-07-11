<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Services\FinancialReportingService;
use Tests\Support\RequiresGoldenCompany;

/**
 * ============================================================
 * Phase 4 — COGS Reconciliation Verification
 * ============================================================
 *
 * DOCTRINE:
 *  COGS is computed from two independent sources in this system:
 *    1. GL Account 5000 — the ledger entry posted when each sale is made
 *    2. sale_item_batches.total_cogs — FIFO layer consumption records
 *
 *  These MUST agree. If they disagree, either:
 *    (a) A sale was made without journalizing COGS (bypass detected), OR
 *    (b) The FIFO service posted the wrong cost to the journal
 *
 *  getCogsReport() exposes a `reconciled` boolean that compares these
 *  two sources. These tests drive that assertion.
 *
 *  Additionally, we verify:
 *    - Per-sale COGS = Σ sale_item_batches.total_cogs for that sale
 *    - The GL 5000 activity = Σ sale_item_batches.total_cogs for the period
 *    - COGS by product sums to the same total as overall COGS
 *
 * COVERAGE:
 *  [C-01] Annual COGS (GL 5000) = Σ FIFO batch consumption (sale_item_batches)
 *  [C-02] getCogsReport() reconciled field is TRUE for every period
 *  [C-03] Annual COGS matches manifest declared value
 *  [C-04] Per-month COGS: GL 5000 = sale_item_batches for each month
 *  [C-05] COGS by product: Σ product COGS = total COGS
 *  [C-06] Zero-discount promotional sale: COGS > 0 even though revenue = 0
 *  [C-07] getGrossProfitByProduct() COGS matches direct sale_item_batches sum
 *
 * @group golden
 * @group phase4
 * @group phase4-cogs
 */
class CogsReconciliationTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    private const TENANT_ID = '999991';
    private const YEAR_START = '2025-01-01';
    private const YEAR_END   = '2025-12-31';
    private const TOLERANCE  = 0.02;

    private static array $manifest = [];

    private FinancialReportingService $reporting;
    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->loadManifest();

        $this->tenant = Tenant::findOrFail(self::TENANT_ID);
        $this->bindTenantContext($this->tenant);
        $this->reporting = app(FinancialReportingService::class);
    }

    private function loadManifest(): void
    {
        if (!empty(self::$manifest)) return;
        $path = base_path('verification/golden_company/manifest.json');
        if (!file_exists($path)) $this->markTestSkipped('manifest.json not found.');
        self::$manifest = json_decode(file_get_contents($path), true);
    }


    // ─────────────────────────────────────────────────────────────────────────
    // [C-01] GL 5000 = Σ FIFO BATCH CONSUMPTION (annual)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The most fundamental COGS check:
     *   Σ sale_item_batches.total_cogs (for non-reversed batches in the year)
     *   must equal
     *   GL Account 5000 debit balance for the year.
     *
     * These are computed by completely different code paths. Agreement = proof.
     */
    public function test_C01_gl_5000_equals_fifo_batch_consumption_annually(): void
    {
        // Source 1: GL Account 5000 debits for the year
        $cogsAccount = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '5000')
            ->first();

        $this->assertNotNull($cogsAccount, '[C-01] GL account 5000 (COGS) not found for Golden Company');

        $gl5000 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('je.tenant_id', self::TENANT_ID)
            ->where('ji.account_id', $cogsAccount->id)
            ->where('je.is_reversed', false)
            ->whereBetween('je.date', [self::YEAR_START, self::YEAR_END])
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net');

        // Source 2: Σ sale_item_batches.total_cogs
        $fifoCogs = (float) DB::table('sale_item_batches as sib')
            ->join('sale_items as si', 'si.id', '=', 'sib.sale_item_id')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->where('sib.tenant_id', self::TENANT_ID)
            ->where('sib.is_reversed', false)
            ->whereBetween('s.posted_at', [self::YEAR_START . ' 00:00:00', self::YEAR_END . ' 23:59:59'])
            ->sum('sib.total_cogs');

        $this->assertEqualsWithDelta($gl5000, $fifoCogs, self::TOLERANCE,
            sprintf(
                '[C-01] GL 5000=%.2f vs FIFO batch COGS=%.2f (diff=%.2f). ' .
                'This means either COGS journaling was bypassed OR FIFO computed a different cost.',
                $gl5000, $fifoCogs, abs($gl5000 - $fifoCogs)
            )
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [C-02] getCogsReport() RECONCILED = TRUE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * getCogsReport() has a built-in `reconciled` field that compares
     * FIFO batch COGS vs GL 5000. It must be TRUE for the full year
     * and for each individual month.
     */
    public function test_C02_getCogsReport_reconciled_is_true_for_all_periods(): void
    {
        // Full year
        $annual = $this->reporting->getCogsReport(self::YEAR_START, self::YEAR_END);

        $this->assertTrue($annual['reconciled'],
            sprintf(
                '[C-02] Annual getCogsReport() NOT reconciled: FIFO total=%.2f, GL 5000=%.2f, diff=%.2f',
                $annual['total_cogs'],
                $annual['ledger_5000'],
                abs($annual['total_cogs'] - $annual['ledger_5000'])
            )
        );

        // Per-month
        $failures = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create(2025, $m, 1)->startOfMonth()->toDateString();
            $monthEnd   = Carbon::create(2025, $m, 1)->endOfMonth()->toDateString();
            $monthly    = $this->reporting->getCogsReport($monthStart, $monthEnd);

            if (!$monthly['reconciled']) {
                $failures[] = sprintf(
                    'Month %02d: FIFO=%.2f, GL5000=%.2f, diff=%.2f',
                    $m, $monthly['total_cogs'], $monthly['ledger_5000'],
                    abs($monthly['total_cogs'] - $monthly['ledger_5000'])
                );
            }
        }

        $this->assertEmpty($failures,
            "[C-02] COGS not reconciled in these months:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [C-03] ANNUAL COGS MATCHES MANIFEST
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Both GL 5000 balance AND getCogsReport() total must match manifest's declared COGS.
     */
    public function test_C03_annual_cogs_matches_manifest(): void
    {
        $expectedCogs = (float)(self::$manifest['year_end']['profit_and_loss']['cogs'] ?? 0);

        // Via getProfitAndLoss
        $pl = $this->reporting->getProfitAndLoss(self::YEAR_START, self::YEAR_END);
        $this->assertEqualsWithDelta($expectedCogs, $pl['cogs'], self::TOLERANCE,
            "[C-03] getProfitAndLoss() COGS vs manifest: expected Rs." . number_format($expectedCogs, 2)
        );

        // Via getCogsReport
        $cr = $this->reporting->getCogsReport(self::YEAR_START, self::YEAR_END);
        $this->assertEqualsWithDelta($expectedCogs, $cr['total_cogs'], self::TOLERANCE,
            "[C-03] getCogsReport() total_cogs vs manifest"
        );

        // GL 5000 directly
        $cogsAccount = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '5000')
            ->first();

        if ($cogsAccount) {
            $gl5000 = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->where('ji.tenant_id', self::TENANT_ID)
                ->where('ji.account_id', $cogsAccount->id)
                ->where('je.is_reversed', false)
                ->whereBetween('je.date', [self::YEAR_START, self::YEAR_END])
                ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
                ->value('net');

            $this->assertEqualsWithDelta($expectedCogs, $gl5000, self::TOLERANCE,
                "[C-03] GL 5000 direct balance vs manifest"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [C-04] PER-MONTH: GL 5000 = sale_item_batches PER MONTH
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * For each month: GL 5000 debit activity must equal Σ sale_item_batches.total_cogs
     * for sales posted in that month. This catches month-boundary bugs.
     */
    public function test_C04_monthly_gl_5000_matches_fifo_batch_cogs(): void
    {
        $cogsAccountId = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '5000')
            ->value('id');

        if (!$cogsAccountId) {
            $this->markTestSkipped('GL 5000 account not found');
        }

        $failures = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create(2025, $m, 1)->startOfMonth()->toDateString();
            $monthEnd   = Carbon::create(2025, $m, 1)->endOfMonth()->toDateString();

            $gl5000Month = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->where('ji.tenant_id', self::TENANT_ID)
                ->where('ji.account_id', $cogsAccountId)
                ->where('je.is_reversed', false)
                ->whereBetween('je.date', [$monthStart, $monthEnd])
                ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
                ->value('net');

            $fifoCogs = (float) DB::table('sale_item_batches as sib')
                ->join('sale_items as si', 'si.id', '=', 'sib.sale_item_id')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->where('sib.tenant_id', self::TENANT_ID)
                ->where('sib.is_reversed', false)
                ->whereBetween('s.posted_at', [$monthStart . ' 00:00:00', $monthEnd . ' 23:59:59'])
                ->sum('sib.total_cogs');

            if (abs($gl5000Month - $fifoCogs) > self::TOLERANCE) {
                $failures[] = sprintf(
                    'Month %04d-%02d: GL5000=%.2f, FIFO=%.2f, diff=%.2f',
                    2025, $m, $gl5000Month, $fifoCogs, abs($gl5000Month - $fifoCogs)
                );
            }
        }

        $this->assertEmpty($failures,
            "[C-04] Monthly COGS reconciliation failures:\n" . implode("\n", $failures)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [C-05] COGS BY PRODUCT SUMS TO TOTAL COGS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * getGrossProfitByProduct() COGS sum must equal getCogsReport() total_cogs.
     * Both come from sale_item_batches so they must agree exactly.
     */
    public function test_C05_cogs_by_product_sums_to_total_cogs(): void
    {
        $byProduct  = $this->reporting->getGrossProfitByProduct(self::YEAR_START, self::YEAR_END);
        $sumByCogs  = $byProduct->sum('cogs');

        $cogsReport = $this->reporting->getCogsReport(self::YEAR_START, self::YEAR_END);
        $totalCogs  = $cogsReport['total_cogs'];

        $this->assertEqualsWithDelta($totalCogs, $sumByCogs, self::TOLERANCE,
            sprintf(
                '[C-05] Σ product COGS (%.2f) ≠ getCogsReport total (%.2f). ' .
                'Indicates a product is missing from getGrossProfitByProduct query.',
                $sumByCogs, $totalCogs
            )
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [C-06] PROMOTIONAL SALE (100% DISCOUNT): COGS > 0
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * TXN-SAL-004 is the 100% discount (promotional) sale with COGS = Rs.800.
     * After this transaction, GL 5000 must have had exactly Rs.800 added
     * and the corresponding sale_item_batch record must show total_cogs = 800.
     *
     * Revenue = 0, COGS = 800 → this sale causes a deliberate loss.
     */
    public function test_C06_promotional_sale_cogs_posted_despite_zero_revenue(): void
    {
        $expectedCogs = 800.0; // TXN-SAL-004 per manifest

        // Find the promotional sale by its date and expected properties
        $promotionalSale = DB::table('sales as s')
            ->where('s.tenant_id', self::TENANT_ID)
            ->where('s.status', 'posted')
            ->whereDate('s.posted_at', '2025-03-10') // TXN-SAL-004 date
            ->first();

        if (!$promotionalSale) {
            $this->markTestSkipped('TXN-SAL-004 (promotional sale) not found — seeder may not have posted it on 2025-03-10');
        }

        // FIFO batch COGS for this sale
        $fifoCogs = (float) DB::table('sale_item_batches')
            ->join('sale_items', 'sale_items.id', '=', 'sale_item_batches.sale_item_id')
            ->where('sale_items.sale_id', $promotionalSale->id)
            ->where('sale_item_batches.is_reversed', false)
            ->sum('total_cogs');

        $this->assertEqualsWithDelta($expectedCogs, $fifoCogs, self::TOLERANCE,
            "[C-06] Promotional sale COGS via FIFO batches: expected Rs.{$expectedCogs}, got Rs.{$fifoCogs}"
        );

        // GL 5000 contribution from this exact sale (via journal reference)
        $cogsAccountId = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '5000')
            ->value('id');

        if ($cogsAccountId) {
            $gl5000ForSale = (float) DB::table('journal_items as ji')
                ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
                ->where('ji.tenant_id', self::TENANT_ID)
                ->where('ji.account_id', $cogsAccountId)
                ->where('je.is_reversed', false)
                ->where('je.reference', $promotionalSale->id)
                ->selectRaw('COALESCE(SUM(ji.debit), 0) as cogs')
                ->value('cogs');

            $this->assertEqualsWithDelta($expectedCogs, $gl5000ForSale, self::TOLERANCE,
                "[C-06] Promotional sale GL 5000 journal entry: expected Rs.{$expectedCogs}, got Rs.{$gl5000ForSale}"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [C-07] getGrossProfitByProduct() COGS = DIRECT sale_item_batches SUM
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * For each product returned by getGrossProfitByProduct(), its `cogs`
     * must equal the direct sum of sale_item_batches.total_cogs for that product.
     *
     * This proves the report query and the raw table agree — and that
     * the report cannot drift from the source data.
     */
    public function test_C07_gross_profit_product_cogs_matches_direct_sum(): void
    {
        $byProduct = $this->reporting->getGrossProfitByProduct(self::YEAR_START, self::YEAR_END);
        $failures  = [];

        foreach ($byProduct as $row) {
            $directCogs = (float) DB::table('sale_item_batches as sib')
                ->join('sale_items as si', 'si.id', '=', 'sib.sale_item_id')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->where('si.product_id', $row['product_id'])
                ->where('sib.tenant_id', self::TENANT_ID)
                ->where('sib.is_reversed', false)
                ->whereBetween('s.posted_at', [self::YEAR_START . ' 00:00:00', self::YEAR_END . ' 23:59:59'])
                ->sum('sib.total_cogs');

            if (abs($row['cogs'] - $directCogs) > self::TOLERANCE) {
                $failures[] = sprintf(
                    'Product "%s": report COGS=%.2f, direct sum=%.2f, diff=%.2f',
                    $row['name'],
                    $row['cogs'],
                    $directCogs,
                    abs($row['cogs'] - $directCogs)
                );
            }
        }

        $this->assertEmpty($failures,
            "[C-07] getGrossProfitByProduct() COGS vs direct sum:\n" . implode("\n", $failures)
        );
    }
}
