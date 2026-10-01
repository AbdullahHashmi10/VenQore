import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import React from 'react';
import { Sparkles, Check, AlertTriangle, Globe, Key, ShieldCheck } from 'lucide-react';
import { useTermText } from '@/lib/terms';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';

const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o (High Quality, Fast)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' }
];

export default function AiSettingsSection({ data, setData, handleVerifyKey, verifyingKey, verificationResult }) {
    const tt = useTermText();
    const { store } = usePage().props;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* Header Card */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-ink leading-tight">AI &amp; Natural Language Search</h3>
                        <p className="text-xs text-ink-muted">
                            Power conversational insights such as <span className="text-brand-600 dark:text-brand-400 font-medium">"How much sugar did we sell last week?"</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gemini Card */}
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
                    className={`cursor-pointer group relative p-6 rounded-2xl border transition-all duration-normal overflow-hidden ${
                        data.ai_provider === 'gemini'
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-900/10 shadow-sm ring-1 ring-brand-500/30'
                            : 'border-line bg-surface hover:border-brand-500/30'
                    }`}
                >
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-ink leading-tight">Google Gemini</h4>
                                <span className="inline-block mt-0.5 text-3xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Free Tier Available
                                </span>
                            </div>
                        </div>
                        {data.ai_provider === 'gemini' && (
                            <span className="px-2.5 py-1 bg-brand-600 text-white text-3xs font-bold rounded-full uppercase tracking-wider shadow-xs">
                                Selected
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed mb-5">
                        Fast and powerful multi-modal model from Google. Includes a generous free tier for daily sales analytics.
                    </p>

                    <div className={`space-y-4 transition-all duration-normal ${data.ai_provider === 'gemini' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="space-y-1.5">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Gemini API Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.ai_provider === 'gemini' ? data.openai_api_key : ''}
                                    onChange={e => setData('openai_api_key', e.target.value)}
                                    className="w-full pl-3.5 pr-24 py-2.5 bg-app border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="AIzaSy..."
                                    autoComplete="off"
                                />
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleVerifyKey(); }}
                                        disabled={verifyingKey || data.ai_provider !== 'gemini' || !data.openai_api_key}
                                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-2xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {verifyingKey ? 'Checking...' : 'Check Key'}
                                    </button>
                                </div>
                            </div>
                            {verificationResult && data.ai_provider === 'gemini' && (
                                <div className={`mt-2 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                                    verificationResult.type === 'success' 
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                }`}>
                                    {verificationResult.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                                    <span>{verificationResult.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted">
                            <p className="font-bold text-ink mb-1">Get Free Gemini API Key:</p>
                            <p>1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-600 font-bold underline">Google AI Studio</a></p>
                            <p>2. Create a project and copy the <code>AIza...</code> key into the box above.</p>
                        </div>
                    </div>
                </div>

                {/* OpenAI Card */}
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
                    className={`cursor-pointer group relative p-6 rounded-2xl border transition-all duration-normal overflow-hidden ${
                        data.ai_provider === 'openai'
                            ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-900/10 shadow-sm ring-1 ring-brand-500/30'
                            : 'border-line bg-surface hover:border-brand-500/30'
                    }`}
                >
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-ink leading-tight">OpenAI GPT-4</h4>
                                <span className="inline-block mt-0.5 text-3xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Paid Subscription
                                </span>
                            </div>
                        </div>
                        {data.ai_provider === 'openai' && (
                            <span className="px-2.5 py-1 bg-brand-600 text-white text-3xs font-bold rounded-full uppercase tracking-wider shadow-xs">
                                Selected
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed mb-5">
                        High accuracy reasoning model from OpenAI. Requires a paid billing account with OpenAI API tokens.
                    </p>

                    <div className={`space-y-4 transition-all duration-normal ${data.ai_provider === 'openai' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="space-y-1.5">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">OpenAI API Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.ai_provider === 'openai' ? data.openai_api_key : ''}
                                    onChange={e => setData('openai_api_key', e.target.value)}
                                    className="w-full pl-3.5 pr-24 py-2.5 bg-app border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="sk-proj-..."
                                    autoComplete="off"
                                />
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleVerifyKey(); }}
                                        disabled={verifyingKey || data.ai_provider !== 'openai' || !data.openai_api_key}
                                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-2xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {verifyingKey ? 'Checking...' : 'Check Key'}
                                    </button>
                                </div>
                            </div>
                            {verificationResult && data.ai_provider === 'openai' && (
                                <div className={`mt-2 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
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

            {/* Data Privacy & Community Intelligence */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4">
                <div className="flex items-center gap-3.5 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-ink">Data Privacy &amp; Community Intelligence</h4>
                        <p className="text-xs text-ink-muted">Control data sharing policies and AI learning opt-in</p>
                    </div>
                </div>

                <div className="divide-y divide-line pt-2">
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
    );
}
