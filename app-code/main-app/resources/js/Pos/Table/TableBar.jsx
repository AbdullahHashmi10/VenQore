/* ==========================================================================
   THE TABLE STRIP AND ITS DIALOGS
   ==========================================================================
   Everything here belongs to the ORDER, not to the floor: who is sitting at
   this table, what kind of order it is, what has been fired, and the four
   things you can do to a table that are not "take money" -- fire, split,
   move, close.

   It is a strip and not a toolbar. The register already carries a dock, a
   pane header and a tender footer; a fifth row of buttons is how a screen
   becomes the 103-control POS the spec was written to replace. So: one line
   of read-out, one line of actions, and everything rarer than that behind a
   sheet.
   ========================================================================== */

import React, { useState } from 'react';
import {
    Users, Clock, Send, Split as SplitIcon, ArrowLeftRight, ReceiptText,
    X, Check, Minus, Plus, ChevronLeft, Utensils, ShoppingBag, Bike,
} from 'lucide-react';
import { ORDER_TYPES } from './useTableService';

const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };
const TYPE_LABEL = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

/* ── Seating a table ─────────────────────────────────────────────────────
   Two facts and a button. Covers defaults to the table's capacity because
   that is right more often than any other guess, and a stepper is faster
   than a keyboard for a number that is almost always between one and eight. */
export function SeatDialog({ position, onCancel, onConfirm, busy }) {
    const [covers, setCovers] = useState(Math.max(1, Number(position?.capacity) || 2));
    const [orderType, setOrderType] = useState('dine_in');
    if (!position) return null;

    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div
                className="vqt-modal bg-surface border border-line"
                role="dialog"
                aria-modal="true"
                aria-label={`Open ${position.label || position.code}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <header className="vqt-modal-h">
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>
                        Open {position.label || position.code}
                    </h2>
                    <button type="button" onClick={onCancel} className="vqt-icon-btn" aria-label="Cancel">
                        <X size={16} />
                    </button>
                </header>

                <div className="vqt-modal-b">
                    <label className="vqt-field">
                        <span className="vqt-field-l">Covers</span>
                        <span className="vqt-stepper">
                            <button type="button" onClick={() => setCovers(c => Math.max(1, c - 1))} aria-label="One fewer cover">
                                <Minus size={16} />
                            </button>
                            <input
                                type="number"
                                className="vq-num"
                                value={covers}
                                min={1}
                                max={99}
                                onChange={e => setCovers(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                                aria-label="Covers"
                            />
                            <button type="button" onClick={() => setCovers(c => Math.min(99, c + 1))} aria-label="One more cover">
                                <Plus size={16} />
                            </button>
                        </span>
                    </label>

                    <div className="vqt-field vqt-field-stacked">
                        <span className="vqt-field-l">Order type</span>
                        <div className="vqt-seg" role="radiogroup" aria-label="Order type">
                            {ORDER_TYPES.map(t => {
                                const Icon = TYPE_ICON[t.value];
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={orderType === t.value}
                                        data-on={orderType === t.value ? '1' : '0'}
                                        onClick={() => setOrderType(t.value)}
                                    >
                                        <Icon size={14} aria-hidden="true" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className="vqt-modal-f">
                    <button type="button" className="vqt-btn" onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        className="vqt-btn vqt-btn-go"
                        disabled={busy}
                        onClick={() => onConfirm({ covers, orderType })}
                    >
                        <Check size={16} />
                        Open table
                    </button>
                </footer>
            </div>
        </div>
    );
}

/* ── A ticket with no seat ───────────────────────────────────────────────
   A takeaway bag needs a name to shout across a counter; a delivery needs an
   address or the driver walks back to ask. Both are optional -- a queue at
   lunchtime does not stop for data entry, and the ticket number alone is a
   perfectly good name. So nothing here is required, and Enter submits. */
export function NewTicketDialog({ orderType, onCancel, onConfirm, busy }) {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const isDelivery = orderType === 'delivery';
    const Icon = isDelivery ? Bike : ShoppingBag;

    const submit = () => onConfirm({
        customerName: customerName.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
    });

    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div
                className="vqt-modal bg-surface border border-line"
                role="dialog"
                aria-modal="true"
                aria-label={`New ${isDelivery ? 'delivery' : 'takeaway'} ticket`}
                onMouseDown={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            >
                <header className="vqt-modal-h">
                    <Icon size={16} className="text-brand-600" aria-hidden="true" />
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>
                        New {isDelivery ? 'delivery' : 'takeaway'}
                    </h2>
                    <button type="button" onClick={onCancel} className="vqt-icon-btn" aria-label="Cancel">
                        <X size={16} />
                    </button>
                </header>

                <p className="vqt-modal-note">
                    All optional. The ticket gets a number either way — a name just makes
                    it easier to call out.
                </p>

                <div className="vqt-modal-b">
                    <label className="vqt-field vqt-field-stacked">
                        <span className="vqt-field-l">Name</span>
                        <input
                            className="vqt-input"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Who is collecting"
                            autoFocus
                        />
                    </label>

                    <label className="vqt-field vqt-field-stacked">
                        <span className="vqt-field-l">Phone</span>
                        <input
                            className="vqt-input vq-num"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Optional"
                            inputMode="tel"
                        />
                    </label>

                    {isDelivery && (
                        <label className="vqt-field vqt-field-stacked">
                            <span className="vqt-field-l">Address</span>
                            <textarea
                                className="vqt-input vqt-textarea"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Where it is going"
                                rows={2}
                            />
                        </label>
                    )}
                </div>

                <footer className="vqt-modal-f">
                    <button type="button" className="vqt-btn" onClick={onCancel}>Cancel</button>
                    <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={submit}>
                        <Check size={16} />
                        Open ticket
                    </button>
                </footer>
            </div>
        </div>
    );
}

/* ── Moving an order ─────────────────────────────────────────────────────
   Transfer and merge are the same gesture with a different destination: an
   empty table moves the party, an occupied one joins them. One picker, and
   the destination's own state decides which verb applies -- so a waiter
   cannot pick "merge" and then be told the table is empty. */
export function MoveSheet({ from, positions, onCancel, onTransfer, onMerge, busy }) {
    if (!from) return null;
    const targets = positions.filter(p => p.id !== from.id && p.status !== 'cleaning');

    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div
                className="vqt-modal vqt-modal-wide bg-surface border border-line"
                role="dialog"
                aria-modal="true"
                aria-label={`Move ${from.label || from.code}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <header className="vqt-modal-h">
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>
                        Move {from.label || from.code}
                    </h2>
                    <button type="button" onClick={onCancel} className="vqt-icon-btn" aria-label="Cancel">
                        <X size={16} />
                    </button>
                </header>

                <p className="vqt-modal-note">
                    Pick where this order goes. An empty table moves the party across;
                    an occupied one joins the two bills into one.
                </p>

                <div className="vqt-modal-b vqt-move-grid">
                    {targets.map(p => {
                        const occupied = !!p.occupancy_id;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                className="vqt-move-target"
                                data-occupied={occupied ? '1' : '0'}
                                disabled={busy}
                                onClick={() => (occupied ? onMerge(p) : onTransfer(p))}
                            >
                                <span className="vqt-move-code">{p.code}</span>
                                <span className="vqt-move-verb">{occupied ? 'Merge into' : 'Move here'}</span>
                                <span className="vqt-move-sub vq-clip">
                                    {occupied ? `${p.covers || 0} covers` : `seats ${p.capacity || 0}`}
                                </span>
                            </button>
                        );
                    })}
                    {targets.length === 0 && (
                        <p className="text-sm text-ink-muted p-4">There is nowhere else to put this order.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── The strip ───────────────────────────────────────────────────────────
   Read-out on the left, actions on the right. `Fire` is the only one that
   is ever primary, and only while there is something unsent -- a button that
   is always lit teaches the waiter to stop reading it. */
export default function TableBar({
    table,
    covers,
    orderType,
    unsent,
    onBack,
    onCovers,
    onOrderType,
    onFire,
    onBill,
    onSplit,
    onMove,
    onClose,
    checkDropped,
    busy,
    compact = false,
    elapsedLabel,
}) {
    if (!table) return null;
    const Icon = TYPE_ICON[orderType] || Utensils;

    return (
        <div className="vqt-strip" data-compact={compact ? '1' : '0'}>
            <button type="button" className="vqt-back" onClick={onBack} title="Back to the floor">
                <ChevronLeft size={16} aria-hidden="true" />
                <span className="vqt-back-code">{table.code}</span>
            </button>

            <span className="vqt-strip-read">
                <span className="vqt-chip" title="Covers">
                    <Users size={12} aria-hidden="true" />
                    <button type="button" onClick={() => onCovers(Math.max(1, covers - 1))} aria-label="One fewer cover">
                        <Minus size={11} />
                    </button>
                    <b className="vq-num">{covers}</b>
                    <button type="button" onClick={() => onCovers(Math.min(99, covers + 1))} aria-label="One more cover">
                        <Plus size={11} />
                    </button>
                </span>

                <button
                    type="button"
                    className="vqt-chip vqt-chip-btn"
                    onClick={() => {
                        const i = ORDER_TYPES.findIndex(t => t.value === orderType);
                        onOrderType(ORDER_TYPES[(i + 1) % ORDER_TYPES.length].value);
                    }}
                    title="Change the order type"
                >
                    <Icon size={12} aria-hidden="true" />
                    {TYPE_LABEL[orderType] || 'Dine-in'}
                </button>

                {elapsedLabel && (
                    <span className="vqt-chip vqt-chip-quiet" title="Seated">
                        <Clock size={12} aria-hidden="true" />
                        {elapsedLabel}
                    </span>
                )}
            </span>

            <span className="vqt-strip-acts">
                <button
                    type="button"
                    className="vqt-act"
                    data-primary={unsent > 0 ? '1' : '0'}
                    onClick={onFire}
                    disabled={busy || unsent === 0}
                    title={unsent ? `Send ${unsent} new item${unsent === 1 ? '' : 's'} to the kitchen` : 'Everything has been sent'}
                >
                    <Send size={14} aria-hidden="true" />
                    <span className="vqt-act-l">Fire</span>
                    {unsent > 0 && <span className="vqt-act-n vq-num">{unsent}</span>}
                </button>

                {/* PRINT BILL is not a printer button -- it records that the
                    check has been dropped, which is what starts the clock on
                    "they are waiting to pay". That state is one of the two the
                    floor turns into an alarm, and it is the reason a manager
                    ever finds out a table has been sitting with a bill on it
                    for a quarter of an hour. */}
                <button
                    type="button"
                    className="vqt-act"
                    data-on={checkDropped ? '1' : '0'}
                    onClick={onBill}
                    disabled={busy}
                    title={checkDropped ? 'Bill already dropped — tap to undo' : 'Print the bill and start the pay clock'}
                >
                    <ReceiptText size={14} aria-hidden="true" />
                    <span className="vqt-act-l">Bill</span>
                </button>

                <button type="button" className="vqt-act" onClick={onSplit} disabled={busy} title="Split the bill">
                    <SplitIcon size={14} aria-hidden="true" />
                    <span className="vqt-act-l">Split</span>
                </button>

                <button type="button" className="vqt-act" onClick={onMove} disabled={busy} title="Move or merge this table">
                    <ArrowLeftRight size={14} aria-hidden="true" />
                    <span className="vqt-act-l">Move</span>
                </button>

                <button type="button" className="vqt-act vqt-act-danger" onClick={onClose} disabled={busy} title="Close this table">
                    <X size={14} aria-hidden="true" />
                    <span className="vqt-act-l">Close</span>
                </button>
            </span>
        </div>
    );
}
