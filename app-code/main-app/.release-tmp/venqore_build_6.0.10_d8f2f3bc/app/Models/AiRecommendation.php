<?php

namespace App\Models;

use App\Services\Growth\InsightCatalog;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * AiRecommendation — a single tracked Growth Engine signal.
 *
 * The table name is a V1 legacy (nothing here involves an LLM; the engine is
 * pure statistics over the tenant's own ledger). It is kept to avoid a
 * disruptive rename across routes, migrations and existing rows, but the
 * concept it now models is a SIGNAL with an identity, a lifecycle and a
 * graded outcome — not a fire-and-forget alert.
 *
 * Lifecycle:  open → acted | dismissed | snoozed | resolved | expired
 * Outcome:    pending → hit | miss | unclear
 */
class AiRecommendation extends Model
{
    use HasUuids, HasFactory, HasTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'brain',
        'type',
        'signal_key',
        'priority',
        'confidence',
        'impact_score',
        'status',
        'party_id',
        'product_id',
        'title',
        'message',
        'data',
        'evidence',
        'potential_revenue',
        'action_type',
        'action_url',
        'is_read',
        'is_dismissed',
        'valid_until',
        'first_seen_at',
        'last_generated_at',
        'seen_count',
        'acted_at',
        'dismissed_at',
        'snoozed_until',
        'resolved_at',
        'outcome',
        'outcome_checked_at',
        'outcome_due_at',
        'outcome_value',
        'outcome_note',
    ];

    protected $casts = [
        'data'               => 'array',
        'evidence'           => 'array',
        'is_read'            => 'boolean',
        'is_dismissed'       => 'boolean',
        'valid_until'        => 'date',
        'potential_revenue'  => 'decimal:4',
        'outcome_value'      => 'decimal:4',
        'confidence'         => 'float',
        'impact_score'       => 'float',
        'seen_count'         => 'integer',
        'first_seen_at'      => 'datetime',
        'last_generated_at'  => 'datetime',
        'acted_at'           => 'datetime',
        'dismissed_at'       => 'datetime',
        'snoozed_until'      => 'datetime',
        'resolved_at'        => 'datetime',
        'outcome_checked_at' => 'datetime',
        'outcome_due_at'     => 'datetime',
    ];

    protected $appends = ['type_label', 'brain_label', 'category', 'action_hint'];

    // ─── Relationships ────────────────────────────────────────────────────

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function events()
    {
        return $this->hasMany(GrowthSignalEvent::class, 'recommendation_id');
    }

    // ─── Presentation ─────────────────────────────────────────────────────
    // Derived from the catalog so the UI never hardcodes a label map, and
    // adding a new insight type requires no frontend change at all.

    public function getTypeLabelAttribute(): string
    {
        return InsightCatalog::meta(
            (string) $this->type,
            'label',
            ucfirst(str_replace('_', ' ', (string) $this->type))
        );
    }

    public function getBrainLabelAttribute(): string
    {
        return InsightCatalog::brainLabel($this->brain ?: InsightCatalog::brainOf((string) $this->type));
    }

    public function getCategoryAttribute(): string
    {
        return InsightCatalog::meta((string) $this->type, 'category', 'general');
    }

    /** The one-line "so what do I do about it" shown under the title. */
    public function getActionHintAttribute(): ?string
    {
        return InsightCatalog::meta((string) $this->type, 'actionable');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────

    /**
     * The live feed: open signals that have not expired and are not snoozed.
     *
     * V1's `active()` checked only `is_dismissed` and `valid_until`, so
     * resolved signals kept showing until their date lapsed and the owner
     * could not tell a live problem from one they had already fixed.
     */
    public function scopeActive($query)
    {
        return $query
            ->where('status', 'open')
            ->where(function ($q) {
                $q->whereNull('valid_until')->orWhereDate('valid_until', '>=', now()->toDateString());
            })
            ->where(function ($q) {
                $q->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now());
            });
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForBrain($query, string $brain)
    {
        return $query->where('brain', $brain);
    }

    /** Highest-impact first — money at stake, damped and weighted. */
    public function scopeRanked($query)
    {
        return $query->orderByDesc('impact_score')->orderByDesc('created_at');
    }

    public function scopeAwaitingOutcome($query)
    {
        return $query->where('outcome', 'pending')->whereNotNull('outcome_due_at');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    public function isGradeable(): bool
    {
        return (bool) InsightCatalog::meta((string) $this->type, 'gradeable', false);
    }

    public function isLive(): bool
    {
        return $this->status === 'open'
            && ($this->valid_until === null || $this->valid_until->gte(now()->startOfDay()))
            && ($this->snoozed_until === null || $this->snoozed_until->lte(now()));
    }
}
