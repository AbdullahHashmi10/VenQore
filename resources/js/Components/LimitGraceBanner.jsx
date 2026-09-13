import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';

export default function LimitGraceBanner() {
    const { props } = usePage();
    const limitGraceStatus = props.limit_grace_status;
    const is_demo = props.is_demo;

    const [timeLeftStr, setTimeLeftStr] = useState('');

    useEffect(() => {
        if (!limitGraceStatus?.grace_ends_at) return;

        const updateTimer = () => {
            const diffMs = new Date(limitGraceStatus.grace_ends_at).getTime() - new Date().getTime();
            if (diffMs <= 0) {
                setTimeLeftStr('Expired');
                return;
            }
            const totalSecs = Math.floor(diffMs / 1000);
            const days = Math.floor(totalSecs / (3600 * 24));
            const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;

            let parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0 || days > 0) parts.push(`${hours}h`);
            if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
            parts.push(`${secs}s`);

            setTimeLeftStr(parts.join(' '));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [limitGraceStatus?.grace_ends_at]);

    if (is_demo || !limitGraceStatus?.is_over_limit || !limitGraceStatus?.grace_ends_at) return null;

    const exceededFeature = limitGraceStatus.exceeded_feature;
    const current = limitGraceStatus.current_count;
    const limit = limitGraceStatus.limit;
    const isTrial = limitGraceStatus.is_trial;

    let stuffName = "items";
    if (exceededFeature === 'sku_limit') {
        stuffName = "products";
    } else if (exceededFeature === 'staff_limit') {
        stuffName = "staff members";
    } else if (exceededFeature === 'locations') {
        stuffName = "warehouses";
    }

    const billingUrl = props.store ? `/s/${props.store.slug}/billing` : '#';

    // Premium styling: Harmony with light/dark modes
    return (
        <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between shrink-0 shadow-sm transition-all duration-slow">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <AlertTriangle size={16} className="animate-pulse" />
                </div>
                <div className="truncate pr-4 leading-normal">
                    {isTrial ? (
                        <span>
                            <strong className="font-bold text-amber-900 dark:text-amber-200">Trial Usage High:</strong> Moving your trial to Growth won't cost anything during your trial period, but is required to support your current usage level. Please upgrade or delete the extra {stuffName} (currently <strong className="font-semibold">{current} / {limit}</strong>) to avoid your store becoming read-only.
                        </span>
                    ) : (
                        <span>
                            <strong className="font-bold text-amber-900 dark:text-amber-200">Plan Limits Exceeded:</strong> Please delete the extra {stuffName} or upgrade your plan to maintain full access. Currently using <strong className="font-semibold">{current} / {limit} {stuffName}</strong>.
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 font-sans">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Clock size={12} className="inline-block" />
                    <span>{timeLeftStr}</span>
                </div>
                <Link
                    href={billingUrl}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-1.5 rounded-full text-xs transition-all shadow-sm hover:shadow"
                >
                    Upgrade Plan
                    <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}
