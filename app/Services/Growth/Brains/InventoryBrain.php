<?php

namespace App\Services\Growth\Brains;

use App\Models\ProductAnalytics;
use App\Services\Growth\GrowthContext;
use App\Services\Growth\Signal;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * BRAIN B — INVENTORY INTELLIGENCE
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## What V1 did
 *
 * V1's "Inventory Forecaster" worked like this: find customers whose predicted
 * next order falls in the next 7 days, look at the ONE most recent invoice for
 * each, assume they will buy exactly the same items in exactly the same
 * quantities, sum that up, and compare it to stock.
 *
 * Every step of that is fragile:
 *   - It depended on `customer_analytics`, which depended on the retention
 *     brain, which depended on the empty `invoices` table. Cascading nothing.
 *   - It ignored walk-in and one-off sales entirely — for most retail shops
 *     that IS the business.
 *   - "Last basket repeats exactly" is a poor demand model. Real demand is a
 *     rate, measured over time, across all customers.
 *   - It never once looked at stock that ISN'T selling, which is where most
 *     small retailers actually have their money stuck.
 *
 * ## What V2 does
 *
 * Demand is modelled as VELOCITY — units per day, measured over 7/30/90-day
 * windows from every posted sale. Days-of-cover falls straight out of that,
 * and so does a projected stockout date. Comparing the three windows exposes
 * acceleration and collapse, which a single average hides.
 *
 * It then covers the whole stock lifecycle, not just shortages: dead stock,
 * trapped cash, expiry, demand surges, reorder levels, and quality problems
 * showing up as return rates.
 */
class InventoryBrain
{
    /**
     * @return Collection<int,Signal>
     */
    public function run(GrowthContext $ctx): Collection
    {
        $signals = collect();
        $facts   = $ctx->data->productFacts($ctx->tenantId);

        if ($facts->isEmpty()) {
            return $signals;
        }

        $rows = [];
        $now  = now();
        $cur  = $ctx->currency;

        // ABC classification needs the tenant's total revenue first.
        $totalRevenue = (float) $facts->sum(fn ($f) => (float) $f->revenue_30d);
        $ranked       = $facts->sortByDesc(fn ($f) => (float) $f->revenue_30d)->values();
        $abc          = $this->abcClasses($ranked, $totalRevenue);

        // Typical supplier lead time, learned from this tenant's own purchase
        // history rather than assumed. Falls back to a conservative 7 days.
        $leadTime = $ctx->leadTimeDays();

        foreach ($facts as $f) {
            $m = $this->metrics($f, $leadTime);
            $rows[] = $this->analyticsRow($ctx, $f, $m, $abc[$f->product_id] ?? null, $now);

            $signals = $signals->merge(
                $this->evaluate($ctx, $f, $m, $cur, $leadTime, $abc[$f->product_id] ?? 'C')
            );
        }

        $this->persist($rows);
        $ctx->productsAnalysed = count($rows);

        return $signals;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  METRICS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Derive the decision metrics for one product.
     *
     * The blended velocity is the important choice here. Using 7-day alone is
     * jumpy; using 90-day alone is blind to a change that started last week.
     * Weighting recent windows more heavily (50/30/20) tracks real movement
     * without over-reacting to a single busy afternoon.
     */
    private function metrics(object $f, int $leadTime): array
    {
        $v7  = (float) $f->qty_7d  / 7;
        $v30 = (float) $f->qty_30d / 30;
        $v90 = (float) $f->qty_90d / 90;

        $blended = ($v7 * 0.5) + ($v30 * 0.3) + ($v90 * 0.2);

        // Acceleration: recent rate against the medium-term rate.
        $trendPct = $v30 > 0 ? round((($v7 - $v30) / $v30) * 100, 2) : ($v7 > 0 ? 100.0 : 0.0);

        $stock = (float) $f->current_stock;
        $cover = $blended > 0.0001 ? round($stock / $blended, 2) : null;

        $stockoutDate = ($cover !== null && $cover < 365)
            ? now()->addDays((int) floor($cover))
            : null;

        $marginPct     = (float) $f->revenue_30d > 0 ? ((float) $f->margin_30d / (float) $f->revenue_30d) * 100 : 0.0;
        $marginPctPrev = (float) $f->revenue_prev_30d > 0 ? ((float) $f->margin_prev_30d / (float) $f->revenue_prev_30d) * 100 : 0.0;

        $discountPct = (float) $f->gross_30d > 0
            ? ((float) $f->discount_30d / (float) $f->gross_30d) * 100
            : 0.0;

        $returnRate = (float) $f->sold_90d > 0
            ? ((float) $f->returned_90d / (float) $f->sold_90d) * 100
            : 0.0;

        $daysSinceSale = $f->last_sold_date
            ? Carbon::parse($f->last_sold_date)->diffInDays(now())
            : null;

        return [
            'v7' => $v7, 'v30' => $v30, 'v90' => $v90,
            'velocity'        => $blended,
            'trend_pct'       => $trendPct,
            'stock'           => $stock,
            'stock_value'     => (float) $f->stock_value,
            'cover'           => $cover,
            'stockout_date'   => $stockoutDate,
            'reorder_point'   => $blended * $leadTime,
            'margin_pct'      => round($marginPct, 2),
            'margin_pct_prev' => round($marginPctPrev, 2),
            'discount_pct'    => round($discountPct, 2),
            'return_rate'     => round($returnRate, 2),
            'days_since_sale' => $daysSinceSale,
            'movement'        => $this->classify($blended, $trendPct, $daysSinceSale, (float) $f->current_stock),
        ];
    }

    private function classify(float $velocity, float $trend, ?int $daysSinceSale, float $stock): string
    {
        if ($velocity <= 0.0001) {
            return ($stock > 0 && ($daysSinceSale === null || $daysSinceSale > 60)) ? 'dead' : 'inactive';
        }
        if ($trend >= 40)  return 'rising';
        if ($trend <= -40) return 'falling';
        if ($velocity < 0.05) return 'slow';
        if ($velocity > 2)    return 'fast';
        return 'steady';
    }

    /**
     * ABC: A = top 80% of revenue, B = next 15%, C = the tail.
     * Used to modulate urgency — a stockout on an A-item is a real problem,
     * on a C-item it usually is not worth an alert at all.
     */
    private function abcClasses(Collection $ranked, float $total): array
    {
        $out = [];
        $acc = 0.0;
        foreach ($ranked as $f) {
            $acc += (float) $f->revenue_30d;
            $share = $total > 0 ? $acc / $total : 1;
            $out[$f->product_id] = $share <= 0.80 ? 'A' : ($share <= 0.95 ? 'B' : 'C');
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RULES
    // ═══════════════════════════════════════════════════════════════════════

    private function evaluate(
        GrowthContext $ctx,
        object $f,
        array $m,
        string $cur,
        int $leadTime,
        string $abc
    ): Collection {
        $out  = collect();
        $name = $f->product_name;
        $unit = $f->unit ?: 'pcs';
        $sens = $ctx->sensitivity('stockout_imminent');

        // ── 1. OUT OF STOCK, STILL IN DEMAND ─────────────────────────────
        // The most expensive moment in retail, and V1 could not see it.
        if ($m['stock'] <= 0 && $m['velocity'] > 0.02 && $m['days_since_sale'] !== null && $m['days_since_sale'] <= 14) {
            $weeklyLoss = $m['velocity'] * 7 * (float) $f->sale_price;
            $out->push(new Signal(
                type: 'stockout_now',
                subjectKey: 'product:' . $f->product_id,
                title: "Out of stock: {$name}",
                message: "\"{$name}\" is at zero but was selling " . $this->rate($m['velocity'], $unit) . " until "
                    . $m['days_since_sale'] . " day" . ($m['days_since_sale'] === 1 ? '' : 's') . " ago. "
                    . "At that rate you are losing roughly " . $cur . " " . number_format($weeklyLoss) . " of sales every week it stays empty"
                    . ($abc === 'A' ? ", and this is one of your top-selling lines." : "."),
                potentialRevenue: $weeklyLoss,
                confidence: 90,
                productId: $f->product_id,
                evidence: [
                    'Current stock'      => '0 ' . $unit,
                    'Recent sales rate'  => $this->rate($m['velocity'], $unit),
                    'Last sold'          => $m['days_since_sale'] . ' days ago',
                    'Revenue last 30d'   => $cur . ' ' . number_format((float) $f->revenue_30d),
                    'Importance'         => $abc . '-class product',
                ],
                actionUrl: '/purchases/create?product=' . $f->product_id,
            ));
        }

        // ── 2. ABOUT TO RUN OUT ──────────────────────────────────────────
        // Compared against the tenant's OWN learned supplier lead time, so the
        // alert arrives with enough time to actually do something.
        elseif ($m['cover'] !== null && $m['velocity'] > 0.02 && $m['cover'] <= ($leadTime * 1.5 * $sens) && $m['stock'] > 0) {
            $days     = (int) floor($m['cover']);
            $shortfall = max(0, ($m['velocity'] * ($leadTime + 7)) - $m['stock']);
            $atRisk    = $shortfall * (float) $f->sale_price;

            $out->push(new Signal(
                type: 'stockout_imminent',
                subjectKey: 'product:' . $f->product_id,
                title: "Running out in {$days} days: {$name}",
                message: "You have " . $this->qty($m['stock'], $unit) . " of \"{$name}\" left and it is selling "
                    . $this->rate($m['velocity'], $unit) . " — about {$days} days of cover. "
                    . "Your suppliers typically take {$leadTime} days, so this needs ordering "
                    . ($days <= $leadTime ? "today" : "within " . max(1, $days - $leadTime) . " days")
                    . " to avoid an empty shelf. Roughly " . $cur . " " . number_format($atRisk) . " of sales are at risk.",
                potentialRevenue: $atRisk,
                confidence: $this->velocityConfidence($m),
                productId: $f->product_id,
                evidence: [
                    'Stock on hand'      => $this->qty($m['stock'], $unit),
                    'Sales rate'         => $this->rate($m['velocity'], $unit),
                    'Days of cover'      => $days,
                    'Typical lead time'  => $leadTime . ' days',
                    'Suggested order'    => $this->qty(max($shortfall, $m['velocity'] * 30), $unit),
                    'Trend'              => ($m['trend_pct'] >= 0 ? '+' : '') . round($m['trend_pct']) . '% vs last month',
                ],
                actionUrl: '/purchases/create?product=' . $f->product_id,
                horizonDays: max(7, $days + $leadTime),
            ));
        }

        // ── 3. BELOW THE OWNER'S OWN REORDER LEVEL ───────────────────────
        // Respects a threshold the owner already configured. Only raised when
        // rule 2 has not already covered it, so the feed does not double up.
        elseif ((int) $f->min_stock_alert > 0
            && $m['stock'] > 0
            && $m['stock'] <= (float) $f->min_stock_alert
            && $m['velocity'] > 0) {
            $out->push(new Signal(
                type: 'reorder_point_breached',
                subjectKey: 'product:' . $f->product_id,
                title: "Below reorder level: {$name}",
                message: "\"{$name}\" is down to " . $this->qty($m['stock'], $unit)
                    . ", at or below the reorder level of " . $this->qty((float) $f->min_stock_alert, $unit) . " you set. "
                    . "Current sales rate is " . $this->rate($m['velocity'], $unit) . ".",
                potentialRevenue: $m['velocity'] * 30 * (float) $f->sale_price,
                confidence: 85,
                productId: $f->product_id,
                evidence: [
                    'Stock on hand'  => $this->qty($m['stock'], $unit),
                    'Your reorder level' => $this->qty((float) $f->min_stock_alert, $unit),
                    'Sales rate'     => $this->rate($m['velocity'], $unit),
                ],
                actionUrl: '/purchases/create?product=' . $f->product_id,
            ));
        }

        // ── 4. DEMAND SURGE ──────────────────────────────────────────────
        // Opportunity, not risk: buy deeper while the run lasts.
        if ($m['trend_pct'] >= 60 * $sens && $m['v7'] > 0.1 && (float) $f->qty_30d > 0 && $abc !== 'C') {
            $out->push(new Signal(
                type: 'demand_surge',
                subjectKey: 'product:' . $f->product_id,
                title: "Demand jumped " . round($m['trend_pct']) . "%: {$name}",
                message: "\"{$name}\" is now selling " . $this->rate($m['v7'], $unit)
                    . " versus " . $this->rate($m['v30'], $unit) . " over the past month — up " . round($m['trend_pct']) . "%. "
                    . ($m['cover'] !== null && $m['cover'] < 30
                        ? "At the new rate your stock lasts only " . (int) $m['cover'] . " days. "
                        : "")
                    . "If this holds, order deeper than usual on the next purchase.",
                potentialRevenue: ($m['v7'] - $m['v30']) * 30 * (float) $f->sale_price,
                confidence: $this->velocityConfidence($m) * 0.9,
                productId: $f->product_id,
                evidence: [
                    'Last 7 days'   => $this->rate($m['v7'], $unit),
                    'Last 30 days'  => $this->rate($m['v30'], $unit),
                    'Change'        => '+' . round($m['trend_pct']) . '%',
                    'Days of cover' => $m['cover'] !== null ? (int) $m['cover'] : 'plenty',
                    'Buyers (90d)'  => (int) $f->buyers_90d,
                ],
                actionUrl: '/purchases/create?product=' . $f->product_id,
            ));
        }

        // ── 5. DEAD STOCK ────────────────────────────────────────────────
        // Where small retailers' money actually goes to die. Completely absent
        // from V1, which only ever looked for shortages.
        if ($m['stock'] > 0
            && $m['stock_value'] >= $ctx->deadStockFloor()
            && ($m['days_since_sale'] === null || $m['days_since_sale'] >= 90 / max($sens, 0.5))) {
            $days = $m['days_since_sale'] ?? 999;
            $held = $f->oldest_batch_date
                ? Carbon::parse($f->oldest_batch_date)->diffInDays(now())
                : null;

            $out->push(new Signal(
                type: 'dead_stock',
                subjectKey: 'product:' . $f->product_id,
                title: "Dead stock: {$name}",
                message: $cur . " " . number_format($m['stock_value']) . " is sitting in \"{$name}\" ("
                    . $this->qty($m['stock'], $unit) . ") and it has "
                    . ($m['days_since_sale'] === null ? "never sold" : "not sold in {$days} days")
                    . ($held ? ", with the oldest units bought {$held} days ago" : "") . ". "
                    . "That is cash you have already spent, locked in a shelf. Discounting it to clear is almost always better than holding it another quarter.",
                potentialRevenue: $m['stock_value'],
                confidence: 88,
                productId: $f->product_id,
                evidence: [
                    'Money tied up'   => $cur . ' ' . number_format($m['stock_value']),
                    'Units held'      => $this->qty($m['stock'], $unit),
                    'Last sold'       => $m['days_since_sale'] === null ? 'Never' : $days . ' days ago',
                    'Oldest stock'    => $held ? $held . ' days old' : 'unknown',
                    'Sales last 90d'  => (float) $f->qty_90d . ' ' . $unit,
                ],
                actionUrl: "/products/{$f->product_id}",
            ));
        }

        // ── 6. OVERSTOCK — CASH TRAPPED IN SLOW MOVERS ───────────────────
        // Different from dead stock: this one IS selling, just far too slowly
        // for the amount of money committed to it.
        elseif ($m['cover'] !== null
            && $m['cover'] > 180
            && $m['stock_value'] >= $ctx->deadStockFloor() * 2
            && $m['velocity'] > 0) {
            $excessMonths = round($m['cover'] / 30);
            $excessValue  = $m['stock_value'] * (1 - min(1, 90 / $m['cover']));

            $out->push(new Signal(
                type: 'overstock_cash_trapped',
                subjectKey: 'product:' . $f->product_id,
                title: "{$excessMonths} months of stock: {$name}",
                message: "You are holding " . $this->qty($m['stock'], $unit) . " of \"{$name}\" — about {$excessMonths} months' supply at the current rate of "
                    . $this->rate($m['velocity'], $unit) . ". "
                    . "Around " . $cur . " " . number_format($excessValue) . " of that is beyond a healthy 3-month cover. "
                    . "Stop reordering this line until it comes down.",
                potentialRevenue: $excessValue,
                confidence: 80,
                productId: $f->product_id,
                evidence: [
                    'Stock value'      => $cur . ' ' . number_format($m['stock_value']),
                    'Months of cover'  => $excessMonths,
                    'Sales rate'       => $this->rate($m['velocity'], $unit),
                    'Excess above 3 months' => $cur . ' ' . number_format($excessValue),
                ],
                actionUrl: "/products/{$f->product_id}",
            ));
        }

        // ── 7. EXPIRY ────────────────────────────────────────────────────
        if ((float) ($f->expiring_qty ?? 0) > 0 && $f->nearest_expiry) {
            $days = Carbon::parse($f->nearest_expiry)->diffInDays(now(), false);
            $days = (int) abs($days);
            $qty  = (float) $f->expiring_qty;
            $canSell = $m['velocity'] * max($days, 0);
            $atRisk  = max(0, $qty - $canSell);

            if ($atRisk > 0) {
                $lossValue = $atRisk * ((float) $f->cost_price ?: 0);
                $out->push(new Signal(
                    type: 'expiry_risk',
                    subjectKey: 'product:' . $f->product_id . ':exp:' . Carbon::parse($f->nearest_expiry)->format('Ym'),
                    title: "Expiring in {$days} days: {$name}",
                    message: $this->qty($qty, $unit) . " of \"{$name}\" expires on "
                        . Carbon::parse($f->nearest_expiry)->format('d M Y') . ". "
                        . "At the current rate of " . $this->rate($m['velocity'], $unit) . " you will only sell about "
                        . $this->qty($canSell, $unit) . " before then, leaving " . $this->qty($atRisk, $unit)
                        . " to write off — roughly " . $cur . " " . number_format($lossValue) . " lost. "
                        . "Discount it now while it still has value.",
                    potentialRevenue: $lossValue,
                    confidence: 85,
                    productId: $f->product_id,
                    evidence: [
                        'Expiring quantity' => $this->qty($qty, $unit),
                        'Expiry date'       => Carbon::parse($f->nearest_expiry)->format('d M Y'),
                        'Days remaining'    => $days,
                        'Will sell by then' => $this->qty($canSell, $unit),
                        'At risk'           => $this->qty($atRisk, $unit),
                        'Value at risk'     => $cur . ' ' . number_format($lossValue),
                    ],
                    actionUrl: "/products/{$f->product_id}",
                    horizonDays: max(3, $days),
                ));
            }
        }

        // ── 8. QUALITY / RETURNS ─────────────────────────────────────────
        if ($m['return_rate'] >= 12 && (float) $f->sold_90d >= 20) {
            $out->push(new Signal(
                type: 'high_return_rate',
                subjectKey: 'product:' . $f->product_id,
                title: round($m['return_rate']) . "% returned: {$name}",
                message: "Customers are returning " . round($m['return_rate']) . "% of \"{$name}\" — "
                    . number_format((float) $f->returned_90d) . " of " . number_format((float) $f->sold_90d)
                    . " units sold in the last 90 days. "
                    . "That is well above normal and usually points at a quality, sizing or supplier problem. "
                    . "Worth checking before the next purchase order.",
                potentialRevenue: (float) $f->returned_90d * (float) $f->sale_price,
                confidence: 78,
                productId: $f->product_id,
                evidence: [
                    'Return rate'   => round($m['return_rate'], 1) . '%',
                    'Units returned'=> number_format((float) $f->returned_90d),
                    'Units sold'    => number_format((float) $f->sold_90d),
                    'Last supplier purchase' => $f->last_purchased_date ?: 'unknown',
                ],
                actionUrl: "/products/{$f->product_id}",
            ));
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PERSISTENCE + HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private function analyticsRow(GrowthContext $ctx, object $f, array $m, ?string $abc, Carbon $now): array
    {
        return [
            'id'                      => (string) Str::uuid(),
            'tenant_id'               => $ctx->tenantId,
            'product_id'              => $f->product_id,
            'velocity_7d'             => $m['v7'],
            'velocity_30d'            => $m['v30'],
            'velocity_90d'            => $m['v90'],
            'velocity_trend_pct'      => $m['trend_pct'],
            'qty_sold_30d'            => (float) $f->qty_30d,
            'revenue_30d'             => (float) $f->revenue_30d,
            'margin_30d'              => (float) $f->margin_30d,
            'margin_pct_30d'          => $m['margin_pct'],
            'margin_pct_prev_30d'     => $m['margin_pct_prev'],
            'current_stock'           => $m['stock'],
            'stock_value'             => $m['stock_value'],
            'days_of_cover'           => $m['cover'],
            'projected_stockout_date' => $m['stockout_date']?->toDateString(),
            'last_sold_date'          => $f->last_sold_date,
            'last_purchased_date'     => $f->last_purchased_date,
            'days_since_last_sale'    => $m['days_since_sale'],
            'distinct_buyers_90d'     => (int) $f->buyers_90d,
            'return_rate_90d'         => $m['return_rate'],
            'avg_discount_pct_30d'    => $m['discount_pct'],
            'movement_class'          => $m['movement'],
            'abc_class'               => $abc,
            'last_computed_at'        => $now,
            'created_at'              => $now,
            'updated_at'              => $now,
        ];
    }

    private function persist(array $rows): void
    {
        if (empty($rows)) return;

        foreach (array_chunk($rows, 400) as $chunk) {
            ProductAnalytics::withoutTenantScope()->upsert(
                $chunk,
                ['tenant_id', 'product_id'],
                [
                    'velocity_7d', 'velocity_30d', 'velocity_90d', 'velocity_trend_pct',
                    'qty_sold_30d', 'revenue_30d', 'margin_30d', 'margin_pct_30d',
                    'margin_pct_prev_30d', 'current_stock', 'stock_value', 'days_of_cover',
                    'projected_stockout_date', 'last_sold_date', 'last_purchased_date',
                    'days_since_last_sale', 'distinct_buyers_90d', 'return_rate_90d',
                    'avg_discount_pct_30d', 'movement_class', 'abc_class',
                    'last_computed_at', 'updated_at',
                ]
            );
        }
    }

    /**
     * How much do we trust this velocity figure?
     *
     * A product with 3 months of consistent history earns high confidence. One
     * with a single week of data does not — and saying so out loud is what
     * stops the owner from losing faith the first time a guess is wrong.
     */
    private function velocityConfidence(array $m): float
    {
        $history = $m['v90'] > 0 ? 1.0 : ($m['v30'] > 0 ? 0.7 : 0.4);

        // Agreement between windows: consistent rates ⇒ believable forecast.
        $spread = $m['v30'] > 0 ? abs($m['v7'] - $m['v30']) / $m['v30'] : 1;
        $stability = max(0.3, 1 - min(1, $spread));

        return round(min(95, ($history * 0.5 + $stability * 0.5) * 100), 2);
    }

    private function rate(float $perDay, string $unit): string
    {
        if ($perDay >= 1) {
            return round($perDay, 1) . ' ' . $unit . '/day';
        }
        $perWeek = $perDay * 7;
        if ($perWeek >= 1) {
            return round($perWeek, 1) . ' ' . $unit . '/week';
        }
        return round($perDay * 30, 1) . ' ' . $unit . '/month';
    }

    private function qty(float $q, string $unit): string
    {
        return (fmod($q, 1) === 0.0 ? number_format($q) : number_format($q, 2)) . ' ' . $unit;
    }
}
