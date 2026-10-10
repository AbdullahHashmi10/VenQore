import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { Sparkles, Check, AlertTriangle, Globe, Shield, Wifi, ShoppingBag, ExternalLink, ShieldCheck } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';
import { useTermText } from '@/lib/terms';

const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o (High Quality, Fast)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' }
];

export default function FeaturesConnectionsSection({
    data,
    setData,
    handleVerifyKey,
    verifyingKey,
    verificationResult
}) {
    const tt = useTermText();
    const { store, woocommerce_enabled } = usePage().props;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* System Builder / Modular App Banner */}
            <div className="p-6 bg-gradient-to-r from-brand-600/10 via-brand-500/5 to-transparent bg-surface rounded-2xl border border-brand-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <ShoppingBag size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-ink leading-tight">Modular System Builder</h3>
                            <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-3xs font-bold uppercase tracking-wider rounded-full">
                                App Store
                            </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                            Activate optional vertical capabilities like Pharmacy, Restaurant, Manufacturing, Multi-Store, and Repairs.
                        </p>
                    </div>
                </div>
                <a
                    href={`/${store?.slug || 'store'}/system-builder`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                >
                    <span>Launch System Builder</span>
                    <ExternalLink size={14} />
                </a>
            </div>

            {/* AI & Natural Language Search */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-6">
                <div className="flex items-center gap-3.5 pb-4 border-b border-line">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-ink leading-tight">AI &amp; Natural Language Search</h4>
                        <p className="text-xs text-ink-muted">
                            Power conversational insights such as <span className="text-brand-600 dark:text-brand-400 font-medium">"How much sugar did we sell last week?"</span>
                        </p>
                    </div>
                </div>

                {/* AI Provider Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Google Gemini */}
                    <div
                        onClick={() => {
                            if (data.ai_provider !== 'gemini') {
                                setData(d => ({
                                    ...d,
                                    ai_provider: 'gemini',
                                    ai_model: 'gemini-2.5-flash',
                                    openai_api_key: ''
                                }));
                            }
                        }}
                        className={`cursor-pointer group relative p-5 rounded-2xl border transition-all duration-normal overflow-hidden ${
                            data.ai_provider === 'gemini'
                                ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-900/10 shadow-sm ring-1 ring-brand-500/30'
                                : 'border-line bg-app/50 hover:border-brand-500/30'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-ink leading-tight">Google Gemini</h5>
                                    <span className="inline-block mt-0.5 text-3xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Free Tier Available
                                    </span>
                                </div>
                            </div>
                            {data.ai_provider === 'gemini' && (
                                <span className="px-2 py-0.5 bg-brand-600 text-white text-3xs font-bold rounded-full uppercase tracking-wider">
                                    Selected
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-ink-muted leading-relaxed mb-4">
                            Fast and multimodal model from Google. Generous free tier for store queries and catalog intelligence.
                        </p>

                        <div className={`space-y-3 transition-all duration-normal ${data.ai_provider === 'gemini' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Gemini API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={data.ai_provider === 'gemini' ? data.openai_api_key : ''}
                                        onChange={e => setData('openai_api_key', e.target.value)}
                                        className="w-full pl-3.5 pr-24 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="AIzaSy..."
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleVerifyKey?.(); }}
                                            disabled={verifyingKey || data.ai_provider !== 'gemini' || !data.openai_api_key}
                                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-3xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            {verifyingKey ? 'Checking...' : 'Check Key'}
                                        </button>
                                    </div>
                                </div>
                                {verificationResult && data.ai_provider === 'gemini' && (
                                    <div className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                                        verificationResult.type === 'success' 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    }`}>
                                        {verificationResult.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                                        <span>{verificationResult.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* OpenAI GPT-4 */}
                    <div
                        onClick={() => {
                            if (data.ai_provider !== 'openai') {
                                setData(d => ({
                                    ...d,
                                    ai_provider: 'openai',
                                    ai_model: 'gpt-4o',
                                    openai_api_key: ''
                                }));
                            }
                        }}
                        className={`cursor-pointer group relative p-5 rounded-2xl border transition-all duration-normal overflow-hidden ${
                            data.ai_provider === 'openai'
                                ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-900/10 shadow-sm ring-1 ring-brand-500/30'
                                : 'border-line bg-app/50 hover:border-brand-500/30'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-ink leading-tight">OpenAI GPT-4</h5>
                                    <span className="inline-block mt-0.5 text-3xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Paid Account
                                    </span>
                                </div>
                            </div>
                            {data.ai_provider === 'openai' && (
                                <span className="px-2 py-0.5 bg-brand-600 text-white text-3xs font-bold rounded-full uppercase tracking-wider">
                                    Selected
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-ink-muted leading-relaxed mb-4">
                            High accuracy reasoning model from OpenAI. Requires a paid OpenAI billing key.
                        </p>

                        <div className={`space-y-3 transition-all duration-normal ${data.ai_provider === 'openai' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">OpenAI API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={data.ai_provider === 'openai' ? data.openai_api_key : ''}
                                        onChange={e => setData('openai_api_key', e.target.value)}
                                        className="w-full pl-3.5 pr-24 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="sk-proj-..."
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleVerifyKey?.(); }}
                                            disabled={verifyingKey || data.ai_provider !== 'openai' || !data.openai_api_key}
                                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-3xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            {verifyingKey ? 'Checking...' : 'Check Key'}
                                        </button>
                                    </div>
                                </div>
                                {verificationResult && data.ai_provider === 'openai' && (
                                    <div className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                                        verificationResult.type === 'success' 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    }`}>
                                        {verificationResult.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                                        <span>{verificationResult.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Model Selection</label>
                                <PremiumSelect
                                    options={OPENAI_MODELS}
                                    value={data.ai_model || 'gpt-4o'}
                                    onChange={(val) => setData('ai_model', val)}
                                    searchable={false}
                                    placeholder="Select OpenAI Model"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Privacy & Opt-In */}
                <div className="p-4 bg-app rounded-xl border border-line space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink">
                        <ShieldCheck size={16} className="text-brand-600" />
                        <span>Data Privacy &amp; Intelligence Sharing</span>
                    </div>
                    <div className="divide-y divide-line">
                        <Toggle
                            label={tt('Opt out of Shared Product Catalog')}
                            description="Do not contribute anonymized SKU names/barcodes to global catalog matching"
                            enabled={Boolean(data.shared_catalog_opt_out)}
                            onChange={(checked) => {
                                setData('shared_catalog_opt_out', checked);
                                router.post(route('store.settings.data-privacy.update', { store_slug: store?.slug }), {
                                    shared_catalog_opt_out: checked,
                                    ai_accuracy_opt_in: Boolean(data.ai_accuracy_opt_in)
                                }, { preserveScroll: true });
                            }}
                        />

                        <Toggle
                            label="Opt in to AI Accuracy Learning"
                            description="Allow anonymized receipt extraction corrections to train model prompts"
                            enabled={Boolean(data.ai_accuracy_opt_in)}
                            onChange={(checked) => {
                                setData('ai_accuracy_opt_in', checked);
                                router.post(route('store.settings.data-privacy.update', { store_slug: store?.slug }), {
                                    shared_catalog_opt_out: Boolean(data.shared_catalog_opt_out),
                                    ai_accuracy_opt_in: checked
                                }, { preserveScroll: true });
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* FBR POS Fiscalization */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4">
                <div className="flex items-center gap-3.5 pb-4 border-b border-line">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-ink leading-tight">FBR POS Fiscalization</h4>
                        <p className="text-xs text-ink-muted">Direct real-time fiscal invoice integration with Pakistan Federal Board of Revenue</p>
                    </div>
                </div>

                <Toggle
                    label="Enable FBR Fiscalization"
                    description="Automatically sign and broadcast sales invoices to the FBR API"
                    enabled={Boolean(data.fbr_integration)}
                    onChange={v => setData('fbr_integration', v)}
                />

                {data.fbr_integration && (
                    <div className="pt-3 border-t border-line space-y-4 animate-in fade-in slide-in-from-top-2 duration-normal">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">FBR POS ID</label>
                                <input
                                    type="text"
                                    value={data.fbr_pos_id || ''}
                                    onChange={e => setData('fbr_pos_id', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-ink"
                                    placeholder="e.g. 100234"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">FBR USIN</label>
                                <input
                                    type="text"
                                    value={data.fbr_usin || ''}
                                    onChange={e => setData('fbr_usin', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-ink"
                                    placeholder="e.g. USIN-994821"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* External Integrations (Stripe & WooCommerce) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stripe Card */}
                <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs opacity-80 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                                <Wifi size={20} />
                            </div>
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-3xs font-bold uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30">
                                Upcoming
                            </span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink">Stripe Terminal &amp; Payments</h4>
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                                Process in-person contactless NFC cards and online checkout payments through Stripe.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-line">
                        <Toggle enabled={false} disabled={true} upcoming={true} onChange={() => {}} label="Stripe Card Reader" />
                    </div>
                </div>

                {/* Built-in Online Store */}
                <div className="p-6 bg-surface rounded-2xl border border-brand-200 shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                                <ShoppingBag size={20} />
                            </div>
                            <span className="px-2 py-0.5 text-3xs font-bold uppercase tracking-wider rounded border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Free</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink">Online ordering (free)</h4>
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                                Your own shop page with pickup, delivery, offers and a QR code. Orders use your existing stock and prices.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-line">
                        <a href={`/s/${store?.slug || 'store'}/online-store`} className="text-xs font-bold text-brand-600 hover:text-brand-500 inline-flex items-center gap-1">
                            <span>Set up your online store</span>
                            <ExternalLink size={12} />
                        </a>
                    </div>
                </div>

                {/* WooCommerce Card */}
                <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                <Globe size={20} />
                            </div>
                            <span className={`px-2 py-0.5 text-3xs font-bold uppercase tracking-wider rounded border ${
                                woocommerce_enabled
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-app text-ink-muted border-line'
                            }`}>
                                {woocommerce_enabled ? 'Connected' : 'Available'}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink">WooCommerce Online Store</h4>
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                                Bi-directional product stock, order sync, and customer matching with your WordPress eCommerce store.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-line">
                        <a
                            href={`/${store?.slug || 'store'}/system-builder`}
                            className="text-xs font-bold text-brand-600 hover:text-brand-500 inline-flex items-center gap-1"
                        >
                            <span>Configure in System Builder</span>
                            <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
