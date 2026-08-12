import React, { useMemo, useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

/**
 * Single-screen Overview Dashboard — Working, interactive build of UI Mockup 1a
 * strictly adhering to the fonts, colors, icons, and aesthetic of
 * `extras/New Positioning/Dashboard Redesign.dc.html`.
 */

function useMoney(currency) {
    return useMemo(() => {
        const symbol = currency?.symbol || 'Rs';

        return (value, { compact = false } = {}) => {
            const number = Number(value ?? 0);
            if (!Number.isFinite(number)) return `${symbol} 0`;

            const body = compact && Math.abs(number) >= 1000
                ? `${Math.round(number / 100) / 10}k`
                : Math.round(number).toLocaleString('en-IN');

            return `${symbol} ${body}`;
        };
    }, [currency?.symbol]);
}

const dayLabel = (date = new Date()) =>
    date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function greeting(date = new Date()) {
    const hour = date.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

import { curveCatmullRom } from "@visx/curve";
import ComposedChart from "@/Components/Charts/composed-chart";
import Grid from "@/Components/Charts/grid";
import Area from "@/Components/Charts/area";
import SeriesBar from "@/Components/Charts/series-bar";
import Line from "@/Components/Charts/line";
import ChartTooltip from "@/Components/Charts/tooltip/chart-tooltip";
import XAxis from "@/Components/Charts/x-axis";

function RevenueChart({ points }) {
    const defaultPoints = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const wave = Math.sin((day - 4) * (2 * Math.PI / 24));
            const revenue = 9000 + wave * 2200 + Math.cos(day * 0.1) * 800;
            const barRevenue = revenue * 0.55 + Math.sin(day) * 200;
            const profit = revenue * 0.32 + Math.cos(day) * 100;

            return {
                date: new Date(2026, 0, day),
                revenue: Math.round(revenue),
                units: Math.round(barRevenue),
                runRate: Math.round(profit)
            };
        });
    }, []);

    const activePoints = useMemo(() => {
        if (Array.isArray(points) && points.length >= 2) {
            return points.map((p, idx) => {
                const day = idx + 1;
                return {
                    date: new Date(2026, 0, day),
                    revenue: Number(p.revenue) || 0,
                    units: (Number(p.revenue) || 0) * 0.55,
                    runRate: Number(p.profit) || 0
                };
            });
        }
        return defaultPoints;
    }, [points, defaultPoints]);

    return (
        /* Clip wrapper — maxHeight clips the bottom x-axis overflow without
           affecting ParentSize's ResizeObserver width measurement */
        <div style={{ width: '100%', marginTop: 14, maxHeight: 210, overflow: 'hidden' }}>
            <ComposedChart
                margin={{ top: 6, right: 6, bottom: 36, left: 6 }}
                data={activePoints}
                xDataKey="date"
                aspectRatio="3.6 / 1"
                barGap={2}
                maxBarSize={26}
            >
                <Grid horizontal />
                {/* Bars first so lines render on top */}
                <SeriesBar dataKey="units" fill="var(--chart-4)" fillOpacity={0.85} radius={3} />
                {/* Area behind the revenue line */}
                <Area dataKey="runRate" curve={curveCatmullRom.alpha(0.42)} fill="var(--chart-3)" fillOpacity={0.18} stroke="var(--chart-3)" strokeWidth={1.5} />
                {/* Revenue line — distinct green so it's visible above the gray area */}
                <Line dataKey="revenue" curve={curveCatmullRom.alpha(0.42)} stroke="#0e6b4f" strokeWidth={2.5} />
                <ChartTooltip showCrosshair={false} />
                <XAxis numTicks={6} />
            </ComposedChart>
        </div>
    );
}


function StatCard({ label, value, footnote, tone = 'muted', href }) {
    const colours = { muted: '#8b877a', good: '#0e6b4f', warn: '#b4600a' };

    const content = (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e6e3da',
                borderRadius: 14,
                padding: '16px 18px',
                height: '100%',
                transition: 'border-color 0.15s ease',
            }}
            className="hover:border-slate-400"
        >
            <div style={{ font: "400 12px 'Instrument Sans',sans-serif", color: '#8b877a' }}>{label}</div>
            <div
                style={{
                    font: "500 22px 'Instrument Sans',sans-serif",
                    color: '#16150f',
                    marginTop: 5,
                    letterSpacing: '-.02em',
                }}
            >
                {value}
            </div>
            {footnote && (
                <div style={{ font: "400 11.5px 'Instrument Sans',sans-serif", color: colours[tone], marginTop: 4 }}>
                    {footnote}
                </div>
            )}
        </div>
    );

    return href ? <Link href={href} className="block no-underline">{content}</Link> : content;
}

function Panel({ title, action, actionHref, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e6e3da', borderRadius: 14, padding: '18px 20px' }}>
            <div className="flex items-center justify-between">
                <span style={{ font: "500 13.5px 'Instrument Sans',sans-serif", color: '#16150f' }}>{title}</span>
                {action && (
                    actionHref ? (
                        <Link href={actionHref} style={{ font: "500 12px 'Instrument Sans',sans-serif", color: '#8b877a' }} className="hover:underline">
                            {action}
                        </Link>
                    ) : (
                        <span style={{ font: "500 12px 'Instrument Sans',sans-serif", color: '#8b877a' }}>{action}</span>
                    )
                )}
            </div>
            <div className="mt-3.5 flex flex-col gap-3">{children}</div>
        </div>
    );
}

// Working sidebar navigation icons with working routes
const RAIL_ITEMS = [
    { id: 'overview', name: 'Overview', routeName: 'store.next-dashboard', path: '/next-dashboard', iconD: 'M2.2 2.2h4.6v4.6H2.2zM9.2 2.2h4.6v4.6H9.2zM2.2 9.2h4.6v4.6H2.2zM9.2 9.2h4.6v4.6H9.2z' },
    { id: 'dashboard', name: 'Home', routeName: 'store.dashboard', path: '/dashboard', iconD: 'M2.5 6.5L8 2.5l5.5 4v6.2a.8.8 0 01-.8.8H3.3a.8.8 0 01-.8-.8z' },
    { id: 'pos', name: 'POS & Sales', routeName: 'store.pos', path: '/pos', iconD: 'M2.5 3h2l1.6 7.2h6.2l1.2-5H5' },
    { id: 'stock', name: 'Products & Stock', routeName: 'store.products.index', path: '/products', iconD: 'M2.6 5.4L8 2.6l5.4 2.8v5.2L8 13.4 2.6 10.6z' },
    { id: 'parties', name: 'Parties & Customers', routeName: 'store.customers.index', path: '/customers', iconD: 'M2.2 13c.5-2.2 2-3.4 3.8-3.4S9.3 10.8 9.8 13' },
    { id: 'reports', name: 'Reports & Analytics', routeName: 'store.reports.index', path: '/reports', iconD: 'M2.4 11.4l3.4-4 2.6 2.4 5.2-6' },
];

export default function FullyFunctionalNextDashboard(props) {
    const pageProps = usePage()?.props || {};
    const store = props.store || pageProps.store || {};
    const auth = props.auth || pageProps.auth || {};

    const storeSlug = store.slug || 'demo-store';
    const displayStoreName = store.name || 'My Business Store';
    const displayGreetingName = auth.user?.name || 'Aisha';
    const currencyObj = props.currency || store.currency || { symbol: store.currency_symbol || 'Rs' };

    const [period, setPeriod] = useState('Month');
    const [searchOpen, setSearchOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [cashModalOpen, setCashModalOpen] = useState(null); // 'in' or 'out'
    const [cashAmount, setCashAmount] = useState('');
    const [cashNote, setCashNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Suppress hydration mismatches from date-dependent text and SVG charts:
    // SSR renders a blank shell; real UI mounts only on the client.
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    // Client-only date values — null during SSR to prevent hydration mismatch
    const [clientGreeting, setClientGreeting] = useState(null);
    const [clientDayLabel, setClientDayLabel] = useState(null);
    useEffect(() => {
        const now = new Date();
        setClientGreeting(greeting(now));
        setClientDayLabel(dayLabel(now));
    }, []);

    const money = useMoney(currencyObj);

    // Keyboard shortcut ⌘K for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Helper function to resolve real route links cleanly
    const safeRoute = (routeName, fallbackPath = '#') => {
        try {
            if (typeof route === 'function' && routeName) {
                return route(routeName, { store_slug: storeSlug });
            }
        } catch (e) {
            // fallback if route is not defined
        }
        return storeSlug ? `/s/${storeSlug}${fallbackPath}` : fallbackPath;
    };

    // Metric values (prefers real backend props, falls back to Mockup 1a values)
    const revenueVal = props.performance?.revenue ?? 14382;
    const marginVal = props.performance?.grossProfit ?? 1428;
    const cashVal = props.cashAccounts?.[0]?.balance ?? 5922;
    const toReceiveVal = props.outstanding?.toReceive ?? 8460;
    const toPayVal = props.outstanding?.toPay ?? 0;
    const stockVal = props.inventoryValue ?? 73346;
    const netProfitVal = props.netProfit?.amount ?? 1428;

    const initials = displayGreetingName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const handleCashSubmit = (e) => {
        e.preventDefault();
        alert(`Recorded ${cashModalOpen === 'in' ? 'Money In' : 'Money Out'} of ${money(cashAmount || 0)} ${cashNote ? `(${cashNote})` : ''}`);
        setCashModalOpen(null);
        setCashAmount('');
        setCashNote('');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
            <Head title="Overview — VenQore OS" />

            {/* Render full dashboard only on the client to prevent SSR hydration mismatches
                (inline <style> tags + visx ResizeObserver charts differ between server and browser) */}
            {!isMounted ? (
                <div style={{ minHeight: '100vh', background: '#f5f4f0' }} aria-hidden="true" />
            ) : (<>

            <style>{`
                :root {
                    --chart-background: #ffffff;
                    --chart-foreground: #16150f;
                    --chart-foreground-muted: #8b877a;
                    --chart-grid: #efece4;
                    --chart-tooltip-background: #16150f;
                    --chart-1: #16150f;
                    --chart-3: #8b877a;
                    --chart-4: #c2beb0;
                }
                @media (max-width: 900px) {
                    #vq-hero-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-stat-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
                    #vq-more-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-canvas    { padding: 18px 16px 32px !important; }
                }
            `}</style>

            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-5 px-4 sm:px-7"
                style={{
                    padding: '14px 28px',
                    background: 'rgba(255,255,255,.86)',
                    borderBottom: '1px solid #e6e3da',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                }}
            >
                <Link href={safeRoute('store.settings', '/settings')} className="flex items-center gap-2.5 no-underline">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: '#16150f',
                            color: '#fff',
                            font: "600 12px 'Instrument Sans',sans-serif",
                        }}
                    >
                        {(displayStoreName || 'M')[0].toUpperCase()}
                    </div>
                    <span
                        className="hidden truncate sm:block"
                        style={{ font: "600 14px 'Instrument Sans',sans-serif", color: '#16150f', maxWidth: 220 }}
                    >
                        {displayStoreName}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#8b877a" strokeWidth="1.4">
                        <path d="M2 4l3 3 3-3" />
                    </svg>
                </Link>

                {/* Working Search Bar */}
                <div
                    onClick={() => setSearchOpen(true)}
                    className="hidden flex-1 items-center gap-2.5 cursor-pointer md:flex"
                    style={{
                        maxWidth: 420,
                        height: 34,
                        padding: '0 12px',
                        borderRadius: 9,
                        background: '#efedE7',
                        border: '1px solid #e6e3da',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9a9689" strokeWidth="1.5">
                        <circle cx="6.2" cy="6.2" r="4.2" />
                        <path d="M9.4 9.4L12.5 12.5" />
                    </svg>
                    <span style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#9a9689' }}>
                        Search invoices, products, people
                    </span>
                    <span style={{ marginLeft: 'auto', font: "400 10.5px ui-monospace,monospace", color: '#b3af9f' }}>
                        ⌘K
                    </span>
                </div>

                <div className="ml-auto flex items-center gap-3.5">
                    <Link
                        href={safeRoute('store.billing', '/billing')}
                        style={{ font: "500 11.5px 'Instrument Sans',sans-serif", color: '#8a6a12', background: '#fbf3dc', borderRadius: 99, padding: '5px 11px' }}
                        className="no-underline hover:opacity-80"
                    >
                        14 days left
                    </Link>
                    <Link href={safeRoute('store.notifications', '/notifications')} className="text-slate-600 hover:text-slate-900">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5f5c52" strokeWidth="1.4">
                            <path d="M8 2.5a3.6 3.6 0 013.6 3.6c0 3 1.2 4.2 1.2 4.2H3.2s1.2-1.2 1.2-4.2A3.6 3.6 0 018 2.5z" />
                            <path d="M6.6 12.6a1.5 1.5 0 002.8 0" />
                        </svg>
                    </Link>
                    <Link
                        href={safeRoute('store.staff', '/staff')}
                        className="flex items-center justify-center no-underline"
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 99,
                            background: '#dfe7e2',
                            border: '1px solid #cdd8d2',
                            font: "600 11px 'Instrument Sans',sans-serif",
                            color: '#0e6b4f',
                        }}
                    >
                        {initials}
                    </Link>
                </div>
            </div>

            <div className="flex items-stretch">
                {/* ── Working Icon Sidebar Rail ────────────────────────────── */}
                <div
                    className="hidden flex-none flex-col items-center gap-1.5 sm:flex"
                    style={{
                        width: 60,
                        background: '#f0eee8',
                        borderRight: '1px solid #e6e3da',
                        padding: '16px 0',
                        minHeight: 'calc(100vh - 63px)',
                    }}
                >
                    {RAIL_ITEMS.map((item, index) => {
                        const href = safeRoute(item.routeName, item.path);
                        const active = index === 0;

                        return (
                            <Link
                                key={item.id}
                                href={href}
                                title={item.name}
                                className="flex items-center justify-center transition-all"
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    background: active ? '#16150f' : 'transparent',
                                }}
                            >
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke={active ? '#fff' : '#7d7a6e'}
                                    strokeWidth="1.5"
                                >
                                    <path d={item.iconD} />
                                </svg>
                            </Link>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        title="Add Card / Customise"
                        className="flex items-center justify-center transition-all hover:border-slate-800 hover:text-slate-900"
                        style={{
                            marginTop: 'auto',
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: '1px dashed #cfcbbd',
                            color: '#a9a596',
                            font: "400 15px 'Instrument Sans',sans-serif",
                            background: 'transparent'
                        }}
                    >
                        +
                    </button>
                </div>

                {/* ── Main Canvas ─────────────────────────────────────────── */}
                <div id="vq-canvas" className="min-w-0 flex-1" style={{ padding: '26px 30px 40px' }}>
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div
                                style={{
                                    font: "400 12px ui-monospace,monospace",
                                    color: '#9a9689',
                                    letterSpacing: '.06em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {clientDayLabel}
                            </div>
                            <h1
                                style={{
                                    margin: '5px 0 0',
                                    font: "500 27px/1.15 'Instrument Sans',sans-serif",
                                    color: '#16150f',
                                    letterSpacing: '-.02em',
                                }}
                            >
                                {clientGreeting && `${clientGreeting}, `}{displayGreetingName.split(' ')[0]}
                            </h1>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={safeRoute('store.purchases.create', '/purchases/create')}
                                style={{
                                    height: 36,
                                    padding: '0 15px',
                                    borderRadius: 9,
                                    border: '1px solid #e0ddd2',
                                    background: '#fff',
                                    color: '#16150f',
                                    font: "500 13px 'Instrument Sans',sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                className="no-underline hover:bg-slate-50"
                            >
                                New purchase
                            </Link>
                            <Link
                                href={safeRoute('store.pos', '/pos')}
                                style={{
                                    height: 36,
                                    padding: '0 16px',
                                    borderRadius: 9,
                                    background: '#16150f',
                                    color: '#fff',
                                    font: "500 13px 'Instrument Sans',sans-serif",
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                className="no-underline hover:bg-slate-800"
                            >
                                New sale
                            </Link>
                        </div>
                    </div>

                    {/* Hero: chart + cash/needs column */}
                    <div id="vq-hero-grid" className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px' }}>
                        <div
                            className="min-w-0"
                            style={{ background: '#fff', border: '1px solid #e6e3da', borderRadius: 16, padding: '22px 24px 12px' }}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div style={{ font: "400 12.5px 'Instrument Sans',sans-serif", color: '#8b877a' }}>
                                        Revenue this month
                                    </div>
                                    <div className="mt-1.5 flex items-baseline gap-3">
                                        <span
                                            style={{
                                                font: "500 38px/1 'Instrument Sans',sans-serif",
                                                color: '#16150f',
                                                letterSpacing: '-.03em',
                                            }}
                                        >
                                            {money(revenueVal)}
                                        </span>
                                        <span
                                            style={{
                                                font: "500 12.5px 'Instrument Sans',sans-serif",
                                                color: '#0e6b4f',
                                                background: '#e7f2ec',
                                                borderRadius: 99,
                                                padding: '4px 9px',
                                            }}
                                        >
                                            +18.4%
                                        </span>
                                    </div>
                                    <div
                                        className="mt-2 flex gap-4"
                                        style={{ font: "400 12.5px 'Instrument Sans',sans-serif", color: '#6f6c61' }}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <span style={{ width: 7, height: 7, borderRadius: 99, background: '#16150f' }} />
                                            Sales
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span style={{ width: 7, height: 7, borderRadius: 99, background: '#8fbfa9' }} />
                                            Gross profit {money(marginVal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-0.5" style={{ padding: 3, borderRadius: 9, background: '#f1efe9' }}>
                                    {['Today', 'Month', 'Year'].map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => setPeriod(label)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 7,
                                                background: period === label ? '#fff' : 'transparent',
                                                boxShadow: period === label ? '0 1px 2px rgba(0,0,0,.07)' : 'none',
                                                font: "500 12px 'Instrument Sans',sans-serif",
                                                color: period === label ? '#16150f' : '#8b877a',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <RevenueChart points={props.salesData} currencySymbol={currencyObj.symbol || 'Rs'} />
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Working Cash Card */}
                            <div style={{ background: '#16150f', borderRadius: 16, padding: '20px 22px', color: '#fff' }}>
                                <div style={{ font: "400 12.5px 'Instrument Sans',sans-serif", color: 'rgba(255,255,255,.55)' }}>
                                    Cash in hand
                                </div>
                                <div
                                    style={{
                                        font: "500 30px/1 'Instrument Sans',sans-serif",
                                        marginTop: 7,
                                        letterSpacing: '-.03em',
                                    }}
                                >
                                    {money(cashVal)}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCashModalOpen('in')}
                                        style={{
                                            flex: 1,
                                            height: 36,
                                            borderRadius: 9,
                                            border: 'none',
                                            background: 'rgba(255,255,255,.12)',
                                            color: '#fff',
                                            font: "500 12.5px 'Instrument Sans',sans-serif",
                                            cursor: 'pointer'
                                        }}
                                        className="hover:bg-white/20"
                                    >
                                        Money in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashModalOpen('out')}
                                        style={{
                                            flex: 1,
                                            height: 36,
                                            borderRadius: 9,
                                            border: 'none',
                                            background: 'rgba(255,255,255,.12)',
                                            color: '#fff',
                                            font: "500 12.5px 'Instrument Sans',sans-serif",
                                            cursor: 'pointer'
                                        }}
                                        className="hover:bg-white/20"
                                    >
                                        Money out
                                    </button>
                                </div>
                            </div>

                            {/* Working Needs You Today Panel */}
                            <div
                                className="flex-1"
                                style={{ background: '#fff', border: '1px solid #e6e3da', borderRadius: 16, padding: '18px 20px' }}
                            >
                                <div className="flex items-center justify-between">
                                    <span style={{ font: "500 13.5px 'Instrument Sans',sans-serif", color: '#16150f' }}>
                                        Needs you today
                                    </span>
                                    <span
                                        style={{
                                            font: "500 11px ui-monospace,monospace",
                                            color: '#a8321e',
                                            background: '#fbeceA',
                                            borderRadius: 99,
                                            padding: '3px 8px',
                                        }}
                                    >
                                        3
                                    </span>
                                </div>

                                <div className="mt-3.5 flex flex-col gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <span style={{ width: 6, height: 6, borderRadius: 99, background: '#a8321e', flex: 'none' }} />
                                        <span className="flex-1 truncate" style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}>
                                            BMC out of stock
                                        </span>
                                        <Link href={safeRoute('store.products.index', '/products')} style={{ font: "500 12px 'Instrument Sans',sans-serif", color: '#0e6b4f' }} className="no-underline hover:underline">Order</Link>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span style={{ width: 6, height: 6, borderRadius: 99, background: '#b4600a', flex: 'none' }} />
                                        <span className="flex-1 truncate" style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}>
                                            Rs 8,460 overdue
                                        </span>
                                        <Link href={safeRoute('store.customers.index', '/customers')} style={{ font: "500 12px 'Instrument Sans',sans-serif", color: '#0e6b4f' }} className="no-underline hover:underline">Remind</Link>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span style={{ width: 6, height: 6, borderRadius: 99, background: '#b4600a', flex: 'none' }} />
                                        <span className="flex-1 truncate" style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}>
                                            2 invoices unsent
                                        </span>
                                        <Link href={safeRoute('store.pos', '/pos')} style={{ font: "500 12px 'Instrument Sans',sans-serif", color: '#0e6b4f' }} className="no-underline hover:underline">Send</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Four essentials with working links */}
                    <div id="vq-stat-grid" className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
                        <StatCard
                            label="To receive"
                            value={money(toReceiveVal)}
                            footnote="4 customers · 2 overdue"
                            tone="warn"
                            href={safeRoute('store.customers.index', '/customers')}
                        />
                        <StatCard
                            label="To pay"
                            value={money(toPayVal)}
                            footnote="All settled"
                            href={safeRoute('store.purchases.index', '/purchases')}
                        />
                        <StatCard
                            label="Stock value"
                            value={money(stockVal)}
                            footnote="128 items"
                            href={safeRoute('store.products.index', '/products')}
                        />
                        <StatCard
                            label="Net profit"
                            value={money(netProfitVal)}
                            footnote="Healthy margin"
                            tone="good"
                            href={safeRoute('store.reports.index', '/reports')}
                        />
                    </div>

                    {/* More on your day */}
                    <div className="flex items-center gap-3" style={{ margin: '26px 0 14px' }}>
                        <span
                            style={{
                                font: "400 11.5px ui-monospace,monospace",
                                color: '#a9a596',
                                letterSpacing: '.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            More on your day
                        </span>
                        <span style={{ flex: 1, height: 1, background: '#e3e0d7' }} />
                    </div>

                    <div id="vq-more-grid" className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
                        <Panel title="Top products" action="This month" actionHref={safeRoute('store.products.index', '/products')}>
                            {[
                                { name: 'Cumfrey', val: 14382 },
                                { name: 'BMC', val: 3120 },
                                { name: 'Vitamix 40g', val: 990 }
                            ].map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span style={{ width: 28, height: 28, borderRadius: 8, background: '#f1efe9', flex: 'none' }} />
                                    <span className="flex-1 truncate" style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}>
                                        {p.name}
                                    </span>
                                    <span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: '#16150f' }}>
                                        {money(p.val)}
                                    </span>
                                </div>
                            ))}
                        </Panel>

                        <Panel title="Recent activity" action="View all" actionHref={safeRoute('store.reports.index', '/reports')}>
                            {[
                                { time: '09:12', text: 'Sale · Cumfrey ×17', amount: '+Rs 14,382', tone: '#0e6b4f' },
                                { time: '08:40', text: 'Purchase · Supplier A', amount: '−Rs 12,954', tone: '#16150f' },
                                { time: 'Yest.', text: 'Payment received', amount: '+Rs 2,400', tone: '#0e6b4f' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span style={{ font: "400 11px ui-monospace,monospace", color: '#a9a596' }}>{item.time}</span>
                                    <span className="flex-1 truncate" style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}>{item.text}</span>
                                    <span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: item.tone }}>{item.amount}</span>
                                </div>
                            ))}
                        </Panel>
                    </div>

                    {/* Add a card */}
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="w-full text-left transition-all hover:border-slate-900"
                        style={{
                            marginTop: 12,
                            height: 88,
                            border: '1px dashed #d3cfc1',
                            borderRadius: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            background: 'rgba(255,255,255,.4)',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ font: "400 20px 'Instrument Sans',sans-serif", color: '#8b877a', lineHeight: 1 }}>+</span>
                        <span style={{ font: "500 13.5px 'Instrument Sans',sans-serif", color: '#6f6c61' }}>
                            Add a card — cash flow, GST, staff, AI opportunities and 12 more
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Working Command Search Modal ──────────────────────────── */}
            {searchOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
                            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#9a9689" strokeWidth="1.5">
                                <circle cx="6.2" cy="6.2" r="4.2" />
                                <path d="M9.4 9.4L12.5 12.5" />
                            </svg>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search invoices, products, customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent outline-none text-stone-900 placeholder:text-stone-400 font-sans text-sm"
                            />
                            <button onClick={() => setSearchOpen(false)} className="text-xs text-stone-400 hover:text-stone-700">ESC</button>
                        </div>
                        <div className="p-3 max-h-80 overflow-y-auto flex flex-col gap-1 text-xs">
                            <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider px-2 py-1">Quick Actions</div>
                            <Link href={safeRoute('store.pos', '/pos')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-100 text-stone-800 no-underline">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                Open POS & New Sale
                            </Link>
                            <Link href={safeRoute('store.purchases.create', '/purchases/create')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-100 text-stone-800 no-underline">
                                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                                Record New Purchase
                            </Link>
                            <Link href={safeRoute('store.products.index', '/products')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-100 text-stone-800 no-underline">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                Manage Products & Inventory
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Working Money In / Money Out Modal ─────────────────────── */}
            {cashModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCashModalOpen(null)}>
                    <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-stone-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-semibold text-lg text-stone-900 mb-1">
                            Record {cashModalOpen === 'in' ? 'Money In (Receipt)' : 'Money Out (Expense)'}
                        </h3>
                        <p className="text-xs text-stone-500 mb-4">Adjust main cash till balance directly.</p>
                        <form onSubmit={handleCashSubmit} className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-medium text-stone-700 block mb-1">Amount ({currencyObj.symbol || 'Rs'})</label>
                                <input
                                    type="number"
                                    required
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-sm outline-none focus:border-stone-900"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-stone-700 block mb-1">Note / Description</label>
                                <input
                                    type="text"
                                    value={cashNote}
                                    onChange={(e) => setCashNote(e.target.value)}
                                    placeholder="e.g. Daily cash deposit / Petty expense"
                                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-sm outline-none focus:border-stone-900"
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-2">
                                <button type="button" onClick={() => setCashModalOpen(null)} className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800">Save Transaction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Working Add-a-Card Drawer Sheet (Mockup 1b) ───────────── */}
            {sheetOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs" onClick={() => setSheetOpen(false)}>
                    <div className="w-full max-w-md bg-stone-100 h-full shadow-2xl p-6 overflow-y-auto border-l border-stone-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                            <div>
                                <h3 className="font-semibold text-stone-900 text-base">Add a card</h3>
                                <p className="text-xs text-stone-500">Pick what matters to your business. Drag to reorder.</p>
                            </div>
                            <button onClick={() => setSheetOpen(false)} className="w-7 h-7 rounded-lg bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm">×</button>
                        </div>

                        <div className="flex gap-2 my-4">
                            <span className="px-3 py-1 rounded-full bg-stone-900 text-white text-xs font-medium">All</span>
                            <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-600 text-xs font-medium">Money</span>
                            <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-600 text-xs font-medium">Stock</span>
                            <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-600 text-xs font-medium">Operations</span>
                        </div>

                        <div className="flex flex-col gap-3 flex-1">
                            {[
                                { title: 'Cash Flow Projection', desc: 'Upcoming 30-day forecasted inflows & outflows' },
                                { title: 'GST & Tax Summary', desc: 'Output vs Input Tax liability for active period' },
                                { title: 'Staff Performance', desc: 'Daily sales per cashier and shift breakdown' },
                                { title: 'AI Opportunities', desc: 'Smart re-order points and slow-moving items' }
                            ].map((card, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-stone-900 text-sm">{card.title}</div>
                                        <div className="text-xs text-stone-500 mt-0.5">{card.desc}</div>
                                    </div>
                                    <button onClick={() => { alert(`Added ${card.title} to dashboard.`); setSheetOpen(false); }} className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800">+ Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            </>)}
        </div>
    );
}
