import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Power, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';

/**
 * RestaurantFeatureGate
 * 
 * Provides a 1-click feature activation gate banner or full-page notice
 * when an optional restaurant feature (KDS, TV Queue, Delivery, Table Service)
 * is turned off, with instant toggle controls to turn it on or off.
 * Strictly adheres to V6 design tokens for light and dark theme readability.
 */
export default function RestaurantFeatureGate({
    storeSlug,
    title = 'Feature is Currently Disabled',
    description = 'Turn this setting on to activate this feature for your restaurant.',
    settingKey = 'prepares_orders',
    turnOnValue = '1',
    turnOffValue = '0',
    turnOnLabel = 'Turn this setting on',
    isEnabled = false,
    icon: Icon = Sparkles,
    onToggled,
    mode = 'banner', // 'banner' | 'card' | 'full'
    badgeText = 'Restaurant Feature',
}) {
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(isEnabled);

    const handleToggle = async (enable) => {
        setLoading(true);
        try {
            const val = enable ? turnOnValue : turnOffValue;
            await axios.post(route('store.restaurant.settings.update', { store_slug: storeSlug }), {
                [settingKey]: val,
            });

            setActive(enable);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: {
                        message: enable ? `${title.replace(' is Disabled', '')} enabled!` : 'Setting disabled.',
                        type: 'success',
                    }
                }));
            }

            if (onToggled) {
                onToggled(enable);
            } else {
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            console.error('Failed to update setting:', err);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: {
                        message: err?.response?.data?.message || 'Failed to update setting',
                        type: 'error',
                    }
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    if (active) {
        // If already active and in banner mode, render a sleek status bar with quick toggle-off
        return (
            <div className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">{title.replace(' is Disabled', '') || 'Feature'} Active</span>
                    <span className="text-emerald-700 dark:text-emerald-400 hidden sm:inline">— ready for service</span>
                </div>
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleToggle(false)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-ink-muted hover:text-red-600 dark:hover:text-red-400 bg-surface hover:bg-red-50 dark:hover:bg-red-900/20 border border-line rounded-xl transition-colors cursor-pointer"
                    title="Turn this feature off"
                >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                    <span>Turn off</span>
                </button>
            </div>
        );
    }

    if (mode === 'full') {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-surface border border-line rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
                    <div className="inline-flex p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 mb-6 shadow-sm">
                        <Icon size={40} className="stroke-[1.75]" />
                    </div>

                    <div className="inline-block px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
                        {badgeText}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-ink mb-3">
                        {title}
                    </h2>

                    <p className="text-sm text-ink-muted leading-relaxed mb-8 max-w-md mx-auto">
                        {description}
                    </p>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleToggle(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 sm:px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Enabling...</span>
                            </>
                        ) : (
                            <>
                                <Power size={18} className="stroke-[2.5]" />
                                <span>{turnOnLabel}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Default banner mode
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5 relative z-10">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-800/40 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 shrink-0">
                    <Icon size={22} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                        <span>{title}</span>
                    </h4>
                    <p className="text-xs text-ink-muted mt-0.5 max-w-xl">
                        {description}
                    </p>
                </div>
            </div>

            <button
                type="button"
                disabled={loading}
                onClick={() => handleToggle(true)}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
                {loading ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Enabling...</span>
                    </>
                ) : (
                    <>
                        <Power size={14} />
                        <span>{turnOnLabel}</span>
                    </>
                )}
            </button>
        </div>
    );
}
