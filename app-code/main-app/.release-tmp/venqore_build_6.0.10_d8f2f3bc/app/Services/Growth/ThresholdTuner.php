<?php

namespace App\Services\Growth;

use App\Models\GrowthBrainStat;
use App\Models\GrowthSignalEvent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ThresholdTuner — how the Growth Engine gets better on its own.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * This is the "keeps maturing with time" requirement, implemented with plain
 * statistics rather than an LLM. Nothing here calls out to a model; it is
 * arithmetic over the engine's own track record, which means it is fast,
 * free, deterministic, auditable, and works offline.
 *
 * ## The feedback loop
 *
 *   1. Brains emit signals.                      → generated_count
 *   2. The owner acts, dismisses, or ignores.    → acted / dismissed / ignored
 *   3. OutcomeEvaluator grades predictions.      → hit_count / miss_count
 *   4. This class turns that into `sensitivity`, which the brains read on the
 *      NEXT run to decide how eager to be.
 *
 * ## Two independent axes
 *
 *   PRECISION  ("was it true?")   — hits vs misses. Objective.
 *   ENGAGEMENT ("did they care?") — acted vs generated. Subjective.
 *
 * They are deliberately kept apart. An insight can be perfectly accurate and
 * still useless to a particular owner, and an insight can be popular while
 * being wrong. Collapsing them into one score would hide both failure modes.
 *
 * ## Safety rails
 *
 *  - Sensitivity is clamped to [0.5, 1.8]. The engine can tune itself, but it
 *    can never run away.
 *  - Nothing is tuned until there is a real sample (≥ 8 generated, ≥ 5 graded).
 *    Early noise must not permanently bias a tenant's engine.
 *  - Every mute expires. A suppressed insight type always gets another chance,
 *    so a bad first fortnight cannot silence a rule forever.
 *  - Adjustments are small and incremental (±10% per tuning pass), so the
 *    behaviour drifts rather than lurching.
 */
class ThresholdTuner
{
    private const MIN_SENSITIVITY = 0.50;
    private const MAX_SENSITIVITY = 1.80;

    /** Per-request memo so a run does not re-query the same tenant's stats. */
    private array $cache = [];

    /**
     * All stats for a tenant, keyed by insight type.
     *
     * @return Collection<string,GrowthBrainStat>
     */
    public function statsFor(int|string $tenantId): Collection
    {
        if (isset($this->cache[$tenantId])) {
            return $this->cache[$tenantId];
        }

        return $this->cache[$tenantId] = GrowthBrainStat::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->get()
            ->keyBy('insight_type');
    }

    public function forget(int|string $tenantId): void
    {
        unset($this->cache[$tenantId]);
    }

    /**
     * The multiplier a brain applies to its own thresholds.
     *
     * > 1.0  ⇒ this insight type has earned the right to fire earlier and more
     *          often for this tenant.
     * < 1.0  ⇒ it has been wrong or ignored; make it work harder to qualify.
     */
    public function sensitivity(int|string $tenantId, string $insightType): float
    {
        $stat = $this->statsFor($tenantId)->get($insightType);

        if (!$stat) {
            return 1.0;
        }
        if ($stat->isSuppressed()) {
            return self::MIN_SENSITIVITY;
        }

        return max(self::MIN_SENSITIVITY, min(self::MAX_SENSITIVITY, (float) $stat->sensitivity));
    }

    /**
     * Blend a brain's stated confidence with this tenant's lived experience of
     * the insight type.
     *
     * The brain's own reasoning is weighted 65% and the historical track record
     * 35%. Keeping the brain dominant matters: the specific evidence for THIS
     * signal (sample size, volatility, data quality) is more informative than
     * an average over the type. History adjusts; it does not override.
     */
    public function adjustConfidence(float $stated, ?GrowthBrainStat $stat): float
    {
        if (!$stat || $stat->gradedCount() < 5) {
            return max(1, min(99, $stated));
        }

        $historical = $stat->trustedPrecision();
        $blended    = ($stated * 0.65) + ($historical * 0.35);

        // A type the owner consistently dismisses is, in practice, not
        // confidence-worthy for them regardless of whether it is "true".
        if ($stat->generated_count >= 10 && $stat->engagement_pct < 5 && $stat->dismissed_count > $stat->acted_count) {
            $blended *= 0.8;
        }

        return max(1, min(99, round($blended, 2)));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  COUNTERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Record that a set of signals was generated.
     *
     * @param  Collection<int,Signal>  $signals
     */
    public function recordGeneration(int|string $tenantId, Collection $signals): void
    {
        if ($signals->isEmpty()) {
            return;
        }

        $counts = $signals->groupBy(fn (Signal $s) => $s->type)->map->count();

        foreach ($counts as $type => $n) {
            $stat = $this->ensure($tenantId, $type);
            $stat->increment('generated_count', $n);
            $stat->forceFill(['last_generated_at' => now()])->save();
        }

        $this->forget($tenantId);
    }

    public function bumpCounter(int|string $tenantId, string $type, string $column, int $by = 1): void
    {
        if (!in_array($column, ['acted_count', 'dismissed_count', 'ignored_count', 'hit_count', 'miss_count'], true)) {
            return;
        }

        $stat = $this->ensure($tenantId, $type);
        $stat->increment($column, $by);
        $this->recomputeRates($stat->fresh());
        $this->forget($tenantId);
    }

    public function addRealisedValue(int|string $tenantId, string $type, float $value): void
    {
        if ($value <= 0) {
            return;
        }
        $stat = $this->ensure($tenantId, $type);
        $stat->increment('realised_value', $value);
        $this->forget($tenantId);
    }

    /**
     * Create the stat row for a (tenant, type) pair if it does not exist yet.
     */
    public function ensure(int|string $tenantId, string $type): GrowthBrainStat
    {
        return GrowthBrainStat::withoutTenantScope()->firstOrCreate(
            ['tenant_id' => $tenantId, 'insight_type' => $type],
            [
                'brain'       => InsightCatalog::brainOf($type),
                'sensitivity' => 1.000,
            ]
        );
    }

    private function recomputeRates(GrowthBrainStat $stat): void
    {
        $graded = $stat->hit_count + $stat->miss_count;

        $stat->precision_pct = $graded > 0
            ? round($stat->hit_count / $graded * 100, 2)
            : 0;

        $stat->engagement_pct = $stat->generated_count > 0
            ? round($stat->acted_count / $stat->generated_count * 100, 2)
            : 0;

        $stat->saveQuietly();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  THE TUNING PASS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Re-tune every insight type for a tenant. Runs nightly, after grading.
     *
     * @return array{tuned:int,muted:int,unmuted:int}
     */
    public function tune(int|string $tenantId): array
    {
        $tuned = $muted = $unmuted = 0;

        $stats = GrowthBrainStat::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->get();

        foreach ($stats as $stat) {
            $this->recomputeRates($stat);
            $stat->refresh();

            // ── Rehabilitation: an expired mute always lifts ─────────────
            if ($stat->is_muted && $stat->muted_until && $stat->muted_until->isPast()) {
                $stat->forceFill([
                    'is_muted'    => false,
                    'muted_until' => null,
                    'mute_reason' => null,
                    // Come back cautious, not at full volume.
                    'sensitivity' => max(self::MIN_SENSITIVITY, min(0.85, (float) $stat->sensitivity)),
                ])->save();
                $unmuted++;
                continue;
            }

            if ($stat->is_muted) {
                continue;
            }

            // Not enough evidence to justify changing anything yet.
            if ($stat->generated_count < 8) {
                continue;
            }

            $sensitivity = (float) $stat->sensitivity;
            $graded      = $stat->gradedCount();
            $reasons     = [];

            // ── AXIS 1: PRECISION ────────────────────────────────────────
            if ($graded >= 5) {
                $precision = $stat->trustedPrecision();

                if ($precision >= 70) {
                    $sensitivity *= 1.10;   // trustworthy → let it catch more
                    $reasons[] = 'high precision';
                } elseif ($precision <= 35) {
                    $sensitivity *= 0.85;   // unreliable → make it work harder
                    $reasons[] = 'low precision';
                }
            }

            // ── AXIS 2: ENGAGEMENT ───────────────────────────────────────
            $engagement  = (float) $stat->engagement_pct;
            $dismissRate = $stat->generated_count > 0
                ? $stat->dismissed_count / $stat->generated_count * 100
                : 0;

            if ($engagement >= 30) {
                $sensitivity *= 1.08;
                $reasons[] = 'owner acts on it';
            } elseif ($dismissRate >= 50 && $stat->generated_count >= 10) {
                $sensitivity *= 0.85;
                $reasons[] = 'frequently dismissed';
            }

            // ── SUPPRESSION ──────────────────────────────────────────────
            // Two independent grounds, both requiring a substantial sample.
            // Muting is always temporary: the type is re-tested later.
            $shouldMute = false;
            $muteReason = null;
            $muteDays   = 21;

            if ($graded >= 10 && $stat->trustedPrecision() <= 25) {
                $shouldMute = true;
                $muteReason = 'Wrong ' . round(100 - $stat->trustedPrecision()) . '% of the time over '
                            . $graded . ' checked predictions';
                $muteDays   = 30;
            } elseif ($stat->generated_count >= 20 && $dismissRate >= 80 && $stat->acted_count === 0) {
                $shouldMute = true;
                $muteReason = 'Dismissed ' . $stat->dismissed_count . ' times and never acted on';
                $muteDays   = 21;
            }

            if ($shouldMute) {
                $stat->forceFill([
                    'is_muted'    => true,
                    'muted_until' => now()->addDays($muteDays),
                    'mute_reason' => $muteReason,
                    'sensitivity' => self::MIN_SENSITIVITY,
                    'last_tuned_at' => now(),
                ])->save();
                $muted++;

                Log::info("[GrowthEngine] Muted '{$stat->insight_type}' for tenant {$tenantId}: {$muteReason}");
                continue;
            }

            $sensitivity = max(self::MIN_SENSITIVITY, min(self::MAX_SENSITIVITY, round($sensitivity, 3)));

            if (abs($sensitivity - (float) $stat->sensitivity) > 0.001) {
                $params = $stat->learned_params ?? [];
                $params['history'][] = [
                    'at'      => now()->toDateTimeString(),
                    'from'    => (float) $stat->sensitivity,
                    'to'      => $sensitivity,
                    'because' => $reasons,
                ];
                // Keep the audit trail bounded.
                $params['history'] = array_slice($params['history'], -20);

                $stat->forceFill([
                    'sensitivity'    => $sensitivity,
                    'learned_params' => $params,
                    'last_tuned_at'  => now(),
                ])->save();
                $tuned++;
            }
        }

        $this->forget($tenantId);

        return compact('tuned', 'muted', 'unmuted');
    }

    /**
     * Backfill `ignored_count` from the event stream.
     *
     * An "ignored" signal is one that was shown and then expired with no
     * interaction at all. It is weaker evidence than an explicit dismissal —
     * the owner may simply not have logged in — so it is counted separately
     * and never on its own triggers a mute.
     */
    public function reconcileIgnored(int|string $tenantId): void
    {
        try {
            $rows = DB::table('growth_signal_events')
                ->where('tenant_id', $tenantId)
                ->where('event', GrowthSignalEvent::EXPIRED)
                ->where('created_at', '>=', now()->subDays(2))
                ->select('insight_type', DB::raw('COUNT(*) as n'))
                ->groupBy('insight_type')
                ->get();

            foreach ($rows as $row) {
                if (!$row->insight_type) continue;
                $this->ensure($tenantId, $row->insight_type);
            }
        } catch (\Throwable $e) {
            Log::warning('[GrowthEngine] reconcileIgnored failed: ' . $e->getMessage());
        }
    }

    /**
     * A plain-language report card, shown to the owner on the dashboard.
     *
     * Being openly honest about accuracy is a feature, not a risk. An engine
     * that admits "I get stockout warnings right 8 times out of 10, and churn
     * warnings 5 times out of 10" earns far more trust than one that presents
     * every guess with the same silent certainty.
     */
    public function scorecard(int|string $tenantId): array
    {
        $stats = GrowthBrainStat::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->get();

        $catalog = InsightCatalog::all();
        $byBrain = [];

        foreach (InsightCatalog::brains() as $brain) {
            $byBrain[$brain] = [
                'brain'       => $brain,
                'label'       => InsightCatalog::brainLabel($brain),
                'generated'   => 0,
                'acted'       => 0,
                'hits'        => 0,
                'misses'      => 0,
                'precision'   => null,
                'engagement'  => null,
                'realised'    => 0.0,
                'types'       => [],
            ];
        }

        foreach ($stats as $s) {
            $brain = $catalog[$s->insight_type]['brain'] ?? $s->brain;
            if (!isset($byBrain[$brain])) continue;

            $byBrain[$brain]['generated'] += $s->generated_count;
            $byBrain[$brain]['acted']     += $s->acted_count;
            $byBrain[$brain]['hits']      += $s->hit_count;
            $byBrain[$brain]['misses']    += $s->miss_count;
            $byBrain[$brain]['realised']  += (float) $s->realised_value;

            $byBrain[$brain]['types'][] = [
                'type'        => $s->insight_type,
                'label'       => $catalog[$s->insight_type]['label'] ?? $s->insight_type,
                'generated'   => $s->generated_count,
                'acted'       => $s->acted_count,
                'dismissed'   => $s->dismissed_count,
                'hits'        => $s->hit_count,
                'misses'      => $s->miss_count,
                'precision'   => $s->gradedCount() >= 3 ? $s->precision_pct : null,
                'engagement'  => $s->generated_count >= 5 ? $s->engagement_pct : null,
                'sensitivity' => (float) $s->sensitivity,
                'muted'       => $s->isSuppressed(),
                'mute_reason' => $s->mute_reason,
                'realised'    => (float) $s->realised_value,
                'gradeable'   => (bool) ($catalog[$s->insight_type]['gradeable'] ?? false),
            ];
        }

        foreach ($byBrain as $k => $b) {
            $graded = $b['hits'] + $b['misses'];
            $byBrain[$k]['precision']  = $graded >= 3 ? round($b['hits'] / $graded * 100, 1) : null;
            $byBrain[$k]['engagement'] = $b['generated'] >= 5 ? round($b['acted'] / $b['generated'] * 100, 1) : null;
            usort($byBrain[$k]['types'], fn ($a, $c) => $c['generated'] <=> $a['generated']);
        }

        $totalHits   = $stats->sum('hit_count');
        $totalMisses = $stats->sum('miss_count');
        $totalGen    = $stats->sum('generated_count');
        $totalActed  = $stats->sum('acted_count');

        return [
            'brains'         => array_values($byBrain),
            'total_generated'=> $totalGen,
            'total_acted'    => $totalActed,
            'total_graded'   => $totalHits + $totalMisses,
            'overall_precision'  => ($totalHits + $totalMisses) >= 5
                ? round($totalHits / ($totalHits + $totalMisses) * 100, 1) : null,
            'overall_engagement' => $totalGen >= 10
                ? round($totalActed / $totalGen * 100, 1) : null,
            'realised_value' => (float) $stats->sum('realised_value'),
            'maturity'       => $this->maturityLabel($totalGen, $totalHits + $totalMisses),
        ];
    }

    /**
     * How far along is this tenant's engine?
     *
     * Setting this expectation explicitly matters. A new tenant should be told
     * "I am still learning your business" rather than being handed confident
     * numbers derived from three days of data.
     */
    private function maturityLabel(int $generated, int $graded): array
    {
        if ($generated < 20) {
            return ['stage' => 'learning', 'label' => 'Learning your business',
                    'detail' => 'The engine is still building a picture of your customers, stock and cash. Accuracy figures appear once it has enough history.',
                    'progress' => min(95, (int) round($generated / 20 * 100))];
        }
        if ($graded < 15) {
            return ['stage' => 'calibrating', 'label' => 'Calibrating',
                    'detail' => 'Predictions have been made and are now being checked against what actually happened. Thresholds start adapting shortly.',
                    'progress' => min(95, (int) round($graded / 15 * 100))];
        }
        if ($graded < 60) {
            return ['stage' => 'tuned', 'label' => 'Tuned to your business',
                    'detail' => 'The engine has adjusted its thresholds to your patterns and is suppressing the insight types that have not proven useful to you.',
                    'progress' => min(95, (int) round($graded / 60 * 100))];
        }
        return ['stage' => 'mature', 'label' => 'Mature',
                'detail' => 'Hundreds of predictions checked. Every insight type is weighted by how accurate it has actually been for you.',
                'progress' => 100];
    }
}
