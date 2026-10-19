<?php

namespace App\Services\Builder;

use App\Support\ModuleRouteMap;

/**
 * Can a store on $plan actually USE $module?
 *
 * The builder must never hand over a module whose own front page the plan locks:
 * the owner would see it in their system, open it, and be told to upgrade — the
 * "why did you give me this then?" paradox. A module is usable on a plan when the
 * plan has every plan.feature lock on the module's own nav pages, and every lock
 * that covers at least half of the module's routes. (legacy_gate in modules.php is
 * NOT used: those are retired booleans no route checks any more.)
 *
 * Locks on single deeper pages (one premium report inside a free module) do not
 * count: the module still works, that one page is an upgrade.
 */
class PlanEntitlement
{
    /**
     * Where the builder gives a module for ONE locked part of it. The builder offers
     * marketplace_sync only to connect WooCommerce (config/builder/capabilities.php:
     * "WooCommerce only"), and every WooCommerce page is behind plan.feature:woocommerce;
     * its VenSynQ pages sit behind EnsureVenSynQAccess (vensync_command).
     * Locks written in code instead of on routes: a second warehouse is refused by
     * PlanGate::enforce('multi_branch') in V3\WarehouseController and
     * StockOperationsController, so multi-location and transfers need it too.
     */
    private const ALSO_NEEDS = [
        'marketplace_sync' => ['woocommerce', 'vensync_command'],
        'multi_location'   => ['multi_branch'],
        'stock_transfers'  => ['multi_branch'],
    ];

    /** @var array<string,array<int,string>> module => plan features its front pages need */
    private static ?array $needs = null;

    public static function allows(string $module, ?string $plan): bool
    {
        if ($plan === null || $plan === '' || ! is_array(config("plans.{$plan}"))) {
            return true;   // plan not chosen yet: nothing to hold back
        }
        foreach (self::needs()[$module] ?? [] as $feature) {
            if (! self::planHas($plan, $feature)) {
                return false;
            }
        }

        return true;
    }

    /**
     * For an existing store: the same question, answered exactly as the live gates answer it
     * (PlanGate::check — database plan limits plus any admin override such as a granted add-on).
     */
    public static function allowsTenant(string $module, $tenant): bool
    {
        foreach (self::needs()[$module] ?? [] as $feature) {
            if (! \App\Services\PlanGate::check($feature, $tenant)) {
                return false;
            }
        }

        return true;
    }

    /** Plan-level truth: the database plan limits (what customers get), config only as fallback. */
    private static function planHas(string $plan, string $feature): bool
    {
        $limits = \App\Services\PlanRepository::getLimits($plan);
        if (array_key_exists($feature, $limits)) {
            $v = $limits[$feature];
        } elseif (array_key_exists($feature, (array) config("plans.{$plan}"))) {
            $v = config("plans.{$plan}.{$feature}");
        } else {
            return false;   // PlanGate fails closed on unknown keys; so must we
        }

        return $v === null || $v === true || $v === 'true' || (is_numeric($v) && (int) $v > 0);
    }

    /** The plan key a store is billed on (LTD codes resolve to the plan they unlock). */
    public static function planOf($tenant): ?string
    {
        if (! $tenant) {
            return null;
        }

        return $tenant->plan === 'ltd' && method_exists($tenant, 'effectivePlan') ? $tenant->effectivePlan() : ($tenant->plan ?: null);
    }

    /** Cheapest plan (in config order) on which $module is usable, or null when none is. */
    public static function cheapestPlanFor(string $module): ?string
    {
        foreach (array_keys((array) config('plans')) as $plan) {
            if (! in_array($plan, ['trial', 'custom'], true) && self::allows($module, $plan)) {
                return $plan;
            }
        }

        return null;
    }

    /** @return array<int,string> plan features that $module's front pages need */
    public static function featuresFor(string $module): array
    {
        return self::needs()[$module] ?? [];
    }

    private static function needs(): array
    {
        if (self::$needs !== null) {
            return self::$needs;
        }
        $routeFeatures = [];
        $ownedTotal = [];
        $ownedLocked = [];
        foreach (app('router')->getRoutes() as $r) {
            if (! $r->getName()) {
                continue;
            }
            $features = [];
            foreach ($r->gatherMiddleware() as $m) {
                if (is_string($m) && str_starts_with($m, 'plan.feature:')) {
                    $features[] = substr($m, 13);
                }
            }
            $routeFeatures[$r->getName()] = $features;
            foreach (ModuleRouteMap::ownersOf($r->getName()) as $owner) {
                $ownedTotal[$owner] = ($ownedTotal[$owner] ?? 0) + 1;
                foreach ($features as $feature) {
                    $ownedLocked[$owner][$feature] = ($ownedLocked[$owner][$feature] ?? 0) + 1;
                }
            }
        }
        $out = [];
        foreach ((array) config('modules') as $key => $def) {
            if (! is_array($def)) {
                continue;
            }
            $f = [];
            // Its front page is locked…
            foreach ((array) ($def['nav'] ?? []) as $nav) {
                foreach ($routeFeatures[$nav['route'] ?? ''] ?? [] as $feature) {
                    $f[] = $feature;
                }
            }
            // …or most of what it does is (an open menu page in front of locked work).
            foreach ($ownedLocked[$key] ?? [] as $feature => $n) {
                if ($n * 2 >= ($ownedTotal[$key] ?? PHP_INT_MAX)) {
                    $f[] = $feature;
                }
            }
            $f = array_merge($f, self::ALSO_NEEDS[$key] ?? []);
            if ($f) {
                $out[$key] = array_values(array_unique($f));
            }
        }

        return self::$needs = $out;
    }

    /** Tests flip config; let them reset the cache. */
    public static function flush(): void
    {
        self::$needs = null;
        ModuleRouteMap::flush();
    }
}
