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

    /**
     * Enforce "at most one Golden Master demo tenant" at the application
     * layer. is_golden_master has no DB-level unique constraint (MySQL
     * doesn't support a filtered/partial unique index on a plain boolean
     * the way Postgres does), and several commands/controllers resolve
     * "the" demo tenant via Tenant::where('is_golden_master', true)->first()
     * — if that ever matched more than one row, which record comes back is
     * implementation-defined, and demo:restore-style commands would risk
     * wiping/reseeding the wrong tenant. This guard fails loudly at save
     * time instead of letting a second Golden Master silently exist.
     */
    protected static function booted(): void
    {
        static::saving(function (Tenant $tenant) {
            if (empty($tenant->attributes['is_golden_master'])) {
                return;
            }

            $existing = static::withoutGlobalScopes()
                ->where('is_golden_master', true)
                ->where('id', '!=', $tenant->id ?? 0)
                ->exists();

            if ($existing) {
                throw new \RuntimeException(
                    'Refusing to save Tenant #' . ($tenant->id ?? '(new)') . ' with is_golden_master=true: '
                    . 'another tenant already has is_golden_master=true. Only one Golden Master demo tenant '
                    . 'may exist at a time. Unset the flag on the existing Golden Master first if you intend to replace it.'
                );
            }
        });
    }

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
        'is_internal',
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
        'onboarding_steps_done',
        'google_backup_enabled',
        'hosted_until',
        'transactions_this_month',
        'transactions_reset_at',
        'google_backup_retention',
        'google_backup_email',
        'google_access_token',
        'google_refresh_token',
        'google_backup_folder_id',
        'view_only_since',
        'limit_grace_ends_at',
        'ai_status',
        'ai_queries_limit',
        'ai_queries_used',
        'ai_pages_limit',
        'ai_pages_used',
        'ai_descriptions_balance',
        'ai_period_started_at',
        'sync_channels',
        'grace_ends_at',
        'terms_accepted_at',
        'terms_version',
        'shared_catalog_opt_out',
        'ai_accuracy_opt_in',
    ];

    protected $casts = [
        'plan_limits'           => 'array',
        'setup_completed'       => 'boolean',
        'is_demo'               => 'boolean',
        'is_internal'           => 'boolean',
        'is_golden_master'      => 'boolean',
        'shared_catalog_opt_out'=> 'boolean',
        'ai_accuracy_opt_in'    => 'boolean',
        'terms_accepted_at'     => 'datetime',
        'trial_ends_at'         => 'datetime',
        'subscription_ends_at'  => 'datetime',
        'demo_expires_at'       => 'datetime',
        'ai_period_started_at'  => 'datetime',
        'last_online_at'        => 'datetime',
        'feature_variants'      => 'boolean',
        'feature_serials'       => 'boolean',
        'feature_batches'       => 'boolean',
        'feature_manufacturing' => 'boolean',
        'onboarding_completed'  => 'boolean',
        'onboarding_steps_done' => 'array',
        'google_backup_enabled' => 'boolean',
        'google_backup_retention'=> 'integer',
        'google_access_token'   => 'encrypted',
        'google_refresh_token'  => 'encrypted',
        'view_only_since'       => 'datetime',
        // T17 — Marketplace Clearing cutover. Null = pipeline off (legacy
        // Dr Cash posting). Sales created before this timestamp are never
        // reclassified, so closed periods stay untouched.
        'clearing_go_live_at'   => 'datetime',
        'limit_grace_ends_at'   => 'datetime',
        'sync_channels'         => 'array',
        'grace_ends_at'         => 'datetime',
    ];

    protected $hidden = [
        'google_access_token',
        'google_refresh_token',
    ];

    protected $appends = [
        'logo_url',
        'google_connected',
    ];

    public function getGoogleConnectedAttribute(): bool
    {
        if (!array_key_exists('google_refresh_token', $this->attributes)) {
            return false;
        }

        // google_refresh_token is an `encrypted` cast, so reading it here
        // forces a decrypt using the CURRENT APP_KEY. Because this accessor
        // is auto-appended ($appends above) and shared on every tenant-scoped
        // request (see TenantMiddleware::handle()), an undecryptable value —
        // e.g. left over from a stale/rotated APP_KEY — used to throw an
        // uncaught DecryptException("The MAC is invalid.") straight out of
        // middleware, taking down every page for the tenant. Guard it: a
        // token that can't be decrypted is functionally "not connected".
        try {
            return !empty($this->google_refresh_token);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            \Illuminate\Support\Facades\Log::warning(
                "Tenant {$this->id}: google_refresh_token failed to decrypt (stale/rotated APP_KEY?). Treating as disconnected.",
                ['tenant_id' => $this->id]
            );
            return false;
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Query Scopes
    // ──────────────────────────────────────────────────────────────────

    /**
     * Billable tenants only: excludes demo and internal/owner/test stores.
     * The single place that decides "is this a real, money-generating store".
     * (Roadmap T1.1 — the root fix for the $52k revenue bug.)
     */
    public function scopeBillable($query)
    {
        return $query->where('is_demo', false)
                     ->where('is_internal', false);
    }



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
        if (!array_key_exists('logo_path', $this->attributes)) {
            return null;
        }
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
     * 4. config/plans.php — ONLY via PlanRepository's fallback when a plan slug
     *    has never been seeded into the plans/plan_limits tables. The seeder
     *    (PlanFeatureMatrixSeeder) is the runtime source of truth.
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
        if (in_array($key, ['transactions_per_month', 'locations', 'sku_limit', 'staff_limit'])) {
            return is_numeric($value) ? (int) $value : null;
        }
        if ($value === '0')         return false;  // feature disabled
        if ($value === '1')         return true;   // feature enabled
        if (is_numeric($value))     return (int) $value;
        return $value;                             // string variant e.g. 'basic', 'advanced'
    }

    /**
     * FAIL-CLOSED (2026-07-03): a plan-gated feature is ON only when its key
     * explicitly resolves to enabled ('1'/true). Previously `!== false` meant
     * any NEW key missing from the seeder defaulted to UNLOCKED for everyone
     * (audit finding D3/VNQ-003). Unknown/unseeded keys are now locked.
     *
     * `recurring_invoices` and `fund_management` also gate on their OWN seeded
     * keys now, instead of silently borrowing `invoice_reminders` /
     * `bank_reconciliation` (the key-mismatch class behind M1-06b/B10).
     */
    private function featureOn(string $key): bool
    {
        return $this->getLimit($key) === true;
    }

    public function featuresArray(): array
    {
        return [
            'variants'            => (bool)$this->feature_variants,
            'serials'             => (bool)$this->feature_serials,
            'batches'             => (bool)$this->feature_batches,
            'manufacturing'       => (bool)$this->feature_manufacturing,
            'production'          => $this->featureOn('production'),
            'bill_of_materials'   => $this->featureOn('bill_of_materials'),
            'e_invoicing'         => $this->featureOn('e_invoicing'),
            'invoice_reminders'   => $this->featureOn('invoice_reminders'),
            'recurring_invoices'  => $this->featureOn('recurring_invoices'),
            'bank_reconciliation' => $this->featureOn('bank_reconciliation'),
            'fund_management'     => $this->featureOn('fund_management'),
            'email_marketing'     => $this->featureOn('marketing_campaigns'),
            'sms_marketing'       => $this->featureOn('marketing_campaigns'),
            'campaigns'           => $this->featureOn('marketing_campaigns'),
            'growth_engine'       => $this->featureOn('growth_engine'),
        ];
    }

    public function effectivePlan(): string
    {
        if ($this->plan !== 'ltd') {
            return $this->plan;
        }
        $txLimit = $this->plan_limits['transactions_per_month'] ?? null;
        if ($txLimit == 1000 || $txLimit == 500) {
            return 'ltd_1';
        } elseif ($txLimit == 3000 || $txLimit == 2000) {
            return 'ltd_2';
        } elseif ($txLimit == 8000 || $txLimit == 6000) {
            return 'ltd_3';
        }
        return 'ltd_1';
    }

    public function setPlanAttribute($value)
    {
        if (is_string($value) && str_starts_with($value, 'ltd_')) {
            $this->attributes['plan'] = 'ltd';
            // 2026-07-03: limits snapshot now comes from the plan_limits table
            // (PlanFeatureMatrixSeeder = the single source of truth), no longer
            // from config/plans.php. PlanRepository falls back to config only
            // if the LTD plan has never been seeded — and logs nothing silently.
            $limits = \App\Services\PlanRepository::getLtdSnapshot($value);
            if (empty($limits)) {
                \Illuminate\Support\Facades\Log::warning(
                    "setPlanAttribute: no seeded limits found for '{$value}' — tenant JSON left empty (fail-closed). Run PlanFeatureMatrixSeeder."
                );
            }
            $this->plan_limits = $limits ?: [];
        } else {
            $this->attributes['plan'] = $value;
        }
    }

    /**
     * Check current usage against plan limits for products, warehouses, and staff.
     */
    public function checkLimitsStatus(): array
    {
        // 1. Products (SKUs)
        $skuLimit = $this->getLimit('sku_limit');
        $skuCount = $skuLimit !== null ? $this->products()->count() : 0;
        $skuExceeded = $skuLimit !== null && $skuCount > $skuLimit;

        // 2. Warehouses (Locations)
        $locationLimit = $this->getLimit('locations');
        $locationCount = 0;
        if ($locationLimit !== null) {
            try {
                $locationCount = \App\Models\Warehouse::count(); // scoped by HasTenant
            } catch (\Throwable) {
                $locationCount = 1;
            }
        }
        $locationExceeded = $locationLimit !== null && $locationCount > $locationLimit;

        // 3. Staff Accounts
        $staffLimit = $this->getLimit('staff_limit');
        $staffCount = 0;
        if ($staffLimit !== null) {
            $staffCount = $this->users()->wherePivot('status', 'active')->count();
        }
        $staffExceeded = $staffLimit !== null && $staffCount > $staffLimit;

        // Determine which feature is exceeded (prioritize SKU, then staff, then locations)
        $exceededFeature = null;
        $currentCount = 0;
        $limit = null;

        if ($skuExceeded) {
            $exceededFeature = 'sku_limit';
            $currentCount = $skuCount;
            $limit = $skuLimit;
        } elseif ($staffExceeded) {
            $exceededFeature = 'staff_limit';
            $currentCount = $staffCount;
            $limit = $staffLimit;
        } elseif ($locationExceeded) {
            $exceededFeature = 'locations';
            $currentCount = $locationCount;
            $limit = $locationLimit;
        }

        return [
            'is_over_limit' => $exceededFeature !== null,
            'exceeded_feature' => $exceededFeature,
            'current_count' => $currentCount,
            'limit' => $limit,
            'grace_ends_at' => $this->limit_grace_ends_at?->toIso8601String(),
        ];
    }
}
