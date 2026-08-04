<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\TenantPlanOverride;
use Illuminate\Support\Facades\Cache;

class PlanRepository
{
    /**
     * Get all limits for a plan slug as an associative array.
     * Returns: ['transactions_per_month' => '2000', 'sku_limit' => null, 'woocommerce' => '0', ...]
     *
     * Values are stored as strings in DB. null = unlimited.
     * Callers must cast appropriately (PlanGate handles this via Tenant::getLimit()).
     */
    public static function getLimits(string $planSlug): array
    {
        $ttl = 3600;

        return Cache::remember("plan_limits:{$planSlug}", $ttl, function () use ($planSlug) {
            /** @var \App\Models\Plan|null $plan */
            $plan = Plan::with('limits')->where('slug', $planSlug)->first();

            if (!$plan || $plan->limits->isEmpty()) {
                // Fallback to config if plan not in DB yet (safe during migration) or limits not seeded
                return config("plans.{$planSlug}", []);
            }

            return $plan->limits->pluck('value', 'key')->toArray();
        });
    }

    /**
     * Build the tenant-level plan_limits JSON snapshot for an LTD tier
     * (e.g. 'ltd_1', 'ltd_2', 'ltd_3').
     *
     * Session-3 fix (VNQ-011 follow-up): setPlanAttribute() and
     * AppSumoController::redeem() used to snapshot getLimits($tier)
     * verbatim. That table now holds the FULL ~150-key feature matrix
     * (PlanFeatureMatrixSeeder) — richer than config/plans.php's ~23-key
     * LTD sections, which is correct for `Tenant::getLimit()` reads that
     * go through the plan_limits table directly. But two things the table
     * was never meant to track live only in config: `ltd` (a license
     * marker, not a plan feature) and `hosted_until` (a relative hosting
     * offset). A verbatim table snapshot silently drops both.
     *
     * The fix: use config's key list as the snapshot's SHAPE (which keys
     * matter enough to need a tenant-level snapshot at all), but prefer
     * the seeded table's VALUE for every key the table actually tracks —
     * falling back to config's own value only for the license-bookkeeping
     * keys the table doesn't track. The table remains the value source of
     * truth for every real plan-feature key; config keeps exactly one job
     * left (per its own header comment): defining that key list.
     */
    public static function getLtdSnapshot(string $planSlug): array
    {
        $shape  = config("plans.{$planSlug}", []);
        $seeded = self::getLimits($planSlug);

        $snapshot = [];
        foreach ($shape as $key => $configValue) {
            $value = array_key_exists($key, $seeded) ? $seeded[$key] : $configValue;
            
            if (is_bool($configValue)) {
                $value = ($value !== '0' && $value !== 0 && $value !== false && $value !== 'false');
            } elseif (is_int($configValue) && $value !== null) {
                $value = (int) $value;
            }
            
            $snapshot[$key] = $value;
        }

        return $snapshot;
    }

    /**
     * Get effective limit for a specific tenant and key.
     * Priority: tenant override > plan default > null (unlimited fallback)
     *
     * Returns the raw stored value (string, null, '0', '1', 'basic', etc.)
     * Tenant::getLimit() handles the type casting.
     */
    public static function getEffectiveLimit(?int $tenantId, string $planSlug, string $key): mixed
    {
        if (!$tenantId) {
            return null;
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

            // Return a sentinel string if no override found, so Cache::remember
            // distinguishes "override = null (unlimited)" from "no override found".
            if ($row === null) {
                return '__NOT_FOUND__';
            }

            return $row->override_value; // may itself be null (= unlimited override)
        });

        if ($override !== '__NOT_FOUND__') {
            return $override; // null here = unlimited override
        }

        // 2. Fall back to plan default from DB
        $limits = self::getLimits($planSlug);
        return $limits[$key] ?? null;
    }

    /**
     * Invalidate plan limits cache.
     * Call whenever a plan or its limits are edited from SuperAdmin.
     */
    public static function invalidatePlanCache(string $planSlug): void
    {
        Cache::forget("plan_limits:{$planSlug}");
    }

    /**
     */
    public static function invalidateTenantCache(int $tenantId): void
    {
        $keys = TenantPlanOverride::withoutTenantScope()->where('tenant_id', $tenantId)->pluck('override_key');
        foreach ($keys as $key) {
            Cache::forget("tenant_override:{$tenantId}:{$key}");
        }
        Cache::forget("tenant_features_map:{$tenantId}:*");
    }

    /**
     * Determine if a tenant is authorized to use a specific plan feature key.
     */
    public static function canUseFeature(\App\Models\Tenant $tenant, string $feature): bool
    {
        // Special T3-3 Cookbook on Counter rule for food-prep industries
        if ($feature === 'recipes' || $feature === 'bill_of_materials') {
            if ($tenant->plan === 'counter') {
                $foodPrepIndustries = [
                    'cafe', 'restaurant', 'bakery', 'juice_tea_shop',
                    'food_truck', 'cloud_kitchen', 'sweets_mithai', 'ice_cream_parlour'
                ];
                $industry = strtolower(trim((string)($tenant->industry ?? $tenant->industry_type ?? $tenant->business_type ?? '')));
                if (in_array($industry, $foodPrepIndustries, true)) {
                    return true;
                }
            }
        }

        $val = self::getEffectiveLimit($tenant->id, $tenant->plan ?? 'starter', $feature);

        if ($val === null) {
            return false; // Default deny per T2-2
        }

        return ($val === '1' || $val === 1 || $val === true || $val === 'true' || $val === '-1' || $val === -1);
    }

    /**
     * Get a key-value boolean map of all feature entitlements for the tenant.
     */
    public static function featuresFor(\App\Models\Tenant $tenant): array
    {
        $cacheKey = "tenant_features_map:{$tenant->id}:{$tenant->plan}";
        return Cache::remember($cacheKey, 300, function () use ($tenant) {
            $rawLimits = self::getLimits($tenant->plan ?? 'starter');
            $map = [];
            foreach ($rawLimits as $key => $val) {
                $map[$key] = self::canUseFeature($tenant, $key);
            }
            return $map;
        });
    }

    /**
     * Get tenant resource limits for frontend props.
     */
    public static function limitsFor(?\App\Models\Tenant $tenant): array
    {
        if (!$tenant || !$tenant->id) {
            return [];
        }

        $limits = [];
        foreach (['sku_limit', 'staff_limit', 'location_limit', 'locations', 'ai_pages_limit', 'ai_queries_limit'] as $key) {
            $val = self::getEffectiveLimit($tenant->id, $tenant->plan ?? 'starter', $key);
            if ($val !== null) {
                $limits[$key] = (int) $val;
                if ($key === 'locations') {
                    $limits['location_limit'] = (int) $val;
                }
            } else {
                $limits[$key] = 0;
            }
        }
        return $limits;
    }
}

