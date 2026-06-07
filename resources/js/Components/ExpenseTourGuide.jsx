import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Trophy, MessageSquare } from 'lucide-react';

export default function ExpenseTourGuide({ store, categories = [] }) {
    const [isCategoryCreationPath, setIsCategoryCreationPath] = useState(() => categories.length === 0);
    const [currentStep, setCurrentStep] = useState(0); // 0: Intro, 1: Record button, ...
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const isVisible = store?.onboarding_step === 'expense_tour' || store?.onboarding_step === 'expense_congratulations';

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getTargetId = (step) => {
        if (store?.onboarding_step === 'expense_congratulations') {
            return 'tour-chat-widget-btn';
        }
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

    useEffect(() => {
        if (!isVisible) {
            setCoords(null);
            return;
        }

        const targetId = getTargetId(currentStep);
        if (!targetId) {
            setCoords(null);
            return;
        }

        const updateCoords = () => {
            const el = document.getElementById(targetId);
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

        const el = document.getElementById(targetId);
        if (el && store?.onboarding_step !== 'expense_congratulations') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(updateCoords, 300);
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);

        const interval = setInterval(() => {
            updateCoords();
            
            if (store?.onboarding_step === 'expense_tour') {
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
                        if (activeId === 'tour-expense-amount') {
                            setCurrentStep(5);
                        }
                    } else if (currentStep === 5) {
                        if (activeId === 'tour-expense-description') {
                            setCurrentStep(6);
                        }
                    }
                } else {
                    if (currentStep === 2) {
                        if (activeId === 'tour-expense-amount') {
                            setCurrentStep(3);
                        }
                    } else if (currentStep === 3) {
                        if (activeId === 'tour-expense-description') {
                            setCurrentStep(4);
                        }
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

    const handleCompleteTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'dashboard_tour' },
            {
                onSuccess: () => {
                    router.visit(route('store.dashboard', { store_slug: store?.slug }));
                }
            }
        );
    };

    if (!isVisible) return null;

    // Renders the final Congratulations Modal with the Chat Widget spotlight
    if (store?.onboarding_step === 'expense_congratulations') {
        return (
            <div className="fixed inset-0 z-[105] overflow-hidden pointer-events-none">
                {/* Spotlight on Chat Icon */}
                {coords && (
                    <div
                        className="fixed pointer-events-none transition-all duration-100 ease-out"
                        style={{
                            top: coords.top - 6,
                            left: coords.left - 6,
                            width: coords.width + 12,
                            height: coords.height + 12,
                            borderRadius: '50%',
                            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 20px 8px rgba(99, 102, 241, 0.5), 0 0 0 3px rgb(99, 102, 241)',
                            zIndex: 110,
                        }}
                    />
                )}

                {/* congrats card near the spotlight */}
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[115] pointer-events-auto">
                    <div className="relative w-full max-w-md bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/30 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-bounce">
                                <Sparkles className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">
                                Setup Completed! 🎉
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                All onboarding stages are successfully finished!
                            </p>

                            <p className="text-slate-300 text-xs leading-relaxed max-w-sm mb-6">
                                Outstanding! You've cataloged products, added purchases stock, created sales invoices, and logged expenses. 
                                <br /><br />
                                <span className="text-indigo-400 font-bold">Need help with anything else?</span> Just ask in the highlighted floating AI Chat Widget. We are always ready to guide you!
                            </p>

                            <button
                                onClick={handleCompleteTour}
                                className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm"
                            >
                                <span>Finish Setup</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getTooltipStyle = () => {
        if (currentStep === 0) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 115,
            };
        }

        if (!coords) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 115,
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
                zIndex: 115,
            };
        }

        const spaceOnRight = window.innerWidth - (coords.left + coords.width);
        const spaceOnLeft = coords.left;

        if (spaceOnRight > 340) {
            return {
                position: 'fixed',
                top: coords.top + (coords.height / 2) - 80,
                left: coords.left + coords.width + 20,
                width: '320px',
                zIndex: 115,
            };
        } else if (spaceOnLeft > 340) {
            return {
                position: 'fixed',
                top: coords.top + (coords.height / 2) - 80,
                left: coords.left - 340,
                width: '320px',
                zIndex: 115,
            };
        } else {
            return {
                position: 'fixed',
                top: coords.top + coords.height + 20,
                left: coords.left + (coords.width / 2) - 160,
                width: '320px',
                zIndex: 115,
            };
        }
    };

    return (
        <div className="fixed inset-0 z-[105] overflow-hidden pointer-events-none">
            {/* Spotlight Highlighter Mask */}
            {coords && currentStep > 0 && (
                <div
                    className="fixed pointer-events-none transition-all duration-100 ease-out"
                    style={{
                        top: coords.top - 6,
                        left: coords.left - 6,
                        width: coords.width + 12,
                        height: coords.height + 12,
                        borderRadius: '12px',
                        boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)',
                        zIndex: 110,
                    }}
                />
            )}

            {(!coords || currentStep === 0) && (
                <div className="fixed inset-0 bg-slate-950/75 pointer-events-none z-[90]"></div>
            )}

            {/* Floating Tooltip Box */}
            <div
                style={getTooltipStyle()}
                className="bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-[115] animate-in fade-in duration-300"
            >
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                        <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Expense Tour
                        </h4>
                        <span className="text-[10px] font-semibold text-indigo-400">
                            Step {currentStep + 1} of {isCategoryCreationPath ? 8 : 6}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentStep === 0 && (
                        <>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Let's record a store operating expense. This helps calculate exact net margins in real time!
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                               >
                                    <span>Let's Start</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </>
                    )}

                    {isCategoryCreationPath ? (
                        <>
                            {currentStep === 1 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Click on the <span className="text-white font-bold">Record Expense</span> button to open the expense panel.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    You don't have any expense categories yet! Click on the <span className="text-white font-bold">Expense Category</span> selection box.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Click <span className="text-white font-bold">Create New Category</span> at the bottom of the list.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Type a name for your new expense category (e.g. <span className="text-white font-bold">Utilities</span>) and press Enter to add it.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Enter the total <span className="text-white font-bold">Expense Amount</span>.
                                </p>
                            )}
                            {currentStep === 6 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Fill in the <span className="text-white font-bold">Description</span> of the expense.
                                </p>
                            )}
                            {currentStep === 7 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Click the <span className="text-white font-bold">Submit</span> or Save button to record the expense!
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            {currentStep === 1 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Click on the <span className="text-white font-bold">Record Expense</span> button to open the expense panel.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Select an <span className="text-white font-bold">Expense Category</span>.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Enter the total <span className="text-white font-bold">Expense Amount</span>.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Fill in the <span className="text-white font-bold">Description</span> of the expense.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Click the <span className="text-white font-bold">Submit</span> or Save button to record the expense!
                                </p>
                            )}
                        </>
                    )}

                    {currentStep > 0 && (
                        <div className="flex gap-2 justify-between items-center">
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>

                            {currentStep < (isCategoryCreationPath ? 7 : 5) && (
                                <button
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
