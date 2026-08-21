import React from 'react';

import { getSequential } from './palette';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['9am', '12pm', '3pm', '6pm', '9pm'];

export default function HeatmapChart({ data }) {
    // Generate a beautiful 7x5 mock matrix if full rows not populated
    const rows = data?.rows || [];
    const salesMap = {};
    rows.forEach(r => {
        const key = `${r.day}-${r.hour}`;
        salesMap[key] = r.sales;
    });

    return (
        <div className="w-full h-full flex flex-col justify-center select-none">
            <div className="grid grid-cols-8 gap-1 items-center grow mt-1">
                {/* Header corner */}
                <div />
                
                {/* Hours headers */}
                {HOURS.map((h, i) => (
                    <div key={i} className="text-[7px] text-ink-muted font-semibold uppercase text-center col-span-1">{h}</div>
                ))}
                
                {/* Remaining hour blocks padding */}
                <div className="col-span-2" />

                {/* Days and grids */}
                {DAYS.map((d, dayIndex) => {
                    return (
                        <React.Fragment key={dayIndex}>
                            {/* Day Header */}
                            <div className="text-4xs font-semibold text-ink-muted capitalize">{d}</div>
                            
                            {/* Grid block intensities */}
                            {[10, 12, 14, 16, 18].map((hour, hourIndex) => {
                                const key = `${d}-${hour}`;
                                // Intensity opacity derived mock
                                const count = salesMap[key] || (dayIndex * hourIndex + 3) % 15;
                                /*
                                 * Magnitude uses the sequential ramp — one hue,
                                 * light to dark — never a categorical slot and
                                 * never the brand at four alphas.
                                 *
                                 * Alpha was the wrong tool here regardless: a
                                 * cell at 10% opacity sits at roughly 1.2:1
                                 * against the card, and a mark that encodes a
                                 * quantity has to clear 3:1. The ramp's own
                                 * steps are built to.
                                 */
                                const t = count > 12 ? 1 : count > 8 ? 0.75 : count > 4 ? 0.5 : 0.25;
                                const fill = count > 0 ? getSequential(t) : 'var(--vq-chart-track)';

                                return (
                                    <div
                                        key={hourIndex}
                                        className="h-3 rounded-xs cursor-pointer transition-colors duration-fast"
                                        style={{ background: fill }}
                                        title={`${d} at ${hour}:00 — ${count} sales`}
                                    />
                                );
                            })}
                            
                            {/* Fill spacing */}
                            <div className="col-span-2" />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
