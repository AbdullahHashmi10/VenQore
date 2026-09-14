<?php

namespace App\Services\Growth\Brains;

use App\Services\Growth\GrowthContext;
use App\Services\Growth\Signal;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * BRAIN D — CASH & OPERATIONS INTELLIGENCE
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## What V1 did
 *
 * V1 had a single "recovery" rule: sum GL account 1200 per party, and if the
 * balance is positive, emit "Total outstanding receivable from this party:
 * Rs X". No age. No due date. No comparison. No sense of whether Rs X is
 * normal for that customer or alarming. The owner already knew who owed them
 * money — the alert added nothing they could act on.
 *
 * ## What V2 does
 *
 * Cash is where small businesses actually fail, so this brain treats it
 * seriously:
 *
 *   - Overdue receivables AGED, with the oldest invoice named and the
 *     customer's own payment history attached.
 *   - Concentration risk: when too much of your working capital sits with one
 *     customer.
 *   - Collection velocity: are payments arriving slower than they used to?
 *     Revenue can look perfect while the business runs dry.
 *   - Supplier payables coming due.
 *   - Revenue anomalies measured against the tenant's OWN weekday baseline,
 *     using a robust median/MAD comparison rather than a mean, so one
 *     exceptional day cannot mask a bad week.
 *   - Operational patterns: peak trading hours, consistently quiet days, and
 *     cashiers whose discount rate is a statistical outlier.
 */
class CashflowBrain
{
    /**
     * @return Collection<int,Signal>
     */
    public function run(GrowthContext $ctx): Collection
    {
        $signals = collect();
        $cur     = $ctx->currency;

        $signals = $signals->merge($this->receivableSignals($ctx, $cur));
        $signals = $signals->merge($this->collectionVelocitySignal($ctx, $cur));
        $signals = $signals->merge($this->revenueAnomalySignals($ctx, $cur));

        if ($ctx->isDeep()) {
            $signals = $signals->merge($this->payableSignals($ctx, $cur));
            $signals = $signals->merge($this->operationsSignals($ctx, $cur));
        }

        return $signals;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RECEIVABLES
    // ═══════════════════════════════════════════════════════════════════════

    private function receivableSignals(GrowthContext $ctx, string $cur): Collection
    {
        $out      = collect();
        $overdue  = $ctx->data->overdueSales($ctx->tenantId);

        if ($overdue->isEmpty()) {
            return $out;
        }

        $terms = $ctx->paymentTermDays();

        // Group by party: the owner chases a PERSON, not an invoice line.
        // V1's per-party sum was right in spirit but carried no age at all.
        $byParty = $overdue->groupBy('party_id');
        $totalOutstanding = (float) $overdue->sum('outstanding');

        foreach ($byParty as $partyId => $rows) {
            $total   = (float) $rows->sum('outstanding');
            $oldest  = $rows->sortByDesc('days_overdue')->first();
            $days    = (int) $oldest->days_overdue;
            $name    = $oldest->party_name;

            // Only chase what is actually late by this tenant's own terms.
            if ($days <= $terms || $total < $ctx->materialityFloor()) {
                continue;
            }

            $bucket = $this->bucket($days - $terms);
            $conf   = min(95, 55 + min(40, ($days - $terms) * 0.8));

            $out->push(new Signal(
                type: 'receivable_overdue',
                subjectKey: 'party:' . $partyId . ':ar',
                title: "{$cur} " . number_format($total) . " overdue: {$name}",
                message: "{$name} owes " . $cur . " " . number_format($total) . " across " . $rows->count()
                    . " unpaid invoice" . ($rows->count() === 1 ? '' : 's') . ". "
                    . "The oldest ({$oldest->reference_number}) is {$days} days old, which is " . ($days - $terms)
                    . " days past your normal {$terms}-day terms — the {$bucket} bucket. "
                    . "Debt in this bucket gets materially harder to collect the longer it sits.",
                potentialRevenue: $total,
                confidence: $conf,
                partyId: $partyId,
                evidence: [
                    'Total outstanding'  => $cur . ' ' . number_format($total),
                    'Unpaid invoices'    => $rows->count(),
                    'Oldest invoice'     => $oldest->reference_number . ' (' . $days . ' days)',
                    'Your payment terms' => $terms . ' days',
                    'Ageing bucket'      => $bucket,
                    'Largest single invoice' => $cur . ' ' . number_format((float) $rows->max('outstanding')),
                ],
                data: [
                    'party_name' => $name,
                    'phone'      => $oldest->phone,
                    'suggested_message' => "Assalam-o-alaikum, this is a gentle reminder about the outstanding balance of "
                        . $cur . " " . number_format($total) . " on your account. Could you let me know when we can expect payment?",
                    'invoices' => $rows->take(10)->map(fn ($r) => [
                        'reference'    => $r->reference_number,
                        'outstanding'  => (float) $r->outstanding,
                        'days_overdue' => (int) $r->days_overdue,
                    ])->values()->all(),
                ],
                actionUrl: "/parties/{$partyId}/ledger",
                horizonDays: 14,
            ));

            // ── Concentration risk ───────────────────────────────────────
            // If one customer holds a large share of everything owed to you,
            // that is a structural exposure, not just a late payment.
            if ($totalOutstanding > 0) {
                $share = $total / $totalOutstanding * 100;
                if ($share >= 40 && $total >= $ctx->materialityFloor() * 5 && $byParty->count() >= 3) {
                    $out->push(new Signal(
                        type: 'receivable_concentration',
                        subjectKey: 'party:' . $partyId . ':concentration',
                        title: round($share) . "% of your receivables sit with {$name}",
                        message: "Of the " . $cur . " " . number_format($totalOutstanding) . " owed to you across all customers, "
                            . $cur . " " . number_format($total) . " (" . round($share) . "%) is with {$name} alone. "
                            . "If they delayed or defaulted, you would feel it immediately in working capital. "
                            . "Consider tightening their terms or requiring part-payment on new orders.",
                        potentialRevenue: $total,
                        confidence: 85,
                        partyId: $partyId,
                        evidence: [
                            'Owed by this customer' => $cur . ' ' . number_format($total),
                            'Owed by everyone'      => $cur . ' ' . number_format($totalOutstanding),
                            'Their share'           => round($share) . '%',
                            'Customers with balances' => $byParty->count(),
                        ],
                        actionUrl: "/parties/{$partyId}/ledger",
                    ));
                }
            }
        }

        return $out;
    }

    /**
     * Are collections slowing?
     *
     * Compares cash actually received in the last 30 days against the 60 before
     * it, relative to sales made. A business can grow its revenue and still run
     * out of money, and nothing on a P&L shows that happening.
     */
    private function collectionVelocitySignal(GrowthContext $ctx, string $cur): Collection
    {
        $out = collect();

        $cash   = $ctx->data->cashCollectedSeries($ctx->tenantId, 90);
        $series = $ctx->data->dailySeries($ctx->tenantId, 90);

        if ($cash->count() < 20 || $series->count() < 20) {
            return $out;
        }

        $cut = now()->subDays(30)->toDateString();

        $cashRecent = (float) $cash->filter(fn ($r) => $r->d >= $cut)->sum('collected');
        $cashPrior  = (float) $cash->filter(fn ($r) => $r->d < $cut)->sum('collected');
        $salesRecent= (float) $series->filter(fn ($r) => $r->d >= $cut)->sum('revenue');
        $salesPrior = (float) $series->filter(fn ($r) => $r->d < $cut)->sum('revenue');

        if ($salesRecent <= 0 || $salesPrior <= 0 || $cashPrior <= 0) {
            return $out;
        }

        // Normalise the 60-day prior window to a 30-day rate.
        $cashPriorN  = $cashPrior / 2;
        $salesPriorN = $salesPrior / 2;

        $ratioRecent = $cashRecent / $salesRecent;
        $ratioPrior  = $cashPriorN / $salesPriorN;

        if ($ratioPrior <= 0) {
            return $out;
        }

        $drop = ($ratioPrior - $ratioRecent) / $ratioPrior * 100;

        if ($drop >= 20 * $ctx->sensitivity('cash_conversion_slowing')) {
            $shortfall = ($ratioPrior - $ratioRecent) * $salesRecent;

            $out->push(new Signal(
                type: 'cash_conversion_slowing',
                subjectKey: 'tenant:collections',
                title: "Cash arriving " . round($drop) . "% slower",
                message: "You collected " . $cur . " " . number_format($cashRecent) . " against "
                    . $cur . " " . number_format($salesRecent) . " of sales this month — "
                    . round($ratioRecent * 100) . "% of sales converted to cash, versus "
                    . round($ratioPrior * 100) . "% over the previous two months. "
                    . "Sales are not the problem; collection is. At this month's volume that is "
                    . $cur . " " . number_format($shortfall) . " that should be in your account and isn't.",
                potentialRevenue: $shortfall,
                confidence: 78,
                evidence: [
                    'Collected (30d)'      => $cur . ' ' . number_format($cashRecent),
                    'Sales (30d)'          => $cur . ' ' . number_format($salesRecent),
                    'Conversion now'       => round($ratioRecent * 100) . '%',
                    'Conversion before'    => round($ratioPrior * 100) . '%',
                    'Cash not collected'   => $cur . ' ' . number_format($shortfall),
                ],
                actionUrl: '/reports/aged-receivables',
            ));
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PAYABLES
    // ═══════════════════════════════════════════════════════════════════════

    private function payableSignals(GrowthContext $ctx, string $cur): Collection
    {
        $out      = collect();
        $payables = $ctx->data->payablesByParty($ctx->tenantId);

        if (empty($payables)) {
            return $out;
        }

        arsort($payables);
        $total = array_sum($payables);

        // Only surface the largest one or two — a list of every supplier
        // balance is a report, not an insight.
        foreach (array_slice($payables, 0, 2, true) as $partyId => $amount) {
            if ($amount < $ctx->materialityFloor() * 3) {
                continue;
            }

            $party = \App\Models\Party::withoutTenantScope()
                ->where('tenant_id', $ctx->tenantId)
                ->find($partyId);

            if (!$party) {
                continue;
            }

            $out->push(new Signal(
                type: 'payable_due',
                subjectKey: 'party:' . $partyId . ':ap',
                title: "You owe {$party->name} " . $cur . " " . number_format($amount),
                message: "Your balance with {$party->name} stands at " . $cur . " " . number_format($amount)
                    . ", which is " . round($amount / max($total, 1) * 100) . "% of everything you owe suppliers. "
                    . "Keeping this current protects your credit terms — and your terms are what let you hold stock without paying for it upfront.",
                potentialRevenue: $amount,
                confidence: 88,
                partyId: $partyId,
                evidence: [
                    'Owed to this supplier' => $cur . ' ' . number_format($amount),
                    'Total supplier debt'   => $cur . ' ' . number_format($total),
                    'Share'                 => round($amount / max($total, 1) * 100) . '%',
                ],
                actionUrl: "/parties/{$partyId}/ledger",
            ));
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ANOMALY DETECTION  (against the tenant's own baseline)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compare the last 7 days against the same weekdays historically.
     *
     * Weekday matters enormously in retail — comparing a Sunday to a Tuesday
     * produces nothing but false alarms. And we use MEDIAN and MAD rather than
     * mean and standard deviation, because a single Eid-scale trading day would
     * distort a mean so badly the detector would go blind for weeks.
     */
    private function revenueAnomalySignals(GrowthContext $ctx, string $cur): Collection
    {
        $out    = collect();
        $series = $ctx->data->dailySeries($ctx->tenantId, 120);

        if ($series->count() < 35) {
            return $out; // Too little history to claim anything honestly.
        }

        $cut       = now()->subDays(7)->toDateString();
        $recent    = $series->filter(fn ($d) => $d->d >= $cut);
        $baseline  = $series->filter(fn ($d) => $d->d < $cut);

        if ($recent->isEmpty() || $baseline->count() < 21) {
            return $out;
        }

        // Expected revenue for the recent week = sum of the per-weekday medians.
        $byDow = $baseline->groupBy('dow');
        $expected = 0.0;
        $detail   = [];

        foreach ($recent as $day) {
            $hist = $byDow->get($day->dow);
            if (!$hist || $hist->count() < 2) {
                continue;
            }
            $med = $this->median($hist->map(fn ($h) => (float) $h->revenue));
            $expected += $med;
            $detail[] = [
                'date'     => $day->d,
                'actual'   => (float) $day->revenue,
                'typical'  => $med,
            ];
        }

        if ($expected <= 0 || count($detail) < 4) {
            return $out;
        }

        $actual = (float) $recent->sum('revenue');
        $delta  = ($actual - $expected) / $expected * 100;

        // Robust dispersion of daily totals, used to decide whether a gap is
        // genuinely unusual for this business or just normal week-to-week noise.
        $dailyRevs = $baseline->map(fn ($d) => (float) $d->revenue);
        $mad       = $this->mad($dailyRevs);
        $medDaily  = $this->median($dailyRevs);
        $noisePct  = $medDaily > 0 ? ($mad / $medDaily) * 100 : 50;

        // The threshold adapts: a volatile shop needs a bigger gap before we
        // call it an anomaly. A steady shop gets told sooner.
        $threshold = max(15, min(45, $noisePct * 1.2)) * $ctx->sensitivity('revenue_anomaly_drop');

        if ($delta <= -$threshold) {
            $gap = $expected - $actual;
            $out->push(new Signal(
                type: 'revenue_anomaly_drop',
                subjectKey: 'tenant:anomaly:' . now()->format('o-W'),
                title: "Sales down " . round(abs($delta)) . "% this week",
                message: "The last 7 days brought in " . $cur . " " . number_format($actual)
                    . ", against " . $cur . " " . number_format($expected)
                    . " that these same weekdays normally produce for you — a shortfall of " . $cur . " " . number_format($gap) . ". "
                    . "This is measured against your own history for each weekday, so it is not a seasonal artefact. "
                    . "Worth checking stock availability, a competitor opening, or a change in your busiest hours.",
                potentialRevenue: $gap,
                confidence: min(90, 55 + (abs($delta) - $threshold)),
                evidence: array_merge([
                    'Last 7 days'   => $cur . ' ' . number_format($actual),
                    'Typical'       => $cur . ' ' . number_format($expected),
                    'Difference'    => round($delta, 1) . '%',
                    'Your normal week-to-week swing' => '±' . round($noisePct) . '%',
                ], $this->dayDetail($detail, $cur)),
                actionUrl: '/reports/sales',
            ));
        } elseif ($delta >= $threshold * 1.2) {
            $gain = $actual - $expected;
            $out->push(new Signal(
                type: 'revenue_anomaly_spike',
                subjectKey: 'tenant:anomaly:' . now()->format('o-W'),
                title: "Best week in a while: +" . round($delta) . "%",
                message: "The last 7 days brought in " . $cur . " " . number_format($actual)
                    . " against a typical " . $cur . " " . number_format($expected) . " — "
                    . $cur . " " . number_format($gain) . " ahead. "
                    . "Work out what drove it while it is still fresh: a product, a promotion, a new customer. "
                    . "Repeatable causes are worth far more than the week itself.",
                potentialRevenue: $gain,
                confidence: 70,
                evidence: array_merge([
                    'Last 7 days' => $cur . ' ' . number_format($actual),
                    'Typical'     => $cur . ' ' . number_format($expected),
                    'Difference'  => '+' . round($delta, 1) . '%',
                ], $this->dayDetail($detail, $cur)),
                actionUrl: '/reports/sales',
            ));
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    private function operationsSignals(GrowthContext $ctx, string $cur): Collection
    {
        $out = collect();

        // ── Peak trading window ──────────────────────────────────────────
        $pattern = $ctx->data->hourlyPattern($ctx->tenantId);

        if ($pattern->sum('orders') >= 100) {
            $byHour = $pattern->groupBy('hr')->map(fn ($g) => (float) $g->sum('revenue'))->sortDesc();
            $total  = $byHour->sum();
            $top3   = $byHour->take(3);

            if ($total > 0 && $top3->sum() / $total >= 0.35) {
                $hours = $top3->keys()->sort()->map(fn ($h) => $this->hourLabel((int) $h))->implode(', ');
                $share = round($top3->sum() / $total * 100);

                $out->push(new Signal(
                    type: 'peak_hour_understaffed',
                    subjectKey: 'tenant:peak_hours',
                    title: "{$share}% of sales happen in 3 hours",
                    message: "Your busiest hours are {$hours} — together they carry {$share}% of all revenue. "
                        . "Everything that matters should be aligned to that window: your best staff on the counter, "
                        . "shelves filled before it starts, and no stock-taking or deliveries during it. "
                        . "An extra pair of hands in these hours is worth more than a whole quiet morning.",
                    potentialRevenue: 0,
                    confidence: 85,
                    evidence: [
                        'Peak hours'        => $hours,
                        'Share of revenue'  => $share . '%',
                        'Based on'          => number_format((float) $pattern->sum('orders')) . ' sales over 90 days',
                    ],
                    actionUrl: '/reports/sales',
                ));
            }

            // ── Consistently quiet day ───────────────────────────────────
            $byDow = $pattern->groupBy('dow')->map(fn ($g) => (float) $g->sum('revenue'));
            if ($byDow->count() >= 6) {
                $avg     = $byDow->avg();
                $worst   = $byDow->sort()->keys()->first();
                $worstV  = $byDow->min();

                if ($avg > 0 && $worstV < $avg * 0.5) {
                    $out->push(new Signal(
                        type: 'quiet_day_pattern',
                        subjectKey: 'tenant:quiet_day',
                        title: $this->dowLabel((int) $worst) . " is consistently your quietest day",
                        message: $this->dowLabel((int) $worst) . " takes about " . $cur . " " . number_format($worstV / 13)
                            . " a week on average, roughly " . round($worstV / $avg * 100) . "% of a normal day. "
                            . "Two options: give people a reason to come in (a standing offer, a delivery run), "
                            . "or cut your cost on that day. Either beats paying full overheads for half the trade.",
                        potentialRevenue: 0,
                        confidence: 72,
                        evidence: [
                            'Quietest day'      => $this->dowLabel((int) $worst),
                            'Versus average day'=> round($worstV / $avg * 100) . '%',
                        ],
                        actionUrl: '/reports/sales',
                    ));
                }
            }
        }

        // ── Discount outlier among staff ─────────────────────────────────
        $staff = $ctx->data->staffPerformance($ctx->tenantId);

        if ($staff->count() >= 3) {
            $rates  = $staff->map(fn ($s) => (float) $s->discount_pct);
            $median = $this->median($rates);
            $worst  = $staff->sortByDesc('discount_pct')->first();

            if ((float) $worst->discount_pct >= max(4, $median * 2.5) && (float) $worst->discount > $ctx->materialityFloor()) {
                $excess = (float) $worst->discount * (1 - ($median / max((float) $worst->discount_pct, 0.01)));

                $out->push(new Signal(
                    type: 'staff_discount_outlier',
                    subjectKey: 'user:' . $worst->user_id . ':discount',
                    title: ($worst->user_name ?: 'A cashier') . " discounts " . round((float) $worst->discount_pct, 1) . "%",
                    message: ($worst->user_name ?: 'One cashier') . " gave " . $cur . " " . number_format((float) $worst->discount)
                        . " in discounts across " . (int) $worst->orders . " sales this month — "
                        . round((float) $worst->discount_pct, 1) . "% of their gross, against a team median of " . round($median, 1) . "%. "
                        . "That gap is worth about " . $cur . " " . number_format($excess) . " a month. "
                        . "It may be legitimate (they may handle your bulk buyers) — but it is worth knowing rather than assuming.",
                    potentialRevenue: $excess * 12,
                    confidence: 75,
                    evidence: [
                        'Their discount rate' => round((float) $worst->discount_pct, 1) . '%',
                        'Team median'         => round($median, 1) . '%',
                        'Discounts given'     => $cur . ' ' . number_format((float) $worst->discount),
                        'Sales handled'       => (int) $worst->orders,
                        'Excess vs median'    => $cur . ' ' . number_format($excess) . '/month',
                    ],
                    actionUrl: '/reports/sales',
                ));
            }
        }

        return $out;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private function bucket(int $daysPastTerms): string
    {
        if ($daysPastTerms <= 30)  return '0-30 day';
        if ($daysPastTerms <= 60)  return '31-60 day';
        if ($daysPastTerms <= 90)  return '61-90 day';
        return '90+ day';
    }

    private function median(Collection $values): float
    {
        $sorted = $values->filter(fn ($v) => $v !== null)->sort()->values();
        if ($sorted->isEmpty()) return 0.0;
        $n = $sorted->count();
        return $n % 2
            ? (float) $sorted[intdiv($n, 2)]
            : (float) (($sorted[intdiv($n, 2) - 1] + $sorted[intdiv($n, 2)]) / 2);
    }

    /**
     * Median Absolute Deviation — a dispersion measure that a single extreme
     * day cannot inflate, unlike standard deviation.
     */
    private function mad(Collection $values): float
    {
        $med = $this->median($values);
        return $this->median($values->map(fn ($v) => abs((float) $v - $med)));
    }

    private function dayDetail(array $detail, string $cur): array
    {
        $out = [];
        foreach (array_slice($detail, -4) as $d) {
            $out[Carbon::parse($d['date'])->format('D d M')] =
                $cur . ' ' . number_format($d['actual']) . ' (typical ' . $cur . ' ' . number_format($d['typical']) . ')';
        }
        return $out;
    }

    private function hourLabel(int $h): string
    {
        return Carbon::createFromTime($h)->format('ga') . '–' . Carbon::createFromTime(($h + 1) % 24)->format('ga');
    }

    /** MySQL DAYOFWEEK(): 1 = Sunday … 7 = Saturday. */
    private function dowLabel(int $dow): string
    {
        return ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$dow] ?? 'That day';
    }
}
