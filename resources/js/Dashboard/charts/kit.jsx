import React, { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';

import { formatValue } from '../utils/format';

/**
 * The pieces every dashboard chart needs, so no card has to remember them.
 *
 * The plots themselves come from `@/Components/Charts` — the vendored bklit
 * library — which resolves all of its colour through the CSS variables that
 * `resources/css/bklit-bridge.css` maps onto V6 tokens. This file is the layer
 * between that library and a VenQore card: the motion contract, the data
 * adapters, and the two states a plot can be in that are not a plot.
 */

/* ══════════════════════════════════════════════════════════════════════════
   MOTION
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * bklit's defaults break the V6 motion law and cannot be reached by a CSS
 * variable — they are props. Its own defaults are 1100ms and a hard in-out
 * curve; neither is one of the four legal durations or four legal easings, and
 * 1100ms of draw-in on nine cards at once reads as the page struggling.
 *
 * 520ms is `--vq-dur-4`, the longest legal duration, and the easing is
 * `--vq-ease-out`. Spread this into every chart root.
 */
export const CHART_MOTION = {
    animationDuration: 520,
    animationEasing: 'cubic-bezier(.22, 1, .36, 1)',
    /* The radial charts (pie, ring, gauge, funnel) take a motion/react
       transition rather than a duration and a CSS easing, and their own
       default is the same illegal 1100ms. Same numbers, the other spelling. */
    enterTransition: { type: 'tween', duration: 0.52, ease: [0.22, 1, 0.36, 1] },
};

/** M5 · gridlines are dashed and horizontal only, and no chart draws an axis spine. */
export const GRID_PROPS = {
    horizontal: true,
    vertical: false,
    strokeDasharray: '3 5',
    numTicksRows: 4,
};

/**
 * Under reduced motion, entrance animations resolve instantly.
 *
 * Not shortened — `animate={false}`. A 1ms animation still schedules a frame
 * and still moves, which is the thing the preference is asking us not to do.
 */
export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduced(query.matches);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    return reduced;
}

/** Chart-root props: legal motion, and none of it when the OS says so. */
export function useChartMotion() {
    const reduced = useReducedMotion();
    return reduced
        ? {
            animationDuration: 0,
            animationEasing: 'linear',
            enterTransition: { duration: 0 },
        }
        : CHART_MOTION;
}

/* ══════════════════════════════════════════════════════════════════════════
   COLOUR
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The eight categorical slots, in fixed order, never cycled.
 *
 * Colour follows the entity, not its rank, so filtering to fewer series must
 * never repaint the survivors — which `index % 8` does the moment a ninth
 * appears. Past slot 8 a series folds into ink rather than wrapping round and
 * claiming to be the brand.
 *
 * Eight is not arbitrary: the palette is verified against the
 * Machado–Oliveira–Fernandes CVD model at severity 1.0, and a ninth hue that
 * still separates from the other eight for every form of colour blindness does
 * not exist.
 */
export const SERIES_VARS = [
    'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
    'var(--vq-series-5)', 'var(--vq-series-6)', 'var(--vq-series-7)', 'var(--vq-series-8)',
];

export const seriesColor = (i) => SERIES_VARS[i] ?? 'var(--vq-text-3)';

/** Magnitude, not category. Clamped rather than wrapped — an out-of-range value
 *  that quietly re-entered at the light end would read as "almost nothing"
 *  when it means "off the scale". */
const SEQ = ['var(--vq-seq-1)', 'var(--vq-seq-2)', 'var(--vq-seq-3)', 'var(--vq-seq-4)', 'var(--vq-seq-5)'];
export function sequentialColor(t) {
    const i = Math.round(Math.max(0, Math.min(1, Number(t) || 0)) * (SEQ.length - 1));
    return SEQ[i];
}

/* ══════════════════════════════════════════════════════════════════════════
   DATA ADAPTERS
   The Reckoner speaks `{x, y}`; bklit speaks `Record<string, unknown>[]` with a
   named key. One place to translate, so nine chart files do not each invent
   their own.
   ══════════════════════════════════════════════════════════════════════════ */

/** `data.series` in either of its two shapes, always as a list of named series. */
export function seriesList(data, fallbackName = 'Value') {
    const raw = data?.series;
    if (!Array.isArray(raw) || raw.length === 0) return [];

    // Already multi-series: [{ name, points: [...] }]
    if (Array.isArray(raw[0]?.points)) {
        return raw.map((s, i) => ({
            name: s.name || `Series ${i + 1}`,
            key: `s${i}`,
            points: s.points || [],
        }));
    }

    // A bare number list is a sparkline's shape — index is the x axis.
    if (typeof raw[0] === 'number') {
        return [{
            name: fallbackName,
            key: 's0',
            points: raw.map((y, i) => ({ x: i, y })),
        }];
    }

    return [{ name: fallbackName, key: 's0', points: raw }];
}

/**
 * Guarantee a plottable run, so an empty window still draws a chart.
 *
 * A reading can legitimately return one point, or none — a store with no
 * takings today, a breakdown with nothing in it. Returning "no plot" for those
 * is the wrong answer: the user cannot tell an empty day from a broken card,
 * and they lose the axis that would have told them what the window even is.
 *
 * So a sparse series is extended to a flat one across the window the Reckoner
 * resolved. The line is honest — it is genuinely flat, because the value
 * genuinely did not move — and the axes still state the period and the scale.
 * `niceYDomain` gives a constant series a real domain, so flat renders on a
 * scale rather than at an undefined position.
 */
export function padSeries(list, meta, fallbackName = 'Value') {
    const base = list?.[0];
    const points = base?.points ?? [];
    if (points.length >= 2) return list;

    const held = points.length === 1
        ? toNumber(points[0]?.y ?? points[0]?.value)
        : 0;

    /* Span the window the read actually covered, so the x axis is the real
       period rather than two invented positions. */
    const start = parseDate(meta?.period?.start);
    const end = parseDate(meta?.period?.end);
    let xs;
    if (start && end) {
        // A single-day window would give both ends the same x and collapse the
        // line to a point; step to the end of that day instead.
        xs = start.getTime() === end.getTime()
            ? [start, new Date(start.getTime() + 864e5)]
            : [start, end];
    } else {
        xs = [0, 1];
    }

    const flat = {
        name: base?.name ?? fallbackName,
        key: base?.key ?? 's0',
        points: xs.map((x) => ({ x, y: held })),
        isFlat: true,
    };

    return [flat, ...(list ?? []).slice(1)];
}

const parseDate = (v) => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Join every series onto one row per x, which is the row shape bklit reads.
 *
 * Joined on x rather than on index: two series that cover the same window with
 * different numbers of points are the normal case (a daily revenue line beside
 * a weekly target), and zipping those by position silently plots each point
 * against the wrong date.
 */
export function toRows(list, { asDate = true } = {}) {
    const byX = new Map();

    for (const series of list) {
        for (const point of series.points || []) {
            const x = point?.x ?? point?.label ?? point?.date;
            const key = String(x);
            if (!byX.has(key)) byX.set(key, { x, name: labelOf(x) });
            byX.get(key)[series.key] = toNumber(point?.y ?? point?.value);
        }
    }

    const rows = [...byX.values()];
    if (!asDate) return rows;

    /*
     * bklit's time charts read their x through `new Date(value)`, and
     * `new Date("Cash")` is an Invalid Date — which becomes a NaN coordinate
     * and an empty plot, silently. So every row gets a real Date: its own if
     * it parses, and otherwise its POSITION expressed as a date.
     *
     * Position, not a running counter: a counter would hand the same row a
     * different date on every render, and the chart would replay its draw-in
     * each time. When the fallback is in play the caller hides the x axis and
     * the date pill, so these stand-in dates are never shown to anyone.
     */
    return rows.map((row, i) => ({ ...row, date: coerceDate(row.x, i) }));
}

const toNumber = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

const labelOf = (x) => (x instanceof Date ? x.toISOString().slice(0, 10) : String(x));

/** A real date if it is one, and otherwise this row's position as a date. */
function coerceDate(x, index) {
    if (x instanceof Date) return x;
    const parsed = typeof x === 'number' ? null : new Date(x);
    if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
    // Epoch + n days: monotonic, evenly spaced, deterministic, never NaN.
    return new Date((index + 1) * 864e5);
}

/**
 * True when the x values are real dates — i.e. this is a time series and the
 * date axis, the date pill and the crosshair's date ticker all mean something.
 *
 * Checked across the whole first series rather than on its first point: a run
 * that starts with a parseable label and continues with names is the case that
 * produces a chart with one plotted point and the rest at the origin.
 */
export function isTimeAxis(list) {
    const points = list?.[0]?.points;
    if (!Array.isArray(points) || points.length === 0) return false;

    return points.every((p) => {
        const x = p?.x;
        if (x instanceof Date) return true;
        if (x === undefined || x === null || typeof x === 'number') return false;
        return !Number.isNaN(new Date(x).getTime());
    });
}

/* ══════════════════════════════════════════════════════════════════════════
   STATES
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * No data is not an error.
 *
 * "NO SERIES DATA" in 10px uppercase grey, centred in an otherwise blank card,
 * was the most common thing on this board and it told a user nothing they could
 * act on. A reading with no rows in the chosen window usually means the window
 * is wrong, so the card says which window it looked at and stops there.
 */
export function EmptyPlot({ label = 'Nothing in this window' }) {
    return (
        <div className="vqc-state">
            <span className="vqc-state-ic"><Inbox size={16} aria-hidden="true" /></span>
            <span className="vqc-state-t">{label}</span>
            <span className="vqc-state-d">Try a wider period, or check back once there’s activity.</span>
        </div>
    );
}

/** Tooltip and axis values, formatted the way the card's own figure is. */
export function valueFormatter({ unit, precision = 0, settings }) {
    return (v) => formatValue(v, unit, precision, settings);
}

/**
 * Axis ticks are abbreviated, always.
 *
 * A y axis is a scale, not a ledger: "1.2M" at 11px down the left edge is
 * legible and "Rs 1,240,912.00" is a wall. The exact figure lives in the
 * tooltip and in the card's own metric.
 */
export function axisFormatter() {
    return (v) => {
        const n = Number(v) || 0;
        const abs = Math.abs(n);
        if (abs >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
        if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
        if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
        return String(Math.round(n));
    };
}
