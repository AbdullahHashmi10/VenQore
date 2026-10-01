import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import {
    DollarSign, TrendingUp, Store, Users, Wallet, CreditCard,
    ArrowUpRight, Sparkles, Zap, UserPlus, Layers, Ticket, ShieldCheck,
    AlertTriangle, Clock, Building2, Activity, Info,
} from 'lucide-react';
import { useT, Panel, KpiCard, Button, Badge, EmptyState, StatusBadge } from '@/Platform/ui';
import { BRAND, GRADIENTS, fmtCurrency, fmtNumber, statusColor } from '@/Platform/theme';
import { series } from '@/theme/runtime';
import { resolveHref } from '@/Platform/nav';

// DESIGN-RULES §5 — the eight categorical slots, in order. The old list drew
// BRAND.violet and BRAND.fuchsia from adjacent stops of one ramp, so two plan
// bands rendered near-identically.
const PLAN_COLORS = series.light.slice(0, 7);

export default function Overview({ stats = {}, revenue = {}, store_trend = [], plan_distribution = [], recent_stores = [], expiring_stores = [], activity_feed = [] }) {
    const t = useT();
    const period = stats.period || 'all';

    const mrr = revenue.mrr ?? stats.mrr ?? 0;
    const arr = revenue.arr ?? stats.arr ?? 0;
    const gmv = revenue.gmv ?? stats.total_volume ?? 0;
    const net = revenue.net_revenue ?? stats.net_revenue ?? 0;
    const paid = revenue.paid_count ?? stats.paid_subscribers ?? 0;

    const planRows = (plan_distribution || []).filter((p) => p.count > 0);

    const setPeriod = (p) => router.get(window.route('platform.dashboard'), { period: p }, { preserveState: true, preserveScroll: true, replace: true });

    const periods = [
        { value: 'today', label: 'Today' },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
        { value: 'all', label: 'All time' },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.indigo2 }}>Mission Control</span>
                    </div>
                    <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: t.ink }}>
                        Platform Overview
                    </h1>
                    <p style={{ margin: '5px 0 0', fontSize: 13.5, color: t.muted }}>Everything that matters about VenQore, at a glance.</p>
                </div>
                <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: t.inputBg, border: `1px solid ${t.border}` }}>
                    {periods.map((p) => (
                        <button key={p.value} onClick={() => setPeriod(p.value)} className="vq-press" style={{
                            padding: '7px 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                            border: 'none', fontFamily: 'inherit',
                            background: period === p.value ? GRADIENTS.brand : 'transparent',
                            color: period === p.value ? '#fff' : t.muted,
                        }}>{p.label}</button>
                    ))}
                </div>
            </div>

            {/* ── Money split: Revenue vs GMV (the audit's headline fix) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16, marginBottom: 16 }}>
                <Panel hover pad={22} style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: GRADIENTS.revenue, opacity: t.isDark ? 0.13 : 0.08 }} />
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: BRAND.emerald }}>MRR · Revenue (paid)</span>
                                    <Info size={13} color={t.faint} title="Real paid subscriptions only — excludes internal & demo stores." />
                                </div>
                                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: t.ink, marginTop: 6, lineHeight: 1 }}>{fmtCurrency(mrr)}</div>
                                <div style={{ fontSize: 13, color: t.sub, marginTop: 8 }}>
                                    {fmtCurrency(arr)} ARR · {fmtCurrency(net)} net · {fmtNumber(paid)} paid subscriber{paid === 1 ? '' : 's'}
                                </div>
                            </div>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${BRAND.emerald}22`, color: BRAND.emerald, display: 'grid', placeItems: 'center', border: `1px solid ${BRAND.emerald}33`, flexShrink: 0 }}>
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: t.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={12} /> Computed server-side · excludes internal & demo
                        </div>
                    </div>
                </Panel>

                <Panel hover pad={22} style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: GRADIENTS.gmv, opacity: t.isDark ? 0.12 : 0.07 }} />
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: BRAND.sky }}>Platform GMV (merchant volume)</span>
                                </div>
                                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: t.ink, marginTop: 6, lineHeight: 1 }}>{fmtCurrency(gmv)}</div>
                                <div style={{ fontSize: 13, color: t.sub, marginTop: 8 }}>Total sales flowing through merchant stores</div>
                            </div>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${BRAND.sky}22`, color: BRAND.sky, display: 'grid', placeItems: 'center', border: `1px solid ${BRAND.sky}33`, flexShrink: 0 }}>
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: t.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Info size={12} /> This is merchant turnover — <b style={{ color: t.muted }}>not</b> VenQore income
                        </div>
                    </div>
                </Panel>
            </div>

            {/* ── KPI strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14, marginBottom: 20 }}>
                <KpiCard label="Total Stores" value={fmtNumber(stats.total_stores)} sub={`${fmtNumber(stats.active_stores)} active · ${fmtNumber(stats.trial_stores)} trial`} icon={Store} accent={BRAND.indigo} />
                <KpiCard label="Platform Users" value={fmtNumber(stats.total_users)} sub={`${fmtNumber(stats.platform_admins)} admins`} icon={Users} accent={BRAND.violet} />
                <KpiCard label="New This Month" value={fmtNumber(stats.new_this_month)} sub={`${fmtNumber(stats.new_today)} today`} icon={UserPlus} accent={BRAND.emerald} />
                <KpiCard label="Suspended" value={fmtNumber(stats.suspended_stores)} sub={`${fmtNumber(stats.churned_stores)} churned`} icon={AlertTriangle} accent={BRAND.amber} />
            </div>

            {/* ── Charts row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, marginBottom: 20 }} className="vq-grid-collapse">
                {/* Growth trend */}
                <Panel pad={20}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: t.ink }}>Store Growth</div>
                            <div style={{ fontSize: 12, color: t.muted }}>New store registrations over time</div>
                        </div>
                        <Badge color={BRAND.indigo}><Activity size={11} /> Live</Badge>
                    </div>
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={store_trend} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="vqArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={BRAND.indigo} stopOpacity={0.5} />
                                        <stop offset="100%" stopColor={BRAND.indigo} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.muted }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: t.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 12, fontSize: 12, color: t.ink }} />
                                <Area type="monotone" dataKey="stores" stroke={BRAND.indigo} strokeWidth={2.5} fill="url(#vqArea)" animationDuration={700} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                {/* Plan distribution */}
                <Panel pad={20}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.ink, marginBottom: 2 }}>Plan Distribution</div>
                    <div style={{ fontSize: 12, color: t.muted, marginBottom: 10 }}>Active stores by plan</div>
                    {planRows.length === 0 ? (
                        <EmptyState icon={Layers} title="No active plans yet" />
                    ) : (
                        <>
                            <div style={{ height: 150 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={planRows} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={3} stroke="none">
                                            {planRows.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 12, fontSize: 12, color: t.ink }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ marginTop: 8 }}>
                                {planRows.map((p, i) => (
                                    <div key={p.plan} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5 }}>
                                        <span style={{ width: 9, height: 9, borderRadius: 3, background: PLAN_COLORS[i % PLAN_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ flex: 1, color: t.sub, textTransform: 'capitalize', fontWeight: 600 }}>{p.plan}</span>
                                        <span style={{ color: t.muted }}>{p.count}</span>
                                        <span style={{ color: t.ink, fontWeight: 700, minWidth: 56, textAlign: 'right' }}>{fmtCurrency(p.mrr)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Panel>
            </div>

            {/* ── Quick actions ── */}
            <Panel pad={18} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Zap size={16} color={BRAND.amber} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Quick Actions</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
                    <QuickAction t={t} icon={Layers} label="Create a Plan" desc="New pricing tier" color={BRAND.indigo} onClick={() => router.visit(window.route('platform.plans.index'))} />
                    <QuickAction t={t} icon={Ticket} label="New Coupon" desc="Discount code" color={BRAND.violet} onClick={() => router.visit(window.route('platform.coupons.index'))} />
                    <QuickAction t={t} icon={Building2} label="Manage Stores" desc="All merchants" color={BRAND.sky} onClick={() => router.visit(window.route('platform.stores'))} />
                    <QuickAction t={t} icon={ShieldCheck} label="Run Health Check" desc="Test the platform" color={BRAND.emerald} onClick={() => router.visit(`${window.route('platform.dashboard')}?view=testing`)} />
                </div>
            </Panel>

            {/* ── Activity + expiring ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16 }} className="vq-grid-collapse">
                {/* Activity feed */}
                <Panel pad={20}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: t.ink, marginBottom: 14 }}>Recent Activity</div>
                    {(activity_feed || []).length === 0 ? (
                        <EmptyState icon={Activity} title="No recent activity" message="New signups and status changes will appear here." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {activity_feed.map((a, i) => {
                                const color = a.color === 'amber' ? BRAND.amber : BRAND.indigo;
                                return (
                                    <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 8px', borderRadius: 10, alignItems: 'flex-start' }} className="vq-row">
                                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}1f`, color, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                                            {a.icon === 'alert' ? <AlertTriangle size={15} /> : <Building2 size={15} />}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{stripEmoji(a.message)}</div>
                                            <div style={{ fontSize: 11.5, color: t.muted, marginTop: 1 }}>{a.sub}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Panel>

                {/* Expiring trials */}
                <Panel pad={20}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Clock size={16} color={BRAND.amber} />
                        <span style={{ fontSize: 15, fontWeight: 800, color: t.ink }}>Trials Expiring Soon</span>
                    </div>
                    {(expiring_stores || []).length === 0 ? (
                        <EmptyState icon={Clock} title="No trials expiring" message="Trials ending within 7 days show up here." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {expiring_stores.map((s) => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                        <div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.owner_email}</div>
                                    </div>
                                    <Badge color={s.days_left <= 2 ? BRAND.rose : BRAND.amber}>{s.days_left}d left</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            <style>{`@media (max-width: 900px){ .vq-grid-collapse{ grid-template-columns: 1fr !important; } }`}</style>
        </div>
    );
}

function QuickAction({ t, icon: Icon, label, desc, color, onClick }) {
    return (
        <button onClick={onClick} className="vq-press vq-card-hover" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 13,
            background: t.inputBg, border: `1px solid ${t.border}`, cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit', width: '100%',
        }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}1f`, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.ink }}>{label}</div>
                <div style={{ fontSize: 11.5, color: t.muted }}>{desc}</div>
            </div>
            <ArrowUpRight size={16} color={t.faint} />
        </button>
    );
}

function stripEmoji(s) {
    return String(s || '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu, '').trim();
}
