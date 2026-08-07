import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { usePlan } from '@/Hooks/usePlan';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function PlanGate({ feature, children, fallback = null, showUpgradeBadge = true }) {
    const { store } = usePage().props;
    const { hasFeature } = usePlan();
    const isAllowed = hasFeature(feature);

    if (isAllowed) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (!showUpgradeBadge) {
        return null;
    }

    return (
        <div className="relative border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400">
                    <LockClosedIcon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Feature Locked
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md">
                    The requested feature is not included in your current subscription plan.
                </p>
                <Link
                    href={route('store.billing', { store_slug: store?.slug })}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                    Upgrade Plan
                </Link>
            </div>
        </div>
    );
}
