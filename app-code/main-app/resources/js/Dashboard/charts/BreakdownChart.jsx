import React from 'react';
import { getColor } from './palette';
import { formatValue } from '../utils/format';

export default function BreakdownChart({ data, definition, chartType = 'ring', settings }) {
    const rawSlices = data?.slices || [];
    
    if (rawSlices.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-ink-muted dark:text-ink-secondary text-3xs font-bold uppercase tracking-wider select-none">
                No Breakdown Data
            </div>
        );
    }

    // Rule 2: pie/ring/sunburst cap at 7 slices + "Other"
    let slices = [...rawSlices].sort((a, b) => b.value - a.value);
    if (slices.length > 7) {
        const topSlices = slices.slice(0, 7);
        const otherSlices = slices.slice(7);
        const otherVal = otherSlices.reduce((sum, s) => sum + s.value, 0);
        const otherPct = otherSlices.reduce((sum, s) => sum + (s.pct || 0), 0);
        
        slices = [...topSlices, { name: 'Other', value: otherVal, pct: otherPct }];
    }

    const total = slices.reduce((sum, s) => sum + s.value, 0);

    // Compute polar coordinates for SVG slices
    let accumulatedAngle = 0;
    const radius = 25;
    const center = 30;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const paths = slices.map((slice, index) => {
        const valPct = total > 0 ? (slice.value / total) : 0;
        if (valPct === 0) return null;

        const startAngle = accumulatedAngle;
        const endAngle = accumulatedAngle + valPct;

        const [startX, startY] = getCoordinatesForPercent(startAngle);
        const [endX, endY] = getCoordinatesForPercent(endAngle);

        const largeArcFlag = valPct > 0.5 ? 1 : 0;

        // Path for Pie
        const pathData = [
            `M ${center} ${center}`,
            `L ${center + startX * radius} ${center + startY * radius}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius}`,
            'Z'
        ].join(' ');

        accumulatedAngle = endAngle;

        return {
            path: pathData,
            color: getColor(index),
            ...slice
        };
    }).filter(Boolean);

    const isRing = chartType === 'ring' || chartType === 'sunburst';

    return (
        <div className="flex items-center justify-between h-full w-full gap-4 relative select-none">
            {/* Visual Ring/Pie Graphic */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-full h-full transform -rotate-90 overflow-visible">
                    {paths.map((p, i) => (
                        <path
                            key={i}
                            d={p.path}
                            fill={p.color}
                            className="transition-all duration-normal origin-center cursor-pointer"
                        />
                    ))}

                    {/* Ring cutout */}
                    {isRing && (
                        <circle
                            cx={center}
                            cy={center}
                            r={radius * 0.65}
                            /* The card surface, so a pie label punches
                               through its own slice. Asking the token layer
                               deletes the dark_mode branch entirely:
                               --vq-surface already flips with the mode. */
                            fill="var(--vq-surface)"
                            className="dark:fill-slate-900"
                        />
                    )}
                </svg>

                {isRing && total > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] font-semibold text-ink-secondary">
                            {formatValue(total, definition?.unit, 0, settings)}
                        </span>
                        <span className="text-[7px] text-ink-muted font-bold uppercase tracking-wider mt-0.5">
                            Total
                        </span>
                    </div>
                )}
            </div>

            {/* Slices legend */}
            <div className="grow flex flex-col gap-1 overflow-y-auto max-h-[96px] custom-scrollbar pr-1">
                {paths.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[9px] font-bold">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                            <span className="text-ink-secondary truncate max-w-[70px]">{p.name}</span>
                        </div>
                        <span className="text-ink-muted shrink-0 font-medium">{p.pct?.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
