<?php

namespace App\Services\Growth;

use App\Models\AiRecommendation;
use App\Models\GrowthBrainStat;
use App\Models\GrowthSignalEvent;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * SignalRepository — persistence, deduplication and lifecycle for signals.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## The V1 problems this fixes
 *
 * 1. DUPLICATES / SILENCE. V1's "already alerted?" checks were inconsistent
 *    ad-hoc queries: the forecaster used `created_at >= startOfDay()`, the
 *    churn detector used `startOfWeek()`, retention used `is_read = false`.
 *    Same engine, three different rules. The retention one was the worst: a
 *    signal the owner had READ was regenerated the very next night, while a
 *    signal they had never seen blocked a genuinely updated one.
 *
 * 2. DISMISSALS MEANT NOTHING. `is_dismissed` filtered the read query but was
 *    never consulted at generation time, so anything the owner rejected came
 *    straight back tomorrow. That is the fastest way to teach someone to
 *    ignore a feature.
 *
 * 3. NOTHING WAS EVER RESOLVED. A "stock risk" stayed on the dashboard after
 *    the stock was replenished, until `valid_until` quietly expired it. The
 *    owner could not tell live problems from stale ones.
 *
 * ## How V2 behaves
 *
 * Signals are UPSERTED on a deterministic key. Re-running the engine on
 * unchanged data changes nothing except `seen_count` and `last_generated_at`.
 * Dismissals are honoured for the insight type's cooldown. And when a brain
 * finishes, any of its previously-open signals that it did NOT re-emit are
 * auto-resolved, because the underlying condition has gone away.
 */
class SignalRepository
{
    /** Ranking weight per priority band. */
    private const PRIORITY_WEIGHT = [
        'urgent' => 1.60,
        'high'   => 1.30,
        'medium' => 1.00,
        'low'    => 0.75,
    ];

    public function __construct(
        private readonly ThresholdTuner $tuner
    ) {
    }

    /**
     * Persist a brain's output.
     *
     * @param  Collection<int,Signal>|array<int,Signal>  $signals
     * @return array{created:int,updated:int,resolved:int,suppressed:int}
     */
    public function flush(int|string $tenantId, string $brain, iterable $signals): array
    {
        $signals = collect($signals);
        $stats   = $this->tuner->statsFor($tenantId);
        $now     = now();

        $emittedKeys = [];
        $created = $updated = $suppressed = 0;

        // Pull every row this brain owns in ONE query, keyed for O(1) lookup.
        // V1 issued an EXISTS query per candidate signal.
        $existing = AiRecommendation::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->where('brain', $brain)
            ->whereNull('deleted_at')
            ->get()
            ->keyBy('signal_key');

        foreach ($signals as $signal) {
            /** @var Signal $signal */
            $key  = $signal->key($tenantId);
            $meta = InsightCatalog::get($signal->type);

            if (!$meta) {
                // Unknown type — a brain emitted something not in the catalog.
                // Skip rather than write an un-taggable row we can never grade.
                continue;
            }

            $stat = $stats->get($signal->type);

            // ── Suppression: this type has proven itself noisy ───────────
            if ($stat && $stat->isSuppressed()) {
                $suppressed++;
                continue;
            }

            $emittedKeys[] = $key;
            $row = $existing->get($key);

            // Tenant-tuned confidence: the engine's own track record with this
            // insight type for THIS tenant adjusts how sure it claims to be.
            $confidence = $this->tuner->adjustConfidence($signal->confidence, $stat);
            $priority   = $this->derivePriority($signal, $confidence);
            $impact     = $this->impactScore($signal, $confidence, $priority, $stat);

            $payload = [
                'brain'             => $brain,
                'type'              => $signal->type,
                'signal_key'        => $key,
                'priority'          => $priority,
                'confidence'        => round($confidence, 2),
                'impact_score'      => round($impact, 4),
                'party_id'          => $signal->partyId,
                'product_id'        => $signal->productId,
                'title'             => mb_substr($signal->title, 0, 250),
                'message'           => $signal->message,
                'data'              => $signal->data ?: null,
                'evidence'          => $signal->evidence ?: null,
                'potential_revenue' => round(max(0, $signal->potentialRevenue), 4),
                'action_type'       => $signal->resolvedActionType(),
                'action_url'        => $signal->actionUrl,
                'valid_until'       => $signal->validUntil?->toDateString()
                                       ?? $now->copy()->addDays(max(7, $signal->resolvedHorizon()))->toDateString(),
                'last_generated_at' => $now,
            ];

            if ($row) {
                // ── Respect an explicit dismissal for its cooldown ────────
                if ($row->status === 'dismissed' && $row->dismissed_at) {
                    $cooldown = (int) ($meta['cooldown_days'] ?? 14);
                    if ($row->dismissed_at->copy()->addDays($cooldown)->isFuture()) {
                        $suppressed++;
                        continue;
                    }
                }

                // ── Respect an explicit snooze ────────────────────────────
                if ($row->status === 'snoozed' && $row->snoozed_until?->isFuture()) {
                    $suppressed++;
                    continue;
                }

                // A recurring signal is a stronger signal. Bump the counter and
                // let it feed back into confidence via repeatBoost().
                $payload['seen_count'] = (int) $row->seen_count + 1;
                $payload['status']     = 'open';

                // Never restart the outcome clock on a re-confirmation —
                // otherwise a signal that reappears daily could never be graded.
                if ($row->outcome !== 'pending') {
                    $payload['outcome']            = 'pending';
                    $payload['outcome_checked_at'] = null;
                    $payload['outcome_due_at']     = $this->outcomeDueAt($signal, $now);
                }

                $row->update($payload);
                $updated++;
            } else {
                $payload['status']        = 'open';
                $payload['tenant_id']     = $tenantId;
                $payload['is_read']       = false;
                $payload['is_dismissed']  = false;
                $payload['seen_count']    = 1;
                $payload['first_seen_at'] = $now;
                $payload['outcome']       = $meta['gradeable'] ? 'pending' : 'unclear';
                $payload['outcome_due_at']= $meta['gradeable'] ? $this->outcomeDueAt($signal, $now) : null;

                AiRecommendation::withoutTenantScope()->create($payload);
                $created++;

                GrowthSignalEvent::record(
                    $tenantId, GrowthSignalEvent::SHOWN, null, $signal->type,
                    $signal->potentialRevenue
                );
            }
        }

        $resolved = $this->autoResolve($tenantId, $brain, $emittedKeys, $existing);

        $this->tuner->recordGeneration($tenantId, $signals);

        return compact('created', 'updated', 'resolved', 'suppressed');
    }

    /**
     * Close signals whose underlying condition no longer holds.
     *
     * If the inventory brain ran successfully and did NOT re-emit
     * "stockout_imminent" for product X, then X is no longer at risk — the
     * owner reordered, or demand fell. Leaving it open would be a lie.
     *
     * Resolution is also an OUTCOME: a gradeable prediction that resolved
     * before its horizon, after the owner acted, is exactly what a "hit"
     * looks like. OutcomeEvaluator picks that up from `resolved_at`.
     */
    private function autoResolve(
        int|string $tenantId,
        string $brain,
        array $emittedKeys,
        Collection $existing
    ): int {
        $stale = $existing
            ->filter(fn ($r) => in_array($r->status, ['open', 'snoozed'], true))
            ->reject(fn ($r) => in_array($r->signal_key, $emittedKeys, true));

        if ($stale->isEmpty()) {
            return 0;
        }

        AiRecommendation::withoutTenantScope()
            ->whereIn('id', $stale->pluck('id')->all())
            ->update([
                'status'      => 'resolved',
                'resolved_at' => now(),
                'updated_at'  => now(),
            ]);

        return $stale->count();
    }

    /**
     * Composite ranking score.
     *
     * V1 sorted purely by a four-value priority enum, so a Rs 400 stock alert
     * outranked a Rs 90,000 overdue receivable simply because someone had
     * typed 'urgent' into the code. V2 ranks on money at stake, damped
     * logarithmically so a single huge number cannot monopolise the feed,
     * then modulated by confidence, urgency and — importantly — how accurate
     * this insight type has historically been FOR THIS TENANT.
     */
    private function impactScore(
        Signal $signal,
        float $confidence,
        string $priority,
        ?GrowthBrainStat $stat
    ): float {
        // log1p keeps ordering intact while compressing the range, so a
        // Rs 500k item beats a Rs 50k item without burying everything else.
        $money = log1p(max(0, $signal->potentialRevenue));

        $weight     = self::PRIORITY_WEIGHT[$priority] ?? 1.0;
        $confFactor = max(0.2, $confidence / 100);

        // Historical honesty of this insight type, centred on 1.0.
        $precision = $stat ? ($stat->trustedPrecision() / 50) : 1.0;
        $precision = max(0.4, min(1.6, $precision));

        // Engagement: types the owner actually acts on rise in the feed.
        $engagement = 1.0;
        if ($stat && $stat->generated_count >= 10) {
            $engagement = max(0.6, min(1.4, 0.7 + ($stat->engagement_pct / 100)));
        }

        return $money * $weight * $confFactor * $precision * $engagement * 10;
    }

    /**
     * Priority is derived, not declared.
     *
     * A low-confidence guess should never shout 'urgent' at a business owner,
     * no matter what the rule that produced it thinks. Confidence can only
     * demote here — it never promotes — so a cautious signal stays quiet.
     */
    private function derivePriority(Signal $signal, float $confidence): string
    {
        $base  = $signal->resolvedPriority();
        $order = ['low', 'medium', 'high', 'urgent'];
        $idx   = array_search($base, $order, true);
        $idx   = $idx === false ? 1 : $idx;

        if ($confidence < 45 && $idx > 0) {
            $idx--;
        }
        if ($confidence < 30 && $idx > 0) {
            $idx--;
        }

        return $order[$idx];
    }

    private function outcomeDueAt(Signal $signal, Carbon $now): ?Carbon
    {
        $h = $signal->resolvedHorizon();
        return $h > 0 ? $now->copy()->addDays($h) : null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Lifecycle transitions driven by the user
    // ═══════════════════════════════════════════════════════════════════════

    public function markActed(AiRecommendation $rec): void
    {
        $rec->update([
            'status'   => 'acted',
            'acted_at' => now(),
            'is_read'  => true,
        ]);

        GrowthSignalEvent::record(
            $rec->tenant_id, GrowthSignalEvent::ACTED, $rec->id, $rec->type,
            (float) $rec->potential_revenue
        );

        $this->tuner->bumpCounter($rec->tenant_id, $rec->type, 'acted_count');
    }

    public function markDismissed(AiRecommendation $rec, ?string $reason = null): void
    {
        $rec->update([
            'status'        => 'dismissed',
            'dismissed_at'  => now(),
            'is_dismissed'  => true,
            'is_read'       => true,
            'outcome_note'  => $reason,
        ]);

        GrowthSignalEvent::record(
            $rec->tenant_id, GrowthSignalEvent::DISMISSED, $rec->id, $rec->type,
            0, $reason ? ['reason' => $reason] : []
        );

        $this->tuner->bumpCounter($rec->tenant_id, $rec->type, 'dismissed_count');
    }

    public function markSnoozed(AiRecommendation $rec, int $days): void
    {
        $rec->update([
            'status'        => 'snoozed',
            'snoozed_until' => now()->addDays($days),
            'is_read'       => true,
        ]);

        GrowthSignalEvent::record(
            $rec->tenant_id, GrowthSignalEvent::SNOOZED, $rec->id, $rec->type,
            0, ['days' => $days]
        );
    }

    /**
     * Expire anything past its validity window that nobody ever touched.
     * An ignored signal is weak evidence that the type is not useful, so it
     * is counted separately from an explicit dismissal.
     */
    public function expireStale(int|string $tenantId): int
    {
        $rows = AiRecommendation::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->whereNotNull('valid_until')
            ->whereDate('valid_until', '<', now()->toDateString())
            ->get();

        foreach ($rows as $row) {
            $row->update(['status' => 'expired']);
            GrowthSignalEvent::record(
                $tenantId, GrowthSignalEvent::EXPIRED, $row->id, $row->type
            );
            $this->tuner->bumpCounter($tenantId, $row->type, 'ignored_count');
        }

        return $rows->count();
    }

    /**
     * Housekeeping: keep the table small. Graded history older than a year is
     * kept in aggregate form on growth_brain_stats, so the detail rows can go.
     */
    public function prune(int|string $tenantId, int $keepDays = 365): int
    {
        return DB::table('ai_recommendations')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['resolved', 'expired', 'dismissed'])
            ->where('updated_at', '<', now()->subDays($keepDays))
            ->delete();
    }
}
