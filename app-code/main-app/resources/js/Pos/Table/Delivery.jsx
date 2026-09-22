/* ==========================================================================
   DELIVERY — everything about the order that is not the food
   ==========================================================================
   A takeaway ticket needs a name to call across a counter. A delivery ticket
   needs an address somebody can find in the dark, an instruction for the door,
   a fare, a rider, and a promise about when.

   All of that used to go into the ticket's single free-text `note`. Which
   meant the address could not be searched, the delivery fee was never charged,
   the rider was remembered by whoever took the call, and "where is my order"
   could only be answered by the one person holding the phone.

   THREE PIECES, USED IN TWO PLACES
   --------------------------------
   `AddressPicker`, `RiderPicker` and `DeliveryFields` are the form, shared by the new-ticket
   dialog and the live panel — a field that exists when you open a ticket and
   not when you edit it is how a ticket ends up with a rider and no address.

   `DeliveryPanel` is the live one: the status a dispatcher moves, and the
   clock that starts when they move it.
   ========================================================================== */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Bike, MapPin, Phone, User, StickyNote, Wallet, Timer,
    Search, Check, ChefHat, PackageCheck, Loader2, Share2, Copy, CreditCard,
} from 'lucide-react';

/* The journey, in order. Four and not nine: every state a counter does not
   actually press becomes a lie on the floor within a week. */
export const DELIVERY_STATES = ['placed', 'preparing', 'out', 'delivered'];

export const DELIVERY_META = {
    placed:    { label: 'Placed',     short: 'Placed',    icon: StickyNote,   tone: 'idle' },
    preparing: { label: 'Preparing',  short: 'Cooking',   icon: ChefHat,      tone: 'work' },
    out:       { label: 'On the way', short: 'On the way', icon: Bike,        tone: 'live' },
    delivered: { label: 'Delivered',  short: 'Delivered', icon: PackageCheck, tone: 'done' },
};

/* How long it has been in this state. The minute is the unit that matters —
   nobody dispatches on seconds, and an hour is already a complaint. */
export function sinceMinutes(iso) {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

export function elapsedLabel(iso) {
    const m = sinceMinutes(iso);
    if (m === null) return '';
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/* An order is LATE when it has been on the road longer than it was promised.
   Derived, never stored: a promise and a stopwatch are the only two facts, and
   a stored "is_late" is a value somebody has to keep true. */
export function isLate(delivery) {
    if (!delivery || delivery.status !== 'out') return false;
    const eta = Number(delivery.eta_minutes);
    if (!eta) return false;
    const m = sinceMinutes(delivery.status_at);
    return m !== null && m > eta;
}

/* ── The status chip, for a floor card ───────────────────────────────────
   Small enough to sit on a tile among six others, and it carries the clock,
   because a status with no duration on a dispatch screen is decoration. */
export function DeliveryChip({ delivery, compact = false }) {
    if (!delivery) return null;
    const meta = DELIVERY_META[delivery.status] || DELIVERY_META.placed;
    const Icon = meta.icon;
    const late = isLate(delivery);

    return (
        <span
            className="vqd-chip"
            data-tone={meta.tone}
            data-late={late ? '1' : '0'}
            title={late
                ? `${meta.label} — ${elapsedLabel(delivery.status_at)}, past the ${delivery.eta_minutes} minute estimate`
                : `${meta.label} — ${elapsedLabel(delivery.status_at)}`}
        >
            <Icon size={12} aria-hidden="true" />
            {!compact && <span>{meta.short}</span>}
            <b className="vq-num">{elapsedLabel(delivery.status_at)}</b>
        </span>
    );
}

/* ── Finding somebody you have delivered to before ─────────────────────── */
export function AddressPicker({ storeSlug, value, onPick }) {
    const [q, setQ] = useState(value || '');
    const [matches, setMatches] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);
    const box = useRef(null);

    useEffect(() => {
        clearTimeout(timer.current);
        if (q.trim().length < 2) { setMatches([]); setLoading(false); return undefined; }
        setLoading(true);
        timer.current = setTimeout(async () => {
            try {
                const { data } = await axios.get(
                    route('store.tables.address-book', { store_slug: storeSlug }),
                    { params: { q: q.trim() } },
                );
                setMatches(data?.matches || []);
                setOpen(true);
            } catch (_) {
                setMatches([]);
            } finally {
                setLoading(false);
            }
        }, 260);
        return () => clearTimeout(timer.current);
    }, [q, storeSlug]);

    useEffect(() => {
        const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', away);
        return () => document.removeEventListener('mousedown', away);
    }, []);

    return (
        <div className="vqd-picker" ref={box}>
            <label className="vqt-field vqt-field-stacked">
                <span className="vqt-field-l">
                    <Search size={12} aria-hidden="true" /> Find a customer
                </span>
                <div className="vqd-picker-input">
                    <input
                        className="vqt-input"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onFocus={() => matches.length && setOpen(true)}
                        placeholder="Name or phone — picks up their saved address"
                        autoComplete="off"
                    />
                    {loading && <Loader2 size={14} className="vqd-picker-spin" aria-hidden="true" />}
                </div>
            </label>

            {open && matches.length > 0 && (
                <ul className="vqd-picker-list" role="listbox">
                    {matches.map((m, i) => (
                        <li key={`${m.party_id || 'r'}-${i}`}>
                            <button
                                type="button"
                                className="vqd-picker-row"
                                onClick={() => { onPick?.(m); setOpen(false); setQ(m.name || m.phone || ''); }}
                            >
                                <span className="vqd-picker-who">
                                    <b>{m.name || 'No name'}</b>
                                    {m.phone && <span className="vq-num">{m.phone}</span>}
                                    {m.source === 'recent' && <em>previous order</em>}
                                </span>
                                {m.address && <span className="vqd-picker-addr">{m.address}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ── Rider Picker (Real staff records with live order count) ──────────── */
export function RiderPicker({ storeSlug, riderName, riderId, onSelect }) {
    const [riders, setRiders] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const box = useRef(null);

    const loadRiders = async () => {
        if (!storeSlug) return;
        setLoading(true);
        try {
            const { data } = await axios.get(route('store.riders.list', { store_slug: storeSlug }));
            setRiders(data?.riders || []);
        } catch (_) {
            setRiders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', away);
        return () => document.removeEventListener('mousedown', away);
    }, []);

    return (
        <div className="vqd-picker" ref={box} style={{ position: 'relative' }}>
            <label className="vqt-field vqt-field-stacked">
                <span className="vqt-field-l"><Bike size={12} aria-hidden="true" /> Rider</span>
                <div className="vqd-picker-input">
                    <input
                        className="vqt-input"
                        value={riderName || ''}
                        onChange={(e) => onSelect({ id: null, name: e.target.value })}
                        onFocus={() => { loadRiders(); setOpen(true); }}
                        placeholder="Select rider or type name"
                        autoComplete="off"
                    />
                    {loading && <Loader2 size={14} className="vqd-picker-spin" aria-hidden="true" />}
                </div>
            </label>

            {open && riders.length > 0 && (
                <ul className="vqd-picker-list" role="listbox" style={{ zIndex: 100 }}>
                    {riders.map((r) => (
                        <li key={r.id}>
                            <button
                                type="button"
                                className="vqd-picker-row"
                                onClick={() => {
                                    onSelect({ id: r.id, name: r.name });
                                    setOpen(false);
                                }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span className="vqd-picker-who">
                                    <b>{r.name}</b>
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: r.live_count > 0 ? 'rgba(234,88,12,0.15)' : 'rgba(16,185,129,0.15)',
                                    color: r.live_count > 0 ? '#ea580c' : '#10b981',
                                }}>
                                    {r.live_count > 0 ? `${r.live_count} out` : 'Available'}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ── The delivery-only part of a ticket form ───────────────────────────── */
export function DeliveryFields({ v, set, showRider = true, storeSlug = null }) {
    return (
        <>
            <label className="vqt-field vqt-field-stacked">
                <span className="vqt-field-l"><MapPin size={12} aria-hidden="true" /> Address</span>
                <textarea
                    className="vqt-input vqt-textarea"
                    value={v.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Street, building, floor — whatever gets a stranger to the door"
                    rows={3}
                />
            </label>

            <label className="vqt-field vqt-field-stacked">
                <span className="vqt-field-l"><StickyNote size={12} aria-hidden="true" /> Delivery instructions</span>
                <textarea
                    className="vqt-input vqt-textarea"
                    value={v.deliveryNote}
                    onChange={(e) => set('deliveryNote', e.target.value)}
                    placeholder="Gate code, “call on arrival”, “leave with the guard”"
                    rows={2}
                />
            </label>

            <div className="vqd-row3">
                <label className="vqt-field vqt-field-stacked">
                    <span className="vqt-field-l"><Wallet size={12} aria-hidden="true" /> Delivery fee</span>
                    <input
                        className="vqt-input vq-num"
                        value={v.deliveryFee}
                        onChange={(e) => set('deliveryFee', e.target.value.replace(/[^\d.]/g, ''))}
                        placeholder="0"
                        inputMode="decimal"
                    />
                </label>

                <label className="vqt-field vqt-field-stacked">
                    <span className="vqt-field-l"><Timer size={12} aria-hidden="true" /> Promised in</span>
                    <div className="vqd-eta">
                        <input
                            className="vqt-input vq-num"
                            value={v.etaMinutes}
                            onChange={(e) => set('etaMinutes', e.target.value.replace(/[^\d]/g, ''))}
                            placeholder="30"
                            inputMode="numeric"
                        />
                        <span className="vqd-eta-unit">min</span>
                    </div>
                </label>

                {showRider && (
                    <RiderPicker
                        storeSlug={storeSlug}
                        riderName={v.rider}
                        riderId={v.riderId}
                        onSelect={({ id, name }) => {
                            set('rider', name);
                            set('riderId', id);
                        }}
                    />
                )}
            </div>

            <div className="vqd-quick">
                <span className="vqd-quick-l">Quick ETA</span>
                {[15, 30, 45, 60].map(n => (
                    <button
                        key={n}
                        type="button"
                        className="vqd-quick-b"
                        data-on={String(n) === String(v.etaMinutes) ? '1' : '0'}
                        onClick={() => set('etaMinutes', String(n))}
                    >
                        {n} min
                    </button>
                ))}
            </div>

            <div className="vqd-quick" style={{ marginTop: '8px' }}>
                <span className="vqd-quick-l"><CreditCard size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Payment</span>
                {['cash', 'card', 'online', 'prepaid'].map(pm => (
                    <button
                        key={pm}
                        type="button"
                        className="vqd-quick-b"
                        data-on={(v.paymentMethod || 'cash') === pm ? '1' : '0'}
                        onClick={() => set('paymentMethod', pm)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {pm}
                    </button>
                ))}
            </div>
        </>
    );
}

/* ── The live panel, for a delivery that is already open ───────────────── */
export function DeliveryPanel({ ticket, onUpdate, onError, money, storeSlug }) {
    const delivery = ticket?.delivery;
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(id);
    }, []);

    const [form, setForm] = useState(() => ({
        address: ticket?.address || '',
        deliveryNote: delivery?.note || '',
        deliveryFee: delivery?.fee ? String(delivery.fee) : '',
        etaMinutes: delivery?.eta_minutes ? String(delivery.eta_minutes) : '',
        rider: delivery?.rider || '',
        riderId: delivery?.rider_id || null,
        paymentMethod: delivery?.payment_method || 'cash',
        collectedAmount: delivery?.collected_amount ? String(delivery.collected_amount) : '',
    }));

    const seededFor = useRef(ticket?.occupancy_id);
    useEffect(() => {
        if (seededFor.current === ticket?.occupancy_id) return;
        seededFor.current = ticket?.occupancy_id;
        setEditing(false);
        setForm({
            address: ticket?.address || '',
            deliveryNote: ticket?.delivery?.note || '',
            deliveryFee: ticket?.delivery?.fee ? String(ticket.delivery.fee) : '',
            etaMinutes: ticket?.delivery?.eta_minutes ? String(ticket.delivery.eta_minutes) : '',
            rider: ticket?.delivery?.rider || '',
            riderId: ticket?.delivery?.rider_id || null,
            paymentMethod: ticket?.delivery?.payment_method || 'cash',
            collectedAmount: ticket?.delivery?.collected_amount ? String(ticket.delivery.collected_amount) : '',
        });
    }, [ticket?.occupancy_id]);

    const set = useCallback((k, val) => setForm(f => ({ ...f, [k]: val })), []);

    const push = useCallback(async (patch) => {
        if (!ticket?.occupancy_id || !onUpdate) return;
        setSaving(true);
        try {
            await onUpdate(ticket.occupancy_id, patch);
        } catch (e) {
            onError?.(e?.response?.data?.message || 'That delivery could not be updated.');
        } finally {
            setSaving(false);
        }
    }, [ticket?.occupancy_id, onUpdate, onError]);

    const copyTrackingLink = () => {
        if (!delivery?.tracking_token) return;
        const url = `${window.location.origin}/track/${delivery.tracking_token}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (!ticket || !delivery) return null;

    const late = isLate(delivery);
    const activeIdx = DELIVERY_STATES.indexOf(delivery.status);

    return (
        <section className="vqd-panel" data-late={late ? '1' : '0'}>
            <header className="vqd-panel-h">
                <Bike size={14} aria-hidden="true" />
                <b>Delivery</b>
                <span className="vq-num vqd-panel-code">{ticket.code}</span>
                <DeliveryChip delivery={delivery} />
            </header>

            <div className="vqd-ladder" role="group" aria-label="Delivery status">
                {DELIVERY_STATES.map((st, i) => {
                    const meta = DELIVERY_META[st];
                    const Icon = meta.icon;
                    return (
                        <button
                            key={st}
                            type="button"
                            className="vqd-step"
                            data-on={st === delivery.status ? '1' : '0'}
                            data-past={i < activeIdx ? '1' : '0'}
                            disabled={saving}
                            onClick={() => push({ status: st })}
                            aria-pressed={st === delivery.status}
                        >
                            <Icon size={14} aria-hidden="true" />
                            <span>{meta.label}</span>
                        </button>
                    );
                })}
            </div>

            {late && (
                <p className="vqd-late">
                    Past the {delivery.eta_minutes} minute promise by{' '}
                    <b className="vq-num">{sinceMinutes(delivery.status_at) - delivery.eta_minutes}m</b>.
                </p>
            )}

            {!editing ? (
                <div className="vqd-read">
                    <dl>
                        {ticket.customer_name && (
                            <div><dt><User size={11} /> Name</dt><dd>{ticket.customer_name}</dd></div>
                        )}
                        {ticket.phone && (
                            <div><dt><Phone size={11} /> Phone</dt><dd className="vq-num">{ticket.phone}</dd></div>
                        )}
                        {ticket.address && (
                            <div><dt><MapPin size={11} /> Address</dt><dd>{ticket.address}</dd></div>
                        )}
                        {delivery.note && (
                            <div><dt><StickyNote size={11} /> Instructions</dt><dd>{delivery.note}</dd></div>
                        )}
                        {delivery.rider && (
                            <div><dt><Bike size={11} /> Rider</dt><dd>{delivery.rider}</dd></div>
                        )}
                        {Number(delivery.fee) > 0 && (
                            <div><dt><Wallet size={11} /> Fee</dt><dd className="vq-num">{money ? money(delivery.fee) : delivery.fee}</dd></div>
                        )}
                        <div>
                            <dt><CreditCard size={11} /> Pay Method</dt>
                            <dd style={{ textTransform: 'capitalize' }}>{delivery.payment_method || 'Cash'}</dd>
                        </div>
                    </dl>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="button" className="vqt-btn" onClick={() => setEditing(true)}>
                            Edit details
                        </button>
                        {delivery.tracking_token && (
                            <button
                                type="button"
                                className="vqt-btn"
                                onClick={copyTrackingLink}
                                title="Copy public customer tracking link"
                            >
                                {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                {copied ? 'Link Copied!' : 'Tracking Link'}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="vqd-edit">
                    <DeliveryFields v={form} set={set} storeSlug={storeSlug} />
                    <div className="vqd-edit-f">
                        <button type="button" className="vqt-btn" onClick={() => setEditing(false)}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="vqt-btn vqt-btn-go"
                            disabled={saving}
                            onClick={async () => {
                                await push({
                                    address: form.address,
                                    note: form.deliveryNote,
                                    fee: form.deliveryFee === '' ? 0 : Number(form.deliveryFee),
                                    eta_minutes: form.etaMinutes === '' ? null : Number(form.etaMinutes),
                                    rider: form.rider,
                                    rider_id: form.riderId,
                                    payment_method: form.paymentMethod,
                                });
                                setEditing(false);
                            }}
                        >
                            <Check size={15} /> Save
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default DeliveryPanel;
