import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Box, HelpCircle, Trophy, Home, Plus, Upload, Minimize2 } from 'lucide-react';

export default function ProductTourGuide({ isModalOpen, store, categories = [] }) {
    const [isCategoryCreationPath, setIsCategoryCreationPath] = useState(() => categories.length === 0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isMinimized, setIsMinimized] = useState(() => {
        return sessionStorage.getItem('amd_onboarding_minimized') === 'true';
    });

    const toggleMinimized = (val) => {
        setIsMinimized(val);
        sessionStorage.setItem('amd_onboarding_minimized', val ? 'true' : 'false');
    };
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [liveMargin, setLiveMargin] = useState(null);

    const renderPortal = (content) => {
        if (typeof document === 'undefined') return null;
        return createPortal(content, document.body);
    };

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
        if (isCategoryCreationPath) {
            switch (step) {
                case 0: return 'tour-add-product';
                case 1: return 'tour-product-name';
                case 2: return 'tour-product-sku-gen';
                case 3: return 'tour-product-category';
                case 4: return 'tour-add-new-category-btn';
                case 5: return 'tour-new-category-name';
                case 6: return 'tour-product-cost';
                case 7: return 'tour-product-price';
                case 8: return 'tour-product-barcode';
                case 9: return 'tour-tab-reservations';
                case 10: return 'tour-tab-extra';
                case 11: return 'tour-product-save';
                default: return null;
            }
        } else {
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
        }
    };

    // Auto-advance logic
    useEffect(() => {
        if (!isCategoryCreationPath) return;

        const interval = setInterval(() => {
            const activeId = document.activeElement?.id;

            if (currentStep === 3) {
                if (document.getElementById('tour-add-new-category-btn')) {
                    setCurrentStep(4);
                }
            } else if (currentStep === 4) {
                if (document.getElementById('tour-new-category-name')) {
                    setCurrentStep(5);
                }
            } else if (currentStep === 5) {
                if (activeId === 'tour-product-cost') {
                    setCurrentStep(6);
                }
            }
        }, 150);

        return () => clearInterval(interval);
    }, [currentStep, isCategoryCreationPath]);

    // Scroll active element into view and update coordinates
    useEffect(() => {
        const targetId = getTargetId(currentStep);
        if (!targetId) {
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

        const el = getVisibleElement(targetId);
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
    }, [currentStep, isModalOpen, isCategoryCreationPath]);

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
            { step: 'inventory_tour_more' },
            { preserveScroll: true }
        );
    };

    const handleGoToDashboard = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'purchase_tour_start' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('store.dashboard', { store_slug: store?.slug }));
                }
            }
        );
    };

    const handleUpdateStep = (stepValue) => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: stepValue },
            { preserveScroll: true }
        );
    };

    if (
        store?.onboarding_step !== 'inventory_tour' &&
        store?.onboarding_step !== 'congratulations' &&
        store?.onboarding_step !== 'inventory_tour_more'
    ) return null;

    if (store?.onboarding_step === 'inventory_tour_more') {
        if (isMinimized) {
            // Minimized Floating Progress Widget (Pie Chart / Ring)
            const circumference = 2 * Math.PI * 18;
            const progressOffset = circumference * (1 - 0.33); // 33% progress (Phase 1 of 3 complete)

            return (
                <div 
                    onClick={() => toggleMinimized(false)}
                    title="Onboarding Active: Cataloging Mode (33% Complete). Click to expand."
                    className="fixed bottom-24 right-6 z-[100] w-14 h-14 bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/30 rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.3)] backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-110 active:scale-95 hover:border-indigo-400/50 transition-all duration-300 group"
                >
                    <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 44 44">
                        {/* Background Ring */}
                        <circle
                            className="text-slate-800 dark:text-slate-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="transparent"
                            r="18"
                            cx="22"
                            cy="22"
                        />
                        {/* Progress Segment */}
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
                    {/* Inner Icon */}
                    <div className="relative z-10 text-indigo-400 group-hover:text-white transition-colors duration-200">
                        <Sparkles size={18} className="animate-pulse" />
                    </div>
                    {/* Small badge */}
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow">
                        33%
                    </span>
                </div>
            );
        }

        // Expanded Glassmorphic Banner/Card
        return (
            <div className="fixed bottom-24 right-6 z-[100] max-w-sm w-full bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.25)] p-5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
                {/* Minimize Button */}
                <button 
                    onClick={() => toggleMinimized(true)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50"
                    title="Minimize to widget"
                >
                    <Minimize2 size={12} />
                </button>

                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                        <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Onboarding Active</h4>
                        <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Cataloging Mode (33%)</p>
                    </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mb-4 pr-6">
                    You can add as many products as you like. When you are done cataloging, click below to proceed or load products in bulk.
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleGoToDashboard}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <span>Proceed to Buy Stock</span>
                        <ArrowRight size={12} />
                    </button>
                    <button
                        onClick={() => handleUpdateStep('completed')}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                        Exit Tour
                    </button>
                </div>
            </div>
        );
    }

    if (store?.onboarding_step === 'congratulations') {
        return renderPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
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

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={handleGoToDashboard}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    <Home size={18} />
                                    <span>Go to Dashboard</span>
                                </button>

                                <button
                                    onClick={handleMakeMore}
                                    className="w-full py-3 px-5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
        if (!coords) {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '360px',
                zIndex: 151,
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
                zIndex: 151,
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
                zIndex: 151,
            };
        } else if (spaceOnLeft > 340) {
            return {
                position: 'fixed',
                top: coords.top + (coords.height / 2) - 80,
                left: coords.left - 340,
                width: '320px',
                zIndex: 151,
            };
        } else {
            return {
                position: 'fixed',
                top: coords.top + coords.height + 20,
                left: coords.left + (coords.width / 2) - 160,
                width: '320px',
                zIndex: 151,
            };
        }
    };

    return renderPortal(
        <div className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
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
                        zIndex: 150,
                    }}
                />
            )}

            {!coords && (
                <div className="fixed inset-0 bg-slate-950/75 pointer-events-none z-[150]"></div>
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
                            Step {currentStep + 1} of {isCategoryCreationPath ? 12 : 10}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {isCategoryCreationPath ? (
                        <>
                            {currentStep === 0 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Let's add your first product. Click on the highlighted <span className="text-white font-bold">Add Product</span> button to open the product creator form.
                                </p>
                            )}
                            {currentStep === 1 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Type a <span className="text-white font-bold">Product Name</span> here.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Type a custom product code in the <span className="text-white font-bold">SKU</span> box, or auto-generate one.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    You don't have any categories yet! Click on the <span className="text-white font-bold">Category</span> selection box.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Click <span className="text-white font-bold">+ Create New Category</span> at the bottom of the dropdown list.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Type a name for your new category (e.g. <span className="text-white font-bold">Beverages</span>) to create it inline.
                                </p>
                            )}
                            {currentStep === 6 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Set your <span className="text-white font-bold">Cost Price</span>.
                                </p>
                            )}
                            {currentStep === 7 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        Set your <span className="text-white font-bold">Selling Price</span>.
                                    </p>
                                    {liveMargin ? (
                                        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Profit Analysis</p>
                                            <p className="text-xs font-bold text-slate-200 mt-0.5">
                                                Margin: <span className={liveMargin.margin >= 30 ? 'text-emerald-400' : 'text-amber-400'}>{liveMargin.margin}%</span>
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                            {currentStep === 8 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    In the <span className="text-white font-bold">Barcodes</span> section, you can add barcode tags if needed.
                                </p>
                            )}
                            {currentStep === 9 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    The <span className="text-white font-bold">Reservations</span> tab tracks stock quantities currently held for unpaid invoices.
                                </p>
                            )}
                            {currentStep === 10 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    The <span className="text-white font-bold">Extra</span> tab handles additional details like images and descriptions.
                                </p>
                            )}
                            {currentStep === 11 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    All done! Click <span className="text-white font-bold">Save Changes</span> to create your product.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            {currentStep === 0 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Let's add your first product. Click on the highlighted <span className="text-white font-bold">Add Product</span> button to open the product creator form.
                                </p>
                            )}
                            {currentStep === 1 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Type a <span className="text-white font-bold">Product Name</span> here.
                                </p>
                            )}
                            {currentStep === 2 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Type a custom product code in the <span className="text-white font-bold">SKU</span> box, or auto-generate one.
                                </p>
                            )}
                            {currentStep === 3 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Select a <span className="text-white font-bold">Category</span>.
                                </p>
                            )}
                            {currentStep === 4 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Set your <span className="text-white font-bold">Cost Price</span>.
                                </p>
                            )}
                            {currentStep === 5 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        Set your <span className="text-white font-bold">Selling Price</span>.
                                    </p>
                                    {liveMargin ? (
                                        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Profit Analysis</p>
                                            <p className="text-xs font-bold text-slate-200 mt-0.5">
                                                Margin: <span className={liveMargin.margin >= 30 ? 'text-emerald-400' : 'text-amber-400'}>{liveMargin.margin}%</span>
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                            {currentStep === 6 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    In the <span className="text-white font-bold">Barcodes</span> section, you can add barcode tags if needed.
                                </p>
                            )}
                            {currentStep === 7 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    The <span className="text-white font-bold">Reservations</span> tab tracks stock quantities currently held for unpaid invoices.
                                </p>
                            )}
                            {currentStep === 8 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    The <span className="text-white font-bold">Extra</span> tab handles additional details like images and descriptions.
                                </p>
                            )}
                            {currentStep === 9 && (
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    All done! Click <span className="text-white font-bold">Save Changes</span> to create your product and finalize the setup tour.
                                </p>
                            )}
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 justify-between items-center">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => {
                                    const reservationsStep = isCategoryCreationPath ? 9 : 7;
                                    const extraStep = isCategoryCreationPath ? 10 : 8;
                                    const saveStep = isCategoryCreationPath ? 11 : 9;

                                    if (currentStep === reservationsStep) {
                                        document.getElementById('tour-tab-details')?.click();
                                    } else if (currentStep === extraStep) {
                                        document.getElementById('tour-tab-reservations')?.click();
                                    } else if (currentStep === saveStep) {
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

                        {currentStep > 0 && currentStep < (isCategoryCreationPath ? 11 : 9) && (
                            <button
                                onClick={() => {
                                    const barcodeStep = isCategoryCreationPath ? 8 : 6;
                                    const reservationsStep = isCategoryCreationPath ? 9 : 7;
                                    const extraStep = isCategoryCreationPath ? 10 : 8;

                                    if (currentStep === barcodeStep) {
                                        document.getElementById('tour-tab-reservations')?.click();
                                    } else if (currentStep === reservationsStep) {
                                        document.getElementById('tour-tab-extra')?.click();
                                    } else if (currentStep === extraStep) {
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
