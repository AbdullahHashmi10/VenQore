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
    ShieldCheck, Hash, Menu, Trash2, RotateCcw, Monitor,
    MoreHorizontal, Layers, Database, Plus
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { useTheme as useGlobalTheme } from '@/Contexts/ThemeContext';
import HealthWidget from '@/Components/SuperAdmin/HealthWidget';
import SmokeTestRunner from '@/Components/SuperAdmin/SmokeTestRunner';
import DemoStoreTab from '@/Components/SuperAdmin/DemoStoreTab';

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
    { id: 'demo',      label: '🎭 Demo Store',   Icon: Monitor },
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
            {/* Smoke Test Runner — Pillar 3: Live production check */}
            <SmokeTestRunner />

            {/* System Health Diagnostics Heartbeat */}
            <HealthWidget />

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
// ECG Ghost-Sweep Radar Graph (Financial Command Center)
// ─────────────────────────────────────────────────────────────────────────

function ECGGraph({ data = [], color = '#818cf8', height = 180, type = 'money', isDark = true }) {
    const canvasRef = React.useRef(null);
    const pts = React.useMemo(() => data.map(p => ({
        val: isFinite(p?.val) ? p.val : 0,
        over: !!p?.over,
        ds: p?.ds
    })), [data]);

    const headXRef = React.useRef(0);
    const pixelBufferRef = React.useRef(null);
    const targetPtsRef = React.useRef(pts);
    const ptsLengthRef = React.useRef(pts.length);
    const isRunningRef = React.useRef(false);

    React.useEffect(() => {
        targetPtsRef.current = pts;
        if (pts.length !== ptsLengthRef.current) {
            ptsLengthRef.current = pts.length;
            pixelBufferRef.current = null;
            headXRef.current = 0;
        }
    }, [pts]);

    React.useEffect(() => {
        if (!canvasRef.current || pts.length < 2) return;
        if (isRunningRef.current) return;
        isRunningRef.current = true;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        const speed = 2.0;
        const gapSize = 35;
        const dpr = window.devicePixelRatio || 1;

        // Helper to convert hex to rgba for dynamic gradient transparency
        const hexToRgba = (hex, alpha) => {
            if (!hex || hex.length < 6) return `rgba(129, 140, 248, ${alpha})`;
            const cleanHex = hex.replace('#', '');
            const r = parseInt(cleanHex.substring(0, 2), 16);
            const g = parseInt(cleanHex.substring(2, 4), 16);
            const b = parseInt(cleanHex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const draw = () => {
            if (!canvasRef.current) return;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width || 1;
            const h = rect.height || 1;

            if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(h * dpr)) {
                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(h * dpr);
                ctx.scale(dpr, dpr);
                pixelBufferRef.current = null;
                headXRef.current = 0;
            }

            if (!targetPtsRef.current || targetPtsRef.current.length < 2) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            const bufLen = Math.ceil(width);
            const getInterpolatedVal = (dataset, xPos) => {
                const progress = xPos / Math.max(bufLen - 1, 1);
                const index = progress * (dataset.length - 1);
                const i1 = Math.floor(index);
                const i2 = Math.min(dataset.length - 1, i1 + 1);
                const t = index - i1;
                const v1 = dataset[i1]?.val || 0;
                const v2 = dataset[i2]?.val || 0;
                return v1 + (v2 - v1) * (0.5 - 0.5 * Math.cos(Math.PI * t));
            };

            if (!pixelBufferRef.current || pixelBufferRef.current.length !== bufLen) {
                const buf = new Float32Array(bufLen);
                for (let i = 0; i < bufLen; i++) buf[i] = getInterpolatedVal(targetPtsRef.current, i);
                pixelBufferRef.current = buf;
                headXRef.current = 0;
            }

            ctx.clearRect(0, 0, width, h);
            
            // Real scaling bounds: leaves Y-axis margin bottom for X axis month names
            const maxVal = Math.max(10, Math.max(...targetPtsRef.current.map(p => p.val || 0)));
            const getY = (val) => h - ((val || 0) / maxVal) * h * 0.60 - h * 0.22;
            const centerY = h * 0.78;

            // Draw Y-axis Scale Labels & Dash Grid Lines (theme-aware)
            ctx.save();
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
            ctx.lineWidth = 1;
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.6)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';

            const gridLevels = [0, maxVal * 0.5, maxVal];
            gridLevels.forEach(val => {
                const yPos = getY(val);
                ctx.beginPath();
                ctx.setLineDash([4, 4]);
                ctx.moveTo(40, yPos);
                ctx.lineTo(width - 10, yPos);
                ctx.stroke();

                // Format PKR or store/user counts
                const label = type === 'money' ? '$' + Math.round(val) : Math.round(val);
                ctx.fillText(label, 8, yPos + 3);
            });
            ctx.restore();

            // Draw X-axis Month Label Ticks at bottom (theme-aware)
            ctx.save();
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            targetPtsRef.current.forEach((pt, i) => {
                const xPos = (i / Math.max(targetPtsRef.current.length - 1, 1)) * (width - 65) + 48;
                ctx.fillText(pt.ds || '', xPos, h - 8);
            });
            ctx.restore();

            const prevHeadX = headXRef.current;
            headXRef.current += speed;
            let currentHeadX = headXRef.current;
            const didWrap = currentHeadX >= width;
            if (didWrap) { headXRef.current = currentHeadX % width; currentHeadX = headXRef.current; }

            if (!didWrap) {
                for (let i = Math.floor(prevHeadX); i <= Math.floor(currentHeadX) && i < bufLen; i++)
                    pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
            } else {
                for (let i = Math.floor(prevHeadX); i < bufLen; i++)
                    pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
                for (let i = 0; i <= Math.floor(currentHeadX); i++)
                    pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
            }

            let segments = [];
            let currentSegment = [];
            for (let i = 0; i < width; i++) {
                let inGap = false;
                if (currentHeadX + gapSize < width) {
                    if (i >= currentHeadX && i <= currentHeadX + gapSize) inGap = true;
                } else {
                    if (i >= currentHeadX || i <= (currentHeadX + gapSize) % width) inGap = true;
                }
                if (!inGap) {
                    currentSegment.push({ x: i, y: getY(pixelBufferRef.current[i] ?? 0) });
                } else if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                    currentSegment = [];
                }
            }
            if (currentSegment.length > 0) segments.push(currentSegment);

            const drawZone = (zoneSegments) => {
                const zoneColor = color;
                const fillAlpha = '0.08';
                ctx.save();
                const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
                fillGrad.addColorStop(0, hexToRgba(zoneColor, fillAlpha));
                fillGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = fillGrad;
                zoneSegments.forEach(seg => {
                    if (seg.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(seg[0].x, centerY);
                    seg.forEach(pt => ctx.lineTo(pt.x, pt.y));
                    ctx.lineTo(seg[seg.length - 1].x, centerY);
                    ctx.closePath();
                    ctx.fill();
                });
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = zoneColor;
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.shadowBlur = 8;
                ctx.shadowColor = zoneColor;
                zoneSegments.forEach(seg => {
                    if (seg.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(seg[0].x, seg[0].y);
                    for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i].x, seg[i].y);
                    ctx.stroke();
                });
                ctx.restore();
            };

            segments.forEach(segment => {
                if (segment.length < 2) return;
                drawZone([segment]);
            });

            const headVal = getInterpolatedVal(targetPtsRef.current, currentHeadX);
            const headY = getY(headVal);
            ctx.beginPath();
            ctx.arc(currentHeadX, headY, 4, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? '#ffffff' : color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.fill();
        };

        const animateLoop = () => { draw(); animationFrameId = requestAnimationFrame(animateLoop); };
        animateLoop();
        return () => { cancelAnimationFrame(animationFrameId); isRunningRef.current = false; };
    }, [pts, color, isDark]);

    return <canvas ref={canvasRef} style={{ width: '100%', height }} />;
}

// ─────────────────────────────────────────────────────────────────────────
// Tab: Revenue — Full Financial Command Center
// ─────────────────────────────────────────────────────────────────────────

function RevenueTab({ stats, plans = [], plan_distribution = [] }) {
    const T = useDashboardTheme();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    // ── Config State (Saved in LocalStorage) ──
    const [exchangeRate, setExchangeRate] = React.useState(() => {
        if (typeof window === 'undefined') return 279;
        const saved = localStorage.getItem('venqore_fx_rate');
        return saved ? parseInt(saved) : 279;
    });

    const [variableExpenseRate, setVariableExpenseRate] = React.useState(() => {
        if (typeof window === 'undefined') return 5;
        const saved = localStorage.getItem('venqore_var_expense_rate');
        return saved ? parseFloat(saved) : 5;
    });

    const [serverCapacity, setServerCapacity] = React.useState(() => {
        if (typeof window === 'undefined') return 200;
        const saved = localStorage.getItem('venqore_server_capacity');
        return saved ? parseInt(saved) : 200;
    });

    const [fixedExpenses, setFixedExpenses] = React.useState(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('venqore_fixed_expenses');
        const defaultExps = [
            { id: '1', name: 'KVM 2 Production Server',         amount: 2508, currency: 'PKR' },
            { id: '2', name: 'Domain Registration & Routing',   amount: 257,  currency: 'PKR' },
            { id: '3', name: 'Database Backups & Cloud Storage', amount: 1500, currency: 'PKR' },
            { id: '4', name: 'Transactional SMTP Email API',    amount: 10,   currency: 'USD' },
        ];
        return saved ? JSON.parse(saved) : defaultExps;
    });

    const [gatewayConfigs, setGatewayConfigs] = React.useState(() => {
        if (typeof window === 'undefined') return {};
        const saved = localStorage.getItem('venqore_gw_configs');
        const defaults = {
            pk_exclusive: { feePct: 2.5, fixedFee: 15 },
            starter:      { feePct: 6.5, fixedFee: 0.50 },
            growth:       { feePct: 6.5, fixedFee: 0.50 },
            business:     { feePct: 6.5, fixedFee: 0.50 },
        };
        return saved ? JSON.parse(saved) : defaults;
    });

    // ── Partners & Equity State ──
    const [partners, setPartners] = React.useState(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('venqore_equity_partners');
        const defaultPartners = [
            { id: '1', name: 'Abdullah Hashmi', role: 'Lead Architect & Owner', equityPct: 40 },
            { id: '2', name: 'Partner Operations', role: 'Director', equityPct: 30 },
        ];
        return saved ? JSON.parse(saved) : defaultPartners;
    });

    const [drawings, setDrawings] = React.useState(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('venqore_partner_drawings');
        return saved ? JSON.parse(saved) : [];
    });

    const [monthsAccumulated, setMonthsAccumulated] = React.useState(1);
    const [activeSubTab, setActiveSubTab] = React.useState('overview');

    // ── Local Forms State ──
    const [newExpenseName, setNewExpenseName] = React.useState('');
    const [newExpenseAmount, setNewExpenseAmount] = React.useState('');
    const [newExpenseCurrency, setNewExpenseCurrency] = React.useState('PKR');

    const [newPartnerName, setNewPartnerName] = React.useState('');
    const [newPartnerRole, setNewPartnerRole] = React.useState('');
    const [newPartnerEquity, setNewPartnerEquity] = React.useState('');

    const [drawPartnerId, setDrawPartnerId] = React.useState('');
    const [drawAmount, setDrawAmount] = React.useState('');
    const [drawDescription, setDrawDescription] = React.useState('');

    // ── Sync with localStorage ──
    React.useEffect(() => { localStorage.setItem('venqore_fx_rate', exchangeRate.toString()); }, [exchangeRate]);
    React.useEffect(() => { localStorage.setItem('venqore_var_expense_rate', variableExpenseRate.toString()); }, [variableExpenseRate]);
    React.useEffect(() => { localStorage.setItem('venqore_server_capacity', serverCapacity.toString()); }, [serverCapacity]);
    React.useEffect(() => { localStorage.setItem('venqore_fixed_expenses', JSON.stringify(fixedExpenses)); }, [fixedExpenses]);
    React.useEffect(() => { localStorage.setItem('venqore_gw_configs', JSON.stringify(gatewayConfigs)); }, [gatewayConfigs]);
    React.useEffect(() => { localStorage.setItem('venqore_equity_partners', JSON.stringify(partners)); }, [partners]);
    React.useEffect(() => { localStorage.setItem('venqore_partner_drawings', JSON.stringify(drawings)); }, [drawings]);

    // ── Financial Calculation Engine (Real DB Data) ──
    const totals = React.useMemo(() => {
        let fixedPkrTotal = 0, fixedUsdTotal = 0;
        fixedExpenses.forEach(exp => {
            if (exp.currency === 'PKR') {
                fixedPkrTotal += exp.amount;
                fixedUsdTotal += exp.amount / exchangeRate;
            } else {
                fixedUsdTotal += exp.amount;
                fixedPkrTotal += exp.amount * exchangeRate;
            }
        });

        let totalGrossPkr = 0, totalGrossUsd = 0, totalFeesPkr = 0, totalFeesUsd = 0, totalPayingStores = 0;
        const storeBreakdown = [];

        const defaultGatewayConfigs = {
            pk_exclusive: { feePct: 2.5, fixedFee: 15 },
            starter:      { feePct: 6.5, fixedFee: 0.50 },
            growth:       { feePct: 6.5, fixedFee: 0.50 },
            business:     { feePct: 6.5, fixedFee: 0.50 },
        };

        const dbPlans = plans || [];
        const distributions = plan_distribution || [];

        ['pk_exclusive', 'starter', 'growth', 'business'].forEach(slug => {
            const isLocal = slug === 'pk_exclusive';
            const planModel = dbPlans.find(p => p.slug === slug);
            const dist = distributions.find(d => d.plan === slug);

            const activeCount = dist ? dist.count : 0;
            totalPayingStores += activeCount;

            const basePriceUsd = planModel ? parseFloat(planModel.price_monthly || planModel.price_lifetime || 0) : 0;
            const basePricePkr = isLocal ? 1000 : Math.round(basePriceUsd * exchangeRate);

            // Live revenue figures passed from backend taking coupons and discounts into account
            const tierGrossPkr = isLocal ? (dist ? parseFloat(dist.mrr) : 0) : Math.round((dist ? parseFloat(dist.mrr) : 0) * exchangeRate);
            const tierGrossUsd = isLocal ? ((dist ? parseFloat(dist.mrr) : 0) / exchangeRate) : (dist ? parseFloat(dist.mrr) : 0);

            totalGrossPkr += tierGrossPkr;
            totalGrossUsd += tierGrossUsd;

            const gw = gatewayConfigs[slug] || defaultGatewayConfigs[slug] || { feePct: 6.5, fixedFee: 0.5 };
            let tierFeesPkr = 0, tierFeesUsd = 0;
            if (activeCount > 0) {
                if (isLocal) {
                    tierFeesPkr = (tierGrossPkr * (gw.feePct / 100)) + (gw.fixedFee * activeCount);
                    tierFeesUsd = tierFeesPkr / exchangeRate;
                } else {
                    tierFeesUsd = (tierGrossUsd * (gw.feePct / 100)) + (gw.fixedFee * activeCount);
                    tierFeesPkr = tierFeesUsd * exchangeRate;
                }
            }
            totalFeesPkr += tierFeesPkr;
            totalFeesUsd += tierFeesUsd;

            const afterFeesPkr = tierGrossPkr - tierFeesPkr;
            const afterFeesUsd = tierGrossUsd - tierFeesUsd;
            const varMul = variableExpenseRate / 100;
            const tierVarExpensePkr = afterFeesPkr * varMul;
            const tierVarExpenseUsd = afterFeesUsd * varMul;

            storeBreakdown.push({
                key: slug,
                name: planModel ? planModel.name : slug.replace('_', ' ').toUpperCase(),
                count: activeCount,
                grossPkr: tierGrossPkr,
                grossUsd: tierGrossUsd,
                feesPkr: tierFeesPkr,
                feesUsd: tierFeesUsd,
                afterFeesPkr,
                afterFeesUsd,
                varExpensePkr: tierVarExpensePkr,
                varExpenseUsd: tierVarExpenseUsd,
                netContributionPkr: afterFeesPkr - tierVarExpensePkr,
                netContributionUsd: afterFeesUsd - tierVarExpenseUsd
            });
        });

        const afterFeesGrandPkr = totalGrossPkr - totalFeesPkr;
        const totalVarExpensesPkr = afterFeesGrandPkr * (variableExpenseRate / 100);
        const netMrrPkr = afterFeesGrandPkr - totalVarExpensesPkr - fixedPkrTotal;
        const netMrrUsd = netMrrPkr / exchangeRate;
        const marginPercent = totalGrossPkr > 0 ? (netMrrPkr / totalGrossPkr) * 100 : 0;

        return {
            fixedPkr: fixedPkrTotal,
            fixedUsd: fixedUsdTotal,
            grossMrrPkr: totalGrossPkr,
            grossMrrUsd: totalGrossUsd,
            feesPkr: totalFeesPkr,
            feesUsd: totalFeesUsd,
            varExpensesPkr: totalVarExpensesPkr,
            varExpensesUsd: totalVarExpensesPkr / exchangeRate,
            deductionsPkr: totalFeesPkr + totalVarExpensesPkr + fixedPkrTotal,
            netMrrPkr,
            netMrrUsd,
            arrPkr: netMrrPkr * 12,
            arrUsd: netMrrUsd * 12,
            marginPercent,
            storeBreakdown,
            totalPayingStores,
        };
    }, [fixedExpenses, exchangeRate, variableExpenseRate, plans, plan_distribution, gatewayConfigs]);

    // ── Actions ──
    const addExpense = (e) => {
        e.preventDefault();
        if (!newExpenseName || !newExpenseAmount) return;
        setFixedExpenses(prev => [...prev, {
            id: Date.now().toString(),
            name: newExpenseName,
            amount: parseFloat(newExpenseAmount) || 0,
            currency: newExpenseCurrency
        }]);
        setNewExpenseName(''); setNewExpenseAmount('');
    };

    const removeExpense = (id) => setFixedExpenses(prev => prev.filter(exp => exp.id !== id));

    const handleGatewayChange = (tier, field, val) => {
        setGatewayConfigs(prev => {
            const updated = { ...prev };
            if (!updated[tier]) {
                updated[tier] = { feePct: 6.5, fixedFee: 0.50 };
            }
            updated[tier] = { ...updated[tier], [field]: parseFloat(val) || 0 };
            return updated;
        });
    };

    const addPartner = (e) => {
        e.preventDefault();
        if (!newPartnerName || !newPartnerRole || !newPartnerEquity) return;
        setPartners(prev => [...prev, {
            id: Date.now().toString(),
            name: newPartnerName,
            role: newPartnerRole,
            equityPct: parseFloat(newPartnerEquity) || 0
        }]);
        setNewPartnerName(''); setNewPartnerRole(''); setNewPartnerEquity('');
    };

    const removePartner = (id) => {
        if (!confirm('Are you sure you want to delete this partner profile?')) return;
        setPartners(prev => prev.filter(p => p.id !== id));
        setDrawings(prev => prev.filter(d => d.partnerId !== id)); // Clean drawings for this partner
    };

    const logDrawing = (e) => {
        e.preventDefault();
        if (!drawPartnerId || !drawAmount) return;
        const amt = parseFloat(drawAmount) || 0;
        const partner = partners.find(p => p.id === drawPartnerId);
        if (!partner) return;

        setDrawings(prev => [...prev, {
            id: Date.now().toString(),
            partnerId: drawPartnerId,
            partnerName: partner.name,
            amount: amt,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            description: drawDescription || 'Partner drawing payout'
        }]);
        setDrawAmount(''); setDrawDescription('');
    };

    const removeDrawing = (id) => {
        if (!confirm('Remove this drawing transaction log?')) return;
        setDrawings(prev => prev.filter(d => d.id !== id));
    };

    const clearAllDrawings = () => {
        if (!confirm('Permanently delete all historic drawing transaction logs?')) return;
        setDrawings([]);
    };

    const totalEquityAllocated = React.useMemo(() => {
        return partners.reduce((sum, p) => sum + p.equityPct, 0);
    }, [partners]);

    // ── Styles ──
    const card = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' };
    const subTabBtn = (id) => ({
        padding: '7px 16px',
        borderRadius: 10,
        border: `1px solid ${activeSubTab === id ? T.borderAccent : T.border}`,
        background: activeSubTab === id ? T.tabActive.bg : 'transparent',
        color: activeSubTab === id ? T.tabActive.color : T.textMuted,
        fontSize: 12,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.15s ease'
    });
    const inputStyle = { background: T.isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };

    // Founding Member stats calculations
    const totalPayingBase = (stats.standard_stores_count || 0) + (stats.discounted_stores_count || 0);
    const discountPct = totalPayingBase > 0 ? (((stats.discounted_stores_count || 0) / totalPayingBase) * 100).toFixed(1) : '0.0';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Header with Commands ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, ...card, padding: '16px 24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        <Activity size={14} /> Financial Command Center
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontFamily: 'monospace' }}>Real-time database analytics · Read-only profit ledger & payouts</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                        Live Forex: 1 USD = {exchangeRate} PKR
                    </span>
                </div>
            </div>

            {/* ── Sub Tab Navigation ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                    ['overview', LayoutDashboard, 'Financial Overview'],
                    ['expenses', DollarSign, 'Fixed Expenses & Fees'],
                    ['equity', Users, 'Partners & Equity'],
                    ['settings', Settings, 'Financial Settings']
                ].map(([id, Icon, label]) => (
                    <button key={id} onClick={() => setActiveSubTab(id)} style={subTabBtn(id)}>
                        <Icon size={13} /> {label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* SUB TAB 1: OVERVIEW */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeSubTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* 4 KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 16 }}>
                        {[
                            { label: 'Net MRR Profit', val: `PKR ${Math.round(totals.netMrrPkr).toLocaleString()}`, sub: `$${totals.netMrrUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} /mo`, color: totals.netMrrPkr >= 0 ? '#10b981' : '#ef4444', Icon: TrendingUp },
                            { label: 'Gross Subscriptions', val: `PKR ${Math.round(totals.grossMrrPkr).toLocaleString()}`, sub: `$${totals.grossMrrUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} gross`, color: '#6366f1', Icon: DollarSign },
                            { label: 'Annualized ARR', val: `PKR ${Math.round(totals.arrPkr).toLocaleString()}`, sub: `$${totals.arrUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} /yr`, color: '#8b5cf6', Icon: TrendingUp },
                            { label: 'Deduction Pool', val: `PKR ${Math.round(totals.deductionsPkr).toLocaleString()}`, sub: `Fees + Fixed + Var`, color: '#ef4444', Icon: Activity },
                        ].map(({ label, val, sub, color, Icon }) => (
                            <div key={label} style={{ ...card, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={16} color={color} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{val}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Sub-metrics row */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12 }}>
                        {[
                            { label: 'Gateway Fees Cut', val: `PKR ${Math.round(totals.feesPkr).toLocaleString()}`, badge: 'Gateway', color: '#f59e0b' },
                            { label: 'Paying Stores Base', val: `${totals.totalPayingStores} Active`, badge: 'Real Database', color: '#6366f1' },
                            { label: 'Capacity Buffer', val: `${totals.totalPayingStores} / ${serverCapacity}`, badge: 'Server Limit', color: T.textMuted },
                            { label: 'Profit Margin Ratio', val: `${totals.marginPercent.toFixed(1)}%`, badge: 'Margin', color: '#10b981' },
                        ].map(({ label, val, badge, color }) => (
                            <div key={label} style={{ ...card, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</div>
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color, background: color + '15', border: `1px solid ${color}25`, borderRadius: 6, padding: '4px 8px' }}>{badge}</div>
                            </div>
                        ))}
                    </div>

                    {/* Founding Member Promotion Analytics Card */}
                    <div style={{ ...card }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                            <div>
                                <div style={{ fontWeight: 800, color: T.text, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Crown size={16} color="#f59e0b" /> Founding Member Promotion Analytics
                                </div>
                                <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 640, lineHeight: 1.7 }}>
                                    Live discount tracking matrix. Reflects actual database coupon redemptions and special promotional pricing overrides applied to active tenant accounts.
                                </div>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase' }}>
                                Read-Only Live Feed
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            {[
                                { label: 'Standard Price Stores', value: stats.standard_stores_count || 0, sub: 'Paying full recommended tier price', color: '#6366f1', Icon: ShieldCheck },
                                { label: 'Discounted Promo Stores', value: stats.discounted_stores_count || 0, sub: 'Active coupon / overrides applied', color: '#f59e0b', Icon: Crown },
                                { label: 'Promotional Share', value: `${discountPct}%`, sub: 'Ratio of promo stores to total base', color: '#ec4899', Icon: Activity },
                            ].map(({ label, value, sub, color, Icon }) => (
                                <div key={label} style={{ background: T.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 16, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={18} color={color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* P&L Waterfall */}
                    <div style={{ ...card }}>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: 15, marginBottom: 20 }}>P&amp;L Waterfall Visualizer</div>
                        {(() => {
                            const maxIntake = totals.grossMrrPkr || 1;
                            const otherExp = (totals.grossMrrPkr - totals.feesPkr) * (variableExpenseRate / 100);
                            const waterfallData = [
                                { label: 'Gross subscription pool', amount: totals.grossMrrPkr, color: '#6366f1', neg: false },
                                { label: 'Checkout gateway fees (Gateway & Local)', amount: totals.feesPkr, color: '#ef4444', neg: true },
                                { label: 'Other overhead variables', amount: otherExp, color: 'rgba(239,68,68,0.7)', neg: true },
                                { label: 'Monthly fixed operational costs', amount: totals.fixedPkr, color: '#f59e0b', neg: true },
                                { label: 'Platform Net Profit', amount: totals.netMrrPkr, color: totals.netMrrPkr >= 0 ? '#10b981' : '#ef4444', neg: false },
                            ];
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {waterfallData.map((item, idx) => {
                                        const displayPct = Math.max((Math.abs(item.amount) / maxIntake) * 100, 1);
                                        return (
                                            <div key={idx} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, fontSize: 12, fontFamily: 'monospace' }}>
                                                <span style={{ color: T.textMuted, width: isMobile ? '100%' : 300, flexShrink: 0 }}>{item.label}</span>
                                                <div style={{ flex: 1, height: 22, background: T.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)', borderRadius: 6, overflow: 'hidden', minWidth: 100 }}>
                                                    <div style={{ width: `${displayPct}%`, height: '100%', background: item.color, borderRadius: 6, transition: 'width 0.4s ease' }} />
                                                </div>
                                                <span style={{ width: 160, textAlign: 'right', fontWeight: 800, color: item.neg ? '#ef4444' : T.text, flexShrink: 0 }}>
                                                    {item.neg ? '-' : ''}PKR {Math.round(Math.abs(item.amount)).toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Detailed Financial Matrix */}
                    <div style={{ ...card }}>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: 15, marginBottom: 16 }}>Detailed Financial Matrix Breakdown</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace', minWidth: 700 }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        {['Tier', 'Stores', 'Gross (PKR)', 'Fees', 'After Fees', 'Variables', 'Net Contribution'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {totals.storeBreakdown.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}33` }}>
                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: T.text }}>{item.name}</td>
                                            <td style={{ padding: '12px 14px', color: T.textSub }}>{item.count}</td>
                                            <td style={{ padding: '12px 14px', color: T.textSub }}>PKR {Math.round(item.grossPkr).toLocaleString()}</td>
                                            <td style={{ padding: '12px 14px', color: '#ef4444' }}>-PKR {Math.round(item.feesPkr).toLocaleString()}</td>
                                            <td style={{ padding: '12px 14px', color: T.textSub }}>PKR {Math.round(item.afterFeesPkr).toLocaleString()}</td>
                                            <td style={{ padding: '12px 14px', color: 'rgba(239,68,68,0.8)' }}>-PKR {Math.round(item.varExpensePkr).toLocaleString()}</td>
                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: item.netContributionPkr >= 0 ? '#10b981' : '#ef4444' }}>PKR {Math.round(item.netContributionPkr).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: T.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)' }}>
                                        <td style={{ padding: '14px', fontWeight: 800, color: T.text }}>Total</td>
                                        <td style={{ padding: '14px', fontWeight: 700, color: T.text }}>{totals.totalPayingStores}</td>
                                        <td style={{ padding: '14px', color: '#6366f1', fontWeight: 700 }}>PKR {Math.round(totals.grossMrrPkr).toLocaleString()}</td>
                                        <td style={{ padding: '14px', color: '#ef4444', fontWeight: 700 }}>-PKR {Math.round(totals.feesPkr).toLocaleString()}</td>
                                        <td style={{ padding: '14px', color: T.text, fontWeight: 700 }}>PKR {Math.round(totals.grossMrrPkr - totals.feesPkr).toLocaleString()}</td>
                                        <td style={{ padding: '14px', color: 'rgba(239,68,68,0.8)', fontWeight: 700 }}>-PKR {Math.round(totals.varExpensesPkr).toLocaleString()}</td>
                                        <td style={{ padding: '14px', fontWeight: 900, fontSize: 14, color: totals.netMrrPkr >= 0 ? '#10b981' : '#ef4444' }}>PKR {Math.round(totals.netMrrPkr).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* SUB TAB 2: FIXED EXPENSES & FEES */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeSubTab === 'expenses' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 20 }}>
                    
                    {/* Left: Expenses Table & Form */}
                    <div style={{ ...card }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div style={{ fontWeight: 800, color: T.text, fontSize: 15 }}>Platform Fixed Expenses</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Fixed infrastructure, domains, email SMTP delivery, and local backups.</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: T.text, background: T.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)', padding: '8px 14px', borderRadius: 10, border: `1px solid ${T.border}` }}>
                                PKR {totals.fixedPkr.toLocaleString()} /mo
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {fixedExpenses.map(exp => (
                                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: T.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 12, border: `1px solid ${T.border}` }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{exp.name}</div>
                                        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: 'monospace', marginTop: 2 }}>
                                            {exp.currency} {exp.amount.toLocaleString()}{exp.currency === 'USD' ? ` (PKR ${(exp.amount * exchangeRate).toLocaleString()})` : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.textSub, fontFamily: 'monospace' }}>
                                            PKR {exp.currency === 'PKR' ? exp.amount.toLocaleString() : (exp.amount * exchangeRate).toLocaleString()}
                                        </span>
                                        <button onClick={() => removeExpense(exp.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: 6, display: 'flex', transition: 'all 0.2s' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px', gap: 10, alignItems: 'end', paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Expense Label</div>
                                <input type="text" placeholder="e.g. Backups hosting" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Amount</div>
                                <input type="number" placeholder="0" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Currency</div>
                                <select value={newExpenseCurrency} onChange={e => setNewExpenseCurrency(e.target.value)} style={{ ...inputStyle, padding: '7px 10px' }}>
                                    <option value="PKR">PKR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <button type="submit" style={{ padding: '9px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Plus size={14} /> Add
                            </button>
                        </form>
                    </div>

                    {/* Right: Checkout gateway fees settings */}
                    <div style={{ ...card }}>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Settings size={15} color="#818cf8" /> Gateway Fees Setup
                        </div>
                        {['pk_exclusive', 'starter', 'growth', 'business'].map(key => {
                            const name = key === 'pk_exclusive' ? 'Pakistan Exclusive' : key.charAt(0).toUpperCase() + key.slice(1);
                            const cfg = gatewayConfigs[key] || { feePct: 6.5, fixedFee: 0.50 };
                            return (
                                <div key={key} style={{ marginBottom: 14, padding: 14, background: T.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 12, border: `1px solid ${T.border}` }}>
                                    <div style={{ fontWeight: 800, color: T.text, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{name}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Fee %</div>
                                            <input type="number" step="0.1" value={cfg.feePct} onChange={e => handleGatewayChange(key, 'feePct', e.target.value)} style={{ ...inputStyle, padding: '6px 8px' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Fixed Fee</div>
                                            <input type="number" step="0.01" value={cfg.fixedFee} onChange={e => handleGatewayChange(key, 'fixedFee', e.target.value)} style={{ ...inputStyle, padding: '6px 8px' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* SUB TAB 3: PARTNERS & EQUITY (PRIVATE PAYOUT TRACKER) */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeSubTab === 'equity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Top Section: Payout settings & Warnings */}
                    <div style={{ ...card }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div>
                                <div style={{ fontWeight: 800, color: T.text, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Users size={18} color="#818cf8" /> Partners &amp; Equity Dividends
                                </div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                                    Private client-side ledger calculating equity payouts from Net Revenue. Transacted drawings reside strictly in `localStorage`.
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                                <span style={{ color: T.textMuted, fontWeight: 700 }}>Months Accumulated:</span>
                                <input type="number" min="1" max="24" value={monthsAccumulated} onChange={e => setMonthsAccumulated(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...inputStyle, width: 60, textAlign: 'center', color: '#818cf8', fontWeight: 800 }} />
                            </div>
                        </div>

                        {totalEquityAllocated > 100 && (
                            <div style={{ padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                                <div><strong>Warning:</strong> Total equity allocation is <strong>{totalEquityAllocated}%</strong>, which exceeds the 100% cap! Payout projections will exceed net profit pool.</div>
                            </div>
                        )}

                        {/* Financial Pool Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                            <div style={{ background: T.isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Monthly Net Revenue Pool</span>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981', marginTop: 4 }}>PKR {Math.round(totals.netMrrPkr).toLocaleString()}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>$ {totals.netMrrUsd.toLocaleString(undefined, {maximumFractionDigits: 2})} /mo after deductions</div>
                            </div>
                            <div style={{ background: T.isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Cumulative Payout Pot ({monthsAccumulated} mo)</span>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#6366f1', marginTop: 4 }}>PKR {Math.round(totals.netMrrPkr * monthsAccumulated).toLocaleString()}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Total fund volume model allocation</div>
                            </div>
                            <div style={{ background: T.isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>Unallocated Surplus</span>
                                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginTop: 4 }}>
                                    {Math.max(0, 100 - totalEquityAllocated)}% ({Math.round(totals.netMrrPkr * monthsAccumulated * (Math.max(0, 100 - totalEquityAllocated) / 100)).toLocaleString()} PKR)
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Platform retention reserve buffer</div>
                            </div>
                        </div>
                    </div>

                    {/* Partners Grid & Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 20 }}>
                        
                        {/* Partners List */}
                        <div style={{ ...card }}>
                            <div style={{ fontWeight: 800, color: T.text, fontSize: 14, marginBottom: 16 }}>Equity Partner Profiles</div>
                            {partners.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                                    No partners registered. Use the sidebar profile form to add team members.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {partners.map(p => {
                                        const totalShare = totals.netMrrPkr * monthsAccumulated * (p.equityPct / 100);
                                        const totalDrawn = drawings.filter(d => d.partnerId === p.id).reduce((sum, d) => sum + d.amount, 0);
                                        const remaining = totalShare - totalDrawn;
                                        return (
                                            <div key={p.id} style={{ background: T.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 16, padding: 18, border: `1px solid ${T.border}`, position: 'relative' }}>
                                                <button onClick={() => removePartner(p.id)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#a5b4fc', fontSize: 13 }}>
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: T.text, fontSize: 14 }}>{p.name}</div>
                                                        <div style={{ fontSize: 11, color: T.textMuted }}>{p.role}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: `1px solid ${T.border}50`, paddingTop: 12, fontSize: 11, fontFamily: 'monospace' }}>
                                                    <div>
                                                        <span style={{ color: T.textMuted, fontSize: 10, display: 'block', marginBottom: 2 }}>Equity Share ({p.equityPct}%)</span>
                                                        <span style={{ fontWeight: 800, color: T.text }}>PKR {Math.round(totalShare).toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: T.textMuted, fontSize: 10, display: 'block', marginBottom: 2 }}>Amount Drawn</span>
                                                        <span style={{ fontWeight: 800, color: '#f59e0b' }}>PKR {Math.round(totalDrawn).toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: T.textMuted, fontSize: 10, display: 'block', marginBottom: 2 }}>Remaining</span>
                                                        <span style={{ fontWeight: 900, color: remaining >= 0 ? '#10b981' : '#ef4444' }}>PKR {Math.round(remaining).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Add Partner & Drawing Forms Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            
                            {/* Add Partner Form */}
                            <div style={{ ...card }}>
                                <div style={{ fontWeight: 800, color: T.text, fontSize: 13, marginBottom: 12 }}>Register New Partner</div>
                                <form onSubmit={addPartner} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div>
                                        <input type="text" placeholder="Full Name" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} style={inputStyle} required />
                                    </div>
                                    <div>
                                        <input type="text" placeholder="Role (e.g. VP Marketing)" value={newPartnerRole} onChange={e => setNewPartnerRole(e.target.value)} style={inputStyle} required />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" step="0.5" placeholder="Equity Share Percentage" value={newPartnerEquity} onChange={e => setNewPartnerEquity(e.target.value)} style={{ ...inputStyle, paddingRight: 24 }} required />
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 12 }}>%</span>
                                    </div>
                                    <button type="submit" style={{ padding: '9px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Plus size={13} /> Add Partner
                                    </button>
                                </form>
                            </div>

                            {/* Payout/Drawing Log Form */}
                            <div style={{ ...card }}>
                                <div style={{ fontWeight: 800, color: T.text, fontSize: 13, marginBottom: 12 }}>Log Partner Drawing</div>
                                <form onSubmit={logDrawing} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div>
                                        <select value={drawPartnerId} onChange={e => setDrawPartnerId(e.target.value)} style={{ ...inputStyle, padding: '7px 10px' }} required>
                                            <option value="">Select Partner...</option>
                                            {partners.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.equityPct}%)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" placeholder="Draw Amount" value={drawAmount} onChange={e => setDrawAmount(e.target.value)} style={{ ...inputStyle, paddingLeft: 40 }} required />
                                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 10, fontFamily: 'monospace' }}>PKR</span>
                                    </div>
                                    <div>
                                        <input type="text" placeholder="Description (e.g. Q1 Dividend)" value={drawDescription} onChange={e => setDrawDescription(e.target.value)} style={inputStyle} />
                                    </div>
                                    <button type="submit" style={{ padding: '9px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Activity size={13} /> Record Payout
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Drawings/Payouts Transaction Log Table */}
                    <div style={{ ...card }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontWeight: 800, color: T.text, fontSize: 14 }}>Drawing Transaction Logs</div>
                            {drawings.length > 0 && (
                                <button onClick={clearAllDrawings} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Clear History
                                </button>
                            )}
                        </div>
                        {drawings.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 12, fontFamily: 'monospace' }}>
                                No drawing payout records logged.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace', minWidth: 600 }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                            {['Date', 'Partner Name', 'Amount (PKR)', 'Description', 'Action'].map(h => (
                                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drawings.map(d => (
                                            <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}33` }}>
                                                <td style={{ padding: '10px 12px', color: T.textSub }}>{d.date}</td>
                                                <td style={{ padding: '10px 12px', fontWeight: 700, color: T.text }}>{d.partnerName}</td>
                                                <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: 700 }}>PKR {d.amount.toLocaleString()}</td>
                                                <td style={{ padding: '10px 12px', color: T.textMuted }}>{d.description}</td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <button onClick={() => removeDrawing(d.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                                                        Cancel
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* SUB TAB 4: FINANCIAL SETTINGS */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeSubTab === 'settings' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
                    
                    {/* Forex Exchange Rate */}
                    <div style={{ ...card }}>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Globe size={15} color="#6366f1" /> Forex Rate Configuration
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Configure the platform PKR/USD conversion rate. This modifies USD conversions in P&L waterfall visualizers.</div>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>1 USD =</span>
                            <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Math.max(1, parseInt(e.target.value) || 279))} style={{ ...inputStyle, paddingLeft: 76, color: '#a5b4fc', fontWeight: 800, fontSize: 14 }} />
                            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 11, fontFamily: 'monospace' }}>PKR</span>
                        </div>
                    </div>

                    {/* Variable Overhead Rate */}
                    <div style={{ ...card }}>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Activity size={15} color="#f59e0b" /> Variable Overhead Rate
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Overhead percentage applied as buffer costs (e.g. payment gateway volatility, transaction slippage).</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="range" min="0" max="30" step="0.5" value={variableExpenseRate} onChange={e => setVariableExpenseRate(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#f59e0b', cursor: 'pointer' }} />
                            <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: 14, fontFamily: 'monospace', width: 40, textAlign: 'right' }}>{variableExpenseRate}%</span>
                        </div>
                    </div>

                    {/* Server Capacity Limit */}
                    <div style={{ ...card }}>
                        <div style={{ fontWeight: 800, color: T.text, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HardDrive size={15} color="#10b981" /> Server Scaling Threshold
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Capacity threshold of total paying active store nodes before local scale upgrades are required.</div>
                        <div>
                            <input type="number" min="5" max="5000" value={serverCapacity} onChange={e => setServerCapacity(Math.max(5, parseInt(e.target.value) || 200))} style={{ ...inputStyle, fontWeight: 800, color: T.text, fontSize: 14 }} />
                        </div>
                    </div>
                </div>
            )}
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
    plans = [],
    mrr_trend = [],
    user_trend = [],
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
    const [selectedGraphSource, setSelectedGraphSource] = useState('money'); // 'money', 'stores', 'users'

    const activeECGData = React.useMemo(() => {
        let rawData = [];
        if (selectedGraphSource === 'money') {
            rawData = (mrr_trend || []).map(item => ({ val: parseFloat(item.mrr || 0), ds: item.month }));
        } else if (selectedGraphSource === 'stores') {
            rawData = (store_trend || []).map(item => ({ val: parseFloat(item.stores || 0), ds: item.month }));
        } else {
            rawData = (user_trend || []).map(item => ({ val: parseFloat(item.users || 0), ds: item.month }));
        }

        // Strictly no simulated data peaks! Show real database telemetry only
        if (rawData.length === 0) {
            // Draw a clean flat line of 0s across a 6-month historical span
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            return months.map(m => ({ val: 0, ds: m }));
        } else if (rawData.length === 1) {
            // Duplicate the single real data point to draw a solid, accurate flat line at that value
            return [
                { val: rawData[0].val, ds: rawData[0].ds },
                { val: rawData[0].val, ds: rawData[0].ds + ' (Current)' }
            ];
        }
        return rawData;
    }, [selectedGraphSource, mrr_trend, store_trend, user_trend]);

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
        'demo': 'Demo Store',
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
                            background: T.bgCard,
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                            <div>
                                                <span style={{ fontSize: 12, fontWeight: 900, color: T.text, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedGraphSource === 'money' ? '#10b981' : selectedGraphSource === 'stores' ? '#6366f1' : '#ec4899', boxShadow: `0 0 8px ${selectedGraphSource === 'money' ? '#10b981' : selectedGraphSource === 'stores' ? '#6366f1' : '#ec4899'}`, display: 'inline-block', animation: 'aurora 2s infinite ease-in-out' }} />
                                                    Platform HQ Telemetry
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, background: T.bgHeroCard, padding: 4, borderRadius: 12, border: `1px solid ${T.border}` }}>
                                                {[
                                                    { id: 'money', label: 'Revenue / MRR', icon: DollarSign, color: '#10b981' },
                                                    { id: 'stores', label: 'Registered Stores', icon: Building2, color: '#6366f1' },
                                                    { id: 'users', label: 'Platform Users', icon: Users, color: '#ec4899' },
                                                ].map(source => {
                                                    const isActive = selectedGraphSource === source.id;
                                                    const Icon = source.icon;
                                                    return (
                                                        <button
                                                            key={source.id}
                                                            onClick={() => setSelectedGraphSource(source.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: 10,
                                                                fontSize: 10,
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                transition: 'all 0.15s ease',
                                                                background: isActive ? source.color + '18' : 'transparent',
                                                                color: isActive ? source.color : T.textMuted,
                                                                border: `1px solid ${isActive ? source.color + '30' : 'transparent'}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 5,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Icon size={11} /> {source.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div style={{ height: 160, display: 'flex', alignItems: 'center', width: '100%', marginTop: 8 }}>
                                            <ECGGraph data={activeECGData} color={selectedGraphSource === 'money' ? '#10b981' : selectedGraphSource === 'stores' ? '#6366f1' : '#ec4899'} height={150} type={selectedGraphSource} isDark={isDark} />
                                        </div>
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
                    {activeTab === 'revenue' && <RevenueTab stats={safeStats} plans={plans} plan_distribution={plan_distribution} />}
                    {activeTab === 'support' && (
                        <SupportTab
                            tickets={tickets || []}
                            tickets_total={tickets_total || 0}
                            open_count={open_count || 0}
                            active_filter={active_filter || 'open'}
                        />
                    )}
                    {activeTab === 'feed' && <FeedTab activity_feed={activity_feed || []} />}
                    {activeTab === 'demo' && <DemoStoreTab />}
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


