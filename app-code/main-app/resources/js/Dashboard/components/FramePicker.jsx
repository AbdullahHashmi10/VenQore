import React from 'react';

export default function FramePicker({ frames = [], value, onChange, disabled = false }) {
    // Three curated designs are offered. Custom frames and whichever frame
    // this board already uses stay visible so nothing a user relies on vanishes.
    const curated = frames.filter((f) => f.curated || f.custom || f.key === value);
    const shown = frames.some((f) => f.curated) ? curated : frames;
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Dashboard frame">
            {shown.map((frame) => {
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
                    <span className="block text-sm font-semibold">{frame.name}</span>
                    {frame.blurb && <span className="mb-3 mt-0.5 block text-xs text-muted">{frame.blurb}</span>}
                    {!frame.blurb && <span className="mb-3 block" />}
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
