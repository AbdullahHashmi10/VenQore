<?php

namespace App\Models;

use App\Services\PlanRepository;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
    use HasFactory, SoftDeletes;

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
        'onboarding_step',
        'onboarding_completed',
        'onboarding_skipped',
        'onboarding_steps_done',
    ];

    protected $casts = [
        'plan_limits'           => 'array',
        'setup_completed'       => 'boolean',
        'is_demo'               => 'boolean',
        'is_golden_master'      => 'boolean',
        'trial_ends_at'         => 'datetime',
        'subscription_ends_at'  => 'datetime',
        'demo_expires_at'       => 'datetime',
        'last_online_at'        => 'datetime',
        'feature_variants'      => 'boolean',
        'feature_serials'       => 'boolean',
        'feature_batches'       => 'boolean',
        'feature_manufacturing' => 'boolean',
        'onboarding_completed'  => 'boolean',
        'onboarding_skipped'    => 'boolean',
        'onboarding_steps_done' => 'array',
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

    public function planOverrides(): HasMany
    {
        return $this->hasMany(TenantPlanOverride::class);
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    /**
     * Get the URL for the tenant's logo.
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo_path) {
            return null;
        }

        // Guard against broken URLs for logos that exist in the DB but are
        // missing from storage (e.g. after a deployment, migration, or S3 sync issue).
        // Returning null lets the frontend fall back to the initials avatar gracefully
        // instead of rendering a broken <img> that fires a 404 on every page load.
        if (!\Illuminate\Support\Facades\Storage::exists($this->logo_path)) {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::url($this->logo_path);
    }


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
     * Get the effective limit for a feature key.
     *
     * Priority order:
     * 1. tenant_plan_overrides table (set from SuperAdmin override panel)
     * 2. plan_limits table (set from SuperAdmin plan editor)
     * 3. plan_limits JSON column on this tenant (legacy AppSumo stacking — still supported)
     * 4. config/plans.php (final fallback during transition period)
     */
    public function getLimit(string $key): mixed
    {
        // Use PlanRepository which handles DB + cache (priorities 1 & 2)
        $value = PlanRepository::getEffectiveLimit($this->id, $this->plan, $key);

        // 3. Fallback to plan_limits JSON column on this tenant (legacy AppSumo stacking)
        if ($this->plan === 'ltd' || ($value === null && !array_key_exists($key, PlanRepository::getLimits($this->plan)))) {
            if ($this->plan_limits && isset($this->plan_limits[$key])) {
                $value = $this->plan_limits[$key];
            }
        }

        // Value semantics from DB:
        // null = unlimited
        // '0'  = false/disabled
        // '1'  = true/enabled
        // numeric string = integer cap
        // 'basic'/'advanced' = feature variant

        if ($value === null)        return null;   // unlimited
        if ($value === '0')         return false;  // feature disabled
        if ($value === '1')         return true;   // feature enabled
        if (is_numeric($value))     return (int) $value;
        return $value;                             // string variant e.g. 'basic', 'advanced'
    }

    /**
     * Get an array of enabled features for the frontend.
     */
    public function featuresArray(): array
    {
        return [
            'variants'      => (bool)$this->feature_variants,
            'serials'       => (bool)$this->feature_serials,
            'batches'       => (bool)$this->feature_batches,
            'manufacturing' => (bool)$this->feature_manufacturing,
        ];
    }
}
