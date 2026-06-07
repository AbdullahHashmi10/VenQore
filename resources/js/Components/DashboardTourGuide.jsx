import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function DashboardTourGuide({ store }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const isVisible = store?.onboarding_step === 'dashboard_tour';

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getTargetId = (step) => {
        switch (step) {
            case 0: return 'tour-performance';
            case 1: return 'tour-outstanding';
            case 2: return 'tour-net-profit';
            case 3: return 'tour-sales-chart';
            case 4: return 'tour-sidebar-admin';
            case 5: return 'tour-chat-widget-btn';
            default: return null;
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

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [currentStep, isVisible]);

    const handleCompleteTour = () => {
        router.post(
            route('store.onboarding.step', { store_slug: store?.slug }),
            { step: 'completed' },
            { preserveScroll: true, preserveState: false }
        );
    };

    if (!isVisible) return null;

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

        const tooltipWidth = 360;
        const tooltipHeight = 220; // approximate
        const spacing = 16;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = coords.top + coords.height + spacing;
        let left = coords.left + (coords.width / 2) - (tooltipWidth / 2);

        // Adjust for bottom edge overflow
        if (top + tooltipHeight > viewportHeight) {
            top = coords.top - tooltipHeight - spacing;
        }

        // Adjust for left/right edge overflow
        if (left < spacing) {
            left = spacing;
        } else if (left + tooltipWidth > viewportWidth - spacing) {
            left = viewportWidth - tooltipWidth - spacing;
        }

        // Specific adjustments based on target
        if (currentStep === 4) { // Sidebar Admin
            left = coords.left + coords.width + spacing;
            top = coords.top;
        } else if (currentStep === 5) { // Chat widget (usually bottom right)
            left = coords.left - tooltipWidth - spacing;
            top = coords.top - tooltipHeight + coords.height;
        }

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${tooltipWidth}px`,
            zIndex: 115,
        };
    };

    return (
        <div className="fixed inset-0 z-[105] overflow-hidden pointer-events-none">
            {coords && (
                <div
                    className="fixed pointer-events-none transition-all duration-300 ease-out"
                    style={{
                        top: coords.top - 6,
                        left: coords.left - 6,
                        width: coords.width + 12,
                        height: coords.height + 12,
                        borderRadius: currentStep === 5 ? '50%' : '12px',
                        boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)',
                        zIndex: 110,
                    }}
                />
            )}

            <div
                className="pointer-events-auto transition-all duration-300 ease-out"
                style={getTooltipStyle()}
            >
                <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                Dashboard Overview
                            </h4>
                            <span className="text-[10px] font-semibold text-indigo-400">
                                Step {currentStep + 1} of 6
                            </span>
                        </div>
                    </div>

                    <div className="min-h-[60px] mb-6">
                        {currentStep === 0 && (
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Here you can view your overall <span className="text-white font-bold">Sales Performance</span> and <span className="text-white font-bold">Gross Profit</span>. Use the dropdown to filter by different time periods to see how you are doing.
                            </p>
                        )}
                        {currentStep === 1 && (
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                This section shows your pending <span className="text-white font-bold">Outstanding</span> receivables and payables. Keep an eye here to maintain healthy cash flow!
                            </p>
                        )}
                        {currentStep === 2 && (
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Your <span className="text-white font-bold">Net Profit</span> summary. It instantly calculates your true bottom line based on your income and expenses.
                            </p>
                        )}
                        {currentStep === 3 && (
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                The <span className="text-white font-bold">Sales Chart</span> gives you a visual representation of your sales trends over time, making it easy to spot peaks and valleys.
                            </p>
                        )}
                        {currentStep === 4 && (
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                The <span className="text-white font-bold">Admin Panel</span>. You can configure advanced settings, manage users, and more! <br/><br/>
                                <span className="text-indigo-400">Need a training session for you or your staff?</span> Check the <span className="text-white font-bold">Billing Page &gt; Services</span> to arrange a meeting!
                            </p>
                        )}
                        {currentStep === 5 && (
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                And finally, the <span className="text-white font-bold">Chat Widget</span>! If you want to know how to do anything extra, you can ask us here and we will guide you through every single thing. We're always here to help!
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        {currentStep > 0 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                                <span>Next</span>
                                <ArrowRight size={12} />
                            </button>
                        ) : (
                            <button
                                onClick={handleCompleteTour}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/20 cursor-pointer animate-pulse"
                            >
                                Finish Setup
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
