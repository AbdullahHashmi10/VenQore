<?php

namespace App\Services;

use App\Exceptions\PlanLimitException;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

/**
 * PlanGate — Subscription Enforcement Layer (V6 Spec)
 *
 * The single gateway for all subscription gating, capability fences,
 * and quantity cap enforcement across the entire application.
 *
 * Usage:
 *   // Boolean feature check
 *   if (!PlanGate::check('multi_branch')) { ... }
 *
 *   // Quantity cap check
 *   if (!PlanGate::check('sku_limit', $currentSkuCount)) { ... }
 *
 *   // Enforce (throws PlanLimitException if denied/exceeded)
 *   PlanGate::enforce('locations', Warehouse::count());
 *   PlanGate::enforce('multi_branch');
 */
class PlanGate
{
    /**
     * Check if a feature or limit is available for the current tenant.
     *
     * Rules:
     * - Fail closed: no tenant -> false
     * - God Admin / platform routes bypass -> true
     * - null limit -> true (unlimited / granted)
     * - false / '0' / 0 -> false (denied)
     * - true / '1' / 1 -> true (granted)
     * - numeric limit -> if $currentCount !== null, return $currentCount < limit; else true
     *
     * @param  string    $feature
     * @param  int|null  $currentCount
     * @return bool
     */
    /**
     * Check if a feature or limit is available for the given or current tenant.
     *
     * Rules:
     * - Fail closed: no tenant -> false
     * - God Admin / platform routes bypass -> true
     * - null limit -> true (unlimited / granted)
     * - false / '0' / 0 -> false (denied)
     * - true / '1' / 1 -> true (granted)
     * - numeric limit -> if $currentCount !== null, return $currentCount < limit; else true
     *
     * @param  string              $feature
     * @param  Tenant|int|null     $currentCountOrTenant
     * @param  Tenant|null         $explicitTenant
     * @return bool
     */
    public static function check(string $feature, Tenant|int|null $currentCountOrTenant = null, ?Tenant $explicitTenant = null): bool
    {
        $currentCount = is_int($currentCountOrTenant) ? $currentCountOrTenant : null;
        $tenant = $explicitTenant ?? ($currentCountOrTenant instanceof Tenant ? $currentCountOrTenant : self::tenant());

        if (!$tenant) {
            return false; // fail CLOSED
        }

        if (self::isPlatformContext()) {
            return true; // God Admin / platform staff bypass
        }

        $limit = $tenant->getLimit($feature);

        if ($limit === null) {
            $plan = $tenant->plan === 'ltd' && method_exists($tenant, 'effectivePlan')
                ? $tenant->effectivePlan()
                : ($tenant->plan ?? 'starter');
            $planConfig = config("plans.{$plan}", config('plans.starter', []));
            if (!array_key_exists($feature, $planConfig)) {
                \Illuminate\Support\Facades\Log::warning("Unknown or unseeded plan limit key queried: '{$feature}' for plan '{$plan}'. Denying access (fail-closed).");
                return false;
            }
            return true;
        }
        if ($limit === false || $limit === 'false') return false;
        if ($limit === true  || $limit === 'true')  return true;

        if (is_numeric($limit)) {
            if ($currentCount !== null) return (int) $currentCount < (int) $limit;
            return (int) $limit > 0;
        }
        return !empty($limit);
    }

    /**
     * Enforce a plan limit or feature gate. Throws PlanLimitException on denial.
     *
     * @param  string          $feature
     * @param  Tenant|int|null $currentCountOrTenant
     * @param  Tenant|null     $explicitTenant
     * @throws PlanLimitException
     */
    public static function enforce(string $feature, Tenant|int|null $currentCountOrTenant = null, ?Tenant $explicitTenant = null): void
    {
        $currentCount = is_int($currentCountOrTenant) ? $currentCountOrTenant : null;
        $tenant = $explicitTenant ?? ($currentCountOrTenant instanceof Tenant ? $currentCountOrTenant : self::tenant());

        if (!self::check($feature, $currentCount, $tenant)) {
            $limit = self::getLimit($feature, $tenant);
            throw new PlanLimitException($feature, $currentCount, $limit);
        }
    }

    /**
     * Return the effective limit for a feature (null = unlimited, false = disabled, int = cap).
     *
     * @param  string      $feature
     * @param  Tenant|null $explicitTenant
     * @return mixed
     */
    public static function getLimit(string $feature, ?Tenant $explicitTenant = null): mixed
    {
        $tenant = $explicitTenant ?? self::tenant();
        return $tenant ? $tenant->getLimit($feature) : false;
    }

    /**
     * Resolve the active tenant from context.
     */
    public static function tenant(): ?Tenant
    {
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            if ($tenant instanceof Tenant && !is_null($tenant->id)) {
                return $tenant;
            }
        }

        $user = auth()->user();
        if ($user && $user->last_store_id) {
            $tenant = Tenant::find($user->last_store_id);
            if ($tenant) {
                return $tenant;
            }
        }

        return null;
    }

    /**
     * Determine if current execution is in a platform admin / God Admin context.
     */
    public static function isPlatformContext(): bool
    {
        $user = auth()->user();
        if (!$user) {
            return false;
        }

        return (bool) ($user->is_platform_admin || (method_exists($user, 'isPlatformStaff') && $user->isPlatformStaff()));
    }
}
