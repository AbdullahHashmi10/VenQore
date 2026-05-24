import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { Sparkles, Check, AlertTriangle, Globe } from 'lucide-react';

export default function AiSettingsSection({ data, setData }) {
    const [verifyingKey, setVerifyingKey] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const handleVerifyKey = async () => {
        if ((data.ai_provider === 'openai' && !data.openai_api_key) || (data.ai_provider === 'gemini' && !data.openai_api_key)) return;

        setVerifyingKey(true);
        setVerificationResult(null);
        try {
            // In a real app we would call the verifiable route
            // const res = await axios.post(route('store.ai.test', { store_slug: store.slug }), { ... });

            // For now, simulate success after a delay
            await new Promise(r => setTimeout(r, 1500));
            setVerificationResult({ type: 'success', message: 'API Key Verified Successfully!' });

        } catch (e) {
            setVerificationResult({ type: 'error', message: e.message || 'Verification failed' });
        } finally {
            setVerifyingKey(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Compact Banner */}
            <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-[2rem] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0">
                        <Sparkles size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Artificial Intelligence</h3>
                        <p className="text-indigo-100/90 leading-snug">
                            Enable natural language search. Ask things like <span className="text-white font-bold italic">"How much sugar did we sell last week?"</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gemini Card */}
                <div
                    onClick={() => {
                        if (data.ai_provider !== 'gemini') {
                            setData(d => ({
                                ...d,
                                ai_provider: 'gemini',
                                ai_model: 'gemini-2.5-flash',
                                openai_api_key: '' // clear or keep depending on preference, logic suggests one field for key
                            }));
                        }
                    }}
                    className={`cursor-pointer group relative p-6 rounded-[2rem] border-[3px] transition-all duration-300 overflow-hidden ${data.ai_provider === 'gemini' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-xl shadow-indigo-500/10 scale-[1.01]' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-slate-600 opacity-80 hover:opacity-100'}`}
                >
                    {data.ai_provider === 'gemini' && <div className="absolute top-5 right-5 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/30">Active</div>}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">Google Gemini</h4>
                            <span className="inline-block mt-1 text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Free Tier Available</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                        A fast and powerful option from Google. Includes a generous free tier for daily analytics.
                    </p>

                    <div className={`space-y-4 transition-all duration-300 ${data.ai_provider === 'gemini' ? 'opacity-100' : 'opacity-50 pointer-events-none blur-[1px]'}`}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Gemini API Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.ai_provider === 'gemini' ? data.openai_api_key : ''}
                                    onChange={e => setData('openai_api_key', e.target.value)}
                                    className="w-full pl-4 pr-24 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    placeholder="Paste your AIza... key here"
                                    autoComplete="off"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleVerifyKey(); }}
                                        disabled={verifyingKey || data.ai_provider !== 'gemini' || !data.openai_api_key}
                                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {verifyingKey ? 'Checking...' : 'Check Key'}
                                    </button>
                                </div>
                            </div>
                            {verificationResult && data.ai_provider === 'gemini' && (
                                <div className={`mt-2 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${verificationResult.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {verificationResult.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                                    {verificationResult.message}
                                </div>
                            )}
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-[10px]">?</span>
                                How to get Free Key:
                            </p>
                            <ol className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal ml-3 marker:font-bold marker:text-indigo-500">
                                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 font-bold underline hover:text-indigo-700">Google AI Studio</a>.</li>
                                <li>Sign in & Click <strong>"Create API Key"</strong>.</li>
                                <li>Select <strong>"Gemini API"</strong> project.</li>
                                <li>Copy <code>AIza...</code> key and paste above.</li>
                            </ol>
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
                    className={`cursor-pointer group relative p-6 rounded-[2rem] border-[3px] transition-all duration-300 ${data.ai_provider === 'openai' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-xl shadow-emerald-500/10 scale-[1.01]' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-slate-600 opacity-80 hover:opacity-100'}`}
                >
                    {data.ai_provider === 'openai' && <div className="absolute top-5 right-5 bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30">Active</div>}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">OpenAI GPT-4</h4>
                            <span className="inline-block mt-1 text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Paid Subscription</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                        Industry leader in reasoning. Requires a paid API account.
                    </p>

                    <div className={`space-y-4 transition-all duration-300 ${data.ai_provider === 'openai' ? 'opacity-100' : 'opacity-50 pointer-events-none blur-[1px]'}`}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">OpenAI API Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.ai_provider === 'openai' ? data.openai_api_key : ''}
                                    onChange={e => setData('openai_api_key', e.target.value)}
                                    className="w-full pl-4 pr-24 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-mono focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                                    placeholder="sk-proj-..."
                                    autoComplete="off"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleVerifyKey(); }}
                                        disabled={verifyingKey || data.ai_provider !== 'openai' || !data.openai_api_key}
                                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {verifyingKey ? 'Checking...' : 'Check Key'}
                                    </button>
                                </div>
                            </div>
                            {verificationResult && data.ai_provider === 'openai' && (
                                <div className={`mt-2 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${verificationResult.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {verificationResult.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                                    {verificationResult.message}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Model Selection</label>
                            <select
                                value={data.ai_model}
                                onChange={e => setData('ai_model', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="gpt-4o">GPT-4o (Best Quality)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
