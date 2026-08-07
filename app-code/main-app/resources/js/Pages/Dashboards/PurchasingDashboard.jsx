import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { vq } from '@/theme/runtime';
import {
    ShoppingBag, Truck, AlertTriangle, DollarSign,
    CheckCircle2, Clock, Package, ArrowRight, RefreshCw, Plus
} from 'lucide-react';

// ── Status pill ─────────────────────────────────────────────────────────────
const STATUS = {
    ordered:            { color: vq.indigo[500], bg: vq.indigo[50], label: 'Ordered' },
    partial:            { color: vq.amber[500], bg: vq.amber[50], label: 'Partial' },
    partially_received: { color: vq.amber[500], bg: vq.amber[50], label: 'Partial' },
    received:           { color: vq.emerald[500], bg: vq.green[50], label: 'Received' },
    cancelled:          { color: vq.red[500], bg: vq.red[50], label: 'Cancelled' },
};

function StatusPill({ status }) {
    const cfg = STATUS[status] ?? { color: vq.slate[500], bg: vq.slate[100], label: status };
    return (
        <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {cfg.label}
        </span>
    );
}

// ── Metric card ─────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = vq.indigo[500] }) {
    return (
        <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main,#0f172a)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: vq.slate[500], marginTop: 5, fontWeight: 600 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: vq.slate[400], marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

export default function PurchasingDashboard({
    openPurchaseOrders,
    pendingDeliveriesCount,
    reorderAlerts,
    supplierPayables,
    monthlySpend,
    budgetUsed,
    recentOrders,
}) {
    const { store, my_display_name, auth } = usePage().props;
    const storeSlug = store?.slug;
    const sym = store?.currency_symbol ?? '$ ';

    const fmt = (v) => formatCurrency ? formatCurrency(parseFloat(v || 0)) : sym + Number(v || 0).toLocaleString();

    const openCount     = openPurchaseOrders ?? 0;
    const deliveries    = pendingDeliveriesCount ?? 0;
    const alerts        = reorderAlerts ?? [];
    const payables      = supplierPayables ?? 0;
    const spend         = monthlySpend ?? 0;
    const budget        = budgetUsed ?? 0;
    const orders        = recentOrders ?? [];

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="Purchasing Dashboard" />
            <div style={{ padding: '24px 24px 48px', maxWidth: 1300, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main,#0f172a)', margin: 0 }}>
                            📦 Purchasing &amp; Procurement
                        </h1>
                        <p style={{ fontSize: 13, color: vq.slate[500], margin: '4px 0 0' }}>
                            {store?.name} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={() => router.visit(route("store.purchases.create", {
                            store_slug: store.slug
                        }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
                    >
                        <Plus size={15} /> New Purchase Order
                    </button>
                </div>

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    <KpiCard
                        icon={ShoppingBag} color={vq.indigo[500]}
                        label="Open Purchase Orders"
                        value={openCount}
                        sub="Not yet fully received"
                    />
                    <KpiCard
                        icon={Truck} color={vq.amber[500]}
                        label="Pending Deliveries"
                        value={deliveries}
                        sub="Expected this week"
                    />
                    <KpiCard
                        icon={AlertTriangle} color={vq.red[500]}
                        label="Reorder Alerts"
                        value={alerts.length}
                        sub={alerts.length > 0 ? 'Products below reorder point' : 'All stock levels healthy'}
                    />
                    <KpiCard
                        icon={DollarSign} color={vq.emerald[500]}
                        label="Supplier Payables"
                        value={fmt(payables)}
                        sub={`This month spend: ${fmt(spend)}`}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                    {/* Recent Purchase Orders Table */}
                    <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)' }}>Purchase Orders</div>
                            <button onClick={() => router.visit(route("store.purchases.index", {
                                store_slug: store.slug
                            }))}
                                style={{ fontSize: 12, color: vq.indigo[500], fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                View All <ArrowRight size={12} />
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {['Order #', 'Supplier', 'Amount', 'Status', 'Expected'].map(h => (
                                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: vq.slate[400], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 && (
                                    <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: vq.slate[400], fontSize: 13 }}>No purchase orders yet.</td></tr>
                                )}
                                {orders.map((po, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.12s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = vq.zinc[50]}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-main,#0f172a)' }}>#{po.id}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: vq.slate[600] }}>{po.supplier_name ?? '—'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: vq.slate[900] }}>{fmt(po.total_amount ?? 0)}</td>
                                        <td style={{ padding: '12px 16px' }}><StatusPill status={po.status} /></td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: vq.slate[400] }}>{po.expected_date ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Reorder Alerts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main,#0f172a)' }}>⚠️ Reorder Alerts</div>
                                <button onClick={() => router.visit(route("store.inventory.index", {
                                    store_slug: store.slug
                                }))}
                                    style={{ fontSize: 12, color: vq.indigo[500], fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                    View All
                                </button>
                            </div>
                            {alerts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                    <CheckCircle2 size={28} color={vq.emerald[500]} style={{ margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: 13, color: vq.slate[500], margin: 0 }}>All stock levels are healthy.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {alerts.slice(0, 8).map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: vq.orange[50], border: '1px solid #fed7aa' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: vq.amber[800], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: vq.amber[700], marginTop: 2 }}>Stock: {item.stock} / Min: {item.min_stock}</div>
                                            </div>
                                            <button
                                                onClick={() => router.visit(route("store.purchases.create", {
                                                    store_slug: store.slug,
                                                    product_id: item.id
                                                }))}
                                                style={{ padding: '5px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: vq.indigo[500], cursor: 'pointer', flexShrink: 0 }}>
                                                Order
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Budget Tracker */}
                        <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--card-border,#f1f5f9)', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main,#0f172a)', marginBottom: 12 }}>Monthly Procurement Spend</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: vq.slate[900] }}>{fmt(spend)}</div>
                            <div style={{ fontSize: 11, color: vq.slate[500], marginTop: 4, marginBottom: 14 }}>Total purchases this month</div>
                            {budget > 0 && (
                                <>
                                    <div style={{ height: 6, background: vq.slate[100], borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, (spend / budget) * 100)}%`, height: '100%', background: spend > budget ? vq.red[500] : vq.indigo[500], borderRadius: 4, transition: 'width 0.6s' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: vq.slate[400], marginTop: 6 }}>{Math.round((spend / budget) * 100)}% of {fmt(budget)} budget used</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
