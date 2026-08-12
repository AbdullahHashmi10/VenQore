import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatValue } from '../utils/format';

export default function StatChart({ data, definition, settings }) {
    const value = data?.value;
    const previous = data?.previous;
    const changePct = data?.change_pct;
    const direction = definition?.direction || 'neutral';
    const unit = definition?.unit || 'decimal';
    const precision = definition?.precision ?? 0;

    // Formatting values
    const displayValue = formatValue(value, unit, precision, settings);
    const displayPrevious = previous !== null && previous !== undefined
        ? formatValue(previous, unit, precision, settings)
        : null;

    // Determine trend classes & icons
    let trendColor = 'text-slate-400 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-500';
    let TrendIcon = Minus;

    if (changePct !== null && changePct !== undefined) {
        const isPositive = changePct > 0;
        const isNegative = changePct < 0;

        if (direction === 'upper_is_better') {
            if (isPositive) {
                trendColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
                TrendIcon = TrendingUp;
            } else if (isNegative) {
                trendColor = 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400';
                TrendIcon = TrendingDown;
            }
        } else if (direction === 'lower_is_better') {
            if (isNegative) {
                trendColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
                TrendIcon = TrendingDown;
            } else if (isPositive) {
                trendColor = 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400';
                TrendIcon = TrendingUp;
            }
        } else {
            // Neutral direction
            trendColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400';
            TrendIcon = isPositive ? TrendingUp : TrendingDown;
        }
    }

    // Mini background sparkline if history series is available
    const points = data?.series || [];
    const hasSparkline = points.length > 1;

    let pathD = '';
    let areaD = '';

    if (hasSparkline) {
        const width = 120;
        const height = 40;
        const minVal = Math.min(...points);
        const maxVal = Math.max(...points);
        const range = maxVal - minVal || 1;

        const coords = points.map((p, index) => {
            const x = (index / (points.length - 1)) * width;
            const y = height - ((p - minVal) / range) * height * 0.8 - 4; // keep padding
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

                {changePct !== null && changePct !== undefined && (
                    <div className={`flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${trendColor} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                        <TrendIcon size={12} className="stroke-[3]" />
                        <span>{Math.abs(changePct).toFixed(1)}%</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto grow z-10">
                <div className="text-3xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {displayPrevious ? `vs ${displayPrevious} prev` : ''}
                </div>

                {hasSparkline && (
                    <div className="w-[120px] h-[40px] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                        <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="statSparkGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d={areaD}
                                fill="url(#statSparkGradient)"
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
                    </div>
                )}
            </div>
        </div>
    );
}
