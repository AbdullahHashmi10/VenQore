import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { BarChart2, Layers, TrendingUp, Eye, FileText, Lock } from 'lucide-react';

function ReportLink({ icon: Icon, label, sub, route: routeName, storeId }) {
    return (
        <button
            onClick={() => router.visit(window.route(routeName, { store_slug: storeSlug }))}
            style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '14px 18px', borderRadius: 14, textAlign: 'left',
                background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border, #f1f5f9)'; e.currentTarget.style.transform = 'none'; }}
        >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color="#6366f1" />
            </div>
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main,#0f172a)' }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
            </div>
        </button>
    );
}

export default function ViewerDashboard({ plSummary, inventoryValue }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const sym = store?.currency_symbol ?? '$ ';
    const fmt = (v) => formatCurrency ? formatCurrency(parseFloat(v || 0), store) : sym + Number(v || 0).toLocaleString();

    const pl = plSummary || { income: 0, expense: 0, profit: 0 };

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="Reports — Read Only" />

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Eye size={20} color="#6366f1" />
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main,#0f172a)', margin: 0 }}>Read-Only Reports</h1>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        {store?.name} · You have view-only access. No transactions can be created.
                    </p>
                </div>

                {/* Read-only notice */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 28, fontSize: 13, color: '#0369a1' }}>
                    <Lock size={14} />
                    Viewer access — you can see financial summaries but cannot create, edit, or delete records.
                </div>

                {/* Summary Tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                    {[
                        { label: 'Income (Month)',   value: fmt(pl.income),         color: '#10b981' },
                        { label: 'Expenses (Month)', value: fmt(pl.expense),        color: '#f59e0b' },
                        { label: 'Net Profit',       value: fmt(pl.profit),         color: pl.profit >= 0 ? '#6366f1' : '#ef4444' },
                    ].map(t => (
                        <div key={t.label} style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: t.color }}>{t.value}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 600 }}>{t.label}</div>
                        </div>
                    ))}
                </div>

                {/* Inventory Value */}
                <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: 28 }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main,#0f172a)' }}>Total Inventory Value (FIFO)</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Current cost-based valuation</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>{fmt(inventoryValue ?? 0)}</div>
                </div>

                {/* Allowed Reports */}
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main,#0f172a)', marginBottom: 12 }}>Available Reports</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <ReportLink icon={BarChart2} label="Profit &amp; Loss Statement" sub="Income, expenses, and net profit" route="reports.profit-loss" storeId={storeId} />
                    <ReportLink icon={Layers}    label="Balance Sheet"              sub="Assets, liabilities, and equity" route="reports.balance-sheet" storeId={storeId} />
                    <ReportLink icon={TrendingUp} label="Inventory Valuation"       sub="FIFO cost-based stock value"    route="reports.inventory-valuation" storeId={storeId} />
                    <ReportLink icon={FileText}  label="Trial Balance"              sub="Account-level debit/credit summary" route="reports.trial-balance" storeId={storeId} />
                </div>
            </div>
        </OneGlanceLayout>
    );
}
