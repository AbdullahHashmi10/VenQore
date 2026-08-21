import React, { useEffect, useMemo, useRef, useState } from 'react';

import { PALETTE, getColor, isOverflowSeries } from './palette';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  chartKit — the rules every chart obeys, in one place                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The nine chart components under this folder draw their own SVG. That is a
 * deliberate choice inherited from the V6 reference ("library-free, draw-in on
 * mount, slot-1 mint"), and it is why they can look like the card they sit in
 * rather than like whatever a chart library's defaults happen to be.
 *
 * The cost of hand-drawn charts is that every rule has nine chances to be
 * forgotten. This module is where they live instead.
 *
 * ── The two mechanisms it enforces ──────────────────────────────────────────
 *
 * **M5 · Chart ink.** One accent hue plus neutrals. Gridlines dashed and
 * horizontal only. No axis spine. No Y-axis tick labels — the value is already
 * on the card at 38px, and repeating it down the left edge in 11px is furniture,
 * not information. X labels bare, in `--vq-text-3`.
 *
 * **M7 · Motion.** Charts draw in on mount, once, inside `--vq-dur-4`. Nothing
 * loops, nothing bounces twice, nothing animates on hover but a border and a
 * shadow. `prefers-reduced-motion` renders the final frame with no draw-in —
 * not a faster draw-in, no draw-in.
 *
 * ── This is also the library seam ───────────────────────────────────────────
 *
 * If bklit (or recharts, or anything else) is ever adopted for these cards, it
 * plugs in behind `<Plot>` and the components above keep their shape. That is
 * the whole reason the geometry, the grid and the labels are props here rather
 * than JSX inside nine files.
 *
 * The gate for any library, from bar.md: one that arrives with its own palette,
 * its own tooltip chrome, its own axis spines, or a loading shimmer that is not
 * `--vq-dur-*` is a fail even if it is objectively a nice chart.
 */

/* ------------------------------------------------------------------ *
 * Motion
 * ------------------------------------------------------------------ */

/** Does this browser, right now, want motion? Re-checked, not read once. */
export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(() =>
        typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!mq) return;
        const onChange = (e) => setReduced(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return reduced;
}

/**
 * The M7 draw-in.
 *
 * Returns 0 on the first paint and 1 immediately after, so a transition on the
 * returned value animates once and settles. Not a spring: a chart that
 * overshoots is showing the reader a number that was never in the data.
 *
 * Under reduced motion it returns 1 from the very first render, so the final
 * frame is what paints — there is no fast version of an animation someone has
 * asked not to see.
 */
export function useDrawIn() {
    const reduced = usePrefersReducedMotion();
    const [on, setOn] = useState(reduced);

    useEffect(() => {
        if (reduced) return setOn(true);
        const id = requestAnimationFrame(() => setOn(true));
        return () => cancelAnimationFrame(id);
    }, [reduced]);

    return { on, reduced, duration: reduced ? '0ms' : 'var(--vq-dur-4)' };
}

/* ------------------------------------------------------------------ *
 * Scales
 * ------------------------------------------------------------------ */

/**
 * Map a series of numbers onto plot coordinates.
 *
 * The domain floor is 0 for non-negative data rather than the minimum. Starting
 * a value axis at the smallest data point exaggerates every difference on it,
 * which is the most common way an honest chart tells a lie. Data that genuinely
 * crosses zero keeps its real minimum, because there the crossing IS the story.
 */
export function useScale(values, { width, height, padY = 4 } = {}) {
    return useMemo(() => {
        const nums = (values || []).filter((n) => Number.isFinite(n));
        if (nums.length < 1) return null;

        const rawMin = Math.min(...nums);
        const rawMax = Math.max(...nums);
        const min = rawMin < 0 ? rawMin : 0;
        const max = rawMax === min ? min + 1 : rawMax;
        const span = max - min;

        const x = (i) => (nums.length === 1 ? width / 2 : (i / (nums.length - 1)) * width);
        const y = (v) => height - padY - ((v - min) / span) * (height - padY * 2);

        return { nums, min, max, span, x, y, zeroY: y(0) };
    }, [values, width, height, padY]);
}

/* ------------------------------------------------------------------ *
 * Frame
 * ------------------------------------------------------------------ */

/**
 * The plot area, with the M5 furniture already correct.
 *
 * `gridLines` is a count, not a set of values: the point of a gridline here is
 * to give the eye a horizontal to follow, not to be read off. Anything that
 * needs reading off belongs in the table view.
 */
export function Plot({
    width = 320,
    height = 120,
    gridLines = 3,
    children,
    labels,
    ...rest
}) {
    const rows = useMemo(
        () => Array.from({ length: gridLines }, (_, i) => ((i + 1) / (gridLines + 1)) * height),
        [gridLines, height],
    );

    return (
        <div style={{ width: '100%', minWidth: 0 }}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
                role="presentation"
                {...rest}
            >
                {/* Horizontal only, dashed, recessive. A vertical gridline in a
                    time series implies the gaps between readings mean something,
                    and in this product they never do. */}
                {rows.map((y) => (
                    <line
                        key={y}
                        x1={0}
                        x2={width}
                        y1={y}
                        y2={y}
                        stroke={PALETTE.chrome.grid}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
                {children}
            </svg>

            {labels?.length > 0 && <XLabels labels={labels} />}
        </div>
    );
}

/** Bare X labels. No axis line — the gridlines already carry the horizontal. */
export function XLabels({ labels }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontFamily: 'var(--vq-font-numeric)',
                fontSize: 'var(--vq-fs-eyebrow)',
                letterSpacing: 'var(--vq-ls-eyebrow)',
                color: PALETTE.chrome.label,
            }}
        >
            {labels.map((l, i) => (
                <span key={`${l}-${i}`}>{l}</span>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

/**
 * Legend for two or more series.
 *
 * A single series needs none — the card title already names it. Four or fewer
 * are also direct-labelled by the caller where the shape allows, so identity is
 * never carried by colour alone.
 *
 * A ninth series folds into "Other" rather than wrapping back to slot 1 and
 * claiming to be the brand.
 */
export function Legend({ series = [] }) {
    if (series.length < 2) return null;

    return (
        <ul
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 14px',
                listStyle: 'none',
                margin: '10px 0 0',
                padding: 0,
                fontSize: 'var(--vq-fs-caption)',
                color: 'var(--vq-text-2)',
            }}
        >
            {series.map((s, i) => (
                <li key={s.key ?? i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                        aria-hidden="true"
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 'var(--vq-r-full)',
                            flexShrink: 0,
                            // The mark carries identity. The label beside it
                            // stays in ink — text never wears the series colour.
                            background: isOverflowSeries(i) ? PALETTE.inkFaint : getColor(i),
                        }}
                    />
                    {isOverflowSeries(i) ? 'Other' : (s.label ?? s.key)}
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------------------------------------------ *
 * The accessibility answer, and the "let me check that" answer
 * ------------------------------------------------------------------ */

/**
 * Every chart has a table view.
 *
 * It is the accessibility answer and the "let me check that number" answer at
 * the same time, which is why it is one component rather than a feature each
 * chart may or may not have implemented.
 *
 * Numbers right-aligned, tabular, in the numeric face. Horizontal rules only —
 * vertical lines make it look like a spreadsheet, and the whole argument of the
 * product is that you replaced the spreadsheet.
 */
export function TableView({ columns = [], rows = [], caption }) {
    if (!rows.length) return null;

    return (
        <table
            style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--vq-fs-caption)',
            }}
        >
            {caption && (
                <caption
                    style={{
                        captionSide: 'top',
                        textAlign: 'left',
                        paddingBottom: 6,
                        color: 'var(--vq-text-3)',
                    }}
                >
                    {caption}
                </caption>
            )}
            <thead>
                <tr>
                    {columns.map((c, i) => (
                        <th
                            key={c.key ?? i}
                            scope="col"
                            style={{
                                textAlign: c.numeric ? 'right' : 'left',
                                padding: '4px 8px',
                                borderBottom: '1px solid var(--vq-line)',
                                fontFamily: 'var(--vq-font-numeric)',
                                fontSize: 'var(--vq-fs-eyebrow)',
                                letterSpacing: 'var(--vq-ls-eyebrow)',
                                textTransform: 'uppercase',
                                fontWeight: 'var(--vq-fw-medium)',
                                color: 'var(--vq-text-3)',
                            }}
                        >
                            {c.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, r) => (
                    <tr key={r}>
                        {columns.map((c, i) => (
                            <td
                                key={c.key ?? i}
                                style={{
                                    textAlign: c.numeric ? 'right' : 'left',
                                    padding: '4px 8px',
                                    borderBottom: '1px solid var(--vq-line-soft)',
                                    fontFamily: c.numeric ? 'var(--vq-font-numeric)' : undefined,
                                    fontVariantNumeric: c.numeric ? 'tabular-nums' : undefined,
                                    color: 'var(--vq-text-2)',
                                }}
                            >
                                {row[c.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ------------------------------------------------------------------ *
 * Measurement
 * ------------------------------------------------------------------ */

/**
 * The plot's own width, for charts whose geometry cannot be expressed in a
 * viewBox — a bar chart wants real pixels so its bars keep their gap at any
 * card width, where a line chart is happy to be stretched.
 */
export function useMeasuredWidth(fallback = 320) {
    const ref = useRef(null);
    const [width, setWidth] = useState(fallback);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        const ro = new ResizeObserver(([entry]) => {
            const w = entry?.contentRect?.width;
            if (w > 0) setWidth(w);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return [ref, width];
}

export default {
    Plot, XLabels, Legend, TableView,
    useDrawIn, usePrefersReducedMotion, useScale, useMeasuredWidth,
};
