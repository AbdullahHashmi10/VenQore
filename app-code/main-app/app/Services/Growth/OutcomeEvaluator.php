<?php

namespace App\Services\Growth;

use App\Models\AiRecommendation;
use App\Models\GrowthSignalEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * OutcomeEvaluator — did the engine actually tell the truth?
 * ────────────────────────────────────────────────────────────────────────────
 *
 * This class is the reason the Growth Engine can improve rather than merely
 * run. V1 never asked whether any of its predictions came true, so it could
 * not get better, and — just as importantly — it could never tell the owner
 * how much to trust it.
 *
 * ## What gets graded
 *
 * Only PREDICTIONS (`gradeable => true` in InsightCatalog). Observations like
 * "this is dead stock" are facts, not forecasts; grading them would inflate
 * the accuracy figure into meaninglessness.
 *
 * ## The three-way verdict
 *
 *   HIT     — the prediction was borne out, OR the owner acted and the
 *             predicted bad outcome was avoided.
 *   MISS    — the horizon passed and the predicted event did not happen,
 *             with no intervention that could explain it.
 *   UNCLEAR — we genuinely cannot tell. Excluded from precision entirely.
 *
 * That third verdict is essential to intellectual honesty. The most common
 * ambiguity is intervention: the engine warns a customer will churn, the owner
 * messages them, they return. Did the prediction fail, or did it succeed by
 * being acted on? Treating that as a MISS would punish the engine precisely
 * when it did its job. Treating it as a HIT would let it claim credit for any
 * outcome at all. We record it as a hit ONLY when the owner explicitly marked
 * the signal as acted upon — and otherwise as unclear.
 */
class OutcomeEvaluator
{
    public function __construct(
        private readonly GrowthDataSource $data,
        private readonly ThresholdTuner $tuner
    ) {
    }

    /**
     * Grade every prediction whose horizon has elapsed.
     *
     * @return array{graded:int,hits:int,misses:int,unclear:int}
     */
    public function evaluate(int|string $tenantId, int $limit = 500): array
    {
        $due = AiRecommendation::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->where('outcome', 'pending')
            ->whereNotNull('outcome_due_at')
            ->where('outcome_due_at', '<=', now())
            ->whereIn('type', InsightCatalog::gradeableTypes())
            ->orderBy('outcome_due_at')
            ->limit($limit)
            ->get();

        $hits = $misses = $unclear = 0;

        foreach ($due as $rec) {
            try {
                [$verdict, $value, $note] = $this->grade($tenantId, $rec);
            } catch (\Throwable $e) {
                Log::warning("[GrowthEngine] Grading failed for {$rec->id}: " . $e->getMessage());
                continue;
            }

            $rec->forceFill([
                'outcome'            => $verdict,
                'outcome_value'      => round(max(0, $value), 4),
                'outcome_note'       => $note,
                'outcome_checked_at' => now(),
            ])->save();

            if ($verdict === 'hit') {
                $hits++;
                $this->tuner->bumpCounter($tenantId, $rec->type, 'hit_count');
                $this->tuner->addRealisedValue($tenantId, $rec->type, $value);
                GrowthSignalEvent::record($tenantId, GrowthSignalEvent::OUTCOME_HIT, $rec->id, $rec->type, $value, ['note' => $note]);
            } elseif ($verdict === 'miss') {
                $misses++;
                $this->tuner->bumpCounter($tenantId, $rec->type, 'miss_count');
                GrowthSignalEvent::record($tenantId, GrowthSignalEvent::OUTCOME_MISS, $rec->id, $rec->type, 0, ['note' => $note]);
            } else {
                $unclear++;
            }
        }

        return [
            'graded'  => $due->count(),
            'hits'    => $hits,
            'misses'  => $misses,
            'unclear' => $unclear,
        ];
    }

    /**
     * @return array{0:string,1:float,2:string}  [verdict, realised value, note]
     */
    private function grade(int|string $tenantId, AiRecommendation $rec): array
    {
        $since = $rec->first_seen_at ?? $rec->created_at;
        $since = $since instanceof Carbon ? $since : Carbon::parse($since);

        return match ($rec->type) {

            // ═══════════ CUSTOMER PREDICTIONS ═══════════
            // "This customer is due / late / at risk / gone."
            // TRUE if they did NOT come back on their own within the horizon.
            // If they came back AFTER the owner acted, that is a save — the
            // warning was correct and the intervention worked.
            'customer_due_soon',
            'customer_overdue',
            'customer_churn_risk',
            'customer_churned',
            'customer_first_repeat' => $this->gradeCustomerReturn($tenantId, $rec, $since),

            // "Their spending is falling."
            // TRUE if the decline continued into the horizon window.
            'customer_spend_falling' => $this->gradeSpendDecline($tenantId, $rec, $since),

            // ═══════════ INVENTORY PREDICTIONS ═══════════
            // "This will run out."
            // TRUE if it actually hit zero while still selling. If the owner
            // reordered, the prediction was right and was prevented.
            'stockout_imminent',
            'reorder_point_breached' => $this->gradeStockout($tenantId, $rec, $since),

            // "Demand is accelerating."
            // TRUE if the elevated rate held up.
            'demand_surge' => $this->gradeDemandSurge($tenantId, $rec, $since),

            // ═══════════ PROFIT PREDICTIONS ═══════════
            'margin_erosion',
            'margin_mix_shift',
            'discount_leakage',
            'price_increase_opportunity' => $this->gradeByAction($rec),

            // ═══════════ CASH PREDICTIONS ═══════════
            // "This money is at risk."
            // TRUE if it was still unpaid at the horizon. Collected after the
            // owner chased ⇒ the warning worked; that is the outcome we want.
            'receivable_overdue' => $this->gradeReceivable($tenantId, $rec, $since),

            'cash_conversion_slowing',
            'revenue_anomaly_drop' => $this->gradeByAction($rec),

            default => ['unclear', 0.0, 'No grading rule for this insight type'],
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  GRADERS
    // ═══════════════════════════════════════════════════════════════════════

    private function gradeCustomerReturn(int|string $tenantId, AiRecommendation $rec, Carbon $since): array
    {
        if (!$rec->party_id) {
            return ['unclear', 0.0, 'No customer attached'];
        }

        $returned = $this->data->partyOrderedSince($tenantId, $rec->party_id, $since);

        // The owner acted AND the customer came back ⇒ a save. The warning was
        // correct and it produced revenue. This is the engine working exactly
        // as intended, so it counts as a hit and the order value is the
        // realised benefit.
        if ($rec->acted_at && $returned) {
            $orderedAfterAction = Carbon::parse($returned->first_at)->gte($rec->acted_at);
            if ($orderedAfterAction) {
                return [
                    'hit',
                    (float) $returned->value,
                    'Customer returned after you contacted them — ' . $returned->orders . ' order(s) worth recovered',
                ];
            }
        }

        // No intervention, and they came back by themselves ⇒ the warning was
        // premature. An honest miss.
        if (!$rec->acted_at && $returned) {
            return ['miss', 0.0, 'Customer returned on their own without any action'];
        }

        // Still gone at the horizon ⇒ the warning was right.
        if (!$returned) {
            return [
                'hit',
                0.0,
                $rec->acted_at
                    ? 'Customer still has not returned despite outreach'
                    : 'Customer has not returned, as predicted',
            ];
        }

        return ['unclear', 0.0, 'Mixed evidence'];
    }

    private function gradeSpendDecline(int|string $tenantId, AiRecommendation $rec, Carbon $since): array
    {
        if (!$rec->party_id) {
            return ['unclear', 0.0, 'No customer attached'];
        }

        $recent = $this->data->partyOrderedSince($tenantId, $rec->party_id, $since);
        $ev     = $rec->evidence ?? [];

        // Prior 90-day spend, captured on the evidence at generation time.
        $priorSpend = (float) preg_replace('/[^0-9.]/', '', (string) ($ev['Spend last 90 days'] ?? '0'));
        $days       = max(1, $since->diffInDays(now()));
        $priorRate  = $priorSpend / 90;
        $actualRate = $recent ? ((float) $recent->value / $days) : 0.0;

        if ($priorRate <= 0) {
            return ['unclear', 0.0, 'No comparable baseline'];
        }

        // Decline continued or deepened ⇒ correct call.
        if ($actualRate < $priorRate * 0.9) {
            return ['hit', 0.0, 'Spending continued to fall as predicted'];
        }

        if ($rec->acted_at && $actualRate >= $priorRate) {
            return ['hit', (float) ($recent->value ?? 0), 'Spending recovered after you intervened'];
        }

        return ['miss', 0.0, 'Spending recovered on its own'];
    }

    private function gradeStockout(int|string $tenantId, AiRecommendation $rec, Carbon $since): array
    {
        if (!$rec->product_id) {
            return ['unclear', 0.0, 'No product attached'];
        }

        $stockedOut = $this->data->productStockedOutSince($tenantId, $rec->product_id, $since);

        if ($stockedOut) {
            return ['hit', 0.0, 'The product did run out, as predicted'];
        }

        // Reordered after the warning ⇒ the stockout was prevented, not
        // mispredicted. The potential revenue is what was protected.
        if ($rec->acted_at) {
            return [
                'hit',
                (float) $rec->potential_revenue,
                'You restocked in time — the stockout was avoided',
            ];
        }

        // Never acted on, never ran out: either demand fell away or the
        // forecast was too aggressive. Either way, own it as a miss.
        return ['miss', 0.0, 'Stock held out — the forecast was too aggressive'];
    }

    private function gradeDemandSurge(int|string $tenantId, AiRecommendation $rec, Carbon $since): array
    {
        if (!$rec->product_id) {
            return ['unclear', 0.0, 'No product attached'];
        }

        $pa = \App\Models\ProductAnalytics::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->where('product_id', $rec->product_id)
            ->first();

        if (!$pa) {
            return ['unclear', 0.0, 'No current product data'];
        }

        $ev       = $rec->evidence ?? [];
        $baseline = (float) preg_replace('/[^0-9.]/', '', (string) ($ev['Last 30 days'] ?? '0'));

        if ($baseline <= 0) {
            return ['unclear', 0.0, 'No baseline captured'];
        }

        // Did the elevated rate persist into the 30-day window?
        if ((float) $pa->velocity_30d >= $baseline * 1.2) {
            return ['hit', (float) $rec->potential_revenue, 'The higher demand held up'];
        }

        return ['miss', 0.0, 'Demand fell back to its previous level'];
    }

    private function gradeReceivable(int|string $tenantId, AiRecommendation $rec, Carbon $since): array
    {
        if (!$rec->party_id) {
            return ['unclear', 0.0, 'No customer attached'];
        }

        $collected = $this->data->collectedFromPartySince($tenantId, $rec->party_id, $since);
        $flagged   = (float) $rec->potential_revenue;

        if ($flagged <= 0) {
            return ['unclear', 0.0, 'No amount recorded'];
        }

        // Chased and paid ⇒ the alert did its job. Realised value is real cash.
        if ($rec->acted_at && $collected > 0) {
            return [
                'hit',
                min($collected, $flagged),
                'Collected ' . number_format($collected) . ' after you chased it',
            ];
        }

        // Paid without any prompting ⇒ the alert was unnecessary noise.
        if (!$rec->acted_at && $collected >= $flagged * 0.9) {
            return ['miss', 0.0, 'They paid on their own without a reminder'];
        }

        // Still outstanding ⇒ flagging it was correct.
        if ($collected < $flagged * 0.5) {
            return ['hit', 0.0, 'The balance is still outstanding, as flagged'];
        }

        return ['unclear', $collected, 'Partially collected'];
    }

    /**
     * Fallback grader for tenant-level trends where no single object can be
     * checked (mix shift, discount leakage, anomaly drops).
     *
     * We grade only on whether the owner engaged. Anything else would be
     * inventing a verdict, and a fabricated accuracy number is worse than no
     * number at all.
     */
    private function gradeByAction(AiRecommendation $rec): array
    {
        if ($rec->acted_at) {
            return ['hit', (float) $rec->potential_revenue * 0.25, 'You acted on this insight'];
        }
        if ($rec->status === 'dismissed') {
            return ['miss', 0.0, 'Dismissed as not useful'];
        }
        return ['unclear', 0.0, 'Trend insight — no objective outcome to verify'];
    }
}
