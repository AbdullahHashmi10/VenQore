<?php

namespace App\Services;

use App\Http\Controllers\StoreController;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\StoreLicense;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Support\PlanCatalog;
use Database\Seeders\TenantDefaultSeeder;
use Illuminate\Support\Facades\DB;

/**
 * The ONE place a store (tenant) is created — 11 Sep 2026.
 *
 * Before this, the builder (WorkspaceBuilderController) and the store form
 * (StoreController) each built a tenant their own way: different slugs,
 * currency (always PKR on one), timezone (always Asia/Karachi on one), trial
 * plan, license bookkeeping and seeding. Both now call create(), so every
 * store gets the same defaults whichever door the owner came in through.
 *
 * $data keys (all optional except name):
 *   name, currency, timezone (IANA, from the browser), country (ISO-2),
 *   phone, business_type (a config/business_types.php key — drives modules
 *   and terminology), preset_key, modules (array → applied through the
 *   builder's single writer; null → leave module config untouched), plan (self-serve plan the
 *   owner intends to keep after the trial), interval, setup_completed,
 *   license_source (source recorded on a fresh trial license).
 */
class StoreProvisioner
{
    /** Receipt symbols per currency. The builder's currency list shows the same. */
    public const CURRENCY_SYMBOLS = [
        'USD' => '$', 'PKR' => 'Rs.', 'AED' => 'AED', 'GBP' => '£', 'EUR' => '€',
        'SAR' => 'SAR', 'CAD' => 'C$', 'AUD' => 'A$', 'INR' => '₹',
    ];

    private const COUNTRY_CURRENCY = [
        'PK' => 'PKR', 'AE' => 'AED', 'SA' => 'SAR', 'GB' => 'GBP', 'IN' => 'INR',
        'CA' => 'CAD', 'AU' => 'AUD', 'US' => 'USD',
        'DE' => 'EUR', 'FR' => 'EUR', 'IT' => 'EUR', 'ES' => 'EUR', 'NL' => 'EUR',
        'IE' => 'EUR', 'BE' => 'EUR', 'AT' => 'EUR', 'PT' => 'EUR', 'FI' => 'EUR', 'GR' => 'EUR',
    ];

    public const TRIAL_DAYS = 14;

    public static function defaultCurrencyFor(?string $country): string
    {
        return self::COUNTRY_CURRENCY[strtoupper((string) $country)] ?? 'USD';
    }

    /**
     * Browser timezone when valid; otherwise the country's zone when it has
     * exactly one; otherwise UTC (the column default). Never a hard-coded city.
     */
    public static function resolveTimezone(?string $timezone, ?string $country): string
    {
        $timezone = trim((string) $timezone);
        if ($timezone !== '' && in_array($timezone, \DateTimeZone::listIdentifiers(), true)) {
            return $timezone;
        }

        $cc = strtoupper((string) $country);
        if (strlen($cc) === 2) {
            try {
                $zones = \DateTimeZone::listIdentifiers(\DateTimeZone::PER_COUNTRY, $cc);
                if (count($zones) === 1) {
                    return $zones[0];
                }
            } catch (\Throwable) {
                // unknown country code
            }
        }

        return 'UTC';
    }

    /**
     * AppSumo store-count ceiling. Returns a user-facing error when the owner
     * is already at their limit, or null when another store is allowed.
     */
    public static function storeLimitError(User $user): ?string
    {
        $appsumoLicense = StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->whereIn('status', ['available', 'consumed'])
            ->where('source', 'appsumo')
            ->orderByDesc('created_at')
            ->first();

        if (!$appsumoLicense) {
            return null;
        }

        $storeLimits = [
            'ltd_1' => 1, 'ltd_2' => 2, 'ltd_3' => 5,
            // license-tier namespace (pre-fix AppSumo rows) — not subscription slugs
            'starter' => 1, 'growth' => 2, 'business' => 5,
        ];
        $storeLimit = $storeLimits[$appsumoLicense->plan] ?? 1;

        $owned = TenantUser::where('user_id', $user->id)->where('role', 'owner')->count();

        return $owned >= $storeLimit
            ? "Your AppSumo plan allows a maximum of {$storeLimit} store(s). Stack another code to unlock more stores."
            : null;
    }

    /**
     * Store names are unique (the slug is the store's address). Returns a
     * user-facing error when $name collides, or null. Blank names are not
     * checked — they become "My Business" with an auto-suffixed slug.
     */
    public static function nameError(?User $user, ?string $name): ?string
    {
        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        $baseSlug = \Illuminate\Support\Str::slug($name) ?: 'store';
        if (strlen($baseSlug) < 3) {
            $baseSlug .= '-store';
        }

        $existing = Tenant::withTrashed()->where('slug', $baseSlug)->first();
        if (!$existing) {
            return null;
        }

        $wasOwner = $user && TenantUser::where('tenant_id', $existing->id)
            ->where('user_id', $user->id)
            ->where('role', 'owner')
            ->exists();

        if ($existing->trashed()) {
            return $wasOwner
                ? 'This store was previously deleted by you. Please contact support to reopen it.'
                : 'This store name is already taken. Please choose a unique store name.';
        }

        return $wasOwner
            ? 'You already have an active store with this name.'
            : ($user
                ? 'This store name is already in use by another account. Please choose a unique store name.'
                : 'This store name is already taken. Please choose a unique store name.');
    }

    /** The license a new store would claim, if the user holds one. */
    public static function availableLicense(User $user): ?StoreLicense
    {
        return StoreLicense::withoutTenantScope()
            ->where('user_id', $user->id)
            ->where('status', 'available')
            ->first();
    }

    public function create(User $user, array $data): Tenant
    {
        $name = trim((string) ($data['name'] ?? '')) ?: 'My Business';
        $idempotencyKey = $data['idempotency_key'] ?? null;

        if ($idempotencyKey) {
            $existingId = \Illuminate\Support\Facades\Cache::get('provision_idem:' . $user->id . ':' . $idempotencyKey);
            if ($existingId && ($existingTenant = Tenant::find($existingId))) {
                return $existingTenant;
            }
        }

        $recentTenant = Tenant::where('name', $name)
            ->where('created_at', '>=', now()->subSeconds(60))
            ->whereHas('users', fn($q) => $q->where('users.id', $user->id)->where('role', 'owner'))
            ->first();
        if ($recentTenant) {
            return $recentTenant;
        }

        return DB::transaction(function () use ($user, $data, $name, $idempotencyKey) {
            $country  = strtoupper((string) ($data['country'] ?? ''));
            $interval = ($data['interval'] ?? 'monthly') === 'annual' ? 'annual' : 'monthly';

            $currencyCode = strtoupper(trim((string) ($data['currency'] ?? ''))) ?: self::defaultCurrencyFor($country);
            $presets      = config('ai_builder.presets', []);
            $typeKey      = \App\Support\BusinessTypes::exists($data['business_type'] ?? null) ? (string) $data['business_type'] : null;
            $presetKey    = $typeKey ? \App\Support\BusinessTypes::presetFor($typeKey) : ($data['preset_key'] ?? null);
            $presetOk     = $presetKey && isset($presets[$presetKey]) && empty($presets[$presetKey]['blocked_by']);
            // tenants.business_type holds the catalogue key when there is one
            // (readers resolve it to a preset via BusinessTypes::presetFor()).
            $businessType = $typeKey ?: ($presetOk ? $presetKey : null);

            // ── License or trial ──────────────────────────────────────────────
            $license = StoreLicense::withoutTenantScope()
                ->where('user_id', $user->id)
                ->where('status', 'available')
                ->lockForUpdate()
                ->first();

            $plan        = $license ? $license->plan : 'trial';
            $trialDays   = $license ? (optional(Plan::where('slug', $plan)->first())->trial_days ?? self::TRIAL_DAYS) : self::TRIAL_DAYS;
            $trialEndsAt = now()->addDays($trialDays);

            $attributes = [
                'name'              => $name,
                'slug'              => SubdomainGenerator::generate($name),
                'plan'              => $plan,
                'status'            => 'trial',
                'trial_ends_at'     => $trialEndsAt,
                'join_code'         => Tenant::generateJoinCode(),
                'currency_code'     => $currencyCode,
                'currency_symbol'   => self::CURRENCY_SYMBOLS[$currencyCode] ?? $currencyCode,
                'timezone'          => self::resolveTimezone($data['timezone'] ?? null, $country),
                'industry'          => 'retail',
                'business_type'     => $businessType,
                'setup_completed'   => (bool) ($data['setup_completed'] ?? false),
                'onboarding_step'   => !empty($data['setup_completed']) ? 'completed' : null,
                'terms_accepted_at' => now(),
                'terms_version'     => 'v4.0',
            ];
            if ($attributes['onboarding_step'] === null) {
                unset($attributes['onboarding_step']);
            }

            // Gift access: a real paid window, not a trial.
            if ($license && $license->source === 'gift' && $license->valid_until) {
                $attributes['status']               = 'active';
                $attributes['trial_ends_at']        = null;
                $attributes['subscription_ends_at'] = $license->valid_until;
            }

            // Billing intent: what the owner means to keep after the trial.
            $intended = PlanCatalog::canonical($data['plan'] ?? null);
            if (!$license && PlanCatalog::isSelfServe($intended)) {
                $pricing = StoreController::resolvePricing(Plan::where('slug', $intended)->first(), $intended, $country ?: 'US');
                $attributes['plan_limits'] = [
                    'billing_intent' => [
                        'plan'        => $intended,
                        'interval'    => $interval,
                        'amount'      => $interval === 'annual' ? $pricing['annual_total'] : $pricing['monthly'],
                        'currency'    => $country === 'PK' ? 'PKR' : 'USD',
                        'cadence'     => $interval === 'annual' ? 'year' : 'month',
                        'charge_on'   => $trialEndsAt->toIso8601String(),
                        'selected_at' => now()->toIso8601String(),
                    ],
                ];
            }

            $tenant = Tenant::create($attributes);

            TenantUser::create([
                'tenant_id'    => $tenant->id,
                'user_id'      => $user->id,
                'role'         => 'owner',
                'status'       => 'active',
                'display_name' => $user->name,
                'joined_at'    => now(),
            ]);

            if ($license) {
                $license->update([
                    'tenant_id'   => $tenant->id,
                    'status'      => 'consumed',
                    'consumed_at' => now(),
                ]);
            } else {
                StoreLicense::create([
                    'user_id'     => $user->id,
                    'tenant_id'   => $tenant->id,
                    'type'        => 'trial',
                    'status'      => 'consumed',
                    'plan'        => 'trial',
                    'source'      => $data['license_source'] ?? 'registration',
                    'consumed_at' => now(),
                    'valid_until' => $trialEndsAt,
                ]);
            }

            $user->update(['last_store_id' => $tenant->id]);

            if (!empty($data['phone'])) {
                Setting::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'key' => 'store_phone'],
                    ['value' => (string) $data['phone']]
                );
            }

            try {
                PlanAiAllowance::applyTo($tenant, $tenant->plan);
            } catch (\Throwable $e) {
                report($e);
            }

            // Module set from the builder, through its single writer.
            // Distinguish missing modules (default to preset) from explicit modules array (even if empty)
            $hasExplicitModules = array_key_exists('modules', $data);
            if (!$hasExplicitModules) {
                $modules = $businessType
                    ? \App\Support\BusinessTypes::modulesFor($businessType)
                    : ['products', 'pos', 'inventory', 'expenses', 'reports'];
                $modules = \App\Support\BusinessTypes::withDependencies($modules);
            } else {
                $rawModules = is_array($data['modules']) ? $data['modules'] : [];
                $modules = array_values(array_intersect($rawModules, array_keys(config('modules', []))));
            }

            // BL-06: Filter to live modules only
            $modules = array_values(array_filter($modules, function ($key) {
                return (config("modules.{$key}.status") ?? 'live') === 'live';
            }));

            if ($idempotencyKey) {
                \Illuminate\Support\Facades\Cache::put('provision_idem:' . $user->id . ':' . $idempotencyKey, $tenant->id, 300);
            }

            // Terminology from the catalogue: the store talks the way the
            // trade does ("Clients", "Jobs", "Plumbers") from minute one.
            app(\App\Services\AiBuilder\ApplyConfigurationService::class)->apply(
                $tenant,
                [
                    'modules'     => $modules,
                    'terminology' => $businessType ? \App\Support\BusinessTypes::termsFor($businessType) : [],
                ],
                'preset',
                'Selected during workspace provisioning.'
            );

            // Chart of accounts, warehouse, cash account, expense categories,
            // settings, terminology. Idempotent. Must run after ApplyConfigurationService
            // so dashboard card seeding can filter against enabled modules.
            TenantDefaultSeeder::seedFor($tenant);

            try {
                app()->instance('current.tenant', $tenant);
                app(\App\Http\Controllers\Api\DashboardController::class)->createDefaultDashboard($user, $tenant);
            } catch (\Throwable $e) {
                report($e);
            }

            return $tenant;
        });
    }
}
