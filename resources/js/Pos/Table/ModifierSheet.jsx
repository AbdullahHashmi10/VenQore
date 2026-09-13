/* ==========================================================================
   MODIFIERS — "no onions", "+ extra cheese", "large"
   ==========================================================================
   The only per-line customisation this product had was a free-text note,
   which the kitchen can read but no total can price. A modifier is the
   priced version of the same idea, and the rules it has to honour are the
   restaurant's, not ours:

     required      the line cannot be sent until a choice is made (size)
     min / max     one sauce, up to three toppings
     price_delta   may be negative -- "no cheese" is sometimes a discount

   A group whose max is 1 behaves as a radio, anything higher as checkboxes.
   That is derived from the data rather than configured twice.
   ========================================================================== */

import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

export default function ModifierSheet({ open, product, groups = [], loading, money, onCancel, onConfirm }) {
    const [chosen, setChosen] = useState({});

    /* Defaults are applied when the sheet opens, not while it is open: a
       re-render that re-seeds the choice would fight the person clicking. */
    useEffect(() => {
        if (!open) return;
        const seed = {};
        groups.forEach(g => {
            seed[g.id] = (g.modifiers || []).filter(m => m.is_default).map(m => m.id);
        });
        setChosen(seed);
    }, [open, groups]);

    const selected = useMemo(() => {
        const out = [];
        groups.forEach(g => {
            (g.modifiers || []).forEach(m => {
                if ((chosen[g.id] || []).includes(m.id)) {
                    out.push({ id: m.id, name: m.name, price_delta: Number(m.price_delta) || 0 });
                }
            });
        });
        return out;
    }, [groups, chosen]);

    const delta = selected.reduce((a, m) => a + m.price_delta, 0);

    /* A required group with nothing chosen is the one state that must block
       the button -- everything else is the kitchen's problem, but a pizza
       with no size is not an order. */
    const unmet = groups.filter(g => {
        const n = (chosen[g.id] || []).length;
        return (g.required && n === 0) || n < (g.min_select || 0);
    });

    if (!open) return null;

    const pick = (g, m) => setChosen(prev => {
        const cur = prev[g.id] || [];
        const max = g.max_select || 1;
        if (cur.includes(m.id)) return { ...prev, [g.id]: cur.filter(x => x !== m.id) };
        if (max === 1) return { ...prev, [g.id]: [m.id] };
        if (cur.length >= max) return prev;
        return { ...prev, [g.id]: [...cur, m.id] };
    });

    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div
                className="vqt-modal vqt-modal-wide bg-surface border border-line"
                role="dialog"
                aria-modal="true"
                aria-label={`Options for ${product?.name || 'this item'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <header className="vqt-modal-h">
                    <h2 className="font-bold text-ink vq-clip" style={{ fontSize: 'var(--vq-t-lg)' }}>
                        {product?.name || 'Options'}
                    </h2>
                    <button type="button" onClick={onCancel} className="vqt-icon-btn" aria-label="Cancel">
                        <X size={16} />
                    </button>
                </header>

                <div className="vqt-modal-b vqt-mod-b">
                    {loading && (
                        <div className="flex items-center gap-2 text-ink-muted p-4">
                            <Loader2 size={16} className="animate-spin" /> Loading options…
                        </div>
                    )}

                    {!loading && groups.length === 0 && (
                        <p className="text-sm text-ink-muted p-4">This item has no options set up.</p>
                    )}

                    {groups.map(g => {
                        const cur = chosen[g.id] || [];
                        const many = (g.max_select || 1) > 1;
                        return (
                            <section key={g.id} className="vqt-mod-group">
                                <h3 className="vqt-mod-h">
                                    {g.name}
                                    <span className="vqt-mod-rule">
                                        {g.required ? 'required' : 'optional'}
                                        {many ? ` · up to ${g.max_select}` : ''}
                                    </span>
                                </h3>
                                <div className="vqt-mod-opts">
                                    {(g.modifiers || []).map(m => {
                                        const on = cur.includes(m.id);
                                        const d = Number(m.price_delta) || 0;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className="vqt-mod-opt"
                                                data-on={on ? '1' : '0'}
                                                role={many ? 'checkbox' : 'radio'}
                                                aria-checked={on}
                                                onClick={() => pick(g, m)}
                                            >
                                                <span className="vq-clip">{m.name}</span>
                                                {d !== 0 && (
                                                    <span className="vq-num vqt-mod-delta">
                                                        {d > 0 ? '+' : '−'}{money(Math.abs(d))}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <footer className="vqt-modal-f">
                    {delta !== 0 && (
                        <span className="vqt-split-total">
                            Options <b className="vq-num">{delta > 0 ? '+' : '−'}{money(Math.abs(delta))}</b>
                        </span>
                    )}
                    <button type="button" className="vqt-btn" onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        className="vqt-btn vqt-btn-go"
                        disabled={unmet.length > 0}
                        title={unmet.length ? `Choose ${unmet[0].name} first` : undefined}
                        onClick={() => onConfirm(selected)}
                    >
                        <Check size={16} />
                        {unmet.length ? `Choose ${unmet[0].name}` : 'Add to order'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
