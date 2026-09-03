import { usePage } from '@inertiajs/react';
import React from 'react';
import { Sparkles, Check, AlertTriangle, Globe } from 'lucide-react';

export default function AiSettingsSection({ data, setData, handleVerifyKey, verifyingKey, verificationResult }) {
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
 {/* Compact Banner */}
 <div className="p-6 bg-gradient-brand rounded-xl shadow-xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

 <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
 <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0">
 <Sparkles size={32} />
 </div>
 <div className="flex-1 text-center md:text-left">
 <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Artificial Intelligence</h3>
 <p className="text-brand-100/90 leading-snug">
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
 className={`cursor-pointer group relative p-6 rounded-xl border-[3px] transition-all duration-slow overflow-hidden ${data.ai_provider === 'gemini' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 shadow-xl scale-[1.01]' : 'border-line bg-surface hover:border-brand-200 dark:hover:border-line-strong opacity-80 hover:opacity-100'}`}
 >
 {data.ai_provider === 'gemini' && <div className="absolute top-5 right-5 bg-brand-600 text-white text-2xs font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg ">Active</div>}
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg ">
 <Sparkles size={20} />
 </div>
 <div>
 <h4 className="text-lg font-bold text-ink leading-tight">Google Gemini</h4>
 <span className="inline-block mt-1 text-2xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Free Tier Available</span>
 </div>
 </div>
 <p className="text-sm text-ink-muted font-medium leading-relaxed mb-6">
 A fast and powerful option from Google. Includes a generous free tier for daily analytics.
 </p>

 <div className={`space-y-4 transition-all duration-slow ${data.ai_provider === 'gemini' ? 'opacity-100' : 'opacity-50 pointer-events-none blur-[1px]'}`}>
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-ink-muted ml-1">Gemini API Key</label>
 <div className="relative">
 <input
 type="password"
 value={data.ai_provider === 'gemini' ? data.openai_api_key : ''}
 onChange={e => setData('openai_api_key', e.target.value)}
 className="w-full pl-4 pr-24 py-3 bg-white dark:bg-black/20 border border-line rounded-xl text-sm font-mono focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
 placeholder="Paste your AIza... key here"
 autoComplete="off"
 />
 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); handleVerifyKey(); }}
 disabled={verifyingKey || data.ai_provider !== 'gemini' || !data.openai_api_key}
 className="px-3 py-1.5 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900/40 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
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
 <div className="bg-white/80 dark:bg-app p-4 rounded-xl border border-brand-100 dark:border-brand-500/10">
 <p className="text-xs font-bold text-brand-900 dark:text-brand-300 mb-2 flex items-center gap-1.5">
 <span className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-2xs">?</span>
 How to get Free Key:
 </p>
 <ol className="text-2xs text-ink-secondary space-y-1.5 list-decimal ml-3 marker:font-bold marker:text-brand-500">
 <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-brand-600 font-bold underline hover:text-brand-700">Google AI Studio</a>.</li>
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
 className={`cursor-pointer group relative p-6 rounded-xl border-[3px] transition-all duration-slow ${data.ai_provider === 'openai' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-xl scale-[1.01]' : 'border-line bg-surface hover:border-emerald-200 dark:hover:border-line-strong opacity-80 hover:opacity-100'}`}
 >
 {data.ai_provider === 'openai' && <div className="absolute top-5 right-5 bg-emerald-600 text-white text-2xs font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg ">Active</div>}
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg ">
 <Globe size={20} />
 </div>
 <div>
 <h4 className="text-lg font-bold text-ink leading-tight">OpenAI GPT-4</h4>
 <span className="inline-block mt-1 text-2xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Paid Subscription</span>
 </div>
 </div>
 <p className="text-sm text-ink-muted font-medium leading-relaxed mb-6">
 Industry leader in reasoning. Requires a paid API account.
 </p>

 <div className={`space-y-4 transition-all duration-slow ${data.ai_provider === 'openai' ? 'opacity-100' : 'opacity-50 pointer-events-none blur-[1px]'}`}>
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-ink-muted ml-1">OpenAI API Key</label>
 <div className="relative">
 <input
 type="password"
 value={data.ai_provider === 'openai' ? data.openai_api_key : ''}
 onChange={e => setData('openai_api_key', e.target.value)}
 className="w-full pl-4 pr-24 py-3 bg-white dark:bg-black/20 border border-line rounded-xl text-sm font-mono focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
 placeholder="sk-proj-..."
 autoComplete="off"
 />
 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); handleVerifyKey(); }}
 disabled={verifyingKey || data.ai_provider !== 'openai' || !data.openai_api_key}
 className="px-3 py-1.5 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900/40 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
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
 <label className="text-xs font-bold uppercase tracking-wider text-ink-muted ml-1">Model Selection</label>
 <select
 value={data.ai_model}
 onChange={e => setData('ai_model', e.target.value)}
 onClick={(e) => e.stopPropagation()}
 className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-line rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
 >
 <option value="gpt-4o">GPT-4o (Best Quality)</option>
 <option value="gpt-4-turbo">GPT-4 Turbo</option>
 <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
 </select>
 </div>
 </div>
 </div>
 </div>

 {/* Data Privacy & Opt-Out Settings */}
 <div className="p-6 bg-surface rounded-xl border border-line shadow-sm space-y-4">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
 <Globe size={20} />
 </div>
 <div>
 <h4 className="text-base font-bold text-ink">Data Privacy & Community Intelligence</h4>
 <p className="text-xs text-ink-muted">Control data sharing and AI accuracy improvement settings</p>
 </div>
 </div>

 <div className="space-y-4 pt-2 border-t border-line">
 <div className="flex items-center justify-between py-2">
 <div>
 <span className="text-sm font-bold text-ink block">Opt out of Shared Product Catalog</span>
 <span className="text-xs text-ink-muted">Do not contribute anonymized SKU names/barcodes to global catalog matching</span>
 </div>
 <input
 type="checkbox"
 checked={!!data.shared_catalog_opt_out}
 onChange={(e) => {
 const checked = e.target.checked;
 setData('shared_catalog_opt_out', checked);
 const { router } = require('@inertiajs/react');
 router.post(route('store.settings.data-privacy.update'), {
 shared_catalog_opt_out: checked,
 ai_accuracy_opt_in: !!data.ai_accuracy_opt_in
 }, { preserveScroll: true });
 }}
 className="w-5 h-5 text-brand-600 rounded border-line focus:ring-brand-500 cursor-pointer"
 />
 </div>

 <div className="flex items-center justify-between py-2 border-t border-line">
 <div>
 <span className="text-sm font-bold text-ink block">Opt in to AI Accuracy Learning</span>
 <span className="text-xs text-ink-muted">Allow anonymized receipt extraction corrections to train model prompts</span>
 </div>
 <input
 type="checkbox"
 checked={!!data.ai_accuracy_opt_in}
 onChange={(e) => {
 const checked = e.target.checked;
 setData('ai_accuracy_opt_in', checked);
 const { router } = require('@inertiajs/react');
 router.post(route('store.settings.data-privacy.update'), {
 shared_catalog_opt_out: !!data.shared_catalog_opt_out,
 ai_accuracy_opt_in: checked
 }, { preserveScroll: true });
 }}
 className="w-5 h-5 text-brand-600 rounded border-line focus:ring-brand-500 cursor-pointer"
 />
 </div>
 </div>
 </div>
 </div>
 );
}
