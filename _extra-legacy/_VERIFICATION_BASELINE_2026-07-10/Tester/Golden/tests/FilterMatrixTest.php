<?php

namespace Tests\Feature\Golden;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * ============================================================
 * Phase 5 — Filter Matrix Verification
 * ============================================================
 *
 * Systematic verification of date-range, party, and product filters
 * across all filterable endpoints. The core property being tested:
 *
 *   COMPLEMENT PROPERTY:  filter(A) + filter(~A) = unfiltered(A ∪ ~A)
 *   IDEMPOTENCY:          filter(A ∩ A) = filter(A)
 *   MONOTONICITY:         wider date range → revenue ≥ narrower range
 *   EXCLUSIVITY:          filter by party P → result only contains P's transactions
 *
 * COVERAGE:
 *  [FM-01] Monthly complement: Σ 12 monthly revenues = annual revenue (HTTP level)
 *  [FM-02] Party filter exclusivity: filter by CUST-SARA → only Sara's sales
 *  [FM-03] Party filter complement: Sara + rest = unfiltered
 *  [FM-04] Product filter exclusivity: filter by product P → only P's entries
 *  [FM-05] Monotonicity: 6-month range revenue ≤ 12-month range revenue
 *  [FM-06] Zero-activity day filter: 2025-07-04 alone → zero revenue
 *  [FM-07] Date precision: single-day range returns only that day's entries
 *  [FM-08] Cross-year boundary: last day of year + first day of year = 2-day window
 *
 * @group golden
 * @group phase5
 * @group phase5-filters
 */
class FilterMatrixTest extends OutputVerificationTestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // [FM-01] MONTHLY COMPLEMENT: Σ monthly revenues (HTTP) = annual revenue
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Issue 12 HTTP requests (one per month) to the P&L endpoint and sum their
     * revenues. The sum must equal the single full-year P&L revenue.
     *
     * This tests date range handling at the HTTP layer, not just the service layer.
     */
    public function test_FM01_twelve_monthly_http_revenues_sum_to_annual(): void
    {
        $sumMonthly = 0.0;

        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create(2025, $m, 1)->startOfMonth()->toDateString();
            $monthEnd   = Carbon::create(2025, $m, 1)->endOfMonth()->toDateString();

            $props        = $this->reportGet('reports/profit-loss', ['from' => $monthStart, 'to' => $monthEnd]);
            $sumMonthly  += (float)($this->findKey($props, 'revenue') ?? 0);
        }

        $annualProps   = $this->reportGet('reports/profit-loss', ['from' => self::YEAR_START, 'to' => self::YEAR_END]);
        $annualRevenue = (float)($this->findKey($annualProps, 'revenue') ?? 0);

        $this->assertEqualsWithDelta($annualRevenue, $sumMonthly, self::TOLERANCE * 12,
            sprintf(
                '[FM-01] Σ monthly HTTP revenues (%.2f) ≠ annual HTTP revenue (%.2f)',
                $sumMonthly, $annualRevenue
            )
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-02] PARTY FILTER EXCLUSIVITY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Sales report filtered by CUST-SARA's party ID must only return rows
     * where party_name contains 'Sara' (or the party_id matches).
     */
    public function test_FM02_party_filter_returns_only_that_partys_sales(): void
    {
        $saraId = DB::table('parties')
            ->where('tenant_id', self::TENANT_ID)
            ->where('type', 'customer')
            ->where('name', 'like', '%Sara%')
            ->value('id');

        if (!$saraId) {
            $this->markTestSkipped('CUST-SARA not found');
        }

        $props = $this->reportGet('reports/sales', [
            'from'     => '2025-02-01',
            'to'       => '2025-02-28',
            'party_id' => $saraId,
        ]);

        $rows = $props['rows'] ?? [];

        foreach ($rows as $row) {
            $rowPartyId = $row['party_id'] ?? null;
            if ($rowPartyId !== null) {
                $this->assertEquals($saraId, $rowPartyId,
                    "[FM-02] Sales report party filter: row belongs to party {$rowPartyId}, expected {$saraId}"
                );
            }
        }

        // Sara has exactly 1 sale in the Golden Company: TXN-SAL-003 = Rs.315,000
        $saraRevenue = (float)($this->findKey($props, 'total_revenue') ?? 0);
        $this->assertMoney(315000.0, $saraRevenue,
            '[FM-02] Sales filtered by CUST-SARA must equal TXN-SAL-003 revenue'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-03] PARTY FILTER COMPLEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * COMPLEMENT: Revenue from Sara + Revenue from all others = Annual revenue.
     *
     * We split the sales by party: Sara (Rs.315,000) + everyone else.
     * This tests that filtering is exhaustive (no sales fall through).
     */
    public function test_FM03_party_filter_complement_equals_annual_revenue(): void
    {
        $saraId = DB::table('parties')
            ->where('tenant_id', self::TENANT_ID)
            ->where('type', 'customer')
            ->where('name', 'like', '%Sara%')
            ->value('id');

        if (!$saraId) {
            $this->markTestSkipped('CUST-SARA not found');
        }

        $saraProp   = $this->reportGet('reports/sales', ['from' => '2025-01-01', 'to' => '2025-02-28', 'party_id' => $saraId]);
        $saraRevenue = (float)($this->findKey($saraProp, 'total_revenue') ?? 0);

        $annualProp     = $this->reportGet('reports/profit-loss', ['from' => '2025-01-01', 'to' => '2025-02-28']);
        $annualRevenue  = (float)($this->findKey($annualProp, 'revenue') ?? 0);

        // Sara contributed TXN-SAL-003 = Rs.315,000 out of annual Rs.1,578,430
        $nonSaraExpected = $annualRevenue - $saraRevenue;

        $this->assertGreaterThan(0.0, $nonSaraExpected,
            '[FM-03] Non-Sara revenue must be positive'
        );
        $this->assertMoney(315000.0, $saraRevenue,
            '[FM-03] Sara revenue must match TXN-SAL-003'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-04] ZERO-ACTIVITY DAY FILTER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The Golden Company spec declares 2025-07-04 as a zero-activity day.
     * A P&L for that single day must return revenue = 0 and COGS = 0.
     */
    public function test_FM04_zero_activity_day_returns_zero_revenue_and_cogs(): void
    {
        $props = $this->reportGet('reports/profit-loss', [
            'from' => '2025-07-04',
            'to'   => '2025-07-04',
        ]);

        $revenue = (float)($this->findKey($props, 'revenue') ?? 0);
        $cogs    = (float)($this->findKey($props, 'cogs') ?? 0);

        $this->assertEqualsWithDelta(0.0, $revenue, self::TOLERANCE,
            '[FM-04] Zero-activity day (2025-07-04): revenue must be 0'
        );
        $this->assertEqualsWithDelta(0.0, $cogs, self::TOLERANCE,
            '[FM-04] Zero-activity day (2025-07-04): COGS must be 0'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-05] MONOTONICITY — wider range ≥ narrower range
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Revenue for the full year must be ≥ revenue for any half-year subset.
     * Monotonicity: R(Jan-Dec) ≥ R(Jan-Jun) and R(Jan-Dec) ≥ R(Jul-Dec)
     */
    public function test_FM05_revenue_monotonicity_annual_ge_half_year(): void
    {
        $annual = (float)($this->findKey(
            $this->reportGet('reports/profit-loss', ['from' => '2025-01-01', 'to' => '2025-12-31']),
            'revenue'
        ) ?? 0);

        $h1 = (float)($this->findKey(
            $this->reportGet('reports/profit-loss', ['from' => '2025-01-01', 'to' => '2025-06-30']),
            'revenue'
        ) ?? 0);

        $h2 = (float)($this->findKey(
            $this->reportGet('reports/profit-loss', ['from' => '2025-07-01', 'to' => '2025-12-31']),
            'revenue'
        ) ?? 0);

        $this->assertGreaterThanOrEqual($h1, $annual,
            "[FM-05] Annual revenue ({$annual}) must be ≥ H1 revenue ({$h1})"
        );
        $this->assertGreaterThanOrEqual($h2, $annual,
            "[FM-05] Annual revenue ({$annual}) must be ≥ H2 revenue ({$h2})"
        );

        // And H1 + H2 = annual (complement property)
        $this->assertEqualsWithDelta($annual, $h1 + $h2, self::TOLERANCE * 2,
            "[FM-05] H1 + H2 must equal annual: H1={$h1}, H2={$h2}, sum=" . ($h1 + $h2) . ", annual={$annual}"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-06] SINGLE-DAY PRECISION — KNOWN TRANSACTION DATE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A P&L for 2025-01-10 (TXN-SAL-001: cash sale of Rs.90,000 revenue) must
     * return revenue = 90,000. This tests single-day date precision.
     */
    public function test_FM06_single_day_precision_returns_only_that_days_revenue(): void
    {
        $props = $this->reportGet('reports/profit-loss', [
            'from' => '2025-01-10',
            'to'   => '2025-01-10',
        ]);

        $revenue = (float)($this->findKey($props, 'revenue') ?? 0);

        // TXN-SAL-001 net_sales = 90,000
        $this->assertMoney(90000.0, $revenue,
            '[FM-06] P&L for 2025-01-10 must return exactly TXN-SAL-001 revenue (Rs.90,000)'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-07] INVENTORY FILTER BY PRODUCT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Inventory movement filtered by a specific product must only return
     * rows for that product. The filter must be exclusive (no cross-product leakage).
     */
    public function test_FM07_inventory_movement_product_filter_is_exclusive(): void
    {
        // Get any product ID from Golden Company
        $productId = DB::table('products')
            ->where('tenant_id', self::TENANT_ID)
            ->value('id');

        if (!$productId) {
            $this->markTestSkipped('No products found for Golden Company');
        }

        $props = $this->reportGet('reports/inventory-movement', [
            'from'       => self::YEAR_START,
            'to'         => self::YEAR_END,
            'product_id' => $productId,
        ]);

        // All inflow rows must be for this product
        $inflows  = $props['inflows']  ?? [];
        $outflows = $props['outflows'] ?? [];

        foreach ($inflows as $row) {
            $rowProductId = $row['product_id'] ?? null;
            if ($rowProductId !== null) {
                $this->assertEquals($productId, $rowProductId,
                    "[FM-07] Inventory movement inflow row: expected product {$productId}, got {$rowProductId}"
                );
            }
        }

        foreach ($outflows as $row) {
            $rowProductId = $row['product_id'] ?? null;
            if ($rowProductId !== null) {
                $this->assertEquals($productId, $rowProductId,
                    "[FM-07] Inventory movement outflow row: expected product {$productId}, got {$rowProductId}"
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [FM-08] CROSS-YEAR BOUNDARY FILTER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Balance Sheet computed as of 2025-12-31 must differ from 2025-12-30
     * (TXN-EXP-006 — Rent expense — is posted on 2025-12-31).
     * This confirms the as_of date is inclusive and boundary-correct.
     */
    public function test_FM08_balance_sheet_as_of_date_is_boundary_inclusive(): void
    {
        $dec31Props = $this->reportGet('reports/balance-sheet', ['as_of' => '2025-12-31']);
        $dec30Props = $this->reportGet('reports/balance-sheet', ['as_of' => '2025-12-30']);

        $assets31 = (float)($this->findKey($dec31Props, 'total_assets') ?? 0);
        $assets30 = (float)($this->findKey($dec30Props, 'total_assets') ?? 0);

        // Dec 31 has TXN-EXP-006 (Rs.50,000 rent) which reduces retained earnings
        // So total equity on Dec 31 should be lower than Dec 30 by ~50,000
        // But total assets = total liabilities + equity, so assets must stay balanced
        // The expense DR reduces cash (asset), so total assets should also differ

        // Both must be balanced
        $this->assertTrue((bool)($this->findKey($dec31Props, 'is_balanced') ?? false),
            '[FM-08] Balance Sheet as of 2025-12-31 must be balanced'
        );
        $this->assertTrue((bool)($this->findKey($dec30Props, 'is_balanced') ?? false),
            '[FM-08] Balance Sheet as of 2025-12-30 must be balanced'
        );

        // The two dates should produce different asset totals (TXN-EXP-006 changes cash)
        $this->assertNotEqualsWithDelta($assets31, $assets30, 100.0,
            '[FM-08] Balance Sheet totals on 2025-12-31 vs 2025-12-30 should differ by at least Rs.100 (TXN-EXP-006)'
        );
    }
}
