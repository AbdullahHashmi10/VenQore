import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, Minimize2, Check } from 'lucide-react';

export default function GlobalOnboardingWidget({ store }) {
    const [isMinimized, setIsMinimized] = useState(() => {
        return sessionStorage.getItem('amd_global_onboarding_minimized') === 'true';
    });

    const toggleMinimized = (val) => {
        setIsMinimized(val);
        sessionStorage.setItem('amd_global_onboarding_minimized', val ? 'true' : 'false');
    };

    const getOnboardingProgress = (step) => {
        switch (step) {
            case 'welcome': return 0;
            case 'stock_value': return 10;
            case 'sidebar_stock': return 20;
            case 'inventory_tour': return 35;
            case 'congratulations': return 45;
            case 'inventory_tour_more': return 45;
            case 'purchase_tour_start': return 55;
            case 'purchase_tour_sidebar': return 60;
            case 'purchase_tour': return 65;
            case 'purchase_congratulations': return 70;
            case 'invoice_tour_start':
            case 'pos_tour_start': return 75;
            case 'invoice_tour':
            case 'pos_tour': return 85;
            case 'invoice_congratulations':
            case 'pos_congratulations': return 90;
            case 'expense_tour_start': return 92;
            case 'expense_tour': return 95;
            case 'expense_congratulations': return 98;
            default: return 0;
        }
    };

    const getPhaseName = (progress) => {
        if (progress < 50) return 'Phase 1: Catalog Products';
        if (progress >= 50 && progress < 75) return 'Phase 2: Record Purchase';
        if (progress >= 75 && progress < 92) return 'Phase 3: Record Sale';
        return 'Phase 4: Add Expense';
    };

    const handleResume = () => {
        const step = store?.onboarding_step;
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
        } else {
            router.visit(route('store.dashboard', { store_slug: store.slug }));
        }
    };

    const handleMarkComplete = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            { preserveScroll: true }
        );
    };

    const { component, url, props } = usePage();
    const step = store?.onboarding_step;

    // Check if the mobile nav bar is active to avoid overlapping
    const showMobileNavBar = (() => {
        if (!store) return false;
        const auth = props?.auth;
        if (!auth?.user) return false;

        const path = url.toLowerCase();

        // 1. Explicitly check if returns history list page (should show navbar)
        const isReturnsHistoryList = path.includes('/returns-history') && 
            !path.includes('/create') && 
            !path.includes('/edit') && 
            !path.includes('/return-detail');

        if (isReturnsHistoryList) return true;

        // 2. Block on POS screen
        if (path.includes('/pos')) return false;

        // 3. Block on creation, editing, return making, or refunds
        const isCreateFlow = path.includes('/create');
        const isEditFlow = path.includes('/edit');
        const isReturnFlow = path.includes('/return') && !path.includes('/returns-history');
        const isRefundFlow = path.includes('/refund');
        const isSetupFlow = path.includes('/setup') || path.includes('/new-store') || path.includes('/start');

        if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
            return false;
        }

        return true;
    })();

    // Helper to determine if an active spotlight/tour modal is currently running on the page
    const isTourActive = () => {
        if (!step) return false;
        const pathname = window.location.pathname;

        // Dashboard modals/tooltips
        if (['welcome', 'stock_value', 'sidebar_stock', 'purchase_tour_start', 'purchase_tour_sidebar', 'invoice_tour_start', 'pos_tour_start', 'expense_tour_start'].includes(step)) {
            return component === 'Dashboard' || pathname.endsWith('/dashboard');
        }

        // Inventory tour spotlight
        if (['inventory_tour', 'congratulations', 'inventory_tour_more'].includes(step)) {
            return component?.includes('Inventory') || pathname.includes('/inventory');
        }

        // Purchase tour spotlight
        if (['purchase_tour', 'purchase_congratulations'].includes(step)) {
            return component?.includes('Purchases/Create') || pathname.includes('/purchases/create');
        }

        // Invoice tour spotlight
        if (['invoice_tour', 'invoice_congratulations'].includes(step)) {
            return component?.includes('CreateInvoice') || pathname.includes('/sales/invoice/create');
        }

        // POS tour spotlight
        if (['pos_tour', 'pos_congratulations'].includes(step)) {
            return component?.includes('Pos') || pathname.includes('/pos');
        }

        // Expense tour spotlight
        if (['expense_tour', 'expense_congratulations'].includes(step)) {
            return component?.includes('Expenses') || pathname.includes('/expenses');
        }

        return false;
    };

    // If onboarding is marked as completed in DB, don't show the widget
    if (store?.onboarding_completed || step === 'completed') {
        return null;
    }

    // If the step is empty (no onboarding), don't show the widget
    if (!step) {
        return null;
    }

    // Hide during active tours to avoid overlapping UI/spotlights
    if (isTourActive()) {
        return null;
    }

    // Explicitly blocked patterns — active creation/transaction/setup flows
    const path = window.location.pathname.toLowerCase();
    const blockedPatterns = [
        '/pos',
        '/create',
        '/edit',
        '/new-store',
        '/setup',
        '/refund',
        '/return',
    ];
    if (blockedPatterns.some(p => path.includes(p))) {
        return null;
    }

    const progress = getOnboardingProgress(step);
    const circumference = 2 * Math.PI * 18;
    const progressOffset = circumference * (1 - progress / 100);

    if (isMinimized) {
        // Minimized floating circle widget
        return (
            <div 
                onClick={() => toggleMinimized(false)}
                title="Onboarding Incomplete. Click to view progress checklist."
                className={`fixed right-6 z-[95] w-14 h-14 bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-indigo-500/30 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(99,102,241,0.3)] backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 hover:border-indigo-400/50 transition-all duration-300 group animate-in zoom-in-90 ${showMobileNavBar ? 'bottom-[172px] lg:bottom-24' : 'bottom-24'}`}
            >
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="transparent"
                        r="18"
                        cx="22"
                        cy="22"
                    />
                    <circle
                        className="text-indigo-500 transition-all duration-500 ease-out"
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="18"
                        cx="22"
                        cy="22"
                    />
                </svg>
                <div className="relative z-10 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-white transition-colors duration-200">
                    <Sparkles size={18} className="animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow">
                    {progress}%
                </span>
            </div>
        );
    }

    return (
        <div className={`fixed right-6 z-[95] max-w-sm w-full bg-white dark:bg-slate-950/98 border border-slate-200 dark:border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_40px_rgba(99,102,241,0.25)] p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto ${showMobileNavBar ? 'bottom-[172px] lg:bottom-24' : 'bottom-24'}`}>
            {/* Minimize button */}
            <button 
                onClick={() => toggleMinimized(true)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/50"
                title="Minimize to widget"
            >
                <Minimize2 size={12} />
            </button>

            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Setup Incomplete</h4>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">{getPhaseName(progress)} ({progress}%)</p>
                </div>
            </div>

            <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium mb-4 pr-6">
                You haven't completed the store setup tour yet. Finish it to unlock the dashboard analytics!
            </p>

            <div className="flex gap-2">
                <button
                    onClick={handleResume}
                    className="flex-[2] py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                >
                    <span>Resume Setup</span>
                    <ArrowRight size={12} />
                </button>
                <button
                    onClick={handleMarkComplete}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1"
                >
                    <Check size={12} />
                    <span>Done</span>
                </button>
            </div>
        </div>
    );
}
