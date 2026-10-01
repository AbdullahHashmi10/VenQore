import React, { useMemo } from 'react';

import { formatValue } from '../utils/format';
import { EmptyPlot, seriesColor } from './kit';

/**
 * TableChart — a ranking, or a table excerpt.
 *
 * ── Why this is a list and not a chart ──────────────────────────────────────
 *
 * A RANKING is names and numbers in order. Drawing it as SVG bought nothing and
 * cost the row its text: the old version was a real `<table>` at 10px in
 * `text-3xs font-bold`, with `divide-line` rules, five rows hard-capped, and
 * every cell truncated at 120px whatever the card's width.
 *
 * ── §11 · which track needs contrast ────────────────────────────────────────
 *
 * The rail behind each fill is decoration, not data — the fill carries the
 * value and the number is printed beside it — so it is exempt from the 3:1
 * floor. It still uses `--vq-chart-track-data` rather than a paler groove,
 * because at 5px a track that fails is a track nobody can see is a track.
 *
 * Every rail shares one scale, measured from the largest row. Per-row scaling
 * is the classic ranking bug: it makes every bar full-width, and length stops
 * encoding anything at all.
 */
export default function TableChart({ data, definition, meta, settings }) {
    const unit = meta?.unit || definition?.unit || 'currency';
    const precision = meta?.precision ?? definition?.precision ?? 0;

    const rows = useMemo(() => normalise(data), [data]);

    if (!rows.length) return <EmptyPlot label="Nothing ranked yet" />;

    const peak = Math.max(...rows.map((r) => Math.abs(r.value)), 0) || 1;

    return (
        <div className="vqc-tb">
            {rows.map((row, i) => (
                <div key={`${row.name}-${i}`} className="vqc-tr" style={{ '--d': `${i * 40}ms` }}>
                    <span className="vqc-rank">{i + 1}</span>
                    <span className="vqc-tn" title={row.name}>{row.name}</span>
                    <span className="vqc-tbar" aria-hidden="true">
                        <i style={{
                            width: `${(Math.abs(row.value) / peak) * 100}%`,
                            background: seriesColor(0),
                        }} />
                    </span>
                    <span className="vqc-tv">{formatValue(row.value, unit, precision, settings)}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * The Reckoner returns a ranking in one of three shapes depending on the
 * source, and all three arrive here. Rather than making each source conform,
 * this reads whichever one it was handed — a `rows`/`items` list of objects, or
 * a `slices` list, keyed by `name`/`label` and `value`/`total`.
 */
function normalise(data) {
    const raw = data?.rows || data?.items || data?.slices || [];
    if (!Array.isArray(raw)) return [];

    return raw
        .map((r) => ({
            name: r.name ?? r.label ?? r.title ?? '—',
            value: Number(r.value ?? r.total ?? r.amount ?? 0) || 0,
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}
