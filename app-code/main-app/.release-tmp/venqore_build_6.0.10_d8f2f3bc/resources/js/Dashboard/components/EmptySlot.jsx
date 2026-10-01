import React from 'react';

export default function EmptySlot({ slot, onAdd, disabled = false }) {
    return (
        <div
            className="flex items-center justify-center rounded-card border border-dashed border-line bg-surface-subtle"
            style={{
                gridColumn: `${Number(slot.x) + 1} / span ${slot.w}`,
                gridRow: `${Number(slot.y) + 1} / span ${slot.h}`,
            }}
        >
            <button type="button" className="text-sm font-semibold text-muted" onClick={() => onAdd?.(slot)} disabled={disabled}>
                {disabled ? 'Your manager set this layout' : 'Add a card'}
            </button>
        </div>
    );
}
