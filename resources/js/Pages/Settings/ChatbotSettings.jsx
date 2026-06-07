import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Settings, Key, Eye, EyeOff, Save, Check, RefreshCw, AlertCircle, FileSpreadsheet, Cpu, Coins, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import SectionHeader from '@/Components/SectionHeader';
import axios from 'axios';

export default function ChatbotSettings({ settings, context, usageStats }) {
    const { store } = usePage().props;
    const isPlatform = context === 'platform' || !store;
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showKey, setShowKey] = useState(false);

    const formatCost = (cost) => {
        if (!cost || cost === 0) return '$0.00';
        if (cost < 0.01) return `$${Number(cost).toFixed(6)}`;
        return `$${Number(cost).toFixed(2)}`;
    };

    const { data, setData, processing } = useForm({
        chatbot_api_key: settings.chatbot_api_key || '',
        chatbot_custom_rules: settings.chatbot_custom_rules || '',
    });

    const submitRoute = isPlatform
        ? route('platform.chatbot.settings.update')
        : route('store.admin.chatbot.settings.update', { store_slug: store?.slug });

    const testRoute = isPlatform
        ? route('platform.ai.test')
        : route('store.admin.chatbot.ai.test', { store_slug: store?.slug });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(submitRoute, data, {
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    };

    const handleTestConnection = async () => {
        if (!data.chatbot_api_key) {
            setTestResult({ success: false, message: 'Please enter an API key first.' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const response = await axios.post(testRoute, {
                api_key: data.chatbot_api_key,
                provider: 'gemini',
                model: 'gemini-2.5-flash'
            });

            if (response.data.success) {
                setTestResult({ success: true, message: 'Connection verified successfully!' });
            } else {
                setTestResult({ success: false, message: response.data.message || 'Verification failed.' });
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to verify key. Please check your credentials.';
            setTestResult({ success: false, message: errMsg });
        } finally {
            setTesting(false);
        }
    };

    return (
        <OneGlanceLayout mode="admin" title="Chatbot Settings" activeMenu="Chatbot Settings">
            <Head title="Chatbot Settings" />

            <div className="h-full flex gap-6 overflow-hidden">
                {/* Clean settings form container */}
                <div className="flex-[2] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
                    {/* Midnight Nebula glow elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

                    <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                            {isPlatform ? 'VenQore Support Bot' : 'Store Assistant Config'}
                                        </span>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                            Chatbot Settings
                                        </h2>
                                    </div>
                                    <p className="text-base text-slate-500 font-medium">
                                        {isPlatform
                                            ? "Configure Vena — VenQore's company-wide support assistant for platform visitors."
                                            : "Configure your store's AI assistant that talks to your customers."
                                        }
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="relative group px-10 py-4 rounded-2xl font-black text-sm transition-all duration-500 transform active:scale-95 overflow-hidden shadow-2xl hover:shadow-indigo-500/40"
                                >
                                    {/* Nebula Background for Button */}
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
                                                <span>Settings Saved</span>
                                            </>
                                        ) : processing ? (
                                            <>
                                                <RefreshCw size={20} className="animate-spin text-indigo-300" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} className="group-hover:scale-110 transition-transform" />
                                                <span>Save Settings</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-8">
                                {/* API Key Settings Box */}
                                <div className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 p-8 rounded-3xl">
                                    <SectionHeader 
                                        title="AI Integration" 
                                        description="Enter your API key to power the chatbot. We default to Google Gemini." 
                                    />
                                    
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Gemini API Key
                                                </label>
                                                {(data.chatbot_api_key && data.chatbot_api_key === settings.chatbot_api_key) && (
                                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm animate-in fade-in duration-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Connected
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type={showKey ? 'text' : 'password'}
                                                    value={data.chatbot_api_key}
                                                    onChange={(e) => setData('chatbot_api_key', e.target.value)}
                                                    className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200"
                                                    placeholder="AI API Key (Google Cloud Console)"
                                                />
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowKey(!showKey)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleTestConnection}
                                                disabled={testing}
                                                className="px-6 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-800 shadow"
                                            >
                                                {testing ? (
                                                    <RefreshCw size={14} className="animate-spin text-slate-300" />
                                                ) : (
                                                    <span>Test Key</span>
                                                )}
                                            </button>
                                        </div>

                                        {testResult && (
                                            <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200 ${
                                                testResult.success 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                                                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                                            }`}>
                                                {testResult.success ? (
                                                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                                ) : (
                                                    <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                                )}
                                                <span>{testResult.message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Prompts/Rules */}
                                <div className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 p-8 rounded-3xl">
                                    <SectionHeader 
                                        title="Chatbot Personalization Rules" 
                                        description={isPlatform
                                            ? "Write instructions for how Vena should represent VenQore and handle support queries."
                                            : "Write instructions, store policies, or specific information for your store's assistant to follow."
                                        }
                                    />
                                    
                                    <div className="mt-6 space-y-4">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Store Custom Rules & Context
                                        </label>
                                        <textarea
                                            value={data.chatbot_custom_rules}
                                            onChange={(e) => setData('chatbot_custom_rules', e.target.value)}
                                            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans"
                                            rows={8}
                                            placeholder="Example:&#10;- Our return window is 7 days with receipt.&#10;- We are located in Lahore and ship nationwide.&#10;- For wholesale inquiries, contact sales@mybusiness.com.&#10;- Never offer discount matches manually."
                                        />
                                        <p className="text-xs text-slate-400">
                                            These rules are injected directly into the AI's core logic. Be clear and specific.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Token Usage & Billing Dashboard Side Panel */}
                <div className="w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 flex flex-col overflow-hidden relative shrink-0">
                    {/* Midnight Nebula glow elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <Wallet size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Usage & Billing
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                                Cycle: {usageStats?.billing_cycle || 'Current Month'}
                            </p>
                        </div>

                        {/* Cost Highlight */}
                        <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-indigo-500/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Estimated Cost
                            </span>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 select-all">
                                {formatCost(usageStats?.estimated_cost)}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2">
                                Gemini Flash pay-as-you-go rate
                            </span>
                        </div>

                        {/* Token Breakdown Cards */}
                        <div className="space-y-4 mb-8 flex-1 overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                                Token Metrics
                            </h4>

                            {/* Input Tokens */}
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-2xl hover:scale-[1.02] transition-transform duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                        <ArrowUpRight size={16} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                                            Input Tokens
                                        </span>
                                        <span className="text-[10px] text-slate-400">Prompts & Context</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {usageStats?.input_tokens?.toLocaleString() || '0'}
                                </span>
                            </div>

                            {/* Output Tokens */}
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-2xl hover:scale-[1.02] transition-transform duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <ArrowDownLeft size={16} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                                            Output Tokens
                                        </span>
                                        <span className="text-[10px] text-slate-400">AI Responses</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {usageStats?.output_tokens?.toLocaleString() || '0'}
                                </span>
                            </div>

                            {/* Total Tokens */}
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-2xl hover:scale-[1.02] transition-transform duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <Cpu size={16} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                                            Total Tokens
                                        </span>
                                        <span className="text-[10px] text-slate-400">Total Volume</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {usageStats?.total_tokens?.toLocaleString() || '0'}
                                </span>
                            </div>
                        </div>

                        {/* Model Breakdown */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                                Models Active
                            </h4>
                            {usageStats?.models && Object.keys(usageStats.models).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(usageStats.models).map(([model, count]) => (
                                        <div key={model} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                                                <span className="text-[10px] truncate max-w-[180px]">{model}</span>
                                                <span className="text-[10px] text-slate-400">{count.toLocaleString()} tkn</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                                                    style={{ 
                                                        width: `${usageStats.total_tokens > 0 
                                                            ? Math.min(100, Math.round((count / usageStats.total_tokens) * 100)) 
                                                            : 0}%` 
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <Coins size={24} className="text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
                                    <span className="text-xs font-semibold">No usage logs found</span>
                                </div>
                            )}
                        </div>
                    </div>
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
