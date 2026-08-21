import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { Sparkles, ArrowRight, ArrowLeft, Check, CheckCircle2, Shield, Plus, Trash2, Globe, Building2, Phone, Mail, Lock, Bot, Rocket, Layers } from 'lucide-react';

export default function BuildWorkspace({ initialPrompt = '', initialPreset = '', presets = {}, allModules = [] }) {
    const [step, setStep] = useState('result'); // 'result' | 'identity' | 'building' | 'account'
    const [prompt, setPrompt] = useState(initialPrompt);
    const [presetKey, setPresetKey] = useState(initialPreset);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    const [presetLabel, setPresetLabel] = useState('Custom Workspace');
    const [activeModules, setActiveModules] = useState(['products', 'pos', 'inventory', 'expenses', 'reports']);
    const [capabilities, setCapabilities] = useState([]);
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    // Identity Inputs
    const [businessName, setBusinessName] = useState('');
    const [currency, setCurrency] = useState('PKR');
    const [phone, setPhone] = useState('');

    // Account Inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [buildStepIndex, setBuildStepIndex] = useState(0);

    // Initial analysis on mount
    useEffect(() => {
        analyzePrompt(initialPrompt, initialPreset);
    }, []);

    const analyzePrompt = async (p, pr) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch(route('workspace.analyze'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ prompt: p, preset: pr }),
            });
            const data = await res.json();
            if (data.success) {
                setPresetLabel(data.preset_label);
                setActiveModules(data.modules);
                setCapabilities(data.capabilities);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleModule = (modKey) => {
        if (activeModules.includes(modKey)) {
            setActiveModules(activeModules.filter(m => m !== modKey));
        } else {
            setActiveModules([...activeModules, modKey]);
        }
    };

    // "Identity" now leads straight to the account form — the "we're building
    // while you fill this in" moment was fake (a 4.4s setInterval with zero
    // backend work happening underneath it). The real provisioning request is
    // now what the building screen actually waits on: it starts as soon as
    // account details are submitted, and the screen doesn't advance until the
    // request resolves. The step labels are cosmetic pacing during a real
    // network call, not a countdown to nothing.
    const handleProvision = async (e) => {
        e.preventDefault();
        setStep('building');
        setIsProvisioning(true);
        setBuildStepIndex(0);

        // Cosmetic pacing for the real request in flight — cleared as soon as
        // the actual response comes back, whichever happens first.
        let idx = 0;
        const pacer = setInterval(() => {
            idx = Math.min(idx + 1, 2); // hold at step 3 of 4 until the request actually finishes
            setBuildStepIndex(idx);
        }, 900);

        try {
            const res = await fetch(route('workspace.provision'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    business_name: businessName || 'My Business',
                    currency,
                    phone,
                    email,
                    password,
                    modules: activeModules,
                }),
            });
            const data = await res.json();
            clearInterval(pacer);

            if (data.success && data.redirect) {
                setBuildStepIndex(3);
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 500);
            } else {
                alert(data.message || 'Provisioning error');
                setIsProvisioning(false);
                setStep('account');
            }
        } catch (err) {
            clearInterval(pacer);
            console.error(err);
            setIsProvisioning(false);
            setStep('account');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-brand-500 selection:text-white flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
            <Head title="Build Your Workspace — VenQore" />

            {/* Ambient Background Lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Top Navigation */}
            <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-3 border-b border-neutral-800/80 mb-8 relative z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 border border-brand-500/30 rounded-xl">
                        <ThinkingOrb state="breathing" size={24} theme="dark" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">
                        VenQore <span className="text-brand-400 font-mono text-xs font-normal ml-1">Workspace Builder</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                    <Shield size={14} className="text-emerald-400" />
                    <span>The Qore Ledger Verified</span>
                </div>
            </header>

            {/* Main Stage */}
            <main className="relative z-10 my-auto py-4 w-full max-w-4xl mx-auto">
                {/* ── STEP 1: AI Result ("We built this for you") ────────────── */}
                {step === 'result' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/30 rounded-full text-brand-300 text-xs font-medium shadow-xl">
                                <Bot size={14} />
                                <span>AI Workspace Architecture</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                                We Built This Setup For Your Business
                            </h1>
                            <p className="text-ink-muted text-sm max-w-lg mx-auto">
                                Based on your requirements, VenQore configured this workspace with zero feature paywalls.
                            </p>
                        </div>

                        {/* Capability Stack Cards */}
                        {isAnalyzing ? (
                            <div className="py-12 text-center space-y-4">
                                <div className="flex justify-center">
                                    <ThinkingOrb state="solving" size={80} theme="dark" />
                                </div>
                                <p className="text-ink-muted text-xs font-mono">Analyzing requirements & assembling workspace...</p>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-6 shadow-2xl backdrop-blur-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{presetLabel}</h3>
                                        <p className="text-xs text-ink-muted mt-0.5">Recommended operational capabilities</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full">
                                        All Included ($0 Fee)
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {capabilities.map((cap) => {
                                        const isSelected = activeModules.includes(cap.key);
                                        return (
                                            <div
                                                key={cap.key}
                                                onClick={() => toggleModule(cap.key)}
                                                className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-neutral-950/90 border-brand-500/50 text-white shadow-lg'
                                                        : 'bg-neutral-950/40 border-neutral-800/80 text-ink-muted opacity-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl border ${
                                                        isSelected ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-neutral-800 border-neutral-700'
                                                    }`}>
                                                        <Layers size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold">{cap.label}</h4>
                                                        <p className="text-1xs text-ink-muted">{cap.desc}</p>
                                                    </div>
                                                </div>
                                                <div className={`p-1 rounded-full ${isSelected ? 'bg-emerald-500 text-white' : 'border border-neutral-700'}`}>
                                                    <Check size={12} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add more features — browse the full catalog, not just toggle
                                    off what was suggested */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAllFeatures(v => !v)}
                                        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white py-2 px-1 transition-colors"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Plus size={14} className={showAllFeatures ? 'rotate-45 transition-transform' : 'transition-transform'} />
                                            Want to add more features?
                                        </span>
                                        <span className="text-ink-muted font-normal">{allModules.length} available</span>
                                    </button>

                                    {showAllFeatures && (
                                        <div className="mt-2 p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                                            {allModules.map((mod) => {
                                                const isSelected = activeModules.includes(mod.key);
                                                return (
                                                    <div
                                                        key={mod.key}
                                                        onClick={() => toggleModule(mod.key)}
                                                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                                            isSelected
                                                                ? 'bg-brand-500/10 border-brand-500/40 text-white'
                                                                : 'bg-neutral-900/60 border-neutral-800 text-ink-muted hover:border-line-strong'
                                                        }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-bold truncate">{mod.label}</h4>
                                                            {mod.description && (
                                                                <p className="text-2xs text-ink-muted truncate">{mod.description}</p>
                                                            )}
                                                        </div>
                                                        <div className={`shrink-0 p-1 rounded-full ${isSelected ? 'bg-emerald-500 text-white' : 'border border-neutral-700'}`}>
                                                            <Check size={11} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 flex items-center justify-between text-xs text-ink-muted">
                                    <span className="text-brand-400 font-mono">✨ You can change these anytime with zero data loss.</span>
                                    <button
                                        onClick={() => setStep('identity')}
                                        className="py-3 px-6 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all"
                                    >
                                        <span>Continue to Identity</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 2: Business Identity (3 Fields) ──────────────────── */}
                {step === 'identity' && (
                    <div className="space-y-8 animate-fadeIn max-w-xl mx-auto">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Let's Make It Yours</h2>
                            <p className="text-ink-muted text-xs md:text-sm">
                                Enter your business details to personalize your workspace.
                            </p>
                        </div>

                        <div className="p-6 md:p-8 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-5 shadow-2xl backdrop-blur-2xl">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                                    Business Name *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="e.g. Hashmi Mart"
                                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-all pl-10"
                                    />
                                    <Building2 size={16} className="absolute left-3.5 top-3.5 text-ink-muted" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                                    Base Currency *
                                </label>
                                <div className="relative">
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white text-sm focus:outline-none focus:border-brand-500 transition-all pl-10 appearance-none cursor-pointer"
                                    >
                                        <option value="PKR">PKR ₨ — Pakistani Rupee</option>
                                        <option value="USD">USD $ — US Dollar</option>
                                        <option value="AED">AED — UAE Dirham</option>
                                        <option value="EUR">EUR € — Euro</option>
                                    </select>
                                    <Globe size={16} className="absolute left-3.5 top-3.5 text-ink-muted" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                                    <span>Phone Number</span>
                                    <span className="text-ink-muted text-2xs lowercase font-normal">Optional</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. +92 300 1234567"
                                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-all pl-10"
                                    />
                                    <Phone size={16} className="absolute left-3.5 top-3.5 text-ink-muted" />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <button
                                    onClick={() => setStep('result')}
                                    className="text-xs text-ink-muted hover:text-white font-semibold flex items-center gap-1.5"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back</span>
                                </button>

                                <button
                                    onClick={() => setStep('account')}
                                    className="py-3.5 px-6 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center gap-2 transition-all"
                                >
                                    <Rocket size={18} />
                                    <span>Continue to Account →</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Emotional 3D Build Animation ───────────────────── */}
                {step === 'building' && (
                    <div className="py-8 space-y-8 animate-fadeIn text-center max-w-xl mx-auto">
                        <div className="flex justify-center relative">
                            <div className="p-6 bg-neutral-900/90 border border-neutral-700/80 rounded-full shadow-2xl backdrop-blur-2xl">
                                <ThinkingOrb state="connecting" size={110} theme="dark" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Constructing Your Workspace</h2>
                            <p className="text-ink-muted text-xs">Assembling your verified architecture on The Qore ledger...</p>
                        </div>

                        <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-3 text-left shadow-2xl">
                            {[
                                'Understanding your business requirements',
                                'Setting up your workspace & modules',
                                'Connecting data engine & ledger sequences',
                                'Personalizing your dashboard',
                            ].map((stTitle, idx) => {
                                const isDone = idx <= buildStepIndex;
                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            isDone ? 'bg-brand-500/10 border-brand-500/30 text-white' : 'opacity-40 border-transparent text-ink-muted'
                                        }`}
                                    >
                                        <CheckCircle2 size={18} className={isDone ? 'text-emerald-400' : 'text-ink-secondary'} />
                                        <span className="text-xs font-semibold">{stTitle}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Account Registration ("Save to Enter") ──────────── */}
                {step === 'account' && (
                    <div className="space-y-8 animate-fadeIn max-w-md mx-auto">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold">
                                <CheckCircle2 size={14} />
                                <span>Almost there — one last step</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">Save Your Workspace</h2>
                            <p className="text-ink-muted text-xs">Create your account credentials — we'll build your workspace as soon as you submit.</p>
                        </div>

                        <form onSubmit={handleProvision} className="p-6 md:p-8 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-4 shadow-2xl backdrop-blur-2xl">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                                    Account Email *
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="owner@yourbusiness.com"
                                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-all pl-10"
                                    />
                                    <Mail size={16} className="absolute left-3.5 top-3.5 text-ink-muted" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-all pl-10"
                                    />
                                    <Lock size={16} className="absolute left-3.5 top-3.5 text-ink-muted" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isProvisioning}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-400 hover:to-brand-500 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-98 mt-2"
                            >
                                {isProvisioning ? (
                                    <span>Entering Workspace...</span>
                                ) : (
                                    <>
                                        <Rocket size={18} />
                                        <span>Save & Enter Workspace →</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="w-full max-w-5xl mx-auto text-center py-4 border-t border-neutral-900 text-ink-muted text-xs flex items-center justify-between relative z-20">
                <span>© 2026 VenQore ERP. All rights reserved.</span>
                <span className="font-mono text-ink-muted">The Qore Ledger Verified</span>
            </footer>
        </div>
    );
}
