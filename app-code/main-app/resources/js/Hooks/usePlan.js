import { usePage } from '@inertiajs/react';

const NEAR_LIMIT_THRESHOLD = 0.80;
const CRITICAL_THRESHOLD = 0.95;

export function usePlan() {
    const { props } = usePage();
    const plan = props.plan || {};
    const store = props.store || {};
    const features = plan.features || store.features || {};
    const limits = plan.limits || store.limits || {};
    const usage = plan.usage || {};

    const hasFeature = (featureKey) => {
        if (Object.prototype.hasOwnProperty.call(features, featureKey)) {
            return Boolean(features[featureKey]);
        }
        return false;
    };

    const isWithinLimit = (limitKey, currentCount = null) => {
        const limitVal = limits[limitKey];
        if (limitVal === null || limitVal === undefined) {
            return true; // unlimited
        }

        const count = currentCount !== null ? currentCount : (usage[limitKey] || 0);
        return count < limitVal;
    };

    const usageStatus = (usageBucket) => {
        const limitVal = limits[usageBucket];
        if (limitVal === null || limitVal === undefined || limitVal === 0) {
            return 'ok';
        }

        const count = usage[usageBucket] || 0;
        const ratio = count / limitVal;

        if (ratio >= CRITICAL_THRESHOLD) return 'critical';
        if (ratio >= NEAR_LIMIT_THRESHOLD) return 'warning';
        return 'ok';
    };

    return {
        plan,
        store,
        features,
        limits,
        usage,
        hasFeature,
        isWithinLimit,
        usageStatus,
    };
}

export default usePlan;
