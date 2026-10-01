import { usePage } from '@inertiajs/react';

/**
 * useEntitlement Hook — V6 Presentation Gating Contract
 *
 * Frontend presentation layer reading entitlements shared via Inertia.
 * Note: Frontend is presentation only; backend PlanGate and middleware enforce security.
 *
 * Lock states:
 *   1. 'open'              — Plan includes capability & within limits
 *   2. 'preview_locked'    — Capability fenced on higher tier
 *   3. 'limit_blocked'     — Has capability, but hit numeric quantity limit
 *   4. 'metered_stopped'   — AI credits or metered allowance exhausted
 *   5. 'archived_readonly' — Access frozen after downgrade / grace expired
 */
export function useEntitlement() {
    const { props } = usePage();
    const plan = props.plan || {};
    const store = props.store || {};
    const features = plan.features || store.features || {};
    const limits = plan.limits || store.limits || {};
    const usage = plan.usage || {};

    const currentPlan = plan.slug || store.plan || 'starter';

    /**
     * Check if a feature is enabled on the current plan.
     */
    const can = (featureKey) => {
        if (Object.prototype.hasOwnProperty.call(features, featureKey)) {
            return Boolean(features[featureKey]);
        }
        return false;
    };

    /**
     * Get numeric or configuration limit for a key (null = unlimited).
     */
    const getLimit = (limitKey) => {
        if (Object.prototype.hasOwnProperty.call(limits, limitKey)) {
            return limits[limitKey];
        }
        return null;
    };

    /**
     * Determine lock state for a given feature or limit.
     */
    const getLockState = (featureKey, currentCount = null) => {
        if (store.status === 'expired' || store.status === 'cancelled') {
            return 'archived_readonly';
        }

        const isFeatureGranted = can(featureKey);
        if (!isFeatureGranted) {
            return 'preview_locked';
        }

        const limitVal = getLimit(featureKey);
        if (limitVal !== null && currentCount !== null && currentCount >= limitVal) {
            return 'limit_blocked';
        }

        if (featureKey === 'ai_assistant' || featureKey === 'smart_capture') {
            const aiLimit = getLimit('ai_credits_monthly') || getLimit('ai_pages_limit');
            const aiUsed = usage.ai_pages || 0;
            if (aiLimit !== null && aiUsed >= aiLimit) {
                return 'metered_stopped';
            }
        }

        return 'open';
    };

    /**
     * Resolve upgrade target tier for a fenced feature.
     */
    const upgradeTarget = (featureKey) => {
        const scaleOnly = [
            'api_access', 'white_label', 'security_activity_log', 'audit_log',
            'custom_roles', 'consolidated_reports', 'multi_store_hub'
        ];

        if (scaleOnly.includes(featureKey)) {
            return 'scale';
        }

        if (currentPlan === 'solo') {
            return 'starter';
        }

        if (currentPlan === 'starter' || currentPlan === 'ltd_1') {
            return 'core';
        }

        return 'scale';
    };

    const upgradeUrl = (featureKey) => {
        const storeSlug = store.slug;
        if (window.route && storeSlug) {
            try {
                return route('store.billing.upgrade', { store_slug: storeSlug, feature: featureKey });
            } catch (e) {
                return route('store.billing', { store_slug: storeSlug });
            }
        }
        return '/billing';
    };

    return {
        can,
        getLimit,
        getLockState,
        upgradeTarget,
        upgradeUrl,
        features,
        limits,
        usage,
        currentPlan,
    };
}

export default useEntitlement;
