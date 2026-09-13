import React, { useState } from 'react';
import { CheckCircle2, Package, ShoppingBag, Users, ArrowRight, X, Sparkles } from 'lucide-react';

export default function GetStartedCommandCenter({ storeSlug, initialCompleted = [] }) {
    const [completedSteps, setCompletedSteps] = useState(initialCompleted);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || completedSteps.length >= 3) {
        return null;
    }

    const toggleStep = (stepKey) => {
        if (completedSteps.includes(stepKey)) {
            setCompletedSteps(completedSteps.filter(s => s !== stepKey));
        } else {
            setCompletedSteps([...completedSteps, stepKey]);
        }
    };

    const steps = [
        {
            key: 'products',
            title: 'Add your first product or service',
            desc: 'Set up items, categories & pricing',
            icon: Package,
            link: route('store.inventory.index', { store_slug: storeSlug }),
            color: 'indigo',
        },
        {
            key: 'sales',
            title: 'Set up your counter or POS',
            desc: 'Make your first sale & test checkout',
            icon: ShoppingBag,
            link: route('store.pos', { store_slug: storeSlug }),
            color: 'emerald',
        },
        {
            key: 'team',
            title: 'Invite your team members',
            desc: 'Add cashier or manager access',
            icon: Users,
            link: `/s/${storeSlug}/settings/users`,
            color: 'purple',
        },
    ];

    return (
        <div className="w-full p-6 bg-gradient-to-r from-neutral-900 via-brand-950/60 to-neutral-900 border border-brand-500/30 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden animate-fadeIn mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/20 border border-brand-500/40 rounded-2xl text-brand-300">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <span>Get Your Business Ready</span>
                            <span className="px-2.5 py-0.5 bg-brand-500/20 text-brand-300 text-xs font-mono rounded-full border border-brand-500/30">
                                {completedSteps.length} / 3 Completed
                            </span>
                        </h3>
                        <p className="text-xs text-ink-muted">Complete these quick steps to get fully operational</p>
                    </div>
                </div>

                <button
                    onClick={() => setDismissed(true)}
                    className="p-2 text-ink-muted hover:text-white hover:bg-interactive-hover rounded-xl transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Setup Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {steps.map((step) => {
                    const isDone = completedSteps.includes(step.key);
                    const StepIcon = step.icon;

                    return (
                        <div
                            key={step.key}
                            className={`p-4 rounded-2xl border transition-all duration-slow flex flex-col justify-between ${
                                isDone
                                    ? 'bg-neutral-950/80 border-emerald-500/40 text-ink-muted opacity-60'
                                    : 'bg-neutral-900/90 hover:bg-interactive-hover border-neutral-800 hover:border-brand-500/50 shadow-lg'
                            }`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={`p-2.5 rounded-xl border ${
                                        isDone
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                                    }`}>
                                        <StepIcon size={20} />
                                    </div>

                                    <button
                                        onClick={() => toggleStep(step.key)}
                                        className={`p-1 rounded-full border transition-colors ${
                                            isDone ? 'bg-emerald-500 text-white border-emerald-400' : 'border-neutral-700 hover:border-line-strong text-ink-muted'
                                        }`}
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                </div>

                                <div>
                                    <h4 className={`text-xs font-bold ${isDone ? 'line-through text-ink-muted' : 'text-white'}`}>
                                        {step.title}
                                    </h4>
                                    <p className="text-1xs text-ink-muted mt-0.5">{step.desc}</p>
                                </div>
                            </div>

                            {!isDone && (
                                <a
                                    href={step.link}
                                    className="mt-4 inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-xs font-bold"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight size={14} />
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
