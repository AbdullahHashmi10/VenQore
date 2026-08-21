import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    BarChart2,
    Sparkles,
    Check
} from 'lucide-react';

const OnboardingTour = ({ onComplete }) => {
    const { store } = usePage().props;
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const steps = [
        {
            title: 'Welcome to VENQORE! 🎉',
            description: 'Let\'s take a quick tour to help you get started. This powerful POS system will help you manage your business efficiently.',
            icon: Sparkles,
            highlight: null,
            action: null,
        },
        {
            title: 'Your Inventory Hub',
            description: 'This is where you manage all your products. Add items, track stock levels, set prices, and organize by categories.',
            icon: Package,
            highlight: 'inventory',
            action: { label: 'Go to Inventory', route: 'store.inventory.dashboard' },
        },
        {
            title: 'Make Sales Fast',
            description: 'The POS screen is designed for speed. Search products, add to cart, and complete sales in seconds. Works offline too!',
            icon: ShoppingCart,
            highlight: 'pos',
            action: { label: 'Open POS', route: 'store.pos' },
        },
        {
            title: 'Manage Your Contacts',
            description: 'Keep track of all your customers and suppliers. View ledgers, outstanding balances, and transaction history.',
            icon: Users,
            highlight: 'parties',
            action: { label: 'View Contacts', route: 'store.parties.index' },
        },
        {
            title: 'Track Your Money',
            description: 'Record payments, expenses, and view financial reports. Everything you need to keep your books in order.',
            icon: DollarSign,
            highlight: 'finance',
            action: { label: 'View Finances', route: 'store.funds.index' },
        },
        {
            title: 'Powerful Reports',
            description: 'Get insights with 40+ reports including Sales, P&L, Stock Valuation, and more. AI-powered tips help you grow!',
            icon: BarChart2,
            highlight: 'reports',
            action: { label: 'View Reports', route: 'store.reports.index' },
        },
        {
            title: 'You\'re All Set! 🚀',
            description: 'You now know the basics. Press Ctrl+K anytime to quickly navigate. Explore and make your business thrive!',
            icon: Check,
            highlight: null,
            action: null,
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = () => {
        localStorage.setItem('amd_onboarding_complete', 'true');
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const handleAction = (action) => {
        if (action && action.route) {
            const routeName = action.route.startsWith('store.') ? action.route : `store.${action.route}`;
            router.visit(route(routeName, { store_slug: store?.slug }));
        }
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const StepIcon = step.icon;
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-tooltip animate-in fade-in duration-slow" />

            {/* Modal */}
            <div className="fixed inset-0 z-tooltip flex items-center justify-center p-4">
                <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-slow">
                    {/* Progress Bar */}
                    <div className="h-1 bg-sunken">
                        <div
                            className="h-full bg-gradient-to-r from-brand-500 to-purple-600 transition-all duration-slower"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-lg ">
                            <StepIcon size={36} />
                        </div>

                        {/* Text */}
                        <h2 className="text-2xl font-bold text-ink mb-3">
                            {step.title}
                        </h2>
                        <p className="text-ink-secondary leading-relaxed mb-6">
                            {step.description}
                        </p>

                        {/* Action Button */}
                        {step.action && (
                            <button
                                onClick={() => handleAction(step.action)}
                                className="mb-6 px-6 py-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl font-medium hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                            >
                                {step.action.label} →
                            </button>
                        )}

                        {/* Step Indicators */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {steps.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep
                                            ? 'bg-brand-500 w-8'
                                            : idx < currentStep
                                                ? 'bg-brand-300'
                                                : 'bg-sunken'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-line flex items-center justify-between bg-app">
                        {currentStep > 0 ? (
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-2 px-4 py-2 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300 font-medium transition-colors"
                            >
                                <ChevronLeft size={18} />
                                Back
                            </button>
                        ) : (
                            <button
                                onClick={handleSkip}
                                className="px-4 py-2 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300 font-medium transition-colors"
                            >
                                Skip Tour
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover: transition-all"
                        >
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            {currentStep < steps.length - 1 && <ChevronRight size={18} />}
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </>
    );
};

// Wrapper that checks if onboarding is needed
const OnboardingWrapper = () => {
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // Check if user has completed onboarding
        const completed = localStorage.getItem('amd_onboarding_complete');
        if (!completed) {
            // Small delay to let the page load first
            const timer = setTimeout(() => setShowTour(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!showTour) return null;

    return <OnboardingTour onComplete={() => setShowTour(false)} />;
};

export default OnboardingWrapper;
