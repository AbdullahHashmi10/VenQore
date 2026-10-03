import React from 'react';

export default function FramePicker({ frames = [], value, onChange, disabled = false }) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Dashboard frame">
            {frames.map((frame) => {
                const columns = Math.max(...frame.slots.map((slot) => slot.x + slot.w));
                return (
                <button
                    key={frame.key}
                    type="button"
                    aria-pressed={value === frame.key}
                    disabled={disabled}
                    onClick={() => onChange?.(frame.key)}
                    className={`rounded-card border p-3 text-left ${value === frame.key ? 'border-accent' : 'border-line'}`}
                >
                    <span className="mb-3 block text-sm font-semibold">{frame.name}</span>
                    <span className="relative block aspect-video overflow-hidden rounded-sm bg-line" aria-hidden="true">
                        {frame.slots.map((slot) => (
                            <i
                                key={slot.slot}
                                className="absolute bg-surface outline outline-1 outline-line"
                                style={{
                                    left: `${(slot.x / columns) * 100}%`,
                                    top: `${(slot.y / frame.rows) * 100}%`,
                                    width: `${(slot.w / columns) * 100}%`,
                                    height: `${(slot.h / frame.rows) * 100}%`,
                                }}
                            />
                        ))}
                    </span>
                </button>
                );
            })}
            {disabled && <p className="col-span-full text-sm text-muted">Your manager set this layout.</p>}
        </div>
    );
}
