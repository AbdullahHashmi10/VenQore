<?php

namespace App\Services\Growth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * GrowthContext — everything a brain needs to know about the tenant it is
 * currently analysing, resolved once per run.
 *
 * V1 re-read `ai_settings` inside every method and hardcoded the rest
 * (Rs 5,000 minimum order value, 7-day lookahead, "Rs." as the currency, a
 * Pakistani phone prefix). Those constants are meaningless across a
 * multi-tenant SaaS: a wholesaler's Rs 5,000 and a kiosk's Rs 5,000 describe
 * completely different situations.
 *
 * This class replaces the constants with figures LEARNED from each tenant's
 * own data — median order value, median reorder gap, actual supplier lead
 * time — so every brain scales itself to the business it is looking at.
 */
class GrowthContext
{
    public int $customersAnalysed = 0;
    public int $productsAnalysed  = 0;
    public float $totalCustomerRevenue = 0.0;

    /** Lazily-resolved, memoised per run. */
    private ?float $medianOrderValue = null;
    private ?float $medianGap        = null;
    private ?int   $leadTime         = null;
    private ?int   $paymentTerms     = null;

    public function __construct(
        public readonly int|string $tenantId,
        public readonly GrowthDataSource $data,
        public readonly ThresholdTuner $tuner,
        /** 'light' = fast hourly pass, 'deep' = full nightly pass. */
        public readonly string $mode = 'deep',
        public readonly string $currency = 'Rs',
        public readonly array $settings = [],
    ) {
    }

    public function isDeep(): bool
    {
        return $this->mode !== 'light';
    }

    /**
     * The tuned sensitivity multiplier for an insight type.
     * Brains multiply their thresholds by this, so the engine's own track
     * record with this tenant decides how eager each rule is.
     */
    public function sensitivity(string $insightType): float
    {
        return $this->tuner->sensitivity($this->tenantId, $insightType);
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $default;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LEARNED SCALE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Materiality floor — below this, a rupee figure is not worth an alert.
     *
     * Derived from the tenant's own median order value rather than the
     * hardcoded Rs 5,000 in V1. For a kiosk this lands near Rs 300; for a
     * distributor it lands in the tens of thousands. Same rule, right scale.
     */
    public function materialityFloor(): float
    {
        $median = $this->medianOrderValue();
        return max(200.0, round($median * 0.5, -1));
    }

    /**
     * Minimum stock value before "dead stock" is worth the owner's attention.
     * Set higher than the general floor because acting on dead stock costs
     * real effort (discounting, returning, re-merchandising).
     */
    public function deadStockFloor(): float
    {
        return max(500.0, $this->materialityFloor() * 2);
    }

    public function medianOrderValue(): float
    {
        if ($this->medianOrderValue !== null) {
            return $this->medianOrderValue;
        }

        $value = Cache::remember(
            "growth:mov:{$this->tenantId}",
            now()->addHours(12),
            function () {
                $row = DB::selectOne("
                    SELECT AVG(invoice_total) AS v FROM (
                        SELECT invoice_total,
                               ROW_NUMBER() OVER (ORDER BY invoice_total) AS rn,
                               COUNT(*) OVER () AS c
                        FROM sales
                        WHERE tenant_id = ?
                          AND deleted_at IS NULL
                          AND status IN ('posted','partially_returned')
                          AND posted_at >= DATE_SUB(NOW(), INTERVAL 180 DAY)
                    ) t
                    WHERE rn IN (FLOOR((c+1)/2), FLOOR((c+2)/2))
                ", [$this->tenantId]);

                return (float) ($row->v ?? 0);
            }
        );

        return $this->medianOrderValue = ($value > 0 ? $value : 1000.0);
    }

    /**
     * The typical gap between one customer's orders, across the whole tenant.
     * Used to judge whether a brand-new customer is "overdue" before they have
     * any personal rhythm of their own to measure against.
     */
    public function tenantMedianGap(): float
    {
        if ($this->medianGap !== null) {
            return $this->medianGap;
        }

        $value = Cache::remember(
            "growth:gap:{$this->tenantId}",
            now()->addHours(12),
            function () {
                $row = DB::selectOne("
                    SELECT AVG(gap) AS v FROM (
                        SELECT gap,
                               ROW_NUMBER() OVER (ORDER BY gap) AS rn,
                               COUNT(*) OVER () AS c
                        FROM (
                            SELECT DATEDIFF(
                                     posted_at,
                                     LAG(posted_at) OVER (PARTITION BY party_id ORDER BY posted_at)
                                   ) AS gap
                            FROM sales
                            WHERE tenant_id = ?
                              AND deleted_at IS NULL
                              AND status IN ('posted','partially_returned')
                              AND posted_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
                        ) g
                        WHERE gap IS NOT NULL AND gap > 0
                    ) t
                    WHERE rn IN (FLOOR((c+1)/2), FLOOR((c+2)/2))
                ", [$this->tenantId]);

                return (float) ($row->v ?? 0);
            }
        );

        return $this->medianGap = ($value > 0 ? $value : 30.0);
    }

    /**
     * How long this tenant's suppliers actually take, learned from the gap
     * between consecutive purchases of the same product.
     *
     * V1 used a flat 7-day lookahead for everybody. A shop whose supplier
     * takes 21 days needs three weeks of warning, not one — otherwise the
     * alert arrives too late to be worth anything, which is exactly the kind
     * of thing that makes owners stop trusting a feature.
     */
    public function leadTimeDays(): int
    {
        if ($this->leadTime !== null) {
            return $this->leadTime;
        }

        $value = Cache::remember(
            "growth:leadtime:{$this->tenantId}",
            now()->addHours(24),
            function () {
                $row = DB::selectOne("
                    SELECT AVG(gap) AS v FROM (
                        SELECT DATEDIFF(
                                 pu.purchase_date,
                                 LAG(pu.purchase_date) OVER (PARTITION BY pi.product_id ORDER BY pu.purchase_date)
                               ) AS gap
                        FROM purchase_items pi
                        INNER JOIN purchases pu ON pu.id = pi.purchase_id AND pu.tenant_id = ?
                        WHERE pi.tenant_id = ?
                          AND pu.purchase_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                    ) g
                    WHERE gap IS NOT NULL AND gap BETWEEN 1 AND 120
                ", [$this->tenantId, $this->tenantId]);

                return (int) round((float) ($row->v ?? 0));
            }
        );

        // Reorder cycle is not the same as lead time, but it is a sound proxy
        // and it is bounded to a sensible range either way.
        return $this->leadTime = max(3, min(30, $value ?: 7));
    }

    /**
     * The tenant's real payment terms, taken from what they actually put on
     * invoices rather than from a hardcoded 30 days.
     */
    public function paymentTermDays(): int
    {
        if ($this->paymentTerms !== null) {
            return $this->paymentTerms;
        }

        $value = Cache::remember(
            "growth:terms:{$this->tenantId}",
            now()->addHours(24),
            fn () => (int) round((float) DB::table('sales')
                ->where('tenant_id', $this->tenantId)
                ->whereNull('deleted_at')
                ->whereNotNull('due_date')
                ->whereNotNull('posted_at')
                ->where('posted_at', '>=', now()->subDays(180))
                ->selectRaw('AVG(DATEDIFF(due_date, DATE(posted_at))) AS v')
                ->value('v'))
        );

        return $this->paymentTerms = max(0, min(90, $value ?: 15));
    }

    /**
     * Clear the learned-scale caches. Called when a tenant's settings change
     * so the next run picks up fresh figures rather than 12-hour-old ones.
     */
    public static function forgetCaches(int|string $tenantId): void
    {
        foreach (['mov', 'gap', 'leadtime', 'terms'] as $k) {
            Cache::forget("growth:{$k}:{$tenantId}");
        }
    }
}
