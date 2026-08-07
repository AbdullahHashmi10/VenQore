import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ShoppingCart, Clock, TrendingUp, LogIn, CheckCircle2,
    DollarSign, Package, ArrowRight, Zap
} from 'lucide-react';

// ─── Small stat tile ────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, sub, color = '#6366f1' }) {
    return (
        <div style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--card-border, #f1f5f9)',
            borderRadius: 20,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={22} color={color} />
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main, #0f172a)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub, #64748b)', marginTop: 3 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

export default function CashierDashboard({ session, attendance }) {
    const { auth, store, my_display_name } = usePage().props;

    const storeSlug = store?.slug;

    const txCount    = session?.transaction_count ?? 0;
    const sessionAmt = session?.session_total ?? 0;
    const clockIn    = attendance?.clock_in_time ?? null;
    const isWorking  = !!clockIn;

    const formatCurrency = (v) =>
        (store?.currency_symbol ?? '$ ') + Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 });

    const hoursWorked = () => {
        if (!clockIn) return '—';
        const start = new Date(clockIn);
        const now   = new Date();
        const hrs   = Math.floor((now - start) / 3600000);
        const mins  = Math.floor(((now - start) % 3600000) / 60000);
        return `${hrs}h ${mins}m`;
    };

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="My Dashboard" />

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>

                {/* Greeting */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                        👋 Hey, {my_display_name ?? auth?.user?.name ?? 'there'}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-sub, #64748b)', marginTop: 4 }}>
                        {store?.name} &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Primary CTA — Open POS */}
                <button
                    onClick={() => router.visit(route('store.pos', { store_slug: storeSlug }))}
                    style={{
                        width: '100%', padding: '22px 28px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', borderRadius: 20, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 24,
                        boxShadow: '0 8px 28px rgba(99,102,241,0.35)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(99,102,241,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.35)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={26} color="#fff" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Open POS Terminal</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Process sales, payments &amp; returns</div>
                        </div>
                    </div>
                    <ArrowRight size={22} color="rgba(255,255,255,0.8)" />
                </button>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
                    <StatTile
                        icon={ShoppingCart}
                        label="Transactions Today"
                        value={txCount}
                        sub="This session"
                        color="#6366f1"
                    />
                    <StatTile
                        icon={DollarSign}
                        label="Session Total"
                        value={formatCurrency(sessionAmt)}
                        sub="Cash collected"
                        color="#10b981"
                    />
                    <StatTile
                        icon={Clock}
                        label="Time on Shift"
                        value={hoursWorked()}
                        sub={clockIn ? 'Since ' + new Date(clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Not clocked in'}
                        color={isWorking ? '#f59e0b' : '#94a3b8'}
                    />
                </div>

                {/* Attendance Card */}
                <div style={{
                    background: 'var(--card-bg, #fff)',
                    border: '1px solid var(--card-border, #f1f5f9)',
                    borderRadius: 20, padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: isWorking ? '#10b98115' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isWorking ? <CheckCircle2 size={20} color="#10b981" /> : <LogIn size={20} color="#94a3b8" />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main, #0f172a)' }}>
                                {isWorking ? 'You\'re clocked in' : 'Not yet clocked in'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-sub, #64748b)', marginTop: 2 }}>
                                {isWorking
                                    ? `Since ${new Date(clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                                    : 'Use the POS to start your shift'}
                            </div>
                        </div>
                    </div>
                    {isWorking && (
                        <div style={{ padding: '5px 12px', borderRadius: 8, background: '#10b98112', border: '1px solid #10b98125', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                            Active
                        </div>
                    )}
                </div>

                {/* Restricted Access Notice */}
                <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Package size={14} color="#94a3b8" />
                    Need access to reports, inventory, or finances? Contact your Store Manager or Owner.
                </div>

            </div>
        </OneGlanceLayout>
    );
}
