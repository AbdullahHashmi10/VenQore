import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { AlertTriangle, Lock, Zap } from 'lucide-react';

/**
 * SubscriptionExpiryBanner — Gift Access Links / subscription expiry warnings
 *
 * Reads store.subscription_ends_at and store.view_only_since (both shared by
 * TenantMiddleware). Covers three states, matching the on-demand lock check
 * in TenantMiddleware itself — this banner only ever WARNS or REPORTS; the
 * actual lock decision already happened server-side, this just reflects it:
 *
 *   - Currently locked (view_only_since set)  → red "locked" banner, always shown
 *   - <= 2 days remaining                      → red urgent warning
 *   - <= 7 days remaining                       → yellow warning
 *   - > 7 days / no subscription_ends_at        → nothing (unlimited or healthy)
 *
 * Mount alongside PlanUsageBanner in OneGlanceLayout — same slot, same pattern.
 */
export default function SubscriptionExpiryBanner() {
    const { store, is_demo } = usePage().props;

    if (!store || is_demo) return null;

    const goToBilling = () => {
        if (store.slug) router.visit(route('store.billing', { store_slug: store.slug }));
    };

    // ── Already locked — takes priority over any date math ─────────────────
    if (store.view_only_since) {
        return (
            <div
                id="subscription-expiry-banner"
                className="flex items-center justify-between gap-4 px-5 py-2.5 border-b text-sm font-medium shrink-0 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            >
                <div className="flex items-center gap-2.5">
                    <Lock size={14} className="shrink-0" />
                    <span>
                        Your access period has ended. Your store is in <strong>View-Only mode</strong> — subscribe to restore full access.
                    </span>
                </div>
                <button
                    onClick={goToBilling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors bg-red-500 hover:bg-red-600 text-white"
                >
                    <Zap size={11} /> Subscribe Now
                </button>
            </div>
        );
    }

    // ── Not locked — check upcoming expiry ──────────────────────────────────
    if (!store.subscription_ends_at) return null;

    const msRemaining = new Date(store.subscription_ends_at).getTime() - Date.now();
    if (msRemaining <= 0) return null; // middleware will lock on next request; avoid a flash of "0 days left"

    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    if (daysRemaining > 7) return null;

    const isUrgent = daysRemaining <= 2;

    const bgColor = isUrgent
        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';

    const textColor = isUrgent
        ? 'text-red-700 dark:text-red-300'
        : 'text-yellow-700 dark:text-yellow-300';

    const btnColor = isUrgent
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : 'bg-yellow-500 hover:bg-yellow-600 text-white';

    const dayLabel = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;
    const dateLabel = new Date(store.subscription_ends_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    const message = isUrgent
        ? `Urgent: your access ends in ${dayLabel} (${dateLabel}). Your store will become view-only after that.`
        : `Your access ends in ${dayLabel} (${dateLabel}). Subscribe to avoid interruption.`;

    return (
        <div
            id="subscription-expiry-banner"
            className={`flex items-center justify-between gap-4 px-5 py-2.5 border-b text-sm font-medium shrink-0 ${bgColor} ${textColor}`}
        >
            <div className="flex items-center gap-2.5">
                <AlertTriangle size={14} className={`shrink-0 ${isUrgent ? 'animate-pulse' : ''}`} />
                <span>{message}</span>
            </div>
            <button
                onClick={goToBilling}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${btnColor}`}
            >
                <Zap size={11} /> {isUrgent ? 'Subscribe Now' : 'Subscribe'}
            </button>
        </div>
    );
}
