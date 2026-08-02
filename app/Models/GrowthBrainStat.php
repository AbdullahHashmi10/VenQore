<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * GrowthBrainStat — the Growth Engine's track record.
 *
 * One row per (tenant, insight_type). This is the memory that lets the engine
 * mature: it records how often an insight type was generated, acted on,
 * dismissed, and — crucially — whether it turned out to be TRUE.
 *
 * The two numbers that matter:
 *   precision_pct  = hits / (hits + misses)   → "is this insight honest?"
 *   engagement_pct = acted / generated        → "does the owner care?"
 *
 * ThresholdTuner reads both and moves `sensitivity` up or down. A type that is
 * accurate and acted on gets MORE sensitive (surfaces earlier, catches more).
 * A type that is wrong or endlessly ignored gets LESS sensitive, and if it
 * keeps failing it is muted so it stops wasting the owner's attention.
 */
class GrowthBrainStat extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'growth_brain_stats';

    protected $fillable = [
        'tenant_id', 'brain', 'insight_type',
        'generated_count', 'acted_count', 'dismissed_count', 'ignored_count',
        'hit_count', 'miss_count',
        'precision_pct', 'engagement_pct', 'realised_value',
        'sensitivity', 'is_muted', 'muted_until', 'mute_reason',
        'learned_params', 'last_generated_at', 'last_tuned_at',
    ];

    protected $casts = [
        'precision_pct'     => 'float',
        'engagement_pct'    => 'float',
        'realised_value'    => 'decimal:4',
        'sensitivity'       => 'float',
        'is_muted'          => 'boolean',
        'muted_until'       => 'datetime',
        'learned_params'    => 'array',
        'last_generated_at' => 'datetime',
        'last_tuned_at'     => 'datetime',
    ];

    /**
     * Is this insight type currently suppressed?
     * A mute always has an expiry so a type can rehabilitate itself.
     */
    public function isSuppressed(): bool
    {
        if (!$this->is_muted) {
            return false;
        }
        return $this->muted_until === null || $this->muted_until->isFuture();
    }

    /**
     * Total graded predictions. Below ~8 we don't trust precision enough to
     * act on it — small samples produce wild swings.
     */
    public function gradedCount(): int
    {
        return (int) $this->hit_count + (int) $this->miss_count;
    }

    /**
     * Precision we're willing to rely on. Falls back to a neutral 50% until
     * the sample is big enough to mean anything (Laplace-smoothed).
     */
    public function trustedPrecision(): float
    {
        $graded = $this->gradedCount();
        if ($graded < 3) {
            return 50.0;
        }
        // Laplace smoothing pulls small samples toward 50% instead of 0/100.
        return round((($this->hit_count + 2) / ($graded + 4)) * 100, 2);
    }
}
