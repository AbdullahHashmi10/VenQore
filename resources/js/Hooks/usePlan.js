import { usePage } from '@inertiajs/react';

export function usePlan() {
    const { plan } = usePage().props;

    const hasFeature = (featureKey) => {
        if (!plan || !plan.features) return true;
        return Boolean(plan.features[featureKey]);
    };

    const isWithinLimit = (limitKey) => {
        if (!plan || !plan.limits || !plan.usage) return true;
        const limit = plan.limits[limitKey];
        if (limit === -1 || limit === null || limit === undefined) return true;

        const usageKey = limitKey.replace('_limit', 's');
        const currentUsage = plan.usage[usageKey] ?? plan.usage[limitKey] ?? 0;
        return currentUsage < limit;
    };

    return {
        plan,
        hasFeature,
        isWithinLimit,
    };
}
