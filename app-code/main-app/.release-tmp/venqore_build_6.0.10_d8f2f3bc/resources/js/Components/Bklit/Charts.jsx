/**
 * Bklit-style chart components for VenQore.
 * 
 * These are hand-ported versions of Bklit UI chart patterns, adapted to use
 * VQ design system tokens. They use Recharts primitives & custom SVG ring components
 * styled exactly like Bklit: animated fills, gradient areas, donut center labels,
 * concentric RingCharts with active hover synchronization, and --chart-1..5 colour variables.
 * 
 * Usage:
 *   import {
 *     BklitAreaChart, BklitDonut, BklitBarChart,
 *     RingChart, Ring, RingCenter,
 *     Legend, LegendItemComponent, LegendMarker, LegendLabel, LegendValue, LegendProgress
 *   } from '@/Components/Bklit/Charts';
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/* ─────────────────────────────────────────────
   Bklit Tooltip — clean card, VQ tokens
────────────────────────────────────────────── */
export function BklitTooltip({ active, payload, label, valueFormatter }) {
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
            minWidth: '130px',
        }}>
            {label && (
                <div style={{
                    fontFamily: 'var(--vq-font-mono)',
                    fontSize: '10px',
                    color: 'var(--vq-text-3)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid var(--vq-line-soft)',
                }}>
                    {label}
                </div>
            )}
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: i > 0 ? '5px' : 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color || p.fill, flexShrink: 0 }} />
                    <span style={{ color: 'var(--vq-text-2)', flex: 1 }}>{p.name}</span>
                    <span style={{ fontFamily: 'var(--vq-font-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--vq-text)' }}>
                        {valueFormatter ? valueFormatter(p.value) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Bklit Area Chart — gradient fill, smooth curve
   Matches: https://bklit.com/docs/components/area-chart
────────────────────────────────────────────── */
export function BklitAreaChart({
    data = [],
    dataKey = 'value',
    xKey = 'month',
    name = 'Value',
    color = 'var(--chart-1)',
    valueFormatter,
    currencySymbol = '',
    height = '100%',
}) {
    const id = `bklit-area-${dataKey}`;
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
                <defs>
                    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--vq-line-soft)"
                    strokeOpacity={0.6}
                />
                <XAxis
                    dataKey={xKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                        fill: 'var(--vq-text-3)',
                        fontSize: 10,
                        fontFamily: 'var(--vq-font-mono)',
                        letterSpacing: '0.04em',
                    }}
                    dy={5}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                        fill: 'var(--vq-text-3)',
                        fontSize: 10,
                        fontFamily: 'var(--vq-font-mono)',
                    }}
                    tickFormatter={v => valueFormatter ? valueFormatter(v) : `${currencySymbol}${v}`}
                />
                <Tooltip
                    content={<BklitTooltip valueFormatter={valueFormatter} />}
                    cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2', strokeOpacity: 0.5 }}
                />
                <Area
                    name={name}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${id})`}
                    dot={false}
                    activeDot={{ r: 5, fill: color, stroke: 'var(--vq-surface)', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/* ─────────────────────────────────────────────
   Bklit Stacked Bar Chart
   Matches: https://bklit.com/docs/components/bar-chart
────────────────────────────────────────────── */
export function BklitBarChart({
    data = [],
    bars = [{ dataKey: 'value', name: 'Value', color: 'var(--chart-1)' }],
    xKey = 'month',
    valueFormatter,
    height = '100%',
    radius = 4,
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 6, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--vq-line-soft)" strokeOpacity={0.6} />
                <XAxis
                    dataKey={xKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--vq-text-3)', fontSize: 10, fontFamily: 'var(--vq-font-mono)' }}
                    dy={5}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--vq-text-3)', fontSize: 10, fontFamily: 'var(--vq-font-mono)' }}
                    tickFormatter={v => valueFormatter ? valueFormatter(v) : v}
                />
                <Tooltip
                    content={<BklitTooltip valueFormatter={valueFormatter} />}
                    cursor={{ fill: 'var(--vq-sunken)', opacity: 0.5 }}
                />
                {bars.map((bar, i) => (
                    <Bar
                        key={i}
                        name={bar.name}
                        dataKey={bar.dataKey}
                        fill={bar.color}
                        radius={[radius, radius, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={700}
                        animationEasing="ease-out"
                        animationBegin={i * 100}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ─────────────────────────────────────────────
   Bklit Donut Chart — with center label
   Matches Bklit's radial/donut chart style
────────────────────────────────────────────── */
export function BklitDonut({
    data = [],
    centerLabel,
    centerSublabel,
    height = '100%',
    innerRadius = '55%',
    outerRadius = '80%',
    valueFormatter,
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={true}
                    animationDuration={700}
                    animationEasing="ease-out"
                >
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.color || `var(--chart-${(i % 5) + 1})`} />
                    ))}
                </Pie>
                <Tooltip content={<BklitTooltip valueFormatter={valueFormatter} />} />
                {centerLabel && (
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        <tspan
                            x="50%"
                            dy="-0.4em"
                            style={{
                                fontFamily: 'var(--vq-font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '18px',
                                fontWeight: 600,
                                fill: 'var(--vq-text)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {centerLabel}
                        </tspan>
                        {centerSublabel && (
                            <tspan
                                x="50%"
                                dy="1.4em"
                                style={{
                                    fontFamily: 'var(--vq-font-mono)',
                                    fontSize: '10px',
                                    fill: 'var(--vq-text-3)',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {centerSublabel}
                            </tspan>
                        )}
                    </text>
                )}
            </PieChart>
        </ResponsiveContainer>
    );
}

/* ─────────────────────────────────────────────
   Bklit Concentric RingChart Components
   Matches Bklit UI RingChart + Ring + RingCenter + Legend spec
────────────────────────────────────────────── */

const RingChartContext = createContext(null);
const LegendContext = createContext(null);

export function RingChart({
    data = [],
    hoveredIndex = null,
    onHoverChange = () => {},
    size = 180,
    strokeWidth = 10,
    ringGap = 6,
    children
}) {
    return (
        <RingChartContext.Provider value={{ data, hoveredIndex, onHoverChange, size, strokeWidth, ringGap }}>
            <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', flexShrink: 0 }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                    {children}
                </svg>
            </div>
        </RingChartContext.Provider>
    );
}

export function Ring({ index }) {
    const ctx = useContext(RingChartContext);
    if (!ctx) return null;
    const { data, hoveredIndex, onHoverChange, size, strokeWidth, ringGap } = ctx;
    const item = data[index];
    if (!item) return null;

    const center = size / 2;
    const r = center - strokeWidth / 2 - index * (strokeWidth + ringGap);
    if (r <= 0) return null;

    const circ = 2 * Math.PI * r;
    const val = item.value ?? item.val ?? 0;
    const maxVal = item.maxVal ?? item.total ?? 100;
    const pct = Math.min(Math.max((val / maxVal), 0), 1);
    const dash = pct * circ;

    const isHovered = hoveredIndex === index;
    const isDimmed = hoveredIndex !== null && !isHovered;
    const color = item.color || `var(--chart-${(index % 5) + 1})`;

    return (
        <g
            onMouseEnter={() => onHoverChange(index)}
            onMouseLeave={() => onHoverChange(null)}
            style={{
                cursor: 'pointer',
                opacity: isDimmed ? 0.35 : 1,
                transition: 'opacity 200ms ease',
            }}
        >
            {/* Background Track Circle */}
            <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="var(--vq-line-soft)"
                strokeWidth={strokeWidth}
                strokeOpacity={0.6}
            />
            {/* Animated Progress Circle */}
            <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                style={{
                    transition: 'stroke-dasharray 800ms cubic-bezier(0,0,0.2,1), stroke-width 200ms ease',
                }}
            />
        </g>
    );
}

export function RingCenter({ defaultLabel = 'Total' }) {
    const ctx = useContext(RingChartContext);
    if (!ctx) return null;
    const { data, hoveredIndex, size } = ctx;

    const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;
    const label = activeItem ? (activeItem.name || activeItem.label || activeItem.k) : defaultLabel;
    const displayVal = activeItem
        ? `${activeItem.value ?? activeItem.val ?? 0}%`
        : `${Math.round(data.reduce((acc, curr) => acc + (curr.value ?? curr.val ?? 0), 0) / (data.length || 1))}%`;

    return (
        <foreignObject x={0} y={0} width={size} height={size} style={{ pointerEvents: 'none' }}>
            <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', transform: 'rotate(90deg)',
            }}>
                <span style={{
                    fontFamily: 'var(--vq-font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--vq-text)',
                    lineHeight: 1.1,
                }}>
                    {displayVal}
                </span>
                <span style={{
                    fontFamily: 'var(--vq-font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--vq-text-3)',
                    marginTop: '3px',
                }}>
                    {label}
                </span>
            </div>
        </foreignObject>
    );
}

export function Legend({ items = [], hoveredIndex = null, onHoverChange = () => {}, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '6px' }}>
            {items.map((item, index) => (
                <LegendContext.Provider key={index} value={{ item, index, hoveredIndex, onHoverChange }}>
                    <div
                        onMouseEnter={() => onHoverChange(index)}
                        onMouseLeave={() => onHoverChange(null)}
                        style={{
                            cursor: 'pointer',
                            opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
                            transition: 'opacity 200ms ease',
                        }}
                    >
                        {children}
                    </div>
                </LegendContext.Provider>
            ))}
        </div>
    );
}

export function LegendItemComponent({ children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {children}
            </div>
        </div>
    );
}

export function LegendMarker() {
    const ctx = useContext(LegendContext);
    if (!ctx) return null;
    const { item, index } = ctx;
    const color = item.color || `var(--chart-${(index % 5) + 1})`;
    return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, marginRight: '6px' }} />;
}

export function LegendLabel() {
    const ctx = useContext(LegendContext);
    if (!ctx) return null;
    const { item } = ctx;
    const label = item.name || item.label || item.k || '';
    return (
        <span style={{
            fontFamily: 'var(--vq-font-mono)',
            fontSize: '11px',
            color: 'var(--vq-text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flex: 1,
        }}>
            {label}
        </span>
    );
}

export function LegendValue({ showPercentage = true }) {
    const ctx = useContext(LegendContext);
    if (!ctx) return null;
    const { item } = ctx;
    const val = item.value ?? item.val ?? 0;
    return (
        <span style={{
            fontFamily: 'var(--vq-font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--vq-text)',
        }}>
            {val}{showPercentage ? '%' : ''}
        </span>
    );
}

export function LegendProgress() {
    const ctx = useContext(LegendContext);
    if (!ctx) return null;
    const { item, index } = ctx;
    const val = item.value ?? item.val ?? 0;
    const maxVal = item.maxVal ?? item.total ?? 100;
    const pct = Math.min(Math.max((val / maxVal) * 100, 0), 100);
    const color = item.color || `var(--chart-${(index % 5) + 1})`;

    return (
        <div style={{
            width: '100%', height: '4px', borderRadius: '2px',
            background: 'var(--vq-sunken)', overflow: 'hidden', marginTop: '2px',
        }}>
            <div style={{
                width: `${pct}%`, height: '100%', borderRadius: '2px',
                background: color, transition: 'width 600ms cubic-bezier(0,0,0.2,1)',
            }} />
        </div>
    );
}
