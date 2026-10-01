import React from 'react';
import { Palette, Moon, Calculator, Eye, Layout } from 'lucide-react';
import Toggle from '@/Components/Toggle';

export default function DisplayPreferencesSection({ data, setData }) {
    const uiScale = parseInt(data.ui_scale ?? 100, 10);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: UI Scale */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                <Layout size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-ink leading-tight">Interface Scale</h3>
                                <p className="text-xs text-ink-muted">Scope: Applies to all staff terminals and browser sessions</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <label className="text-sm font-bold text-ink block">Screen Zoom Factor</label>
                                    <span className="text-xs text-ink-muted">Optimizes touch targets on 1080p, 2K &amp; tablet screens</span>
                                </div>
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-lg border border-brand-500/20">
                                    {uiScale}%
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="relative h-6 flex items-center">
                                    <div className="absolute w-full h-2 bg-app border border-line rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-500 transition-all duration-200"
                                            style={{ width: `${((Math.max(75, Math.min(125, uiScale)) - 75) / (125 - 75)) * 100}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="75"
                                        max="125"
                                        step="5"
                                        value={uiScale}
                                        onChange={(e) => setData('ui_scale', parseInt(e.target.value, 10))}
                                        className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
                                    />
                                    <div
                                        className="absolute w-5 h-5 bg-white border-2 border-brand-600 rounded-full shadow-md transition-all duration-200 pointer-events-none"
                                        style={{ left: `calc(${((Math.max(75, Math.min(125, uiScale)) - 75) / (125 - 75)) * 100}% - 10px)` }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    {[
                                        { scale: 75, label: 'Compact (75%)' },
                                        { scale: 100, label: 'Default (100%)' },
                                        { scale: 125, label: 'Large (125%)' }
                                    ].map((preset) => (
                                        <button
                                            key={preset.scale}
                                            type="button"
                                            onClick={() => setData('ui_scale', preset.scale)}
                                            className={`py-1.5 px-2 rounded-lg text-2xs font-bold transition-all border ${
                                                uiScale === preset.scale
                                                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border-brand-500/30 shadow-xs'
                                                    : 'bg-app text-ink-muted hover:text-ink border-transparent hover:border-line'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Card: Theme & Navigation Utilities */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-3.5 mb-2 pb-4 border-b border-line">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                            <Moon size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-ink leading-tight">Theme &amp; Accessibility</h3>
                            <p className="text-xs text-ink-muted">Scope: Store-wide default configuration</p>
                        </div>
                    </div>

                    <div className="divide-y divide-line">
                        <Toggle
                            label="Force Dark Mode by Default"
                            description="Enforce dark theme palette across all staff logins and POS stations."
                            enabled={data.dark_mode_default === true || data.dark_mode_default === '1'}
                            onChange={(v) => setData('dark_mode_default', v)}
                            icon={Moon}
                        />

                        <Toggle
                            label="Header Dynamic Calculator"
                            description="Pin a quick calculator button inside the top Dynamic Island header."
                            enabled={data.header_calculator_enabled === '1' || data.header_calculator_enabled === true}
                            onChange={(v) => setData('header_calculator_enabled', v ? '1' : '0')}
                            icon={Calculator}
                        />

                        <Toggle
                            label="Senior Mode (Accessibility)"
                            description="Boost font sizes, contrast ratios, and button outlines for touch screens."
                            enabled={data.senior_mode === true || data.senior_mode === '1'}
                            onChange={(v) => setData('senior_mode', v)}
                            icon={Eye}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
