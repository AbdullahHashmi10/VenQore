import React, { useState, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, Check, X, AlertCircle } from 'lucide-react';
import { GETTING_STARTED, isStepDone, startStep } from '@/lib/gettingStarted';

export default function GlobalOnboardingWidget({ store, isOpen = false, onClose = () => {} }) {
    const { component, props } = usePage();
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    const step = store?.onboarding_step;
    const onboarding_metrics = props.onboarding_metrics;

    const metrics = onboarding_metrics || {
        has_products: false,
        has_purchases: false,
        has_sales: false,
        has_expenses: false,
        has_drive_sync: false,
        has_custom_dashboard: false,
        has_online_store: false,
    };

    const checklist = useMemo(
        () => GETTING_STARTED.filter((g) => g.key !== 'team').map((g) => ({ ...g, isDone: isStepDone(g, metrics, store) })),
        [metrics, store?.google_backup_enabled, store?.google_connected, store?.dashboard_customized, store?.storefront_published], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const remainingCount = checklist.filter(item => !item.isDone).length;
    const completedCount = checklist.length - remainingCount;
    const progressPercent = Math.round((completedCount / checklist.length) * 100);

    useEffect(() => {
        if (remainingCount === 0 && store && !store.onboarding_completed && step !== 'completed') {
            router.post(
                route('store.onboarding.step', { store_slug: store?.slug }),
                { step: 'completed' },
                { preserveScroll: true }
            );
        }
    }, [remainingCount, store?.onboarding_completed, step, store?.slug]);

    if (!isOpen || store?.is_demo) {
        return null;
    }

    const handleResume = () => {
        onClose();
        if (step === 'skipped' || step === 'completed' || step === 'welcome' || !step) {
            const firstUnfinished = checklist.find(item => !item.isDone);
            if (firstUnfinished) {
                startStep(store, firstUnfinished);
                return;
            }
            router.post(
                route('store.onboarding.step', { store_slug: store?.slug }),
                { step: 'welcome' },
                {
                    onSuccess: () => {
                        if (window.location.pathname.includes('/dashboard')) {
                            window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'welcome' }));
                        } else {
                            router.visit(route('store.dashboard', { store_slug: store.slug }));
                        }
                    }
                }
            );
            return;
        }

        if (['welcome', 'stock_value', 'sidebar_stock', 'dashboard_empty'].includes(step)) {
            if (window.location.pathname.includes('/dashboard')) {
                window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'welcome' }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }), {
                    onSuccess: () => {
                        setTimeout(() => window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'welcome' })), 200);
                    }
                });
            }
        } else if (['inventory_tour', 'congratulations', 'inventory_tour_more'].includes(step)) {
            router.visit(route('store.inventory.index', { store_slug: store.slug }));
        } else if (['purchase_tour_start', 'purchase_tour_sidebar', 'purchase_tour', 'purchase_congratulations'].includes(step)) {
            if (step === 'purchase_tour') {
                router.visit(route('store.purchases.create', { store_slug: store.slug }));
            } else {
                if (window.location.pathname.includes('/dashboard')) {
                    window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'purchase_tour_start' }));
                } else {
                    router.visit(route('store.dashboard', { store_slug: store.slug }), {
                        onSuccess: () => {
                            setTimeout(() => window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'purchase_tour_start' })), 200);
                        }
                    });
                }
            }
        } else if (['invoice_tour_start', 'invoice_tour', 'invoice_congratulations'].includes(step)) {
            if (step === 'invoice_tour') {
                router.visit(route('store.sales.invoice.create', { store_slug: store.slug }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }));
            }
        } else if (['pos_tour_start', 'pos_tour', 'pos_congratulations'].includes(step)) {
            if (step === 'pos_tour') {
                router.visit(route('store.pos', { store_slug: store.slug }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }));
            }
        } else if (['expense_tour_start', 'expense_tour', 'expense_congratulations'].includes(step)) {
            if (step === 'expense_tour') {
                router.visit(route('store.expenses.index', { store_slug: store.slug }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }));
            }
        } else if (['customize_dashboard_tour', 'customize_dashboard_toolbar'].includes(step)) {
            if (window.location.pathname.includes('/dashboard')) {
                window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'customize_dashboard_tour' }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }), {
                    onSuccess: () => {
                        setTimeout(() => window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'customize_dashboard_tour' })), 200);
                    }
                });
            }
        } else if (['online_store_tour', 'online_store_sidebar'].includes(step)) {
            if (window.location.pathname.includes('/dashboard')) {
                window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'online_store_tour' }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }), {
                    onSuccess: () => {
                        setTimeout(() => window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: 'online_store_tour' })), 200);
                    }
                });
            }
        } else if (step === 'drive_sync_tour') {
            router.visit(route('store.admin.data', { store_slug: store.slug, tab: 'drive_sync' }));
        } else {
            router.visit(route('store.dashboard', { store_slug: store.slug }));
        }
    };

    const handleClose = () => {
        setShowSkipConfirm(false);
        onClose();
    };

    const handleMarkComplete = () => {
        handleClose();
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            { preserveScroll: true }
        );
    };

    const handleStepClick = (item) => {
        if (item.isDone) return;
        handleClose();

        startStep(store, item);
    };

    return (
        <div className="fixed inset-0 z-[10000200] flex items-end sm:items-center justify-center sm:justify-start sm:left-20 sm:bottom-20 p-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-[#06100D]/50 backdrop-blur-xs pointer-events-auto transition-opacity animate-in fade-in z-[10000201]"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Card (V6 Design System) */}
            <div
                role="dialog"
                aria-label="Setup Checklist"
                className="relative z-[10000202] w-full max-w-sm bg-surface border border-line rounded-2xl shadow-2xl p-5 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-fast pointer-events-auto text-ink"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 flex items-center justify-center shrink-0">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink tracking-wider uppercase">Setup Checklist</h4>
                            <p className="text-2xs font-bold text-accent-text uppercase tracking-wide">
                                {remainingCount === 0 ? 'All Completed!' : `${remainingCount} steps remaining`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-xl bg-surface hover:bg-interactive-hover text-ink-muted hover:text-ink transition-colors border border-line"
                        title="Close Checklist"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 text-2xs font-semibold text-ink-muted mb-1.5">
                        <span>{completedCount} of {checklist.length} completed</span>
                        <span className="font-bold text-accent-text">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-fill transition-all duration-slower ease-out rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Checklist of steps */}
                <div className="my-3 space-y-2 border-t border-b border-line py-3 max-h-[55vh] overflow-y-auto">
                    {checklist.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleStepClick(item)}
                            disabled={item.isDone}
                            className={`w-full flex flex-wrap items-center justify-between gap-y-2 p-2.5 rounded-xl transition-all text-left group border ${
                                item.isDone
                                    ? 'bg-surface-sunken/40 border-line/60 opacity-90 cursor-default'
                                    : 'bg-surface border-line hover:border-teal-400/80 hover:bg-accent-quiet/40 dark:hover:bg-accent-quiet/20 cursor-pointer shadow-xs'
                            }`}
                            title={item.isDone ? `${item.label} completed` : `Click to jump to ${item.label}`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    item.isDone
                                        ? 'bg-emerald-500 text-white shadow-xs'
                                        : 'bg-accent-quiet text-accent-text border border-teal-300 dark:border-teal-700 text-3xs font-extrabold'
                                }`}>
                                    {item.isDone ? (
                                        <Check size={12} strokeWidth={3} />
                                    ) : (
                                        <span>{idx + 1}</span>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold truncate ${
                                    item.isDone
                                        ? 'text-ink-muted line-through'
                                        : 'text-ink group-hover:text-accent-text'
                                }`}>
                                    {item.label}
                                </span>
                            </div>
                            <span className={`text-3xs font-extrabold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                item.isDone
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-accent-fill text-accent-on shadow-xs group-hover:bg-accent-fill-hover'
                            }`}>
                                {item.isDone ? (
                                    'Done'
                                ) : (
                                    <>
                                        <span>Start</span>
                                        <ArrowRight size={9} />
                                    </>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Skip confirmation or regular action buttons */}
                {showSkipConfirm ? (
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-fast">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertCircle size={16} className="shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider">Skip Setup Checklist?</span>
                        </div>
                        <p className="text-2xs text-ink-muted leading-relaxed">
                            You still have <strong>{remainingCount} step{remainingCount > 1 ? 's' : ''}</strong> remaining. Are you sure you want to dismiss the checklist? You can always access and use all features directly from the navigation menu.
                        </p>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowSkipConfirm(false)}
                                className="flex-1 py-2 px-3 bg-surface hover:bg-interactive-hover border border-line text-ink font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                            >
                                Keep Setting Up
                            </button>
                            <button
                                type="button"
                                onClick={handleMarkComplete}
                                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                            >
                                Yes, Skip All
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 pt-1">
                        <div className="flex gap-2.5">
                            {remainingCount > 0 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleResume}
                                        className="flex-[2] py-2.5 px-4 bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                                    >
                                        <span>Resume Setup</span>
                                        <ArrowRight size={13} className="shrink-0" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 px-3 bg-surface hover:bg-interactive-hover text-ink-muted hover:text-ink border border-line font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs"
                                        title="Close checklist for now"
                                    >
                                        <span>Remind Later</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleMarkComplete}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                                >
                                    <Check size={14} className="stroke-[3]" />
                                    <span>Complete Setup</span>
                                </button>
                            )}
                        </div>
                        {remainingCount > 0 && (
                            <div className="text-center pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => setShowSkipConfirm(true)}
                                    className="text-3xs text-ink-muted hover:text-ink hover:underline cursor-pointer transition-colors"
                                >
                                    Dismiss checklist for now
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
