import React, { useState } from 'react';
import Welcome from './Welcome';
import AiDiscovery from './AiDiscovery';
import PresetPicker from './PresetPicker';
import Proposal from './Proposal';
import Building from './Building';
import FirstRunDashboard from './FirstRunDashboard';
import { ThinkingOrb } from '@/Components/ThinkingOrbs/ThinkingOrb';
import { Sparkles, Shield, CheckCircle2 } from 'lucide-react';

export default function Wizard({ storeSlug, tenantName, presets = {}, questions = [] }) {
    const [step, setStep] = useState('welcome'); // 'welcome' | 'ai' | 'preset' | 'proposal' | 'building' | 'dashboard'
    const [mode, setMode] = useState('ai'); // 'ai' | 'preset'
    const [selectedModules, setSelectedModules] = useState(['products', 'pos', 'inventory', 'expenses', 'reports']);
    const [selectedPresetDetail, setSelectedPresetDetail] = useState(null);

    const handleSelectMode = (chosenMode) => {
        setMode(chosenMode);
    };

    const handleAiResult = (presetKey, modules, presetDetail) => {
        setSelectedModules(modules);
        setSelectedPresetDetail(presetDetail);
    };

    const handleSelectPreset = (key, modules, presetDetail) => {
        setSelectedModules(modules);
        setSelectedPresetDetail(presetDetail);
    };

    const handleApplyAndBuild = async () => {
        setStep('building');
        try {
            await fetch(route('store.onboarding.v2.apply-preset', { store_slug: storeSlug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ modules: selectedModules }),
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleCompleteOnboarding = async () => {
        try {
            const res = await fetch(route('store.onboarding.v2.complete', { store_slug: storeSlug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await res.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (e) {
            console.error(e);
            window.location.href = `/s/${storeSlug}/dashboard`;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-brand-500 selection:text-white flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
            {/* Background Decorative Lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 border-b border-neutral-800/80 mb-8 relative z-20">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-brand-500/10 border border-brand-500/30 rounded-xl">
                        <ThinkingOrb state="breathing" size={28} theme="dark" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">
                        VenQore <span className="text-brand-400 font-mono text-xs font-normal ml-1">v2.0</span>
                    </span>
                </div>

                {/* Progress Indicators */}
                <div className="hidden md:flex items-center gap-2">
                    {['welcome', mode, 'proposal', 'building', 'dashboard'].map((st, idx) => {
                        const isCurrent = step === st;
                        return (
                            <div key={st} className="flex items-center gap-2">
                                <div
                                    className={`px-3 py-1 rounded-full text-1xs font-semibold transition-all ${
                                        isCurrent
                                            ? 'bg-brand-500 text-white shadow-lg '
                                            : 'bg-neutral-900 border border-neutral-800 text-ink-muted'
                                    }`}
                                >
                                    Step {idx + 1}
                                </div>
                                {idx < 4 && <div className="w-3 h-px bg-neutral-800" />}
                            </div>
                        );
                    })}
                </div>
            </header>

            {/* Main Step Render */}
            <main className="relative z-10 my-auto py-4">
                {step === 'welcome' && (
                    <Welcome
                        storeSlug={storeSlug}
                        tenantName={tenantName}
                        onSelectMode={handleSelectMode}
                        onNext={() => setStep(mode)}
                    />
                )}

                {step === 'ai' && (
                    <AiDiscovery
                        storeSlug={storeSlug}
                        onBack={() => setStep('welcome')}
                        onAiResult={handleAiResult}
                        onNext={() => setStep('proposal')}
                    />
                )}

                {step === 'preset' && (
                    <PresetPicker
                        presets={presets}
                        onBack={() => setStep('welcome')}
                        onSelectPreset={handleSelectPreset}
                        onNext={() => setStep('proposal')}
                    />
                )}

                {step === 'proposal' && (
                    <Proposal
                        modulesList={selectedModules}
                        presetDetail={selectedPresetDetail}
                        onBack={() => setStep(mode)}
                        onNext={handleApplyAndBuild}
                    />
                )}

                {step === 'building' && (
                    <Building
                        onComplete={() => setStep('dashboard')}
                    />
                )}

                {step === 'dashboard' && (
                    <FirstRunDashboard
                        storeSlug={storeSlug}
                        tenantName={tenantName}
                        modules={selectedModules}
                        onCompleteAll={handleCompleteOnboarding}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="w-full max-w-6xl mx-auto text-center py-4 border-t border-neutral-900 text-ink-muted text-xs flex items-center justify-between relative z-20">
                <span>© 2026 VenQore ERP. All rights reserved.</span>
                <div className="flex items-center gap-2 text-ink-muted font-mono">
                    <Shield size={12} className="text-emerald-400" />
                    <span>The Qore Double-Entry Engine Verified</span>
                </div>
            </footer>
        </div>
    );
}
