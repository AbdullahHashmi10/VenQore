import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import PlatformShell from '@/Layouts/PlatformShell';
import {
    DollarSign, TrendingUp, Cpu, Users, ArrowUpRight,
    Shield, Search, AlertTriangle, Calendar, BarChart3, Layers
} from 'lucide-react';

export default function PlatformAiUsageIndex({
    kpis = {},
    daily_trend = [],
    tenant_breakdown = [],
    model_breakdown = []
}) {
    const [tenantSearch, setTenantSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('all'); // all, managed, byok

    // Filter tenants
    const filteredTenants = useMemo(() => {
        return (tenant_breakdown || []).filter(t => {
            const matchesSearch = !tenantSearch.trim() ||
                t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                t.slug?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                String(t.tenant_id).includes(tenantSearch);

            const matchesFilter = tenantFilter === 'all' ||
                (tenantFilter === 'byok' && t.ai_status === 'byok') ||
                (tenantFilter === 'managed' && t.ai_status !== 'byok');

            return matchesSearch && matchesFilter;
        });
    }, [tenant_breakdown, tenantSearch, tenantFilter]);

    // Max cost for trend scaling
    const maxDailyCost = useMemo(() => {
        const costs = (daily_trend || []).map(d => parseFloat(d.cost_usd) || 0);
        return Math.max(1, ...costs);
    }, [daily_trend]);

    return (
        <PlatformShell title="AI Billing & Fleet Operations">
            <Head title="Platform AI Cost & Infrastructure — VenQore HQ" />

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

                {/* ── Page Header ───────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                            <span>Platform HQ</span>
                            <span>/</span>
                            <span className="text-[#0BAA8F]">AI Operations & Infrastructure</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <Cpu className="text-[#0BAA8F]" size={28} />
                            <span>AI Billing & Fleet Telemetry</span>
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl leading-relaxed">
                            Monitor multi-model provider spend (Gemini, OpenAI, Claude), enforce daily spend guardrails, and audit per-tenant margins.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('platform.tenants.overrides')}
                            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all flex items-center gap-2"
                        >
                            <Users size={14} />
                            <span>Tenant Overrides</span>
                        </Link>
                        <Link
                            href={route('platform.plans.index')}
                            className="px-4 py-2 rounded-xl bg-[#0BAA8F]/15 hover:bg-[#0BAA8F]/25 border border-[#0BAA8F]/30 text-xs font-bold text-[#0BAA8F] transition-all flex items-center gap-2"
                        >
                            <Layers size={14} />
                            <span>Plan Allowances</span>
                        </Link>
                    </div>
                </div>

                {/* ── Top KPI Stat Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    {/* Today's Spend */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-2 transition-colors">
                        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Today's Platform Spend</span>
                            <DollarSign size={16} className="text-[#0BAA8F]" />
                        </div>
                        <div className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                            ${(kpis.today_spend || 0).toFixed(4)}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                            <span>{kpis.today_calls || 0} API calls today</span>
                            <span className="text-[#0BAA8F] font-bold">Live</span>
                        </div>
                    </div>

                    {/* Month-to-Date Spend */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-2 transition-colors">
                        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Month-to-Date Cost</span>
                            <Calendar size={16} className="text-sky-500" />
                        </div>
                        <div className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                            ${(kpis.month_spend || 0).toFixed(2)}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                            <span>{(kpis.month_calls || 0).toLocaleString()} calls this month</span>
                            <span className="text-neutral-400">{new Date().toLocaleDateString('default', { month: 'short' })}</span>
                        </div>
                    </div>

                    {/* Projected Month-End */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-2 transition-colors">
                        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Projected Run-rate</span>
                            <TrendingUp size={16} className="text-purple-500" />
                        </div>
                        <div className="text-3xl font-bold font-mono tracking-tight text-purple-600 dark:text-purple-300">
                            ${(kpis.projected_month_end || 0).toFixed(2)}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                            <span>~${(kpis.avg_daily_spend_7d || 0).toFixed(2)} / day avg</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold">Month-end</span>
                        </div>
                    </div>

                    {/* Configured Daily Cap */}
                    <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-2 transition-colors">
                        <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Daily Platform Cap</span>
                            <Shield size={16} className="text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                            ${(kpis.daily_spend_cap || 25).toFixed(2)}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                            <span>Protection threshold</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Active</span>
                        </div>
                    </div>

                </div>

                {/* ── Trailing 30-Day Daily Spend Trend Chart ────────────────── */}
                <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-5 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/[0.08] pb-4">
                        <div className="flex items-center gap-2.5">
                            <BarChart3 size={18} className="text-[#0BAA8F]" />
                            <div>
                                <h3 className="font-bold text-neutral-900 dark:text-white text-base">30-Day Cost & Call Trajectory</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Daily platform provider expenditure (excluding BYOK self-funded keys)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-[#0BAA8F]" />
                                <span>Platform Cost ($)</span>
                            </div>
                        </div>
                    </div>

                    {(!daily_trend || daily_trend.length === 0) ? (
                        <div className="text-center py-10 text-neutral-400 text-xs italic">
                            No telemetry recorded over the last 30 days.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Bar Chart Bars */}
                            <div className="h-44 flex items-end gap-1.5 pt-4 pb-2">
                                {daily_trend.map((d) => {
                                    const cost = parseFloat(d.cost_usd) || 0;
                                    const heightPct = Math.max(4, Math.round((cost / maxDailyCost) * 100));

                                    return (
                                        <div
                                            key={d.date}
                                            className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-neutral-900 text-white border border-neutral-700 p-2 rounded-xl text-[10px] font-mono z-20 whitespace-nowrap shadow-xl">
                                                <span className="text-neutral-400 font-bold">{d.date}</span>
                                                <span className="text-white font-bold">${cost.toFixed(4)}</span>
                                                <span className="text-neutral-400">{d.total_calls} calls</span>
                                            </div>

                                            {/* Bar */}
                                            <div
                                                className="w-full bg-[#0BAA8F]/70 hover:bg-[#0BAA8F] rounded-t-md transition-all duration-200"
                                                style={{ height: `${heightPct}%` }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* X-axis labels */}
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-100 dark:border-white/[0.05]">
                                <span>{daily_trend[0]?.date}</span>
                                <span>30 Days Trailing</span>
                                <span>{daily_trend[daily_trend.length - 1]?.date}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Per-Tenant Breakdown & High-Volume Auditing ────────────── */}
                <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-5 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/[0.08] pb-4">
                        <div className="flex items-center gap-2.5">
                            <Users size={18} className="text-sky-500" />
                            <div>
                                <h3 className="font-bold text-neutral-900 dark:text-white text-base">Per-Tenant AI Consumption</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Stores ranked by 30-day platform provider spend</p>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-2.5 text-neutral-400" />
                                <input
                                    type="text"
                                    value={tenantSearch}
                                    onChange={e => setTenantSearch(e.target.value)}
                                    placeholder="Filter store or slug…"
                                    className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                />
                            </div>
                            <select
                                value={tenantFilter}
                                onChange={e => setTenantFilter(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                            >
                                <option value="all">All Stores</option>
                                <option value="managed">Platform Paid</option>
                                <option value="byok">BYOK Stores</option>
                            </select>
                        </div>
                    </div>

                    {filteredTenants.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 text-xs italic">
                            No store consumption matching current filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-left">
                                        <th className="py-2.5 px-3">Tenant / Store</th>
                                        <th className="py-2.5 px-3">Plan / Mode</th>
                                        <th className="py-2.5 px-3">Top Feature</th>
                                        <th className="py-2.5 px-3">Total Calls</th>
                                        <th className="py-2.5 px-3">Tokens Used</th>
                                        <th className="py-2.5 px-3">Platform Cost</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                                    {filteredTenants.map((t) => (
                                        <tr key={t.tenant_id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="font-bold text-neutral-900 dark:text-white text-sm">{t.name}</div>
                                                <div className="font-mono text-[10px] text-neutral-400">#{t.tenant_id} · {t.slug}</div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300">
                                                        {t.plan}
                                                    </span>
                                                    {t.ai_status === 'byok' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                            BYOK
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0BAA8F]/15 text-[#0BAA8F] border border-[#0BAA8F]/30">
                                                            Managed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-700 dark:text-neutral-300 capitalize">
                                                {t.top_feature || 'scan'}
                                            </td>
                                            <td className="py-3 px-3 font-mono font-semibold text-neutral-900 dark:text-white">
                                                {(t.total_calls || 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                                                {(t.total_tokens || 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 font-mono font-bold">
                                                {t.ai_status === 'byok' ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">$0.00 (Self-funded)</span>
                                                ) : (
                                                    <span className="text-neutral-900 dark:text-white">${(t.cost_usd || 0).toFixed(4)}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <Link
                                                    href={route('platform.tenants.overrides.show', { tenant: t.tenant_id })}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0BAA8F]/15 hover:bg-[#0BAA8F]/25 border border-[#0BAA8F]/30 text-[#0BAA8F] text-[11px] font-bold transition-all"
                                                >
                                                    <span>Adjust Quota</span>
                                                    <ArrowUpRight size={12} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Per-Provider & Model Breakdown ────────────────────────── */}
                <div className="bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-5 transition-colors">
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/[0.08] pb-4">
                        <div className="flex items-center gap-2.5">
                            <Cpu size={18} className="text-purple-500" />
                            <div>
                                <h3 className="font-bold text-neutral-900 dark:text-white text-base">Model & Provider Reconciliation</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Match against Google Cloud & OpenAI invoice line items</p>
                            </div>
                        </div>
                        <span className="text-xs font-mono text-neutral-500">
                            {model_breakdown.length} models utilized
                        </span>
                    </div>

                    {(!model_breakdown || model_breakdown.length === 0) ? (
                        <div className="text-center py-8 text-neutral-400 text-xs italic">
                            No model activity logged in the selected period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-left">
                                        <th className="py-2.5 px-3">Provider</th>
                                        <th className="py-2.5 px-3">Model</th>
                                        <th className="py-2.5 px-3">Calls</th>
                                        <th className="py-2.5 px-3">Prompt Tokens</th>
                                        <th className="py-2.5 px-3">Output Tokens</th>
                                        <th className="py-2.5 px-3">Avg Latency</th>
                                        <th className="py-2.5 px-3 text-right">Estimated Cost (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                                    {model_breakdown.map((m) => (
                                        <tr key={`${m.provider}-${m.model}`} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white capitalize">
                                                {m.provider}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-[#0BAA8F] font-bold">
                                                {m.model}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-900 dark:text-white">
                                                {(m.total_calls || 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                                                {(m.total_prompt_tokens || 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                                                {(m.total_output_tokens || 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-neutral-500 dark:text-neutral-400">
                                                {m.avg_latency_ms ? `${m.avg_latency_ms} ms` : '—'}
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white text-sm">
                                                ${(m.cost_usd || 0).toFixed(4)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </PlatformShell>
    );
}

