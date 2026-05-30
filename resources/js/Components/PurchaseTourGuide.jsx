import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Trophy, Home } from 'lucide-react';

export default function PurchaseTourGuide({ store }) {
    const [currentStep, setCurrentStep] = useState(0); // 0: Supplier, 1: Product, 2: Qty, 3: Cost, 4: Paid, 5: Save
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Only run if the onboarding step is 'purchase_tour' or 'purchase_congratulations'
    const isVisible = store?.onboarding_step === 'purchase_tour' || store?.onboarding_step === 'purchase_congratulations';

    // Track mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get DOM IDs for each step
    const getTargetId = (step) => {
        switch (step) {
            case 0: return 'tour-purchase-supplier';
            case 1: return 'tour-purchase-product';
            case 2: return 'tour-purchase-quantity';
            case 3: return 'tour-purchase-cost';
            case 4: return 'tour-purchase-paid';
            case 5: return 'tour-purchase-save';
            default: return null;
        }
    };

    // Scroll active element into view and update coordinates
    useEffect(() => {
        if (!isVisible || store?.onboarding_step === 'purchase_congratulations') {
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
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                });
            } else {
                setCoords(null);
            }
        };

        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(updateCoords, 300);
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);

        const interval = setInterval(updateCoords, 80);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [currentStep, isVisible, store?.onboarding_step]);

    const handleCompleteTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            {
                onSuccess: () => {
                    router.visit(route('store.dashboard', { store_slug: store?.slug }));
                }
            }
        );
    };

    if (!isVisible) return null;

    // Renders the Congratulations Modal at the end of the tour
    if (store?.onboarding_step === 'purchase_congratulations') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[101] animate-in zoom-in-95 duration-300">
                    <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 animate-bounce">
                                <Trophy className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                                Stock Added! 🎉
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                Your first purchase was recorded successfully!
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                Congratulations! You have successfully added stock to your store catalog. Let's return to the dashboard to see your updated stock values!
                            </p>

                            <button
                                onClick={handleCompleteTour}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <Home size={18} />
                                <span>Go to Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
            {/* Dimming Mask / Spotlight */}
            {coords && (
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

            {!coords && (
                <div className="fixed inset-0 bg-slate-950/75 pointer-events-auto z-[90]"></div>
            )}

            {/* Floating Tooltip */}
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
                            Purchase Tour
                        </h4>
                        <span className="text-[10px] font-semibold text-indigo-400">
                            Step {currentStep + 1} of 6
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentStep === 0 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Select a <span className="text-white font-bold">Supplier</span> you are purchasing from. If they aren't registered, click the <span className="text-white font-bold">+</span> button to add them instantly.
                        </p>
                    )}

                    {currentStep === 1 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Search and select the <span className="text-white font-bold">Product</span> you created in the first step.
                        </p>
                    )}

                    {currentStep === 2 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Set the <span className="text-white font-bold">Quantity</span> of items purchased. This will increase your warehouse stock.
                        </p>
                    )}

                    {currentStep === 3 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Verify the purchase <span className="text-white font-bold">Unit Price</span> (cost price). The default cost price you set earlier is automatically prefilled.
                        </p>
                    )}

                    {currentStep === 4 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Enter the <span className="text-white font-bold">Amount Paid</span> to the supplier (leave as 0 if this purchase is fully on credit/receivables).
                        </p>
                    )}

                    {currentStep === 5 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            All done! Click <span className="text-white font-bold">Complete Purchase</span> to save the invoice and update your inventory stock.
                        </p>
                    )}

                    <div className="flex gap-2 justify-between items-center">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 && (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
