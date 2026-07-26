import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { Sparkles, Compass, Rocket, ArrowRight, X, ArrowLeft, Box, HelpCircle } from 'lucide-react';

export default function WelcomeTourModal({ store }) {
    const [currentStep, setCurrentStep] = useState(() => {
        return store?.onboarding_step || 'welcome';
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const handleSkipAll = () => {
        setIsDismissed(true);
        try {
            router.post(
                route('store.onboarding.step', { store_slug: store?.slug }),
                { step: 'skipped' },
                {
                    preserveScroll: true,
                    onError: () => {},
                    onFinish: () => setIsSubmitting(false),
                }
            );
        } catch (e) {
            // Safe fallback if route or request fails
        }
    };

    const renderPortal = (content) => {
        if (typeof document === 'undefined') return null;
        return createPortal(content, document.body);
    };

    console.log('WelcomeTourModal render - currentStep:', currentStep, 'coords:', coords, 'store onboarding_step:', store?.onboarding_step, 'element:', typeof document !== 'undefined' ? document.getElementById('tour-stock-value') : 'no doc');

    // Sync currentStep with store state changes
    useEffect(() => {
        if (store?.onboarding_step) {
            setCurrentStep(store.onboarding_step);
        }
    }, [store?.onboarding_step]);

    // Track screen width for responsiveness
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Dispatch tour step events to let layouts/sidebar react (e.g. auto-expand)
    useEffect(() => {
        window.activeOnboardingStep = currentStep;
        window.dispatchEvent(new CustomEvent('onboarding-step-changed', { detail: currentStep }));
    }, [currentStep]);

    // Intercept click on the sidebar links during tour steps
    useEffect(() => {
        if (currentStep !== 'sidebar_stock' && currentStep !== 'purchase_tour_sidebar') return;

        let attempts = 0;
        const attachListener = () => {
            const targetId = currentStep === 'sidebar_stock' ? 'tour-sidebar-products' : 'tour-sidebar-purchases';
            const el = document.getElementById(targetId);
            if (el) {
                const handleSidebarClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (currentStep === 'sidebar_stock') {
                        handleFinalizeTour();
                    } else {
                        handleFinalizePurchaseTourStart();
                    }
                };
                el.addEventListener('click', handleSidebarClick);
                return () => {
                    el.removeEventListener('click', handleSidebarClick);
                };
            } else if (attempts < 10) {
                attempts++;
                setTimeout(attachListener, 100);
            }
        };

        return attachListener();
    }, [currentStep, store]);

    // Update target coordinates for highlighting
    useEffect(() => {
        if (currentStep === 'welcome' || currentStep === 'purchase_tour_start') {
            setCoords(null);
            return;
        }

        const getVisibleElement = (id) => {
            const elements = document.querySelectorAll(`[id="${id}"]`);
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return el;
                }
            }
            return elements[0] || null;
        };

        const updateCoords = () => {
            let targetId = 'tour-stock-value';
            if (currentStep === 'sidebar_stock') {
                targetId = 'tour-sidebar-products';
            } else if (currentStep === 'purchase_tour_sidebar') {
                targetId = 'tour-sidebar-purchases';
            }

            const el = getVisibleElement(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setCoords(prev => {
                    if (prev && 
                        prev.top === rect.top && 
                        prev.left === rect.left && 
                        prev.width === rect.width && 
                        prev.height === rect.height) {
                        return prev; // No change, skip state update to prevent infinite re-renders
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
        };

        // Delay slightly to allow the sidebar expand animation to complete
        const timer = setTimeout(updateCoords, 300);

        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);

        // Keep updating coordinates while sidebar expands to prevent lag
        const interval = setInterval(updateCoords, 50);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [currentStep]);

    const handleUpdateStep = (stepValue, completedStepValue = null) => {
        setIsSubmitting(true);
        const data = { step: stepValue };
        if (completedStepValue) {
            data.completed_step = completedStepValue;
        }
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            data,
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleStartInvoiceTour = () => {
        setIsSubmitting(true);
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'invoice_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.sales.invoice.create', { store_slug: store?.slug }));
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleStartPosTour = () => {
        setIsSubmitting(true);
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'pos_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.pos', { store_slug: store?.slug }));
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleStartExpenseTour = () => {
        setIsSubmitting(true);
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'expense_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.expenses.index', { store_slug: store?.slug }));
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleSkipInvoiceOrPos = () => {
        const doneSteps = store?.onboarding_steps_done || [];
        const nextStep = !doneSteps.includes('pos') ? 'pos_tour_start' : 'expense_tour_start';
        handleUpdateStep(nextStep, 'invoice');
    };

    const handleSkipPos = () => {
        const doneSteps = store?.onboarding_steps_done || [];
        const nextStep = !doneSteps.includes('invoice') ? 'invoice_tour_start' : 'expense_tour_start';
        handleUpdateStep(nextStep, 'pos');
    };

    const handleSkipExpense = () => {
        handleUpdateStep('completed', 'expense');
    };

    const handleFinalizeTour = () => {
        setIsSubmitting(true);
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'inventory_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Navigate directly to the inventory listing
                    router.visit(route('store.inventory.index', { store_slug: store?.slug }));
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleFinalizePurchaseTourStart = () => {
        setIsSubmitting(true);
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'purchase_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Navigate to purchases create page
                    router.visit(route('store.purchases.create', { store_slug: store?.slug }));
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const activeSteps = [
        'welcome',
        'purchase_tour_start',
        'invoice_tour_start',
        'pos_tour_start',
        'expense_tour_start',
        'stock_value',
        'sidebar_stock',
        'purchase_tour_sidebar'
    ];

    if (!activeSteps.includes(currentStep) || store?.onboarding_completed || store?.is_demo || isDismissed) {
        return null;
    }

    // Welcome Screen
    if (currentStep === 'welcome') {
        return renderPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
                    <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={handleSkipAll}
                            disabled={isSubmitting}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10"
                            title="Skip Tour"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce">
                                <Sparkles className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                                Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{store?.name || 'Your Store'}</span>!
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                Your store setup is complete. Let's get you up and running!
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                To help you get the most out of VenQore, we have prepared a quick, interactive tour of the platform. We will show you how to add your first product and manage stock.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={() => setCurrentStep('stock_value')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Rocket size={18} />
                                    <span>Start the Tour</span>
                                    <ArrowRight size={16} className="ml-1" />
                                </button>

                                <button
                                    onClick={handleSkipAll}
                                    disabled={isSubmitting}
                                    className="py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200"
                                >
                                    Skip Tour
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Purchase Tour Start Modal
    if (currentStep === 'purchase_tour_start') {
        return renderPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
                    <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={() => handleUpdateStep('skipped')}
                            disabled={isSubmitting}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10"
                            title="Skip Tour"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce">
                                <Sparkles className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                                Next Step: Buy Stock! 📦
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                Your first product is cataloged, but your stock is still 0.
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                To sell products and print invoices, you must first add stock to your inventory. Let's record a purchase transaction to buy inventory from a supplier!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={() => setCurrentStep('purchase_tour_sidebar')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Rocket size={18} />
                                    <span>Record a Purchase</span>
                                    <ArrowRight size={16} className="ml-1" />
                                </button>

                                <button
                                    onClick={() => handleUpdateStep('skipped')}
                                    disabled={isSubmitting}
                                    className="py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200"
                                >
                                    Skip Tour
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Invoice Tour Start Modal
    if (currentStep === 'invoice_tour_start') {
        return renderPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
                    <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={handleSkipInvoiceOrPos}
                            disabled={isSubmitting}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10"
                            title="Skip Step"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce">
                                <Sparkles className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                                Generate B2B Invoice! 🧾
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                Stage 3: Make Your First Wholesale/B2B Sale
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                To complete your onboarding, let's create a professional B2B sale invoice for a client purchase. We'll guide you step-by-step.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={handleStartInvoiceTour}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Rocket size={18} />
                                    <span>Start Invoice Tour</span>
                                    <ArrowRight size={16} className="ml-1" />
                                </button>

                                <button
                                    onClick={handleSkipInvoiceOrPos}
                                    disabled={isSubmitting}
                                    className="py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200"
                                >
                                    Skip Step
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // POS Tour Start Modal
    if (currentStep === 'pos_tour_start') {
        return renderPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
                    <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={handleSkipPos}
                            disabled={isSubmitting}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10"
                            title="Skip Step"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6 animate-bounce">
                                <Sparkles className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                                Open POS Register! 🛒
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                Stage 3: Make Your First Retail POS Sale
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                Let's test checking out a retail sale using our high-speed, beautiful Point of Sale interface. We'll guide you step-by-step.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={handleStartPosTour}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Rocket size={18} />
                                    <span>Start POS Tour</span>
                                    <ArrowRight size={16} className="ml-1" />
                                </button>

                                <button
                                    onClick={handleSkipPos}
                                    disabled={isSubmitting}
                                    className="py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200"
                                >
                                    Skip Step
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Expense Tour Start Modal
    if (currentStep === 'expense_tour_start') {
        return renderPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
                    <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <button
                            onClick={handleSkipExpense}
                            disabled={isSubmitting}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all duration-200 z-10"
                            title="Skip Step"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce">
                                <Sparkles className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                                Record Store Expenses! 💸
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                Stage 4: Add Store Operation Expense
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                To get an accurate picture of your net profits, let's record a store operating expense (like rent or utilities) in the expenses log. We'll guide you step-by-step.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={handleStartExpenseTour}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Rocket size={18} />
                                    <span>Start Expense Tour</span>
                                    <ArrowRight size={16} className="ml-1" />
                                </button>

                                <button
                                    onClick={handleSkipExpense}
                                    disabled={isSubmitting}
                                    className="py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200"
                                >
                                    Skip Step
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Coordinates-based placement
    const getTooltipStyle = () => {
        if (!coords) return { display: 'none' };

        if (isMobile) {
            return {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 151,
            };
        }

        if (currentStep === 'stock_value') {
            return {
                position: 'fixed',
                top: coords.top + (coords.height / 2) - 90,
                left: coords.left - 340,
                width: '320px',
                zIndex: 151,
            };
        }

        if (currentStep === 'sidebar_stock' || currentStep === 'purchase_tour_sidebar') {
            return {
                position: 'fixed',
                top: coords.top + (coords.height / 2) - 80,
                left: coords.left + coords.width + 20,
                width: '320px',
                zIndex: 151,
            };
        }

        return {};
    };

    return renderPortal(
        <div className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
            {/* Spotlight Highlighter Mask */}
            {coords && (
                <div
                    className="fixed pointer-events-none transition-all duration-100 ease-out"
                    style={{
                        top: coords.top - 6,
                        left: coords.left - 6,
                        width: coords.width + 12,
                        height: coords.height + 12,
                        borderRadius: currentStep === 'stock_value' ? '24px' : '8px',
                        boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 18px 6px rgba(99, 102, 241, 0.45), 0 0 0 2px rgb(99, 102, 241)',
                        zIndex: 150,
                    }}
                />
            )}

            {/* Backdrop placeholder if coordinates are loading */}
            {!coords && (
                <div className="fixed inset-0 bg-slate-950/75 pointer-events-auto z-[150]"></div>
            )}

            {/* Floating Tooltip Box */}
            <div
                style={getTooltipStyle()}
                className="bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-[151] animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
                {/* Arrow indicator (Desktop only) */}
                {!isMobile && currentStep === 'stock_value' && (
                    <div className="absolute right-0 top-[90px] -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-900 border-t border-r border-indigo-500/30 rotate-45 z-10" />
                )}
                {!isMobile && (currentStep === 'sidebar_stock' || currentStep === 'purchase_tour_sidebar') && (
                    <div className="absolute left-0 top-[80px] -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-l border-indigo-500/30 rotate-45 z-10" />
                )}

                {/* Content */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                        <Box size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {currentStep === 'stock_value' ? 'Inventory Status' : 'Add First Purchase'}
                        </h4>
                        <span className="text-[10px] font-semibold text-indigo-400">
                            {currentStep === 'stock_value' ? 'Step 1 of 2' : 'Step 2 of 2'}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentStep === 'stock_value' && (
                        <>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Your <span className="text-white font-bold">Stock Value is Rs. 0</span>. We need to add stock in order to sell and generate invoices.
                            </p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setCurrentStep('welcome')}
                                    className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft size={12} />
                                    <span>Back</span>
                                </button>
                                <button
                                    onClick={() => setCurrentStep('sidebar_stock')}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                >
                                    <span>Next Step</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </>
                    )}

                    {currentStep === 'sidebar_stock' && (
                        <>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Let's add your first product. Click on the highlighted <span className="text-white font-bold">Products</span> menu link in the sidebar to open the catalog.
                            </p>

                            {!isMobile && (
                                <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold animate-bounce mt-1">
                                    <ArrowLeft size={14} className="animate-pulse" />
                                    <span>Click on the highlighted Products link</span>
                                </div>
                            )}

                            <div className="flex gap-2 justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('stock_value')}
                                    className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft size={12} />
                                    <span>Back</span>
                                </button>

                                <button
                                    onClick={handleFinalizeTour}
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <span>Let's Add Product</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </>
                    )}

                    {currentStep === 'purchase_tour_sidebar' && (
                        <>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Let's record your first purchase. Click on the highlighted <span className="text-white font-bold">Purchases</span> menu link in the sidebar to create a new purchase transaction.
                            </p>

                            {!isMobile && (
                                <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold animate-bounce mt-1">
                                    <ArrowLeft size={14} className="animate-pulse" />
                                    <span>Click on the highlighted Purchases link</span>
                                </div>
                            )}

                            <div className="flex gap-2 justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('purchase_tour_start')}
                                    className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors animate-in duration-300"
                                >
                                    <ArrowLeft size={12} />
                                    <span>Back</span>
                                </button>

                                <button
                                    onClick={handleFinalizePurchaseTourStart}
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <span>Go to Purchases</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
