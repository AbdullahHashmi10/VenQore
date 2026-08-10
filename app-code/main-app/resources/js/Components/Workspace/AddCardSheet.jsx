import React, { useEffect, useMemo, useState } from 'react';

/**
 * The "Add a card" sheet — a direct build of mockup 1b.
 *
 * The library lives behind one "+", not on the page. That is the whole idea of
 * the pattern: the dashboard shows what you chose, and the twenty things you did
 * not choose stay out of sight until you go looking for them. A picker rendered
 * inline would put the least-used surface in the product permanently on the most
 * used one.
 *
 * Colours are the mockup's literal values, matching Pages/Workspace/Overview.jsx
 * — see the note there for why this preview does not use theme tokens.
 */

/* The mockup's pills. `All` is not a category on a widget; it is the absence of
   a filter, so it is handled separately rather than added to the registry. */
const PILLS = ['All', 'Money', 'Stock', 'People', 'Growth'];

/**
 * The registry's categories are Business / Customers / Operations / People /
 * Insights. The mockup's pills are Money / Stock / People / Growth. Mapping
 * between them here keeps the sheet matching the design without renaming
 * categories that the rest of the dashboard already uses.
 */
const PILL_FOR_CATEGORY = {
    Business: 'Money',
    Customers: 'Money',
    Operations: 'Stock',
    People: 'People',
    Insights: 'Growth',
};

export default function AddCardSheet({ catalog = [], active = [], onAdd, onClose }) {
    const [pill, setPill] = useState('All');

    // Escape closes. A modal that can only be dismissed by hitting a small ×
    // is a modal that traps anyone working from the keyboard.
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const visible = useMemo(
        () =>
            catalog.filter((card) => {
                if (active.includes(card.id)) return false;
                if (pill === 'All') return true;
                return PILL_FOR_CATEGORY[card.category] === pill;
            }),
        [catalog, active, pill],
    );

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
            style={{ background: 'rgba(22,21,15,.34)', backdropFilter: 'blur(2px)' }}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Add a card"
                style={{
                    width: 520,
                    maxWidth: '100%',
                    background: '#f5f4f0',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,.22)',
                }}
            >
                <div style={{ padding: '22px 24px 20px', background: '#fff' }}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div
                                style={{
                                    font: "500 17px 'Instrument Sans',sans-serif",
                                    color: '#16150f',
                                    letterSpacing: '-.01em',
                                }}
                            >
                                Add a card
                            </div>
                            <div
                                style={{
                                    font: "400 12.5px 'Instrument Sans',sans-serif",
                                    color: '#8b877a',
                                    marginTop: 3,
                                }}
                            >
                                Pick what matters to you. Drag to reorder later.
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex items-center justify-center"
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: '#f1efe9',
                                color: '#6f6c61',
                                font: "400 14px 'Instrument Sans',sans-serif",
                                flex: 'none',
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {PILLS.map((label) => {
                            const on = label === pill;

                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setPill(label)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 99,
                                        background: on ? '#16150f' : '#f1efe9',
                                        color: on ? '#fff' : '#6f6c61',
                                        font: "500 12px 'Instrument Sans',sans-serif",
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div
                    className="grid gap-2.5"
                    style={{ padding: '16px 24px 24px', gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}
                >
                    {visible.map((card) => (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => onAdd?.(card.id)}
                            className="text-left"
                            style={{
                                background: '#fff',
                                border: '1px solid #e6e3da',
                                borderRadius: 12,
                                padding: '14px 15px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span style={{ font: "500 13px 'Instrument Sans',sans-serif", color: '#16150f' }}>
                                    {card.title}
                                </span>
                                <span
                                    className="flex items-center justify-center"
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 6,
                                        background: '#f1efe9',
                                        color: '#6f6c61',
                                        font: "400 13px 'Instrument Sans',sans-serif",
                                        flex: 'none',
                                    }}
                                >
                                    +
                                </span>
                            </div>
                            <span
                                style={{
                                    font: "400 11.5px/1.4 'Instrument Sans',sans-serif",
                                    color: '#8b877a',
                                }}
                            >
                                {card.description}
                            </span>
                        </button>
                    ))}

                    {visible.length === 0 && (
                        <div
                            className="col-span-2 text-center"
                            style={{ font: "400 13px 'Instrument Sans',sans-serif", color: '#8b877a', padding: '18px 0' }}
                        >
                            Everything here is already on your dashboard.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
