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
        return Cache::remember("plan_limits:{$planSlug}", 3600, function () use ($planSlug) {
            /** @var \App\Models\Plan|null $plan */
            $plan = Plan::with('limits')->where('slug', $planSlug)->first();

            if (!$plan) {
                // Fallback to config if plan not in DB yet (safe during migration)
                return config("plans.{$planSlug}", []);
            }

            return $plan->limits->pluck('value', 'key')->toArray();
        });
    }

    /**
     * Get effective limit for a specific tenant and key.
     * Priority: tenant override > plan default > null (unlimited fallback)
     *
     * Returns the raw stored value (string, null, '0', '1', 'basic', etc.)
     * Tenant::getLimit() handles the type casting.
     */
    public static function getEffectiveLimit(int $tenantId, string $planSlug, string $key): mixed
    {
        // 1. Check for an active, non-expired tenant-level override
        $cacheKey = "tenant_override:{$tenantId}:{$key}";

        $override = Cache::remember($cacheKey, 300, function () use ($tenantId, $key) {
            $row = TenantPlanOverride::where('tenant_id', $tenantId)
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
     * Invalidate all active overrides for a specific tenant.
     * Call whenever a tenant override is applied or removed.
     */
    public static function invalidateTenantCache(int $tenantId): void
    {
        $keys = TenantPlanOverride::where('tenant_id', $tenantId)->pluck('override_key');
        foreach ($keys as $key) {
            Cache::forget("tenant_override:{$tenantId}:{$key}");
        }
    }
}
