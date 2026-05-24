import React, { useState, useEffect, useContext, createContext } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { formatCurrency as globalFormatCurrency } from '@/Utils/format';
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
    ShieldCheck, Hash, Menu, Trash2, RotateCcw,
    MoreHorizontal, Layers, Database
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { useTheme as useGlobalTheme } from '@/Contexts/ThemeContext';

// ─── Constants & Utils ───────────────────────────────────────────────────

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(val || 0);
};

// ─── Dashboard-Specific Design Tokens Context ────────────────────────────
const DashboardThemeCtx = createContext({});
const useDashboardTheme = () => useContext(DashboardThemeCtx);

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
    const T = useDashboardTheme();
    return (
        <div
            onClick={onClick}
            style={{ 
                background: T.bgCard,
                borderRadius: 24,
                padding: '24px',
                border: `1px solid ${T.border}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)',
                position: 'relative',
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { 
                e.currentTarget.style.borderColor = color + '35'; 
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 40px ${color}10`;
            }}
            onMouseLeave={e => { 
                e.currentTarget.style.borderColor = T.border; 
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, filter: 'blur(30px)', zIndex: 0 }} />
            
            <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: color + '15', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={color} />
                    </div>
                    {trend != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: trend >= 0 ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: 800, background: (trend >= 0 ? '#10b981' : '#ef4444') + '15', padding: '4px 8px', borderRadius: 8 }}>
                            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                
                <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: T.text, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    {sub && <div style={{ fontSize: 11, color: T.textSub, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function StoreRow({ store, onSuspend, onActivate, onExtend, onImpersonate }) {
    const [open, setOpen] = useState(false);
    const T = useDashboardTheme();
    const status = STATUS_CONFIG[store.status] || STATUS_CONFIG.trial;
    const plan   = PLAN_CONFIG[store.plan]    || PLAN_CONFIG.trial;
    const StatusIcon = status.Icon;

    return (
        <tr style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.bgCardHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            <td style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: plan.color + '15', border: `1px solid ${plan.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {plan.emoji}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, letterSpacing: '-0.01em' }}>{store.name}</div>
                        <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{store.slug}</div>
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
    const T = useDashboardTheme();
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
    const T = useDashboardTheme();
    const totalPct = stats.total_stores > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Consolidated Command Grid */}
            <div className="hq-grid-4">
                {/* 1. Store & Subscription Health */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Health</p>
                            <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.total_stores}</h3>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                            <Building2 size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Active</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.active_stores}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Susp.</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.suspended_stores}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Churn</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.churned_stores}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Trial Pipeline */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trial Pipeline</p>
                            <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.trial_stores}</h3>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>
                            <span style={{ color: '#10b981' }}>{stats.conversion_rate}% Conv.</span> · {stats.expiring_soon} ending soon
                        </p>
                    </div>
                </div>

                {/* 3. Users & Recovery */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Accounts</p>
                            <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.total_users}</h3>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => router.get(window.route('platform.stores'), { trashed: true })}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Trash Stores</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{stats.total_deleted_stores}</p>
                        </div>
                        <div style={{ cursor: 'pointer' }} onClick={() => router.get(window.route('platform.users'), { trashed: true })}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Trash Users</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{stats.deleted_users}</p>
                        </div>
                    </div>
                </div>

                {/* 4. Action Center */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Center</p>
                            <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{ (stats.open_errors + stats.new_contacts) || 0 }</h3>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                            <Bell size={20} className={ (stats.open_errors + stats.new_contacts) > 0 ? 'animate-pulse' : ''} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => router.visit(window.route('platform.health.errors'))}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Sys Errors</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.open_errors || 0}</p>
                        </div>
                        <div style={{ cursor: 'pointer' }} onClick={() => router.visit(window.route('platform.health.contacts'))}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Messages</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.new_contacts || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Distribution & Secondary Insights */}
            <div className="hq-grid-chart" style={{ gridTemplateColumns: '1fr' }}>
                {/* Plan Distribution (Now Full Width and Elegant) */}
                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 16 }}>Platform Plan Distribution</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Breakdown of stores across subscription tiers</div>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                            {[
                                { label: 'Active', value: stats.active_stores, color: '#10b981' },
                                { label: 'Trial',  value: stats.trial_stores,  color: '#6366f1' },
                                { label: 'Susp.',  value: stats.suspended_stores, color: '#f59e0b' },
                                { label: 'Churned', value: stats.churned_stores, color: '#ef4444' },
                            ].map(m => (
                                <div key={m.label} style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                        {plan_distribution.map(p => {
                            const cfg = PLAN_CONFIG[p.plan] || PLAN_CONFIG.trial;
                            const pct = stats.total_stores > 0 ? Math.round((p.count / stats.total_stores) * 100) : 0;
                            return (
                                <div key={p.plan} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
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
                </div>
            </div>

            {/* Monetization Engine Quick Links */}
            <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>Monetization Engine</h3>
                <div className="hq-grid-4">
                    <div onClick={() => router.visit(window.route('platform.plans.index'))} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plans & Limits</p>
                                <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.monetization?.total_plans || 0}</h3>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                <Layers size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Website</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.website_plans || 0}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>AppSumo</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.appsumo_plans || 0}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={() => router.visit(window.route('platform.platforms.index'))} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platforms</p>
                                <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.monetization?.total_platforms || 0}</h3>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                                <Database size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Active</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.active_platforms || 0}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Inactive</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.inactive_platforms || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => router.visit(window.route('platform.coupons.index'))} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coupons</p>
                                <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.monetization?.total_coupons || 0}</h3>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                                <Ticket size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Active</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.active_coupons || 0}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Inactive</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.inactive_coupons || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => router.visit(window.route('platform.tenants.overrides'))} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overrides</p>
                                <h3 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: '8px 0' }}>{stats.monetization?.total_overrides || 0}</h3>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                <Zap size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Active</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.active_overrides || 0}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Expired</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{stats.monetization?.expired_overrides || 0}</p>
                            </div>
                        </div>
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
    const T = useDashboardTheme();
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
    const T = useDashboardTheme();
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
    const T = useDashboardTheme();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16 }}>
                <KpiCard label="Monthly Recurring Revenue" value={formatCurrency(stats.mrr)} sub="Live estimate from plan data" Icon={DollarSign} color="#10b981" />
                <KpiCard label="Annual Recurring Revenue" value={formatCurrency(stats.arr || 0)} sub="MRR × 12 projected" Icon={TrendingUp} color="#6366f1" />
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
    const T = useDashboardTheme();
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [filter, setFilter] = useState(active_filter);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    function sendReply() {
        if (!reply.trim() || !selected) return;
        router.post(window.route('platform.ticket.reply', { ticket: selected.id }), { body: reply }, {
            onSuccess: () => { setReply(''); setSelected(null); },
        });
    }

    function setStatus(ticket, status) {
        router.post(window.route('platform.ticket.status', { ticket: ticket.id }), { status }, {
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
    const T = useDashboardTheme();
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
    const T = useDashboardTheme();
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

                <form onSubmit={e => { e.preventDefault(); pwForm.post(route('platform.change-password'), { onSuccess: () => pwForm.reset() }); }}
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

                <form onSubmit={e => { e.preventDefault(); pinForm.post(route('platform.set-passcode'), { onSuccess: () => pinForm.reset() }); }}
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
                                router.post(route('platform.clear-passcode'), { current_password: clearPw }, {
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
    const T = useDashboardTheme();
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
        router.post(route('platform.store.feature-flag', tenant.id), {
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
    tab: initialTab, // Prop from controller
}) {
    const { auth } = usePage().props;
    const { isDarkMode: isDark } = useGlobalTheme();

    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return initialTab || 'overview';
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab && TABS.some(t => t.id === urlTab)) return urlTab;
        if (initialTab && TABS.some(t => t.id === initialTab)) return initialTab;
        return 'overview';
    });
    const [flash, setFlash] = useState(null);

    // Sync activeTab with URL params for sidebar consistency
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') || 'overview';
        if (tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [window.location.search]);


    // Theme logic handled by context

    // Design tokens
    const T = isDark ? {
        bg: '#020617',
        bgCard: 'rgba(15, 23, 42, 0.45)', // Deep glass
        bgCardHover: 'rgba(30, 41, 59, 0.6)',
        border: 'rgba(255, 255, 255, 0.05)',
        borderAccent: 'rgba(99, 102, 241, 0.35)',
        navBg: 'rgba(2, 6, 23, 0.95)',
        text: '#f8fafc',
        textSub: '#cbd5e1',
        textMuted: '#64748b',
        textHero: '#ffffff',
        bgHero: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
        bgHeroCard: 'rgba(255,255,255,0.03)',
        tabActive: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', color: '#c7d2fe' },
        tabInactive: { bg: 'transparent', border: 'transparent', color: '#94a3b8' },
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
        textMuted: '#64748b',
        textHero: '#0f172a',
        bgHero: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)',
        bgHeroCard: 'rgba(0,0,0,0.03)',
        tabActive: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.4)', color: '#4f46e5' },
        tabInactive: { bg: 'transparent', border: 'transparent', color: '#6b7280' },
        isDark: false,
    };

    const safeStats = {
        total_stores: 0, active_stores: 0, trial_stores: 0,
        suspended_stores: 0, churned_stores: 0, new_today: 0,
        new_this_month: 0, cancelled_last_30: 0, expiring_soon: 0,
        conversion_rate: 0, total_users: 0, platform_admins: 1,
        store_users: 0, mrr: 0, arr: 0, total_volume: 0,
        growth_rate: 0, uptime: 100,
        ...(stats || {}),
    };

    function handleSuspend(tenantId) {
        router.post(window.route('platform.store.suspend', { tenant: tenantId }), {}, {
            onSuccess: () => setFlash({ type: 'success', msg: 'Store suspended.' }),
        });
    }
    function handleActivate(tenantId) {
        router.post(window.route('platform.store.activate', { tenant: tenantId }), {}, {
            onSuccess: () => setFlash({ type: 'success', msg: 'Store activated.' }),
        });
    }
    function handleExtend(tenantId, days) {
        router.post(window.route('platform.store.extend-trial', { tenant: tenantId }), { days }, {
            onSuccess: () => setFlash({ type: 'success', msg: `Trial extended by ${days} days.` }),
        });
    }
    function handleImpersonate(userId) {
        if (!confirm('Start impersonation session for this store owner?')) return;
        router.post(window.route('platform.impersonate.start', { user: userId }));
    }

    useEffect(() => {
        if (flash) { const t = setTimeout(() => setFlash(null), 3500); return () => clearTimeout(t); }
    }, [flash]);

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Map tab ID to Sidebar Item Name for highlighting
    const activeMenuNameMap = {
        'overview': 'Overview',
        'stores': 'Stores',
        'users': 'Platform Users',
        'revenue': 'Revenue',
        'support': 'Support',
        'feed': 'Activity Feed',
        'settings': 'Settings'
    };

    const requestParams = new URLSearchParams(window.location.search);
    const period = requestParams.get('period') || 'all';

    return (
        <DashboardThemeCtx.Provider value={T}>
            <OneGlanceLayout 
                title={TABS.find(t => t.id === activeTab)?.label || "Platform HQ"} 
                mode="admin" 
                activeMenu={activeMenuNameMap[activeTab]}
            >
                <Head title="VenQore — Platform HQ" />
                
                <style>{`
                    .hq-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                    .hq-grid-chart { display: grid; grid-template-columns: 1fr 380px; gap: 20px; min-width: 0; }
                    @media (max-width: 768px) {
                        .hq-grid-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
                        .hq-grid-chart { grid-template-columns: 1fr !important; gap: 16px !important; }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .shimmer {
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
                        background-size: 200% 100%;
                        animation: shimmer 2s infinite;
                    }
                    @keyframes aurora {
                        0% { transform: scale(1) translate(0,0); opacity: 0.3; }
                        50% { transform: scale(1.1) translate(10px, 10px); opacity: 0.5; }
                        100% { transform: scale(1) translate(0,0); opacity: 0.3; }
                    }
                    .aurora-pulse {
                        animation: aurora 8s infinite ease-in-out;
                    }
                `}</style>

                {/* --- REVENUE INTELLIGENCE: HERO COMMAND SECTION --- */}
                {activeTab === 'overview' && (
                    <div style={{ padding: '0 32px 40px' }}>
                        <div style={{ 
                            background: T.bgHero,
                            borderRadius: 32,
                            border: `1px solid ${T.border}`,
                            padding: '40px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 30px rgba(99,102,241,0.05)'
                        }}>
                            {/* Nebula Background Elements */}
                            <div className="aurora-pulse" style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
                            <div className="aurora-pulse" style={{ position: 'absolute', bottom: -50, left: 100, width: 250, height: 250, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0, animationDelay: '-2s' }}></div>
                            
                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#818cf8', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                            <TrendingUp size={16} /> Revenue Intelligence
                                        </div>
                                        <h2 style={{ fontSize: 32, fontWeight: 900, color: T.textHero, margin: '8px 0 0', letterSpacing: '-0.02em' }}>Platform Global Alpha</h2>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, background: T.bgHeroCard, padding: 4, borderRadius: 16 }}>
                                        {['today', 'month', 'year', 'all'].map(p => {
                                            const isActive = period === p;
                                            return (
                                                <button 
                                                    key={p} 
                                                    onClick={() => router.get(window.route('platform.dashboard'), { period: p }, { preserveScroll: true, preserveState: true })}
                                                    style={{ 
                                                        padding: '8px 20px', 
                                                        borderRadius: 12, 
                                                        fontSize: 12, 
                                                        fontWeight: 700, 
                                                        textTransform: 'capitalize',
                                                        transition: 'all 0.2s',
                                                        background: isActive ? T.tabActive.bg : 'transparent',
                                                        color: isActive ? T.textHero : T.textMuted,
                                                        border: `1px solid ${isActive ? T.tabActive.border : 'transparent'}`
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 1. Trend Analysis Row */}
                                <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40 }}>
                                    <div style={{ height: 180 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Growth Trend</span>
                                            <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>+{safeStats.new_this_month} Registrations this month</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={160} minWidth={100} minHeight={100}>
                                            <AreaChart data={store_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="heroStoreGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                                <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: T.textMuted, fontSize: 10, fontWeight: 600 }} dy={10} stroke={T.border} />
                                                <YAxis axisLine={true} tickLine={true} tick={{ fill: T.textMuted, fontSize: 10, fontWeight: 600 }} stroke={T.border} />
                                                <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 12 }} />
                                                <Area type="monotone" dataKey="stores" stroke="#6366f1" fill="url(#heroStoreGrad)" strokeWidth={3} dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: T.bg }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div style={{ background: T.bgHeroCard, borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                                         <div>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conversion Peak</p>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: T.textHero, marginTop: 4 }}>{safeStats.conversion_rate}%</div>
                                         </div>
                                         <div>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expansion Velocity</p>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: '#6366f1', marginTop: 4 }}>+{(safeStats.new_this_month / 30).toFixed(1)} <span style={{ fontSize: 13, color: T.textMuted }}>stores / day</span></div>
                                         </div>
                                    </div>
                                </div>

                                {/* 2. Financial Metrics Row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform Volume</p>
                                        <div style={{ fontSize: 64, fontWeight: 900, color: T.textHero, letterSpacing: '-0.04em', margin: '8px 0' }}>
                                            {formatCurrency(safeStats.total_volume)}
                                        </div>
                                        {safeStats.growth_rate !== 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: safeStats.growth_rate > 0 ? '#10b981' : '#ef4444', fontSize: 14, fontWeight: 700 }}>
                                                {safeStats.growth_rate > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />} 
                                                {safeStats.growth_rate > 0 ? '+' : ''}{safeStats.growth_rate}% 
                                                <span style={{ color: T.textMuted, fontWeight: 500 }}>vs last period</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ width: 1, height: '80%', background: T.border }}></div>

                                    {/* Intelligence Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                        <div>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monthly (MRR)</p>
                                            <p style={{ fontSize: 20, fontWeight: 800, color: T.textHero, margin: '4px 0' }}>{formatCurrency(safeStats.mrr)}</p>
                                            <div style={{ width: '100%', height: 4, background: T.bgHeroCard, borderRadius: 2, marginTop: 8 }}>
                                                <div style={{ width: '70%', height: '100%', background: '#6366f1', borderRadius: 2 }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yearly (ARR)</p>
                                            <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{formatCurrency(safeStats.arr || safeStats.mrr * 12)}</p>
                                            <div style={{ width: '100%', height: 4, background: T.bgHeroCard, borderRadius: 2, marginTop: 8 }}>
                                                <div style={{ width: '100%', height: '100%', background: '#10b981', borderRadius: 2, opacity: 0.3 }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Forecast</p>
                                            <p style={{ fontSize: 20, fontWeight: 800, color: T.textHero, margin: '4px 0' }}>{formatCurrency((safeStats.arr || safeStats.mrr * 12) * 1.5)}</p>
                                            <div style={{ width: '100%', height: 4, background: T.bgHeroCard, borderRadius: 2, marginTop: 8 }}>
                                                <div style={{ width: '45%', height: '100%', background: '#8b5cf6', borderRadius: 2 }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Uptime</p>
                                            <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{safeStats.uptime}%</p>
                                            <div style={{ width: '100%', height: 4, background: T.bgHeroCard, borderRadius: 2, marginTop: 8 }}>
                                                <div style={{ width: `${safeStats.uptime}%`, height: '100%', background: '#10b981', borderRadius: 2 }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Page Content ── */}
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
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
            </OneGlanceLayout>
        </DashboardThemeCtx.Provider>
    );
}


