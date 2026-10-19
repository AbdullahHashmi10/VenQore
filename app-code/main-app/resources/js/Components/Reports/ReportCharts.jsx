import React from 'react';
import { usePage } from '@inertiajs/react';

import SeriesChart from '@/Dashboard/charts/SeriesChart';
import BreakdownChart from '@/Dashboard/charts/BreakdownChart';
import { seriesColor, EmptyPlot } from '@/Dashboard/charts/kit';
import { formatValue } from '@/Dashboard/utils/format';

/**
 * Report charts: thin wrappers over the same bklit-based plots the dashboard
 * uses (Dashboard/charts), so every report draws with the same marks, colours,
 * tooltips and motion. Reports never import recharts.
 *
 *   <TrendChart series={[{ name:'Sales', points:[{x:'2026-10-01', y:1200}, ...] }]} type="area" />
 *   <DonutChart slices={[{ name:'Cash', value:900 }, ...]} />
 *   <RankBars items={[{ label:'Item A', value:500, sub:'12 sold' }]} />
 */

const useMoneySettings = () => {
    const { store, settings } = usePage().props;
    return store || settings || null;
};

/** Area, line or bar over time (or over categories for bars). */
export function TrendChart({ series, points, label = 'Value', type = 'area', unit = 'currency', precision = 0, height = 260, legend = true, className = '' }) {
    const settings = useMoneySettings();
    const list = series?.length ? series : (points?.length ? [{ name: label, points }] : []);
    const hasData = list.some((s) => (s.points || []).length > 0);

    if (!hasData) {
        return <div className={className} style={{ height }}><EmptyPlot /></div>;
    }

    return (
        <div className={className}>
            {legend && list.length > 1 && (
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {list.map((s, i) => (
                        <span key={s.name} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seriesColor(i) }} aria-hidden="true" />
                            {s.name}
                        </span>
                    ))}
                </div>
            )}
            <div style={{ height }} className="w-full">
                <SeriesChart
                    data={{ series: list }}
                    meta={{ unit, precision, label, noMarkers: true, roomy: true }}
                    settings={settings}
                    chartType={type}
                />
            </div>
        </div>
    );
}

/** Share of a whole: donut, pie or ring with a legend that carries the numbers. */
export function DonutChart({ slices, unit = 'currency', precision = 0, type = 'donut', height = 190, className = '' }) {
    const settings = useMoneySettings();
    return (
        <div className={`vq-report-donut ${className}`} style={{ height: Math.min(height, 300) }}>
            <BreakdownChart
                data={{ slices: slices || [] }}
                meta={{ unit, precision }}
                settings={settings}
                chartType={type}
            />
        </div>
    );
}

/** Ranked horizontal bars, every row the same height. Pure markup, no chart library. */
export function RankBars({ items = [], unit = 'currency', precision = 0, limit = 8, colorIndex = 0, empty = 'Nothing to rank yet' }) {
    const settings = useMoneySettings();
    const rows = items.slice(0, limit);
    if (!rows.length) return <div className="py-6"><EmptyPlot label={empty} /></div>;
    const max = Math.max(...rows.map((r) => Math.abs(Number(r.value) || 0)), 1);

    return (
        <ul className="flex flex-col">
            {rows.map((r, i) => {
                const pct = Math.max(2, (Math.abs(Number(r.value) || 0) / max) * 100);
                return (
                    <li key={`${r.label}-${i}`} className="flex h-10 items-center gap-3">
                        <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-ink-muted">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-ink" title={r.label}>{r.label}</span>
                                <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{formatValue(r.value, unit, precision, settings)}</span>
                            </span>
                            <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                                <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: seriesColor(colorIndex) }} />
                            </span>
                        </span>
                        {r.sub ? <span className="hidden w-24 shrink-0 truncate text-right text-xs text-ink-muted sm:block">{r.sub}</span> : null}
                    </li>
                );
            })}
        </ul>
    );
}
