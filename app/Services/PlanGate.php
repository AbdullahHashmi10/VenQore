<?php

namespace App\Services;

use App\Exceptions\PlanLimitException;

/**
 * PlanGate — Phase 4.2
 *
 * The subscription enforcement layer. All plan checks flow through here.
 * Never check plan limits inline in controllers — always use this service.
 *
 * Usage:
 *   // Check (returns bool)
 *   if (!PlanGate::check('woocommerce')) { ... }
 *
 *   // Enforce (throws PlanLimitException if over limit)
 *   PlanGate::enforce('sku_limit', Product::count());
 *   PlanGate::enforce('woocommerce');
 */
class PlanGate
{
    /**
     * Check if a feature/limit is available for the current tenant.
     *
     * @param  string    $feature      Config key from config/plans.php
     * @param  int|null  $currentCount Current usage count (for numeric limits)
     * @return bool
     */
    public static function check(string $feature, ?int $currentCount = null): bool
    {
        $tenant = app('current.tenant');
        $limit  = $tenant->getLimit($feature);

        // null = unlimited — always allowed
        if ($limit === null) {
            return true;
        }

        // false = feature disabled for this plan
        if ($limit === false) {
            return false;
        }

        // Numeric cap — check current usage
        if (is_int($limit) && $currentCount !== null) {
            return $currentCount < $limit;
        }

        // String flags (e.g., 'basic' | 'advanced') — just truthy check
        if (is_string($limit)) {
            return !empty($limit);
        }

        return (bool) $limit;
    }

    /**
     * Enforce a plan limit. Throws PlanLimitException if the check fails.
     * Use this in controller store/update actions to block over-limit requests.
     *
     * @param  string    $feature
     * @param  int|null  $currentCount
     * @throws PlanLimitException
     */
    public static function enforce(string $feature, ?int $currentCount = null): void
    {
        if (!self::check($feature, $currentCount)) {
            throw new PlanLimitException($feature, $currentCount);
        }
    }

    /**
     * Return the numeric limit for a feature (null = unlimited).
     * Useful for displaying "You've used X of Y" in the UI.
     */
    public static function getLimit(string $feature): mixed
    {
        return app('current.tenant')->getLimit($feature);
    }
}
