import React from 'react';
import { Shield, Lock, Layout, Layers, Box, AlertTriangle } from 'lucide-react';

export default function GeneralSettingsSection({ data, setData }) {
    // Helper for toggle component to keep code clean
    const SettingToggle = ({ label, description, checked, onChange, icon: Icon, color = 'indigo' }) => (
        <div className="p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${checked ? `bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600` : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{label}</h4>
                    <p className="text-sm text-slate-500 font-medium">{description}</p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${checked ? `bg-${color}-600` : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`absolute top-1 bg-white rounded-full transition-all duration-300 shadow-md w-6 h-6 ${checked ? 'left-[calc(100%-28px)]' : 'left-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">

            {/* Header / Intro */}
            <div className="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-white/10">
                            <Layers className="text-indigo-400" size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">System Preferences</h2>
                    </div>
                    <p className="text-slate-400 font-medium ml-14 text-lg max-w-2xl">
                        Fine-tune your POS experience. Control security, inventory rules, and visual density.
                    </p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Column 1: Core Toggles */}
                <div className="space-y-6">
                    <SettingToggle
                        label="Admin Passcode"
                        description="Protect sensitive actions with a secure PIN."
                        checked={data.enable_passcode === '1' || data.enable_passcode === true}
                        onChange={(v) => setData('enable_passcode', v)}
                        icon={Lock}
                        color="red"
                    />

                    {/* Passcode Input (Conditional) */}
                    <div className={`overflow-hidden transition-all duration-300 ${data.enable_passcode === '1' || data.enable_passcode === true ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/30 ml-4 border-l-[6px] border-l-red-500">
                            <label className="block text-xs font-bold text-red-800 dark:text-red-300 mb-2 uppercase tracking-wider">Set Secure PIN</label>
                            <div className="relative max-w-xs">
                                <input
                                    type="password"
                                    maxLength="6"
                                    value={data.admin_passcode || ''}
                                    onChange={(e) => setData('admin_passcode', e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border-none rounded-xl text-xl font-black tracking-[0.5em] focus:ring-2 focus:ring-red-500/50 text-slate-800 dark:text-white shadow-sm"
                                    placeholder="••••"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                            </div>
                            <p className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-medium">Used for refunds, voids, and settings.</p>
                        </div>
                    </div>

                    <SettingToggle
                        label="Multi-Firm Mode"
                        description="manage multiple business entities."
                        checked={data.multi_firm_enabled === '1' || data.multi_firm_enabled === true}
                        onChange={(v) => setData('multi_firm_enabled', v)}
                        icon={Box}
                        color="indigo"
                    />

                    <SettingToggle
                        label="Negative Stock Sales"
                        description="Allow selling items even if stock is 0."
                        checked={data.stop_sale_negative_stock === '0' || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0 || data.stop_sale_negative_stock === null}
                        onChange={(v) => setData('stop_sale_negative_stock', !v)} // If we want to ALLOW (v=true), we set stop to FALSE.
                        icon={AlertTriangle}
                        color="amber"
                    />
                    <div className="px-4">
                        <p className="text-xs text-slate-400 italic">
                            * Note: Turning 'Negative Stock Sales' <b>ON</b> means you <b>CAN</b> sell items with 0 stock. <b>OFF</b> means strict control.
                        </p>
                    </div>

                </div>

                {/* Column 2: Visual & Formats */}
                <div className="space-y-6">

                    {/* Visual Card */}
                    <div className="p-8 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                                <Layout size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Visual & Format</h3>
                        </div>

                        <div className="space-y-8">

                            {/* Decimal Places */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Decimal Precision</label>
                                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">
                                        100.{'0'.repeat(data.decimal_places)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 1, 2, 3].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setData('decimal_places', num)}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${parseInt(data.decimal_places) === num
                                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-transparent bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* UI Scailing */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Interface Scale</label>
                                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                                        {data.ui_scale}%
                                    </span>
                                </div>

                                <div className="relative h-12 flex items-center">
                                    <div className="absolute w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-300"
                                            style={{ width: `${((data.ui_scale - 75) / (125 - 75)) * 100}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="75"
                                        max="125"
                                        step="5"
                                        value={data.ui_scale}
                                        onChange={(e) => setData('ui_scale', e.target.value)}
                                        className="absolute w-full h-12 opacity-0 cursor-pointer z-10"
                                    />
                                    <div
                                        className="absolute w-6 h-6 bg-white border-4 border-indigo-600 rounded-full shadow-lg transition-all duration-300 pointer-events-none"
                                        style={{ left: `calc(${((data.ui_scale - 75) / (125 - 75)) * 100}% - 12px)` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                    <span>Compact (75%)</span>
                                    <span>Normal (100%)</span>
                                    <span>Large (125%)</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
