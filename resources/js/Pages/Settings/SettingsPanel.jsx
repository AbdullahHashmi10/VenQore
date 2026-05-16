import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import {
    Settings, Building2, Shield, Lock, Save, Check, RefreshCw,
    ChevronRight, ShoppingCart, Percent, FileText, Smartphone,
    AlertTriangle, Layout
} from 'lucide-react';
import Toggle from '@/Components/Toggle';
import SectionHeader from '@/Components/SectionHeader';

const SETTINGS_CATEGORIES = [
    {
        id: 'org',
        name: 'Organization',
        icon: Building2,
        sections: ['general']
    },
    {
        id: 'ops',
        name: 'Operations',
        icon: ShoppingCart,
        sections: ['pos']
    },
    {
        id: 'adv',
        name: 'Advanced',
        icon: Shield,
        sections: ['security']
    }
];

const SETTINGS_SECTIONS = [
    { id: 'general', name: 'Store Info', icon: Building2, description: 'Store details and address' },
    { id: 'pos', name: 'POS & Sales', icon: ShoppingCart, description: 'Sales and interface configuration' },
    { id: 'security', name: 'Security', icon: Shield, description: 'Access control & passcodes' },
];

export default function SettingsPanel({ settings }) {
    const {
        store
    } = usePage().props;

    const { auth } = usePage().props;
    // Check if user is admin. matches original logic
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'owner' || auth.user.role === 'platform_admin' || auth.user.email === 'abdullah@example.com';

    const [activeSection, setActiveSection] = useState('general');
    const [saved, setSaved] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState(['org', 'ops', 'adv']);

    const toggleCategory = (catId) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    // Initialize form with flat structure for simpler handling, similar to Admin Settings, 
    // but mapping to the specific keys used in this view
    const { data, setData, post, processing } = useForm({
        // POS & Sales
        pos_auto_fill_cash: settings.pos_auto_fill_cash === '1',
        senior_mode: settings.senior_mode === '1',
        fbr_integration: settings.fbr_integration === '1',
        show_margin_percentage: settings.show_margin_percentage === '1',
        stop_sale_negative_stock: settings.stop_sale_negative_stock === '1',
        default_tax_rate: settings.default_tax_rate || '0',

        // General
        store_name: settings.store_name || '',
        store_address: settings.store_address || '',
        store_phone: settings.store_phone || '',

        // Security
        enable_passcode: settings.enable_passcode === '1',
        admin_passcode: settings.admin_passcode || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Transform back to the expected backend format if needed
        // The backend likely expects a 'settings' array/object based on previous code:
        // router.post(route('store.settings.update', { store_slug: store.slug }), { settings: formattedSettings } ...

        const formattedSettings = {
            pos_auto_fill_cash: data.pos_auto_fill_cash ? '1' : '0',
            senior_mode: data.senior_mode ? '1' : '0',
            fbr_integration: data.fbr_integration ? '1' : '0',
            show_margin_percentage: data.show_margin_percentage ? '1' : '0',
            stop_sale_negative_stock: data.stop_sale_negative_stock ? '1' : '0',
            enable_passcode: data.enable_passcode ? '1' : '0',
            store_name: data.store_name,
            store_address: data.store_address,
            store_phone: data.store_phone,
            default_tax_rate: data.default_tax_rate,
            admin_passcode: data.admin_passcode
        };

        router.post(route("store.settings.update", {
            store_slug: store.slug
        }), { settings: formattedSettings }, {
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    };





    const renderSection = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Store Name</label>
                                <input
                                    type="text"
                                    value={data.store_name}
                                    onChange={(e) => setData('store_name', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="My Store"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Store Phone</label>
                                <input
                                    type="text"
                                    value={data.store_phone}
                                    onChange={(e) => setData('store_phone', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="+92 300 1234567"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Store Address</label>
                                <textarea
                                    value={data.store_address}
                                    onChange={(e) => setData('store_address', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    rows={3}
                                    placeholder="Full store address"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Default Tax Rate (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.default_tax_rate}
                                        onChange={(e) => setData('default_tax_rate', e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'pos':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                            <SectionHeader title="Sales Configuration" description="Customize your point of sale experience" />
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                <Toggle
                                    enabled={data.pos_auto_fill_cash}
                                    onChange={v => setData('pos_auto_fill_cash', v)}
                                    label="Auto-Fill Cash Received"
                                    description="Automatically populate the 'Cash Received' field with the total amount"
                                />
                                <Toggle
                                    enabled={data.senior_mode}
                                    onChange={v => setData('senior_mode', v)}
                                    label="Senior Mode (Accessibility)"
                                    description="Enable larger fonts and high-contrast UI for easier reading"
                                />
                                <Toggle
                                    enabled={data.fbr_integration}
                                    onChange={v => setData('fbr_integration', v)}
                                    label="FBR Integration"
                                    description="Automatically report sales to FBR and print QR codes"
                                />
                                <Toggle
                                    enabled={data.show_margin_percentage}
                                    onChange={v => setData('show_margin_percentage', v)}
                                    label="Show Margin Percentage"
                                    description="Display profit margin in sales overview"
                                />
                                    <Toggle
                                        enabled={data.stop_sale_negative_stock === '0' || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0}
                                        onChange={v => setData('stop_sale_negative_stock', !v)}
                                        label="Allow Negative Stock (Overselling)"
                                        description="Warning: Allows selling items even if inventory is 0"
                                        variant="danger"
                                    />
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                            <SectionHeader title="Access Control" description="Manage login security" />

                            <div className="mb-6">
                                <Toggle
                                    enabled={data.enable_passcode}
                                    onChange={v => setData('enable_passcode', v)}
                                    label="Enable Passcode Login"
                                    description="Allow users to log in using a 4-6 digit keypad PIN"
                                />
                            </div>

                            {data.enable_passcode && (
                                <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Global Admin Passcode</label>
                                    <div className="relative max-w-xs">
                                        <input
                                            type="text"
                                            maxLength="6"
                                            value={data.admin_passcode}
                                            onChange={(e) => setData('admin_passcode', e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-500 rounded-xl text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Enter PIN"
                                        />
                                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>
                                    <p className="mt-3 text-xs text-slate-500">
                                        This "Master Passcode" logs you in as Platform Owner.
                                        <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-medium">Tip: Individual users can set personal passcodes in their Profile.</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <OneGlanceLayout mode="admin" title="Settings" activeMenu="Store Settings">
            <Head title="Settings" />

            <div className="h-full flex gap-6 overflow-hidden">
                {/* Sidebar - Midnight Nebula Styled - Collapsible */}
                <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300`}>
                    {/* Nebula Background Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" />

                    {/* Header with Collapse Toggle */}
                    <div className={`${sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'} border-b border-slate-800/50 mb-3 relative z-20`}>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform shrink-0"
                            >
                                <Settings size={20} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            {!sidebarCollapsed && (
                                <div className="min-w-0">
                                    <h2 className="text-lg font-black text-white tracking-tight">Settings</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400">Shop Config</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1 relative z-10 pb-20">
                        {SETTINGS_CATEGORIES.map((category) => {
                            const CatIcon = category.icon;
                            const isExpanded = expandedCategories.includes(category.id);
                            const categorySections = SETTINGS_SECTIONS.filter(s => category.sections.includes(s.id));

                            if (categorySections.length === 0) return null;

                            return (
                                <div key={category.id} className="space-y-1">
                                    {!sidebarCollapsed && (
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CatIcon size={12} />
                                                {category.name}
                                            </div>
                                            <ChevronRight size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}

                                    {(isExpanded || sidebarCollapsed) && (
                                        <div className="space-y-1">
                                            {categorySections.map((section) => {
                                                const Icon = section.icon;
                                                const isActive = activeSection === section.id;
                                                return (
                                                    <button
                                                        key={section.id}
                                                        type="button"
                                                        onClick={() => setActiveSection(section.id)}
                                                        title={sidebarCollapsed ? section.name : undefined}
                                                        className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'p-2 justify-center' : 'p-3'} rounded-xl text-left transition-all duration-200 group relative overflow-hidden border ${isActive
                                                            ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg shadow-indigo-500/20'
                                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                                                            }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-100" />
                                                        )}

                                                        <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? 'bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                                                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                                                        </div>

                                                        {!sidebarCollapsed && (
                                                            <div className="relative z-10 flex-1 min-w-0">
                                                                <p className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>{section.name}</p>
                                                                <p className={`text-[9px] leading-tight ${isActive ? 'text-indigo-200' : 'text-slate-500'} line-clamp-1`}>
                                                                    {section.description}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

                    <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Section</span>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.name}
                                        </h2>
                                    </div>
                                    <p className="text-base text-slate-500 font-medium">
                                        {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.description}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !isAdmin}
                                    className={`relative group px-10 py-4 rounded-2xl font-black text-sm transition-all duration-500 transform active:scale-95 overflow-hidden shadow-2xl hover:shadow-indigo-500/40 ${!isAdmin ? 'opacity-50 grayscale' : ''}`}
                                >
                                    {/* Midnight Nebula Background for Button */}
                                    <div className="absolute inset-0 bg-slate-900 z-0">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
                                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>
                                    </div>

                                    <div className="relative z-10 flex items-center gap-3 text-white">
                                        {saved ? (
                                            <>
                                                <Check size={20} strokeWidth={3} className="text-emerald-400" />
                                                <span>Changes Saved</span>
                                            </>
                                        ) : processing ? (
                                            <>
                                                <RefreshCw size={20} className="animate-spin text-indigo-300" />
                                                <span>Syncing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} className="group-hover:scale-110 transition-transform" />
                                                <span>{isAdmin ? 'Save Changes' : 'Viewing Only'}</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                {renderSection()}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </OneGlanceLayout>
    );
}
