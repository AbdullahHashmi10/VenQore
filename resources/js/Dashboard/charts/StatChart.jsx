import React, { useMemo } from 'react';

import { AreaChart } from '@/Components/Charts/area-chart';
import { Area } from '@/Components/Charts/area';
import { Bar } from '@/Components/Charts/bar';
import { BarChart } from '@/Components/Charts/bar-chart';
import { Line } from '@/Components/Charts/line';
import { LineChart } from '@/Components/Charts/line-chart';

import { formatValue } from '../utils/format';
import { variantOf } from '../variantLaw';
import { padSeries, seriesList, toRows, useChartMotion } from './kit';

/**
 * StatChart — the body under a number.
 *
 * ── What this is not, any more ──────────────────────────────────────────────
 *
 * It used to be the whole card: it rendered the value at 38px, the delta pill,
 * the context line and a sparkline, which meant a line chart's card had no
 * number, a gauge's card had two, and each of the nine chart components decided
 * its own type scale independently. The frame owns all of that now (M2 and M3
 * are frame mechanisms, not per-chart ones), and this draws what is left.
 *
 * ── The four reads ──────────────────────────────────────────────────────────
 *
 * A single number with no context cannot be acted on — "Rs 920,625" is a
 * different fact depending on whether it is today or the year, and "672" on
 * its own does not say what it counts or which way it is going. So a stat card
 * offers four bodies, and the frame states the label and the window above all
 * of them:
 *
 *   `number`  nothing at all — the frame's figure, delta and window, one row
 *   `spark`   the shape of the run-up
 *   `delta`   this half of the window against the last
 *   `plain`   lowest, average, highest, latest — and when each happened
 *
 * `number` exists because a card that is only a number should be allowed to be
 * only a number, at 3×1, rather than forced into three rows of whitespace. The
 * Variant Law drops the size floor to match.
 *
 * ── M5 · one hue ────────────────────────────────────────────────────────────
 *
 * A single accent stroke over a wash that fades to transparent. No axis, no
 * grid, no second colour, no tooltip — a sparkline answers "which way, and how
 * steadily", and every mark added to it answers a question nobody asked it.
 */
export default function StatChart({ data, definition, meta, settings, card }) {
    const motion = useChartMotion();
    const variant = variantOf(card ?? { chart: 'stat' });

    const unit = meta?.unit || definition?.unit || 'decimal';
    const precision = meta?.precision ?? definition?.precision ?? 0;
    const previous = data?.previous;

    /* A single reading still draws — flat, on a real scale. See `padSeries`. */
    const list = useMemo(
        () => padSeries(seriesList(data), meta, meta?.label || definition?.label || 'Value'),
        [data, meta, definition],
    );
    const rows = useMemo(() => toRows(list, { asDate: false }), [list]);

    const format = (v) => formatValue(v, unit, precision, settings);
    const values = useMemo(
        () => rows.map((r) => r.s0).filter((v) => typeof v === 'number'),
        [rows],
    );

    /* The frame already carries the figure, the delta and the window. */
    if (variant === 'number') return null;

    /* ── Period comparison — this half of the window against the last ──── */
    if (variant === 'delta') {
        if (values.length < 2) return contextOnly(previous, format);

        const half = Math.floor(values.length / 2);
        const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
        const prev = mean(values.slice(0, half));
        const curr = mean(values.slice(half));
        const max = Math.max(prev, curr) || 1;
        const up = curr >= prev;
        const pct = prev ? Math.abs(((curr - prev) / prev) * 100).toFixed(1) : '0.0';

        return (
            <div className="vqc-stat">
                <ComparisonRow label="This window" value={curr} max={max} format={format} accent />
                <ComparisonRow label="Previous" value={prev} max={max} format={format} />
                <p className="vqc-stat-note">
                    {up ? 'Up' : 'Down'} {pct}% on the first half of the period.
                </p>
            </div>
        );
    }

    /* ── Min / avg / max — the four facts, and when each happened ──────── */
    if (variant === 'plain') {
        if (!values.length) return contextOnly(previous, format);

        const lo = Math.min(...values);
        const hi = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const nameAt = (v) => {
            const i = rows.findIndex((r) => r.s0 === v);
            return i >= 0 ? String(rows[i].name ?? '') : '';
        };

        return (
            <div className="vqc-stat vqc-stat--facts">
                <Fact label="Lowest" value={format(lo)} when={nameAt(lo)} />
                <Fact label="Average" value={format(avg)} when="mean" />
                <Fact label="Highest" value={format(hi)} when={nameAt(hi)} />
                <Fact
                    label="Latest"
                    value={format(values[values.length - 1])}
                    when={String(rows[rows.length - 1]?.name ?? '')}
                />
            </div>
        );
    }

    /* ── Sparkline — the shape of the run-up ───────────────────────────── */
    const hasSpark = rows.length > 1;
    const hasContext = previous !== null && previous !== undefined;

    /* `padSeries` guarantees two points, so there is always a line to draw —
       flat when the value did not move, which is the honest picture of a
       quiet day rather than an empty box. */

    /* bklit's scaled charts want real Dates; a stat's x is positional, so
       stand-in days keep the spacing even without inventing a calendar. */
    const dated = rows.map((r, i) => ({ ...r, date: new Date(i * 864e5) }));
    const sparkStyle = card?.chart === 'sparkline' ? variant : 'area';

    return (
        <div className="vqc-spark-wrap">
            {hasContext && (
                <span className="vqc-ctx">vs {format(previous)}</span>
            )}

            {hasSpark && (
                <div className="vqc-spark">
                    {sparkStyle === 'bars' ? (
                        <BarChart
                            data={rows}
                            xDataKey="name"
                            className="h-full"
                            aspectRatio="auto"
                            margin={{ top: 4, right: 0, bottom: 2, left: 0 }}
                            {...motion}
                        >
                            <Bar dataKey="s0" fill="var(--chart-1)" lineCap={2} />
                        </BarChart>
                    ) : sparkStyle === 'line' ? (
                        <LineChart
                            data={dated}
                            xDataKey="date"
                            className="h-full"
                            aspectRatio="auto"
                            margin={{ top: 4, right: 0, bottom: 2, left: 0 }}
                            {...motion}
                        >
                            <Line dataKey="s0" stroke="var(--chart-1)" strokeWidth={2} />
                        </LineChart>
                    ) : (
                        <AreaChart
                            data={dated}
                            xDataKey="date"
                            className="h-full"
                            aspectRatio="auto"
                            margin={{ top: 4, right: 0, bottom: 2, left: 0 }}
                            {...motion}
                        >
                            <Area
                                dataKey="s0"
                                fill="var(--chart-1)"
                                stroke="var(--chart-1)"
                                fillOpacity={0.22}
                                gradientToOpacity={0}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    )}
                </div>
            )}
        </div>
    );
}

/** When there is no run-up to draw, the comparison is still worth stating. */
function contextOnly(previous, format) {
    if (previous === null || previous === undefined) return null;
    return (
        <div className="vqc-stat">
            <p className="vqc-stat-note">vs {format(previous)} in the previous window.</p>
        </div>
    );
}

function ComparisonRow({ label, value, max, format, accent = false }) {
    return (
        <div className="vqc-cmp">
            <span className="vqc-cmp-label">{label}</span>
            <span className="vqc-cmp-track">
                <i
                    style={{
                        width: `${Math.max(2, (value / max) * 100).toFixed(0)}%`,
                        background: accent ? 'var(--chart-1)' : 'var(--vq-chart-track-data)',
                    }}
                />
            </span>
            <b className="vqc-cmp-value">{format(value)}</b>
        </div>
    );
}

function Fact({ label, value, when }) {
    return (
        <div className="vqc-fact">
            <span>{label}</span>
            <b>{value}</b>
            {when ? <em>{when}</em> : null}
        </div>
    );
}
