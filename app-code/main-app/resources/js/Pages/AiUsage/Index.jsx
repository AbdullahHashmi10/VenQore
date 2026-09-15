import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Sparkles, Zap, Clock, AlertTriangle, Key, ShoppingCart,
    FileText, Database, Check, AlertCircle, Plus, ArrowUpRight
} from 'lucide-react';

export default function AiUsageIndex({ recent_events = [], addon_catalogue = {}, free_scan_allowance = 10 }) {
    const { props } = usePage();
    const store = props.store;
    const planInfo = props.plan || {};
    const aiUsage = planInfo.usage?.ai || {};

    const [buyingTopup, setBuyingTopup] = useState(false);
    const [topupError, setTopupError] = useState(null);

    const isByok = aiUsage.status === 'byok';
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

    // Descriptions balance
    const descriptionsBalance = aiUsage.descriptions_balance ?? 0;

    // Bar colors based on threshold
    const getBarColor = (state) => {
        if (state === 'limit') return 'bg-rose-500';
        if (state === 'warning') return 'bg-amber-500';
        return 'bg-[#0BAA8F]';
    };

    const getTextColor = (state) => {
        if (state === 'limit') return 'text-rose-500 dark:text-rose-400';
        if (state === 'warning') return 'text-amber-500 dark:text-amber-400';
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
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                            <span>Account Settings</span>
                            <span>/</span>
                            <span className="text-[#0BAA8F]">AI Quotas & Metering</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <Sparkles className="text-[#0BAA8F]" size={28} />
                            <span>AI Quota & Metering</span>
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
                            Track SmartCapture document scans, AI queries, and product copy generation included in your monthly store plan.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300">
                            Plan: {planInfo.slug || store?.plan || 'Standard'}
                        </span>
                        {aiUsage.resets_on && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 text-[#0BAA8F]">
                                <Clock size={12} />
                                <span>Resets on {aiUsage.resets_on}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Top-up Error Alert ────────────────────────────────────── */}
                {topupError && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-3">
                        <AlertCircle size={18} className="shrink-0 text-rose-500 dark:text-rose-400" />
                        <span>{topupError}</span>
                    </div>
                )}

                {/* ── Primary Meter: Claude-style Usage Card ────────────────── */}
                <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 sm:p-8 shadow-sm dark:shadow-xl backdrop-blur-sm relative overflow-hidden transition-colors">
                    {/* Background Subtle Radial Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0BAA8F]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">

                        {/* Meter Top Info */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <span>AI Scans (SmartCapture OCR)</span>
                                    {isUnlimited && (
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                            Unlimited
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Automated document, receipt, and invoice line-item extraction
                                </p>
                            </div>

                            {/* Numbers */}
                            <div className="text-right">
                                {isUnlimited ? (
                                    <div className="text-2xl font-bold font-mono text-[#0BAA8F]">∞ Unlimited</div>
                                ) : (
                                    <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tracking-tight">
                                        <span className={getTextColor(warningState)}>{pagesUsed}</span>
                                        <span className="text-neutral-400 dark:text-neutral-500 font-normal"> / {pagesLimit} scans</span>
                                    </div>
                                )}
                                {!isUnlimited && (
                                    <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        {usedPercent}% quota utilized
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Claude-style Horizontal Bar */}
                        {!isUnlimited ? (
                            <div className="space-y-2">
                                <div className="h-3.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200 dark:border-white/10 p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(warningState)}`}
                                        style={{ width: `${Math.max(2, usedPercent)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                                    <span>0 scans</span>
                                    {warningState === 'limit' && (
                                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                            <AlertTriangle size={12} /> Monthly allowance exhausted. Feature locked until reset or top-up.
                                        </span>
                                    )}
                                    {warningState === 'warning' && (
                                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                            <AlertCircle size={12} /> Near limit (over 80% used)
                                        </span>
                                    )}
                                    {warningState === 'ok' && (
                                        <span className="text-neutral-500 dark:text-neutral-400">
                                            {Math.max(0, pagesLimit - pagesUsed)} scans remaining
                                        </span>
                                    )}
                                    <span>{pagesLimit} scans</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Key className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
                                    <div>
                                        <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                            {isByok ? 'Bring-Your-Own-Key (BYOK) Active' : 'Unlimited Plan Allowance'}
                                        </div>
                                        <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                                            All scans and queries run without platform quota limits.
                                        </div>
                                    </div>
                                </div>
                                {store?.slug && (
                                    <Link
                                        href={route('store.admin.settings', { store_slug: store.slug })}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition-all shrink-0"
                                    >
                                        Manage Keys
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Free Tier Notice */}
                        {isNone && !isByok && (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4">
                                <div>
                                    <strong>Free Trial Allowance:</strong> You are currently on the free {free_scan_allowance}-scan preview.
                                    Upgrade your plan or purchase a top-up pack to unlock ongoing monthly allowances.
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
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-4 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Zap className="text-sky-500" size={18} />
                                <h3 className="font-bold text-neutral-900 dark:text-white text-base">Assistant & OmniSearch</h3>
                            </div>
                            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                {queriesUsed} / {queriesLimit ?? '∞'} queries
                            </span>
                        </div>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            Voice commands, natural language queries for sales, stock lookups, and customer analytics.
                        </p>

                        {queriesLimit && queriesLimit > 0 ? (
                            <div className="space-y-1.5 pt-2">
                                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200 dark:border-white/10">
                                    <div
                                        className="h-full bg-sky-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(2, queriesPercent)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                                    <span>{queriesPercent}% used</span>
                                    <span>{Math.max(0, queriesLimit - queriesUsed)} remaining</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl text-xs text-sky-800 dark:text-sky-300 font-medium">
                                Unlimited search queries included on your active store plan.
                            </div>
                        )}
                    </div>

                    {/* Top-up Add-on Card */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm flex flex-col justify-between space-y-4 transition-colors">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <ShoppingCart className="text-[#0BAA8F]" size={18} />
                                    <h3 className="font-bold text-neutral-900 dark:text-white text-base">Instant AI Top-Up</h3>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#0BAA8F] bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 px-2.5 py-0.5 rounded-full">
                                    $10 / 1,000 Credits
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Need extra capacity right away? Add 1,000 AI scan credits immediately to your store. Purchased credits never expire and rollover each month.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleBuyTopup}
                                disabled={buyingTopup}
                                className="flex-1 py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Plus size={14} />
                                {buyingTopup ? 'Opening Checkout…' : 'Buy 1,000 AI Credits ($10)'}
                            </button>
                            <div className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                                LemonSqueezy
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Feature Cards: AI Structural Rebuilds & Descriptions ────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* AI Structural Rebuilds */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm flex items-center justify-between opacity-80 transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <Database size={16} className="text-purple-500" />
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">AI Structural Rebuilds</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                                    Coming Soon
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Automated catalog reorganizations, batch categorization, and deep schema synthesis.
                            </p>
                        </div>
                    </div>

                    {/* AI Product Descriptions */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm flex items-center justify-between transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-[#0BAA8F]" />
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">AI Product Descriptions</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                    {descriptionsBalance > 0 ? `${descriptionsBalance} balance` : 'Included'}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                One-click SEO and marketing copy generation directly from the product editor.
                            </p>
                        </div>
                    </div>

                </div>

                {/* ── Recent Activity Audit Table ───────────────────────────── */}
                <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-4 transition-colors">
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/[0.08] pb-4">
                        <div className="flex items-center gap-2.5">
                            <Clock size={16} className="text-neutral-400" />
                            <h3 className="font-bold text-neutral-900 dark:text-white text-base">Recent AI Activity Log</h3>
                        </div>
                        <span className="text-xs font-mono text-neutral-500">
                            Last {recent_events.length} events
                        </span>
                    </div>

                    {recent_events.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <Sparkles size={28} className="mx-auto text-neutral-400 dark:text-neutral-600" />
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">No AI operations recorded yet for this store.</p>
                            <p className="text-xs text-neutral-500">When you scan documents or use AI assistant features, your store's activity will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-left">
                                        <th className="py-2.5 px-3">Feature</th>
                                        <th className="py-2.5 px-3">Units</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                                    {recent_events.map((ev) => (
                                        <tr key={ev.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-white capitalize">
                                                {ev.feature === 'scan' ? 'SmartCapture OCR Scan' : ev.feature}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-700 dark:text-neutral-300">
                                                {ev.pages ? `${ev.pages} page${ev.pages > 1 ? 's' : ''}` : '1 query'}
                                            </td>
                                            <td className="py-3 px-3">
                                                {ev.success ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        <Check size={12} /> Success
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
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

