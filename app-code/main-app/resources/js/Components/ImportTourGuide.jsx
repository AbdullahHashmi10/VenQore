import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Sparkles, ArrowRight, ArrowLeft, Upload, FileSpreadsheet, Play, CheckCircle } from 'lucide-react';

export default function ImportTourGuide({ store }) {
    // Detect page type from elements in DOM or window path
    const isMappingPage = window.location.pathname.includes('/upload-mapping');

    const [currentStep, setCurrentStep] = useState(() => {
        const saved = sessionStorage.getItem('amd_import_tour_step');
        if (saved) {
            const parsed = parseInt(saved);
            if (isMappingPage && parsed < 6) return 6;
            if (!isMappingPage && parsed >= 6) return 1;
            return parsed;
        }
        return isMappingPage ? 6 : 0;
    });

    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Save step to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('amd_import_tour_step', currentStep.toString());
    }, [currentStep]);

    // Handle cross-page step correction
    useEffect(() => {
        if (isMappingPage && currentStep < 6) {
            setCurrentStep(6);
        } else if (!isMappingPage && currentStep >= 6) {
            setCurrentStep(1);
        }
    }, [isMappingPage]);

    // Track mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get target ID for active step
    const getTargetId = (step) => {
        switch (step) {
            case 1: return 'tour-import-tab';
            case 2: return 'tour-import-type';
            case 3: return 'tour-import-download-template';
            case 4: return 'tour-import-upload-zone';
            case 5: return 'tour-import-submit';
            case 6: return 'tour-mapping-container';
            case 7: return 'tour-mapping-validate';
            case 8: return 'tour-mapping-submit';
            default: return null;
        }
    };

    // Automatically transition Step 1 (Switch Tab) to Step 2 if Import tab is already active
    useEffect(() => {
        if (currentStep === 1) {
            const importTypeEl = document.getElementById('tour-import-type');
            if (importTypeEl) {
                setCurrentStep(2);
            }
        }
    }, [currentStep]);

    // Scroll active element into view and calculate coordinates
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
        window.addEventListener('scroll', updateCoords, true);

        const interval = setInterval(updateCoords, 80);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [currentStep]);

    const handleStartTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'import_tour' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCurrentStep(1);
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

    if (store?.onboarding_step !== 'import_tour_start' && store?.onboarding_step !== 'import_tour') return null;

    // Centered Welcome Modal
    if (store?.onboarding_step === 'import_tour_start' && currentStep === 0) {
        return (
            <div className="fixed inset-0 z-drawer flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in"></div>

                <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-drawer animate-in zoom-in-95 duration-slow">
                    <div className="relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                        
                        <div className="absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-brand-500 rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce">
                                <Upload className="text-white w-8 h-8" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
                                Import Products in Bulk 📤
                            </h2>

                            <p className="text-ink-muted text-sm font-semibold mb-2">
                                Load your entire catalog in seconds!
                            </p>

                            <p className="text-neutral-300 text-sm leading-relaxed max-w-sm mb-8">
                                Welcome to the bulk import wizard. If you have an Excel or CSV file containing your products, you can import them all at once. Let's walk you through the process!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={handleStartTour}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.98] cursor-pointer"
                                >
                                    <Sparkles size={18} />
                                    <span>Start Bulk Import Tour</span>
                                </button>

                                <button
                                    onClick={() => handleUpdateStep('skipped')}
                                    className="py-3 px-5 bg-neutral-800/80 hover:bg-interactive-hover text-neutral-300 hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal flex items-center justify-center gap-2 cursor-pointer"
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

    const getTooltipStyle = () => {
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
        <div className="fixed inset-0 z-drawer overflow-hidden pointer-events-none">
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
                        boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)',
                        zIndex: 110,
                    }}
                />
            )}

            {!coords && (
                <div className="fixed inset-0 bg-neutral-950/75 pointer-events-none z-drawer"></div>
            )}

            {/* Floating Tooltip */}
            <div
                style={getTooltipStyle()}
                className="bg-neutral-900/95 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-drawer animate-in fade-in duration-slow"
            >
                {/* Content */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400 shrink-0">
                        <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Bulk Import Tour
                        </h4>
                        <span className="text-2xs font-semibold text-brand-400">
                            Step {currentStep} of 8
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentStep === 1 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            First, switch to the <span className="text-white font-bold">Import Data</span> tab by clicking on it.
                        </p>
                    )}

                    {currentStep === 2 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            Select the target module you want to import. Make sure it is set to <span className="text-white font-bold">Products & Stock</span>.
                        </p>
                    )}

                    {currentStep === 3 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            Click <span className="text-white font-bold">Download Excel Template</span>. Fill in your products, cost prices, and selling prices exactly as structured in the downloaded sheet.
                        </p>
                    )}

                    {currentStep === 4 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            Drag & drop your filled Excel file here, or click inside the zone to browse and select it from your device.
                        </p>
                    )}

                    {currentStep === 5 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            All ready! Click <span className="text-white font-bold">Start Import Process</span> to upload your file and proceed to the Column Mapping screen.
                        </p>
                    )}

                    {currentStep === 6 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            On the mapping screen, select which column of your file maps to which system attribute (e.g. name, SKU, price, cost).
                        </p>
                    )}

                    {currentStep === 7 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            Click <span className="text-white font-bold">Run Pre-Import Validation</span> to verify formatting, inspect for duplicate rows, and prepare the database records.
                        </p>
                    )}

                    {currentStep === 8 && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                            Everything looks good! Click <span className="text-white font-bold">Confirm & Process Import</span> to load all products into your database and finalize setup.
                        </p>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 justify-between items-center">
                        {currentStep > 1 && currentStep !== 6 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div /> // Spacer
                        )}

                        {currentStep > 0 && currentStep < 5 && (
                            <button
                                onClick={() => {
                                    // Skip over target tab click step if element is already present
                                    if (currentStep === 1 && document.getElementById('tour-import-type')) {
                                        setCurrentStep(3);
                                    } else {
                                        setCurrentStep(currentStep + 1);
                                    }
                                }}
                                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                                <span>Next</span>
                                <ArrowRight size={12} />
                            </button>
                        )}

                        {currentStep === 6 && (
                            <button
                                onClick={() => setCurrentStep(7)}
                                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
