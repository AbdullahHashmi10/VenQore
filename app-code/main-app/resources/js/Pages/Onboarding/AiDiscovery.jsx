import React, { useState } from 'react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { Sparkles, ArrowRight, ArrowLeft, Bot, CheckCircle2, Zap, Layers, MessageSquare } from 'lucide-react';

export default function AiDiscovery({ onNext, onBack, onAiResult, storeSlug }) {
    const [prompt, setPrompt] = useState('');
    const [industry, setIndustry] = useState('cafe');
    const [teamSize, setTeamSize] = useState('solo');
    const [salesType, setSalesType] = useState('pos');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch(route('store.onboarding.v2.ai-discovery', { store_slug: storeSlug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ prompt, industry, teamSize, salesType }),
            });
            const data = await res.json();
            if (data.success) {
                onAiResult(data.preset_key, data.suggested_modules, data.preset);
                setTimeout(() => {
                    setIsAnalyzing(false);
                    onNext();
                }, 1400);
            }
        } catch (e) {
            console.error(e);
            setIsAnalyzing(false);
            onNext();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fadeIn relative z-10">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900/80 hover:bg-interactive-hover border border-neutral-800 rounded-xl text-ink-muted hover:text-white text-xs font-semibold transition-all"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Mode Choice</span>
                </button>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-500/10 border border-brand-500/30 rounded-full text-brand-300 text-xs font-semibold backdrop-blur-md">
                    <ThinkingOrb state="searching" size={18} theme="dark" />
                    <span>AI Architecture Resolver</span>
                </div>
            </div>

            {/* Title Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Describe Your Business
                </h2>
                <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
                    Tell us what you sell and how you work. VenQore's AI will select the exact modules required for your system.
                </p>
            </div>

            {/* Main Interactive Split Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Visual Card */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900/80 flex flex-col justify-between min-h-[380px]">
                    <img
                        src="/images/onboarding/ai_discovery.jpg"
                        alt="AI Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />

                    <div className="relative z-10 p-6 space-y-4">
                        <div className="w-fit p-3 bg-brand-500/20 border border-brand-500/40 rounded-2xl">
                            <Bot size={28} className="text-brand-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">
                            Deterministic Module Engine
                        </h3>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                            "The AI is a translator, not an authority." It maps your natural requirements into existing, verified platform modules.
                        </p>
                    </div>

                    {/* Dynamic ThinkingOrb State Display */}
                    <div className="relative z-10 p-6 bg-neutral-950/70 border-t border-white/5 backdrop-blur-md flex items-center gap-4">
                        <ThinkingOrb state={isAnalyzing ? 'solving' : 'searching'} size={48} theme="dark" />
                        <div>
                            <span className="text-2xs font-mono uppercase tracking-widest text-brand-400 block">
                                {isAnalyzing ? 'SOLVING ARCHITECTURE' : 'AI STANDBY'}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                                {isAnalyzing ? 'Resolving 46 Module Registry...' : 'Ready for Your Input'}
                            </h4>
                        </div>
                    </div>
                </div>

                {/* Right Form Input */}
                <div className="lg:col-span-7 p-6 md:p-8 bg-neutral-900/80 border border-neutral-800/90 rounded-2xl space-y-6 shadow-2xl backdrop-blur-2xl">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center justify-between">
                            <span>Describe in your own words</span>
                            <span className="text-brand-400 font-mono text-2xs">English or Urdu</span>
                        </label>
                        <div className="relative">
                            <textarea
                                rows={3}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. We run a specialty coffee shop and bakery. We make our own bread, take custom wedding orders, and sell online..."
                                className="w-full px-4 py-3.5 bg-neutral-950/90 border border-neutral-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                            />
                            <MessageSquare size={16} className="absolute right-3.5 top-3.5 text-ink-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* Guided Dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div>
                            <label className="block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                                Industry Type
                            </label>
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:border-brand-500 transition-colors"
                            >
                                <option value="cafe">Cafe / Bakery</option>
                                <option value="freelance">Agency / Service</option>
                                <option value="retail">Retail / Grocery</option>
                                <option value="repair">Repair Workshop</option>
                                <option value="restaurant">Dine-In Restaurant</option>
                                <option value="wholesale">Wholesale & B2B</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                                Sales Method
                            </label>
                            <select
                                value={salesType}
                                onChange={(e) => setSalesType(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:border-brand-500 transition-colors"
                            >
                                <option value="pos">POS Counter</option>
                                <option value="invoicing">Invoicing & Quotes</option>
                                <option value="tables">Table Service</option>
                                <option value="both">Counter + Invoicing</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                                Team Size
                            </label>
                            <select
                                value={teamSize}
                                onChange={(e) => setTeamSize(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:border-brand-500 transition-colors"
                            >
                                <option value="solo">Solo (1 User)</option>
                                <option value="small">Small Team (2-5)</option>
                                <option value="growing">Growing (5+ Users)</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        disabled={isAnalyzing}
                        onClick={handleAnalyze}
                        className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform active:scale-98"
                    >
                        {isAnalyzing ? (
                            <>
                                <ThinkingOrb state="solving" size={24} theme="dark" />
                                <span>Resolving Optimal Module Stack...</span>
                            </>
                        ) : (
                            <>
                                <Bot size={18} />
                                <span>Translate & Assemble System</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
