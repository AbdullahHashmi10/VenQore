import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { AlertTriangle, Zap } from 'lucide-react';

/**
 * PlanUsageBanner — Phase 7 (AppSumo LTD)
 *
 * Shows a sticky warning when the tenant is approaching their monthly
 * transaction limit. Threshold levels:
 *   >= 80% → Yellow warning
 *   >= 95% → Orange urgent
 *   >= 100% → Red critical (sales paused)
 *
 * Reads from: props.plan_usage (populated by TenantMiddleware).
 * Returns null for unlimited plans (plan_usage is null).
 *
 * Mount this in OneGlanceLayout ABOVE {children} in the main content area.
 */
export default function PlanUsageBanner() {
    const { store, plan_usage } = usePage().props;

    // Unlimited plan or no usage data — no banner needed
    if (!plan_usage || plan_usage.transactions_limit === null) return null;

    const { transactions_used, transactions_limit } = plan_usage;
    const pct = transactions_limit > 0 ? (transactions_used / transactions_limit) * 100 : 0;

    // Under 80% — no banner
    if (pct < 80) return null;

    const isCapped  = pct >= 100;
    const isUrgent  = pct >= 95;

    const bgColor = isCapped
        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        : isUrgent
        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
        : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';

    const textColor = isCapped
        ? 'text-red-700 dark:text-red-300'
        : isUrgent
        ? 'text-orange-700 dark:text-orange-300'
        : 'text-yellow-700 dark:text-yellow-300';

    const btnColor = (isCapped || isUrgent)
        ? 'bg-orange-500 hover:bg-orange-600 text-white'
        : 'bg-yellow-500 hover:bg-yellow-600 text-white';

    const message = isCapped
        ? `You've used all ${transactions_limit.toLocaleString()} transactions this month. New sales are paused until the 1st.`
        : isUrgent
        ? `You've used ${transactions_used.toLocaleString()} of ${transactions_limit.toLocaleString()} transactions (${Math.round(pct)}%). Almost at your monthly limit.`
        : `You've used ${transactions_used.toLocaleString()} of ${transactions_limit.toLocaleString()} transactions (${Math.round(pct)}%) this month.`;

    return (
        <div
            id="plan-usage-banner"
            className={`flex items-center justify-between gap-4 px-5 py-2.5 border-b text-sm font-medium shrink-0 ${bgColor} ${textColor}`}
        >
            <div className="flex items-center gap-2.5">
                <AlertTriangle size={14} className={`shrink-0 ${isCapped ? 'animate-pulse' : ''}`} />
                <span>{message}</span>
            </div>
            <button
                id="plan-usage-upgrade-btn"
                onClick={() => store?.slug && router.visit(route('store.billing', { store_slug: store.slug }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${btnColor}`}
            >
                <Zap size={11} />
                {isCapped ? 'Upgrade Now' : 'Upgrade'}
            </button>
        </div>
    );
}
