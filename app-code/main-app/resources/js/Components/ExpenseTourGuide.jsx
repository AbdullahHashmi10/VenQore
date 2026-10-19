import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Trophy, LayoutDashboard, Globe, Check } from 'lucide-react';
import { useTermText } from '@/lib/terms';

export default function ExpenseTourGuide({ store, categories = [] }) {
    const tt = useTermText();
    const { onboarding_metrics } = usePage().props;
    const [isCategoryCreationPath, setIsCategoryCreationPath] = useState(() => !categories || categories.length === 0);
    const [currentStep, setCurrentStep] = useState(0); // 0: Intro, 1: Record button, ...
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const renderPortal = (content) => {
        if (typeof document === 'undefined') return null;
        return createPortal(content, document.body);
    };

    const isEarlyOnboarding = !store?.onboarding_completed && !onboarding_metrics?.has_expenses;
    const isVisible = ['expense_tour', 'expense_congratulations', 'expense_tour_start'].includes(store?.onboarding_step)
        || isEarlyOnboarding;

    // Promote step to expense_tour if arriving on expenses screen during onboarding
    useEffect(() => {
        if (store?.slug && !store?.onboarding_completed && (store?.onboarding_step === 'expense_tour_start' || isEarlyOnboarding)) {
            if (store?.onboarding_step !== 'expense_tour' && store?.onboarding_step !== 'expense_congratulations') {
                router.post(
                    route('store.onboarding.step', { store_slug: store.slug }),
                    { step: 'expense_tour' },
                    { preserveScroll: true }
                );
            }
        }
    }, [store?.slug, store?.onboarding_step, store?.onboarding_completed, isEarlyOnboarding]);

    // Keep category path up to date if categories populate
    useEffect(() => {
        if (categories && categories.length > 0) {
            setIsCategoryCreationPath(false);
        } else {
            setIsCategoryCreationPath(true);
        }
    }, [categories]);

    // Track mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getTargetId = (step) => {
        if (isCategoryCreationPath) {
            switch (step) {
                case 1: return 'tour-expense-create-btn';
                case 2: return 'tour-expense-category';
                case 3: return 'tour-add-expense-category-btn';
                case 4: return 'tour-new-expense-category-name';
                case 5: return 'tour-expense-amount';
                case 6: return 'tour-expense-description';
                case 7: return 'tour-expense-submit';
                default: return null;
            }
        } else {
            switch (step) {
                case 1: return 'tour-expense-create-btn';
                case 2: return 'tour-expense-category';
                case 3: return 'tour-expense-amount';
                case 4: return 'tour-expense-description';
                case 5: return 'tour-expense-submit';
                default: return null;
            }
        }
    };

    const resolveTargetEl = (targetId) => {
        if (!targetId) return null;
        return document.getElementById(targetId) ||
            (targetId === 'tour-expense-create-btn' ? (document.getElementById('tour-expense-create-btn-mobile') || document.querySelector('[data-add-expense]') || document.querySelector('button[title*="Record"]')) : null) ||
            (targetId === 'tour-expense-category' ? document.querySelector('.vq-expense-category') : null) ||
            (targetId === 'tour-expense-amount' ? (document.getElementById('tour-expense-amount-input') || document.querySelector('input[name="amount"]')) : null) ||
            (targetId === 'tour-expense-description' ? (document.getElementById('tour-expense-desc-input') || document.querySelector('input[name="title"]')) : null) ||
            (targetId === 'tour-expense-submit' ? document.querySelector('button[type="submit"]') : null);
    };

    useEffect(() => {
        if (!isVisible || store?.onboarding_step === 'expense_congratulations') {
            setCoords(null);
            return;
        }

        const updateCoords = () => {
            const targetId = getTargetId(currentStep);
            const el = resolveTargetEl(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                let top = rect.top;
                let left = rect.left;
                let right = rect.right;
                let bottom = rect.bottom;

                // Expand for absolutely positioned dropdowns
                const dropdown = el.querySelector('.absolute');
                if (dropdown && window.getComputedStyle(dropdown).display !== 'none' && dropdown.getBoundingClientRect().height > 0) {
                    const dropRect = dropdown.getBoundingClientRect();
                    top = Math.min(top, dropRect.top);
                    left = Math.min(left, dropRect.left);
                    right = Math.max(right, dropRect.right);
                    bottom = Math.max(bottom, dropRect.bottom);
                }

                setCoords({
                    top: top,
                    left: left,
                    width: right - left,
                    height: bottom - top,
                });
            } else {
                setCoords(null);
            }
        };

        const targetId = getTargetId(currentStep);
        const el = resolveTargetEl(targetId);
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(updateCoords, 300);
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);

        const interval = setInterval(() => {
            updateCoords();

            const activeId = document.activeElement?.id;

            if (currentStep === 1) {
                if (document.getElementById('tour-expense-category')) {
                    setCurrentStep(2);
                }
            } else if (isCategoryCreationPath) {
                if (currentStep === 2) {
                    if (document.getElementById('tour-add-expense-category-btn')) {
                        setCurrentStep(3);
                    }
                } else if (currentStep === 3) {
                    if (document.getElementById('tour-new-expense-category-name')) {
                        setCurrentStep(4);
                    }
                } else if (currentStep === 4) {
                    if (activeId === 'tour-expense-amount-input' || activeId === 'tour-expense-amount' || document.getElementById('tour-expense-amount')?.contains(document.activeElement)) {
                        setCurrentStep(5);
                    }
                } else if (currentStep === 5) {
                    if (activeId === 'tour-expense-desc-input' || activeId === 'tour-expense-description' || document.getElementById('tour-expense-description')?.contains(document.activeElement)) {
                        setCurrentStep(6);
                    }
                } else if (currentStep === 6) {
                    if (activeId === 'tour-expense-submit') {
                        setCurrentStep(7);
                    }
                }
            } else {
                if (currentStep === 2) {
                    if (activeId === 'tour-expense-amount-input' || activeId === 'tour-expense-amount' || document.getElementById('tour-expense-amount')?.contains(document.activeElement)) {
                        setCurrentStep(3);
                    }
                } else if (currentStep === 3) {
                    if (activeId === 'tour-expense-desc-input' || activeId === 'tour-expense-description' || document.getElementById('tour-expense-description')?.contains(document.activeElement)) {
                        setCurrentStep(4);
                    }
                } else if (currentStep === 4) {
                    if (activeId === 'tour-expense-submit') {
                        setCurrentStep(5);
                    }
                }
            }
        }, 80);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [currentStep, isVisible, store?.onboarding_step, isCategoryCreationPath]);

    const handleGoToDashboard = () => {
        router.visit(route('store.dashboard', { store_slug: store?.slug }));
    };

    const handleGoToOnlineStore = () => {
        router.visit(route('store.commerce.home', { store_slug: store?.slug }));
    };

    if (!isVisible) return null;

    // Renders the Congratulations Modal at the end of the tour
    if (store?.onboarding_step === 'expense_congratulations') {
        return renderPortal(
            <div className="fixed inset-0 z-[10000200] flex items-center justify-center p-4 overflow-y-auto">
                <div className="fixed inset-0 bg-[#06100D]/70 backdrop-blur-md transition-opacity duration-300" />
                <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-ink z-[10000201] animate-in zoom-in-95 fade-in duration-200">
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5 shadow-sm">
                            <Trophy size={28} className="animate-bounce" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 mb-3">
                            Step 4 Complete
                        </span>

                        <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight mb-2">
                            Expense Recorded! 📊🎉
                        </h2>

                        <p className="text-sm font-semibold text-ink-secondary mb-2">
                            Your store expense has been recorded and financial ledgers updated.
                        </p>

                        <p className="text-xs text-ink-muted leading-relaxed max-w-sm mb-6">
                            Outstanding! You've cataloged products, recorded purchases, made sales, and logged expenses. Your dashboard now reflects true net profits in real-time.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button
                                type="button"
                                onClick={handleGoToDashboard}
                                className="flex-1 py-3 px-5 rounded-xl bg-accent-fill hover:bg-accent-fill-hover text-accent-on font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                            >
                                <LayoutDashboard size={16} />
                                <span>Go to Dashboard</span>
                                <ArrowRight size={15} />
                            </button>

                            <button
                                type="button"
                                onClick={handleGoToOnlineStore}
                                className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink font-semibold text-sm transition-all cursor-pointer"
                            >
                                <Globe size={15} />
                                <span>Online Store</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getTooltipStyle = () => {
        if (currentStep === 0 || !coords) {
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
            {/* Dimming Mask / Spotlight without green borders or glowing rings */}
            {coords && currentStep > 0 && (
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

            {(!coords || currentStep === 0) && (
                <div className="fixed inset-0 bg-[#06100D]/70 pointer-events-none z-[10000100]"></div>
            )}

            {/* Floating Tooltip Card */}
            <div
                style={getTooltipStyle()}
                className="bg-surface border border-line rounded-2xl shadow-2xl p-5 text-ink pointer-events-auto relative z-[10000110] animate-in fade-in duration-slow"
            >
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50 rounded-lg shrink-0">
                        <Sparkles size={18} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-ink uppercase tracking-wider">
                            Expense Tour
                        </h4>
                        <span className="text-2xs font-semibold text-accent-text">
                            Step {currentStep + 1} of {isCategoryCreationPath ? 8 : 6}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentStep === 0 && (
                        <>
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                Let's record a store operating expense. This helps calculate exact net margins and profit in real time!
                            </p>
                            <div className="flex justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-2 bg-accent-fill hover:bg-accent-fill-hover text-accent-on rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                >
                                    <span>Let's Start</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        </>
                    )}

                    {isCategoryCreationPath ? (
                        <>
                            {currentStep === 1 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click on the <span className="text-ink font-bold">Record Expense</span> button to open the expense panel.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    You don't have any expense categories yet! Click on the <span className="text-ink font-bold">Expense Category</span> selection box.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click <span className="text-ink font-bold">+ New category</span> at the bottom of the list.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Type a name for your new expense category (e.g. <span className="text-ink font-bold">Utilities</span>) and press Enter to add it.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Enter the total <span className="text-ink font-bold">Expense Amount</span> (e.g. rent, electricity, packaging).
                                </p>
                            )}
                            {currentStep === 6 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Fill in the <span className="text-ink font-bold">Description</span> explaining what this operational expense was for.
                                </p>
                            )}
                            {currentStep === 7 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click <span className="text-ink font-bold">Save Record</span> to record the expense and update your ledgers!
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            {currentStep === 1 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click on the <span className="text-ink font-bold">Record Expense</span> button to open the expense panel.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Select an <span className="text-ink font-bold">Expense Category</span> (e.g. Utilities, Rent, Office Supplies).
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Enter the total <span className="text-ink font-bold">Expense Amount</span> spent.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Fill in the <span className="text-ink font-bold">Description</span> explaining the purpose of this payment.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                    Click <span className="text-ink font-bold">Save Record</span> to post this expense and update your ledgers!
                                </p>
                            )}
                        </>
                    )}

                    {currentStep > 0 && (
                        <div className="flex gap-2 justify-between items-center pt-2 border-t border-line">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-3 py-1.5 bg-surface hover:bg-interactive-hover border border-line text-ink-muted hover:text-ink rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>

                            {currentStep < (isCategoryCreationPath ? 7 : 5) && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="px-4 py-1.5 bg-accent-fill hover:bg-accent-fill-hover text-accent-on rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                >
                                    <span>Next</span>
                                    <ArrowRight size={12} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
