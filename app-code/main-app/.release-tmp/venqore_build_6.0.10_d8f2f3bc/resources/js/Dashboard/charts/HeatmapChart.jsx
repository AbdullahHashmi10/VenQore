import React, { useMemo } from 'react';

import { formatValue } from '../utils/format';
import { EmptyPlot, sequentialColor } from './kit';

/**
 * HeatmapChart — magnitude across two dimensions.
 *
 * ── Why this one is CSS and not bklit ───────────────────────────────────────
 *
 * bklit ships a heatmap, but it is built on `@visx/heatmap`, which is not in
 * this app's dependencies, and it is shaped for a GitHub contribution graph —
 * columns of dated bins, not an arbitrary row x column matrix. A grid of
 * coloured cells is four lines of CSS Grid; adding a dependency and then
 * fighting its data model to get there would be the more expensive of the two
 * by a wide margin. If the grid ever needs axes, brushing or a tooltip that
 * follows the pointer, that trade flips and the dependency is worth it.
 *
 * -- Magnitude uses the sequential ramp --------------------------------------
 *
 * One hue, light to dark, `--vq-seq-1..5`. Never a categorical slot — a
 * heatmap coloured from the series palette says "these are different kinds of
 * thing", when what it means is "these are more and less of one thing".
 *
 * The old version invented its own axes: it hard-coded Mon-Sun down the side
 * and 9am-9pm across the top whatever the reading actually contained, so a
 * heatmap of anything else was labelled with days and hours that were not its
 * own. The axes come from the data now.
 */
export default function HeatmapChart({ data, definition, meta, settings }) {
    const unit = meta?.unit || definition?.unit || 'integer';
    const precision = meta?.precision ?? definition?.precision ?? 0;

    const grid = useMemo(() => build(data), [data]);

    if (!grid) return <EmptyPlot label="Nothing to map" />;

    const { rows, cols, cells, peak } = grid;

    return (
        <div className="vqc-hm" style={{ '--cols': cols.length }}>
            <div className="vqc-hm-x">
                <b />
                {cols.map((c) => <b key={c} title={c}>{c}</b>)}
            </div>

            <div className="vqc-hm-b">
                <div className="vqc-hm-y">
                    {rows.map((r) => <b key={r} title={r}>{r}</b>)}
                </div>

                <div className="vqc-hm-g">
                    {rows.map((r) => cols.map((c) => {
                        const value = cells.get(`${r} ${c}`);
                        const has = value !== undefined;
                        return (
                            <span
                                key={`${r}-${c}`}
                                className="vqc-hc"
                                style={{
                                    background: has
                                        ? sequentialColor(peak ? value / peak : 0)
                                        : 'var(--vq-sunken)',
                                }}
                                title={`${r} - ${c} - ${has ? formatValue(value, unit, precision, settings) : 'no data'}`}
                            />
                        );
                    }))}
                </div>
            </div>
        </div>
    );
}

/**
 * Read the matrix out of whatever the source called its axes.
 *
 * Row and column order is first-seen order, not sorted: "Mon, Tue, Wed" is the
 * order the source meant, and alphabetising it to "Fri, Mon, Sat" would make
 * the grid unreadable while looking tidier in the code.
 */
function build(data) {
    const raw = data?.rows || data?.cells || data?.items || [];
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const rows = [];
    const cols = [];
    const cells = new Map();
    let peak = 0;

    for (const entry of raw) {
        const r = String(entry.row ?? entry.y ?? entry.day ?? '-');
        const c = String(entry.col ?? entry.x ?? entry.hour ?? '-');
        const v = Number(entry.value ?? entry.count ?? entry.sales ?? 0) || 0;

        if (!rows.includes(r)) rows.push(r);
        if (!cols.includes(c)) cols.push(c);
        cells.set(`${r} ${c}`, v);
        if (v > peak) peak = v;
    }

    return rows.length && cols.length ? { rows, cols, cells, peak } : null;
}
