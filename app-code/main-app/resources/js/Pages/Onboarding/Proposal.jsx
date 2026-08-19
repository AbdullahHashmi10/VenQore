import React, { useState } from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, Zap, Layers, Plus, Trash2, Database, DollarSign } from 'lucide-react';

export default function Proposal({ modulesList = [], presetDetail = {}, onNext, onBack }) {
    const [activeModules, setActiveModules] = useState(
        modulesList.length > 0 ? modulesList : ['products', 'pos', 'inventory', 'expenses', 'reports']
    );

    const toggleModule = (modKey) => {
        if (activeModules.includes(modKey)) {
            setActiveModules(activeModules.filter(m => m !== modKey));
        } else {
            setActiveModules([...activeModules, modKey]);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn relative z-10">
            {/* Navigation & Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-all"
                >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold backdrop-blur-md">
                    <ShieldCheck size={14} />
                    <span>Verified System Architecture</span>
                </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    Your System Architecture
                </h2>
                <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
                    Built on <strong className="text-white">The Qore</strong> verified double-entry engine. Every module selected below plugs in seamlessly.
                </p>
            </div>

            {/* Hero Proposal Stage — Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: The Central 3D Qore Orb Graphic */}
                <div className="lg:col-span-5 relative flex flex-col items-center justify-center p-8 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden min-h-[420px]">
                    <img
                        src="/images/onboarding/qore_core.jpg"
                        alt="Qore Core 3D"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />

                    {/* Central Interactive Orb Overlay */}
                    <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
                        <div className="relative p-5 bg-slate-950/90 border border-slate-700/80 rounded-full shadow-2xl shadow-indigo-500/30 backdrop-blur-xl">
                            <ThinkingOrb state="shaping" size={120} theme="dark" />
                        </div>

                        <div className="space-y-1">
                            <div className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-indigo-300 text-[10px] font-mono uppercase tracking-widest">
                                The Qore Engine
                            </div>
                            <h4 className="text-xl font-bold text-white">Always-On Ledger</h4>
                            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                                Double-entry accounting, stock costing, sequence numbering, and tax engine active 24/7.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Module Stack & Transparent Billing */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Active Module Stack Card */}
                    <div className="p-6 md:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-5 shadow-2xl backdrop-blur-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-white font-bold text-base">
                                <Layers size={18} className="text-indigo-400" />
                                <span>Active Module Stack ({activeModules.length})</span>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full">
                                All 42 Included
                            </span>
                        </div>

                        {/* Interactive Chips Grid */}
                        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                            {activeModules.map((modKey) => (
                                <div
                                    key={modKey}
                                    className="px-3.5 py-2 bg-slate-950/90 border border-indigo-500/30 rounded-xl flex items-center gap-2 text-indigo-200 text-xs font-medium shadow-sm hover:border-indigo-500 transition-colors"
                                >
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span className="capitalize">{modKey.replace(/_/g, ' ')}</span>
                                    <button
                                        onClick={() => toggleModule(modKey)}
                                        className="text-slate-500 hover:text-rose-400 transition-colors ml-1 font-bold text-sm"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Guarantee Card */}
                    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl">
                        <div className="space-y-0.5">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-400" />
                                <span>Module Feature Fee</span>
                            </h4>
                            <p className="text-slate-400 text-xs">Zero feature locks, zero hidden tier charges</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-emerald-400">$0</span>
                            <span className="text-slate-500 text-[10px] uppercase font-mono block">Feature Locks</span>
                        </div>
                    </div>

                    {/* High-Impact Launch Button */}
                    <button
                        onClick={onNext}
                        className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-98"
                    >
                        <Zap size={20} />
                        <span>Build My VenQore System Now</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
