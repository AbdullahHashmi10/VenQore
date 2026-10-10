import React from 'react';

const TONES = {
    amber: ['#92400e', '#fef3c7'], emerald: ['#065f46', '#d1fae5'], violet: ['#5b21b6', '#ede9fe'],
    sky: ['#075985', '#e0f2fe'], rose: ['#9f1239', '#ffe4e6'], teal: ['#115e59', '#ccfbf1'],
};

/** Small award chips for a store: shown in the directory and on the store page. */
export default function StoreBadges({ badges = [], max = 3, size = 'sm' }) {
    const list = (badges || []).slice(0, max);
    if (list.length === 0) return null;
    const pad = size === 'lg' ? '4px 11px' : '2px 8px';
    const fs = size === 'lg' ? 13 : 11.5;
    return (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
            {list.map((b) => {
                const [fg, bg] = TONES[b.tone] || TONES.amber;
                return (
                    <span key={b.key} title={b.description}
                        style={{ background: bg, color: fg, padding: pad, borderRadius: 999, fontSize: fs, fontWeight: 700, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                        ★ {b.label}
                    </span>
                );
            })}
        </span>
    );
}
