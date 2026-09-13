<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;

class EcommerceChannel extends Model
{
    use SoftDeletes, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'is_connected'              => 'boolean',
        'last_synced_at'            => 'datetime',
        'access_token_expires_at'   => 'datetime',
        'refresh_token_expires_at'  => 'datetime',
        'fee_percentage'            => 'decimal:4',
        // T16 — health/observability columns used by IntegrationHealthService.
        'last_error_at'             => 'datetime',
        'consecutive_failures'      => 'integer',
        'last_sync_duration_ms'     => 'integer',
    ];

    /**
     * T16 — appended so the dashboard can render "Last synced 2 minutes ago"
     * without shipping raw timestamps and re-deriving the phrasing in JS.
     */
    protected $appends = ['last_synced_human'];

    public function getLastSyncedHumanAttribute(): ?string
    {
        return $this->last_synced_at?->diffForHumans();
    }

    // Never expose tokens in API responses or logs
    protected $hidden = [
        'oauth_access_token',
        'oauth_refresh_token',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    // ─── Token Helpers ────────────────────────────────────────────────────────

    /**
     * Store the access token encrypted. Never stored in plaintext.
     */
    public function setOauthAccessTokenAttribute($value): void
    {
        $this->attributes['oauth_access_token'] = $value ? encrypt($value) : null;
    }

    public function getOauthAccessTokenAttribute($value): ?string
    {
        return $value ? decrypt($value) : null;
    }

    public function setOauthRefreshTokenAttribute($value): void
    {
        $this->attributes['oauth_refresh_token'] = $value ? encrypt($value) : null;
    }

    public function getOauthRefreshTokenAttribute($value): ?string
    {
        return $value ? decrypt($value) : null;
    }

    /**
     * Is the access token expiring within the next 15 minutes?
     * Used by TokenRefreshJob to decide if proactive refresh is needed.
     */
    public function isAccessTokenExpiringSoon(): bool
    {
        return $this->access_token_expires_at
            && $this->access_token_expires_at->subMinutes(15)->isPast();
    }

    /**
     * Is the refresh token expired?
     * If true, client must reconnect via OAuth flow again.
     */
    public function isRefreshTokenExpired(): bool
    {
        return $this->refresh_token_expires_at
            && $this->refresh_token_expires_at->isPast();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeConnected($query)
    {
        return $query->where('is_connected', true);
    }

    public function scopeForPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }
}
