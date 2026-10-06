import React from 'react';
import { Minus, Plus, Trash2, StickyNote, Check } from 'lucide-react';
import { lineKey } from './useFohOrder';

/**
 * The lines of an order. A line that has gone to the kitchen shows how much was
 * sent; a line that has been paid (a split part) is struck through and locked.
 * Add-ons are listed under the dish exactly as they will print on the ticket.
 */
export default function CartLines({ cart, money, canVoid, showCourse, onQty, onRemove, onPatch }) {
    if (!cart.length) {
        return <div className="foh-cart-empty">Tap a dish on the menu to start the order.</div>;
    }
    return (
        <ul className="foh-lines">
            {cart.map((l) => {
                const k = lineKey(l);
                const qty = Number(l.qty) || 0;
                const sentQty = Number(l.sent_qty) || (l.sent ? qty : 0);
                const paid = !!l.paidSaleId;
                const locked = paid;
                const mayRemove = !locked && (sentQty === 0 || canVoid);
                return (
                    <li key={k} className="foh-line" data-paid={paid ? '1' : '0'} data-sent={sentQty >= qty && qty > 0 ? '1' : '0'}>
                        <div className="foh-line-main">
                            <div className="foh-line-n">
                                <span className="foh-line-name">{l.name}</span>
                                {paid && <span className="foh-badge foh-badge-paid"><Check size={10} /> Paid</span>}
                                {!paid && sentQty > 0 && <span className="foh-badge">{sentQty >= qty ? 'Sent' : `${sentQty} sent`}</span>}
                            </div>
                            {Array.isArray(l.mods) && l.mods.length > 0 && (
                                <div className="foh-line-mods">
                                    {l.mods.map((m, i) => (
                                        <span key={`${m.id}-${i}`}>+ {m.name}{Number(m.price_delta) ? ` (${Number(m.price_delta) > 0 ? '+' : ''}${money(m.price_delta)})` : ''}</span>
                                    ))}
                                </div>
                            )}
                            {!locked && (
                                <div className="foh-line-note">
                                    <StickyNote size={12} aria-hidden="true" />
                                    <input value={l.notes || ''} onChange={(e) => onPatch(k, { notes: e.target.value })} placeholder="Note for the kitchen" aria-label={`Note for ${l.name}`} />
                                    {showCourse && (
                                        <select value={l.course || 1} onChange={(e) => onPatch(k, { course: Number(e.target.value) })} aria-label={`Course for ${l.name}`}>
                                            {[1, 2, 3, 4].map((c) => <option key={c} value={c}>Course {c}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="foh-line-side">
                            <span className="foh-line-total vq-num">{money((Number(l.original_price ?? l.price) || 0) * qty)}</span>
                            {!locked && (
                                <div className="foh-qty">
                                    <button type="button" aria-label={`One fewer ${l.name}`} onClick={() => onQty(k, qty - 1)} disabled={qty - 1 < sentQty && !canVoid && qty - 1 <= 0}><Minus size={13} /></button>
                                    <b className="vq-num">{qty}</b>
                                    <button type="button" aria-label={`One more ${l.name}`} onClick={() => onQty(k, qty + 1)}><Plus size={13} /></button>
                                    <button type="button" aria-label={`Remove ${l.name}`} onClick={() => onRemove(k)} disabled={!mayRemove} title={mayRemove ? 'Remove' : 'Already sent: a manager must void it'}><Trash2 size={13} /></button>
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
