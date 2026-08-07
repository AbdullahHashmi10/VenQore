import { usePage } from '@inertiajs/react';

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

    return {
        plan,
        hasFeature,
        isWithinLimit,
    };
}
