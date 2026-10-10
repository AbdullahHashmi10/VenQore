import React from 'react';
import { Lock, Box, Layout, Globe, Calendar, Palette, Bell, Shield, Moon, Calculator, Eye, AlertTriangle } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'fr', label: 'French (Français)' },
    { value: 'ur', label: 'Urdu (اردو)' }
];

const DATE_FORMAT_OPTIONS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
    { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (31-Dec-2026)' }
];

export default function GeneralSettingsSection({ data, setData }) {
    const isPasscodeActive = data.enable_passcode === '1' || data.enable_passcode === true;
    const isMultiFirmActive = data.multi_firm_enabled === '1' || data.multi_firm_enabled === true;
    const decimalPlaces = parseInt(data.decimal_places ?? 2, 10);
    const uiScale = parseInt(data.ui_scale ?? 100, 10);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* 2-Column Master Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Card 1: Security & Entity Governance */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                <Shield size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-ink leading-tight">Security & Governance</h3>
                                <p className="text-xs text-ink-muted">Passcode authorization and multi-entity mode</p>
                            </div>
                        </div>

                        <div className="divide-y divide-line">
                            <Toggle
                                label="Admin Passcode"
                                description="Protect sensitive actions (refunds, voids, resets) with a secure PIN."
                                enabled={isPasscodeActive}
                                onChange={(v) => setData('enable_passcode', v)}
                                icon={Lock}
                            />

                            {/* Passcode Input (Collapsible) */}
                            {isPasscodeActive && (
                                <div className="py-4 pl-12 animate-in fade-in slide-in-from-top-2 duration-normal">
                                    <div className="p-4 bg-app rounded-xl border border-line space-y-2">
                                        <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                            Admin 6-Digit PIN
                                        </label>
                                        <div className="relative max-w-sm">
                                            <input
                                                type="password"
                                                maxLength="6"
                                                value={data.admin_passcode || ''}
                                                onChange={(e) => setData('admin_passcode', e.target.value.replace(/\D/g, ''))}
                                                className="w-full pl-4 pr-10 py-2.5 bg-surface border border-line rounded-xl text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-brand-500 text-ink shadow-xs outline-none transition-all"
                                                placeholder="••••••"
                                            />
                                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                                        </div>
                                        <p className="text-3xs text-ink-muted">Leave blank to retain current passcode.</p>
                                    </div>
                                </div>
                            )}

                            <Toggle
                                label="Multi-Firm Mode"
                                description="Manage multiple legal business entities (In Development)."
                                enabled={false}
                                onChange={() => {}}
                                icon={Box}
                                upcoming={true}
                                disabled={true}
                            />

                            <div className="py-3.5 flex flex-wrap items-center justify-between gap-y-2">
                                <div className="flex items-center gap-3.5 pr-4">
                                    <div className="w-9 h-9 rounded-xl bg-app text-ink-muted flex items-center justify-center shrink-0">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-ink">Auto-Logout Inactivity</h4>
                                        <p className="text-xs text-ink-muted">Automatically lock session after minutes of idle time</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="5"
                                        max="480"
                                        value={data.auto_logout || 30}
                                        onChange={(e) => setData('auto_logout', Math.max(5, parseInt(e.target.value, 10) || 30))}
                                        className="w-20 px-3 py-1.5 bg-app border border-line rounded-xl text-sm font-bold text-ink text-center focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                    <span className="text-xs font-bold text-ink-muted">min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Visual & Format */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                <Layout size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-ink leading-tight">Visual & Formatting</h3>
                                <p className="text-xs text-ink-muted">Precision decimals and interface density</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Decimal Precision */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <label className="text-sm font-bold text-ink block">Decimal Precision</label>
                                        <span className="text-xs text-ink-muted">Number of fractional digits across catalog and reports</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold bg-sunken border border-line px-2.5 py-1 rounded-lg text-ink-secondary">
                                        100.{'0'.repeat(Math.max(0, Math.min(4, decimalPlaces)))}
                                    </span>
                                </div>

                                {/* Segmented Control */}
                                <div className="grid grid-cols-5 gap-1.5 bg-app p-1.5 rounded-xl border border-line">
                                    {[0, 1, 2, 3, 4].map((num) => {
                                        const isActive = decimalPlaces === num;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setData('decimal_places', num)}
                                                className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                                                    isActive
                                                        ? 'bg-brand-600 text-white shadow-xs'
                                                        : 'text-ink-muted hover:text-ink hover:bg-surface'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Interface Scale */}
                            <div className="space-y-3 pt-4 border-t border-line">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <label className="text-sm font-bold text-ink block">Interface Scale</label>
                                        <span className="text-xs text-ink-muted">Adjust zoom scale for high-res monitors or compact POS touchscreens</span>
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
                </div>

                {/* Card 3: Localization */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                <Globe size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-ink leading-tight">Localization</h3>
                                <p className="text-xs text-ink-muted">Regional language and date formatting</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                    Display Language
                                </label>
                                <PremiumSelect
                                    options={LANGUAGE_OPTIONS}
                                    value={data.language || 'en'}
                                    onChange={(val) => setData('language', val)}
                                    icon={Globe}
                                    searchable={false}
                                    placeholder="Select Language"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                    Date Format
                                </label>
                                <PremiumSelect
                                    options={DATE_FORMAT_OPTIONS}
                                    value={data.date_format || 'DD/MM/YYYY'}
                                    onChange={(val) => setData('date_format', val)}
                                    icon={Calendar}
                                    searchable={false}
                                    placeholder="Select Date Format"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Appearance & Accessibility */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                <Palette size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-ink leading-tight">Theme & Accessibility</h3>
                                <p className="text-xs text-ink-muted">Interface theme and utility tools</p>
                            </div>
                        </div>

                        <div className="divide-y divide-line">
                            <Toggle
                                label="Force Dark Mode"
                                description="Use dark theme by default across all staff sessions"
                                enabled={data.dark_mode_default === true || data.dark_mode_default === '1'}
                                onChange={(v) => setData('dark_mode_default', v)}
                                icon={Moon}
                            />

                            <Toggle
                                label="Header Calculator"
                                description="Show a quick calculator in the Dynamic Island header"
                                enabled={data.header_calculator_enabled === '1' || data.header_calculator_enabled === true}
                                onChange={(v) => setData('header_calculator_enabled', v ? '1' : '0')}
                                icon={Calculator}
                            />

                            <Toggle
                                label="Senior Mode (Accessibility)"
                                description="Enable larger font scale & enhanced contrast for easy reading"
                                enabled={data.senior_mode === true || data.senior_mode === '1'}
                                onChange={(v) => setData('senior_mode', v)}
                                icon={Eye}
                            />
                        </div>
                    </div>
                </div>

                {/* Card 5: Notifications (Span 2) */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs lg:col-span-2">
                    <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                            <Bell size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-ink leading-tight">Notifications & Alerts</h3>
                            <p className="text-xs text-ink-muted">Stay updated on inventory reorders and daily financial performance</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-app rounded-xl border border-line">
                            <Toggle
                                label="Low Stock Alerts"
                                description="Alert when items fall below their minimum safety threshold"
                                enabled={data.low_stock_alerts === true || data.low_stock_alerts === '1'}
                                onChange={(v) => setData('low_stock_alerts', v)}
                            />
                        </div>

                        <div className="p-4 bg-app rounded-xl border border-line">
                            <Toggle
                                label="Email Summaries"
                                description="Periodic financial digests and inventory summaries via email"
                                enabled={data.email_notifications !== false && data.email_notifications !== '0'}
                                onChange={(v) => setData('email_notifications', v)}
                            />
                        </div>

                        <div className="p-4 bg-app rounded-xl border border-line">
                            <Toggle
                                label="Daily Sales Digest"
                                description="Automated end-of-day register closing report sent to owner"
                                enabled={data.daily_sales_summary === true || data.daily_sales_summary === '1'}
                                onChange={(v) => setData('daily_sales_summary', v)}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
