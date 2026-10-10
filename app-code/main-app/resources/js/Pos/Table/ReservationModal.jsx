import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarClock, Users, Phone, Clock, X, Plus, UserCheck, Armchair, Hourglass } from 'lucide-react';

const BLANK = { customerName: '', phone: '', partySize: '2', reservedAt: '', positionId: '', isWaitlist: false, notes: '' };

/* Bookings and the walk-in waitlist, drawn with the same dialog parts as Seat / New order. */
export default function ReservationModal({ storeSlug, positions = [], onClose, onRefresh }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('list');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState(BLANK);
    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    const load = useCallback(async () => {
        setLoading(true);
        try { const { data } = await axios.get(r('store.reservations.list')); setReservations(data?.reservations || []); }
        catch { setError('Could not load bookings. Check the connection and try again.'); }
        finally { setLoading(false); }
    }, [r]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose?.(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);

    const act = async (fn) => { setError(''); try { await fn(); await load(); onRefresh?.(); } catch { setError('That did not go through. Try again.'); } };
    const create = async (e) => {
        e.preventDefault();
        if (!form.customerName.trim()) { setError('Add the guest name first.'); return; }
        setSaving(true); setError('');
        try {
            await axios.post(r('store.reservations.store'), {
                customer_name: form.customerName.trim(), phone: form.phone.trim() || null,
                party_size: Number(form.partySize) || 2, reserved_at: form.isWaitlist ? null : form.reservedAt || null,
                position_id: form.positionId ? Number(form.positionId) : null,
                status: form.isWaitlist ? 'waiting' : 'booked', notes: form.notes.trim() || null,
            });
            setForm(BLANK); setTab('list'); await load(); onRefresh?.();
        } catch { setError('Could not save this booking.'); }
        finally { setSaving(false); }
    };

    const active = reservations.filter((x) => x.status === 'booked' || x.status === 'waiting');
    return (
        <div className="vqt-modal-scrim" onMouseDown={onClose}>
            <div className="vqt-modal vqt-modal-wide bg-surface border border-line" role="dialog" aria-modal="true" aria-label="Bookings and waitlist" onMouseDown={(e) => e.stopPropagation()}>
                <header className="vqt-modal-h">
                    <span className="foh-dlg-ico"><CalendarClock size={16} /></span>
                    <div>
                        <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>Bookings and waitlist</h2>
                        <span className="foh-dlg-sub">{active.length} waiting or booked</span>
                    </div>
                    <button type="button" onClick={onClose} className="vqt-icon-btn" aria-label="Close"><X size={16} /></button>
                </header>
                <div className="foh-seg" role="tablist">
                    <button type="button" role="tab" aria-selected={tab === 'list'} data-on={tab === 'list' ? '1' : '0'} onClick={() => setTab('list')}>Queue <b className="vq-num">{active.length}</b></button>
                    <button type="button" role="tab" aria-selected={tab === 'new'} data-on={tab === 'new' ? '1' : '0'} onClick={() => setTab('new')}><Plus size={14} /> New booking</button>
                </div>
                {error && <p className="vqt-modal-err" role="alert">{error}</p>}
                {tab === 'new' ? (
                    <form onSubmit={create} className="contents">
                        <div className="vqt-modal-b foh-form">
                            <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Guest name</span>
                                <input className="vqt-input" autoFocus value={form.customerName} onChange={(e) => set({ customerName: e.target.value })} placeholder="Guest or company" /></label>
                            <div className="foh-form-row">
                                <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Phone</span>
                                    <input className="vqt-input vq-num" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Contact number" /></label>
                                <label className="vqt-field vqt-field-stacked foh-form-sm"><span className="vqt-field-l">Guests</span>
                                    <input className="vqt-input vq-num" type="number" min="1" value={form.partySize} onChange={(e) => set({ partySize: e.target.value })} /></label>
                            </div>
                            <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Table (optional)</span>
                                <select className="vqt-input" value={form.positionId} onChange={(e) => set({ positionId: e.target.value })}>
                                    <option value="">Any available table</option>
                                    {positions.map((p) => <option key={p.id} value={p.id}>{p.label || p.code} · {p.capacity} seats</option>)}
                                </select></label>
                            <label className="vqt-field vqt-field-inline"><input type="checkbox" checked={form.isWaitlist} onChange={(e) => set({ isWaitlist: e.target.checked })} />
                                <span className="vqt-field-l">Walk-in waitlist: the party is here now</span></label>
                            {!form.isWaitlist && <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Booking time</span>
                                <input className="vqt-input" type="datetime-local" value={form.reservedAt} onChange={(e) => set({ reservedAt: e.target.value })} /></label>}
                            <label className="vqt-field vqt-field-stacked"><span className="vqt-field-l">Notes</span>
                                <textarea className="vqt-input vqt-textarea" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="High chair, window seat, birthday" /></label>
                        </div>
                        <footer className="vqt-modal-f">
                            <button type="submit" className="vqt-btn vqt-btn-go" disabled={saving}>{saving ? 'Saving' : 'Save booking'}</button>
                            <button type="button" className="vqt-btn" onClick={() => setTab('list')}>Back</button>
                        </footer>
                    </form>
                ) : (
                    <div className="vqt-modal-b">
                        {loading ? <p className="foh-dlg-empty">Loading</p> : active.length === 0 ? (
                            <div className="foh-dlg-empty"><CalendarClock size={30} aria-hidden="true" /><p>Nobody is booked or waiting.</p>
                                <button type="button" className="vqt-btn vqt-btn-go" onClick={() => setTab('new')}><Plus size={15} /> New booking</button></div>
                        ) : <ul className="foh-resv">{active.map((x) => (
                            <li key={x.id} data-status={x.status}>
                                <div className="foh-resv-main">
                                    <p><b>{x.customer_name}</b><span className="foh-pill" data-tone={x.status === 'waiting' ? 'warn' : 'go'}>{x.status === 'waiting' ? <><Hourglass size={11} /> Waiting</> : 'Booked'}</span></p>
                                    <p className="foh-resv-meta">
                                        <span><Users size={13} /> {x.party_size}</span>
                                        {x.time_label && <span><Clock size={13} /> {x.time_label}</span>}
                                        {x.table_name && <span><Armchair size={13} /> {x.table_name}</span>}
                                        {x.phone && <span className="vq-num"><Phone size={13} /> {x.phone}</span>}
                                    </p>
                                    {x.notes && <p className="foh-resv-note">{x.notes}</p>}
                                </div>
                                <div className="foh-resv-act">
                                    <button type="button" className="vqt-btn vqt-btn-go" onClick={() => act(() => axios.post(r('store.reservations.seat', { id: x.id }), { position_id: x.position_id }))}><UserCheck size={15} /> Seat</button>
                                    <button type="button" className="vqt-icon-btn foh-resv-x" aria-label={`Cancel ${x.customer_name}`} onClick={() => act(() => axios.post(r('store.reservations.cancel', { id: x.id }), { status: 'cancelled' }))}><X size={16} /></button>
                                </div>
                            </li>))}</ul>}
                    </div>
                )}
            </div>
        </div>
    );
}
