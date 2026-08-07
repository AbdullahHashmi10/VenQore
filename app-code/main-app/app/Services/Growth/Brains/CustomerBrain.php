<?php

namespace App\Services\Growth\Brains;

use App\Models\CustomerAnalytics;
use App\Services\Growth\GrowthContext;
use App\Services\Growth\InsightCatalog;
use App\Services\Growth\Signal;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * BRAIN A — CUSTOMER INTELLIGENCE
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## What V1 did, and why it barely worked
 *
 * V1's retention brain looped over every customer, ran a query per customer,
 * and required `invoices.count() >= 3` — on a table that never contained a
 * single sale (see GrowthDataSource for the full post-mortem). Even if the
 * data had been correct, its logic had three deep flaws:
 *
 *   1. A FLAT LATENESS RULE. "At risk if days_since > 1.3 × average gap."
 *      For a customer who orders every 30 ± 2 days, day 40 is a genuine alarm.
 *      For one who orders every 30 ± 28 days, day 40 is completely normal.
 *      One constant cannot serve both, so the rule was simultaneously too
 *      noisy for erratic customers and too slow for regular ones.
 *
 *   2. IT ONLY EVER LOOKED BACKWARD. It could say "this person stopped buying"
 *      but never "this person is about to", which is the only version a shop
 *      owner can actually act on.
 *
 *   3. IT KNEW REVENUE, NOT PROFIT. The biggest spender and the most valuable
 *      customer are frequently different people.
 *
 * ## What V2 does
 *
 * Lateness is measured in STANDARD DEVIATIONS of each customer's own order
 * gap, not in multiples of an average. That single change is why this brain
 * fires often AND stays trustworthy: it adapts its threshold per customer
 * instead of applying one number to everybody.
 *
 * It also segments on RFM, tracks margin alongside revenue, spots customers
 * whose spend is quietly falling while they still look "active", flags new
 * customers before the critical second-purchase window closes, watches credit
 * exposure, and mines the basket for cross-sell pairs.
 */
class CustomerBrain
{
    /**
     * @return Collection<int,Signal>
     */
    public function run(GrowthContext $ctx): Collection
    {
        $signals = collect();
        $facts   = $ctx->data->customerFacts($ctx->tenantId);

        if ($facts->isEmpty()) {
            return $signals;
        }

        $receivables = $ctx->data->receivablesByParty($ctx->tenantId);

        // Percentile cut-offs computed from THIS tenant's own distribution.
        // A "top customer" in a wholesale business and in a kiosk are orders
        // of magnitude apart; a hardcoded rupee threshold would be wrong for
        // almost everyone.
        $spends   = $facts->pluck('total_spent')->map(fn ($v) => (float) $v)->sort()->values();
        $p80Spend = $this->percentile($spends, 0.80);
        $p95Spend = $this->percentile($spends, 0.95);

        $profiles = [];

        foreach ($facts as $f) {
            $profile = $this->buildProfile($f, $receivables[$f->party_id] ?? 0.0);
            $profiles[] = $profile;

            $signals = $signals->merge($this->evaluate($ctx, $f, $profile, $p80Spend, $p95Spend));
        }

        // Persist the enriched profiles so the dashboard, the other brains and
        // the outcome evaluator all read the same pre-computed picture.
        $this->persistProfiles($ctx, $profiles);
        $ctx->customersAnalysed = count($profiles);

        // Cross-sell is a tenant-level pattern, not a per-customer one.
        if ($ctx->isDeep()) {
            $signals = $signals->merge($this->crossSellSignals($ctx));
        }

        return $signals;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PROFILE CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Turn raw SQL facts into a decision-ready profile.
     *
     * The heart of this is `zScore`: how many standard deviations past their
     * own normal gap is this customer? That is the number every retention
     * decision below keys off.
     */
    private function buildProfile(object $f, float $outstanding): array
    {
        $orders     = (int) $f->total_orders;
        $recency    = $f->recency_days === null ? null : (int) $f->recency_days;
        $avgGap     = $f->avg_gap !== null ? (float) $f->avg_gap : null;
        $stddevGap  = $f->stddev_gap !== null ? (float) $f->stddev_gap : null;
        $gapSamples = (int) ($f->gap_samples ?? 0);

        $revenue = (float) $f->total_spent;
        $margin  = (float) ($f->total_margin ?? 0);

        // With fewer than 2 gaps we have no idea what "normal" looks like, so
        // we deliberately refuse to make a lateness claim at all rather than
        // invent one. V1 happily predicted from a single interval.
        $hasRhythm = $gapSamples >= 2 && $avgGap !== null && $avgGap > 0;

        // A customer with a very erratic gap gets a wide tolerance band; a
        // metronomic one gets a tight band. Floor at 15% of the mean so a
        // freakishly consistent customer does not trigger on a single day.
        $sigma = null;
        if ($hasRhythm) {
            $sigma = max(
                (float) ($stddevGap ?? 0),
                $avgGap * 0.15,
                1.0
            );
        }

        $zScore = ($hasRhythm && $recency !== null && $sigma > 0)
            ? ($recency - $avgGap) / $sigma
            : null;

        // Prediction confidence rises with sample size and falls with
        // volatility. This is what we surface to the owner as "how sure are we".
        $confidence = 0.0;
        if ($hasRhythm) {
            $sampleTerm     = min(1.0, $gapSamples / 8);            // 8 gaps ⇒ full marks
            $volatilityTerm = 1 - min(1.0, ($sigma / max($avgGap, 1)));
            $confidence     = round(($sampleTerm * 0.55 + $volatilityTerm * 0.45) * 100, 2);
        }

        $predictedNext = ($hasRhythm && $f->last_order_date)
            ? Carbon::parse($f->last_order_date)->addDays((int) round($avgGap))
            : null;

        // Spend trend: last 90 days vs the 90 before that.
        $spend90   = (float) ($f->spend_90d ?? 0);
        $spendPrev = (float) ($f->spend_prev_90d ?? 0);
        $trendPct  = $spendPrev > 0 ? round((($spend90 - $spendPrev) / $spendPrev) * 100, 2) : 0.0;
        $trend     = 'steady';
        if ($spendPrev > 0) {
            if ($trendPct <= -25) $trend = 'falling';
            elseif ($trendPct >= 25) $trend = 'rising';
        } elseif ($spend90 > 0) {
            $trend = 'rising';
        }

        $lifetimeDays = $f->first_order_date
            ? max(1, Carbon::parse($f->first_order_date)->diffInDays(now()))
            : 1;

        // Simple, explainable CLV: observed spend rate projected over the
        // expected remaining relationship. No black box — an owner can check it.
        $dailyValue   = $revenue / $lifetimeDays;
        $predictedClv = round($dailyValue * 365, 2);

        return [
            'party_id'          => $f->party_id,
            'party_name'        => $f->party_name,
            'phone'             => $f->phone,
            'orders'            => $orders,
            'revenue'           => $revenue,
            'margin'            => $margin,
            'margin_pct'        => $revenue > 0 ? round($margin / $revenue * 100, 2) : 0,
            'aov'               => (float) $f->avg_order_value,
            'recency'           => $recency,
            'avg_gap'           => $avgGap,
            'sigma'             => $sigma,
            'gap_samples'       => $gapSamples,
            'z'                 => $zScore,
            'has_rhythm'        => $hasRhythm,
            'confidence'        => $confidence,
            'predicted_next'    => $predictedNext,
            'first_order'       => $f->first_order_date,
            'last_order'        => $f->last_order_date,
            'lifetime_days'     => $lifetimeDays,
            'clv'               => $predictedClv,
            'orders_90d'        => (int) ($f->orders_90d ?? 0),
            'spend_90d'         => $spend90,
            'trend'             => $trend,
            'trend_pct'         => $trendPct,
            'distinct_products' => (int) ($f->distinct_products ?? 0),
            'basket_avg'        => $orders > 0 ? round(((int) ($f->line_count ?? 0)) / $orders, 2) : 0,
            'returned_lines'    => (int) ($f->returned_lines ?? 0),
            'outstanding'       => $outstanding,
            'credit_limit'      => $f->credit_limit !== null ? (float) $f->credit_limit : null,
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RULES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @return Collection<int,Signal>
     */
    private function evaluate(
        GrowthContext $ctx,
        object $f,
        array $p,
        float $p80Spend,
        float $p95Spend
    ): Collection {
        $out  = collect();
        $name = $p['party_name'];
        $cur  = $ctx->currency;

        // ── 1. NEW CUSTOMER WHO NEVER CAME BACK ──────────────────────────
        // The single highest-leverage retention moment in retail. Someone who
        // buys twice is dramatically more likely to buy ten times. V1 had no
        // concept of this at all — it required 3 invoices before it would even
        // look at a customer, so brand-new customers were invisible by design.
        if ($p['orders'] === 1 && $p['recency'] !== null) {
            $median = $ctx->tenantMedianGap();
            if ($p['recency'] >= $median && $p['recency'] <= $median * 4) {
                $out->push(new Signal(
                    type: 'customer_first_repeat',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "First-time buyer hasn't returned: {$name}",
                    message: "{$name} bought once, {$p['recency']} days ago, and hasn't been back. "
                        . "Your typical customer reorders within " . round($median) . " days. "
                        . "A second purchase is what turns a one-off into a regular — a short message now is the cheapest retention you will ever do.",
                    potentialRevenue: $p['aov'],
                    confidence: 55,
                    partyId: $p['party_id'],
                    evidence: [
                        'Orders so far'          => 1,
                        'Days since first buy'   => $p['recency'],
                        'Your typical reorder gap' => round($median) . ' days',
                        'First order value'      => $cur . ' ' . number_format($p['revenue']),
                    ],
                    data: $this->actionData($p, "Thank you for shopping with us! We'd love to see you again — reply and we'll set aside your order."),
                    actionUrl: "/parties/{$p['party_id']}",
                ));
            }
        }

        // ── 2. RHYTHM-BASED RETENTION LADDER ─────────────────────────────
        // Only customers with an established, measurable rhythm reach here.
        // The ladder is driven by z — how far past their OWN normal they are.
        if ($p['has_rhythm'] && $p['z'] !== null && $p['orders'] >= 2) {
            $z    = $p['z'];
            $sens = $ctx->sensitivity('customer_overdue');

            // (a) Due within the next few days — the proactive, pre-emptive one.
            //     V1 could never produce this: it had no forward prediction.
            if ($z >= -0.6 * $sens && $z < 0.5 && $p['predicted_next']) {
                $daysAway = (int) round($p['avg_gap'] - $p['recency']);
                $out->push(new Signal(
                    type: 'customer_due_soon',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "Due to reorder: {$name}",
                    message: "{$name} orders roughly every " . round($p['avg_gap']) . " days and last bought {$p['recency']} days ago"
                        . ($daysAway > 0 ? ", so they're due in about {$daysAway} day" . ($daysAway === 1 ? '' : 's') : ", so they're due now")
                        . ". Their usual order is worth " . $cur . " " . number_format($p['aov']) . ". Reach out first and the sale is yours.",
                    potentialRevenue: $p['aov'],
                    confidence: max(40, $p['confidence']),
                    partyId: $p['party_id'],
                    evidence: $this->rhythmEvidence($p, $cur),
                    data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, your usual order is about due — shall I prepare it for you?"),
                    actionUrl: "/parties/{$p['party_id']}",
                    horizonDays: max(7, (int) round($p['avg_gap'] * 0.5)),
                ));
            }

            // (b) Late — past normal but still recoverable.
            elseif ($z >= 0.5 && $z < 2.0 * $sens) {
                $out->push(new Signal(
                    type: 'customer_overdue',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "Running late: {$name}",
                    message: "{$name} normally orders every " . round($p['avg_gap']) . " days (give or take " . round($p['sigma']) . "). "
                        . "It has now been {$p['recency']} days — that is " . round($z, 1) . " standard deviations past their own pattern, not just past an average. "
                        . "They have spent " . $cur . " " . number_format($p['revenue']) . " with you across {$p['orders']} orders.",
                    potentialRevenue: $p['aov'],
                    confidence: max(45, $p['confidence']),
                    partyId: $p['party_id'],
                    evidence: $this->rhythmEvidence($p, $cur),
                    data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, we haven't seen your order this cycle — is everything alright? Happy to book it in."),
                    actionUrl: "/parties/{$p['party_id']}",
                ));
            }

            // (c) Churn risk — far outside their pattern, still worth fighting for.
            elseif ($z >= 2.0 * $sens && $z < 4.0) {
                $out->push(new Signal(
                    type: 'customer_churn_risk',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "About to lose: {$name}",
                    message: "{$name} has missed roughly " . max(1, (int) floor($p['recency'] / max($p['avg_gap'], 1))) . " order cycles. "
                        . "Over their lifetime they have been worth " . $cur . " " . number_format($p['revenue'])
                        . " in sales and " . $cur . " " . number_format($p['margin']) . " in actual profit. "
                        . "Customers this far past their pattern rarely return on their own.",
                    potentialRevenue: $p['aov'] * 2,
                    confidence: max(50, $p['confidence']),
                    partyId: $p['party_id'],
                    evidence: array_merge($this->rhythmEvidence($p, $cur), [
                        'Lifetime profit' => $cur . ' ' . number_format($p['margin']),
                        'Projected annual value' => $cur . ' ' . number_format($p['clv']),
                    ]),
                    data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, we've missed you. Can I offer you something special on your next order?"),
                    actionUrl: "/parties/{$p['party_id']}",
                ));
            }

            // (d) Gone. Reported once, as a win-back campaign candidate — not
            //     nagged about weekly, which is what V1's startOfWeek() check
            //     effectively did.
            elseif ($z >= 4.0 && $p['revenue'] >= $p80Spend && $p['revenue'] > 0) {
                $out->push(new Signal(
                    type: 'customer_churned',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "Lost a good customer: {$name}",
                    message: "{$name} has not ordered in {$p['recency']} days against a normal cycle of " . round($p['avg_gap']) . " days. "
                        . "They were in your top 20% by spend (" . $cur . " " . number_format($p['revenue']) . " lifetime). "
                        . "Worth one deliberate win-back attempt with a real offer attached.",
                    potentialRevenue: $p['aov'] * 3,
                    confidence: 65,
                    partyId: $p['party_id'],
                    evidence: array_merge($this->rhythmEvidence($p, $cur), [
                        'Lifetime profit' => $cur . ' ' . number_format($p['margin']),
                    ]),
                    data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, it's been a long time. We'd really value your business again — here's a special rate for your next order."),
                    actionUrl: "/parties/{$p['party_id']}",
                ));
            }
        }

        // ── 3. QUIET DECLINE ─────────────────────────────────────────────
        // The dangerous one, and completely invisible to V1. This customer is
        // still ordering, so no lateness rule fires — but they have halved
        // their spend. By the time a churn rule notices, they are already gone.
        if ($p['trend'] === 'falling' && $p['orders_90d'] >= 2 && $p['spend_90d'] > 0) {
            $drop = abs($p['trend_pct']);
            if ($drop >= 30 * $ctx->sensitivity('customer_spend_falling')) {
                $lost = max(0, ($p['spend_90d'] / max($p['trend_pct'] + 100, 1) * 100) - $p['spend_90d']);
                $out->push(new Signal(
                    type: 'customer_spend_falling',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "Spending down " . round($drop) . "%: {$name}",
                    message: "{$name} is still buying, which is why nothing else has flagged them — but their spend has fallen "
                        . round($drop) . "% (" . $cur . " " . number_format($p['spend_90d']) . " in the last 90 days versus "
                        . $cur . " " . number_format($p['spend_90d'] + $lost) . " in the 90 before). "
                        . "A quiet decline like this usually means they have started splitting orders with someone else.",
                    potentialRevenue: $lost,
                    confidence: 62,
                    partyId: $p['party_id'],
                    evidence: [
                        'Spend last 90 days'     => $cur . ' ' . number_format($p['spend_90d']),
                        'Spend previous 90 days' => $cur . ' ' . number_format($p['spend_90d'] + $lost),
                        'Change'                 => round($p['trend_pct'], 1) . '%',
                        'Orders last 90 days'    => $p['orders_90d'],
                        'Products they buy'      => $p['distinct_products'],
                    ],
                    data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, I noticed your orders have been lighter recently — is there anything we could be doing better?"),
                    actionUrl: "/parties/{$p['party_id']}",
                ));
            }
        }

        // ── 4. RISING STAR ───────────────────────────────────────────────
        // Positive signals matter. An engine that only ever reports problems
        // gets read as nagging and then gets ignored.
        if ($p['trend'] === 'rising' && $p['trend_pct'] >= 50 && $p['spend_90d'] >= $p80Spend * 0.3 && $p['orders_90d'] >= 2) {
            $out->push(new Signal(
                type: 'customer_rising_star',
                subjectKey: 'party:' . $p['party_id'],
                title: "Growing fast: {$name}",
                message: "{$name} has increased their spend " . round($p['trend_pct']) . "% over the last 90 days ("
                    . $cur . " " . number_format($p['spend_90d']) . " across {$p['orders_90d']} orders). "
                    . "This is the moment to secure them — better terms, priority stock, or a direct line to you.",
                potentialRevenue: $p['spend_90d'],
                confidence: 70,
                partyId: $p['party_id'],
                evidence: [
                    'Spend last 90 days' => $cur . ' ' . number_format($p['spend_90d']),
                    'Growth'             => '+' . round($p['trend_pct']) . '%',
                    'Profit contributed' => $cur . ' ' . number_format($p['margin']),
                    'Different products bought' => $p['distinct_products'],
                ],
                data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, thank you for your growing business — let's talk about better terms for you."),
                actionUrl: "/parties/{$p['party_id']}",
            ));
        }

        // ── 5. VIP CONCENTRATION ─────────────────────────────────────────
        if ($p95Spend > 0 && $p['revenue'] >= $p95Spend && $p['orders'] >= 3) {
            $share = $ctx->totalCustomerRevenue > 0
                ? round($p['revenue'] / $ctx->totalCustomerRevenue * 100, 1)
                : 0;
            if ($share >= 8) {
                $out->push(new Signal(
                    type: 'customer_vip',
                    subjectKey: 'party:' . $p['party_id'],
                    title: "{$name} is {$share}% of your business",
                    message: "{$name} accounts for {$share}% of your total customer revenue (" . $cur . " " . number_format($p['revenue'])
                        . " lifetime, " . $cur . " " . number_format($p['margin']) . " profit). "
                        . "That is real concentration risk: losing them would be felt immediately. Treat this relationship as a named priority, not a routine account.",
                    potentialRevenue: $p['clv'],
                    confidence: 80,
                    partyId: $p['party_id'],
                    evidence: [
                        'Share of your revenue' => $share . '%',
                        'Lifetime spend'        => $cur . ' ' . number_format($p['revenue']),
                        'Lifetime profit'       => $cur . ' ' . number_format($p['margin']),
                        'Orders'                => $p['orders'],
                        'Outstanding balance'   => $cur . ' ' . number_format($p['outstanding']),
                    ],
                    data: $this->actionData($p, null),
                    actionUrl: "/parties/{$p['party_id']}",
                ));
            }
        }

        // ── 6. CREDIT EXPOSURE ───────────────────────────────────────────
        if ($p['credit_limit'] !== null && $p['credit_limit'] > 0 && $p['outstanding'] > $p['credit_limit']) {
            $over = $p['outstanding'] - $p['credit_limit'];
            $out->push(new Signal(
                type: 'customer_credit_risk',
                subjectKey: 'party:' . $p['party_id'],
                title: "Over credit limit: {$name}",
                message: "{$name} owes " . $cur . " " . number_format($p['outstanding'])
                    . " against a credit limit of " . $cur . " " . number_format($p['credit_limit'])
                    . " — that is " . $cur . " " . number_format($over) . " beyond what you agreed to carry. "
                    . "Every further credit sale increases an exposure you have already decided was too big.",
                potentialRevenue: $p['outstanding'],
                confidence: 95,
                partyId: $p['party_id'],
                evidence: [
                    'Outstanding'  => $cur . ' ' . number_format($p['outstanding']),
                    'Credit limit' => $cur . ' ' . number_format($p['credit_limit']),
                    'Over by'      => $cur . ' ' . number_format($over),
                    'Lifetime spend' => $cur . ' ' . number_format($p['revenue']),
                ],
                data: $this->actionData($p, "Assalam-o-alaikum {$this->firstName($name)}, could we settle the outstanding balance before the next delivery?"),
                actionUrl: "/parties/{$p['party_id']}/ledger",
                actionType: 'view_ledger',
            ));
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CROSS-SELL
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Market-basket analysis: which two products keep appearing on the same
     * receipt. Cheap to act on (move a shelf, prompt at the till) and it
     * compounds, which makes it a natural fit for a growth engine.
     */
    private function crossSellSignals(GrowthContext $ctx): Collection
    {
        $out   = collect();
        $pairs = $ctx->data->basketPairs($ctx->tenantId);

        foreach ($pairs->take(4) as $pair) {
            if ((float) $pair->confidence < 35 || (int) $pair->support < 5) {
                continue;
            }

            $out->push(new Signal(
                type: 'cross_sell_opportunity',
                subjectKey: 'pair:' . $pair->product_a . ':' . $pair->product_b,
                title: "Sell together: {$pair->name_a} + {$pair->name_b}",
                message: round($pair->confidence) . "% of the customers who buy \"{$pair->name_a}\" also buy \"{$pair->name_b}\" in the same visit "
                    . "({$pair->support} receipts in the last 90 days). "
                    . "Put them next to each other, or have the counter offer the second one — the customer has already told you they want both.",
                potentialRevenue: 0,
                confidence: min(90, (float) $pair->confidence),
                productId: $pair->product_a,
                evidence: [
                    'Bought together'          => $pair->support . ' times',
                    'Of all sales of ' . $pair->name_a => round($pair->confidence) . '%',
                    'Window'                   => 'Last 90 days',
                ],
                actionUrl: "/products/{$pair->product_a}",
            ));
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Write the profiles to `customer_analytics` in bulk.
     *
     * V1 issued an updateOrCreate per customer — 2,000 customers meant 4,000
     * queries. This is a single chunked upsert.
     */
    private function persistProfiles(GrowthContext $ctx, array $profiles): void
    {
        if (empty($profiles)) {
            return;
        }

        $now  = now();
        $rows = [];

        // RFM scoring needs the tenant's own distribution, so compute the
        // quintile boundaries once, here, rather than per customer.
        $recencies = collect($profiles)->pluck('recency')->filter()->sort()->values();
        $freqs     = collect($profiles)->pluck('orders_90d')->sort()->values();
        $monetary  = collect($profiles)->pluck('spend_90d')->sort()->values();

        foreach ($profiles as $p) {
            // Recency is inverted: recent = good = high score.
            $r = 6 - $this->quintile($recencies, $p['recency'] ?? PHP_INT_MAX);
            $f = $this->quintile($freqs, $p['orders_90d']);
            $m = $this->quintile($monetary, $p['spend_90d']);

            $rows[] = [
                'id'                      => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id'               => $ctx->tenantId,
                'party_id'                => $p['party_id'],
                'total_orders'            => $p['orders'],
                'total_spent'             => $p['revenue'],
                'average_order_value'     => $p['aov'],
                'avg_days_between_orders' => $p['avg_gap'] !== null ? (int) round($p['avg_gap']) : null,
                'last_order_date'         => $p['last_order'],
                'first_order_date'        => $p['first_order'],
                'predicted_next_order'    => $p['predicted_next']?->toDateString(),
                'status'                  => $this->statusFor($p),
                'recency_days'            => $p['recency'],
                'frequency_90d'           => $p['orders_90d'],
                'monetary_90d'            => $p['spend_90d'],
                'rfm_r'                   => $r,
                'rfm_f'                   => $f,
                'rfm_m'                   => $m,
                'segment'                 => $this->segmentFor($r, $f, $m, $p),
                'total_margin'            => $p['margin'],
                'margin_pct'              => $p['margin_pct'],
                'order_interval_stddev'   => $p['sigma'],
                'prediction_confidence'   => $p['confidence'],
                'trend'                   => $p['trend'],
                'trend_pct'               => $p['trend_pct'],
                'distinct_products'       => $p['distinct_products'],
                'basket_size_avg'         => $p['basket_avg'],
                'returns_count'           => $p['returned_lines'],
                'lifetime_days'           => $p['lifetime_days'],
                'predicted_clv'           => $p['clv'],
                'outstanding_balance'     => $p['outstanding'],
                'last_computed_at'        => $now,
                'created_at'              => $now,
                'updated_at'              => $now,
            ];
        }

        foreach (array_chunk($rows, 400) as $chunk) {
            CustomerAnalytics::withoutTenantScope()->upsert(
                $chunk,
                ['party_id'],
                [
                    'tenant_id', 'total_orders', 'total_spent', 'average_order_value',
                    'avg_days_between_orders', 'last_order_date', 'first_order_date',
                    'predicted_next_order', 'status', 'recency_days', 'frequency_90d',
                    'monetary_90d', 'rfm_r', 'rfm_f', 'rfm_m', 'segment', 'total_margin',
                    'margin_pct', 'order_interval_stddev', 'prediction_confidence',
                    'trend', 'trend_pct', 'distinct_products', 'basket_size_avg',
                    'returns_count', 'lifetime_days', 'predicted_clv',
                    'outstanding_balance', 'last_computed_at', 'updated_at',
                ]
            );
        }
    }

    private function statusFor(array $p): string
    {
        if ($p['z'] === null) {
            return $p['recency'] !== null && $p['recency'] > 180 ? 'churned' : 'active';
        }
        if ($p['z'] >= 4.0) return 'churned';
        if ($p['z'] >= 2.0) return 'at_risk';
        return 'active';
    }

    /**
     * Human-readable RFM segment. These names are what the owner sees, so they
     * are deliberately plain rather than marketing jargon.
     */
    private function segmentFor(int $r, int $f, int $m, array $p): string
    {
        if ($p['orders'] === 1)                 return 'new';
        if ($r >= 4 && $f >= 4 && $m >= 4)      return 'champion';
        if ($r >= 4 && $f >= 3)                 return 'loyal';
        if ($r >= 4 && $m >= 4)                 return 'big_spender';
        if ($r >= 3 && $f <= 2)                 return 'promising';
        if ($r <= 2 && $f >= 4)                 return 'at_risk_loyal';
        if ($r <= 2 && $m >= 4)                 return 'at_risk_valuable';
        if ($r <= 1)                            return 'lost';
        return 'needs_attention';
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private function rhythmEvidence(array $p, string $cur): array
    {
        return [
            'Orders'                 => $p['orders'],
            'Normal gap'             => round($p['avg_gap']) . ' days (± ' . round($p['sigma']) . ')',
            'Days since last order'  => $p['recency'],
            'How unusual'            => round($p['z'], 1) . ' standard deviations',
            'Average order'          => $cur . ' ' . number_format($p['aov']),
            'Prediction confidence'  => round($p['confidence']) . '%',
        ];
    }

    private function actionData(array $p, ?string $suggested): array
    {
        return array_filter([
            'party_name'        => $p['party_name'],
            'phone'             => $p['phone'],
            'suggested_message' => $suggested,
            'segment_hint'      => $p['trend'],
            'orders'            => $p['orders'],
            'lifetime_value'    => $p['revenue'],
            'lifetime_profit'   => $p['margin'],
        ], fn ($v) => $v !== null);
    }

    private function firstName(?string $name): string
    {
        return trim(explode(' ', trim((string) $name))[0] ?: 'ji');
    }

    private function percentile(Collection $sorted, float $p): float
    {
        if ($sorted->isEmpty()) return 0.0;
        $idx = (int) floor(($sorted->count() - 1) * $p);
        return (float) $sorted[$idx];
    }

    /** 1..5, where 5 is the top bucket. */
    private function quintile(Collection $sorted, float|int|null $value): int
    {
        if ($sorted->isEmpty() || $value === null) return 1;
        $below = $sorted->filter(fn ($v) => (float) $v < (float) $value)->count();
        $pct   = $below / max(1, $sorted->count());
        return max(1, min(5, (int) ceil($pct * 5) ?: 1));
    }
}
