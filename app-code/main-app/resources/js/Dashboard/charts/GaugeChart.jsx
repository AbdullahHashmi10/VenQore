import React, { useEffect, useState } from 'react';
import { formatValue } from '../utils/format';

export default function GaugeChart({ data, definition, settings }) {
    const value = parseFloat(data?.value ?? 0);
    const unit = definition?.unit || 'percentage';
    const precision = definition?.precision ?? 0;

    // Clamp value to 0-100 for gauge track representation
    const percentage = Math.min(100, Math.max(0, unit === 'percentage' ? value : value));

    const [offset, setOffset] = useState(157); // 157 represents fully empty arc (PI * r)

    useEffect(() => {
        // SVG circle radius is 25, circumference is 2 * PI * 25 = 157.08
        // For a semi-circle or arc, let's use a strokeDasharray of "157 157"
        // and strokeDashoffset ranging from 157 (empty) to 0 (full)
        const progress = percentage / 100;
        const newOffset = 157 - (progress * 157);
        const t = setTimeout(() => setOffset(newOffset), 100);
        return () => clearTimeout(t);
    }, [percentage]);

    const displayValue = formatValue(value, unit, precision, settings);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full relative">
            <div className="relative w-32 h-20 shrink-0">
                <svg viewBox="0 0 60 40" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="gaugeActiveGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgb(99, 102, 241)" />
                            <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                        </linearGradient>
                    </defs>

                    {/* Background Track Arc */}
                    <path
                        d="M 10 35 A 20 20 0 0 1 50 35"
                        fill="none"
                        stroke="rgb(241, 245, 249)"
                        className="dark:stroke-slate-800"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />

                    {/* Progress Indicator Arc */}
                    <path
                        d="M 10 35 A 20 20 0 0 1 50 35"
                        fill="none"
                        stroke="url(#gaugeActiveGradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="62.8" // Approximate length of the 180 deg arc with r=20
                        // 62.8 is PI * r.
                        strokeDashoffset={62.8 - (percentage / 100) * 62.8}
                        /* 520ms, the longest legal duration. A gauge sweeping for a
                               full second reads as the number being computed
                               rather than displayed — and it is already known. */
                        className="transition-all duration-slower ease-standard"
                    />
                </svg>

                {/* Numeric value inside gauge */}
                <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-end">
                    <span className="text-xl font-semibold text-ink tracking-tight leading-none">
                        {displayValue}
                    </span>
                </div>
            </div>
        </div>
    );
}
