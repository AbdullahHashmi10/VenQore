import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { usePlan } from '@/Hooks/usePlan';
import { AlertTriangle, Zap, X } from 'lucide-react';

/**
 * UsageLimitBanner
 *
 * Warns before a plan limit is hit, rather than letting the user run into a
 * silent wall. This is the anti-refund surface for LTD/AppSumo tenants: a
 * Code-1 buyer capped at 500 transactions/month who hits the block with no
 * prior warning assumes the product broke.
 *
 * Thresholds come from GET /api/plan/usage via usePlan().usageStatus():
 *   near     >= 80%  amber
 *   critical >= 95%  orange
 *   at_limit >= 100% red
 *
 * Only the single most severe bucket is shown, so the dashboard never stacks
 * multiple warnings. Dismissal is per bucket+severity for the browser session,
 * so escalating from 80% to 95% re-surfaces a previously dismissed warning.
 */

const BUCKET_LABELS = {
    transactions: 'transactions',
    products: 'products',
    staff: 'staff members',
    warehouses: 'locations',
};

const SEVERITY_RANK = { ok: 0, near: 1, critical: 2, at_limit: 3 };

const SEVERITY_STYLES = {
    near: {
        container: 'border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20',
        icon: 'text-amber-600 dark:text-amber-500',
        title: 'text-amber-900 dark:text-amber-200',
        body: 'text-amber-800 dark:text-amber-300/80',
    },
    critical: {
        container: 'border-orange-300 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20',
        icon: 'text-orange-600 dark:text-orange-500',
        title: 'text-orange-900 dark:text-orange-200',
        body: 'text-orange-800 dark:text-orange-300/80',
    },
    at_limit: {
        container: 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20',
        icon: 'text-red-600 dark:text-red-500',
        title: 'text-red-900 dark:text-red-200',
        body: 'text-red-800 dark:text-red-300/80',
    },
};

// `resets_at` arrives as an ISO-8601 string from the API. Render it as a short
// readable date, and fall back to omitting it entirely if it will not parse.
function formatResetDate(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildMessage(bucketKey, bucket, severity) {
    const label = BUCKET_LABELS[bucketKey] ?? bucketKey;
    const { used, limit } = bucket;
    const resetsAt = formatResetDate(bucket.resets_at);

    if (severity === 'at_limit') {
        const base = `You have used all ${limit} ${label} on your current plan.`;
        if (bucketKey === 'transactions') {
            return `${base} Your existing data stays fully readable, but new sales are paused${
                resetsAt ? ` until your allowance resets on ${resetsAt}` : ''
            }.`;
        }
        return `${base} Your existing data stays fully readable, but you cannot add new ${label} until you upgrade.`;
    }

    const remaining = typeof limit === 'number' && typeof used === 'number' ? limit - used : null;

    if (bucketKey === 'transactions') {
        return `You have used ${used} of ${limit} ${label} this month${
            remaining !== null ? `, with ${remaining} left` : ''
        }${resetsAt ? `. Resets on ${resetsAt}` : ''}.`;
    }

    return `You have used ${used} of ${limit} ${label}${
        remaining !== null ? `, with ${remaining} left` : ''
    }.`;
}

export default function UsageLimitBanner({ usage = null, className = '' }) {
    const { store } = usePage().props;
    const { usageStatus } = usePlan();
    const [fetched, setFetched] = useState(null);
    const [dismissed, setDismissed] = useState({});

    // Allow a parent to pass usage in (avoids a second request on pages that
    // already hold it). Otherwise fetch it once on mount.
    useEffect(() => {
        if (usage) return;

        let cancelled = false;
        fetch('/api/plan/usage', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data?.usage) setFetched(data.usage);
            })
            .catch(() => {
                // Usage warnings are advisory. A failed fetch must never break
                // the page it is mounted on.
            });

        return () => {
            cancelled = true;
        };
    }, [usage]);

    const usageData = usage ?? fetched;
    if (!usageData) return null;

    // Pick the single most severe bucket.
    let worst = null;
    for (const [key, bucket] of Object.entries(usageData)) {
        if (!bucket || bucket.unlimited) continue;
        const severity = usageStatus(bucket);
        if (severity === 'ok') continue;
        if (!worst || SEVERITY_RANK[severity] > SEVERITY_RANK[worst.severity]) {
            worst = { key, bucket, severity };
        }
    }

    if (!worst) return null;
    if (dismissed[`${worst.key}:${worst.severity}`]) return null;

    const styles = SEVERITY_STYLES[worst.severity];
    const isAtLimit = worst.severity === 'at_limit';

    const openUpgrade = () => {
        const billingUrl = window.route
            ? route('store.billing', { store_slug: store?.slug })
            : '/billing';

        window.dispatchEvent(
            new CustomEvent('amd:plan-limit', {
                detail: {
                    feature: worst.key,
                    message: buildMessage(worst.key, worst.bucket, worst.severity),
                    current_plan: store?.plan ?? 'starter',
                    billing_url: billingUrl,
                },
            })
        );
    };

    return (
        <div
            role={isAtLimit ? 'alert' : 'status'}
            className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 ${styles.container} ${className}`}
        >
            <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${styles.icon}`} />

            <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${styles.title}`}>
                    {isAtLimit
                        ? `You have reached your ${BUCKET_LABELS[worst.key] ?? worst.key} limit`
                        : `You are close to your ${BUCKET_LABELS[worst.key] ?? worst.key} limit`}
                </p>
                <p className={`mt-0.5 text-xs leading-relaxed ${styles.body}`}>
                    {buildMessage(worst.key, worst.bucket, worst.severity)}
                </p>

                <button
                    type="button"
                    onClick={openUpgrade}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                    <Zap size={12} />
                    {isAtLimit ? 'Upgrade to continue' : 'View upgrade options'}
                </button>
            </div>

            {!isAtLimit && (
                <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() =>
                        setDismissed((prev) => ({
                            ...prev,
                            [`${worst.key}:${worst.severity}`]: true,
                        }))
                    }
                    className={`shrink-0 rounded p-1 opacity-60 transition hover:opacity-100 ${styles.icon}`}
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
