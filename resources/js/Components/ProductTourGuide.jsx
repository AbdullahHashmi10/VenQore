import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Box, HelpCircle, Trophy, Home, Plus } from 'lucide-react';

export default function ProductTourGuide({ isModalOpen, store }) {
    const [currentStep, setCurrentStep] = useState(0); // 0: add button, 1: name, 2: sku, 3: category, 4: cost, 5: price, 6: barcode, 7: reservations, 8: extra, 9: save
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [liveMargin, setLiveMargin] = useState(null);

    // Track step transitions based on modal open state
    useEffect(() => {
        if (isModalOpen && currentStep === 0) {
            setCurrentStep(1);
        } else if (!isModalOpen && currentStep > 0) {
            setCurrentStep(0);
        }
    }, [isModalOpen]);

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
            case 0: return 'tour-add-product';
            case 1: return 'tour-product-name';
            case 2: return 'tour-product-sku-gen';
            case 3: return 'tour-product-category';
            case 4: return 'tour-product-cost';
            case 5: return 'tour-product-price';
            case 6: return 'tour-product-barcode';
            case 7: return 'tour-tab-reservations';
            case 8: return 'tour-tab-extra';
            case 9: return 'tour-product-save';
            default: return null;
        }
    };

    // Scroll active element into view and update coordinates
    useEffect(() => {
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
        if (el && currentStep > 0) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(updateCoords, 300);
        window.addEventListener('resize', updateCoords);
        
        const modalContainer = document.querySelector('.overflow-y-auto');
        if (modalContainer) {
            modalContainer.addEventListener('scroll', updateCoords, true);
        }

        const interval = setInterval(updateCoords, 80);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', updateCoords);
            if (modalContainer) {
                modalContainer.removeEventListener('scroll', updateCoords, true);
            }
        };
    }, [currentStep, isModalOpen]);

    // Live margin checker effect (Steps 4 & 5)
    useEffect(() => {
        if (currentStep !== 4 && currentStep !== 5) return;

        const checkMargin = () => {
            const costEl = document.getElementById('tour-product-cost');
            const priceEl = document.getElementById('tour-product-price');
            
            if (costEl && priceEl) {
                const cost = parseFloat(costEl.value) || 0;
                const price = parseFloat(priceEl.value) || 0;
                if (price > 0 && cost > 0) {
                    const margin = Math.round(((price - cost) / price) * 100);
                    setLiveMargin({ cost, price, margin });
                } else {
                    setLiveMargin(null);
                }
            }
        };

        const interval = setInterval(checkMargin, 150);
        return () => clearInterval(interval);
    }, [currentStep]);

    const handleMakeMore = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            { preserveScroll: true }
        );
    };

    const handleGoToDashboard = () => {
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

    if (store?.onboarding_step !== 'inventory_tour' && store?.onboarding_step !== 'congratulations') return null;

    if (store?.onboarding_step === 'congratulations') {
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
                                Congratulations! 🎉
                            </h2>

                            <p className="text-slate-400 text-sm font-semibold mb-2">
                                You have successfully created your first product!
                            </p>

                            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mb-8">
                                Great job setting up your initial inventory catalog. What would you like to do next?
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={handleGoToDashboard}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    <Home size={18} />
                                    <span>Go to Dashboard</span>
                                </button>

                                <button
                                    onClick={handleMakeMore}
                                    className="py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Plus size={18} />
                                    <span>Make More Products</span>
                                </button>
                            </div>
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
                        borderRadius: currentStep === 0 ? '8px' : '12px',
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
                {/* Content */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                        <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            {currentStep === 0 ? 'Create Product' : 'Product Guide'}
                        </h4>
                        <span className="text-[10px] font-semibold text-indigo-400">
                            Step {currentStep + 1} of 10
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentStep === 0 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Let's add your first product. Click on the highlighted <span className="text-white font-bold">Add Product</span> button to open the product creator form.
                        </p>
                    )}

                    {currentStep === 1 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Type a <span className="text-white font-bold">Product Name</span> here (e.g. "Cold Brew Coffee" or "Cotton T-Shirt").
                        </p>
                    )}

                    {currentStep === 2 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Type a custom product code in the <span className="text-white font-bold">SKU</span> box, or click the reload button to auto-generate a secure code.
                        </p>
                    )}

                    {currentStep === 3 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Select a <span className="text-white font-bold">Category</span>. If you don't have categories created, click "Create New Category" to add one instantly.
                        </p>
                    )}

                    {currentStep === 4 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Set your <span className="text-white font-bold">Cost Price</span>. This is the amount it costs you to purchase or manufacture one unit of this product.
                        </p>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-2">
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Set your <span className="text-white font-bold">Selling Price</span>. This is the amount you will charge customers for this product.
                            </p>
                            {liveMargin ? (
                                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Profit Analysis</p>
                                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                                        Margin: <span className={liveMargin.margin >= 30 ? 'text-emerald-400' : 'text-amber-400'}>{liveMargin.margin}%</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                                        {liveMargin.margin >= 30 
                                            ? '✅ Excellent margin! This will help you cover expenses and stay profitable.'
                                            : '⚠️ Low margin. Consider increasing the selling price or negotiating a lower cost.'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-500 italic">Enter cost and selling price to see live profit margin analysis.</p>
                            )}
                        </div>
                    )}

                    {currentStep === 6 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            In the <span className="text-white font-bold">Barcodes</span> section, you can add barcode tags if you have a barcode scanner configured. You can also skip this and do it later.
                        </p>
                    )}

                    {currentStep === 7 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            The <span className="text-white font-bold">Reservations</span> tab tracks stock quantities currently held for unpaid invoices so they don't get double sold.
                        </p>
                    )}

                    {currentStep === 8 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            The <span className="text-white font-bold">Extra</span> tab handles additional details like image galleries and descriptions. You can skip these for now and explore them later.
                        </p>
                    )}

                    {currentStep === 9 && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            All done! Click <span className="text-white font-bold">Save Changes</span> to create your product and finalize the setup tour.
                        </p>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 justify-between items-center">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => {
                                    // Handle tab switches automatically when going back
                                    if (currentStep === 7) {
                                        document.getElementById('tour-tab-details')?.click();
                                    } else if (currentStep === 8) {
                                        document.getElementById('tour-tab-reservations')?.click();
                                    } else if (currentStep === 9) {
                                        document.getElementById('tour-tab-extra')?.click();
                                    }
                                    setCurrentStep(currentStep - 1);
                                }}
                                className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div /> // Spacer
                        )}

                        {currentStep > 0 && currentStep < 9 && (
                            <button
                                onClick={() => {
                                    // Handle tab switches automatically if transitioning past basic fields
                                    if (currentStep === 6) {
                                        // Activate reservations tab in parent
                                        document.getElementById('tour-tab-reservations')?.click();
                                    } else if (currentStep === 7) {
                                        // Activate extra tab in parent
                                        document.getElementById('tour-tab-extra')?.click();
                                    } else if (currentStep === 8) {
                                        // Switch back to details tab to show save button
                                        document.getElementById('tour-tab-details')?.click();
                                    }
                                    setCurrentStep(currentStep + 1);
                                }}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
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
