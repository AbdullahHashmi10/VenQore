import React, { useState } from 'react';
import { PALETTE, getColor } from './palette';
import { formatValue } from '../utils/format';

export default function SeriesChart({ data, definition, chartType = 'line', settings }) {
    const rawSeries = data?.series || [];
    const isMulti = rawSeries.length > 0 && Array.isArray(rawSeries[0].points);
    
    // Canonicalise series structure
    const seriesList = isMulti 
        ? rawSeries 
        : [{ name: definition?.label || 'Value', points: rawSeries }];

    const chartMode = chartType || 'line';

    // Find all values to determine axis bounds
    const allPoints = seriesList.flatMap(s => s.points || []);
    if (allPoints.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-ink-muted dark:text-ink-secondary text-3xs font-bold uppercase tracking-wider select-none">
                No Series Data
            </div>
        );
    }

    const yValues = allPoints.map(p => parseFloat(p.y ?? 0));
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);

    // Rule 5: Bar charts must always start at zero. Truncated axes are not allowed.
    if (chartMode === 'bar' || minY > 0) {
        minY = Math.min(0, minY);
    }
    if (maxY < 0) {
        maxY = 0;
    }

    const rangeY = (maxY - minY) || 1;
    const paddingY = rangeY * 0.1;
    const finalMinY = minY - (chartMode === 'bar' ? 0 : paddingY);
    const finalMaxY = maxY + paddingY;
    const finalRangeY = finalMaxY - finalMinY;

    // Dimensions
    const width = 300;
    const height = 110;
    const padding = { top: 10, right: 15, bottom: 20, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Helper: Map data coordinate to SVG coordinate
    const getX = (index, total) => padding.left + (index / Math.max(1, total - 1)) * chartWidth;
    const getY = (val) => padding.top + chartHeight - ((val - finalMinY) / finalRangeY) * chartHeight;

    const zeroY = getY(0);

    // Tooltip state
    const [activePoint, setActivePoint] = useState(null);

    return (
        <div className="relative w-full h-full flex flex-col justify-between">
            {/* Svg container */}
            <div className="grow w-full h-[120px] relative select-none">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                        const y = padding.top + r * chartHeight;
                        return (
                            <line
                                key={i}
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="rgba(241, 245, 249, 0.6)"
                                className="dark:stroke-slate-800/40"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        );
                    })}

                    {/* Zero line */}
                    {finalMinY < 0 && finalMaxY > 0 && (
                        <line
                            x1={padding.left}
                            y1={zeroY}
                            x2={width - padding.right}
                            y2={zeroY}
                            stroke="rgba(148, 163, 184, 0.5)"
                            strokeWidth="1.5"
                        />
                    )}

                    {/* Render series */}
                    {seriesList.map((series, sIndex) => {
                        const points = series.points || [];
                        const color = getColor(sIndex);

                        const coords = points.map((p, pIndex) => ({
                            x: getX(pIndex, points.length),
                            y: getY(p.y),
                            raw: p
                        }));

                        if (coords.length === 0) return null;

                        const pathD = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ');

                        // Area Chart fill
                        const areaD = `${pathD} L ${coords[coords.length - 1].x} ${zeroY} L ${coords[0].x} ${zeroY} Z`;

                        // Profit-Loss signed line highlights (Rule 4 zero cross coloring)
                        const isProfitLoss = chartMode === 'profit_loss_line' || (definition?.signed && finalMinY < 0);

                        return (
                            <g key={sIndex}>
                                {/* Area Chart */}
                                {chartMode === 'area' && !isProfitLoss && (
                                    <path
                                        d={areaD}
                                        fill={color}
                                        fillOpacity="0.1"
                                    />
                                )}

                                {/* Line Path */}
                                {chartMode !== 'bar' && (
                                    <path
                                        d={pathD}
                                        fill="none"
                                        stroke={isProfitLoss ? 'url(#profitLossGradient)' : color}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}

                                {/* Gradients definitions */}
                                <defs>
                                    <linearGradient id="profitLossGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={`${(zeroY - padding.top) / chartHeight * 100}%`} stopColor={PALETTE.semantic.success} />
                                        <stop offset={`${(zeroY - padding.top) / chartHeight * 100}%`} stopColor={PALETTE.semantic.danger} />
                                    </linearGradient>
                                </defs>

                                {/* Bar Chart */}
                                {chartMode === 'bar' && coords.map((c, pIndex) => {
                                    const barWidth = Math.max(3, (chartWidth / points.length) * 0.6);
                                    const barHeight = Math.abs(zeroY - c.y);
                                    const barX = c.x - barWidth / 2;
                                    const barY = c.y < zeroY ? c.y : zeroY;

                                    return (
                                        <rect
                                            key={pIndex}
                                            x={barX}
                                            y={barY}
                                            width={barWidth}
                                            height={Math.max(1, barHeight)}
                                            fill={isProfitLoss ? (c.raw.y < 0 ? PALETTE.semantic.danger : PALETTE.semantic.success) : color}
                                            rx="1.5"
                                            className="transition-all duration-normal hover:opacity-80 cursor-pointer"
                                            onMouseEnter={() => setActivePoint({ series: series.name, ...c.raw })}
                                            onMouseLeave={() => setActivePoint(null)}
                                        />
                                    );
                                })}

                                {/* Scatter Points */}
                                {(chartMode === 'scatter' || chartMode === 'line' || chartMode === 'area') && coords.map((c, pIndex) => (
                                    <circle
                                        key={pIndex}
                                        cx={c.x}
                                        cy={c.y}
                                        r="3"
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="1"
                                        className="transition-transform duration-normal cursor-pointer"
                                        onMouseEnter={() => setActivePoint({ series: series.name, ...c.raw })}
                                        onMouseLeave={() => setActivePoint(null)}
                                    />
                                ))}
                            </g>
                        );
                    })}

                    {/* Y Axis labels */}
                    <text x={padding.left - 5} y={padding.top + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-600 text-3xs font-bold uppercase">
                        {formatValue(finalMaxY, definition?.unit, 0, settings)}
                    </text>
                    <text x={padding.left - 5} y={padding.top + chartHeight + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-600 text-3xs font-bold uppercase">
                        {formatValue(finalMinY, definition?.unit, 0, settings)}
                    </text>
                </svg>
            </div>

            {/* Tooltip detail block */}
            <div className="h-6 shrink-0 flex items-center justify-between border-t border-border dark:border-border pt-1 text-3xs font-bold text-ink-muted dark:text-ink-muted uppercase select-none">
                {activePoint ? (
                    <div className="flex items-center gap-1.5 truncate max-w-full">
                        <span className="text-ink-secondary">{activePoint.x}:</span>
                        <span className="text-brand-500 font-semibold">{formatValue(activePoint.y, definition?.unit, definition?.precision, settings)}</span>
                    </div>
                ) : (
                    <span>Hover nodes to inspect</span>
                )}
            </div>
        </div>
    );
}
