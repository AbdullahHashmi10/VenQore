<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * AccessGrant — "Gift Link"
 *
 * Generated from the Platform Owner dashboard (/VenQore). Grants a chosen
 * Plan for a chosen duration with zero payment. See migration docblock for
 * how this differs from Coupon and AppSumoCode.
 */
class AccessGrant extends Model
{
    protected $fillable = [
        'token',
        'plan_id',
        'duration_value',
        'duration_unit',
        'label',
        'max_redemptions',
        'redemption_count',
        'expires_at',
        'revoked_at',
        'created_by',
    ];

    protected $casts = [
        'expires_at'       => 'datetime',
        'revoked_at'       => 'datetime',
        'duration_value'   => 'integer',
        'max_redemptions'  => 'integer',
        'redemption_count' => 'integer',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(AccessGrantRedemption::class);
    }

    /**
     * Generate a new unguessable token. Not sequential, not a coupon-style
     * human-typed code — this is only ever clicked from a link, never typed.
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(40);
        } while (self::where('token', $token)->exists());

        return $token;
    }

    /**
     * Can this link still be redeemed right now (by anyone)?
     * Mirrors Coupon::isValid()'s shape for consistency across the two
     * similar-but-distinct "code validity" concepts in this codebase.
     */
    public function isValid(): bool
    {
        if ($this->revoked_at !== null) {
            return false;
        }
        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }
        if ($this->redemption_count >= $this->max_redemptions) {
            return false;
        }

        return true;
    }

    /**
     * Human-readable reason this link cannot be redeemed, or null if valid.
     * Used by GiftRedemptionController to render a specific rejection state
     * instead of a generic 404.
     */
    public function invalidReason(): ?string
    {
        if ($this->revoked_at !== null) {
            return 'revoked';
        }
        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return 'expired';
        }
        if ($this->redemption_count >= $this->max_redemptions) {
            return 'exhausted';
        }

        return null;
    }

    /** Compute the access end date this grant currently produces, from now. */
    public function computeGrantedUntil(): Carbon
    {
        return match ($this->duration_unit) {
            'day'   => now()->addDays($this->duration_value),
            'month' => now()->addMonths($this->duration_value),
            'year'  => now()->addYears($this->duration_value),
        };
    }

    /** e.g. "1 Year", "18 Months", "45 Days" — for display on the gift page. */
    public function durationLabel(): string
    {
        $unit = $this->duration_value === 1 ? $this->duration_unit : $this->duration_unit . 's';
        return "{$this->duration_value} " . ucfirst($unit);
    }

    /** Full shareable URL for this grant. */
    public function url(): string
    {
        return route('gift.show', ['token' => $this->token]);
    }
}
