<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PlanRepository
{
    /**
     * Normalize plan slug variations.
     */
    public static function normalizePlanSlug(string $slug): string
    {
        return match (strtolower(trim($slug))) {
            'ltd_tier_1', 'ltd_1', 'ltd1' => 'ltd_1',
            'ltd_tier_2', 'ltd_2', 'ltd2' => 'ltd_2',
            'ltd_tier_3', 'ltd_3', 'ltd3' => 'ltd_3',
            'growth'                      => 'core',
            'business'                    => 'scale',
            'counter'                     => 'solo',
            default                       => strtolower(trim($slug)),
        };
    }

    /**
     * Get all limits for a plan slug as an associative array.
     * Returns: ['sku_limit' => '10000', 'multi_branch' => '0', ...]
     *
     * Values are stored as strings in DB. null = unlimited.
     */
    public static function getLimits(string $planSlug): array
    {
        $planSlug = self::normalizePlanSlug($planSlug);
        $ttl = 3600;

        return Cache::remember("plan_limits:{$planSlug}", $ttl, function () use ($planSlug) {
            /** @var \App\Models\Plan|null $plan */
            $plan = Plan::with('limits')->where('slug', $planSlug)->first();

            if (!$plan || $plan->limits->isEmpty()) {
                // Fallback to config if plan not in DB yet (safe during migration) or limits not seeded
                $configSlug = match ($planSlug) {
                    'scale' => 'business',
                    'core'  => 'growth',
                    default => $planSlug,
                };
                return config("plans.{$planSlug}") ?? config("plans.{$configSlug}", []);
            }

            return $plan->limits->pluck('value', 'key')->toArray();
        });
    }

    /**
     * Build the tenant-level plan_limits JSON snapshot for an LTD tier.
     */
    public static function getLtdSnapshot(string $planSlug): array
    {
        $planSlug = self::normalizePlanSlug($planSlug);
        $shape    = config("plans.{$planSlug}", []);
        $seeded   = self::getLimits($planSlug);

        $snapshot = ['ltd_tier' => $planSlug];
        $keys = array_unique(array_merge(array_keys($shape), array_keys($seeded)));

        foreach ($keys as $key) {
            $value = array_key_exists($key, $seeded) ? $seeded[$key] : ($shape[$key] ?? null);

            $isBoolKey = (isset($shape[$key]) && is_bool($shape[$key])) || $key === 'ltd';
            if ($isBoolKey) {
                $value = ($value !== '0' && $value !== 0 && $value !== false && $value !== 'false' && $value !== null && $value !== '');
            } elseif (is_numeric($value) && $value !== null) {
                $value = (int) $value;
            }

            $snapshot[$key] = $value;
        }

        return $snapshot;
    }

    /**
     * Get effective limit for a specific tenant and key.
     * Priority: tenant override > plan default > null (if explicitly unlimited) > false (fail-closed)
     *
     * Returns the raw stored value (string, null, '0', '1', int, etc.)
     */
    public static function getEffectiveLimit(?int $tenantId, string $planSlug, string $key): mixed
    {
        if (!$tenantId) {
            return false; // Fail closed if no tenant ID
        }

        $normSlug = self::normalizePlanSlug($planSlug);

        if ($normSlug === 'ltd') {
            $t = app()->bound('current.tenant') && app('current.tenant')->id === $tenantId
                ? app('current.tenant')
                : Tenant::withoutGlobalScopes()->find($tenantId);

            if ($t && method_exists($t, 'effectivePlan')) {
                $normSlug = self::normalizePlanSlug($t->effectivePlan());
            }
        }

        // 1. Check for an active, non-expired tenant-level override
        $cacheKey = "tenant_override:{$tenantId}:{$key}";
        $ttl      = 300;

        $override = Cache::remember($cacheKey, $ttl, function () use ($tenantId, $key) {
            $row = TenantPlanOverride::withoutTenantScope()
                ->where('tenant_id', $tenantId)
                ->where('override_key', $key)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->first();

            if ($row === null) {
                return '__NOT_FOUND__';
            }

            return $row->override_value; // may itself be null (= unlimited override)
        });

        if ($override !== '__NOT_FOUND__') {
            return $override; // null here = unlimited override
        }

        // 2. Read from plan limits table or config fallback
        $limits = self::getLimits($normSlug);

        if (array_key_exists($key, $limits)) {
            $val = $limits[$key];
            if ($val === null || $val === '') {
                return null; // explicitly unlimited
            }
            return $val;
        }

        // 3. Check legacy plan_limits JSON column on tenant (for snapshotted LTD accounts)
        $t = app()->bound('current.tenant') && app('current.tenant')->id === $tenantId
            ? app('current.tenant')
            : Tenant::withoutGlobalScopes()->find($tenantId);

        if ($t && is_array($t->plan_limits) && array_key_exists($key, $t->plan_limits)) {
            return $t->plan_limits[$key];
        }

        // 4. Unknown / unseeded feature key: log warning and fail closed
        Log::warning("Unknown or unseeded plan limit key queried: '{$key}' for plan '{$normSlug}'. Denying access (fail-closed).");
        return false;
    }

    /**
     * Invalidate plan limits cache.
     */
    public static function invalidatePlanCache(string $planSlug): void
    {
        $norm = self::normalizePlanSlug($planSlug);
        Cache::forget("plan_limits:{$norm}");
        Cache::forget("all_canonical_feature_keys");
    }

    /**
     * Invalidate tenant overrides and feature map cache.
     */
    public static function invalidateTenantCache(Tenant|int $tenantOrId): void
    {
        $tenantId = $tenantOrId instanceof Tenant ? (int) $tenantOrId->id : (int) $tenantOrId;
        if (!$tenantId) {
            return;
        }

        try {
            $keys = TenantPlanOverride::withoutTenantScope()->where('tenant_id', $tenantId)->pluck('override_key');
            foreach ($keys as $key) {
                Cache::forget("tenant_override:{$tenantId}:{$key}");
            }
        } catch (\Throwable) {
            // Ignore DB errors during cache clearance
        }

        Cache::forget("tenant_features_map:{$tenantId}");
        Cache::forget("tenant_usage_skus:{$tenantId}");
        Cache::forget("tenant_usage_staff:{$tenantId}");
        Cache::forget("tenant_usage_locations:{$tenantId}");
    }

    /**
     * Determine if a tenant is authorized to use a specific plan feature key.
     */
    public static function canUseFeature(Tenant $tenant, string $feature): bool
    {
        $normSlug = self::normalizePlanSlug($tenant->plan ?? 'starter');
        if (str_starts_with($normSlug, 'ltd')) {
            if (in_array($feature, ['smart_capture', 'ai_assistant', 'ai_insights', 'ai_product_descriptions', 'growth_engine'], true)) {
                $hasByok = \Illuminate\Support\Facades\DB::table('settings')
                    ->where('tenant_id', $tenant->id)
                    ->whereIn('key', ['smartcapture_api_key', 'gemini_api_key', 'openai_api_key', 'byok_api_key'])
                    ->whereNotNull('value')
                    ->where('value', '!=', '')
                    ->exists();

                if (!$hasByok && \Illuminate\Support\Facades\Schema::hasTable('ai_settings')) {
                    try {
                        $hasByok = \Illuminate\Support\Facades\DB::table('ai_settings')
                            ->where('tenant_id', $tenant->id)
                            ->where(function ($q) {
                                $q->where(function ($sub) {
                                    $sub->whereNotNull('gemini_api_key')->where('gemini_api_key', '!=', '');
                                })->orWhere(function ($sub) {
                                    $sub->whereNotNull('openai_api_key')->where('openai_api_key', '!=', '');
                                });
                            })->exists();
                    } catch (\Throwable $e) {}
                }

                if (!$hasByok) {
                    return false;
                }
                return true;
            }
        }

        $limit = $tenant->getLimit($feature);

        if ($limit === null || $limit === true || $limit === 'true' || (is_numeric($limit) && (int) $limit > 0)) {
            return true;
        }

        return false;
    }

    /**
     * Get a key-value boolean map of all feature entitlements for the tenant.
     * Used by HandleInertiaRequests to share into the frontend.
     */
    public static function featuresFor(Tenant $tenant): array
    {
        $cacheKey = "tenant_features_map:{$tenant->id}";
        return Cache::remember($cacheKey, 300, function () use ($tenant) {
            $planSlug = $tenant->plan === 'ltd' && method_exists($tenant, 'effectivePlan')
                ? $tenant->effectivePlan()
                : ($tenant->plan ?? 'starter');

            $limits = self::getLimits($planSlug);

            $dbKeys = Cache::remember('all_canonical_feature_keys', 300, function () {
                try {
                    return \Illuminate\Support\Facades\DB::table('plan_limits')->distinct()->pluck('key')->toArray();
                } catch (\Throwable) {
                    return [];
                }
            });

            $configKeys = array_unique(array_merge(array_keys(config('plans.solo', [])), array_keys(config('plans.scale', []))));
            $allKeys = array_unique(array_merge($configKeys, $dbKeys, array_keys($limits)));
            $map = [];

            foreach ($allKeys as $key) {
                $limit = $tenant->getLimit($key);
                $map[$key] = ($limit === true || $limit === null || (is_numeric($limit) && (int)$limit > 0));
            }

            return $map;
        });
    }

    /**
     * Get tenant resource limits for frontend props.
     */
    public static function limitsFor(?Tenant $tenant): array
    {
        if (!$tenant || !$tenant->id) {
            return [];
        }

        return [
            'sku_limit'              => $tenant->getLimit('sku_limit'),
            'staff_limit'            => $tenant->getLimit('staff_limit'),
            'location_limit'         => $tenant->getLimit('locations') ?? $tenant->getLimit('location_limit'),
            'locations'              => $tenant->getLimit('locations'),
            'ai_credits_monthly'     => $tenant->getLimit('ai_credits_monthly'),
            'ai_pages_limit'         => $tenant->getLimit('ai_pages_limit'),
            'ai_queries_limit'       => $tenant->getLimit('ai_queries_limit'),
            'transactions_per_month' => $tenant->getLimit('transactions_per_month'),
        ];
    }
}
