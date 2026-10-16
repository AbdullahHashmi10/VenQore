import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTermText } from '@/lib/terms';

export default function DashboardTourGuide({ store }) {
    const tt = useTermText();
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const renderPortal = (content) => {
        if (typeof document === 'undefined') return null;
        return createPortal(content, document.body);
    };

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

        const el = getVisibleElement(targetId);
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

    return renderPortal(
        <div className="fixed inset-0 z-modal overflow-hidden pointer-events-none">
            {coords && (
                <div
                    className="fixed pointer-events-none transition-all duration-slow ease-out"
                    style={{
                        top: coords.top - 6,
                        left: coords.left - 6,
                        width: coords.width + 12,
                        height: coords.height + 12,
                        borderRadius: currentStep === 5 ? '50%' : '12px',
                        boxShadow: '0 0 0 9999px rgba(6, 16, 13, 0.72)',
                        zIndex: 151,
                    }}
                />
            )}

            <div
                className="pointer-events-auto transition-all duration-slow ease-out"
                style={getTooltipStyle()}
            >
                <div className="bg-surface border border-line rounded-2xl shadow-2xl p-6 text-ink relative overflow-hidden animate-in zoom-in-95 duration-normal">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-accent-quiet text-accent-text border border-teal-200/50 dark:border-teal-800/50">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink uppercase tracking-wider">
                                Dashboard Overview
                            </h4>
                            <span className="text-2xs font-semibold text-accent-text">
                                Step {currentStep + 1} of 6
                            </span>
                        </div>
                    </div>

                    <div className="min-h-[60px] mb-6">
                        {currentStep === 0 && (
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                Here you can view your overall <span className="text-ink font-bold">Sales Performance</span> and <span className="text-ink font-bold">Gross Profit</span>. Use the dropdown to filter by different time periods to see how you are doing.
                            </p>
                        )}
                        {currentStep === 1 && (
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                This section shows your pending <span className="text-ink font-bold">Outstanding</span> receivables and payables. Keep an eye here to maintain healthy cash flow!
                            </p>
                        )}
                        {currentStep === 2 && (
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                Your <span className="text-ink font-bold">Net Profit</span> summary. It instantly calculates your true bottom line based on your income and expenses.
                            </p>
                        )}
                        {currentStep === 3 && (
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                The <span className="text-ink font-bold">Sales Chart</span> gives you a visual representation of your sales trends over time, making it easy to spot peaks and valleys.
                            </p>
                        )}
                        {currentStep === 4 && (
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                The <span className="text-ink font-bold">Admin Panel</span>. You can configure advanced settings, manage users, and more! <br/><br/>
                                <span className="text-accent-text font-bold">{tt('Need a training session for you or your staff?')}</span> Check the <span className="text-ink font-bold">{tt('Billing Page > Services')}</span> to arrange a meeting!
                            </p>
                        )}
                        {currentStep === 5 && (
                            <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                                And finally, the <span className="text-ink font-bold">Chat Widget</span>! If you want to know how to do anything extra, you can ask us here and we will guide you through every single thing. We're always here to help!
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-auto pt-2 border-t border-line">
                        {currentStep > 0 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-3 py-1.5 bg-surface hover:bg-interactive-hover border border-line text-ink-secondary hover:text-ink rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={12} />
                                <span>Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="px-4 py-1.5 bg-accent-fill hover:bg-accent-fill-hover text-accent-on rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                                <span>Next</span>
                                <ArrowRight size={12} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCompleteTour}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
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
