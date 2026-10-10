import React, { useEffect, useState } from 'react';
import { Globe, Phone, MapPin, StickyNote, Clock, Check, X, ChefHat, PackageCheck, Bike, Banknote, ArrowLeft } from 'lucide-react';
import { cookWord } from '@/Pos/Table/kitchenWord';

/* The one place that names an online order's stage, so the queue, overview and pane agree. */
export const onlineStage = (o, kitchen = true) => {
    const cook = kitchen ? 'Cooking' : 'Preparing';
    switch (o.status) {
        case 'pending': return { text: 'New · accept', tone: 'warn' };
        case 'confirmed': return { text: 'Accepted', tone: 'quiet' };
        case 'preparing': return { text: cook, tone: 'quiet' };
        case 'ready': return { text: 'Ready to collect', tone: 'go' };
        case 'out_for_delivery': return { text: 'Out for delivery', tone: 'go' };
        default: return { text: o.status, tone: 'quiet' };
    }
};

const useTick = (ms = 1000) => { const [n, set] = useState(() => Date.now()); useEffect(() => { const i = setInterval(() => set(Date.now()), ms); return () => clearInterval(i); }, [ms]); return n; };
export const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${String(s % 60).padStart(2, '0')}`; };

export default function OnlineOrderPane({ order, money, busy, kitchen = true, canEdit = true, canFinish = true, onAct, onBack }) {
    const now = useTick();
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');
    useEffect(() => { setRejecting(false); setReason(''); }, [order?.id]);
    if (!order) return null;
    const stage = onlineStage(order, kitchen);
    const age = now - new Date(order.created_at).getTime();
    const left = order.accept_by ? new Date(order.accept_by).getTime() - now : null;
    const isDelivery = order.fulfilment === 'delivery';
    const paid = order.payment_status === 'collected';
    const go = (action, extra) => onAct(order, action, extra);
    /* No kitchen on this device's menu: skip the "preparing" stop and go straight to ready. */
    const finishPrep = async () => { if (order.status === 'confirmed' && !kitchen) { if (!(await go('preparing'))) return; } go(isDelivery ? 'out_for_delivery' : 'ready'); };

    return (
        <section className="vq-pane foh-online-pane bg-surface border border-line" aria-label={`Online order ${order.number}`}>
            <header className="vq-pane-h">
                <button type="button" className="foh-online-back" onClick={onBack} aria-label="Back to the list"><ArrowLeft size={16} /></button>
                <Globe size={15} aria-hidden="true" /><span>Online order {order.number}</span>
                <span className="foh-pill ml-auto" data-tone={stage.tone}>{stage.text}</span>
            </header>
            <div className="vq-pane-body foh-online-body">
                <div className="foh-online-top">
                    <div>
                        <h2>{order.customer_name || 'Online customer'}</h2>
                        <p className="foh-online-meta">
                            <span className="vq-num"><Clock size={13} /> placed {clock(age)} ago</span>
                            <span>{isDelivery ? <><Bike size={13} /> Delivery</> : <><PackageCheck size={13} /> Pickup</>}</span>
                            <span>{paid ? 'Paid online' : order.payment_method === 'bank_transfer' ? 'Bank transfer' : 'Pay on arrival'}</span>
                        </p>
                    </div>
                    {order.status === 'pending' && left !== null && <div className="foh-online-timer" data-late={left < 60000 ? '1' : '0'}><b className="vq-num">{left > 0 ? clock(left) : 'Late'}</b><span>to accept</span></div>}
                </div>
                {order.phone && <a className="foh-online-row" href={`tel:${order.phone}`}><Phone size={15} /><span className="vq-num">{order.phone}</span></a>}
                {isDelivery && order.address && <p className="foh-online-row"><MapPin size={15} /><span>{order.address}</span></p>}
                {order.note && <p className="foh-online-row foh-online-note"><StickyNote size={15} /><span>{order.note}</span></p>}
                <ul className="foh-online-lines">
                    {order.items.map((i, k) => <li key={k}><b className="vq-num">{i.qty}×</b><span>{i.title}</span><i className="vq-num">{money(i.total)}</i></li>)}
                    {order.delivery_fee > 0 && <li className="foh-online-fee"><b /><span>Delivery fee</span><i className="vq-num">{money(order.delivery_fee)}</i></li>}
                </ul>
                <div className="foh-online-total"><span>Total</span><b className="vq-num">{money(order.total)}</b></div>
                {order.revision_status === 'proposed' && <p className="foh-online-row foh-online-note"><span>Waiting for the customer to answer your changes.</span></p>}
            </div>
            {canEdit && (
                <footer className="foh-online-actions">
                    {order.status === 'pending' && !rejecting && <>
                        <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={() => go('accept')}><Check size={16} /> Accept order</button>
                        <button type="button" className="vqt-btn" disabled={busy} onClick={() => setRejecting(true)}><X size={16} /> Reject</button>
                    </>}
                    {order.status === 'pending' && rejecting && <div className="foh-online-reject">
                        <input className="vqt-input" autoFocus placeholder="Tell the customer why (sold out, closing early)" value={reason} onChange={(e) => setReason(e.target.value)} />
                        <button type="button" className="vqt-btn vqt-btn-go" disabled={busy || !reason.trim()} onClick={() => go('reject', { reason: reason.trim() })}>Send rejection</button>
                        <button type="button" className="vqt-btn" onClick={() => setRejecting(false)}>Back</button>
                    </div>}
                    {order.status === 'confirmed' && kitchen && <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={() => go('preparing')}><ChefHat size={16} /> Start cooking</button>}
                    {order.status === 'confirmed' && !kitchen && <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={finishPrep}><PackageCheck size={16} /> {isDelivery ? 'Packed · send out' : 'Packed · ready'}</button>}
                    {order.status === 'preparing' && <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={finishPrep}>{isDelivery ? <><Bike size={16} /> Send out for delivery</> : <><PackageCheck size={16} /> {cookWord() === 'Cooking' ? 'Cooked · ready' : 'Ready for pickup'}</>}</button>}
                    {(order.status === 'ready' || order.status === 'out_for_delivery') && canFinish && <>
                        {paid
                            ? <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={() => go('complete')}><Check size={16} /> {isDelivery ? 'Delivered' : 'Handed over'}</button>
                            : <>
                                <button type="button" className="vqt-btn vqt-btn-go" disabled={busy} onClick={() => go('complete', { collect_now: true })}><Banknote size={16} /> Cash received · {isDelivery ? 'delivered' : 'handed over'}</button>
                                <button type="button" className="vqt-btn" disabled={busy} onClick={() => go('complete')}>Complete, collect later</button>
                            </>}
                    </>}
                </footer>
            )}
        </section>
    );
}
