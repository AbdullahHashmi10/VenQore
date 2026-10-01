<?php

namespace App\Services\Growth\Brains;

use App\Services\Growth\GrowthContext;
use App\Services\Growth\Signal;
use Illuminate\Support\Collection;

/**
 * BRAIN C — PROFIT INTELLIGENCE  (new in V2)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## Why this brain had to exist
 *
 * V1 measured everything in REVENUE. Not one of its rules ever looked at cost,
 * margin or discount. That is a serious gap for a POS that already stores
 * immutable FIFO COGS on every single line (`sale_item_batches.total_cogs`) —
 * the hardest data to obtain was already sitting there, unused.
 *
 * Revenue-only thinking produces actively harmful advice. It will tell a shop
 * owner to push their highest-turnover product, when that product may be the
 * one they are selling at a loss. It cannot see the most common way a small
 * business quietly dies: costs creep up, retail prices stay put, and margin
 * bleeds out over months while the top line looks perfectly healthy.
 *
 * ## What this brain watches
 *
 *   - Margin erosion:  cost rose, price didn't.
 *   - Selling below cost: the line is losing money on every unit.
 *   - Discount leakage: the gap between list price and what is actually taken.
 *   - Price headroom: strong demand + thin margin = room to move.
 *   - Unprofitable customers: big revenue, negligible profit.
 *   - Mix shift: revenue flat, profit falling, because the MIX changed.
 *
 * Every figure below is FIFO-accurate, not based on the `products.cost_price`
 * weighted average, so the numbers reconcile with the accounting module.
 */
class ProfitBrain
{
    /**
     * @return Collection<int,Signal>
     */
    public function run(GrowthContext $ctx): Collection
    {
        $signals = collect();
        $cur     = $ctx->currency;

        $products = $ctx->data->productFacts($ctx->tenantId);
        $series   = $ctx->data->dailySeries($ctx->tenantId, 120);

        $signals = $signals->merge($this->productMarginSignals($ctx, $products, $cur));
        $signals = $signals->merge($this->mixShiftSignal($ctx, $series, $cur));
        $signals = $signals->merge($this->discountSignal($ctx, $series, $cur));

        if ($ctx->isDeep()) {
            $signals = $signals->merge($this->customerProfitabilitySignals($ctx, $cur));
        }

        return $signals;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PRODUCT-LEVEL MARGIN
    // ═══════════════════════════════════════════════════════════════════════

    private function productMarginSignals(GrowthContext $ctx, Collection $products, string $cur): Collection
    {
        $out  = collect();
        $sens = $ctx->sensitivity('margin_erosion');

        // The tenant's own median margin. A 12% margin is catastrophic for a
        // pharmacy and excellent for a fuel retailer, so the comparison has to
        // be internal.
        $margins = $products
            ->filter(fn ($f) => (float) $f->revenue_30d > 0)
            ->map(fn ($f) => ((float) $f->margin_30d / (float) $f->revenue_30d) * 100)
            ->sort()->values();

        $medianMargin = $margins->isEmpty() ? 0 : (float) $margins[(int) floor($margins->count() / 2)];

        foreach ($products as $f) {
            $rev30  = (float) $f->revenue_30d;
            $revPre = (float) $f->revenue_prev_30d;

            if ($rev30 <= 0) {
                continue;
            }

            $marginPct     = ($f->margin_30d / $rev30) * 100;
            $marginPctPrev = $revPre > 0 ? ((float) $f->margin_prev_30d / $revPre) * 100 : null;
            $name          = $f->product_name;

            // ── 1. SELLING BELOW COST ────────────────────────────────────
            // Unambiguous, immediately actionable, and genuinely common when
            // supplier prices move and nobody updates the till.
            if ((float) $f->margin_30d < 0 && $rev30 > $ctx->materialityFloor()) {
                $loss = abs((float) $f->margin_30d);
                $out->push(new Signal(
                    type: 'selling_below_cost',
                    subjectKey: 'product:' . $f->product_id,
                    title: "Losing money on every sale: {$name}",
                    message: "\"{$name}\" brought in " . $cur . " " . number_format($rev30)
                        . " over the last 30 days but cost you " . $cur . " " . number_format($rev30 + $loss)
                        . " to buy — a loss of " . $cur . " " . number_format($loss) . ". "
                        . "The more you sell, the more you lose. Either your supplier cost has risen or the till price is wrong.",
                    potentialRevenue: $loss,
                    confidence: 92,
                    productId: $f->product_id,
                    evidence: [
                        'Revenue (30d)'      => $cur . ' ' . number_format($rev30),
                        'FIFO cost (30d)'    => $cur . ' ' . number_format($rev30 + $loss),
                        'Loss'               => $cur . ' ' . number_format($loss),
                        'Current sell price' => $cur . ' ' . number_format((float) $f->sale_price, 2),
                        'Last purchase cost' => $f->last_unit_cost !== null ? $cur . ' ' . number_format((float) $f->last_unit_cost, 2) : 'unknown',
                        'Units sold (30d)'   => number_format((float) $f->qty_30d),
                    ],
                    actionUrl: "/products/{$f->product_id}",
                ));
                continue; // Below cost supersedes an erosion warning.
            }

            // ── 2. MARGIN EROSION ────────────────────────────────────────
            // Compares this month's margin percentage against last month's for
            // the same product. Requires meaningful revenue in both windows so
            // a single odd sale cannot trigger it.
            if ($marginPctPrev !== null
                && $revPre > $ctx->materialityFloor()
                && $rev30 > $ctx->materialityFloor()) {

                $drop = $marginPctPrev - $marginPct;

                if ($drop >= 5 * $sens && $marginPctPrev > 0) {
                    $annualised = ($drop / 100) * $rev30 * 12;
                    $out->push(new Signal(
                        type: 'margin_erosion',
                        subjectKey: 'product:' . $f->product_id,
                        title: "Margin down " . round($drop, 1) . " points: {$name}",
                        message: "\"{$name}\" earned " . round($marginPct, 1) . "% margin this month against "
                            . round($marginPctPrev, 1) . "% last month — a drop of " . round($drop, 1) . " percentage points on "
                            . $cur . " " . number_format($rev30) . " of sales. "
                            . "Revenue looks fine, which is exactly why this is easy to miss. "
                            . "Left alone at this volume it costs about " . $cur . " " . number_format($annualised) . " a year.",
                        potentialRevenue: $annualised,
                        confidence: 82,
                        productId: $f->product_id,
                        evidence: [
                            'Margin this month' => round($marginPct, 1) . '%',
                            'Margin last month' => round($marginPctPrev, 1) . '%',
                            'Change'            => '-' . round($drop, 1) . ' points',
                            'Revenue (30d)'     => $cur . ' ' . number_format($rev30),
                            'Profit lost vs last month' => $cur . ' ' . number_format(($drop / 100) * $rev30),
                            'Last purchase cost' => $f->last_unit_cost !== null ? $cur . ' ' . number_format((float) $f->last_unit_cost, 2) : 'unknown',
                        ],
                        actionUrl: "/products/{$f->product_id}",
                    ));
                }
            }

            // ── 3. PRICE HEADROOM ────────────────────────────────────────
            // Strong, broad demand plus a margin well under the shop's own
            // median is the classic under-pricing signature. Deliberately
            // conservative: it needs real buyer breadth, not one bulk order.
            if ($medianMargin > 0
                && $marginPct < $medianMargin * 0.6
                && $rev30 > $ctx->materialityFloor() * 2
                && (int) $f->buyers_90d >= 8
                && (float) $f->qty_30d > 0) {

                $gapPoints = $medianMargin - $marginPct;
                $upside    = ($gapPoints / 100) * $rev30 * 0.5; // capture half the gap

                $out->push(new Signal(
                    type: 'price_increase_opportunity',
                    subjectKey: 'product:' . $f->product_id,
                    title: "Under-priced: {$name}",
                    message: "\"{$name}\" sells well — " . (int) $f->buyers_90d . " different customers bought it in the last 90 days — "
                        . "but it earns only " . round($marginPct, 1) . "% margin against your shop median of " . round($medianMargin, 1) . "%. "
                        . "Closing even half that gap would add roughly " . $cur . " " . number_format($upside) . " a month. "
                        . "Strong demand usually absorbs a small increase without losing customers.",
                    potentialRevenue: $upside,
                    confidence: 58,
                    productId: $f->product_id,
                    evidence: [
                        'Margin on this product' => round($marginPct, 1) . '%',
                        'Your median margin'     => round($medianMargin, 1) . '%',
                        'Different buyers (90d)' => (int) $f->buyers_90d,
                        'Revenue (30d)'          => $cur . ' ' . number_format($rev30),
                        'Current price'          => $cur . ' ' . number_format((float) $f->sale_price, 2),
                        'Estimated monthly upside' => $cur . ' ' . number_format($upside),
                    ],
                    actionUrl: "/products/{$f->product_id}",
                ));
            }
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  TENANT-LEVEL MIX AND DISCOUNT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Revenue steady but profit falling ⇒ the SALES MIX has shifted toward
     * low-margin lines.
     *
     * This is one of the hardest things for an owner to spot unaided, because
     * every individual number looks acceptable. Only the relationship between
     * them reveals the problem.
     */
    private function mixShiftSignal(GrowthContext $ctx, Collection $series, string $cur): Collection
    {
        $out = collect();

        if ($series->count() < 45) {
            return $out; // Not enough history to make an honest claim.
        }

        $recent = $series->filter(fn ($d) => $d->d >= now()->subDays(30)->toDateString());
        $prior  = $series->filter(fn ($d) => $d->d < now()->subDays(30)->toDateString()
                                          && $d->d >= now()->subDays(90)->toDateString());

        $revRecent = (float) $recent->sum('revenue');
        $revPrior  = (float) $prior->sum('revenue');
        $marRecent = (float) $recent->sum('margin');
        $marPrior  = (float) $prior->sum('margin');

        if ($revRecent <= 0 || $revPrior <= 0) {
            return $out;
        }

        // Normalise the prior window to a comparable 30-day rate.
        $priorDays  = max(1, $prior->count());
        $revPriorN  = $revPrior / $priorDays * 30;
        $marPriorN  = $marPrior / $priorDays * 30;

        $pctRecent = $marRecent / $revRecent * 100;
        $pctPrior  = $revPriorN > 0 ? $marPriorN / $revPriorN * 100 : 0;

        $revChange    = ($revRecent - $revPriorN) / $revPriorN * 100;
        $marginPoints = $pctPrior - $pctRecent;

        // The signature: revenue held up (or grew) but margin % fell hard.
        if ($marginPoints >= 2.5 * $ctx->sensitivity('margin_mix_shift') && $revChange > -10) {
            $monthlyCost = ($marginPoints / 100) * $revRecent;

            $out->push(new Signal(
                type: 'margin_mix_shift',
                subjectKey: 'tenant:mix',
                title: "Sales holding, profit slipping",
                message: "Your revenue is " . ($revChange >= 0 ? "up " : "down ") . round(abs($revChange), 1) . "% over the last 30 days, "
                    . "but your gross margin fell from " . round($pctPrior, 1) . "% to " . round($pctRecent, 1) . "%. "
                    . "You are selling just as much and keeping less of it — that is a mix problem, not a sales problem. "
                    . "At current volumes it is costing about " . $cur . " " . number_format($monthlyCost) . " a month.",
                potentialRevenue: $monthlyCost * 12,
                confidence: 76,
                evidence: [
                    'Revenue (last 30d)'   => $cur . ' ' . number_format($revRecent),
                    'Revenue (prior rate)' => $cur . ' ' . number_format($revPriorN),
                    'Margin now'           => round($pctRecent, 1) . '%',
                    'Margin before'        => round($pctPrior, 1) . '%',
                    'Monthly profit lost'  => $cur . ' ' . number_format($monthlyCost),
                ],
                actionUrl: '/reports/profit-loss',
            ));
        }

        return $out;
    }

    /**
     * Discount leakage — the quiet margin killer.
     *
     * Discounts almost never appear as a line item anyone reviews. Expressed
     * as a share of gross sales and compared against the shop's own history,
     * they become visible and controllable.
     */
    private function discountSignal(GrowthContext $ctx, Collection $series, string $cur): Collection
    {
        $out = collect();

        if ($series->count() < 30) {
            return $out;
        }

        $recent = $series->filter(fn ($d) => $d->d >= now()->subDays(30)->toDateString());
        $prior  = $series->filter(fn ($d) => $d->d < now()->subDays(30)->toDateString());

        $revRecent = (float) $recent->sum('revenue');
        $disRecent = (float) $recent->sum('discount');
        $revPrior  = (float) $prior->sum('revenue');
        $disPrior  = (float) $prior->sum('discount');

        if ($revRecent <= 0) {
            return $out;
        }

        $pctRecent = $disRecent / ($revRecent + $disRecent) * 100;
        $pctPrior  = ($revPrior + $disPrior) > 0 ? $disPrior / ($revPrior + $disPrior) * 100 : 0;

        $rising = $pctPrior > 0 && ($pctRecent - $pctPrior) >= 1.5;
        $high   = $pctRecent >= 6;

        if (($rising || $high) && $disRecent > $ctx->materialityFloor()) {
            $annualised = $disRecent * 12;

            $out->push(new Signal(
                type: 'discount_leakage',
                subjectKey: 'tenant:discount',
                title: "Discounts are " . round($pctRecent, 1) . "% of sales",
                message: "You gave away " . $cur . " " . number_format($disRecent) . " in discounts over the last 30 days — "
                    . round($pctRecent, 1) . "% of gross sales"
                    . ($rising ? ", up from " . round($pctPrior, 1) . "% before" : "") . ". "
                    . "Discounts come straight off profit, not off revenue, so this is money that never reaches you. "
                    . "Over a year that pace is " . $cur . " " . number_format($annualised) . ". "
                    . "A discount ceiling at the till usually recovers most of it.",
                potentialRevenue: $annualised * 0.35,
                confidence: 80,
                evidence: [
                    'Discounts (30d)'    => $cur . ' ' . number_format($disRecent),
                    'As % of gross sales'=> round($pctRecent, 1) . '%',
                    'Previously'         => round($pctPrior, 1) . '%',
                    'Annualised'         => $cur . ' ' . number_format($annualised),
                ],
                actionUrl: '/reports/sales',
            ));
        }

        return $out;
    }

    /**
     * Customers who look valuable on revenue but contribute almost no profit.
     *
     * A frequent, painful discovery for wholesalers: the biggest account is
     * the one negotiated down to nothing, and it is absorbing the most
     * service, delivery and credit.
     */
    private function customerProfitabilitySignals(GrowthContext $ctx, string $cur): Collection
    {
        $out   = collect();
        $facts = $ctx->data->customerFacts($ctx->tenantId, 180);

        if ($facts->count() < 5) {
            return $out;
        }

        $withMargin = $facts->filter(fn ($f) => (float) $f->total_spent > 0);
        if ($withMargin->isEmpty()) {
            return $out;
        }

        $overallMarginPct = $withMargin->sum(fn ($f) => (float) $f->total_spent) > 0
            ? $withMargin->sum(fn ($f) => (float) ($f->total_margin ?? 0))
              / $withMargin->sum(fn ($f) => (float) $f->total_spent) * 100
            : 0;

        $revenues = $withMargin->map(fn ($f) => (float) $f->total_spent)->sort()->values();
        $p75      = $revenues->isEmpty() ? 0 : (float) $revenues[(int) floor($revenues->count() * 0.75)];

        foreach ($withMargin as $f) {
            $rev = (float) $f->total_spent;
            $mar = (float) ($f->total_margin ?? 0);

            if ($rev < max($p75, $ctx->materialityFloor() * 5)) {
                continue;
            }

            $pct = $rev > 0 ? $mar / $rev * 100 : 0;

            if ($overallMarginPct > 0 && $pct < $overallMarginPct * 0.5) {
                $gap = (($overallMarginPct - $pct) / 100) * $rev;

                $out->push(new Signal(
                    type: 'unprofitable_customer',
                    subjectKey: 'party:' . $f->party_id,
                    title: "Big revenue, thin profit: {$f->party_name}",
                    message: "{$f->party_name} is one of your larger customers — " . $cur . " " . number_format($rev)
                        . " over the last 6 months — but you only kept " . round($pct, 1) . "% of it as profit, "
                        . "against " . round($overallMarginPct, 1) . "% across your business. "
                        . "If they bought at your normal margin you would have earned another " . $cur . " " . number_format($gap) . ". "
                        . "Worth reviewing their pricing before the next order.",
                    potentialRevenue: $gap,
                    confidence: 74,
                    partyId: $f->party_id,
                    evidence: [
                        'Revenue (6 months)'  => $cur . ' ' . number_format($rev),
                        'Profit earned'       => $cur . ' ' . number_format($mar),
                        'Their margin'        => round($pct, 1) . '%',
                        'Your average margin' => round($overallMarginPct, 1) . '%',
                        'Profit gap'          => $cur . ' ' . number_format($gap),
                        'Orders'              => (int) $f->total_orders,
                    ],
                    data: ['party_name' => $f->party_name, 'phone' => $f->phone],
                    actionUrl: "/parties/{$f->party_id}",
                ));
            }
        }

        // Cap it: this insight is useful for the worst two or three accounts,
        // not as a list of twenty.
        return $out->sortByDesc(fn (Signal $s) => $s->potentialRevenue)->take(3)->values();
    }
}
