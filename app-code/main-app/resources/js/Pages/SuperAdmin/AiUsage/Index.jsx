import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { useT, Panel, PageHeader, Badge, Button, Input, Select, EmptyState, KpiCard, BRAND } from '@/Platform/ui';
import {
    DollarSign, TrendingUp, Cpu, Users, ArrowUpRight,
    Shield, Search, AlertTriangle, Calendar, BarChart3, Layers,
    Clock, Database, ArrowLeft
} from 'lucide-react';

export default function PlatformAiUsageIndex({
    kpis = {},
    daily_trend = [],
    tenant_breakdown = [],
    model_breakdown = []
}) {
    const t = useT();
    const [tenantSearch, setTenantSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('all'); // all, managed, byok

    // Filter tenants
    const filteredTenants = useMemo(() => {
        return (tenant_breakdown || []).filter(item => {
            const matchesSearch = !tenantSearch.trim() ||
                item.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                item.slug?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                String(item.tenant_id).includes(tenantSearch);

            const matchesFilter = tenantFilter === 'all' ||
                (tenantFilter === 'byok' && item.ai_status === 'byok') ||
                (tenantFilter === 'managed' && item.ai_status !== 'byok');

            return matchesSearch && matchesFilter;
        });
    }, [tenant_breakdown, tenantSearch, tenantFilter]);

    // Max cost for trend scaling
    const maxDailyCost = useMemo(() => {
        const costs = (daily_trend || []).map(d => parseFloat(d.cost_usd) || 0);
        return Math.max(1, ...costs);
    }, [daily_trend]);

    return (
        <PlatformLayout title="AI Billing & Fleet Telemetry">
            <Head title="Platform AI Cost & Infrastructure — VenQore Platform" />

            <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Page Header ────────────────────────────────────────── */}
                <PageHeader
                    title="AI Billing & Fleet Telemetry"
                    subtitle="Monitor multi-model provider spend (Gemini, OpenAI, Claude), enforce daily spend guardrails, and audit per-tenant margins."
                    icon={Cpu}
                    accent={BRAND.indigo}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Link href={route('platform.dashboard')}>
                                <Button variant="secondary" icon={ArrowLeft} size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href={route('platform.tenants.overrides')}>
                                <Button variant="secondary" icon={Users} size="sm">
                                    Tenant Overrides
                                </Button>
                            </Link>
                            <Link href={route('platform.plans.index')}>
                                <Button variant="primary" icon={Layers} size="sm">
                                    Plan Allowances
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* ── Top KPI Stat Cards ─────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <KpiCard
                        label="Today's Platform Spend"
                        value={`$${(kpis.today_spend || 0).toFixed(4)}`}
                        sub={`${(kpis.today_calls || 0).toLocaleString()} calls today`}
                        icon={DollarSign}
                        accent={BRAND.emerald}
                    />
                    <KpiCard
                        label="Month-to-Date Cost"
                        value={`$${(kpis.month_spend || 0).toFixed(2)}`}
                        sub={`${(kpis.month_calls || 0).toLocaleString()} calls this month`}
                        icon={Calendar}
                        accent={BRAND.sky}
                    />
                    <KpiCard
                        label="Projected Run-rate"
                        value={`$${(kpis.projected_month_end || 0).toFixed(2)}`}
                        sub={`~$${(kpis.avg_daily_spend_7d || 0).toFixed(2)} / day avg`}
                        icon={TrendingUp}
                        accent={BRAND.purple}
                    />
                    <KpiCard
                        label="Daily Platform Cap"
                        value={`$${(kpis.daily_spend_cap || 25).toFixed(2)}`}
                        sub="Active protection threshold"
                        icon={Shield}
                        accent={BRAND.amber}
                    />
                </div>

                {/* ── Trailing 30-Day Daily Spend Trend Chart ────────────── */}
                <Panel pad={22}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: `1px solid ${t.border}`, paddingBottom: 16, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <BarChart3 size={18} style={{ color: BRAND.indigo }} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: t.ink }}>
                                    30-Day Cost & Call Trajectory
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>
                                    Daily platform provider expenditure (excluding BYOK self-funded keys)
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.muted, fontFamily: 'monospace' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: BRAND.indigo, display: 'inline-block' }} />
                            <span>Platform Provider Cost ($)</span>
                        </div>
                    </div>

                    {(!daily_trend || daily_trend.length === 0) ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: t.muted, fontSize: 13, fontStyle: 'italic' }}>
                            No telemetry recorded over the trailing 30 days.
                        </div>
                    ) : (
                        <div>
                            {/* Bar chart bars */}
                            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 6, paddingTop: 16, paddingBottom: 8 }}>
                                {daily_trend.map(d => {
                                    const cost = parseFloat(d.cost_usd) || 0;
                                    const heightPct = Math.max(5, Math.round((cost / maxDailyCost) * 100));

                                    return (
                                        <div
                                            key={d.date}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                height: '100%',
                                                justifyContent: 'flex-end',
                                                position: 'relative',
                                            }}
                                            title={`${d.date}: $${cost.toFixed(4)} (${d.total_calls} calls)`}
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    background: t.isDark ? 'rgba(99, 102, 241, 0.75)' : BRAND.indigo,
                                                    borderRadius: '4px 4px 0 0',
                                                    height: `${heightPct}%`,
                                                    transition: 'all 0.15s ease',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Axis timeline labels */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: 'monospace', color: t.muted, paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
                                <span>{daily_trend[0]?.date}</span>
                                <span>30 Days Trailing Overview</span>
                                <span>{daily_trend[daily_trend.length - 1]?.date}</span>
                            </div>
                        </div>
                    )}
                </Panel>

                {/* ── Per-Tenant AI Consumption Table ────────────────────── */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Users size={18} style={{ color: BRAND.sky }} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: t.ink }}>
                                    Per-Tenant AI Consumption
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>
                                    Stores ranked by 30-day platform provider spend
                                </p>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ position: 'relative', width: 220 }}>
                                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted }} />
                                <Input
                                    value={tenantSearch}
                                    onChange={e => setTenantSearch(e.target.value)}
                                    placeholder="Filter store or slug…"
                                    style={{ paddingLeft: 32, fontSize: 12.5 }}
                                />
                            </div>

                            <Select
                                value={tenantFilter}
                                onChange={e => setTenantFilter(e.target.value)}
                                options={[
                                    { value: 'all', label: 'All Stores' },
                                    { value: 'managed', label: 'Platform Paid' },
                                    { value: 'byok', label: 'BYOK Stores' },
                                ]}
                                style={{ width: 140 }}
                            />
                        </div>
                    </div>

                    {filteredTenants.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: t.muted, fontSize: 13, fontStyle: 'italic' }}>
                            No store consumption matching current filters.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
                                <thead>
                                    <tr style={{ background: t.panel2, borderBottom: `1px solid ${t.border}` }}>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tenant / Store</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan / Mode</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Feature</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Calls</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tokens Used</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Cost</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTenants.map(item => (
                                        <tr
                                            key={item.tenant_id}
                                            style={{ borderBottom: `1px solid ${t.rowBorder}`, transition: 'background 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = t.hover; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>{item.name}</div>
                                                <div style={{ fontSize: 11, fontFamily: 'monospace', color: t.muted }}>#{item.tenant_id} · {item.slug}</div>
                                            </td>

                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: t.inputBg, border: `1px solid ${t.border}`, color: t.sub }}>
                                                        {item.plan}
                                                    </span>
                                                    {item.ai_status === 'byok' ? (
                                                        <Badge color={BRAND.emerald} tone="soft">BYOK</Badge>
                                                    ) : (
                                                        <Badge color={BRAND.indigo} tone="soft">Managed</Badge>
                                                    )}
                                                </div>
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', color: t.sub, textTransform: 'capitalize' }}>
                                                {item.top_feature || 'scan'}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: t.ink }}>
                                                {(item.total_calls || 0).toLocaleString()}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 12.5, fontFamily: 'monospace', color: t.muted }}>
                                                {(item.total_tokens || 0).toLocaleString()}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', fontWeight: 800 }}>
                                                {item.ai_status === 'byok' ? (
                                                    <span style={{ color: BRAND.emerald }}>$0.00 (Self-funded)</span>
                                                ) : (
                                                    <span style={{ color: t.ink }}>${(item.cost_usd || 0).toFixed(4)}</span>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <Link
                                                    href={route('platform.tenants.overrides.show', { tenant: item.tenant_id })}
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <Button size="sm" variant="secondary" icon={ArrowUpRight}>
                                                        Adjust Quota
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>

                {/* ── Per-Provider & Model Breakdown ─────────────────────── */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Cpu size={18} style={{ color: BRAND.purple }} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: t.ink }}>
                                    Model & Provider Reconciliation
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>
                                    Match against upstream Google Cloud, OpenAI, and Anthropic invoice line items
                                </p>
                            </div>
                        </div>

                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: t.muted }}>
                            {model_breakdown.length} models active
                        </span>
                    </div>

                    {(!model_breakdown || model_breakdown.length === 0) ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: t.muted, fontSize: 13, fontStyle: 'italic' }}>
                            No model activity logged in the selected period.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
                                <thead>
                                    <tr style={{ background: t.panel2, borderBottom: `1px solid ${t.border}` }}>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model Name</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calls</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prompt Tokens</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Tokens</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Latency</th>
                                        <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Estimated Cost (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {model_breakdown.map(m => (
                                        <tr
                                            key={`${m.provider}-${m.model}`}
                                            style={{ borderBottom: `1px solid ${t.rowBorder}`, transition: 'background 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = t.hover; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 800, color: t.ink, textTransform: 'capitalize' }}>
                                                {m.provider}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: BRAND.indigo }}>
                                                {m.model}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: t.ink }}>
                                                {(m.total_calls || 0).toLocaleString()}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 12.5, fontFamily: 'monospace', color: t.muted }}>
                                                {(m.total_prompt_tokens || 0).toLocaleString()}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 12.5, fontFamily: 'monospace', color: t.muted }}>
                                                {(m.total_output_tokens || 0).toLocaleString()}
                                            </td>

                                            <td style={{ padding: '14px 20px', fontSize: 12.5, fontFamily: 'monospace', color: t.muted }}>
                                                {m.avg_latency_ms ? `${m.avg_latency_ms} ms` : '—'}
                                            </td>

                                            <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 13.5, fontFamily: 'monospace', fontWeight: 900, color: t.ink }}>
                                                ${(m.cost_usd || 0).toFixed(4)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </div>
        </PlatformLayout>
    );
}
