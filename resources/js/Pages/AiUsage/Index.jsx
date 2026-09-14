import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    Sparkles, Zap, Shield, Clock, AlertTriangle, CheckCircle,
    ArrowUpRight, RefreshCw, Key, ShoppingCart, HelpCircle,
    FileText, Database, ChevronRight, Check, AlertCircle, Plus
} from 'lucide-react';

export default function AiUsageIndex({ recent_events = [], addon_catalogue = {}, free_scan_allowance = 10 }) {
    const { props } = usePage();
    const store = props.store;
    const planInfo = props.plan || {};
    const aiUsage = planInfo.usage?.ai || {};

    const [buyingTopup, setBuyingTopup] = useState(false);
    const [topupError, setTopupError] = useState(null);

    const isByok = aiUsage.status === 'byok';
    const isManaged = aiUsage.status === 'managed';
    const isNone = aiUsage.status === 'none';

    // Scans metering
    const pagesUsed = aiUsage.pages_used ?? 0;
    const pagesLimit = isNone ? free_scan_allowance : aiUsage.pages_limit;
    const isUnlimited = isByok || pagesLimit === -1;

    const usedRatio = (!isUnlimited && pagesLimit > 0) ? (pagesUsed / pagesLimit) : 0;
    const usedPercent = Math.min(100, Math.round(usedRatio * 100));

    // Warning state
    const warningState = isUnlimited ? 'ok' : (aiUsage.warning_state ?? (usedRatio >= 1 ? 'limit' : (usedRatio >= 0.8 ? 'warning' : 'ok')));

    // Queries metering
    const queriesUsed = aiUsage.queries_used ?? 0;
    const queriesLimit = aiUsage.queries_limit;
    const queriesRatio = (queriesLimit > 0) ? (queriesUsed / queriesLimit) : 0;
    const queriesPercent = Math.min(100, Math.round(queriesRatio * 100));

    // Colors according to Claude & V6 style
    const getBarColor = (state) => {
        if (state === 'limit') return 'bg-rose-500';
        if (state === 'warning') return 'bg-amber-500';
        return 'bg-[#0BAA8F]';
    };

    const getTextColor = (state) => {
        if (state === 'limit') return 'text-rose-400';
        if (state === 'warning') return 'text-amber-400';
        return 'text-[#0BAA8F]';
    };

    const handleBuyTopup = async () => {
        setBuyingTopup(true);
        setTopupError(null);

        try {
            const res = await window.axios.post(
                route('store.billing.checkout-addon', { store_slug: store?.slug || 'default' }),
                { addon_type: 'ai_topup' }
            );

            if (res.data?.url) {
                // If Lemon Squeezy overlay is loaded, open it, else redirect
                if (window.LemonSqueezy?.Url?.Open) {
                    window.LemonSqueezy.Url.Open(res.data.url);
                } else {
                    window.location.href = res.data.url;
                }
            } else {
                setTopupError('Unable to generate checkout session. Please try again.');
            }
        } catch (err) {
            setTopupError(err.response?.data?.error || 'Checkout initialization failed. Please contact support.');
        } finally {
            setBuyingTopup(false);
        }
    };

    return (
        <OneGlanceLayout title="AI Usage & Quota" activeMenu="AI Usage">
            <Head title="AI Usage & Metering — VenQore" />

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

                {/* ── Page Header ───────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-2">
                            <span>Account</span>
                            <span>/</span>
                            <span className="text-[#0BAA8F]">AI Usage</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Sparkles className="text-[#0BAA8F]" size={28} />
                            <span>AI Quota & Metering</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-white/5 border border-white/10 text-neutral-300">
                            Plan: {planInfo.slug || store?.plan || 'Solo'}
                        </span>
                        {aiUsage.resets_on && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0BAA8F]/10 border border-[#0BAA8F]/20 text-[#0BAA8F]">
                                <Clock size={12} />
                                <span>Resets on {aiUsage.resets_on}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Top-up Error Alert ────────────────────────────────────── */}
                {topupError && (
                    <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                        <AlertCircle size={18} className="shrink-0 text-rose-400" />
                        <span>{topupError}</span>
                    </div>
                )}

                {/* ── Primary Meter: Claude-style Usage Card ────────────────── */}
                <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 sm:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
                    {/* Background Subtle Radial Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0BAA8F]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">

                        {/* Meter Top Info */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>AI Scans (SmartCapture OCR)</span>
                                    {isUnlimited && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Unlimited
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Document, invoice, and bill extraction via SmartCapture OCR
                                </p>
                            </div>

                            {/* Numbers */}
                            <div className="text-right">
                                {isUnlimited ? (
                                    <div className="text-2xl font-bold font-mono text-[#0BAA8F]">∞ Unlimited</div>
                                ) : (
                                    <div className="text-2xl font-bold font-mono text-white tracking-tight">
                                        <span className={getTextColor(warningState)}>{pagesUsed}</span>
                                        <span className="text-neutral-500 font-normal"> / {pagesLimit} scans</span>
                                    </div>
                                )}
                                {!isUnlimited && (
                                    <div className="text-xs font-mono font-medium text-neutral-400 mt-0.5">
                                        {usedPercent}% capacity used
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Claude-style Horizontal Bar */}
                        {!isUnlimited ? (
                            <div className="space-y-2">
                                <div className="h-3.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(warningState)}`}
                                        style={{ width: `${Math.max(2, usedPercent)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                                    <span>0</span>
                                    {warningState === 'limit' && (
                                        <span className="text-rose-400 font-bold flex items-center gap-1">
                                            <AlertTriangle size={12} /> Limit reached. Feature locked until reset or top-up.
                                        </span>
                                    )}
                                    {warningState === 'warning' && (
                                        <span className="text-amber-400 font-medium flex items-center gap-1">
                                            <AlertCircle size={12} /> Near limit (over 80% used)
                                        </span>
                                    )}
                                    <span>{pagesLimit} scans</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Key className="text-emerald-400 shrink-0" size={20} />
                                    <div>
                                        <div className="text-sm font-bold text-emerald-300">
                                            {isByok ? 'Bring-Your-Own-Key (BYOK) Active' : 'Special Platform Unlimited Grant'}
                                        </div>
                                        <div className="text-xs text-emerald-400/80 mt-0.5">
                                            All scans and queries run directly on your own API keys without platform metering limits.
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={route('store.admin.settings', { store_slug: store?.slug || 'default' })}
                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold transition-all shrink-0"
                                >
                                    Manage Keys
                                </Link>
                            </div>
                        )}

                        {/* Free Tier Notice */}
                        {isNone && !isByok && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-4">
                                <div>
                                    <strong>Free Trial Allowance:</strong> You are currently on the free {free_scan_allowance}-scan preview.
                                    Upgrade your plan or purchase an add-on to unlock ongoing monthly allowances.
                                </div>
                                <button
                                    onClick={handleBuyTopup}
                                    disabled={buyingTopup}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all shrink-0"
                                >
                                    Unlock Credits
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Secondary Meters: Queries & Add-on Top-ups ────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Secondary Meter: AI Assistant Queries */}
                    <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Zap className="text-sky-400" size={18} />
                                <h3 className="font-bold text-white text-base">Assistant & OmniSearch Queries</h3>
                            </div>
                            <span className="text-xs font-mono text-neutral-400">
                                {queriesUsed} / {queriesLimit ?? '∞'}
                            </span>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed">
                            Natural language voice & search queries for orders, customers, and reports across your store.
                        </p>

                        {queriesLimit && queriesLimit > 0 ? (
                            <div className="space-y-1.5 pt-2">
                                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full bg-sky-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(2, queriesPercent)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                                    <span>{queriesPercent}% used</span>
                                    <span>{queriesLimit - queriesUsed} remaining</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300 font-medium">
                                Unlimited queries included on your current tier.
                            </div>
                        )}
                    </div>

                    {/* Top-up Add-on Card */}
                    <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <ShoppingCart className="text-[#0BAA8F]" size={18} />
                                    <h3 className="font-bold text-white text-base">Instant AI Top-up</h3>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#0BAA8F] bg-[#0BAA8F]/10 border border-[#0BAA8F]/20 px-2.5 py-0.5 rounded-full">
                                    $10 / 1,000 Credits
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Need extra capacity before your next reset? Add 1,000 AI scan credits immediately to your store. Credits never expire.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleBuyTopup}
                                disabled={buyingTopup}
                                className="flex-1 py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Plus size={14} />
                                {buyingTopup ? 'Opening Checkout…' : 'Buy 1,000 AI Credits ($10)'}
                            </button>
                            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-neutral-400 shrink-0">
                                Secure Checkout
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Feature Cards: AI Structural Rebuilds & Descriptions ────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* AI Structural Rebuilds */}
                    <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm flex items-center justify-between opacity-80">
                        <div>
                            <div className="flex items-center gap-2">
                                <Database size={16} className="text-purple-400" />
                                <h4 className="text-sm font-bold text-white">AI Structural Rebuilds</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    Coming Soon
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                Automated database schema repair, duplicate cleanup, and catalogue deep-reconstruction.
                            </p>
                        </div>
                    </div>

                    {/* AI Product Descriptions */}
                    <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-[#0BAA8F]" />
                                <h4 className="text-sm font-bold text-white">AI Product Descriptions</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    Included
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                One-click SEO and marketing copy generation directly from the product management screen.
                            </p>
                        </div>
                    </div>

                </div>

                {/* ── Recent Activity Audit Table ───────────────────────────── */}
                <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                        <div className="flex items-center gap-2.5">
                            <Clock size={16} className="text-neutral-400" />
                            <h3 className="font-bold text-white text-base">Recent AI Activity Log</h3>
                        </div>
                        <span className="text-xs font-mono text-neutral-500">
                            Last {recent_events.length} events
                        </span>
                    </div>

                    {recent_events.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <Sparkles size={28} className="mx-auto text-neutral-600" />
                            <p className="text-sm font-medium text-neutral-400">No AI operations recorded yet for this store.</p>
                            <p className="text-xs text-neutral-500">When you scan documents or use AI assistant features, your activity will be listed here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider text-left">
                                        <th className="py-2.5 px-3">Feature</th>
                                        <th className="py-2.5 px-3">Model</th>
                                        <th className="py-2.5 px-3">Units</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {recent_events.map((ev) => (
                                        <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-3 font-semibold text-white capitalize">
                                                {ev.feature === 'scan' ? 'SmartCapture OCR' : ev.feature}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-400 text-[11px]">
                                                {ev.model || 'gemini-2.0-flash'}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-300">
                                                {ev.pages ? `${ev.pages} page${ev.pages > 1 ? 's' : ''}` : `${ev.prompt_tokens + ev.output_tokens} tok`}
                                            </td>
                                            <td className="py-3 px-3">
                                                {ev.success ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                                        <Check size={12} /> Success
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                                                        <AlertTriangle size={12} /> Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono text-neutral-500 text-[11px]">
                                                {new Date(ev.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </OneGlanceLayout>
    );
}
