import React, { useMemo, useState } from 'react';
import useMeasure from 'react-use-measure';

import { PieChart } from '@/Components/Charts/pie-chart';
import { PieSlice } from '@/Components/Charts/pie-slice';
import { RingChart } from '@/Components/Charts/ring-chart';
import { Ring } from '@/Components/Charts/ring';
import { FunnelChart } from '@/Components/Charts/funnel-chart';

import { formatValue } from '../utils/format';
import { EmptyPlot, seriesColor, useChartMotion } from './kit';

/**
 * BreakdownChart — pie, donut, ring, funnel.
 *
 * ── Two rules this had to start obeying ─────────────────────────────────────
 *
 * **Seven slices and an Other.** Past seven the palette runs out of hues that
 * still separate for every form of colour blindness, and a pie with eleven
 * wedges is a list that has been made harder to read. The tail is summed into
 * Other rather than dropped, so the total still adds up.
 *
 * **The legend is the chart.** A wedge answers "roughly how big"; the number
 * beside its name answers "how big". Hovering either one highlights the other,
 * because a wedge with no label and a label with no wedge are each half a
 * reading. The old version drew wedges with a transition that did nothing and
 * printed percentages with no values beside them at all.
 *
 * ── Why the centre readout is ours and not PieCenter's ──────────────────────
 *
 * bklit's PieCenter only calls its render prop while a slice is hovered; at
 * rest it falls back to its own NumberFlow block, which formats through Intl
 * and therefore cannot spell this tenant's currency (the symbol comes from
 * store settings, not from a locale). That would give the card one typeface
 * and format at rest and a different one on hover. Owning the overlay costs
 * ten lines and keeps the two states identical.
 */
export default function BreakdownChart({ data, definition, meta, settings, chartType = 'pie' }) {
    const motion = useChartMotion();
    const [hovered, setHovered] = useState(null);
    const [dialRef, dial] = useMeasure();

    const unit = meta?.unit || definition?.unit || 'decimal';
    const precision = meta?.precision ?? definition?.precision ?? 0;

    const slices = useMemo(() => foldToSeven(data?.slices), [data]);

    if (!slices.length) return <EmptyPlot label="Nothing to break down" />;

    const total = slices.reduce((sum, s) => sum + s.value, 0);
    const format = (v) => formatValue(v, unit, precision, settings);
    const active = hovered === null ? null : slices[hovered];

    /* ── Funnel — stages, not shares. A funnel is ordered and lossy; a pie is
       unordered and complete, and drawing one as the other is a lie about the
       data. ─────────────────────────────────────────────────────────────── */
    if (chartType === 'funnel') {
        return (
            <FunnelChart
                className="h-full"
                data={slices.map((s, i) => ({
                    label: s.name,
                    value: s.value,
                    displayValue: format(s.value),
                    color: seriesColor(i),
                }))}
                hoveredIndex={hovered}
                onHoverChange={setHovered}
                formatValue={format}
                enterTransition={motion.enterTransition}
            />
        );
    }

    const centre = (
        <span className="vqc-centre" aria-hidden="true">
            <span className="vqc-centre-v">{format(active ? active.value : total)}</span>
            <span className="vqc-centre-k">{active ? active.name : 'Total'}</span>
        </span>
    );

    /* ── Ring — concentric arcs, one per slice, each against the total.
       RingChart scales its own radii to fit whatever box it is given, so it
       needs no measurement. ───────────────────────────────────────────── */
    if (chartType === 'ring') {
        return (
            <div className="vqc-radial">
                <div className="vqc-dial">
                    <RingChart
                        className="h-full w-full"
                        data={slices.map((s, i) => ({
                            label: s.name,
                            value: s.value,
                            maxValue: total || 1,
                            color: seriesColor(i),
                        }))}
                        hoveredIndex={hovered}
                        onHoverChange={setHovered}
                        strokeWidth={10}
                        ringGap={5}
                        enterTransition={motion.enterTransition}
                    >
                        {slices.map((s, i) => <Ring key={s.name} index={i} />)}
                    </RingChart>
                    {centre}
                </div>
                <SliceLegend {...{ slices, total, format, hovered }} onHover={setHovered} />
            </div>
        );
    }

    /* ── Pie and donut. `sunburst` renders as a donut: our slices are flat,
       and a sunburst with one ring is a donut drawn the long way. ───────── */
    const donut = chartType !== 'pie';
    /* innerRadius is PIXELS, not a fraction — passing 0.58 gives a half-pixel
       hole and a centre box of negative size. So the dial is measured and the
       hole is derived from it. */
    const size = Math.max(0, Math.min(dial.width || 0, dial.height || 0));

    return (
        <div className="vqc-radial">
            <div className="vqc-dial" ref={dialRef}>
                {size > 0 && (
                    <PieChart
                        className="h-full w-full"
                        data={slices.map((s, i) => ({
                            label: s.name,
                            value: s.value,
                            color: seriesColor(i),
                        }))}
                        innerRadius={donut ? Math.round(size * 0.28) : 0}
                        hoverOffset={8}
                        padAngle={0.02}
                        cornerRadius={2}
                        hoveredIndex={hovered}
                        onHoverChange={setHovered}
                        enterTransition={motion.enterTransition}
                    >
                        {slices.map((s, i) => <PieSlice key={s.name} index={i} />)}
                    </PieChart>
                )}
                {donut && centre}
            </div>
            <SliceLegend {...{ slices, total, format, hovered }} onHover={setHovered} />
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Legend
 * ------------------------------------------------------------------ */

/**
 * Name, value, share, and a proportional rail — hovering a row lights its
 * wedge and re-reads the middle of the dial.
 */
function SliceLegend({ slices, total, format, hovered, onHover }) {
    return (
        <div className="vqc-blg">
            {slices.map((s, i) => {
                const pct = total ? (s.value / total) * 100 : 0;
                const state = hovered === null ? '' : (hovered === i ? ' is-on' : ' is-dim');

                return (
                    <button
                        type="button"
                        key={s.name}
                        className={`vqc-blg-r${state}`}
                        onMouseEnter={() => onHover(i)}
                        onMouseLeave={() => onHover(null)}
                        onFocus={() => onHover(i)}
                        onBlur={() => onHover(null)}
                    >
                        <span className="vqc-blg-d" style={{ background: seriesColor(i) }} />
                        <span className="vqc-blg-n" title={s.name}>{s.name}</span>
                        <span className="vqc-blg-v">{format(s.value)}</span>
                        <span className="vqc-blg-p">{pct.toFixed(0)}%</span>
                        <span className="vqc-blg-bar">
                            <i style={{ width: `${pct}%`, background: seriesColor(i) }} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Seven slices and an Other.
 *
 * Sorted descending first, so Other is genuinely the tail and not whatever
 * happened to be at the end of the array. A tail of one keeps its own name —
 * folding a single thing into "Other" hides a name for no gain.
 */
function foldToSeven(raw) {
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const clean = raw
        .map((s) => ({ name: s.name ?? s.label ?? '-', value: Number(s.value) || 0 }))
        .filter((s) => s.value !== 0)
        .sort((a, b) => b.value - a.value);

    if (clean.length <= 8) return clean;

    const head = clean.slice(0, 7);
    const tail = clean.slice(7);
    return [...head, { name: 'Other', value: tail.reduce((sum, s) => sum + s.value, 0) }];
}
