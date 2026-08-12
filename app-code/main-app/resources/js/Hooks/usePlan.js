import { usePage } from '@inertiajs/react';

// Matches the backend thresholds in PlanUsageController::usage() —
// near_limit at 80%, critical at 95%. Keep these two in sync.
const NEAR_LIMIT_THRESHOLD = 0.80;
const CRITICAL_THRESHOLD = 0.95;

export function usePlan() {
    const { plan, store } = usePage().props;
    const features = plan?.features ?? store?.features ?? {};

    const hasFeature = (featureKey) => {
        if (!plan && !store) return true; // Default allow for public marketing routes
        return Boolean(features[featureKey]);
    };

    const isWithinLimit = (limitKey) => {
        if (!plan || !plan.limits || !plan.usage) return true;
        const limit = plan.limits[limitKey];
        if (limit === -1 || limit === null || limit === undefined) return true;

        const usageKey = limitKey.replace('_limit', 's');
        const currentUsage = plan.usage[usageKey] ?? plan.usage[limitKey] ?? 0;
        return currentUsage < limit;
    };

    /**
     * Threshold status for a usage bucket (e.g. 'products', 'staff',
     * 'warehouses', 'transactions') as reported by GET /api/plan/usage.
     * Prefers the server-computed near_limit/critical/at_limit flags when
     * present (usage prop shape from PlanUsageController), and falls back
     * to computing from used/limit for callers passing raw plan.usage data.
     *
     * Returns one of: 'ok' | 'near' | 'critical' | 'at_limit'
     */
    const usageStatus = (usageBucket) => {
        if (!usageBucket || usageBucket.unlimited) return 'ok';

        if (usageBucket.at_limit) return 'at_limit';
        if (typeof usageBucket.critical === 'boolean') {
            if (usageBucket.critical) return 'critical';
            if (usageBucket.near_limit) return 'near';
            return 'ok';
        }

        // Fallback: compute from used/limit directly (80%/95%)
        const { used, limit } = usageBucket;
        if (limit === null || limit === undefined) return 'ok';
        const pct = limit > 0 ? used / limit : 0;
        if (pct >= 1) return 'at_limit';
        if (pct >= CRITICAL_THRESHOLD) return 'critical';
        if (pct >= NEAR_LIMIT_THRESHOLD) return 'near';
        return 'ok';
    };

    return {
        plan,
        hasFeature,
        isWithinLimit,
        usageStatus,
    };
}
