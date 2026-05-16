<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Tenant Model — Definitive Plan
 *
 * Represents a single store. Users belong to stores via tenant_users pivot.
 * URL structure: venqore.com/s/{id}/dashboard — id is the numeric auto-increment PK.
 *
 * @property int     $id                    The store's numeric ID (used in URLs)
 * @property string  $name                  "Ali Shoes" — shown in UI everywhere
 * @property string  $slug                  "ali-shoes" — display only, NOT used in routing
 * @property string  $plan                  trial|starter|growth|business|ltd
 * @property string  $status                trial|active|suspended|cancelled
 * @property ?string $join_code             "VQ-A3F9" — staff join without invite email
 * @property bool    $feature_variants
 * @property bool    $feature_serials
 * @property bool    $feature_batches
 * @property bool    $feature_manufacturing
 */
class Tenant extends Model
{
    use SoftDeletes;

    // Numeric auto-increment PK — NOT UUID
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'name',
        'slug',
        'plan',
        'status',
        'trial_ends_at',
        'subscription_ends_at',
        'lemon_squeezy_customer_id',
        'lemon_squeezy_subscription_id',
        'appsumo_code',
        'plan_limits',
        'timezone',
        'currency_code',
        'currency_symbol',
        'country_code',
        'language_code',
        'setup_completed',
        'industry',
        'is_demo',
        'is_golden_master',
        'demo_expires_at',
        'demo_session_token',
        'join_code',
        'feature_variants',
        'feature_serials',
        'feature_batches',
        'feature_manufacturing',
        'logo_style',
        'logo_path',
    ];

    protected $casts = [
        'plan_limits'           => 'array',
        'setup_completed'       => 'boolean',
        'is_demo'               => 'boolean',
        'is_golden_master'      => 'boolean',
        'trial_ends_at'         => 'datetime',
        'subscription_ends_at'  => 'datetime',
        'demo_expires_at'       => 'datetime',
        'feature_variants'      => 'boolean',
        'feature_serials'       => 'boolean',
        'feature_batches'       => 'boolean',
        'feature_manufacturing' => 'boolean',
    ];

    // ──────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────

    /** All users belonging to this store (via pivot) */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users')
                    ->withPivot(['role', 'status', 'display_name', 'pos_pin', 'joined_at'])
                    ->withTimestamps();
    }

    /** Direct access to all TenantUser membership records */
    public function memberships(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    /** The owner membership record */
    public function ownerMembership(): HasOne
    {
        return $this->hasOne(TenantUser::class)->where('role', 'owner');
    }

    /** ERP data relationships (unchanged — still use HasTenant global scope) */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(StoreLicense::class);
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    /**
     * Get the owner's email address (for billing notifications).
     */
    public function ownerEmail(): ?string
    {
        $owner = $this->ownerMembership()->with('user')->first();
        return $owner?->user?->email;
    }

    /**
     * Check if the trial is currently active.
     */
    public function isTrialActive(): bool
    {
        return $this->status === 'trial'
            && $this->trial_ends_at !== null
            && $this->trial_ends_at->isFuture();
    }

    /**
     * Check if the store is in a usable state (trial or active subscription).
     */
    public function isAccessible(): bool
    {
        if ($this->status === 'active') return true;
        return $this->isTrialActive();
    }

    /**
     * Get effective plan limits, allowing per-tenant JSON overrides.
     */
    public function getLimit(string $key): mixed
    {
        if ($this->plan_limits && isset($this->plan_limits[$key])) {
            return $this->plan_limits[$key];
        }
        return config("plans.{$this->plan}.{$key}");
    }

    /**
     * Return the features array for Inertia sharing.
     */
    public function featuresArray(): array
    {
        return [
            'variants'      => $this->feature_variants,
            'serials'       => $this->feature_serials,
            'batches'       => $this->feature_batches,
            'manufacturing' => $this->feature_manufacturing,
        ];
    }
    /**
     * Get the logo URL (using the specific store logo or falling back to VenQore default).
     */
    public function getLogoUrlAttribute(): string
    {
        if ($this->logo_path) {
            return asset('storage/' . $this->logo_path);
        }
        return asset('images/logo.png');
    }
}
