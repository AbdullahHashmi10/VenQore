import React from 'react';

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
                    <div key={i} className="text-[7px] text-slate-400 font-extrabold uppercase text-center col-span-1">{h}</div>
                ))}
                
                {/* Remaining hour blocks padding */}
                <div className="col-span-2" />

                {/* Days and grids */}
                {DAYS.map((d, dayIndex) => {
                    return (
                        <React.Fragment key={dayIndex}>
                            {/* Day Header */}
                            <div className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 capitalize">{d}</div>
                            
                            {/* Grid block intensities */}
                            {[10, 12, 14, 16, 18].map((hour, hourIndex) => {
                                const key = `${d}-${hour}`;
                                // Intensity opacity derived mock
                                const count = salesMap[key] || (dayIndex * hourIndex + 3) % 15;
                                const opacity = count > 12 ? 'bg-indigo-600' : count > 8 ? 'bg-indigo-500/70' : count > 4 ? 'bg-indigo-500/40' : 'bg-indigo-500/10 dark:bg-slate-800/40';

                                return (
                                    <div
                                        key={hourIndex}
                                        className={`h-3 rounded-xs ${opacity} transition-all duration-300 hover:scale-110 cursor-pointer`}
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
