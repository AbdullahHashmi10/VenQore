<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * MarketplacePayout — one settlement batch from one channel.
 *
 * Orders accrue into an open ('pending') payout for their channel. When the
 * settlement window elapses the batch flips to 'due' and the owner is asked to
 * confirm what actually landed in the bank. Only on confirmation do we move
 * money out of 1205 Marketplace Clearing into 1010 Bank.
 *
 * Expected vs actual is the whole point: platforms deduct storage fees, ad
 * spend, dispute charges and rolling reserves that no percentage estimate can
 * predict. The difference is captured as `variance` and posted to 5410.
 */
class MarketplacePayout extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'expected_gross'   => 'decimal:2',
        'expected_fees'    => 'decimal:2',
        'expected_reserve' => 'decimal:2',
        'expected_net'     => 'decimal:2',
        'actual_net'       => 'decimal:2',
        'variance'         => 'decimal:2',
        'period_start'     => 'date',
        'period_end'       => 'date',
        'expected_at'      => 'datetime',
        'confirmed_at'     => 'datetime',
    ];

    protected $appends = ['is_overdue', 'expected_at_human'];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function channel()
    {
        return $this->belongsTo(EcommerceChannel::class, 'ecommerce_channel_id');
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'marketplace_payout_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /** Still accruing — the settlement window has not elapsed. */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /** Window elapsed, waiting on the owner to confirm receipt. */
    public function scopeDue($query)
    {
        return $query->where('status', 'due');
    }

    /** Money the platform is holding right now — the "Pending Payout" stage. */
    public function scopeUnsettled($query)
    {
        return $query->whereIn('status', ['pending', 'due']);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Due for more than 48h past the expected date. Surfaced in the UI because a
     * genuinely late payout usually means a platform account problem the owner
     * needs to go and look at.
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'due'
            && $this->expected_at !== null
            && $this->expected_at->lt(now()->subHours(48));
    }

    public function getExpectedAtHumanAttribute(): ?string
    {
        return $this->expected_at?->diffForHumans();
    }
}
