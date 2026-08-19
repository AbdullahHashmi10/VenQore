import React, { useRef, useEffect, useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import { vq } from '@/theme/runtime';
import {
    TrendingUp, TrendingDown, DollarSign, Users, Package,
    AlertCircle, Clock, FileText, Activity, ArrowUpRight,
    Receipt, ClipboardList, Wallet, Settings, Shield,
    Plus, Minus, MoreHorizontal
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { LaserFlow } from '@/Components/ReactBits/LaserFlow';
import SplitText from '@/Components/ReactBits/SplitText';
import {
    BklitAreaChart, BklitDonut, BklitBarChart,
    RingChart, Ring, RingCenter,
    Legend, LegendItemComponent, LegendMarker, LegendLabel, LegendValue, LegendProgress
} from '@/Components/Bklit/Charts';

/* ─────────────────────────────────────────────
   VQ v2 chart series (resolved at runtime from CSS vars)
   We pull the computed value once on mount.
────────────────────────────────────────────── */
function getCssVar(name) {
    if (typeof window === 'undefined') return '#888';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

/* ─────────────────────────────────────────────
   Tiny reusable pieces
────────────────────────────────────────────── */

function Eyebrow({ children, color }) {
    return (
        <span style={{
            fontFamily: 'var(--vq-font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: color || 'var(--vq-text-3)',
            display: 'block',
            lineHeight: 1.4,
        }}>
            {children}
        </span>
    );
}

function Pill({ type = 'neutral', children }) {
    const styles = {
        ok:      { bg: 'var(--vq-success-bg)',  color: 'var(--vq-success)',  ring: 'var(--vq-success-line)'  },
        warn:    { bg: 'var(--vq-warning-bg)',  color: 'var(--vq-warning)',  ring: 'var(--vq-warning-line)'  },
        bad:     { bg: 'var(--vq-danger-bg)',   color: 'var(--vq-danger)',   ring: 'var(--vq-danger-line)'   },
        neutral: { bg: 'var(--vq-sunken)',      color: 'var(--vq-text-2)',   ring: 'var(--vq-line-soft)'     },
    };
    const s = styles[type] || styles.neutral;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: 'var(--vq-r-sm)',
            fontSize: '11px', fontWeight: 500, lineHeight: 1.5,
            background: s.bg, color: s.color,
            boxShadow: `inset 0 0 0 1px ${s.ring}`,
            fontFamily: 'var(--vq-font-sans)',
            whiteSpace: 'nowrap',
        }}>
            {children}
        </span>
    );
}

function IconBadge({ icon: Icon, color }) {
    return (
        <div style={{
            width: '38px', height: '38px', borderRadius: 'var(--vq-r-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            color,
        }}>
            <Icon size={18} />
        </div>
    );
}

function CountUp({ value, prefix = '', suffix = '', decimals = 0 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const target = parseFloat(value) || 0;
        if (target === 0) { setDisplay(0); return; }
        let start = null;
        const dur = 1000;
        const step = ts => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            setDisplay(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [value]);
    const fmt = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
    return <>{prefix}{fmt}{suffix}</>;
}

/* Card wrapper — VQ surface + elev model */
function Card({ children, style = {}, pad = '18px 20px', hover = true }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            style={{
                background: 'var(--vq-surface)',
                border: `1px solid ${hov && hover ? 'var(--vq-line-strong)' : 'var(--vq-line)'}`,
                borderRadius: 'var(--vq-r-xl)',
                boxShadow: hov && hover ? 'var(--vq-elev-2)' : 'var(--vq-elev-1)',
                padding: pad,
                transition: 'border-color 180ms, box-shadow 180ms, transform 180ms',
                transform: hov && hover ? 'translateY(-2px)' : 'none',
                fontFamily: 'var(--vq-font-sans)',
                ...style,
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            {children}
        </div>
    );
}

/* Custom recharts tooltip matching VQ surface */
function VqTooltip({ active, payload, label, formatter, currencySymbol }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--vq-raised)',
            border: '1px solid var(--vq-line)',
            borderRadius: 'var(--vq-r-md)',
            boxShadow: 'var(--vq-elev-3)',
            padding: '10px 14px',
            fontFamily: 'var(--vq-font-sans)',
            fontSize: '12px',
            color: 'var(--vq-text)',
            minWidth: '120px',
        }}>
            {label && <div style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '10px', color: 'var(--vq-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>}
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: i > 0 ? '4px' : 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--vq-text-2)' }}>{p.name}</span>
                    <span style={{ fontFamily: 'var(--vq-font-mono)', fontWeight: 600, color: 'var(--vq-text)', marginLeft: 'auto' }}>
                        {typeof formatter === 'function' ? formatter(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* Activity row */
function ActivityRow({ act }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 'var(--vq-r-md)',
                background: hov ? 'var(--vq-sunken)' : 'transparent',
                transition: 'background 100ms',
                borderBottom: '1px solid var(--vq-line-soft)',
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                    width: '28px', height: '28px', borderRadius: 'var(--vq-r-sm)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: act.is_plus ? 'var(--vq-success-bg)' : 'var(--vq-danger-bg)',
                    color: act.is_plus ? 'var(--vq-success)' : 'var(--vq-danger)',
                    boxShadow: `inset 0 0 0 1px ${act.is_plus ? 'var(--vq-success-line)' : 'var(--vq-danger-line)'}`,
                }}>
                    {act.is_plus ? <Plus size={12} /> : <Minus size={12} />}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--vq-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act.title}
                    </div>
                    <div style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '10px', color: 'var(--vq-text-3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={8} /> {act.time}
                    </div>
                </div>
            </div>
            <span style={{
                fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums',
                fontSize: '12px', fontWeight: 600, flexShrink: 0, marginLeft: '8px',
                color: act.is_plus ? 'var(--vq-success)' : 'var(--vq-danger)',
            }}>
                {act.amount}
            </span>
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────── */
export default function AdminDashboard({
    stats = { net_profit: 0, total_revenue: 0, total_expenses: 0, active_staff: 0, total_staff: 0 },
    profitData = [],
    recentActivity = [],
    inventoryHealth = { healthy: 0, lowStock: 0, outOfStock: 0, lowStockCount: 0 },
    expenseData = [],
    paymentMethods = [],
    currencySymbol = '$'
}) {
    const { store } = usePage().props;
    if (!store?.slug) return null;

    /* VQ chart series — read from CSS at runtime */
    const S = [
        'var(--vq-series-1)', 'var(--vq-series-2)', 'var(--vq-series-3)',
        'var(--vq-series-4)', 'var(--vq-series-5)', 'var(--vq-series-6)',
    ];

    const totalExpenseValue = expenseData.reduce((a, c) => a + (parseFloat(c.value) || 0), 0);
    const finalExpenseData = totalExpenseValue > 0
        ? expenseData.map((d, i) => ({ ...d, pct: Math.round((d.value / totalExpenseValue) * 100), color: S[i % 6] }))
        : [{ name: 'No Data', value: 1, pct: 0, color: 'var(--vq-line)' }];

    const invStats = [
        { k: 'Healthy', val: inventoryHealth.healthy ?? 0,    type: 'ok',      color: S[0] },
        { k: 'Low',     val: inventoryHealth.lowStock ?? 0,   type: 'warn',    color: S[1] },
        { k: 'Out',     val: inventoryHealth.outOfStock ?? 0, type: 'bad',     color: S[5] },
    ];
    const pieInv = invStats.filter(d => d.val > 0).map(d => ({ name: d.k, value: d.val, color: d.color }));
    const emptyPie = [{ name: 'No Data', value: 1, color: 'var(--vq-line)' }];

    const invStatus = inventoryHealth.outOfStock > 0 ? { label: 'Action Needed', type: 'bad' }
                    : inventoryHealth.lowStock   > 0 ? { label: 'Low Stock',      type: 'warn' }
                    :                                  { label: 'Healthy',        type: 'ok' };

    const profitMarginPct = stats.total_revenue > 0
        ? Math.round((stats.net_profit / stats.total_revenue) * 100) : 0;

    const payPie = paymentMethods.length > 0
        ? paymentMethods.map((m, i) => ({ ...m, color: S[i % 6] }))
        : emptyPie;

    const [inventoryHoveredIndex, setInventoryHoveredIndex] = useState(null);

    /* Get accent colour for LaserFlow (teal, extracted from CSS) */
    const [laserColor, setLaserColor] = useState('#2EC4B6');
    useEffect(() => {
        const c = getCssVar('--vq-accent');
        if (c && c !== '#888') setLaserColor(c);
    }, []);

    return (
        <OneGlanceLayout title="Executive Dashboard" mode="admin" noPadding={true}>
            <Head title="Executive Dashboard" />

            <style>{`
                :root, [data-theme="dark"], [data-theme="light"], .admin-layout, main, #app {
                    --vq-teal-400: #00aa98 !important;
                    --vq-teal-500: #00aa98 !important;
                    --vq-teal-600: #009988 !important;
                    --vq-accent: #00aa98 !important;
                    --vq-series-1: #00aa98 !important;
                    --chart-1: #00aa98 !important;
                }
                @keyframes vq-fade-up {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .exec-fade { animation: vq-fade-up 0.5s cubic-bezier(0,0,.2,1) both; }
                .exec-fade:nth-child(1) { animation-delay: 0.00s; }
                .exec-fade:nth-child(2) { animation-delay: 0.05s; }
                .exec-fade:nth-child(3) { animation-delay: 0.10s; }
                .exec-fade:nth-child(4) { animation-delay: 0.15s; }
                .exec-fade:nth-child(5) { animation-delay: 0.20s; }

                /* SplitText h1 */
                .exec-h1.split-parent {
                    font-size: 22px !important;
                    line-height: 1.2 !important;
                    letter-spacing: -0.025em !important;
                    font-weight: 600 !important;
                    color: var(--vq-text) !important;
                    font-family: var(--vq-font-sans) !important;
                    margin: 0 !important;
                    display: block !important;
                }
                .exec-h1 .split-word { display: inline-block !important; }

                /* Shine sweep for section labels */
                @keyframes vq-shine-sweep {
                    0%   { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                .shine-label {
                    font-family: var(--vq-font-mono);
                    font-size: 10px;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    font-weight: 600;
                    background-image: linear-gradient(110deg,
                        var(--vq-accent-text) 0%,
                        var(--vq-accent-text) 35%,
                        #fff 50%,
                        var(--vq-accent-text) 65%,
                        var(--vq-accent-text) 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: vq-shine-sweep 3.5s linear infinite;
                    display: inline-block;
                }
            `}</style>

            {/* ═══ PAGE WRAPPER ═══ */}
            <div style={{
                display: 'flex', gap: '14px', height: '100%', width: '100%',
                padding: '14px 18px', overflow: 'hidden', boxSizing: 'border-box',
                fontFamily: 'var(--vq-font-sans)',
                background: 'var(--vq-bg)',
            }}>

                {/* ═══ LEFT + CENTRE ═══ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, overflow: 'hidden' }}>

                    {/* ── Page header ── */}
                    <div className="exec-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div>
                            <Eyebrow color="var(--vq-accent-text)">Executive Overview</Eyebrow>
                            <div style={{ marginTop: '3px' }}>
                                <SplitText
                                    text="Business Dashboard"
                                    tag="h1"
                                    className="exec-h1"
                                    splitType="words"
                                    from={{ opacity: 0, y: 18 }}
                                    to={{ opacity: 1, y: 0 }}
                                    duration={0.65}
                                    delay={55}
                                    textAlign="left"
                                />
                            </div>
                        </div>
                        <Link
                            href={route('store.admin.settings', { store_slug: store.slug })}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                height: '32px', padding: '0 14px', borderRadius: 'var(--vq-r-md)',
                                fontSize: '12px', fontWeight: 500, color: 'var(--vq-text-2)',
                                border: '1px solid var(--vq-line)', background: 'transparent',
                                textDecoration: 'none', transition: 'background 180ms',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--vq-sunken)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Settings size={13} /> Settings
                        </Link>
                    </div>

                    {/* ── TOP KPI ROW ── */}
                    <div className="exec-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', flexShrink: 0 }}>
                        {/* Pending Actions */}
                        <Link href={route('store.reports.low-stock', { store_slug: store.slug })} style={{ textDecoration: 'none', display: 'block' }}>
                            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                    <IconBadge icon={ClipboardList} color="var(--vq-warning)" />
                                    <div>
                                        <Eyebrow>Pending Actions</Eyebrow>
                                        <div style={{ marginTop: '5px' }}>
                                            {inventoryHealth.lowStockCount > 0
                                                ? <Pill type="warn"><AlertCircle size={9} /> Action Needed</Pill>
                                                : <Pill type="ok">All clear</Pill>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--vq-text)', lineHeight: 1 }}>
                                        {inventoryHealth.lowStockCount > 0 ? inventoryHealth.lowStockCount : 0}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--vq-text-3)', marginTop: '3px' }}>items</div>
                                </div>
                            </Card>
                        </Link>

                        {/* Profit Margin */}
                        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <IconBadge icon={TrendingUp} color="var(--vq-success)" />
                                <div>
                                    <Eyebrow>Profit Margin</Eyebrow>
                                    <div style={{ marginTop: '5px' }}><Pill type="ok"><ArrowUpRight size={9} /> Healthy</Pill></div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--vq-text)', lineHeight: 1 }}>
                                    <CountUp value={profitMarginPct} suffix="%" />
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--vq-text-3)', marginTop: '3px' }}>net / revenue</div>
                            </div>
                        </Card>

                        {/* Overdue */}
                        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <IconBadge icon={Receipt} color="var(--vq-mod-reports-accent)" />
                                <div>
                                    <Eyebrow>Overdue</Eyebrow>
                                    <div style={{ marginTop: '5px' }}>
                                        {stats.overdue_payments > 0 ? <Pill type="bad">Outstanding</Pill> : <Pill type="ok">On Track</Pill>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: stats.overdue_payments > 0 ? 'var(--vq-danger)' : 'var(--vq-text)', lineHeight: 1 }}>
                                    {formatCurrency(stats.overdue_payments)}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--vq-text-3)', marginTop: '3px' }}>receivables</div>
                            </div>
                        </Card>
                    </div>

                    {/* ── CHARTS GRID ── */}
                    <div className="exec-fade" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: '12px', overflow: 'hidden' }}>

                        {/* Purchases Trend — top left */}
                        <Card hover={false} pad="16px 18px" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexShrink: 0 }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>Purchases Trend</div>
                                    <Eyebrow>Past 6 months spending</Eyebrow>
                                </div>
                                <IconBadge icon={TrendingUp} color="var(--vq-mod-accounting-accent, var(--vq-accent))" />
                            </div>
                            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
                                <BklitAreaChart
                                    data={profitData}
                                    dataKey="purchases"
                                    xKey="month"
                                    name="Purchases"
                                    color="var(--chart-1)"
                                    currencySymbol={currencySymbol}
                                    valueFormatter={v => `${currencySymbol} ${v.toLocaleString()}`}
                                />
                            </div>
                        </Card>

                        {/* Inventory — top right (Bklit RingChart + Legend) */}
                        <Card hover={false} pad="14px 16px" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexShrink: 0 }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>Inventory</div>
                                    <Pill type={invStatus.type}>{invStatus.label}</Pill>
                                </div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', minHeight: 0 }}>
                                <RingChart
                                    data={invStats}
                                    hoveredIndex={inventoryHoveredIndex}
                                    onHoverChange={setInventoryHoveredIndex}
                                    size={120}
                                    strokeWidth={8}
                                    ringGap={4}
                                >
                                    {invStats.map((_, i) => <Ring index={i} key={i} />)}
                                    <RingCenter defaultLabel="Inventory" />
                                </RingChart>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Legend
                                        hoveredIndex={inventoryHoveredIndex}
                                        items={invStats}
                                        onHoverChange={setInventoryHoveredIndex}
                                    >
                                        <LegendItemComponent>
                                            <LegendMarker />
                                            <LegendLabel />
                                            <LegendValue showPercentage />
                                        </LegendItemComponent>
                                        <LegendProgress />
                                    </Legend>
                                </div>
                            </div>
                        </Card>

                        {/* Payments — bottom left */}
                        <Card hover={false} pad="16px 18px" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '10px', flexShrink: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>Payments</div>
                                <Eyebrow>Transaction types</Eyebrow>
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px', minHeight: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                    {paymentMethods.length > 0 ? paymentMethods.map((m, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: S[i % 6], flexShrink: 0 }} />
                                                <Eyebrow>{m.name}</Eyebrow>
                                            </div>
                                            <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '15px', fontWeight: 600, color: 'var(--vq-text)', marginLeft: '11px', lineHeight: 1.2 }}>
                                                {m.value}
                                            </div>
                                        </div>
                                    )) : <span style={{ fontSize: '12px', color: 'var(--vq-text-3)' }}>No sales yet</span>}
                                </div>
                                <div style={{ flex: 1, height: '100%', minHeight: 0 }}>
                                    <BklitDonut
                                        data={payPie}
                                        centerLabel={paymentMethods.reduce((a, c) => a + (parseInt(c.value) || 0), 0).toString()}
                                        centerSublabel="Total Sales"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Expenses — bottom right */}
                        <Card hover={false} pad="16px 18px" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexShrink: 0 }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)', letterSpacing: '-0.01em', marginBottom: '2px' }}>Expenses</div>
                                    <Eyebrow>Monthly breakdown</Eyebrow>
                                </div>
                                <div>
                                    <Eyebrow>Total</Eyebrow>
                                    <div style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)' }}>{formatCurrency(totalExpenseValue)}</div>
                                </div>
                            </div>
                            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '42%', height: '100%', flexShrink: 0 }}>
                                    <BklitDonut
                                        data={finalExpenseData}
                                        valueFormatter={v => `${currencySymbol} ${v.toLocaleString()}`}
                                    />
                                </div>
                                <div style={{
                                    flex: 1, display: 'grid',
                                    gridTemplateColumns: finalExpenseData.length > 2 ? '1fr 1fr' : '1fr',
                                    gap: '5px', alignContent: 'center',
                                }}>
                                    {finalExpenseData.map((d, i) => (
                                        <div key={i} style={{ padding: '6px 8px', borderRadius: 'var(--vq-r-sm)', background: 'var(--vq-sunken)', border: '1px solid var(--vq-line-soft)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                                                <Eyebrow>{d.name}</Eyebrow>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* ── BOTTOM KPI ROW ── */}
                    <div className="exec-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', flexShrink: 0 }}>
                        <Card pad="14px 18px">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <IconBadge icon={Users} color="var(--vq-mod-staff-accent, var(--vq-accent))" />
                                    <Eyebrow>Active Staff</Eyebrow>
                                </div>
                                <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '20px', fontWeight: 600, color: 'var(--vq-text)', letterSpacing: '-0.02em' }}>
                                    <CountUp value={stats.active_staff} /> / {stats.total_staff}
                                </div>
                            </div>
                        </Card>
                        <Card pad="14px 18px">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <IconBadge icon={Activity} color="var(--vq-success)" />
                                    <Eyebrow>System Status</Eyebrow>
                                </div>
                                <span style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--vq-success)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Operational</span>
                            </div>
                        </Card>
                        <Card pad="14px 18px">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <IconBadge icon={Clock} color="var(--vq-mod-platform-accent, var(--vq-text-2))" />
                                    <Eyebrow>Last Backup</Eyebrow>
                                </div>
                                <div style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--vq-text)' }}>
                                    {stats.last_backup || 'N/A'}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ═══ RIGHT PANEL — LaserFlow backlit hero + feed ═══ */}
                <div style={{
                    width: '286px', flexShrink: 0, height: '100%',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    overflow: 'hidden',
                }}>

                    {/* ── Net Balance Hero Card ── */}
                    <Card className="exec-fade" hover={false} pad="18px" style={{
                        position: 'relative', overflow: 'hidden', flexShrink: 0,
                        background: 'var(--vq-surface)',
                        border: '1px solid var(--vq-line-strong)',
                        boxShadow: 'var(--vq-elev-2)',
                    }}>
                        {/* Subtle background accent glow */}
                        <div style={{
                            position: 'absolute', top: '-40px', right: '-40px',
                            width: '140px', height: '140px', borderRadius: '50%',
                            background: 'var(--vq-accent)', opacity: 0.12,
                            filter: 'blur(35px)', pointerEvents: 'none',
                        }} />

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Top: wallet + balance */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <IconBadge icon={Wallet} color="var(--vq-accent)" />
                                <div>
                                    <Eyebrow color="var(--vq-text-3)">Net Balance</Eyebrow>
                                    <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '22px', fontWeight: 600, color: 'var(--vq-text)', letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: '2px' }}>
                                        {formatCurrency(stats.net_balance)}
                                    </div>
                                </div>
                            </div>

                            {/* Cash IN / OUT */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div style={{ background: 'var(--vq-sunken)', borderRadius: 'var(--vq-r-md)', padding: '10px 12px', border: '1px solid var(--vq-line-soft)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <TrendingUp size={13} style={{ color: 'var(--vq-success)' }} />
                                        <span style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--vq-success)', textTransform: 'uppercase', fontWeight: 600 }}>IN</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)' }}>{formatCurrency(stats.today_in)}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--vq-text-3)', marginTop: '2px' }}>Today's In</div>
                                </div>
                                <div style={{ background: 'var(--vq-sunken)', borderRadius: 'var(--vq-r-md)', padding: '10px 12px', border: '1px solid var(--vq-line-soft)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <TrendingDown size={13} style={{ color: 'var(--vq-danger)' }} />
                                        <span style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--vq-danger)', textTransform: 'uppercase', fontWeight: 600 }}>OUT</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '13px', fontWeight: 600, color: 'var(--vq-text)' }}>{formatCurrency(stats.today_out)}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--vq-text-3)', marginTop: '2px' }}>Today's Out</div>
                                </div>
                            </div>

                            {/* Quick links row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                                {[
                                    { label: 'Users',   icon: Users,    route: 'store.admin.users' },
                                    { label: 'Reports', icon: FileText,  route: 'store.reports.index' },
                                    { label: 'Logs',    icon: Activity,  route: 'store.activity-log.index' },
                                ].map((s, i) => (
                                    <Link key={i}
                                        href={route(s.route, { store_slug: store.slug })}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                            padding: '8px 4px', borderRadius: 'var(--vq-r-md)',
                                            background: 'var(--vq-sunken)',
                                            border: '1px solid var(--vq-line-soft)',
                                            textDecoration: 'none', transition: 'background 180ms, border-color 180ms',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--vq-raised)'; e.currentTarget.style.borderColor = 'var(--vq-line-strong)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--vq-sunken)'; e.currentTarget.style.borderColor = 'var(--vq-line-soft)'; }}
                                    >
                                        <s.icon size={14} style={{ color: 'var(--vq-text-2)' }} />
                                        <span style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--vq-text-3)', fontWeight: 500 }}>{s.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* ── Alerts ── */}
                    <Card className="exec-fade" hover={false} pad="14px 16px" style={{ flexShrink: 0 }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span className="shine-label">Alerts</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {inventoryHealth.lowStock > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--vq-warning-bg)', borderRadius: 'var(--vq-r-sm)', boxShadow: 'inset 0 0 0 1px var(--vq-warning-line)' }}>
                                    <Package size={12} style={{ color: 'var(--vq-warning)', flexShrink: 0 }} />
                                    <p style={{ fontSize: '12px', color: 'var(--vq-warning)', margin: 0 }}>{inventoryHealth.lowStock}% inventory low</p>
                                </div>
                            )}
                            {inventoryHealth.outOfStock > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--vq-danger-bg)', borderRadius: 'var(--vq-r-sm)', boxShadow: 'inset 0 0 0 1px var(--vq-danger-line)' }}>
                                    <AlertCircle size={12} style={{ color: 'var(--vq-danger)', flexShrink: 0 }} />
                                    <p style={{ fontSize: '12px', color: 'var(--vq-danger)', margin: 0 }}>{inventoryHealth.outOfStock}% out of stock</p>
                                </div>
                            )}
                            {inventoryHealth.lowStock === 0 && inventoryHealth.outOfStock === 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--vq-success-bg)', borderRadius: 'var(--vq-r-sm)', boxShadow: 'inset 0 0 0 1px var(--vq-success-line)' }}>
                                    <TrendingUp size={12} style={{ color: 'var(--vq-success)', flexShrink: 0 }} />
                                    <p style={{ fontSize: '12px', color: 'var(--vq-success)', margin: 0 }}>All systems good</p>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--vq-accent-quiet)', borderRadius: 'var(--vq-r-sm)', boxShadow: 'inset 0 0 0 1px rgba(50,120,130,0.2)' }}>
                                <DollarSign size={12} style={{ color: 'var(--vq-accent-text)', flexShrink: 0 }} />
                                <p style={{ fontSize: '12px', color: 'var(--vq-accent-text)', margin: 0 }}>Profit: {formatCurrency(stats.net_profit)}</p>
                            </div>
                        </div>
                    </Card>

                    {/* ── Business Activity Feed ── */}
                    <Card className="exec-fade" hover={false} pad="14px 16px" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
                            <span className="shine-label">Activity</span>
                            <Link
                                href={route('store.funds.index', { store_slug: store.slug, view: 'history' })}
                                style={{ fontFamily: 'var(--vq-font-mono)', fontSize: '10px', color: 'var(--vq-accent-text)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                            >
                                View All
                            </Link>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                                <ActivityRow key={i} act={act} />
                            )) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--vq-text-3)', gap: '8px', padding: '20px 0' }}>
                                    <Activity size={20} />
                                    <Eyebrow>No Recent Activity</Eyebrow>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* ── Footer Actions ── */}
                    <div className="exec-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flexShrink: 0 }}>
                        <Link href={route('store.admin.settings', { store_slug: store.slug })}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                padding: '9px', borderRadius: 'var(--vq-r-md)', fontSize: '11px', fontWeight: 500,
                                fontFamily: 'var(--vq-font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                                color: 'var(--vq-text-2)', background: 'var(--vq-sunken)',
                                border: '1px solid var(--vq-line-soft)', textDecoration: 'none',
                                transition: 'background 180ms',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--vq-surface)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--vq-sunken)'}
                        >
                            <Settings size={12} /> Settings
                        </Link>
                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '9px', borderRadius: 'var(--vq-r-md)', fontSize: '11px', fontWeight: 500,
                            fontFamily: 'var(--vq-font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: 'var(--vq-text-2)', background: 'var(--vq-sunken)',
                            border: '1px solid var(--vq-line-soft)', cursor: 'pointer',
                            transition: 'background 180ms',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--vq-surface)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--vq-sunken)'}
                        >
                            <Shield size={12} /> Security
                        </button>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
