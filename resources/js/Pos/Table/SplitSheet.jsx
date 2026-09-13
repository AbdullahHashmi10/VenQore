/* ==========================================================================
   SPLITTING A BILL
   ==========================================================================
   Three ways, because restaurants really do all three and a POS that offers
   only one sends the waiter to a calculator:

     by line     "we'll pay for the wine and the two steaks"
     evenly      "split it four ways"
     by amount   "put two thousand on this card"

   What this sheet produces is a PART, not a payment. The part goes to the
   server, the server hands the register that share of the cart, and the
   register takes the money through the one tender path everything else uses.
   That separation is why splitting a bill cannot invent a second way to post
   a sale -- there is only ever one.
   ========================================================================== */

import React, { useMemo, useState } from 'react';
import { X, Split as SplitIcon, Users, Hash, ListChecks } from 'lucide-react';

const MODES = [
    { id: 'lines',  label: 'By item',   icon: ListChecks, hint: 'Pick the lines this person is paying for.' },
    { id: 'covers', label: 'Evenly',    icon: Users,      hint: 'Divide what is left into equal shares.' },
    { id: 'amount', label: 'By amount', icon: Hash,       hint: 'Take a fixed amount off the bill now.' },
];

export default function SplitSheet({ open, lines = [], remaining = 0, covers = 2, money, onCancel, onConfirm, busy }) {
    const [mode, setMode] = useState('lines');
    const [picked, setPicked] = useState(() => new Set());
    const [parts, setParts] = useState(Math.max(2, Number(covers) || 2));
    const [amount, setAmount] = useState('');

    /* Only unpaid lines can be split -- a line someone already settled is not
       on the bill any more, and showing it invites charging for it twice. */
    const payable = useMemo(() => lines.filter(l => !l.paidSaleId), [lines]);

    const pickedTotal = useMemo(
        () => payable.reduce((a, l) => a + (picked.has(l.cartItemId) ? (Number(l.price) || 0) * (Number(l.qty) || 0) : 0), 0),
        [payable, picked],
    );

    const share = parts > 0 ? remaining / parts : 0;

    if (!open) return null;

    const toggle = (id) => setPicked(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const value = mode === 'lines' ? pickedTotal : mode === 'covers' ? share : (Number(amount) || 0);
    const legal = mode === 'lines'
        ? picked.size > 0
        : mode === 'covers'
            ? parts >= 2 && remaining > 0
            : (Number(amount) || 0) > 0 && (Number(amount) || 0) <= remaining + 0.001;

    const confirm = () => {
        if (!legal) return;
        if (mode === 'lines') {
            onConfirm({ mode: 'lines', line_ids: payable.filter(l => picked.has(l.cartItemId)).map(l => l.lineId || l.cartItemId) });
        } else if (mode === 'covers') {
            onConfirm({ mode: 'covers', parts });
        } else {
            onConfirm({ mode: 'amount', amount: Number(amount) });
        }
    };

    const active = MODES.find(m => m.id === mode);

    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div
                className="vqt-modal vqt-modal-wide bg-surface border border-line"
                role="dialog"
                aria-modal="true"
                aria-label="Split the bill"
                onMouseDown={e => e.stopPropagation()}
            >
                <header className="vqt-modal-h">
                    <SplitIcon size={16} className="text-brand-600" aria-hidden="true" />
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>Split the bill</h2>
                    <span className="vq-num ml-auto text-xs font-bold text-ink-muted">
                        {money(remaining)} left
                    </span>
                    <button type="button" onClick={onCancel} className="vqt-icon-btn" aria-label="Cancel">
                        <X size={16} />
                    </button>
                </header>

                <div className="vqt-seg vqt-seg-wide" role="tablist" aria-label="How to split">
                    {MODES.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            role="tab"
                            aria-selected={mode === m.id}
                            data-on={mode === m.id ? '1' : '0'}
                            onClick={() => setMode(m.id)}
                        >
                            <m.icon size={14} aria-hidden="true" />
                            {m.label}
                        </button>
                    ))}
                </div>

                <p className="vqt-modal-note">{active?.hint}</p>

                <div className="vqt-modal-b vqt-split-b">
                    {mode === 'lines' && (
                        <ul className="vqt-split-lines">
                            {payable.map(l => {
                                const on = picked.has(l.cartItemId);
                                return (
                                    <li key={l.cartItemId}>
                                        <button
                                            type="button"
                                            className="vqt-split-line"
                                            data-on={on ? '1' : '0'}
                                            aria-pressed={on}
                                            onClick={() => toggle(l.cartItemId)}
                                        >
                                            <span className="vqt-split-check" aria-hidden="true" />
                                            <span className="vqt-split-name vq-clip">
                                                {l.name}
                                                {(l.qty || 1) > 1 && <b className="vq-num"> ×{l.qty}</b>}
                                            </span>
                                            <span className="vq-num vqt-split-amt">
                                                {money((Number(l.price) || 0) * (Number(l.qty) || 0))}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                            {payable.length === 0 && (
                                <li className="text-sm text-ink-muted p-4">Every line on this table has been paid.</li>
                            )}
                        </ul>
                    )}

                    {mode === 'covers' && (
                        <div className="vqt-split-even">
                            <div className="vqt-seg" role="radiogroup" aria-label="Number of ways">
                                {[2, 3, 4, 5, 6, 8].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        role="radio"
                                        aria-checked={parts === n}
                                        data-on={parts === n ? '1' : '0'}
                                        onClick={() => setParts(n)}
                                        className="vq-num"
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-ink-muted mt-3">
                                {parts} ways · <b className="vq-num text-ink">{money(share)}</b> each.
                                This takes one share now and leaves the rest on the table.
                            </p>
                        </div>
                    )}

                    {mode === 'amount' && (
                        <label className="vqt-field vqt-field-stacked">
                            <span className="vqt-field-l">Amount to take now</span>
                            <input
                                type="number"
                                className="vqt-input vq-num"
                                value={amount}
                                min={0}
                                max={remaining}
                                step="0.01"
                                placeholder="0.00"
                                onChange={e => setAmount(e.target.value)}
                                autoFocus
                            />
                            {(Number(amount) || 0) > remaining && (
                                <span className="vqt-field-err">That is more than the {money(remaining)} still owed.</span>
                            )}
                        </label>
                    )}
                </div>

                <footer className="vqt-modal-f">
                    <span className="vqt-split-total">
                        This share <b className="vq-num">{money(value)}</b>
                    </span>
                    <button type="button" className="vqt-btn" onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        className="vqt-btn vqt-btn-go"
                        disabled={!legal || busy}
                        onClick={confirm}
                    >
                        Take this share
                    </button>
                </footer>
            </div>
        </div>
    );
}
