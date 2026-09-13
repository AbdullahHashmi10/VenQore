<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * GrowthSignalEvent — the interaction stream.
 *
 * Every time a signal is shown, opened, acted on, dismissed, snoozed or graded,
 * an immutable event is appended here. ThresholdTuner replays this stream to
 * work out which insight types the owner actually engages with.
 *
 * Kept separate from `ai_recommendations` deliberately: a recommendation row is
 * mutable state ("what is true right now"), while these events are an append-only
 * history ("what happened"). Mixing the two is how V1 lost its own past.
 */
class GrowthSignalEvent extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'growth_signal_events';

    public const SHOWN        = 'shown';
    public const OPENED       = 'opened';
    public const ACTED        = 'acted';
    public const DISMISSED    = 'dismissed';
    public const SNOOZED      = 'snoozed';
    public const OUTCOME_HIT  = 'outcome_hit';
    public const OUTCOME_MISS = 'outcome_miss';
    public const EXPIRED      = 'expired';

    protected $fillable = [
        'tenant_id', 'recommendation_id', 'insight_type', 'event',
        'user_id', 'value', 'meta',
    ];

    protected $casts = [
        'value' => 'decimal:4',
        'meta'  => 'array',
    ];

    /**
     * Append an event. Never throws — telemetry must never break the feature
     * it is measuring.
     */
    public static function record(
        int|string $tenantId,
        string $event,
        ?string $recommendationId = null,
        ?string $insightType = null,
        float $value = 0,
        array $meta = []
    ): void {
        try {
            static::create([
                'tenant_id'         => $tenantId,
                'recommendation_id' => $recommendationId,
                'insight_type'      => $insightType,
                'event'             => $event,
                'user_id'           => auth()->id(),
                'value'             => $value,
                'meta'              => $meta ?: null,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning(
                '[GrowthEngine] Failed to record signal event: ' . $e->getMessage()
            );
        }
    }
}
