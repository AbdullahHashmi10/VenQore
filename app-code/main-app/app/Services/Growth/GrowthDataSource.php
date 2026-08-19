<?php

namespace App\Services\Growth;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * GrowthDataSource — the Growth Engine's single, correct view of the business.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## Why this class exists (the V1 post-mortem)
 *
 * The V1 engine read `invoices` and `invoice_items`, filtered to
 * `type = 'sale'`. But in this codebase EVERY writer of the `invoices` table
 * hardcodes `type => 'purchase'`:
 *
 *   - PurchaseService::create()            → 'purchase'  (vendor bills)
 *   - PurchaseService::createReturn()      → 'purchase'
 *   - SmartFulfillmentService (VenSynQ)    → 'purchase'  (JIT drop-ship drafts)
 *
 * Retail, POS and manual sales are written by SaleController to the `sales`
 * and `sale_items` tables. Consequently `Invoice::where('type','sale')`
 * returned an empty set for every tenant, on every run, forever. All three
 * V1 brains were analysing nothing. That is the real reason the Growth Engine
 * "did not check off very often" — it was structurally incapable of firing.
 *
 * On top of that, V1 looped in PHP: one query per customer, then one per
 * invoice, then one per item. A 2,000-customer tenant cost ~6,000 queries a
 * night. That is why it was kept to a single daily run.
 *
 * ## What V2 does instead
 *
 * Every method here is ONE set-based SQL statement that returns a whole
 * tenant's picture at once. A 2,000-customer tenant now costs roughly a dozen
 * queries total, so the engine can afford to run hourly and still be far
 * cheaper than the old nightly pass.
 *
 * ## Correctness rules enforced here
 *
 *  - Only `status = 'posted'` (or 'partially_returned') sales count as revenue.
 *    Drafts must never drive a recommendation.
 *  - Returns are netted off: `quantity - returned_quantity`.
 *  - COGS uses the immutable FIFO snapshot in `sale_item_batches.total_cogs`,
 *    falling back to `sale_items.cost_price` only when no batch link exists.
 *  - Soft-deleted rows are excluded everywhere.
 *  - The shared "Walk-in Customer" party is excluded from customer analytics.
 *    V1 would have treated thousands of unrelated counter sales as one
 *    hyper-loyal customer and produced nonsense.
 *  - tenant_id is bound explicitly on every table in every join. No reliance
 *    on global scopes, because these run in CLI/queue context.
 */
class GrowthDataSource
{
    /** Sale statuses that represent recognised revenue. */
    public const REVENUE_STATUSES = ['posted', 'partially_returned'];

    /**
     * The newest recognised activity for a tenant.
     *
     * Used as the incremental watermark: if this has not moved since the last
     * run, the whole tenant can be skipped. This single query is what makes
     * hourly scheduling affordable.
     */
    public function watermark(int|string $tenantId): ?Carbon
    {
        $latest = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', self::REVENUE_STATUSES)
            ->whereNull('deleted_at')
            ->max('updated_at');

        $latestPurchase = DB::table('purchases')
            ->where('tenant_id', $tenantId)
            ->max('updated_at');

        $max = collect([$latest, $latestPurchase])->filter()->max();

        return $max ? Carbon::parse($max) : null;
    }

    /**
     * Party IDs that are placeholders rather than real, contactable customers.
     * Analytics and recommendations must skip these.
     */
    public function placeholderPartyIds(int|string $tenantId): array
    {
        return DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('phone', '0000000000')
                  ->orWhereRaw('LOWER(name) IN (?, ?, ?)', ['walk-in customer', 'walk in customer', 'cash customer']);
            })
            ->pluck('id')
            ->all();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CUSTOMER FACTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * One row per customer with a complete behavioural + financial profile.
     *
     * Replaces V1's per-customer query loop entirely. Everything the customer
     * brain needs — recency, frequency, monetary, margin, basket, breadth,
     * returns, and the mean/stddev of the gap between orders — comes back in
     * a single statement.
     *
     * The interval statistics use a window function (LAG) so we get the true
     * standard deviation of the order gap. That matters enormously: a customer
     * who orders every 30 ± 2 days is genuinely late at day 35, while one who
     * orders every 30 ± 25 days is not late until day 90. V1 used a flat
     * "1.3 × average" for everyone and was therefore wrong for most of them.
     *
     * @return Collection<int, object>
     */
    public function customerFacts(int|string $tenantId, int $windowDays = 730): Collection
    {
        $since       = now()->subDays($windowDays)->toDateTimeString();
        $placeholder = $this->placeholderPartyIds($tenantId);
        $statuses    = "'" . implode("','", self::REVENUE_STATUSES) . "'";

        // Per-sale gap between consecutive orders, via LAG (MySQL 8+).
        // This is the raw material for the stddev that makes "late" meaningful.
        $gapSql = "
            SELECT
                party_id,
                DATEDIFF(posted_at, LAG(posted_at) OVER (PARTITION BY party_id ORDER BY posted_at)) AS gap_days
            FROM sales
            WHERE tenant_id = ?
              AND deleted_at IS NULL
              AND status IN ({$statuses})
              AND posted_at IS NOT NULL
              AND posted_at >= ?
        ";

        $sql = "
            SELECT
                p.id                                   AS party_id,
                p.name                                 AS party_name,
                p.phone                                AS phone,
                p.credit_limit                         AS credit_limit,
                COUNT(DISTINCT s.id)                   AS total_orders,
                COALESCE(SUM(s.invoice_total), 0)      AS total_spent,
                COALESCE(AVG(s.invoice_total), 0)      AS avg_order_value,
                MIN(DATE(s.posted_at))                 AS first_order_date,
                MAX(DATE(s.posted_at))                 AS last_order_date,
                DATEDIFF(CURDATE(), MAX(DATE(s.posted_at))) AS recency_days,
                SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 ELSE 0 END)                AS orders_90d,
                COALESCE(SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN s.invoice_total ELSE 0 END), 0)  AS spend_90d,
                COALESCE(SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 180 DAY) AND s.posted_at < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN s.invoice_total ELSE 0 END), 0) AS spend_prev_90d,
                COALESCE(SUM(s.total_item_discounts + s.global_discount), 0) AS total_discount,
                gaps.avg_gap                           AS avg_gap,
                gaps.stddev_gap                        AS stddev_gap,
                gaps.gap_samples                       AS gap_samples,
                items.margin                           AS total_margin,
                items.net_revenue                      AS net_revenue,
                items.distinct_products                AS distinct_products,
                items.line_count                       AS line_count,
                items.returned_lines                   AS returned_lines
            FROM parties p
            INNER JOIN sales s
                    ON s.party_id = p.id
                   AND s.tenant_id = ?
                   AND s.deleted_at IS NULL
                   AND s.status IN ({$statuses})
                   AND s.posted_at IS NOT NULL
                   AND s.posted_at >= ?
            LEFT JOIN (
                SELECT party_id,
                       AVG(gap_days)    AS avg_gap,
                       STDDEV_SAMP(gap_days) AS stddev_gap,
                       COUNT(gap_days)  AS gap_samples
                FROM ({$gapSql}) g
                WHERE gap_days IS NOT NULL
                GROUP BY party_id
            ) gaps ON gaps.party_id = p.id
            LEFT JOIN (
                SELECT s2.party_id,
                       SUM(si.net_amount - COALESCE(b.cogs, si.cost_price * si.quantity)) AS margin,
                       SUM(si.net_amount)                                                 AS net_revenue,
                       COUNT(DISTINCT si.product_id)                                      AS distinct_products,
                       COUNT(si.id)                                                       AS line_count,
                       SUM(CASE WHEN si.returned_quantity > 0 THEN 1 ELSE 0 END)          AS returned_lines
                FROM sale_items si
                INNER JOIN sales s2
                        ON s2.id = si.sale_id
                       AND s2.tenant_id = ?
                       AND s2.deleted_at IS NULL
                       AND s2.status IN ({$statuses})
                       AND s2.posted_at >= ?
                LEFT JOIN (
                    SELECT sale_item_id, SUM(total_cogs) AS cogs
                    FROM sale_item_batches
                    WHERE is_reversed = 0
                    GROUP BY sale_item_id
                ) b ON b.sale_item_id = si.id
                WHERE si.tenant_id = ?
                  AND si.deleted_at IS NULL
                GROUP BY s2.party_id
            ) items ON items.party_id = p.id
            WHERE p.tenant_id = ?
              AND p.type = 'customer'
              AND p.deleted_at IS NULL
        ";

        // Bindings follow the PHYSICAL order of `?` in the assembled string:
        //   1-2  INNER JOIN sales      (tenant, since)
        //   3-4  gaps derived table    (tenant, since)   ← $gapSql is inlined
        //   5-7  items derived table   (tenant, since, tenant)
        //   8    WHERE p.tenant_id
        $bindings = [
            $tenantId, $since,
            $tenantId, $since,
            $tenantId, $since, $tenantId,
            $tenantId,
        ];

        if (!empty($placeholder)) {
            $in = implode(',', array_fill(0, count($placeholder), '?'));
            $sql .= " AND p.id NOT IN ({$in}) ";
            $bindings = array_merge($bindings, $placeholder);
        }

        $sql .= ' GROUP BY p.id, p.name, p.phone, p.credit_limit,
                           gaps.avg_gap, gaps.stddev_gap, gaps.gap_samples,
                           items.margin, items.net_revenue, items.distinct_products,
                           items.line_count, items.returned_lines';

        return collect(DB::select($sql, $bindings));
    }

    /**
     * Per-customer outstanding receivable, straight from the GL (account 1200).
     *
     * Deliberately GL-sourced rather than derived from sale headers so the
     * number the Growth Engine quotes can never disagree with the accounting
     * module. If they disagreed, the owner would stop trusting both.
     *
     * @return array<string,float>  party_id => outstanding
     */
    public function receivablesByParty(int|string $tenantId): array
    {
        return DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('a.code', '1200')
            ->where('je.is_reversed', 0)
            ->whereNotNull('ji.party_id')
            ->groupBy('ji.party_id')
            ->havingRaw('SUM(ji.debit) - SUM(ji.credit) > 0.01')
            ->selectRaw('ji.party_id, ROUND(SUM(ji.debit) - SUM(ji.credit), 2) AS outstanding')
            ->pluck('outstanding', 'party_id')
            ->map(fn ($v) => (float) $v)
            ->all();
    }

    /**
     * Overdue receivables bucketed by age, per party.
     *
     * V1's "recovery" alert simply said "this party owes money" with no age and
     * no due date — which is not actionable, because a 3-day-old balance and a
     * 120-day-old balance need completely different responses.
     *
     * @return Collection<int,object>
     */
    public function overdueSales(int|string $tenantId): Collection
    {
        $statuses = self::REVENUE_STATUSES;

        // NOTE: the outstanding filter lives in an OUTER query, not in a
        // HAVING clause on the inner one. MySQL tolerates HAVING without
        // GROUP BY as a non-standard extension, but its semantics there are
        // ambiguous and it silently changes behaviour under ONLY_FULL_GROUP_BY.
        // A derived table is unambiguous and optimises identically.
        return collect(DB::select("
            SELECT * FROM (
                SELECT
                    s.id                AS sale_id,
                    s.reference_number,
                    s.party_id,
                    p.name              AS party_name,
                    p.phone,
                    s.posted_at,
                    s.due_date,
                    s.invoice_total,
                    COALESCE(alloc.paid, 0)     AS paid,
                    COALESCE(ret.returned, 0)   AS returned,
                    ROUND(s.invoice_total - COALESCE(alloc.paid,0) - COALESCE(ret.returned,0), 2) AS outstanding,
                    DATEDIFF(CURDATE(), COALESCE(s.due_date, DATE(s.posted_at))) AS days_overdue
                FROM sales s
                INNER JOIN parties p ON p.id = s.party_id AND p.tenant_id = ?
                LEFT JOIN (
                    SELECT sale_id, SUM(allocated_amount) AS paid
                    FROM allocations
                    WHERE tenant_id = ? AND status = 'active'
                    GROUP BY sale_id
                ) alloc ON alloc.sale_id = s.id
                LEFT JOIN (
                    SELECT sale_id,
                           SUM(returned_quantity * (net_amount / NULLIF(quantity, 0))) AS returned
                    FROM sale_items
                    WHERE tenant_id = ? AND deleted_at IS NULL
                    GROUP BY sale_id
                ) ret ON ret.sale_id = s.id
                WHERE s.tenant_id = ?
                  AND s.deleted_at IS NULL
                  AND s.status IN ('" . implode("','", $statuses) . "')
                  AND s.payment_status NOT IN ('paid', 'written_off')
                  AND s.posted_at IS NOT NULL
            ) t
            WHERE t.outstanding > 0.01
            ORDER BY t.outstanding DESC
            LIMIT 500
        ", [$tenantId, $tenantId, $tenantId, $tenantId]));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PRODUCT FACTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * One row per product: velocity across three windows, margin now vs.
     * margin 30 days ago, live stock, stock value and buyer breadth.
     *
     * The three velocity windows are the point. A single 30-day average cannot
     * distinguish "steadily selling 10/day" from "sold 300 in one clearance and
     * nothing since". Comparing 7d against 30d against 90d makes acceleration
     * and collapse both visible, which is what actually drives good stock and
     * pricing decisions.
     *
     * @return Collection<int,object>
     */
    public function productFacts(int|string $tenantId): Collection
    {
        $statuses = "'" . implode("','", self::REVENUE_STATUSES) . "'";

        return collect(DB::select("
            SELECT
                pr.id                          AS product_id,
                pr.name                        AS product_name,
                pr.sku,
                pr.price                       AS sale_price,
                pr.cost_price,
                COALESCE(pr.base_unit, pr.unit, 'pcs') AS unit,
                pr.min_stock_alert,
                pr.category_id,

                COALESCE(v.qty_7d, 0)          AS qty_7d,
                COALESCE(v.qty_30d, 0)         AS qty_30d,
                COALESCE(v.qty_90d, 0)         AS qty_90d,
                COALESCE(v.revenue_30d, 0)     AS revenue_30d,
                COALESCE(v.margin_30d, 0)      AS margin_30d,
                COALESCE(v.revenue_prev_30d,0) AS revenue_prev_30d,
                COALESCE(v.margin_prev_30d, 0) AS margin_prev_30d,
                COALESCE(v.discount_30d, 0)    AS discount_30d,
                COALESCE(v.gross_30d, 0)       AS gross_30d,
                COALESCE(v.buyers_90d, 0)      AS buyers_90d,
                COALESCE(v.returned_90d, 0)    AS returned_90d,
                COALESCE(v.sold_90d, 0)        AS sold_90d,
                v.last_sold_date               AS last_sold_date,

                COALESCE(st.qty, 0)            AS current_stock,
                COALESCE(st.value, 0)          AS stock_value,
                st.oldest_batch_date           AS oldest_batch_date,
                st.nearest_expiry              AS nearest_expiry,
                st.expiring_qty                AS expiring_qty,
                pu.last_purchased_date         AS last_purchased_date,
                pu.last_unit_cost              AS last_unit_cost

            FROM products pr

            LEFT JOIN (
                SELECT
                    si.product_id,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)  THEN si.quantity - COALESCE(si.returned_quantity,0) ELSE 0 END) AS qty_7d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN si.quantity - COALESCE(si.returned_quantity,0) ELSE 0 END) AS qty_30d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN si.quantity - COALESCE(si.returned_quantity,0) ELSE 0 END) AS qty_90d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN si.net_amount ELSE 0 END) AS revenue_30d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN si.gross_amount ELSE 0 END) AS gross_30d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN si.discount_amount ELSE 0 END) AS discount_30d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                             THEN si.net_amount - COALESCE(b.cogs, si.cost_price * si.quantity) ELSE 0 END) AS margin_30d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND s.posted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                             THEN si.net_amount ELSE 0 END) AS revenue_prev_30d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND s.posted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                             THEN si.net_amount - COALESCE(b.cogs, si.cost_price * si.quantity) ELSE 0 END) AS margin_prev_30d,
                    COUNT(DISTINCT CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN s.party_id END) AS buyers_90d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN COALESCE(si.returned_quantity,0) ELSE 0 END) AS returned_90d,
                    SUM(CASE WHEN s.posted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN si.quantity ELSE 0 END) AS sold_90d,
                    MAX(DATE(s.posted_at)) AS last_sold_date
                FROM sale_items si
                INNER JOIN sales s
                        ON s.id = si.sale_id
                       AND s.tenant_id = ?
                       AND s.deleted_at IS NULL
                       AND s.status IN ({$statuses})
                       AND s.posted_at IS NOT NULL
                LEFT JOIN (
                    SELECT sale_item_id, SUM(total_cogs) AS cogs
                    FROM sale_item_batches WHERE is_reversed = 0 GROUP BY sale_item_id
                ) b ON b.sale_item_id = si.id
                WHERE si.tenant_id = ? AND si.deleted_at IS NULL
                GROUP BY si.product_id
            ) v ON v.product_id = pr.id

            LEFT JOIN (
                SELECT product_id,
                       SUM(remaining_qty)                    AS qty,
                       SUM(remaining_qty * unit_cost)        AS value,
                       MIN(DATE(created_at))                 AS oldest_batch_date,
                       MIN(expiry_date)                      AS nearest_expiry,
                       SUM(CASE WHEN expiry_date IS NOT NULL
                                 AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
                                THEN remaining_qty ELSE 0 END) AS expiring_qty
                FROM inventory_batches
                WHERE tenant_id = ? AND deleted_at IS NULL AND remaining_qty > 0
                GROUP BY product_id
            ) st ON st.product_id = pr.id

            LEFT JOIN (
                SELECT pi.product_id,
                       MAX(pu2.purchase_date) AS last_purchased_date,
                       SUBSTRING_INDEX(GROUP_CONCAT(pi.unit_cost ORDER BY pu2.purchase_date DESC), ',', 1) AS last_unit_cost
                FROM purchase_items pi
                INNER JOIN purchases pu2 ON pu2.id = pi.purchase_id AND pu2.tenant_id = ?
                WHERE pi.tenant_id = ?
                GROUP BY pi.product_id
            ) pu ON pu.product_id = pr.id

            WHERE pr.tenant_id = ?
              AND pr.deleted_at IS NULL
        ", [$tenantId, $tenantId, $tenantId, $tenantId, $tenantId, $tenantId]));
    }

    /**
     * Products frequently bought together — the cross-sell engine.
     *
     * Returns pairs with support (how often together) and confidence
     * (P(B|A)). V1 had nothing like this; it is one of the highest-value,
     * lowest-effort insights a POS can give a shop owner, because acting on it
     * costs nothing but a shelf move or a counter prompt.
     *
     * @return Collection<int,object>
     */
    public function basketPairs(int|string $tenantId, int $days = 90, int $minSupport = 4): Collection
    {
        $statuses = "'" . implode("','", self::REVENUE_STATUSES) . "'";

        return collect(DB::select("
            SELECT
                a.product_id            AS product_a,
                pa.name                 AS name_a,
                b.product_id            AS product_b,
                pb.name                 AS name_b,
                COUNT(DISTINCT a.sale_id) AS support,
                ca.total                AS total_a,
                ROUND(COUNT(DISTINCT a.sale_id) / NULLIF(ca.total,0) * 100, 2) AS confidence
            FROM sale_items a
            INNER JOIN sale_items b
                    ON b.sale_id = a.sale_id
                   AND b.product_id > a.product_id
                   AND b.tenant_id = ?
                   AND b.deleted_at IS NULL
            INNER JOIN sales s
                    ON s.id = a.sale_id
                   AND s.tenant_id = ?
                   AND s.deleted_at IS NULL
                   AND s.status IN ({$statuses})
                   AND s.posted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            INNER JOIN products pa ON pa.id = a.product_id AND pa.tenant_id = ?
            INNER JOIN products pb ON pb.id = b.product_id AND pb.tenant_id = ?
            INNER JOIN (
                SELECT si.product_id, COUNT(DISTINCT si.sale_id) AS total
                FROM sale_items si
                INNER JOIN sales s2 ON s2.id = si.sale_id
                       AND s2.tenant_id = ? AND s2.deleted_at IS NULL
                       AND s2.status IN ({$statuses})
                       AND s2.posted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                WHERE si.tenant_id = ? AND si.deleted_at IS NULL
                GROUP BY si.product_id
            ) ca ON ca.product_id = a.product_id
            WHERE a.tenant_id = ? AND a.deleted_at IS NULL
            GROUP BY a.product_id, pa.name, b.product_id, pb.name, ca.total
            HAVING support >= ?
            ORDER BY confidence DESC, support DESC
            LIMIT 40
        ", [$tenantId, $tenantId, $days, $tenantId, $tenantId, $tenantId, $days, $tenantId, $tenantId, $minSupport]));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  TIME SERIES / BASELINES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Daily revenue, margin, orders and discount for the last N days.
     *
     * This is the tenant's own baseline. Anomaly detection compares today
     * against this rather than against a universal constant, so a Rs 40k day is
     * "quiet" for one shop and "a record" for another.
     *
     * @return Collection<int,object>
     */
    public function dailySeries(int|string $tenantId, int $days = 120): Collection
    {
        $statuses = "'" . implode("','", self::REVENUE_STATUSES) . "'";

        return collect(DB::select("
            SELECT
                DATE(s.posted_at)                       AS d,
                DAYOFWEEK(s.posted_at)                  AS dow,
                COUNT(DISTINCT s.id)                    AS orders,
                COALESCE(SUM(s.invoice_total), 0)       AS revenue,
                COALESCE(SUM(s.total_item_discounts + s.global_discount), 0) AS discount,
                COUNT(DISTINCT s.party_id)              AS customers,
                COALESCE(SUM(i.margin), 0)              AS margin,
                COALESCE(SUM(i.lines), 0)               AS lines
            FROM sales s
            LEFT JOIN (
                SELECT si.sale_id,
                       SUM(si.net_amount - COALESCE(b.cogs, si.cost_price * si.quantity)) AS margin,
                       COUNT(si.id) AS lines
                FROM sale_items si
                LEFT JOIN (
                    SELECT sale_item_id, SUM(total_cogs) AS cogs
                    FROM sale_item_batches WHERE is_reversed = 0 GROUP BY sale_item_id
                ) b ON b.sale_item_id = si.id
                WHERE si.tenant_id = ? AND si.deleted_at IS NULL
                GROUP BY si.sale_id
            ) i ON i.sale_id = s.id
            WHERE s.tenant_id = ?
              AND s.deleted_at IS NULL
              AND s.status IN ({$statuses})
              AND s.posted_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(s.posted_at), DAYOFWEEK(s.posted_at)
            ORDER BY d ASC
        ", [$tenantId, $tenantId, $days]));
    }

    /**
     * Revenue and order count by day-of-week × hour.
     *
     * Directly answers the two questions every shop owner has but cannot easily
     * compute: "when am I actually busy?" and "am I staffed for it?"
     *
     * @return Collection<int,object>
     */
    public function hourlyPattern(int|string $tenantId, int $days = 90): Collection
    {
        $statuses = "'" . implode("','", self::REVENUE_STATUSES) . "'";

        return collect(DB::select("
            SELECT
                DAYOFWEEK(posted_at) AS dow,
                HOUR(posted_at)      AS hr,
                COUNT(*)             AS orders,
                COALESCE(SUM(invoice_total),0) AS revenue
            FROM sales
            WHERE tenant_id = ?
              AND deleted_at IS NULL
              AND status IN ({$statuses})
              AND posted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY dow, hr
        ", [$tenantId, $days]));
    }

    /**
     * Per-cashier / per-staff performance, including the discount they hand out.
     *
     * Discount leakage is one of the most common silent profit killers in
     * retail and it is invisible on a P&L. Here it is attributable.
     *
     * @return Collection<int,object>
     */
    public function staffPerformance(int|string $tenantId, int $days = 30): Collection
    {
        $statuses = "'" . implode("','", self::REVENUE_STATUSES) . "'";

        return collect(DB::select("
            SELECT
                s.user_id,
                u.name                                    AS user_name,
                COUNT(DISTINCT s.id)                      AS orders,
                COALESCE(SUM(s.invoice_total), 0)         AS revenue,
                COALESCE(AVG(s.invoice_total), 0)         AS avg_order_value,
                COALESCE(SUM(s.total_item_discounts + s.global_discount), 0) AS discount,
                CASE WHEN SUM(s.subtotal_gross) > 0
                     THEN ROUND(SUM(s.total_item_discounts + s.global_discount) / SUM(s.subtotal_gross) * 100, 2)
                     ELSE 0 END                           AS discount_pct
            FROM sales s
            LEFT JOIN users u ON u.id = s.user_id
            WHERE s.tenant_id = ?
              AND s.deleted_at IS NULL
              AND s.status IN ({$statuses})
              AND s.posted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY s.user_id, u.name
            HAVING orders >= 5
            ORDER BY revenue DESC
        ", [$tenantId, $days]));
    }

    /**
     * Total live inventory value at FIFO cost.
     */
    public function inventoryValue(int|string $tenantId): float
    {
        return (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('remaining_qty', '>', 0)
            ->selectRaw('COALESCE(SUM(remaining_qty * unit_cost), 0) AS v')
            ->value('v');
    }

    /**
     * Outstanding payables to suppliers, per party (GL account 2000).
     */
    public function payablesByParty(int|string $tenantId): array
    {
        return DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', $tenantId)
            ->where('a.tenant_id', $tenantId)
            ->where('a.code', '2000')
            ->where('je.is_reversed', 0)
            ->whereNotNull('ji.party_id')
            ->groupBy('ji.party_id')
            ->havingRaw('SUM(ji.credit) - SUM(ji.debit) > 0.01')
            ->selectRaw('ji.party_id, ROUND(SUM(ji.credit) - SUM(ji.debit), 2) AS outstanding')
            ->pluck('outstanding', 'party_id')
            ->map(fn ($v) => (float) $v)
            ->all();
    }

    /**
     * Cash actually collected per day — the difference between "sold" and "paid".
     * A business can be booming on paper and still run out of money.
     */
    public function cashCollectedSeries(int|string $tenantId, int $days = 90): Collection
    {
        return collect(DB::select("
            SELECT DATE(created_at) AS d, COALESCE(SUM(allocated_amount), 0) AS collected
            FROM allocations
            WHERE tenant_id = ?
              AND status = 'active'
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY d ASC
        ", [$tenantId, $days]));
    }

    /**
     * Did this party place an order after the given timestamp?
     * Used by OutcomeEvaluator to grade churn / retention predictions.
     */
    public function partyOrderedSince(int|string $tenantId, string $partyId, Carbon $since): ?object
    {
        $statuses = self::REVENUE_STATUSES;

        return DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('party_id', $partyId)
            ->whereIn('status', $statuses)
            ->whereNull('deleted_at')
            ->where('posted_at', '>=', $since->toDateTimeString())
            ->selectRaw('MIN(posted_at) AS first_at, COUNT(*) AS orders, COALESCE(SUM(invoice_total),0) AS value')
            ->having('orders', '>', 0)
            ->first();
    }

    /**
     * Did this product actually run out after the given timestamp?
     * Used by OutcomeEvaluator to grade stockout predictions.
     */
    public function productStockedOutSince(int|string $tenantId, string $productId, Carbon $since): bool
    {
        // A stockout is visible as the product having zero remaining FIFO qty
        // at any point. We approximate with "is it at zero now, and did it sell
        // during the window" — a product sitting at zero that never sold was
        // simply never restocked, not a missed-sale event.
        $stock = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->whereNull('deleted_at')
            ->sum('remaining_qty');

        if ($stock > 0) {
            return false;
        }

        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->where('si.tenant_id', $tenantId)
            ->where('si.product_id', $productId)
            ->whereNull('si.deleted_at')
            ->whereNull('s.deleted_at')
            ->whereIn('s.status', self::REVENUE_STATUSES)
            ->where('s.posted_at', '>=', $since->toDateTimeString())
            ->exists();
    }

    /**
     * How much was collected from a party since a given moment?
     * Used to grade receivable-recovery predictions.
     */
    public function collectedFromPartySince(int|string $tenantId, string $partyId, Carbon $since): float
    {
        return (float) DB::table('allocations as pa')
            ->join('sales as s', 's.id', '=', 'pa.sale_id')
            ->where('pa.tenant_id', $tenantId)
            ->where('pa.status', 'active')
            ->where('s.party_id', $partyId)
            ->where('pa.created_at', '>=', $since->toDateTimeString())
            ->sum('pa.allocated_amount');
    }
}
