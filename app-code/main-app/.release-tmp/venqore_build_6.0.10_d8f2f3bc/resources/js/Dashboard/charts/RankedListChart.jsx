import React, { useMemo, useState } from 'react';

import { formatValue } from '../utils/format';
import { EmptyPlot, seriesColor } from './kit';

export default function RankedListChart({ data, definition, meta, settings, card }) {
    const [hovered, setHovered] = useState(null);
    const unit = meta?.unit || definition?.unit || 'integer';
    const precision = meta?.precision ?? definition?.precision ?? 0;
    const limit = rowsForHeight(Number(card?.h || 3));
    const rows = useMemo(() => normalise(data).slice(0, limit), [data, limit]);

    if (!rows.length) return <EmptyPlot label="Nothing ranked yet" />;

    const peak = Math.max(...rows.map((row) => Math.abs(row.value)), 0) || 1;

    return (
        <div className="vqc-blg">
            {rows.map((row, index) => {
                const state = hovered === null ? '' : (hovered === index ? ' is-on' : ' is-dim');
                const pct = (Math.abs(row.value) / peak) * 100;
                return (
                    <button
                        type="button"
                        key={`${row.name}-${index}`}
                        className={`vqc-blg-r${state}`}
                        onMouseEnter={() => setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(index)}
                        onBlur={() => setHovered(null)}
                    >
                        <span className="vqc-rank">{index + 1}</span>
                        <span className="vqc-blg-n" title={row.name}>{row.name}</span>
                        <span className="vqc-blg-v">{formatValue(row.value, unit, precision, settings)}</span>
                        <span className="vqc-blg-bar" aria-hidden="true">
                            <i style={{ width: `${pct}%`, background: seriesColor(0) }} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function rowsForHeight(height) {
    if (height >= 6) return 10;
    if (height >= 4) return 7;
    if (height >= 3) return 5;
    return 3;
}

function normalise(data) {
    const raw = data?.rows || data?.items || data?.slices || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((row) => ({
        name: row.name ?? row.label ?? row.title ?? '—',
        value: Number(row.value ?? row.total ?? row.amount ?? 0) || 0,
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}
