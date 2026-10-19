import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Trophy, Package, X } from 'lucide-react';
import axios from 'axios';
import { useTermText } from '@/lib/terms';

export default function PurchaseTourGuide({ store, suppliers = [] }) {
    const tt = useTermText();
    const { onboarding_metrics } = usePage().props;
    const initialEmpty = Array.isArray(suppliers) ? suppliers.length === 0 : false;
    const [hasSuppliers, setHasSuppliers] = useState(() => !initialEmpty);
    const [isSupplierCreationPath, setIsSupplierCreationPath] = useState(() => initialEmpty);
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const renderPortal = (content) => {
        if (typeof document === 'undefined') return null;
        return createPortal(content, document.body);
    };

    const isEarlyOnboarding = !store?.onboarding_completed && !onboarding_metrics?.has_purchases;
    const isVisible = ['purchase_tour', 'purchase_congratulations', 'purchase_tour_sidebar', 'purchase_tour_start'].includes(store?.onboarding_step)
        || isEarlyOnboarding;

    // Promote step to purchase_tour if entering purchases create during onboarding
    useEffect(() => {
        if (store?.slug && !store?.onboarding_completed && (store?.onboarding_step === 'purchase_tour_sidebar' || store?.onboarding_step === 'purchase_tour_start' || isEarlyOnboarding)) {
            if (store?.onboarding_step !== 'purchase_tour' && store?.onboarding_step !== 'purchase_congratulations') {
                router.post(
                    route('store.onboarding.step', { store_slug: store.slug }),
                    { step: 'purchase_tour' },
                    { preserveScroll: true }
                );
            }
        }
    }, [store?.slug, store?.onboarding_step, store?.onboarding_completed, isEarlyOnboarding]);

    // Check if store has suppliers if suppliers array prop wasn't preloaded
    useEffect(() => {
        if (Array.isArray(suppliers) && suppliers.length > 0) {
            setHasSuppliers(true);
            setIsSupplierCreationPath(false);
            return;
        }

        if (isVisible && (!suppliers || suppliers.length === 0)) {
            axios.get(route('store.parties.search', { store_slug: store?.slug }), { params: { query: '', type: 'supplier' } })
                .then(res => {
                    const list = res.data || [];
                    const empty = list.length === 0;
                    setHasSuppliers(!empty);
                    setIsSupplierCreationPath(empty);
                })
                .catch(() => {
                    // Default to supplier creation path if no suppliers found
                    setHasSuppliers(false);
                    setIsSupplierCreationPath(true);
                });
        }
    }, [isVisible, store?.slug, suppliers]);

    // Track mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get DOM IDs for each step with fallback awareness
    const getTargetId = (step) => {
        if (isSupplierCreationPath) {
            switch (step) {
                case 0: return 'tour-purchase-supplier';
                case 1: return 'tour-add-new-party-btn';
                case 2: return 'tour-party-name';
                case 3: return 'tour-party-phone';
                case 4: return 'tour-party-address';
                case 5: return 'tour-party-submit';
                case 6: return 'tour-purchase-product';
                case 7: return 'tour-purchase-quantity';
                case 8: return 'tour-purchase-cost';
                case 9: return 'tour-purchase-paid';
                case 10: return 'tour-purchase-save';
                default: return null;
            }
        } else {
            switch (step) {
                case 0: return 'tour-purchase-supplier';
                case 1: return 'tour-purchase-product';
                case 2: return 'tour-purchase-quantity';
                case 3: return 'tour-purchase-cost';
                case 4: return 'tour-purchase-paid';
                case 5: return 'tour-purchase-save';
                default: return null;
            }
        }
    };

    // Auto-advance logic on interaction
    useEffect(() => {
        if (!isVisible || isDismissed) return;

        const interval = setInterval(() => {
            const activeId = document.activeElement?.id;

            if (isSupplierCreationPath) {
                if (currentStep === 0) {
                    if (document.getElementById('tour-add-new-party-btn')) {
                        setCurrentStep(1);
                    } else if (document.getElementById('tour-party-name')) {
                        setCurrentStep(2);
                    }
                } else if (currentStep === 1) {
                    if (document.getElementById('tour-party-name')) {
                        setCurrentStep(2);
                    } else if (!document.getElementById('tour-add-new-party-btn')) {
                        setCurrentStep(0);
                    }
                } else if (currentStep >= 2 && currentStep <= 5) {
                    if (!document.getElementById('tour-party-name')) {
                        // Modal closed: proceed to product selection step
                        setCurrentStep(6);
                    } else {
                        if (activeId === 'tour-party-phone' && currentStep < 3) {
                            setCurrentStep(3);
                        } else if (activeId === 'tour-party-address' && currentStep < 4) {
                            setCurrentStep(4);
                        } else if ((activeId === 'tour-party-submit' || document.getElementById('tour-party-submit')?.contains(document.activeElement)) && currentStep < 5) {
                            setCurrentStep(5);
                        } else if (activeId === 'tour-party-name' && currentStep !== 2) {
                            setCurrentStep(2);
                        }
                    }
                } else if (currentStep === 6) {
                    if (activeId === 'tour-purchase-quantity' || activeId === 'tour-invoice-quantity' || document.activeElement?.classList?.contains('w-qty')) setCurrentStep(7);
                } else if (currentStep === 7) {
                    if (activeId === 'tour-purchase-cost' || activeId === 'tour-invoice-rate' || document.activeElement?.classList?.contains('w-num')) setCurrentStep(8);
                } else if (currentStep === 8) {
                    if (activeId === 'tour-purchase-paid' || activeId === 'tour-invoice-paid' || document.getElementById('tour-purchase-paid-row')?.contains(document.activeElement)) setCurrentStep(9);
                } else if (currentStep === 9) {
                    if (activeId === 'tour-purchase-save' || activeId === 'tour-invoice-complete') setCurrentStep(10);
                }
            } else {
                if (currentStep === 0) {
                    if (document.getElementById('tour-party-name')) {
                        setIsSupplierCreationPath(true);
                        setCurrentStep(2);
                    } else if (activeId === 'tour-purchase-product' || activeId === 'tour-invoice-product') {
                        setCurrentStep(1);
                    }
                } else if (currentStep === 1) {
                    if (activeId === 'tour-purchase-quantity' || activeId === 'tour-invoice-quantity' || document.activeElement?.classList?.contains('w-qty')) setCurrentStep(2);
                } else if (currentStep === 2) {
                    if (activeId === 'tour-purchase-cost' || activeId === 'tour-invoice-rate' || document.activeElement?.classList?.contains('w-num')) setCurrentStep(3);
                } else if (currentStep === 3) {
                    if (activeId === 'tour-purchase-paid' || activeId === 'tour-invoice-paid' || document.getElementById('tour-purchase-paid-row')?.contains(document.activeElement)) setCurrentStep(4);
                } else if (currentStep === 4) {
                    if (activeId === 'tour-purchase-save' || activeId === 'tour-invoice-complete') setCurrentStep(5);
                }
            }
        }, 150);

        return () => clearInterval(interval);
    }, [currentStep, isVisible, isDismissed, isSupplierCreationPath]);

    const resolveTargetEl = (targetId) => {
        if (!targetId) return null;
        return document.getElementById(targetId) ||
            (targetId === 'tour-purchase-supplier' ? document.getElementById('tour-invoice-customer') : null) ||
            (targetId === 'tour-purchase-product' ? (document.getElementById('tour-invoice-product') || document.querySelector('.vqdoc-combo input')) : null) ||
            (targetId === 'tour-purchase-quantity' ? (document.getElementById('tour-invoice-quantity') || document.querySelector('input.w-qty') || document.querySelector('.w-qty input')) : null) ||
            (targetId === 'tour-purchase-cost' ? (document.getElementById('tour-invoice-rate') || document.querySelector('input.w-num') || document.querySelector('.w-num input')) : null) ||
            (targetId === 'tour-purchase-paid' ? (document.getElementById('tour-purchase-paid') || document.getElementById('tour-purchase-paid-row') || document.getElementById('tour-invoice-paid')) : null) ||
            (targetId === 'tour-purchase-save' ? document.getElementById('tour-invoice-complete') : null);
    };

    // Scroll active element into view and update spotlight coordinates
    useEffect(() => {
        if (!isVisible || isDismissed || store?.onboarding_step === 'purchase_congratulations') {
            setCoords(null);
            return;
        }

        const updateCoords = () => {
            const targetId = getTargetId(currentStep);
            const el = resolveTargetEl(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setCoords({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    });
                    return;
                }
            }
            setCoords(null);
        };

        const targetId = getTargetId(currentStep);
        const el = resolveTargetEl(targetId);
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(updateCoords, 100);
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);

        const interval = setInterval(updateCoords, 80);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [currentStep, isVisible, isDismissed, store?.onboarding_step, isSupplierCreationPath]);

    const handleStartInvoiceTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'invoice_tour_start' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.sales.invoice.create', { store_slug: store?.slug }));
                }
            }
        );
    };

    const handleStartPosTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'pos_tour_start' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.pos', { store_slug: store?.slug }));
                }
            }
        );
    };

    const handleCompleteTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.dashboard', { store_slug: store?.slug }));
                }
            }
        );
    };

    if (!isVisible || isDismissed) return null;

    // Renders the Congratulations Modal at the end of the tour
    if (store?.onboarding_step === 'purchase_congratulations') {
        return renderPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md transition-opacity duration-300" />
                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5 shadow-sm">
                            <Trophy size={28} className="animate-bounce" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 mb-3">
                            Step 2 Complete
                        </span>

                        <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight mb-2">
                            Stock Added! 🎉
                        </h2>

                        <p className="text-sm font-semibold text-ink-secondary mb-2">
                            Your first purchase was recorded successfully!
                        </p>

                        <p className="text-xs text-ink-muted leading-relaxed max-w-sm mb-6">
                            Congratulations! You have added stock to your inventory catalog. Now let's try making your first sale to generate an invoice or POS receipt!
                        </p>

                        <div className="flex flex-col gap-2.5 w-full">
                            <button
                                type="button"
                                onClick={handleStartInvoiceTour}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                            >
                                <span>Create B2B Invoice</span>
                                <ArrowRight size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={handleStartPosTour}
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                            >
                                <span>Go to POS Register</span>
                                <ArrowRight size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={handleCompleteTour}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink font-semibold text-xs transition-all cursor-pointer mt-1"
                            >
                                <span>Skip & Finish Setup</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getTooltipStyle = () => {
        if (!coords) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 10000110,
            };
        }

        if (isMobile) {
            return {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 10000110,
            };
        }

        const spaceOnRight = window.innerWidth - (coords.left + coords.width);
        const spaceOnLeft = coords.left;

        if (spaceOnRight >= 300) {
            return {
                position: 'fixed',
                top: Math.max(20, Math.min(window.innerHeight - 300, coords.top + (coords.height / 2) - 80)),
                left: coords.left + coords.width + 16,
                width: Math.min(320, spaceOnRight - 24),
                zIndex: 10000110,
            };
        } else if (spaceOnLeft >= 300) {
            return {
                position: 'fixed',
                top: Math.max(20, Math.min(window.innerHeight - 300, coords.top + (coords.height / 2) - 80)),
                left: Math.max(16, coords.left - Math.min(320, spaceOnLeft - 24) - 16),
                width: Math.min(320, spaceOnLeft - 24),
                zIndex: 10000110,
            };
        } else {
            const placeAbove = coords.top > 220 && (window.innerHeight - (coords.top + coords.height)) < 220;
            return {
                position: 'fixed',
                top: placeAbove
                    ? Math.max(16, coords.top - 200)
                    : Math.min(window.innerHeight - 240, coords.top + coords.height + 16),
                left: Math.max(16, Math.min(window.innerWidth - 336, coords.left + (coords.width / 2) - 160)),
                width: '320px',
                zIndex: 10000110,
            };
        }
    };

    return renderPortal(
        <div className="fixed inset-0 z-[10000100] overflow-hidden pointer-events-none">
            {/* Dimming Mask / Spotlight */}
            {coords && (
                <div
                    className="fixed pointer-events-none transition-all duration-fast ease-out"
                    style={{
                        top: coords.top - 6,
                        left: coords.left - 6,
                        width: coords.width + 12,
                        height: coords.height + 12,
                        borderRadius: '12px',
                        boxShadow: '0 0 0 9999px rgba(6, 16, 13, 0.72)',
                        border: '2px solid rgba(45, 212, 191, 0.45)',
                        zIndex: 10000105,
                    }}
                />
            )}

            {!coords && (
                <div className="fixed inset-0 bg-[#06100D]/70 pointer-events-none z-[10000100]"></div>
            )}

            {/* Floating Tooltip Card */}
            <div
                style={getTooltipStyle()}
                className="bg-surface border border-line rounded-2xl shadow-2xl p-5 text-ink pointer-events-auto relative z-[10000110] animate-in fade-in duration-slow"
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 rounded-lg shrink-0">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink uppercase tracking-wider">
                                Purchase Tour
                            </h4>
                            <span className="text-2xs font-semibold text-accent-text">
                                Step {currentStep + 1} of {isSupplierCreationPath ? 11 : 6}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsDismissed(true)}
                        aria-label="Close tour"
                        className="-mr-1.5 -mt-1.5 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="space-y-4">
                    {isSupplierCreationPath ? (
                        <>
                            {currentStep === 0 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    {tt("You don't have any suppliers yet! Click on the")} <span className="text-ink font-bold">Search anyone you buy from</span> input.
                                </p>
                            )}
                            {currentStep === 1 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Now click <span className="text-ink font-bold">+ Add a new one</span> at the bottom of the dropdown.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    {tt("Put in the supplier's")} <span className="text-ink font-bold">Name</span> inside the modal.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Put in their <span className="text-ink font-bold">Phone Number</span>.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Put in their <span className="text-ink font-bold">Address</span>.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    {tt('Click')} <span className="text-ink font-bold">{tt('Create Supplier')}</span> {tt('to save the supplier.')}
                                </p>
                            )}
                            {currentStep === 6 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    {tt('Great! Now click on the')} <span className="text-ink font-bold">{tt('Search for an item')}</span> {tt('field and select the product you created.')}
                                </p>
                            )}
                            {currentStep === 7 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Set the <span className="text-ink font-bold">Quantity (QTY)</span> of items purchased.
                                </p>
                            )}
                            {currentStep === 8 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Verify or adjust the purchase <span className="text-ink font-bold">Unit Price</span>.
                                </p>
                            )}
                            {currentStep === 9 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Enter the <span className="text-ink font-bold">Amount Paid</span> (or click Exact to settle in full).
                                </p>
                            )}
                            {currentStep === 10 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click <span className="text-ink font-bold">Record purchase</span> to save this transaction and add stock!
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            {currentStep === 0 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    {tt('Select a')} <span className="text-ink font-bold">{tt('Supplier')}</span> you are purchasing stock from.
                                </p>
                            )}
                            {currentStep === 1 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    {tt('Click')} <span className="text-ink font-bold">{tt('Search for an item')}</span> {tt('and pick the product you cataloged.')}
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Set the <span className="text-ink font-bold">Quantity (QTY)</span> of items purchased.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Verify or set the purchase <span className="text-ink font-bold">Unit Price</span>.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Enter the <span className="text-ink font-bold">Amount Paid</span> (click Exact to pay in full, or 0 if on credit).
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click <span className="text-ink font-bold">Record purchase</span> to save and complete stock addition!
                                </p>
                            )}
                        </>
                    )}

                    <div className="flex gap-2 justify-between items-center pt-2 border-t border-line">
                        {currentStep > 0 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sunken hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < (isSupplierCreationPath ? 10 : 5) && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-accent-fill hover:bg-accent-fill-hover text-accent-on text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                            >
                                <span>Next</span>
                                <ArrowRight size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
