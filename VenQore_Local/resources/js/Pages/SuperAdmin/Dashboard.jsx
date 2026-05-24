import React, { useState, useEffect, useContext, createContext } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    LayoutDashboard, Building2, Users, TrendingUp, DollarSign,
    AlertTriangle, CheckCircle2, Clock, Crown, Zap, Shield, Search,
    ChevronRight, ArrowUpRight, ArrowDownRight, Globe, HardDrive,
    RefreshCw, Ban, Unlock, Activity, Bell, Settings, LogOut,
    MoreVertical, Eye, Pause, Play, ChevronDown, Package,
    Newspaper, BarChart2, Ticket, Rss, UserCog, Sparkles,
    CalendarClock, Star, AlertCircle, Info, Lock, KeyRound, EyeOff,
    ShieldCheck, Hash, Menu, Trash2, RotateCcw
} from 'lucide-react';

// ─── Theme Context (consumed by all sub-components) ────────────────────────
const ThemeCtx = createContext({});
const useTheme = () => useContext(ThemeCtx);

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    active:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Active',    Icon: CheckCircle2 },
    trial:     { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', label: 'Trial',     Icon: Clock },
    suspended: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Suspended', Icon: AlertTriangle },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  label: 'Churned',   Icon: Ban },
};

const PLAN_CONFIG = {
    trial:    { color: '#64748b', label: 'Trial',    emoji: '🎁', price: 0 },
    starter:  { color: '#6366f1', label: 'Starter',  emoji: '⚡', price: 19 },
    growth:   { color: '#8b5cf6', label: 'Growth',   emoji: '🚀', price: 39 },
    business: { color: '#f59e0b', label: 'Business', emoji: '👑', price: 79 },
    ltd:      { color: '#10b981', label: 'LTD',      emoji: '♾️', price: 0 },
};

const TABS = [
    { id: 'overview',  label: 'Overview',        Icon: LayoutDashboard },
    { id: 'stores',    label: 'Stores',          Icon: Building2 },
    { id: 'users',     label: 'Platform Users',  Icon: UserCog },
    { id: 'revenue',   label: 'Revenue',         Icon: TrendingUp },
    { id: 'support',   label: 'Support',         Icon: Ticket },
    { id: 'feed',      label: 'Activity Feed',   Icon: Rss },
    { id: 'settings',  label: 'Settings',        Icon: Settings },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function Pill({ children, color = '#6366f1', icon: Icon }) {
    return (
        <span style={{
            background: color + '18',
            color,
            border: `1px solid ${color}30`,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.03em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            textTransform: 'uppercase',
        }}>
            {Icon && <Icon size={10} />}
            {children}
        </span>
    );
}

function KpiCard({ label, value, sub, Icon, color, trend, onClick }) {
    const T = useTheme();
    return (
        <div
            onClick={onClick}
            style={{
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                padding: '20px 24px',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                boxShadow: T.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.boxShadow = T.isDark ? 'none' : `0 4px 16px ${color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = T.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)'; }}
        >
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: color + '14', borderRadius: '50%', filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '15', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                </div>
                {trend != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: trend >= 0 ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                )}
            </div>
            <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: T.textSub, marginTop: 4, fontWeight: 500 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>{sub}</div>}
            </div>
        </div>
    );
}

function StoreRow({ store, onSuspend, onActivate, onExtend, onImpersonate }) {
    const [open, setOpen] = useState(false);
    const T = useTheme();
    const status = STATUS_CONFIG[store.status] || STATUS_CONFIG.trial;
    const plan   = PLAN_CONFIG[store.plan]    || PLAN_CONFIG.trial;
    const StatusIcon = status.Icon;

    return (
        <tr style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.bgCardHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            <td style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: plan.color + '18', border: `1px solid ${plan.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {plan.emoji}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{store.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{store.slug}</div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{store.owner_name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{store.owner_email}</div>
            </td>
            <td style={{ padding: '14px 16px' }}>
                <Pill color={plan.color}>{plan.label}</Pill>
            </td>
            <td style={{ padding: '14px 16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: status.bg, color: status.color, border: `1px solid ${status.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    <StatusIcon size={10} />
                    {status.label}
                </span>
                {store.days_left != null && store.status === 'trial' && (
                    <div style={{ fontSize: 11, color: store.days_left <= 2 ? '#ef4444' : '#f59e0b', marginTop: 4 }}>
                        {Math.ceil(store.days_left)}d left
                    </div>
                )}
            </td>
            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>{store.staff_count} staff</td>
            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>{store.created_at}</td>
            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    {store.owner_user_id && (
                        <button onClick={() => onImpersonate(store.owner_user_id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={10} /> View
                        </button>
                    )}
                    {store.status === 'active' || store.status === 'trial' ? (
                        <button onClick={() => onSuspend(store.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Pause size={10} /> Suspend
                        </button>
                    ) : (
                        <button onClick={() => onActivate(store.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Play size={10} /> Activate
                        </button>
                    )}
                    {store.status === 'trial' && (
                        <button onClick={() => onExtend(store.id, 7)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CalendarClock size={10} /> +7d
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function StoreCard({ store, onSuspend, onActivate, onExtend, onImpersonate }) {
    const T = useTheme();
    const [open, setOpen] = useState(false);
    const status = STATUS_CONFIG[store.status] || STATUS_CONFIG.trial;
    const plan   = PLAN_CONFIG[store.plan]    || PLAN_CONFIG.trial;
    const StatusIcon = status.Icon;
    const isDark = T.isDark;

    return (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: plan.color + '18', border: `1px solid ${plan.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {plan.emoji}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{store.name}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{store.slug}</div>
                    </div>
                </div>
                <Pill color={plan.color}>{plan.label}</Pill>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12 }}>
                <div>
                    <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase', marginBottom: 2, letterSpacing: '0.05em' }}>Owner</div>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{store.owner_name}</div>
                    <div style={{ fontSize: 11, color: T.textSub, overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.owner_email}</div>
                </div>
                <div>
                    <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase', marginBottom: 2, letterSpacing: '0.05em' }}>Status</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: status.color, fontSize: 12, fontWeight: 700 }}>
                        <StatusIcon size={12} /> {status.label}
                    </span>
                    {store.days_left != null && store.status === 'trial' && (
                        <div style={{ fontSize: 11, color: store.days_left <= 2 ? '#ef4444' : '#f59e0b' }}>
                            {Math.ceil(store.days_left)}d remaining
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                {store.owner_user_id && (
                    <button onClick={() => onImpersonate(store.owner_user_id)} style={{ flex: 1, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Eye size={14} /> View Store
                    </button>
                )}
                <button onClick={() => setOpen(!open)} style={{ background: T.bgCard, color: T.text, border: `1px solid ${T.border}`, padding: '10px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {open && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px', background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)', borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Quick Actions</div>
                    {store.status === 'active' || store.status === 'trial' ? (
                        <button onClick={() => { onSuspend(store.id); setOpen(false); }} style={{ padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontSize: 12, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Pause size={14} /> Suspend Store
                        </button>
                    ) : (
                        <button onClick={() => { onActivate(store.id); setOpen(false); }} style={{ padding: '10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', fontSize: 12, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Play size={14} /> Activate Store
                        </button>
                    )}
                    {store.status === 'trial' && (
                        <button onClick={() => { onExtend(store.id, 7); setOpen(false); }} style={{ padding: '10px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'none', fontSize: 12, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarClock size={14} /> Extend Trial (+7d)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab: Overview
// ─────────────────────────────────────────────────────────────────────────

function OverviewTab({ stats, store_trend, plan_distribution, recent_stores, expiring_stores }) {
    const T = useTheme();
    const totalPct = stats.total_stores > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* KPI Row */}
            <div className="hq-grid-4">
                <KpiCard label="Monthly Recurring Revenue" value={`$${stats.mrr.toLocaleString()}`} sub={`$${(stats.arr || 0).toLocaleString()} ARR projected`} Icon={DollarSign} color="#10b981" trend={1} />
                <KpiCard label="Total Stores" value={stats.total_stores} sub={`+${stats.new_today} today · +${stats.new_this_month} this month`} Icon={Building2} color="#6366f1" trend={1} />
                <KpiCard label="Active Trials" value={stats.trial_stores} sub={`Conversion rate: ${stats.conversion_rate}%`} Icon={Clock} color="#8b5cf6" trend={stats.conversion_rate > 20 ? 1 : -1} />
                <KpiCard label="Expiring Soon" value={stats.expiring_soon} sub="Trials ending in 7 days" Icon={AlertTriangle} color="#ef4444" trend={-1} />
            </div>

            {/* Second KPI Row */}
            <div className="hq-grid-4">
                <KpiCard label="Active Paid" value={stats.active_stores} sub="Paying subscribers" Icon={CheckCircle2} color="#10b981" />
                <KpiCard label="Suspended" value={stats.suspended_stores} sub={`${stats.cancelled_last_30} cancelled last 30d`} Icon={Pause} color="#f59e0b" />
                <KpiCard label="Total Users" value={stats.total_users} sub={`${stats.store_users} store users`} Icon={Users} color="#0ea5e9" />
                <KpiCard label="Trash (Stores)" value={stats.total_deleted_stores} sub="Deleted stores available to restore" Icon={Trash2} color="#ef4444" onClick={() => router.get(route('admin.stores'), { trashed: true })} />
            </div>

            <div className="hq-grid-4">
                 <KpiCard label="Trash (Users)" value={stats.deleted_users} sub="Deleted users available to restore" Icon={Trash2} color="#f87171" onClick={() => router.get(route('store.admin.users', { store_slug: store.slug }), { trashed: true })} />
                 <KpiCard label="Churned" value={stats.churned_stores} sub="Cancelled all-time" Icon={Ban} color="#ef4444" />
                 <div style={{ gridColumn: 'span 2' }}></div>
            </div>

            {/* Charts Row */}
            <div className="hq-grid-chart">
                {/* Store Growth Chart */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Store Growth</div>
                            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>New registrations per month</div>
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>+{stats.new_this_month}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={store_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="storeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} padding={{ left: 10, right: 10 }} />
                            <YAxis width={30} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={true} tickLine={false} allowDecimals={false} stroke="rgba(255,255,255,0.2)" />
                            <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: 12 }} />
                            <Area type="monotone" dataKey="stores" stroke="#6366f1" fill="url(#storeGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Plan Distribution */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15, marginBottom: 20 }}>Plan Distribution</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {plan_distribution.map(p => {
                            const cfg = PLAN_CONFIG[p.plan] || PLAN_CONFIG.trial;
                            const pct = stats.total_stores > 0 ? Math.round((p.count / stats.total_stores) * 100) : 0;
                            return (
                                <div key={p.plan}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                            <span>{cfg.emoji}</span>{cfg.label}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>{p.count}</span>
                                            {p.mrr > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>${p.mrr}/mo</span>}
                                        </div>
                                    </div>
                                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 4, transition: 'width 0.7s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { label: 'Active', value: stats.active_stores, color: '#10b981' },
                            { label: 'Trial',  value: stats.trial_stores,  color: '#6366f1' },
                            { label: 'Susp.',  value: stats.suspended_stores, color: '#f59e0b' },
                            { label: 'Churned', value: stats.churned_stores, color: '#ef4444' },
                        ].map(m => (
                            <div key={m.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expiring Soon Alert */}
            {expiring_stores.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <AlertCircle size={16} color="#ef4444" />
                        <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: 14 }}>⏰ Trials Expiring This Week — Needs Action</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                        {expiring_stores.map(s => (
                            <div key={s.id} style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#f87171', fontSize: 13 }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.owner_email}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 16 }}>{Math.ceil(s.days_left)}d</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>remaining</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Stores */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Recent Signups</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Latest 10 registered stores</div>
                    </div>
                </div>
                <div style={{ padding: 8 }}>
                    {recent_stores.map(s => {
                        const status = STATUS_CONFIG[s.status] || STATUS_CONFIG.trial;
                        const plan = PLAN_CONFIG[s.plan] || PLAN_CONFIG.trial;
                        const StatusIcon = status.Icon;
                        return (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderRadius: 10, transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: plan.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{plan.emoji}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>{s.owner_email}</div>
                                </div>
                                <Pill color={plan.color}>{plan.label}</Pill>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: status.bg, color: status.color, border: `1px solid ${status.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                    <StatusIcon size={9} />{status.label}
                                </span>
                                {!s.setup_done && <Pill color="#f59e0b">Setup Pending</Pill>}
                                <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>{s.created_at}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab: Stores
// ─────────────────────────────────────────────────────────────────────────

function StoresTab({ stores, onSuspend, onActivate, onExtend, onImpersonate }) {
    const T = useTheme();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = stores.filter(s => {
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.owner_email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0 14px' }}>
                    <Search size={14} color="#64748b" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 13, padding: '12px 0' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: isMobile ? 8 : 0, paddingRight: isMobile ? 24 : 0, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {['all', 'active', 'trial', 'suspended', 'cancelled'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${statusFilter === s ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: statusFilter === s ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: statusFilter === s ? '#a5b4fc' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* List area */}
            {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map(store => (
                        <StoreCard key={store.id} store={store} onSuspend={onSuspend} onActivate={onActivate} onExtend={onExtend} onImpersonate={onImpersonate} />
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: 48, textAlign: 'center', color: '#475569', fontSize: 13 }}>No stores found.</div>
                    )}
                </div>
            ) : (
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Store', 'Owner', 'Plan', 'Status', 'Staff', 'Joined', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(store => (
                                <StoreRow key={store.id} store={store} onSuspend={onSuspend} onActivate={onActivate} onExtend={onExtend} onImpersonate={onImpersonate} />
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#475569', fontSize: 13 }}>No stores match your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab: Platform Users
// ─────────────────────────────────────────────────────────────────────────

function PlatformUsersTab({ platform_users }) {
    const T = useTheme();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Info size={15} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#a5b4fc', lineHeight: 1.6 }}>
                    <strong>V1 — Platform Owner Only.</strong> Additional Tier 1 roles are provisioned in V2.
                </div>
            </div>

            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Platform HQ Team</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Users with is_platform_admin = true.</div>
                </div>

                {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: T.border }}>
                        {platform_users.map(u => (
                            <div key={u.id} style={{ padding: 16, background: T.bgCard, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>
                                        {u.name[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{u.name}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
                                    </div>
                                    <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        {u.role}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                                    <span>Last Active</span>
                                    <span>{u.last_login}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['User', 'Role', 'Last Active', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {platform_users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14 }}>
                                                {u.name[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{u.name}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                            <Crown size={10} /> {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13 }}>{u.last_login}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                            <CheckCircle2 size={9} /> Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab: Revenue
// ─────────────────────────────────────────────────────────────────────────

function RevenueTab({ stats }) {
    const T = useTheme();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16 }}>
                <KpiCard label="Monthly Recurring Revenue" value={`$${stats.mrr.toLocaleString()}`} sub="Live estimate from plan data" Icon={DollarSign} color="#10b981" />
                <KpiCard label="Annual Recurring Revenue" value={`$${(stats.arr || 0).toLocaleString()}`} sub="MRR × 12 projected" Icon={TrendingUp} color="#6366f1" />
                <KpiCard label="Churned This Month" value={stats.cancelled_last_30} sub="Cancelled subscriptions" Icon={Ban} color="#ef4444" trend={-1} />
            </div>

            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? 24 : 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart2 size={24} color="#6366f1" />
                </div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 16, textAlign: 'center' }}>Lemon Squeezy Revenue Dashboard</div>
                <div style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 420, lineHeight: 1.7 }}>
                    Per the V1 architecture plan, detailed revenue charts (MRR growth, churn rate, LTD split)
                    are deferred to V2. In V1, the Lemon Squeezy dashboard provides this data.
                </div>
                <a href="https://app.lemonsqueezy.com" target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={14} /> Open Lemon Squeezy <ArrowUpRight size={12} />
                </a>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// Tab: Support
// ─────────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    urgent: { color: '#ef4444', label: 'Urgent' },
    high:   { color: '#f97316', label: 'High' },
    normal: { color: '#6366f1', label: 'Normal' },
    low:    { color: '#64748b', label: 'Low' },
};

const TICKET_STATUS = {
    open:        { color: '#6366f1', label: 'Open' },
    in_progress: { color: '#f59e0b', label: 'In Progress' },
    resolved:    { color: '#10b981', label: 'Resolved' },
    closed:      { color: '#64748b', label: 'Closed' },
};

function SupportTab({ tickets = [], open_count = 0, tickets_total = 0, active_filter = 'open' }) {
    const T = useTheme();
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [filter, setFilter] = useState(active_filter);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    function sendReply() {
        if (!reply.trim() || !selected) return;
        router.post(`/admin/tickets/${selected.id}/reply`, { body: reply }, {
            onSuccess: () => { setReply(''); setSelected(null); },
        });
    }

    function setStatus(ticket, status) {
        router.post(`/admin/tickets/${ticket.id}/status`, { status }, {
            onSuccess: () => setSelected(null),
        });
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: (!isMobile && selected) ? '1fr 400px' : '1fr', gap: 20 }}>
            {/* Ticket List */}
            {(!selected || !isMobile) && (
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
                        <div>
                            <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Support Inbox</div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{open_count} open · {tickets_total} total</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: isMobile ? 4 : 0 }}>
                            {['open', 'in_progress', 'resolved', 'all'].map(s => (
                                <button key={s} onClick={() => setFilter(s)}
                                    style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid ' + (filter === s ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'), background: filter === s ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === s ? '#a5b4fc' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    {tickets.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
                            <Ticket size={28} style={{ margin: '0 auto 12px', display: 'block' }} />
                            <div style={{ fontSize: 14 }}>No {filter} tickets. 🎉</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {tickets.map((t, i) => {
                                const pr = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.normal;
                                const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.open;
                                return (
                                    <div key={t.id} onClick={() => setSelected(t)}
                                        style={{ padding: '14px 20px', borderBottom: i < tickets.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', background: selected?.id === t.id ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'background 0.15s' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: T.text, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{t.tenant?.name ?? 'No Store'} · {t.requester_email ?? t.submitted_by?.email}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: pr.color, background: pr.color + '18', padding: '2px 7px', borderRadius: 5 }}>{pr.label}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: st.color }}>{st.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Thread / Reply Panel */}
            {selected && (
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: isMobile ? 'fixed' : 'relative', inset: isMobile ? 0 : 'auto', zIndex: isMobile ? 1100 : 1 }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: isMobile ? T.bgCard : 'transparent' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{selected.subject}</div>
                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{selected.tenant?.name}</div>
                        </div>
                        <button onClick={() => setSelected(null)} style={{ color: T.textSub, background: isMobile ? 'rgba(255,255,255,0.05)' : 'none', border: 'none', cursor: 'pointer', padding: isMobile ? '8px 12px' : 4, borderRadius: 8 }}>✕</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {/* Status controls */}
                        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {['in_progress', 'resolved', 'closed'].map(s => (
                                <button key={s} onClick={() => setStatus(selected, s)}
                                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${TICKET_STATUS[s].color}30`, background: TICKET_STATUS[s].color + '10', color: TICKET_STATUS[s].color, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                                    → {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px', fontSize: 13, color: T.text, lineHeight: 1.6, border: `1px solid ${T.border}` }}>
                                {selected.message}
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8, fontWeight: 700, textTransform: 'uppercase' }}>Original Inquiry</div>
                            </div>
                            {(selected.replies ?? []).map((r, i) => (
                                <div key={i} style={{ background: r.is_platform_owner ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px', fontSize: 13, color: T.text, lineHeight: 1.6, border: `1px solid ${T.border}`, alignSelf: r.is_platform_owner ? 'flex-end' : 'flex-start', maxWidth: '95%' }}>
                                    {r.body}
                                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{r.is_platform_owner ? '🛡 Platform Owner' : r.author?.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reply Box */}
                    <div style={{ padding: '16px 18px', borderTop: `1px solid ${T.border}`, background: isMobile ? T.bgCard : 'transparent' }}>
                        <textarea value={reply} onChange={e => setReply(e.target.value)}
                            placeholder="Write a reply…"
                            rows={isMobile ? 2 : 4}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px', color: T.text, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button onClick={sendReply} style={{ marginTop: 10, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                            Send Reply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab: Activity Feed
// ─────────────────────────────────────────────────────────────────────────

function FeedTab({ activity_feed }) {
    const T = useTheme();
    const colorMap = { indigo: '#6366f1', amber: '#f59e0b', red: '#ef4444', emerald: '#10b981', sky: '#0ea5e9' };
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (!activity_feed || activity_feed.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 60, color: '#475569' }}>
                <Rss size={32} />
                <div style={{ fontSize: 14 }}>No activity yet.</div>
            </div>
        );
    }

    return (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: isMobile ? '16px 20px' : '16px 24px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Platform Activity River</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Real-time events across all stores</div>
            </div>
            <div style={{ padding: '4px 0' }}>
                {activity_feed.map((item, i) => {
                    const color = colorMap[item.color] || '#6366f1';
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: isMobile ? '12px 20px' : '12px 24px', borderBottom: i < activity_feed.length - 1 ? `1px solid ${T.border}33` : 'none', transition: 'background 0.15s' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{item.message}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{item.sub}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// Tab: Settings (Feature Flags + Webhook Logs + Security)
// ─────────────────────────────────────────────────────────────────────────

function SecuritySection() {
    const T = useTheme();
    const { props } = usePage();
    const flash = props.flash || {};

    // Change Password Form
    const pwForm = useForm({ current_password: '', password: '', password_confirmation: '' });
    const [showPw, setShowPw] = useState({ cur: false, new: false, con: false });

    // Set PIN Form
    const pinForm = useForm({ current_password: '', pin: '', pin_confirmation: '' });

    // Clear PIN
    const [clearPw, setClearPw] = useState('');
    const [hasDashPin, setHasDashPin] = useState(false);

    const cardStyle = {
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 16, padding: 24,
        boxShadow: T.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
    };

    const inputStyle = {
        width: '100%', padding: '10px 12px',
        background: T.isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
        border: `1px solid ${T.border}`, borderRadius: 10,
        color: T.text, fontSize: 13, outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    };

    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' };

    const btnStyle = {
        padding: '10px 18px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
        transition: 'all 0.2s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Success banner */}
            {(flash.security_success || props.security_success) && (
                <div style={{
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
                    color: '#10b981', fontSize: 13, fontWeight: 600,
                }}>
                    <ShieldCheck size={16} /> {flash.security_success || props.security_success}
                </div>
            )}

            {/* Change Password */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={16} color="#6366f1" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Change Password</div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>Update your Platform HQ login password</div>
                    </div>
                </div>

                <form onSubmit={e => { e.preventDefault(); pwForm.post(route('admin.platform.change-password'), { onSuccess: () => pwForm.reset() }); }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={labelStyle}>Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPw.cur ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }}
                                value={pwForm.data.current_password}
                                onChange={e => pwForm.setData('current_password', e.target.value)}
                                placeholder="Your current password" />
                            <button type="button" onClick={() => setShowPw(s => ({ ...s, cur: !s.cur }))}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0 }}>
                                {showPw.cur ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {pwForm.errors.current_password && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{pwForm.errors.current_password}</div>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPw.new ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }}
                                    value={pwForm.data.password}
                                    onChange={e => pwForm.setData('password', e.target.value)}
                                    placeholder="Min 8 characters" />
                                <button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0 }}>
                                    {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {pwForm.errors.password && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{pwForm.errors.password}</div>}
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPw.con ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 40 }}
                                    value={pwForm.data.password_confirmation}
                                    onChange={e => pwForm.setData('password_confirmation', e.target.value)}
                                    placeholder="Repeat new password" />
                                <button type="button" onClick={() => setShowPw(s => ({ ...s, con: !s.con }))}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0 }}>
                                    {showPw.con ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button type="submit" style={btnStyle} disabled={pwForm.processing}>
                            <Lock size={13} /> {pwForm.processing ? 'Saving…' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>

            {/* PIN Setup */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Hash size={16} color="#8b5cf6" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Quick PIN Login</div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>Set a 4–8 digit PIN for faster access to Platform HQ</div>
                    </div>
                </div>

                <form onSubmit={e => { e.preventDefault(); pinForm.post(route('admin.platform.set-passcode'), { onSuccess: () => pinForm.reset() }); }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={labelStyle}>Confirm with Current Password</label>
                        <input type="password" style={inputStyle}
                            value={pinForm.data.current_password}
                            onChange={e => pinForm.setData('current_password', e.target.value)}
                            placeholder="Your login password" />
                        {pinForm.errors.current_password && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{pinForm.errors.current_password}</div>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>New PIN (4–8 digits)</label>
                            <input type="password" inputMode="numeric" maxLength={8} style={inputStyle}
                                value={pinForm.data.pin}
                                onChange={e => pinForm.setData('pin', e.target.value.replace(/\D/g, ''))}
                                placeholder="e.g. 123456" />
                            {pinForm.errors.pin && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{pinForm.errors.pin}</div>}
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm PIN</label>
                            <input type="password" inputMode="numeric" maxLength={8} style={inputStyle}
                                value={pinForm.data.pin_confirmation}
                                onChange={e => pinForm.setData('pin_confirmation', e.target.value.replace(/\D/g, ''))}
                                placeholder="Repeat PIN" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" style={{ ...btnStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }} disabled={pinForm.processing}>
                            <KeyRound size={13} /> {pinForm.processing ? 'Saving…' : 'Set PIN'}
                        </button>
                        <button type="button"
                            style={{ ...btnStyle, background: 'rgba(239,68,68,0.12)', color: '#ef4444', boxShadow: 'none', border: '1px solid rgba(239,68,68,0.2)' }}
                            onClick={() => {
                                if (!clearPw) { alert('Enter your password below the buttons first.'); return; }
                                router.post(route('admin.platform.clear-passcode'), { current_password: clearPw }, {
                                    onSuccess: () => setClearPw(''),
                                });
                            }}>
                            Remove PIN
                        </button>
                    </div>
                    <div>
                        <label style={labelStyle}>Password to Remove PIN</label>
                        <input type="password" style={{ ...inputStyle, maxWidth: 260 }}
                            value={clearPw} onChange={e => setClearPw(e.target.value)}
                            placeholder="Only needed to remove PIN" />
                    </div>
                </form>
            </div>
        </div>
    );
}

function SettingsTab({ stores = [], webhooks = [] }) {
    const T = useTheme();
    const [activeSection, setActiveSection] = useState('security');
    const [selectedStore, setSelectedStore] = useState(null);

    const TOGGLEABLE = [
        { key: 'woocommerce',       label: 'WooCommerce Sync',  sub: 'Enable WooCommerce product / order sync' },
        { key: 'api_access',        label: 'API Access',         sub: 'Allow REST API key generation' },
        { key: 'growth_engine',     label: 'AI Growth Engine',   sub: 'AI recommendations and retention engine' },
        { key: 'multi_branch',      label: 'Multi-Branch',       sub: 'Multiple locations / warehouses' },
        { key: 'advanced_reports',  label: 'Advanced Reports',   sub: 'Full 38-report pack access' },
    ];

    const WEBHOOK_STATUS = { received: '#6366f1', processed: '#10b981', failed: '#ef4444' };

    function toggle(tenant, feature, currentValue) {
        router.post(route('admin.store.feature-flag', tenant.id), {
            feature, enabled: !currentValue
        }, { preserveScroll: true });
    }

    const store = selectedStore ? stores.find(s => s.id === selectedStore) : null;

    const sectBtnStyle = (id) => ({
        padding: '7px 16px', borderRadius: 9,
        border: `1px solid ${activeSection === id ? 'rgba(99,102,241,0.5)' : T.border}`,
        background: activeSection === id ? 'rgba(99,102,241,0.12)' : 'transparent',
        color: activeSection === id ? '#a5b4fc' : T.textMuted,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Section Nav */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setActiveSection('security')} style={sectBtnStyle('security')}><ShieldCheck size={13} /> Security & Profile</button>
                <button onClick={() => setActiveSection('flags')} style={sectBtnStyle('flags')}>Feature Flags</button>
                <button onClick={() => setActiveSection('webhooks')} style={sectBtnStyle('webhooks')}>Webhook Logs</button>
            </div>

            {activeSection === 'security' && <SecuritySection />}

            {/* Feature Flags */}
            {activeSection === 'flags' && (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
                    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Store</div>
                        {stores.map(s => (
                            <div key={s.id} onClick={() => setSelectedStore(s.id)}
                                style={{ padding: '10px 16px', cursor: 'pointer', background: selectedStore === s.id ? 'rgba(99,102,241,0.1)' : 'transparent', borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                                onMouseEnter={e => { if (selectedStore !== s.id) e.currentTarget.style.background = T.bgCardHover; }}
                                onMouseLeave={e => { if (selectedStore !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: selectedStore === s.id ? '#a5b4fc' : T.text }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{s.plan}</div>
                            </div>
                        ))}
                        {stores.length === 0 && <div style={{ padding: 16, color: T.textMuted, fontSize: 12 }}>No stores yet.</div>}
                    </div>

                    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
                        {!store ? (
                            <div style={{ color: T.textMuted, fontSize: 13, padding: '32px 0', textAlign: 'center' }}>← Select a store to configure feature flags</div>
                        ) : (
                            <>
                                <div style={{ fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 4 }}>{store.name}</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Plan: {store.plan}</div>
                                {TOGGLEABLE.map(f => {
                                    const override = store.plan_limits?.[f.key];
                                    const isEnabled = override === true || (override !== false && !!store.plan_limits?.[f.key]);
                                    return (
                                        <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${T.border}` }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{f.label}</div>
                                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{f.sub}</div>
                                            </div>
                                            <button onClick={() => toggle(store, f.key, isEnabled)}
                                                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: isEnabled ? '#6366f1' : (T.isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'), cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isEnabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Webhook Logs */}
            {activeSection === 'webhooks' && (
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 700, color: T.text, fontSize: 14 }}>
                        Lemon Squeezy Webhook Log <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400 }}>— last 100 events</span>
                    </div>
                    {webhooks.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>No webhook events yet.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    {['Event', 'Store', 'Plan', 'Status', 'Time'].map(h => (
                                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {webhooks.map((w, i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                        <td style={{ padding: '10px 16px', fontSize: 12, color: T.textSub, fontFamily: 'monospace' }}>{w.event_type}</td>
                                        <td style={{ padding: '10px 16px', fontSize: 12, color: T.text }}>{w.store_name ?? '—'}</td>
                                        <td style={{ padding: '10px 16px', fontSize: 12, color: T.textMuted }}>{w.plan ?? '—'}</td>
                                        <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, color: WEBHOOK_STATUS[w.status] ?? T.textMuted }}>{w.status}</span></td>
                                        <td style={{ padding: '10px 16px', fontSize: 11, color: T.textMuted }}>{new Date(w.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}




// ─────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────

export default function PlatformOwnerDashboard({
    stats,
    store_trend,
    plan_distribution,
    recent_stores,
    expiring_stores,
    activity_feed,
    platform_users,
    tickets,
    tickets_total,
    open_count,
    active_filter,
    webhooks,
}) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');
    const [flash, setFlash] = useState(null);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('hq-theme') || 'dark';
        return 'dark';
    });
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') return window.innerWidth > 768;
        return true;
    });

    const isDark = theme === 'dark';

    const toggleTheme = () => {
        const next = isDark ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('hq-theme', next);
    };

    // Design tokens
    const T = isDark ? {
        bg: '#080c14',
        bgCard: 'rgba(255,255,255,0.03)',
        bgCardHover: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.07)',
        borderAccent: 'rgba(99,102,241,0.35)',
        navBg: 'rgba(8,12,20,0.92)',
        text: '#f1f5f9',
        textSub: '#94a3b8',
        textMuted: '#475569',
        tabActive: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', color: '#a5b4fc' },
        tabInactive: { bg: 'transparent', border: 'transparent', color: '#64748b' },
        isDark: true,
    } : {
        bg: '#f0f4f8',
        bgCard: '#ffffff',
        bgCardHover: '#f8fafc',
        border: 'rgba(0,0,0,0.09)',
        borderAccent: 'rgba(99,102,241,0.4)',
        navBg: 'rgba(255,255,255,0.97)',
        text: '#0f172a',
        textSub: '#374151',
        textMuted: '#6b7280',
        tabActive: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.4)', color: '#4f46e5' },
        tabInactive: { bg: 'transparent', border: 'transparent', color: '#6b7280' },
        isDark: false,
    };

    const safeStats = {
        total_stores: 0, active_stores: 0, trial_stores: 0,
        suspended_stores: 0, churned_stores: 0, new_today: 0,
        new_this_month: 0, cancelled_last_30: 0, expiring_soon: 0,
        conversion_rate: 0, total_users: 0, platform_admins: 1,
        store_users: 0, mrr: 0, arr: 0,
        ...(stats || {}),
    };

    function handleSuspend(tenantId) {
        router.post(`/VenQore/stores/${tenantId}/suspend`, {}, {
            onSuccess: () => setFlash({ type: 'success', msg: 'Store suspended.' }),
        });
    }
    function handleActivate(tenantId) {
        router.post(`/VenQore/stores/${tenantId}/activate`, {}, {
            onSuccess: () => setFlash({ type: 'success', msg: 'Store activated.' }),
        });
    }
    function handleExtend(tenantId, days) {
        router.post(`/VenQore/stores/${tenantId}/extend-trial`, { days }, {
            onSuccess: () => setFlash({ type: 'success', msg: `Trial extended by ${days} days.` }),
        });
    }
    function handleImpersonate(userId) {
        if (!confirm('Start impersonation session for this store owner?')) return;
        router.post(`/VenQore/impersonate/${userId}`);
    }

    useEffect(() => {
        if (flash) { const t = setTimeout(() => setFlash(null), 3500); return () => clearTimeout(t); }
    }, [flash]);

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <ThemeCtx.Provider value={T}>
        <>
            <Head title="VenQore — Platform HQ" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
                @keyframes flash-slide-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes theme-fade { from { opacity: 0.7; } to { opacity: 1; } }
                .hq-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                .hq-grid-chart { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }

            `}</style>
            
            <style>{`
                .hq-sidebar { flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s; z-index: 1000; }
                .hq-sidebar-open { width: 260px; transform: translateX(0); }
                .hq-sidebar-closed { width: 74px; align-items: center; transform: translateX(0); }
                .hq-sidebar-closed .hq-sidebar-text, .hq-sidebar-closed .hq-sidebar-logo-text { display: none; }
                
                .hq-main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; height: 100vh; min-width: 0; }
                .hq-layout-root { display: flex; flex-direction: row; min-height: 100vh; width: 100vw; overflow: hidden; }
                .mobile-only { display: none !important; }
                
                @media (max-width: 768px) {
                    .mobile-only { display: flex !important; }
                    .hq-sidebar { position: fixed !important; top: 0; left: 0; height: 100vh; background: ${isDark ? '#080c14' : '#fff'} !important; box-shadow: 20px 0 50px rgba(0,0,0,0.3); width: 280px !important; }
                    .hq-sidebar-closed { transform: translateX(-100%) !important; }
                    .hq-sidebar-open { transform: translateX(0) !important; }
                    .hq-sidebar-text, .hq-sidebar-logo-text { display: flex !important; }

                    .hq-grid-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
                    .hq-grid-chart { grid-template-columns: 1fr !important; gap: 16px !important; }
                    
                    .hq-page-padding { padding: 16px 12px 100px !important; width: 100% !important; box-sizing: border-box !important; margin: 0 !important; }
                    .hq-nav-padding { padding: 16px 12px !important; min-height: 120px; }
                    .hq-greeting-area { padding: 16px 12px !important; min-height: 120px; }
                    .hq-right-date { display: none !important; }

                    .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
                    .sidebar-overlay-active { opacity: 1; pointer-events: auto; }
                    
                    main.hq-main-content { overflow-x: hidden !important; width: 100vw !important; }
                }
            `}</style>

            <div className="hq-layout-root" style={{ background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", transition: 'background 0.3s ease, color 0.3s ease', animation: 'theme-fade 0.3s ease' }}>

                {/* Mobile Drawer Overlay */}
                <div className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-active' : ''}`} onClick={() => setSidebarOpen(false)} />

                {/* ── Sidebar ── */}
                <aside className={`hq-sidebar ${sidebarOpen ? 'hq-sidebar-open' : 'hq-sidebar-closed'}`} style={{
                    background: T.navBg,
                    borderRight: `1px solid ${T.border}`,
                }}>
                    <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src="/images/logo.png" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML += `<span style="color:${isDark ? '#6366f1' : '#4f46e5'};font-weight:900;font-size:24px">V</span>`; }} />
                            <div className="hq-sidebar-logo-text">
                                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: T.text, lineHeight: 1 }}>VenQore</div>
                                <div style={{ fontSize: 10, color: isDark ? '#6366f1' : '#7c3aed', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Platform HQ</div>
                            </div>
                        </div>
                        {typeof window !== 'undefined' && window.innerWidth <= 768 && (
                            <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: T.textSub, cursor: 'pointer', padding: 8 }}>
                                <AlertCircle size={20} />
                            </button>
                        )}
                    </div>

                    <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <div className="hq-sidebar-text" style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px', marginBottom: 8 }}>Menu</div>
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            const TabIcon = tab.Icon;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="hq-sidebar-btn" style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 16px', borderRadius: 10,
                                    border: `1px solid ${isActive ? T.tabActive.border : 'transparent'}`,
                                    background: isActive ? T.tabActive.bg : 'transparent',
                                    color: isActive ? T.tabActive.color : T.textSub,
                                    fontSize: 14, fontWeight: isActive ? 700 : 500,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    textAlign: 'left', width: '100%',
                                }}>
                                    <TabIcon size={18} style={{ flexShrink: 0 }} />
                                    <span className="hq-sidebar-text">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ padding: '20px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={toggleTheme} className="hq-sidebar-btn" style={{
                            width: '100%', padding: '12px 16px', borderRadius: 10,
                            border: `1px solid ${T.border}`, background: T.bgCard,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                            color: T.textSub, transition: 'all 0.2s', textAlign: 'left'
                        }}>
                            <Sparkles size={16} />
                            <span className="hq-sidebar-text">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                        
                        {typeof window !== 'undefined' && window.innerWidth > 768 && (
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hq-sidebar-btn" style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10,
                                border: 'none', background: 'transparent',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                                color: T.textMuted, transition: 'all 0.2s', textAlign: 'left'
                            }}>
                                <ChevronRight size={18} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                <span className="hq-sidebar-text">Collapse</span>
                            </button>
                        )}

                        <Link href={route('logout')} method="post" as="button" className="hq-sidebar-btn" style={{
                            width: '100%', padding: '12px 16px', borderRadius: 10,
                            border: `1px solid ${T.border}`, background: T.isDark ? 'rgba(239,68,68,0.05)' : '#fff5f5',
                            cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left'
                        }}>
                            <LogOut size={18} />
                            <span className="hq-sidebar-text">Sign Out</span>
                        </Link>
                    </div>
                </aside>

                {/* ── Main Content Area ── */}
                <main className="hq-main-content">
                    {/* ── Flash Notification ── */}
                    {flash && (
                        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 200, padding: '12px 20px', borderRadius: 12, background: flash.type === 'success' ? (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)') : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.12)'), border: `1px solid ${flash.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, color: flash.type === 'success' ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', animation: 'flash-slide-in 0.3s ease' }}>
                            <CheckCircle2 size={14} /> {flash.msg}
                        </div>
                    )}

                    {/* ── Greeting Banner ── */}
                    <div style={{ background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)' : 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)', borderBottom: `1px solid ${T.border}`, padding: '24px 32px', position: 'relative' }} className="hq-greeting-area hq-nav-padding">
                        {typeof window !== 'undefined' && (
                            <button className="mobile-only" onClick={() => setSidebarOpen(true)} style={{ background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 10, padding: 8, color: '#6366f1', position: 'absolute', top: 16, right: 12, zIndex: 10, cursor: 'pointer' }}>
                                <Menu size={22} />
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Sparkles size={16} color="#8b5cf6" />
                                    <span style={{ fontSize: 13, color: isDark ? '#8b5cf6' : '#7c3aed', fontWeight: 600 }}>{greeting}, Abdullah 👋</span>
                                </div>
                                <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '6px 0 0', letterSpacing: '-0.02em' }}>Platform Command Center</h1>
                                <p style={{ fontSize: 13, color: T.textMuted, margin: '6px 0 0' }}>{safeStats.total_stores} stores · {safeStats.active_stores} active · ${safeStats.mrr.toLocaleString()}/mo revenue</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hq-right-date">
                                {safeStats.expiring_soon > 0 && (
                                    <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertTriangle size={13} /> {safeStats.expiring_soon} trials expiring
                                    </div>
                                )}
                                <div style={{ padding: '8px 14px', borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, color: T.textSub }}>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>

                {/* ── Page Content ── */}
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px 80px' }} className="hq-page-padding">

                    {/* Tab header */}
                    <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {React.createElement(TABS.find(t => t.id === activeTab)?.Icon || LayoutDashboard, { size: 18, color: '#6366f1' })}
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>
                            {TABS.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <OverviewTab
                            stats={safeStats}
                            store_trend={store_trend || []}
                            plan_distribution={plan_distribution || []}
                            recent_stores={recent_stores || []}
                            expiring_stores={expiring_stores || []}
                        />
                    )}
                    {activeTab === 'stores' && (
                        <StoresTab
                            stores={recent_stores || []}
                            onSuspend={handleSuspend}
                            onActivate={handleActivate}
                            onExtend={handleExtend}
                            onImpersonate={handleImpersonate}
                        />
                    )}
                    {activeTab === 'users' && <PlatformUsersTab platform_users={platform_users || []} />}
                    {activeTab === 'revenue' && <RevenueTab stats={safeStats} />}
                    {activeTab === 'support' && (
                        <SupportTab
                            tickets={tickets || []}
                            tickets_total={tickets_total || 0}
                            open_count={open_count || 0}
                            active_filter={active_filter || 'open'}
                        />
                    )}
                    {activeTab === 'feed' && <FeedTab activity_feed={activity_feed || []} />}
                    {activeTab === 'settings' && (
                        <SettingsTab
                            stores={recent_stores || []}
                            webhooks={webhooks || []}
                        />
                    )}
                </div>
                </main>
            </div>
        </>
        </ThemeCtx.Provider>
    );
}


