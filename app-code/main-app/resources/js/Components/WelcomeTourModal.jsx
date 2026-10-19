import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import {
    Sparkles,
    Rocket,
    ArrowRight,
    ArrowLeft,
    X,
    Package,
    TrendingUp,
    Box,
    ShoppingCart,
    CheckCircle2,
    Compass,
    Coins,
    Check,
    Sliders,
    Globe,
    Store,
    LayoutDashboard,
} from 'lucide-react';
import { useTermText } from '@/lib/terms';

/**
 * WelcomeTourModal — VenQore V6 Onboarding & Dashboard Walkthrough System.
 * 
 * Flow for new users:
 * 1. Big Welcome Dialog: Greets user, acknowledges fresh store with Rs. 0 revenue.
 * 2. Dashboard Empty State (Step 1): Spotlights Total Revenue / Performance card.
 * 3. Stock Value Status (Step 2): Spotlights Stock Value / Inventory card.
 * 4. Catalog Products (Step 3): Expands sidebar, spotlights Products link, routes to inventory.
 * 5. Return phases: Guides into stock purchase, POS till, and invoicing.
 */
export default function WelcomeTourModal({ store }) {
    const tt = useTermText();
    const slug = store?.slug || '';

    const [currentStep, setCurrentStep] = useState(() => {
        return store?.onboarding_step || 'welcome';
    });
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);

    // Responsive screen width check & clean up any broken legacy session run
    useEffect(() => {
        try {
            sessionStorage.removeItem('vq-tour-run');
        } catch (e) {}
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sync with backend store onboarding_step
    useEffect(() => {
        if (store?.onboarding_step) {
            setCurrentStep(store.onboarding_step);
        }
    }, [store?.onboarding_step]);

    // Listen for manual tour triggers ("Take a Tour" button or vq-tour-start event)
    useEffect(() => {
        const onStart = (e) => {
            const target = e?.detail;
            if (target === 'welcome' || !target) {
                setIsDismissed(false);
                setIsManualOpen(true);
                setCurrentStep('welcome');
            } else if (activeSteps.includes(target)) {
                setIsDismissed(false);
                setIsManualOpen(true);
                setCurrentStep(target);
            }
        };
        window.addEventListener('vq-tour-start', onStart);
        return () => window.removeEventListener('vq-tour-start', onStart);
    }, []);

    // Dispatch event to allow sidebar to auto-expand for relevant steps
    useEffect(() => {
        window.activeOnboardingStep = currentStep;
        window.dispatchEvent(new CustomEvent('onboarding-step-changed', { detail: currentStep }));
    }, [currentStep]);

    // Attach click listener for sidebar Products link during sidebar_stock step
    useEffect(() => {
        if (currentStep === 'sidebar_stock') {
            const el = document.getElementById('tour-sidebar-products') || document.querySelector('a[href*="/inventory"]');
            if (el) {
                const handleClick = () => {
                    if (slug) {
                        router.post(route('store.onboarding.step', { store_slug: slug }), { step: 'inventory_tour' }, { preserveScroll: true });
                    }
                };
                el.addEventListener('click', handleClick);
                return () => el.removeEventListener('click', handleClick);
            }
        }
    }, [currentStep, slug]);

    // Check visibility helper
    const isElementVisible = (el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return false;
        const cs = window.getComputedStyle(el);
        return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };

    // Find spotlight target element depending on the current tour step
    const getTargetElement = useCallback((step) => {
        if (typeof document === 'undefined') return null;

        if (step === 'dashboard_empty') {
            // First look for Cash in Hand in the side panel (default on desktop in V6)
            const cashCard = document.getElementById('tour-cash-in-hand') ||
                             document.querySelector('[data-reading="core.total_liquidity"]') ||
                             document.querySelector('[data-reading="core.revenue"]') ||
                             document.querySelector('#vqc-reading-core-revenue') ||
                             document.getElementById('tour-stat-revenue');
            if (cashCard && isElementVisible(cashCard)) return cashCard;
            return (
                document.getElementById('tour-cash-in-hand') ||
                document.querySelector('[data-reading="core.revenue"]') ||
                document.querySelector('#vqc-reading-core-revenue') ||
                document.getElementById('tour-stat-revenue') ||
                document.getElementById('tour-sales-chart') ||
                document.querySelector('#board .vqc') ||
                document.getElementById('board')
            );
        }

        if (step === 'stock_value') {
            // Target the Stock Value card directly in the side panel or dashboard
            const stockVal = document.getElementById('tour-stock-value') ||
                             document.querySelector('[data-reading="inventory.stock_value"]') ||
                             document.querySelector('#vqc-reading-inventory-stock_value');
            if (stockVal && isElementVisible(stockVal)) return stockVal;
            return (
                document.getElementById('tour-stock-value') ||
                document.querySelector('[data-reading="inventory.stock_value"]') ||
                document.querySelector('#board .vqc:nth-child(2)') ||
                document.getElementById('tour-low-stock') ||
                document.getElementById('board')
            );
        }

        if (step === 'sidebar_stock') {
            const link = document.getElementById('tour-sidebar-products') ||
                         document.querySelector('a[href*="/inventory"]') ||
                         document.getElementById('tour-sidebar-stock');
            if (link && isElementVisible(link)) return link;
            return document.getElementById('tour-sidebar-stock');
        }

        if (step === 'purchase_tour_sidebar') {
            const link = document.getElementById('tour-sidebar-purchases') ||
                         document.querySelector('a[href*="/purchases"]') ||
                         document.getElementById('tour-sidebar-purchase');
            if (link && isElementVisible(link)) return link;
            return document.getElementById('tour-sidebar-purchase');
        }

        if (step === 'customize_dashboard_toolbar') {
            const bar = document.getElementById('tour-customize-toolbar') ||
                        document.querySelector('.vq-board-foot') ||
                        document.getElementById('board');
            if (bar && isElementVisible(bar)) return bar;
            return document.querySelector('.vq-board-foot') || document.getElementById('board');
        }

        if (step === 'online_store_sidebar') {
            const link = document.getElementById('tour-sidebar-store-overview') ||
                         document.querySelector('a[href*="/online-store"]') ||
                         document.getElementById('tour-sidebar-online-store');
            if (link && isElementVisible(link)) return link;
            return document.getElementById('tour-sidebar-online-store');
        }

        return null;
    }, []);

    // Update target coordinates with polling to allow smooth transitions / sidebar expanding
    useEffect(() => {
        const spotlightSteps = [
            'dashboard_empty',
            'stock_value',
            'sidebar_stock',
            'purchase_tour_sidebar',
            'customize_dashboard_toolbar',
            'online_store_sidebar'
        ];
        if (!spotlightSteps.includes(currentStep)) {
            setCoords(null);
            return undefined;
        }

        let rafId;
        const measure = () => {
            const el = getTargetElement(currentStep);
            if (el && isElementVisible(el)) {
                const rect = el.getBoundingClientRect();
                setCoords((prev) => {
                    if (
                        prev &&
                        Math.abs(prev.top - rect.top) < 1 &&
                        Math.abs(prev.left - rect.left) < 1 &&
                        Math.abs(prev.width - rect.width) < 1 &&
                        Math.abs(prev.height - rect.height) < 1
                    ) {
                        return prev;
                    }
                    return {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    };
                });
            } else {
                setCoords(null);
            }
            rafId = requestAnimationFrame(measure);
        };

        const targetEl = getTargetElement(currentStep);
        if (targetEl && typeof targetEl.scrollIntoView === 'function') {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }

        rafId = requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', measure, true);
        };
    }, [currentStep, getTargetElement]);

    // Dismiss this modal/tour view without cancelling the user's checklist or marking onboarding complete
    const handleDismissModal = () => {
        setIsDismissed(true);
        setIsManualOpen(false);
        try {
            sessionStorage.setItem(`vq-tour-dismissed:${slug}`, '1');
        } catch (e) {}
    };

    // Handle skip all / close
    const handleSkipAll = () => {
        setIsDismissed(true);
        setIsManualOpen(false);
        setShowSkipConfirm(false);
        try {
            localStorage.setItem(`vq-tour-done:welcome:${slug}`, '1');
        } catch (e) {}

        if (slug) {
            setIsSubmitting(true);
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'skipped' },
                {
                    preserveScroll: true,
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    // Handle transition to Inventory page for product creation
    const handleGoToInventory = () => {
        setIsSubmitting(true);
        if (slug) {
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'inventory_tour' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(route('store.inventory.index', { store_slug: slug }));
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    // Handle transition to Purchases
    const handleGoToPurchases = () => {
        setIsSubmitting(true);
        if (slug) {
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'purchase_tour' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(route('store.purchases.create', { store_slug: slug }));
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    // Handle transition to POS
    const handleGoToPos = () => {
        setIsSubmitting(true);
        if (slug) {
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'pos_tour' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(route('store.pos', { store_slug: slug }));
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    // Handle transition to Invoice
    const handleGoToInvoice = () => {
        setIsSubmitting(true);
        if (slug) {
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'invoice_tour' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(route('store.sales.invoice.create', { store_slug: slug }));
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    // Handle transition to Expenses
    const handleGoToExpenses = () => {
        setIsSubmitting(true);
        if (slug) {
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'expense_tour' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(route('store.expenses.index', { store_slug: slug }));
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    // Handle transition to Customize Dashboard
    const handleStartCustomizeDashboard = () => {
        if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
            window.dispatchEvent(new CustomEvent('vq:edit-layout'));
            setCurrentStep('customize_dashboard_toolbar');
            setTimeout(() => {
                const bar = document.getElementById('tour-customize-toolbar') || document.querySelector('.vq-board-foot');
                if (bar && typeof bar.scrollIntoView === 'function') {
                    bar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
        } else {
            router.visit(route('store.dashboard', { store_slug: slug, edit: '1' }));
        }
    };

    // Handle transition to Online Store
    const handleGoToOnlineStore = () => {
        setIsSubmitting(true);
        if (slug) {
            router.post(
                route('store.onboarding.step', { store_slug: slug }),
                { step: 'online_store_tour' },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(route('store.commerce.home', { store_slug: slug }));
                    },
                    onFinish: () => setIsSubmitting(false),
                }
            );
        }
    };

    const activeSteps = [
        'welcome',
        'dashboard_empty',
        'stock_value',
        'sidebar_stock',
        'purchase_tour_start',
        'purchase_tour_sidebar',
        'invoice_tour_start',
        'pos_tour_start',
        'expense_tour_start',
        'customize_dashboard_tour',
        'customize_dashboard_toolbar',
        'online_store_tour',
        'online_store_sidebar',
    ];

    if (showSkipConfirm && typeof document !== 'undefined') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4">
                <div 
                    className="fixed inset-0 bg-[#06100D]/80 backdrop-blur-md transition-opacity"
                    onClick={() => setShowSkipConfirm(false)}
                />
                <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl p-6 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
                        <Rocket size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-ink">Skip entire store setup?</h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                        Are you sure you want to skip all remaining setup steps? You can always access your products, purchases, sales, and dashboard features anytime.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-end">
                        <button
                            type="button"
                            onClick={() => setShowSkipConfirm(false)}
                            className="px-4 py-2.5 rounded-xl border border-line bg-surface hover:bg-interactive-hover text-ink font-semibold text-xs transition-colors"
                        >
                            Continue Setup
                        </button>
                        <button
                            type="button"
                            onClick={handleSkipAll}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Skipping...' : 'Yes, Skip Remaining Setup'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // Determine if modal should show
    const shouldShow =
        activeSteps.includes(currentStep) &&
        !isDismissed &&
        (isManualOpen || (!store?.is_demo && !store?.onboarding_completed));

    if (!shouldShow || typeof document === 'undefined') {
        return null;
    }

    // Dynamic, resilient card positioning for spotlight tooltips
    const getTooltipPlacement = () => {
        if (!coords) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(90vw, 380px)',
                zIndex: 1105,
            };
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cardW = Math.min(360, vw - 32);
        const cardH = 220;
        const gap = 16;

        if (isMobile || vw < 768) {
            return {
                position: 'fixed',
                bottom: '16px',
                left: '16px',
                right: '16px',
                maxWidth: '420px',
                margin: '0 auto',
                zIndex: 1105,
            };
        }

        // Target is in the sidebar (left side of screen)
        if (coords.left < 280) {
            const top = Math.max(20, Math.min(vh - cardH - 20, coords.top + (coords.height / 2) - 80));
            return {
                position: 'fixed',
                top: `${top}px`,
                left: `${coords.left + coords.width + gap}px`,
                width: `${cardW}px`,
                zIndex: 1105,
                arrow: 'left',
            };
        }

        // Target is in the right panel (e.g. Cash in Hand or Stock Value)
        if (coords.left > vw - 450 || coords.left > 800) {
            const top = Math.max(20, Math.min(vh - cardH - 20, coords.top + (coords.height / 2) - 80));
            return {
                position: 'fixed',
                top: `${top}px`,
                left: `${Math.max(20, coords.left - gap - cardW)}px`,
                width: `${cardW}px`,
                zIndex: 1105,
                arrow: 'right',
            };
        }

        // Below target (default for stat cards)
        if (coords.top + coords.height + gap + cardH < vh - 20) {
            const left = Math.max(20, Math.min(vw - cardW - 20, coords.left + (coords.width / 2) - (cardW / 2)));
            return {
                position: 'fixed',
                top: `${coords.top + coords.height + gap}px`,
                left: `${left}px`,
                width: `${cardW}px`,
                zIndex: 1105,
                arrow: 'top',
            };
        }

        // Above target
        if (coords.top - gap - cardH > 20) {
            const left = Math.max(20, Math.min(vw - cardW - 20, coords.left + (coords.width / 2) - (cardW / 2)));
            return {
                position: 'fixed',
                top: `${coords.top - gap - cardH}px`,
                left: `${left}px`,
                width: `${cardW}px`,
                zIndex: 1105,
                arrow: 'bottom',
            };
        }

        // Left of target (if target is far right fallback)
        if (coords.left - gap - cardW > 20) {
            const top = Math.max(20, Math.min(vh - cardH - 20, coords.top + (coords.height / 2) - 80));
            return {
                position: 'fixed',
                top: `${top}px`,
                left: `${coords.left - gap - cardW}px`,
                width: `${cardW}px`,
                zIndex: 1105,
                arrow: 'right',
            };
        }

        return {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${cardW}px`,
            zIndex: 1105,
        };
    };

    // ─────────────────────────────────────────────────────────────
    // STEP 0: BIG WELCOME MODAL (V6 Design System)
    // ─────────────────────────────────────────────────────────────
    if (currentStep === 'welcome') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md transition-opacity duration-300"
                    onClick={handleDismissModal}
                />

                {/* Dialog Card */}
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="welcome-title"
                    className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200"
                >
                    {/* Top Accent Radial Wash (V6 Mint Signature) */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none opacity-40 dark:opacity-20"
                        style={{
                            background: 'radial-gradient(ellipse at 50% -20%, #23C4A6 0%, transparent 70%)',
                        }}
                    />

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleDismissModal}
                        disabled={isSubmitting}
                        aria-label="Close tour"
                        className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-10"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center relative z-10">
                        {/* Icon Badge */}
                        <div className="w-16 h-16 rounded-2xl bg-accent-quiet text-accent-text border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center mb-5 shadow-sm">
                            <Sparkles size={28} className="animate-pulse" />
                        </div>

                        {/* Status Chip */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 mb-3">
                            <Rocket size={13} />
                            Fresh Store Setup
                        </span>

                        {/* Heading */}
                        <h2 id="welcome-title" className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                            Welcome to <span className="text-accent-text">{store?.name || 'Your Store'}</span>!
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-ink-secondary">
                            Your workspace is ready. Let's turn this empty board into a thriving business.
                        </p>

                        <p className="mt-3 text-sm text-ink-muted leading-relaxed max-w-md">
                            Right now, your dashboard is completely empty with <span className="font-semibold text-ink">Rs. 0 in sales</span> and no stock on hand. We've prepared a quick 1-minute walkthrough to guide you through adding your first product, putting stock on the shelves, and ringing up your first sale.
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => setCurrentStep('dashboard_empty')}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                            >
                                <Rocket size={16} />
                                <span>Start Quick Tour</span>
                                <ArrowRight size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowSkipConfirm(true)}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink font-semibold text-sm transition-all"
                            >
                                Skip Tour
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // ─────────────────────────────────────────────────────────────
    // INTERMEDIATE MODALS: Purchase Tour Start, POS, Invoice, Expense
    // ─────────────────────────────────────────────────────────────
    if (currentStep === 'purchase_tour_start') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md transition-opacity duration-300" onClick={handleDismissModal} />

                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <button
                        type="button"
                        onClick={handleDismissModal}
                        disabled={isSubmitting}
                        className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-10"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5 shadow-sm">
                            <Box size={28} className="animate-bounce" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 mb-3">
                            Step 2: Inventory Inflow
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                            Next Step: Buy Stock! 📦
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-ink-secondary">
                            Your first product is cataloged, but your stock is still 0.
                        </p>

                        <p className="mt-3 text-sm text-ink-muted leading-relaxed max-w-md">
                            To sell products and generate receipts, you must first have physical units in stock. Let's record a purchase transaction to buy stock from a supplier!
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentStep('purchase_tour_sidebar');
                                    if (slug) {
                                        router.post(
                                            route('store.onboarding.step', { store_slug: slug }),
                                            { step: 'purchase_tour_sidebar' },
                                            { preserveScroll: true }
                                        );
                                    }
                                }}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                            >
                                <Package size={16} />
                                <span>Record a Purchase</span>
                                <ArrowRight size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={handleDismissModal}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink font-semibold text-sm transition-all"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (currentStep === 'pos_tour_start') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md" onClick={handleDismissModal} />

                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <button type="button" onClick={handleDismissModal} className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors">
                        <X size={18} />
                    </button>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5">
                            <ShoppingCart size={28} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-3">
                            Step 3: Point of Sale
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Open POS Register! 🛒</h2>
                        <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-md">
                            Let's test ringing up a fast counter sale using our high-speed Point of Sale register.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                            <button type="button" onClick={handleGoToPos} className="flex-1 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md flex items-center justify-center gap-2">
                                <ShoppingCart size={16} /> Open POS Register <ArrowRight size={15} />
                            </button>
                            <button type="button" onClick={handleDismissModal} className="py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary text-sm font-semibold">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (currentStep === 'invoice_tour_start') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md" onClick={handleDismissModal} />

                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <button type="button" onClick={handleDismissModal} className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors">
                        <X size={18} />
                    </button>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center mb-5">
                            <CheckCircle2 size={28} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Create Wholesale Invoice 🧾</h2>
                        <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-md">
                            Create professional B2B invoices with customer ledger integration and tax settings.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                            <button type="button" onClick={handleGoToInvoice} className="flex-1 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md flex items-center justify-center gap-2">
                                Start Invoice <ArrowRight size={15} />
                            </button>
                            <button type="button" onClick={handleDismissModal} className="py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary text-sm font-semibold">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (currentStep === 'expense_tour_start') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md" onClick={handleDismissModal} />

                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <button type="button" onClick={handleDismissModal} className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors">
                        <X size={18} />
                    </button>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center mb-5">
                            <Coins size={28} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Track Store Expenses 💸</h2>
                        <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-md">
                            Log operating expenses like rent, power, and supplies to accurately calculate your true Net Profit.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                            <button type="button" onClick={handleGoToExpenses} className="flex-1 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md flex items-center justify-center gap-2">
                                Record Expense <ArrowRight size={15} />
                            </button>
                            <button type="button" onClick={handleDismissModal} className="py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary text-sm font-semibold">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (currentStep === 'customize_dashboard_tour') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md transition-opacity duration-300" onClick={handleDismissModal} />

                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <button
                        type="button"
                        onClick={handleDismissModal}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-10"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-5 shadow-sm">
                            <Sliders size={28} className="animate-pulse" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 mb-3">
                            <LayoutDashboard size={13} />
                            Dashboard Studio · Personalize Your Workspace
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                            Customize Your Dashboard 🎨
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-ink-secondary">
                            Arrange your workspace with live metrics, charts, and layout frames that fit your workflow.
                        </p>

                        <div className="mt-5 w-full space-y-2.5 text-left text-xs text-ink-secondary">
                            <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-accent-quiet text-accent-text shrink-0 mt-0.5">
                                    <Sliders size={15} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-ink">Drag, Move & Resize</h5>
                                    <p className="text-ink-muted text-2xs mt-0.5">Drag cards to reorganize your layout, or pull the corner to expand charts for detailed insights.</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-accent-quiet text-accent-text shrink-0 mt-0.5">
                                    <Package size={15} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-ink">40+ Live Metric Cards</h5>
                                    <p className="text-ink-muted text-2xs mt-0.5">Add cards for Revenue, Gross Margin, Low Stock Warnings, Best Sellers, Debtors, Cash Flow, and more.</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-accent-quiet text-accent-text shrink-0 mt-0.5">
                                    <LayoutDashboard size={15} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-ink">Frame Presets & Auto-Tidy</h5>
                                    <p className="text-ink-muted text-2xs mt-0.5">Switch between Classic, Compact, Financial, and Retail frames, or tap Tidy up to automatically compact cards.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                type="button"
                                onClick={handleStartCustomizeDashboard}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                            >
                                <Sliders size={16} />
                                <span>Customize Dashboard Now</span>
                                <ArrowRight size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={handleDismissModal}
                                className="inline-flex items-center justify-center py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink font-semibold text-sm transition-all"
                            >
                                Keep Default Layout
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (currentStep === 'online_store_tour') {
        return createPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md transition-opacity duration-300" onClick={handleDismissModal} />

                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <button
                        type="button"
                        onClick={handleDismissModal}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="absolute top-5 right-5 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors z-10"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center mb-5 shadow-sm">
                            <Store size={28} className="animate-pulse" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 mb-3">
                            <Globe size={13} />
                            Digital Commerce · Online Storefront
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                            Create Your Online Store 🌐
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-ink-secondary">
                            Sell products 24/7 with a dedicated web catalog, mobile ordering, and delivery tracking.
                        </p>

                        <div className="mt-5 w-full space-y-2.5 text-left text-xs text-ink-secondary">
                            <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-accent-quiet text-accent-text shrink-0 mt-0.5">
                                    <Globe size={15} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-ink">Built-in Public Web Link & QR Code</h5>
                                    <p className="text-ink-muted text-2xs mt-0.5">Your store has a ready-to-share online shop at <span className="font-semibold text-ink">/shop/{slug}</span>. Share on WhatsApp, Instagram, or print QR codes for your counter.</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-accent-quiet text-accent-text shrink-0 mt-0.5">
                                    <Package size={15} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-ink">Digital Catalog & Online Pricing</h5>
                                    <p className="text-ink-muted text-2xs mt-0.5">Choose which items appear online, upload photos, and set delivery zones, pickup hours, and special online promotions.</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-accent-quiet text-accent-text shrink-0 mt-0.5">
                                    <ShoppingCart size={15} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-ink">Live Order Flow & WhatsApp / COD</h5>
                                    <p className="text-ink-muted text-2xs mt-0.5">Incoming orders ring straight into your till and order inbox with real-time status updates from kitchen to doorstep.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                type="button"
                                onClick={handleGoToOnlineStore}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                            >
                                <Store size={16} />
                                <span>Open Online Store Manager</span>
                                <ArrowRight size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentStep('online_store_sidebar')}
                                className="inline-flex items-center justify-center py-3 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink font-semibold text-sm transition-all"
                            >
                                Show in Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // ─────────────────────────────────────────────────────────────
    // SPOTLIGHT WALKTHROUGH STEPS (Step 1: Empty, Step 2: Stock, Step 3: Sidebar)
    // ─────────────────────────────────────────────────────────────
    const tooltipStyle = getTooltipPlacement();

    return createPortal(
        <div className="fixed inset-0 z-[10000100] pointer-events-none" aria-live="polite">
            {/* Cutout Spotlight Mask (Clean spotlight dimming, no colored border) */}
            {coords ? (
                <div
                    className="fixed pointer-events-none transition-all duration-200 ease-out"
                    style={{
                        top: coords.top - 4,
                        left: coords.left - 4,
                        width: coords.width + 8,
                        height: coords.height + 8,
                        borderRadius: '12px',
                        boxShadow: '0 0 0 9999px rgba(6, 16, 13, 0.72)',
                        zIndex: 10000105,
                    }}
                />
            ) : (
                <div className="fixed inset-0 bg-[#06100D]/70 pointer-events-auto z-[10000105]" />
            )}

            {/* Floating Tooltip Card (V6 Surface, Border, & Accent Styling) */}
            <div
                style={tooltipStyle}
                role="dialog"
                aria-modal="true"
                className="pointer-events-auto bg-surface border border-line rounded-2xl shadow-2xl p-5 text-ink relative z-[10000110] animate-in fade-in duration-200"
            >
                {/* Arrow Pointer on desktop */}
                {!isMobile && tooltipStyle.arrow === 'left' && (
                    <div className="absolute -left-2 top-8 w-4 h-4 bg-surface border-b border-l border-line rotate-45" />
                )}
                {!isMobile && tooltipStyle.arrow === 'top' && (
                    <div className="absolute -top-2 left-8 w-4 h-4 bg-surface border-t border-l border-line rotate-45" />
                )}
                {!isMobile && tooltipStyle.arrow === 'bottom' && (
                    <div className="absolute -bottom-2 left-8 w-4 h-4 bg-surface border-b border-r border-line rotate-45" />
                )}
                {!isMobile && tooltipStyle.arrow === 'right' && (
                    <div className="absolute -right-2 top-8 w-4 h-4 bg-surface border-t border-r border-line rotate-45" />
                )}

                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 flex items-center justify-center shrink-0">
                            {currentStep === 'dashboard_empty' && <Coins size={16} />}
                            {currentStep === 'stock_value' && <Box size={16} />}
                            {(currentStep === 'sidebar_stock' || currentStep === 'purchase_tour_sidebar') && <Package size={16} />}
                            {currentStep === 'customize_dashboard_toolbar' && <Sliders size={16} />}
                            {currentStep === 'online_store_sidebar' && <Store size={16} />}
                        </div>
                        <div className="min-w-0">
                            <span className="text-3xs font-extrabold uppercase tracking-wider text-accent-text">
                                {currentStep === 'dashboard_empty' && 'Step 1 of 3 · Cash in Hand'}
                                {currentStep === 'stock_value' && 'Step 2 of 3 · Stock Status'}
                                {currentStep === 'sidebar_stock' && 'Step 3 of 3 · Product Catalog'}
                                {currentStep === 'purchase_tour_sidebar' && 'Stock Setup · Purchases'}
                                {currentStep === 'customize_dashboard_toolbar' && 'Dashboard Studio · Grid Toolbar'}
                                {currentStep === 'online_store_sidebar' && 'Online Store · Storefront Navigation'}
                            </span>
                            <h4 className="text-sm font-bold text-ink truncate mt-0.5">
                                {currentStep === 'dashboard_empty' && 'Cash in Hand: 0.00'}
                                {currentStep === 'stock_value' && 'Stock Value: 0.00'}
                                {currentStep === 'sidebar_stock' && 'Add Your First Product'}
                                {currentStep === 'purchase_tour_sidebar' && 'Open Purchases'}
                                {currentStep === 'customize_dashboard_toolbar' && 'Add & Arrange Cards Toolbar'}
                                {currentStep === 'online_store_sidebar' && 'Access Store Overview'}
                            </h4>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismissModal}
                        aria-label="Close tour"
                        className="-mr-1.5 -mt-1.5 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Content Explanation */}
                <div className="text-xs text-ink-secondary leading-relaxed font-normal space-y-2">
                    {currentStep === 'dashboard_empty' && (
                        <p>
                            Notice your <span className="font-bold text-ink">Cash in Hand</span> and balances are currently at <span className="font-bold text-emerald-600 dark:text-emerald-400">0.00</span>. You haven't made any sales or entered opening cash yet. Every payment and transaction will automatically reflect here in real-time.
                        </p>
                    )}

                    {currentStep === 'stock_value' && (
                        <p>
                            Notice your <span className="font-bold text-ink">Stock Value</span> is also at <span className="font-bold text-teal-600 dark:text-teal-400">0.00</span> with no items available. You cannot sell or generate revenue without inventory on hand! Let's start by adding your very first product.
                        </p>
                    )}

                    {currentStep === 'sidebar_stock' && (
                        <>
                            <p>
                                Click on the highlighted <span className="font-bold text-ink">{tt('Products')}</span> link in the sidebar to open your catalog and create your first product.
                            </p>
                            {!isMobile && (
                                <p className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-2xs mt-1 animate-pulse">
                                    <ArrowLeft size={13} /> Click the highlighted Products link
                                </p>
                            )}
                        </>
                    )}

                    {currentStep === 'purchase_tour_sidebar' && (
                        <>
                            <p>
                                Click on the highlighted <span className="font-bold text-ink">{tt('Purchases')}</span> link in the sidebar to record stock arriving from your suppliers.
                            </p>
                            {!isMobile && (
                                <p className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-2xs mt-1 animate-pulse">
                                    <ArrowLeft size={13} /> Click the highlighted Purchases link
                                </p>
                            )}
                        </>
                    )}

                    {currentStep === 'customize_dashboard_toolbar' && (
                        <>
                            <p>
                                You are now in <span className="font-bold text-ink">Customize Mode</span>! Click <span className="font-bold text-ink">Add a card</span> to pick metrics, or <span className="font-bold text-ink">Suggest 3 cards</span> for smart recommendations. You can also drag cards to reposition them.
                            </p>
                            {!isMobile && (
                                <p className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-2xs mt-1 animate-pulse">
                                    <ArrowLeft size={13} /> Click Add a card to select widgets
                                </p>
                            )}
                        </>
                    )}

                    {currentStep === 'online_store_sidebar' && (
                        <>
                            <p>
                                Click on the highlighted <span className="font-bold text-ink">Store Overview</span> link to open your online store management hub, view your public web link, and set delivery options.
                            </p>
                            {!isMobile && (
                                <p className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-2xs mt-1 animate-pulse">
                                    <ArrowLeft size={13} /> Click Store Overview to get started
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => setShowSkipConfirm(true)}
                        className="text-2xs font-semibold text-ink-muted hover:text-ink transition-colors"
                    >
                        Skip tour
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStep === 'dashboard_empty' && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep('welcome')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-interactive-hover transition-colors"
                            >
                                <ArrowLeft size={13} /> Back
                            </button>
                        )}

                        {currentStep === 'stock_value' && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep('dashboard_empty')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-interactive-hover transition-colors"
                            >
                                <ArrowLeft size={13} /> Back
                            </button>
                        )}

                        {currentStep === 'sidebar_stock' && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep('stock_value')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-interactive-hover transition-colors"
                            >
                                <ArrowLeft size={13} /> Back
                            </button>
                        )}

                        {currentStep === 'customize_dashboard_toolbar' && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep('customize_dashboard_tour')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-interactive-hover transition-colors"
                            >
                                <ArrowLeft size={13} /> Back
                            </button>
                        )}

                        {currentStep === 'online_store_sidebar' && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep('online_store_tour')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-interactive-hover transition-colors"
                            >
                                <ArrowLeft size={13} /> Back
                            </button>
                        )}

                        {currentStep === 'dashboard_empty' && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep('stock_value')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                            >
                                Next Step <ArrowRight size={13} />
                            </button>
                        )}

                        {currentStep === 'stock_value' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentStep('sidebar_stock');
                                    if (slug) {
                                        router.post(
                                            route('store.onboarding.step', { store_slug: slug }),
                                            { step: 'sidebar_stock' },
                                            { preserveScroll: true }
                                        );
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                            >
                                Next Step <ArrowRight size={13} />
                            </button>
                        )}

                        {currentStep === 'sidebar_stock' && (
                            <button
                                type="button"
                                onClick={handleGoToInventory}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Let's Add Product <ArrowRight size={13} />
                            </button>
                        )}

                        {currentStep === 'purchase_tour_sidebar' && (
                            <button
                                type="button"
                                onClick={handleGoToPurchases}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Go to Purchases <ArrowRight size={13} />
                            </button>
                        )}

                        {currentStep === 'customize_dashboard_toolbar' && (
                            <button
                                type="button"
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('vq:add-card'));
                                    handleDismissModal();
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                            >
                                Open Card Picker <ArrowRight size={13} />
                            </button>
                        )}

                        {currentStep === 'online_store_sidebar' && (
                            <button
                                type="button"
                                onClick={handleGoToOnlineStore}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Go to Store Overview <ArrowRight size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
