import React, { useState } from 'react';
import { ChevronLeft, Users, Minus, Plus, Clock, Utensils, ShoppingBag, Bike, Send, ReceiptText, Split as SplitIcon, ArrowLeftRight, X, Repeat } from 'lucide-react';

const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };
const TYPE_LABEL = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

/**
 * The strip above an order: what it is, who is at it, and the things you can do
 * to the ORDER that are not "take money". `Change to...` is the interlinking:
 * the order keeps its lines and kitchen tickets when it moves between dine-in,
 * takeaway and delivery.
 */
export default function OrderHeader({
    card, covers, unsent, busy, elapsedLabel, checkDropped, enabledTypes,
    onBack, onCovers, onFire, onBill, onSplit, onMove, onClose, onConvert, canDiscard = true, kitchen = true,
}) {
    const [menu, setMenu] = useState(false);
    const type = card.order_type || (card.kind === 'ticket' ? 'takeaway' : 'dine_in');
    const Icon = TYPE_ICON[type] || Utensils;
    const isTable = card.kind !== 'ticket';
    const targets = ['dine_in', 'takeaway', 'delivery'].filter((t) => t !== type && enabledTypes.includes(t));

    return (
        <div className="vqt-strip foh-strip" data-compact="0">
            <button type="button" className="vqt-back" onClick={onBack} title="Back to the list">
                <ChevronLeft size={16} aria-hidden="true" />
                <span className="vqt-back-code">{card.code}</span>
            </button>

            <span className="vqt-strip-read">
                {isTable && (
                    <span className="vqt-chip" title="Covers">
                        <Users size={12} aria-hidden="true" />
                        <button type="button" onClick={() => onCovers(Math.max(1, covers - 1))} aria-label="One fewer cover"><Minus size={11} /></button>
                        <b className="vq-num">{covers}</b>
                        <button type="button" onClick={() => onCovers(Math.min(99, covers + 1))} aria-label="One more cover"><Plus size={11} /></button>
                    </span>
                )}

                <span className="foh-menu-wrap">
                    <button type="button" className="vqt-chip vqt-chip-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} title="Change the order type">
                        <Icon size={12} aria-hidden="true" />
                        {TYPE_LABEL[type]}
                        <Repeat size={11} aria-hidden="true" />
                    </button>
                    {menu && (
                        <div className="foh-menu" role="menu">
                            <div className="foh-menu-h">Change to…</div>
                            {targets.map((t) => {
                                const I = TYPE_ICON[t];
                                return (
                                    <button key={t} type="button" role="menuitem" onClick={() => { setMenu(false); onConvert(t); }}>
                                        <I size={14} aria-hidden="true" /> {TYPE_LABEL[t]}
                                    </button>
                                );
                            })}
                            {targets.length === 0 && <div className="foh-menu-n">No other order type is switched on.</div>}
                        </div>
                    )}
                </span>

                {elapsedLabel && (
                    <span className="vqt-chip vqt-chip-quiet" title="Open for"><Clock size={12} aria-hidden="true" />{elapsedLabel}</span>
                )}
            </span>

            <span className="vqt-strip-acts">
                {kitchen && <button type="button" className="vqt-act" data-primary={unsent > 0 ? '1' : '0'} onClick={onFire} disabled={busy || unsent === 0}
                    title={unsent ? `Send ${unsent} new item${unsent === 1 ? '' : 's'} to the kitchen` : 'Everything has been sent'}>
                    <Send size={14} aria-hidden="true" /><span className="vqt-act-l">Fire</span>
                    {unsent > 0 && <span className="vqt-act-n vq-num">{unsent}</span>}
                </button>}
                <button type="button" className="vqt-act" data-on={checkDropped ? '1' : '0'} onClick={onBill} disabled={busy}
                    title={checkDropped ? 'Bill already dropped: tap to undo' : 'Print the bill and start the pay clock'}>
                    <ReceiptText size={14} aria-hidden="true" /><span className="vqt-act-l">Bill</span>
                </button>
                {isTable && (
                    <>
                        <button type="button" className="vqt-act" onClick={onSplit} disabled={busy} title="Split the bill">
                            <SplitIcon size={14} aria-hidden="true" /><span className="vqt-act-l">Split</span>
                        </button>
                        <button type="button" className="vqt-act" onClick={onMove} disabled={busy} title="Move or merge this table">
                            <ArrowLeftRight size={14} aria-hidden="true" /><span className="vqt-act-l">Move</span>
                        </button>
                    </>
                )}
                {canDiscard && (
                    <button type="button" className="vqt-act vqt-act-danger" onClick={onClose} disabled={busy} title="Close or discard this order">
                        <X size={14} aria-hidden="true" /><span className="vqt-act-l">Close</span>
                    </button>
                )}
            </span>
        </div>
    );
}
