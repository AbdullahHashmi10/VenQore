import React from 'react';
import { formatValue } from '../utils/format';

export default function SparklineChart({ data, definition, settings }) {
    const value = data?.value;
    const unit = definition?.unit || 'decimal';
    const precision = definition?.precision ?? 0;
    const points = data?.series || [];

    const displayValue = formatValue(value, unit, precision, settings);
    const hasPoints = points.length > 1;

    let pathD = '';
    let areaD = '';

    if (hasPoints) {
        const width = 200;
        const height = 50;
        const minVal = Math.min(...points);
        const maxVal = Math.max(...points);
        const range = maxVal - minVal || 1;

        const coords = points.map((p, index) => {
            const x = (index / (points.length - 1)) * width;
            const y = height - ((p - minVal) / range) * height * 0.8 - 5;
            return { x, y };
        });

        pathD = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ');
        areaD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;
    }

    return (
        <div className="flex flex-col justify-between h-full w-full relative">
            <div className="flex items-baseline justify-between shrink-0 mb-1 z-10">
                <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-all duration-300 group-hover:scale-[1.02] origin-left">
                    {displayValue}
                </div>
            </div>

            <div className="grow w-full h-[55px] relative mt-2 shrink-0 z-10 overflow-hidden rounded-b-xl">
                {hasPoints ? (
                    <svg viewBox="0 0 200 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d={areaD}
                            fill="url(#sparklineGradient)"
                        />
                        <path
                            d={pathD}
                            fill="none"
                            stroke="rgb(99, 102, 241)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 dark:text-slate-700 text-3xs uppercase font-bold tracking-wider">
                        No Trend Data
                    </div>
                )}
            </div>
        </div>
    );
}
