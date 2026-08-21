import React, { useState } from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { Sparkles, ArrowRight, LayoutGrid, Bot, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';

export default function Welcome({ storeSlug, tenantName, onNext, onSelectMode }) {
    const [businessName, setBusinessName] = useState(tenantName || '');
    const [currency, setCurrency] = useState('PKR');

    const handleContinue = (mode) => {
        onSelectMode(mode);
        onNext();
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-10 animate-fadeIn relative z-10">
            {/* Ambient Background Glows */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 -right-32 w-[350px] h-[350px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Hero Banner */}
            <div className="text-center space-y-5">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-brand-500/10 border border-brand-500/30 rounded-full text-brand-300 text-xs font-medium tracking-wide shadow-xl backdrop-blur-md">
                    <ThinkingOrb state="breathing" size={20} theme="dark" />
                    <span>The Next-Generation ERP Engine</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                    One Qore. Your Modules. <br />
                    <span className="bg-gradient-to-r from-brand-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                        Tailored Entirely For You.
                    </span>
                </h1>

                <p className="text-neutral-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-normal">
                    Built on an always-on verified accounting ledger. Choose how you want to assemble your workspace today — zero lock-in, zero feature paywalls.
                </p>
            </div>

            {/* Quick Setup Bar */}
            <div className="p-6 md:p-8 bg-neutral-900/60 border border-white/10 backdrop-blur-2xl rounded-2xl space-y-6 max-w-2xl mx-auto shadow-2xl shadow-black/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 space-y-1.5">
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                            Business / Store Name
                        </label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Apex Trading & Goods"
                            className="w-full px-4 py-3 bg-neutral-950/90 border border-neutral-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        />
                    </div>
                    <div className="md:col-span-5 space-y-1.5">
                        <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                            Base Currency
                        </label>
                        <div className="relative">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-950/90 border border-neutral-700/80 rounded-2xl text-white text-sm focus:outline-none focus:border-brand-500 transition-all appearance-none pr-8 cursor-pointer"
                            >
                                <option value="PKR">PKR (Rs.)</option>
                                <option value="USD">USD ($)</option>
                                <option value="AED">AED (AED)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                            <Globe size={16} className="absolute right-3 top-3.5 text-ink-muted pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Path Selection Cards — 1000x Visual Upgrade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* AI Discovery Card */}
                <div
                    onClick={() => handleContinue('ai')}
                    className="group relative cursor-pointer p-6 bg-gradient-to-b from-neutral-900/90 via-neutral-900/70 to-brand-950/40 hover:from-neutral-900 hover:to-brand-900/50 border border-brand-500/30 hover:border-brand-500/70 rounded-2xl transition-all duration-slower shadow-2xl hover: flex flex-col justify-between overflow-hidden"
                >
                    {/* Background Hero Image */}
                    <div className="h-44 -mx-6 -mt-6 mb-4 overflow-hidden relative">
                        <img
                            src="/images/onboarding/ai_discovery.jpg"
                            alt="AI Discovery"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slower opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                        <div className="absolute top-4 right-4 px-3 py-1 bg-brand-600/90 backdrop-blur-md text-white text-2xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-lg">
                            <Sparkles size={12} />
                            <span>AI Neural Translator</span>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-500/10 border border-brand-500/30 rounded-2xl">
                                <ThinkingOrb state="weaving" size={32} theme="dark" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                                    AI Business Translator
                                </h3>
                                <p className="text-xs text-brand-400 font-mono">
                                    Describe in plain language → Instant architecture
                                </p>
                            </div>
                        </div>
                        <p className="text-ink-muted text-xs leading-relaxed">
                            Describe how your business works in plain English or Urdu. The AI translator automatically picks the optimal module combination for you.
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-brand-400 text-xs font-bold group-hover:text-brand-300">
                        <span className="flex items-center gap-1.5">
                            <Bot size={16} />
                            <span>Start AI Interactive Discovery</span>
                        </span>
                        <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                </div>

                {/* Preset Templates Card */}
                <div
                    onClick={() => handleContinue('preset')}
                    className="group relative cursor-pointer p-6 bg-gradient-to-b from-neutral-900/90 via-neutral-900/70 to-purple-950/40 hover:from-neutral-900 hover:to-purple-900/50 border border-purple-500/30 hover:border-purple-500/70 rounded-2xl transition-all duration-slower shadow-2xl hover: flex flex-col justify-between overflow-hidden"
                >
                    {/* Background Hero Image */}
                    <div className="h-44 -mx-6 -mt-6 mb-4 overflow-hidden relative">
                        <img
                            src="/images/onboarding/preset_template.jpg"
                            alt="Preset Templates"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slower opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                        <div className="absolute top-4 right-4 px-3 py-1 bg-purple-600/90 backdrop-blur-md text-white text-2xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-lg">
                            <LayoutGrid size={12} />
                            <span>15 Presets Ready</span>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
                                <LayoutGrid size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                                    Industry Templates
                                </h3>
                                <p className="text-xs text-purple-400 font-mono">
                                    Pre-configured for 15 business models
                                </p>
                            </div>
                        </div>
                        <p className="text-ink-muted text-xs leading-relaxed">
                            Pick from verified industry blueprints: Solo Cafe, Freelancer, Dine-In Restaurant, Repair Workshop, Wholesaler, or Retailer.
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-purple-400 text-xs font-bold group-hover:text-purple-300">
                        <span className="flex items-center gap-1.5">
                            <Zap size={16} />
                            <span>Browse Verified Presets</span>
                        </span>
                        <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
}
