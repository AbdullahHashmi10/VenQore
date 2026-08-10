import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AddCardSheet from '@/Components/Workspace/AddCardSheet';

/**
 * The Overview dashboard — a direct build of mockup 1a.
 *
 * ── Why this page carries its own shell and its own colours ────────────────
 *
 * It renders its own top bar and icon rail instead of sitting inside
 * OneGlanceLayout, and it uses literal hex values instead of the theme tokens
 * used everywhere else in the app.
 *
 * Both are deliberate, and both are because of what this screen is *for*. It
 * exists to answer one question — "if we ship the new positioning, is it any
 * good?" — and it can only answer that if it looks like the thing being
 * proposed. Wrapping it in the current shell would have shown the old chrome
 * with new cards inside it, which is exactly the muddle this replaces. Binding
 * it to theme tokens would have let a later theme change silently repaint the
 * proposal into something nobody agreed to.
 *
 * The palette below is lifted verbatim from the mockup:
 *
 *   #f5f4f0  page          #16150f  ink / the dark cash card
 *   #f0eee8  rail          #e6e3da  hairline borders
 *   #8b877a  muted text    #0e6b4f  positive / action green
 *   #a8321e  urgent        #b4600a  warning
 *
 * This is a preview surface. Nothing else in the product imports from it, and
 * removing it removes the whole experiment.
 */

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

function useMoney(currency) {
    return useMemo(() => {
        const symbol = currency?.symbol || 'Rs';

        return (value, { compact = false } = {}) => {
            const number = Number(value ?? 0);
            if (!Number.isFinite(number)) return `${symbol} 0`;

            // No decimals on the dashboard. These are glance figures — the exact
            // paise belong on the invoice, and two extra digits on every card is
            // the difference between a number you read and a number you parse.
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

/* ------------------------------------------------------------------ *
 * Chart
 * ------------------------------------------------------------------ */

/**
 * The hero area chart.
 *
 * Hand-rolled rather than Recharts. The mockup's chart is a specific shape — a
 * 2px ink line, a fading wash beneath it, a flat green profit line and a single
 * emphasised point — and matching that through a charting library's abstractions
 * is more code than drawing two paths. It also keeps this preview from pulling a
 * charting dependency into its bundle.
 */
function RevenueChart({ points }) {
    const W = 820;
    const H = 196;

    const { line, area, profitLine, peak } = useMemo(() => {
        const series = Array.isArray(points) ? points : [];

        if (series.length < 2) return {};

        const revenues = series.map((p) => Number(p.revenue) || 0);
        const profits = series.map((p) => Number(p.profit) || 0);
        const ceiling = Math.max(...revenues, ...profits, 1);

        const x = (i) => (i / (series.length - 1)) * W;
        const y = (v) => H - 20 - (v / ceiling) * (H - 50);

        const path = (values) =>
            values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

        const peakIndex = revenues.indexOf(Math.max(...revenues));

        return {
            line: path(revenues),
            area: `${path(revenues)} L${W} ${H} L0 ${H} Z`,
            profitLine: path(profits),
            peak: { x: x(peakIndex), y: y(revenues[peakIndex]) },
        };
    }, [points]);

    if (!line) {
        return (
            <div className="flex h-[212px] items-center justify-center text-[13px]" style={{ color: '#a9a596' }}>
                Not enough history yet — this fills in as you record sales.
            </div>
        );
    }

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: 212, marginTop: 14, display: 'block' }}
        >
            <defs>
                <linearGradient id="vq-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#16150f" stopOpacity=".14" />
                    <stop offset="1" stopColor="#16150f" stopOpacity="0" />
                </linearGradient>
            </defs>

            {[40, 95, 150].map((y) => (
                <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#efece4" />
            ))}
            <line x1="0" y1={H - 4} x2={W} y2={H - 4} stroke="#e6e3da" />

            <path d={area} fill="url(#vq-rev)" />
            <path d={line} fill="none" stroke="#16150f" strokeWidth="2" strokeLinecap="round" />
            <path d={profitLine} fill="none" stroke="#8fbfa9" strokeWidth="2" strokeLinecap="round" />

            {peak && (
                <>
                    <circle cx={peak.x} cy={peak.y} r="4.5" fill="#16150f" />
                    <circle cx={peak.x} cy={peak.y} r="9" fill="none" stroke="#16150f" strokeOpacity=".2" />
                </>
            )}
        </svg>
    );
}

/* ------------------------------------------------------------------ *
 * Small pieces
 * ------------------------------------------------------------------ */

function StatCard({ label, value, footnote, tone = 'muted' }) {
    const colours = { muted: '#8b877a', good: '#0e6b4f', warn: '#b4600a' };

    return (
        <div style={{ background: '#fff', border: '1px solid #e6e3da', borderRadius: 14, padding: '16px 18px' }}>
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
}

function Panel({ title, action, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e6e3da', borderRadius: 14, padding: '18px 20px' }}>
            <div className="flex items-center justify-between">
                <span style={{ font: "500 13.5px 'Instrument Sans',sans-serif", color: '#16150f' }}>{title}</span>
                {action && (
                    <span style={{ font: "500 12px 'Instrument Sans',sans-serif", color: '#8b877a' }}>{action}</span>
                )}
            </div>
            <div className="mt-3.5 flex flex-col gap-3">{children}</div>
        </div>
    );
}

const RAIL_ICONS = [
    { d: 'M2.2 2.2h4.6v4.6H2.2zM9.2 2.2h4.6v4.6H9.2zM2.2 9.2h4.6v4.6H2.2zM9.2 9.2h4.6v4.6H9.2z', name: 'Overview', route: null },
    { d: 'M2.5 6.5L8 2.5l5.5 4v6.2a.8.8 0 01-.8.8H3.3a.8.8 0 01-.8-.8z', name: 'Home', route: 'store.dashboard' },
    { d: 'M2.5 3h2l1.6 7.2h6.2l1.2-5H5', name: 'Sales', route: 'store.pos' },
    { d: 'M2.6 5.4L8 2.6l5.4 2.8v5.2L8 13.4 2.6 10.6z', name: 'Stock', route: 'store.inventory.dashboard' },
    { d: 'M2.2 13c.5-2.2 2-3.4 3.8-3.4S9.3 10.8 9.8 13', name: 'People', route: null },
    { d: 'M2.4 11.4l3.4-4 2.6 2.4 5.2-6', name: 'Reports', route: null },
];

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function Overview({ hero, extras, catalog, greetingName, storeName, currency }) {
    const { props } = usePage();
    const storeSlug = props.store?.slug;

    const [sheetOpen, setSheetOpen] = useState(false);
    const [period, setPeriod] = useState('Month');

    const money = useMoney(currency);
    const value = (id) => (hero?.[id]?.ok ? hero[id].data : null);

    const trend = value('revenue_trend');
    const cash = value('cash_position');
    const needs = value('needs_attention');
    const receivables = value('receivables');
    const payables = value('payables');
    const stock = value('inventory_value');
    const profit = value('net_profit');
    const products = value('top_products');

    const initials = (greetingName || '?')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const to = (name) => (storeSlug && name ? route(name, { store_slug: storeSlug }) : null);

    const addCard = (id) => {
        if (!storeSlug) return;

        router.post(
            route('store.workspace.layout.save', { store_slug: storeSlug }),
            { layout: [...(extras || []), id].map((widget, i) => ({ widget, x: 0, y: i, size: 'medium' })) },
            { preserveScroll: true, onSuccess: () => setSheetOpen(false) },
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
            <Head title="Overview" />

            {/*
              Mockup 1c — the single-column phone layout.

              These rules live in a style tag rather than Tailwind classes
              because the grids above are sized with inline
              `gridTemplateColumns`, and an inline style beats any class at
              every breakpoint. Rather than convert the whole page to Tailwind
              and lose the exact pixel values the mockup specifies, the three
              grids that need to collapse are given ids and overridden here.

              1c is not a shrunken 1a: the four stat cards go two-up rather than
              one-up (they are short enough to read in pairs, and four full-width
              tiles would push everything below the fold), and the two "More on
              your day" panels stack, because a two-column list at 390px is two
              columns of truncation.
            */}
            <style>{`
                @media (max-width: 900px) {
                    #vq-hero-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-stat-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
                    #vq-more-grid { grid-template-columns: minmax(0,1fr) !important; }
                    #vq-canvas    { padding: 18px 16px 32px !important; }
                }
            `}</style>

            {/* ── Top bar ─────────────────────────────────────────────── */}
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
                <div className="flex items-center gap-2.5">
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
                        {(storeName || 'M')[0].toUpperCase()}
                    </div>
                    <span
                        className="hidden truncate sm:block"
                        style={{ font: "600 14px 'Instrument Sans',sans-serif", color: '#16150f', maxWidth: 220 }}
                    >
                        {storeName}
                    </span>
                </div>

                <div
                    className="hidden flex-1 items-center gap-2.5 md:flex"
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
                    <div
                        className="flex items-center justify-center"
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
                    </div>
                </div>
            </div>

            <div className="flex items-stretch">
                {/* ── Icon rail ───────────────────────────────────────── */}
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
                    {RAIL_ICONS.map((icon, i) => {
                        const href = to(icon.route);
                        const active = i === 0;

                        const inner = (
                            <div
                                title={icon.name}
                                className="flex items-center justify-center"
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
                                    <path d={icon.d} />
                                </svg>
                            </div>
                        );

                        return href ? (
                            <Link key={icon.name} href={href}>{inner}</Link>
                        ) : (
                            <div key={icon.name}>{inner}</div>
                        );
                    })}
                </div>

                {/* ── Canvas ──────────────────────────────────────────── */}
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
                                {dayLabel()}
                            </div>
                            <h1
                                style={{
                                    margin: '5px 0 0',
                                    font: "500 27px/1.15 'Instrument Sans',sans-serif",
                                    color: '#16150f',
                                    letterSpacing: '-.02em',
                                }}
                            >
                                {greeting()}, {(greetingName || '').split(' ')[0]}
                            </h1>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={to('store.purchases.create') || '#'}
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
                            >
                                New purchase
                            </Link>
                            <Link
                                href={to('store.pos') || '#'}
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
                                            {money(trend?.total_revenue ?? profit?.revenue ?? 0)}
                                        </span>
                                        {typeof trend?.change_pct === 'number' && (
                                            <span
                                                style={{
                                                    font: "500 12.5px 'Instrument Sans',sans-serif",
                                                    color: trend.change_pct >= 0 ? '#0e6b4f' : '#a8321e',
                                                    background: trend.change_pct >= 0 ? '#e7f2ec' : '#fbeceA',
                                                    borderRadius: 99,
                                                    padding: '4px 9px',
                                                }}
                                            >
                                                {trend.change_pct >= 0 ? '+' : ''}
                                                {trend.change_pct}%
                                            </span>
                                        )}
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
                                            Gross profit {money(profit?.value ?? 0)}
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

                            <RevenueChart points={trend?.points} />
                        </div>

                        <div className="flex flex-col gap-3">
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
                                    {money(cash?.cash ?? 0)}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    {['Money in', 'Money out'].map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            style={{
                                                flex: 1,
                                                height: 36,
                                                borderRadius: 9,
                                                border: 'none',
                                                background: 'rgba(255,255,255,.12)',
                                                color: '#fff',
                                                font: "500 12.5px 'Instrument Sans',sans-serif",
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div
                                className="flex-1"
                                style={{ background: '#fff', border: '1px solid #e6e3da', borderRadius: 16, padding: '18px 20px' }}
                            >
                                <div className="flex items-center justify-between">
                                    <span style={{ font: "500 13.5px 'Instrument Sans',sans-serif", color: '#16150f' }}>
                                        Needs you today
                                    </span>
                                    {needs?.items?.length > 0 && (
                                        <span
                                            style={{
                                                font: "500 11px ui-monospace,monospace",
                                                color: '#a8321e',
                                                background: '#fbeceA',
                                                borderRadius: 99,
                                                padding: '3px 8px',
                                            }}
                                        >
                                            {needs.items.length}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3.5 flex flex-col gap-3">
                                    {(needs?.items || []).slice(0, 3).map((item, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <span
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: 99,
                                                    background: item.severity === 'high' ? '#a8321e' : '#b4600a',
                                                    flex: 'none',
                                                }}
                                            />
                                            <span
                                                className="flex-1 truncate"
                                                style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}
                                            >
                                                {item.label || item.message}
                                            </span>
                                        </div>
                                    ))}

                                    {!needs?.items?.length && (
                                        <span style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#8b877a' }}>
                                            Nothing needs you right now.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Four essentials */}
                    <div id="vq-stat-grid" className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
                        <StatCard
                            label="To receive"
                            value={money(receivables?.total ?? 0)}
                            footnote={receivables?.overdue_count ? `${receivables.overdue_count} overdue` : 'All settled'}
                            tone={receivables?.overdue_count ? 'warn' : 'muted'}
                        />
                        <StatCard
                            label="To pay"
                            value={money(payables?.total ?? 0)}
                            footnote={payables?.total ? 'Due to suppliers' : 'All settled'}
                        />
                        <StatCard
                            label="Stock value"
                            value={money(stock?.value ?? 0)}
                            footnote={stock?.item_count ? `${stock.item_count} items` : null}
                        />
                        <StatCard
                            label="Net profit"
                            value={money(profit?.value ?? 0)}
                            footnote={profit?.value > 0 ? 'Healthy margin' : null}
                            tone="good"
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
                        <Panel title="Top products" action="This month">
                            {(products?.items || []).slice(0, 3).map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span style={{ width: 28, height: 28, borderRadius: 8, background: '#f1efe9', flex: 'none' }} />
                                    <span
                                        className="flex-1 truncate"
                                        style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#3c3a33' }}
                                    >
                                        {p.name}
                                    </span>
                                    <span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: '#16150f' }}>
                                        {money(p.revenue ?? p.total ?? 0)}
                                    </span>
                                </div>
                            ))}
                            {!products?.items?.length && (
                                <span style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#8b877a' }}>
                                    No sales recorded yet.
                                </span>
                            )}
                        </Panel>

                        <Panel title="Recent activity" action="View all">
                            <span style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#8b877a' }}>
                                Recent sales and payments appear here.
                            </span>
                        </Panel>
                    </div>

                    {/* Add a card */}
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="w-full"
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
                        }}
                    >
                        <span style={{ font: "400 20px 'Instrument Sans',sans-serif", color: '#8b877a', lineHeight: 1 }}>+</span>
                        <span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: '#6f6c61' }}>
                            Add a card — cash flow, GST, staff, AI opportunities and more
                        </span>
                    </button>
                </div>
            </div>

            {sheetOpen && (
                <AddCardSheet
                    catalog={catalog}
                    active={extras || []}
                    onAdd={addCard}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </div>
    );
}
