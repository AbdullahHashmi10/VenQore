import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import {
    DollarSign, TrendingDown, TrendingUp, CreditCard,
    FileText, ArrowUpRight, Clock, AlertCircle, CheckCircle2,
    BarChart2, BookOpen, Layers
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

// ── Reusable metric card ────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color = '#6366f1', onClick, trend }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'var(--card-bg, #fff)',
                border: '1px solid var(--card-border, #f1f5f9)',
                borderRadius: 20, padding: '20px 22px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.15s',
                position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'none')}
        >
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: color + '10', borderRadius: '50%' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                </div>
                {trend != null && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: trend >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </span>
                )}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main, #0f172a)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub, #64748b)', marginTop: 5, fontWeight: 600 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
        </div>
    );
}

// ── Aging row ───────────────────────────────────────────────────────────────
function AgingRow({ bucket, amount, pct, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: '#64748b' }}>{bucket}</div>
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{amount}</div>
        </div>
    );
}

export default function AccountantDashboard({
    cashPosition,
    receivables,
    payables,
    plSummary,
    recentJournalEntries,
    bankAccounts,
    cashAccounts,
    pendingJournalCount,
    plChartData,
}) {
    const { store, my_display_name, auth } = usePage().props;
    const storeSlug = store?.slug;
    const sym = store?.currency_symbol ?? '$ ';

    const fmt = (v) => formatCurrency ? formatCurrency(parseFloat(v || 0)) : sym + Number(v).toLocaleString();

    const pl = plSummary || { income: 0, expense: 0, profit: 0, status: 'good' };
    const rx = receivables || { total: 0, overdue_30: 0, overdue_60: 0, overdue_90: 0, overdue_90plus: 0 };
    const py = payables   || { total: 0, due_7: 0, due_30: 0, overdue: 0 };
    const cp = cashPosition || { cash: 0, bank: 0, total: 0 };

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="Finance Dashboard" />
            <div style={{ padding: '24px 24px 48px', maxWidth: 1400, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                        💰 Finance Overview
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                        {store?.name} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Top KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    <MetricCard
                        icon={DollarSign} color="#10b981"
                        label="Net Cash Position"
                        value={fmt(cp.total)}
                        sub={`Cash: ${fmt(cp.cash)} · Bank: ${fmt(cp.bank)}`}
                        onClick={() => router.visit(route("store.finance.accounts", {
                            store_slug: store.slug
                        }))}
                    />
                    <MetricCard
                        icon={ArrowUpRight} color="#6366f1"
                        label="Total Receivables"
                        value={fmt(rx.total)}
                        sub={`${rx.overdue_30 > 0 ? fmt(rx.overdue_30) + ' overdue 30d+' : 'No overdue'}`}
                        onClick={() => router.visit(route("store.finance.receivables", {
                            store_slug: store.slug
                        }))}
                        trend={rx.total > 0 ? 1 : null}
                    />
                    <MetricCard
                        icon={TrendingDown} color="#f59e0b"
                        label="Total Payables"
                        value={fmt(py.total)}
                        sub={`Due in 7d: ${fmt(py.due_7)}`}
                        onClick={() => router.visit(route("store.finance.payables", {
                            store_slug: store.slug
                        }))}
                        trend={py.overdue > 0 ? -1 : null}
                    />
                    <MetricCard
                        icon={BarChart2} color={pl.profit >= 0 ? '#10b981' : '#ef4444'}
                        label="Net Profit (Month)"
                        value={fmt(pl.profit)}
                        sub={`Income ${fmt(pl.income)} · Exp ${fmt(pl.expense)}`}
                        onClick={() => router.visit(route("store.reports.profit-loss", {
                            store_slug: store.slug
                        }))}
                        trend={pl.profit >= 0 ? 1 : -1}
                    />
                </div>

                {/* Charts + Aging row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
                    {/* P&L Chart */}
                    <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)', marginBottom: 20 }}>
                            Cash Flow — Last 6 Months
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={plChartData ?? []} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => sym + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
                                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4,4,0,0]} />
                                <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Receivables Aging */}
                    <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)', marginBottom: 8 }}>
                            Receivables Aging
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Who owes and how overdue</div>
                        {[
                            { bucket: '0–30 days', amount: fmt(rx.total - rx.overdue_30 - rx.overdue_60 - rx.overdue_90 - rx.overdue_90plus), pct: rx.total > 0 ? Math.max(5,((rx.total - rx.overdue_30)/rx.total)*100) : 0, color: '#10b981' },
                            { bucket: '31–60 days', amount: fmt(rx.overdue_30), pct: rx.total > 0 ? (rx.overdue_30/rx.total)*100 : 0, color: '#f59e0b' },
                            { bucket: '61–90 days', amount: fmt(rx.overdue_60), pct: rx.total > 0 ? (rx.overdue_60/rx.total)*100 : 0, color: '#f97316' },
                            { bucket: '90+ days',   amount: fmt(rx.overdue_90plus ?? 0), pct: rx.total > 0 ? ((rx.overdue_90plus ?? 0)/rx.total)*100 : 0, color: '#ef4444' },
                        ].map(r => <AgingRow key={r.bucket} {...r} />)}

                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)', marginBottom: 8 }}>Payables — Due Soon</div>
                            {[
                                { label: 'Due in 7 days',  value: fmt(py.due_7),  color: '#f59e0b' },
                                { label: 'Due in 30 days', value: fmt(py.due_30), color: '#6366f1' },
                                { label: 'Overdue',        value: fmt(py.overdue), color: '#ef4444' },
                            ].map(p => (
                                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                                    <span style={{ color: '#64748b', fontWeight: 500 }}>{p.label}</span>
                                    <span style={{ fontWeight: 700, color: p.color }}>{p.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pending Journal + Bank + Quick Links */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Journal Entry Queue */}
                    <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)' }}>Recent Journal Entries</div>
                            {(pendingJournalCount ?? 0) > 0 && (
                                <span style={{ padding: '3px 10px', borderRadius: 8, background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700 }}>
                                    {pendingJournalCount} pending
                                </span>
                            )}
                        </div>
                        {(recentJournalEntries ?? []).length === 0 ? (
                            <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No recent entries.</div>
                        ) : (
                            (recentJournalEntries ?? []).slice(0, 6).map((entry, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main,#0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.description ?? 'Journal Entry'}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{entry.date}</div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: entry.type === 'debit' ? '#10b981' : '#f59e0b', flexShrink: 0 }}>{fmt(entry.amount)}</div>
                                </div>
                            ))
                        )}
                        <button onClick={() => router.visit(route("store.finance.journal", {
                            store_slug: store.slug
                        }))}
                            style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'transparent', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            View All Journal Entries
                        </button>
                    </div>

                    {/* Bank Accounts + Quick Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)', marginBottom: 14 }}>Bank &amp; Cash Accounts</div>
                            {[...(bankAccounts ?? []), ...(cashAccounts ?? [])].map((acct, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                                    <span style={{ color: '#475569', fontWeight: 500 }}>{acct.name ?? acct.bank_name ?? 'Account'}</span>
                                    <span style={{ fontWeight: 700, color: (acct.current_balance ?? 0) >= 0 ? '#10b981' : '#ef4444' }}>{fmt(acct.current_balance ?? 0)}</span>
                                </div>
                            ))}
                            {[...(bankAccounts ?? []), ...(cashAccounts ?? [])].length === 0 && (
                                <div style={{ color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>No accounts configured.</div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main,#0f172a)', marginBottom: 12 }}>Quick Actions</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'P&L Report',       icon: BarChart2,  route: 'store.reports.profit-loss' },
                                    { label: 'Balance Sheet',     icon: Layers,     route: 'store.reports.balance-sheet' },
                                    { label: 'Journal Entry',     icon: BookOpen,   route: 'store.finance.journal' },
                                    { label: 'Bank Reconcile',    icon: CheckCircle2, route: 'store.finance.accounts' },
                                ].map(a => (
                                    <button key={a.label}
                                        onClick={() => router.visit(route(a.route, { store_slug: storeSlug }))}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                                    >
                                        <a.icon size={14} color="#6366f1" /> {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
