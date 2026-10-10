import React, { useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { useTermText } from '@/lib/terms';

export default function GlobalOnboardingWidget({ store, isOpen = false, onClose = () => {} }) {
    const tt = useTermText();
    const { component, props } = usePage();
    const step = store?.onboarding_step;
    const onboarding_metrics = props.onboarding_metrics;

    const metrics = onboarding_metrics || {
        has_products: false,
        has_purchases: false,
        has_sales: false,
        has_expenses: false,
        has_drive_sync: false
    };

    const checklist = useMemo(() => [
        { key: 'inventory', label: tt('Catalog First Product'), isDone: !!metrics.has_products },
        { key: 'purchase', label: 'Record First Purchase', isDone: !!metrics.has_purchases },
        { key: 'sale', label: 'Record First Sale (POS/Invoice)', isDone: !!metrics.has_sales },
        { key: 'expense', label: 'Record Store Expense', isDone: !!metrics.has_expenses },
        { key: 'drive_sync', label: 'Secure Database (Google Drive)', isDone: !!metrics.has_drive_sync || !!store?.google_backup_enabled || !!store?.google_connected }
    ], [metrics, store?.google_backup_enabled, store?.google_connected, tt]);

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

    if (!isOpen) {
        return null;
    }

    // If onboarding is marked as completed in DB or is demo store, don't show
    if (store?.onboarding_completed || store?.is_demo || step === 'completed') {
        return null;
    }

    const handleResume = () => {
        onClose();
        if (step === 'skipped') {
            router.post(
                route('store.onboarding.step', { store_slug: store?.slug }),
                { step: 'welcome' },
                {
                    onSuccess: () => {
                        router.visit(route('store.dashboard', { store_slug: store.slug }));
                    }
                }
            );
            return;
        }
        if (['welcome', 'stock_value', 'sidebar_stock'].includes(step)) {
            router.visit(route('store.dashboard', { store_slug: store.slug }));
        } else if (['inventory_tour', 'congratulations', 'inventory_tour_more'].includes(step)) {
            router.visit(route('store.inventory.index', { store_slug: store.slug }));
        } else if (['purchase_tour_start', 'purchase_tour_sidebar', 'purchase_tour', 'purchase_congratulations'].includes(step)) {
            if (step === 'purchase_tour') {
                router.visit(route('store.purchases.create', { store_slug: store.slug }));
            } else {
                router.visit(route('store.dashboard', { store_slug: store.slug }));
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
        } else if (step === 'drive_sync_tour') {
            router.visit(route('store.admin.data', { store_slug: store.slug, tab: 'drive_sync' }));
        } else {
            router.visit(route('store.dashboard', { store_slug: store.slug }));
        }
    };

    const handleMarkComplete = () => {
        onClose();
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            { preserveScroll: true }
        );
    };

    const handleStepClick = (item) => {
        if (item.isDone) return;
        onClose();

        let targetStep = '';
        let targetRoute = '';
        let routeParams = { store_slug: store?.slug };

        switch (item.key) {
            case 'inventory':
                targetStep = 'inventory_tour';
                targetRoute = 'store.inventory.index';
                break;
            case 'purchase':
                targetStep = 'purchase_tour_start';
                targetRoute = 'store.dashboard';
                break;
            case 'sale':
                targetStep = 'invoice_tour_start';
                targetRoute = 'store.dashboard';
                break;
            case 'expense':
                targetStep = 'expense_tour_start';
                targetRoute = 'store.dashboard';
                break;
            case 'drive_sync':
                targetStep = 'drive_sync_tour';
                targetRoute = 'store.admin.data';
                routeParams.tab = 'drive_sync';
                break;
            default:
                return;
        }

        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: targetStep },
            {
                onSuccess: () => {
                    router.visit(route(targetRoute, routeParams));
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center sm:justify-start sm:left-20 sm:bottom-20 p-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto transition-opacity animate-in fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <div
                role="dialog"
                aria-label="Setup Checklist"
                className="relative z-10 w-full max-w-sm bg-surface border border-line dark:border-brand-500/30 rounded-2xl shadow-2xl p-5 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-fast pointer-events-auto"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl shrink-0">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink tracking-wider uppercase">Setup Checklist</h4>
                            <p className="text-2xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                                {remainingCount === 0 ? 'All Completed!' : `${remainingCount} steps remaining`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
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
                        <span className="font-bold text-brand-600 dark:text-brand-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-sunken rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-brand transition-all duration-slower ease-out rounded-full"
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
                                    ? 'bg-surface border-line/60 opacity-95 cursor-default'
                                    : 'bg-surface border-line hover:border-brand-400/80 hover:bg-brand-50/40 dark:hover:bg-brand-900/20 cursor-pointer shadow-xs'
                            }`}
                            title={item.isDone ? `${item.label} completed` : `Click to jump to ${item.label}`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    item.isDone
                                        ? 'bg-emerald-500 text-white shadow-xs'
                                        : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700 text-3xs font-extrabold'
                                }`}>
                                    {item.isDone ? (
                                        <Check size={12} strokeWidth={3} />
                                    ) : (
                                        <span>{idx + 1}</span>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold truncate ${
                                    item.isDone
                                        ? 'text-ink dark:text-white'
                                        : 'text-ink dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
                                }`}>
                                    {item.label}
                                </span>
                            </div>
                            <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                item.isDone
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-brand-500 text-white shadow-xs group-hover:bg-brand-600'
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

                {/* Bottom Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                    <button
                        type="button"
                        onClick={handleResume}
                        className="flex-[2] py-2.5 px-4 bg-gradient-brand hover:opacity-95 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                        <span>Resume Setup</span>
                        <ArrowRight size={13} className="shrink-0" />
                    </button>
                    <button
                        type="button"
                        onClick={handleMarkComplete}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-xs"
                        title="Mark Setup as Complete"
                    >
                        <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-slate-900 dark:text-white">Done</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
