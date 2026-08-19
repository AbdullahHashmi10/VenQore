import React, { useEffect, useState } from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { CheckCircle2, Shield, Sparkles, Database, Cpu, Layers } from 'lucide-react';

const STEPS = [
    { title: 'Initializing The Qore Core Engine', desc: 'Bootstrapping double-entry ledger & FIFO costing', icon: Database },
    { title: 'Seeding Legal Sequences & Units', desc: 'Configuring UOM conversions and document numbering', icon: Cpu },
    { title: 'Wiring Selected Module Stack', desc: 'Attaching route parameters & permissions', icon: Layers },
    { title: 'Verifying Security & Isolation', desc: 'Executing tenant data boundary sanity check', icon: Shield },
];

export default function Building({ onComplete }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => {
                if (prev < STEPS.length - 1) {
                    return prev + 1;
                }
                clearInterval(interval);
                setTimeout(() => {
                    onComplete();
                }, 1000);
                return prev;
            });
        }, 1200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto py-8 space-y-8 animate-fadeIn text-center relative z-10">
            {/* Ambient Lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />

            {/* ThinkingOrb Animation Stage */}
            <div className="flex justify-center relative">
                <div className="relative p-6 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-2xl shadow-indigo-500/30 backdrop-blur-2xl">
                    <ThinkingOrb state="connecting" size={120} theme="dark" />
                </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
                    <Sparkles size={14} />
                    <span>System Provisioning</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Assembling Your VenQore System
                </h2>
                <p className="text-slate-400 text-xs md:text-sm">
                    Setting up your tailored architecture on The Qore ledger engine...
                </p>
            </div>

            {/* Stepper Card */}
            <div className="p-6 md:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-2xl backdrop-blur-2xl text-left">
                {STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const StepIcon = step.icon;

                    return (
                        <div
                            key={idx}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                                isCurrent
                                    ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10'
                                    : isDone
                                    ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                                    : 'opacity-40 border-transparent text-slate-500'
                            }`}
                        >
                            <div className={`p-3 rounded-xl border ${
                                isDone
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : isCurrent
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-500'
                            }`}>
                                {isDone ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-sm font-bold leading-tight">{step.title}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                            </div>

                            {isCurrent && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-mono animate-pulse">
                                    <span>Processing...</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
