import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarCheck, Check, Clock, Minus, Phone, Plus, Users } from 'lucide-react';

const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMin = (v) => { const [h, m] = String(v || '').split(':').map((x) => parseInt(x, 10) || 0); return h * 60 + m; };
const label = (min) => { const h = Math.floor(min / 60) % 24; const m = min % 60; return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`; };

/** Half-hour slots from opening until an hour before closing; the whole day when hours are not set. */
function slotsFor(date, hours) {
    const day = hours?.[KEYS[date.getDay()]];
    let from = 11 * 60; let to = 22 * 60; // sensible restaurant default when no hours are listed
    if (hours) {
        if (!day || !day.open || !day.close) return [];
        from = toMin(day.open); to = toMin(day.close);
        if (from === to) { from = 0; to = 24 * 60; }
        if (to < from) to += 24 * 60; // closes after midnight
        to -= 60;
    }
    const today = ymd(date) === ymd(new Date());
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes() + 30;
    const out = [];
    for (let t = Math.ceil(from / 30) * 30; t <= to; t += 30) {
        if (t >= 24 * 60) break; // a slot after midnight belongs to the next day
        if (today && t < nowMin) continue;
        out.push(t);
    }
    return out;
}

/**
 * "Book a table": date chips for the next two weeks, time slots from the opening hours, party size.
 * The request goes to the restaurant's host stand; they call to confirm.
 */
export default function ReserveTable({ store, preview, customer }) {
    const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d; }), []);
    const [dayIdx, setDayIdx] = useState(0);
    const date = days[dayIdx];
    const slots = useMemo(() => slotsFor(date, store.opening_hours), [date, store.opening_hours]);
    const [time, setTime] = useState(null);
    const [party, setParty] = useState(2);
    const [form, setForm] = useState({ customer_name: customer?.name || '', customer_phone: customer?.phone || '', note: '', company_site: '' });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const [done, setDone] = useState(null);
    const chosen = slots.includes(time) ? time : null;
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const ok = chosen !== null && form.customer_name.trim() && form.customer_phone.trim() && !busy && !preview;

    const submit = async (e) => {
        e.preventDefault();
        if (!ok) return;
        setBusy(true); setErr(null);
        try {
            const r = await axios.post(`/shop/${store.slug}/reserve`, { ...form, party_size: party, date: ymd(date), time: `${pad(Math.floor(chosen / 60))}:${pad(chosen % 60)}` });
            setDone(r.data);
        } catch (x) {
            const d = x.response?.data;
            setErr(d?.message || (d?.errors && Object.values(d.errors)[0]?.[0]) || 'We could not send your request. Please try again or call us.');
        } finally { setBusy(false); }
    };

    if (done) {
        return (
            <div className="vqsf-reserve vqsf-reserve--done">
                <span className="ok"><Check size={22} strokeWidth={2.6} /></span>
                <h3>Table requested</h3>
                <p><b>{done.when}</b> · {party} {party === 1 ? 'guest' : 'guests'}</p>
                <p className="muted">{done.message}</p>
                <small>Reference {done.reference}</small>
                <button type="button" className="vqsf-btn vqsf-btn--md vqsf-btn--line" onClick={() => { setDone(null); setTime(null); }}>Book another</button>
            </div>
        );
    }

    return (
        <form className="vqsf-reserve" onSubmit={submit}>
            <div className="vqsf-reserve-h"><CalendarCheck size={16} />Choose a day</div>
            <div className="vqsf-days" role="group" aria-label="Day">
                {days.map((d, i) => {
                    const closed = store.opening_hours && slotsFor(d, store.opening_hours).length === 0 && i > 0;
                    return (
                        <button key={i} type="button" className={`vqsf-day ${i === dayIdx ? 'on' : ''}`} disabled={closed} aria-pressed={i === dayIdx} onClick={() => { setDayIdx(i); setTime(null); }}>
                            <small>{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' })}</small>
                            <b>{d.getDate()}</b>
                            <small>{closed ? 'Closed' : d.toLocaleDateString('en-GB', { month: 'short' })}</small>
                        </button>
                    );
                })}
            </div>

            <div className="vqsf-reserve-h"><Clock size={16} />Time</div>
            {slots.length ? (
                <div className="vqsf-slots" role="group" aria-label="Time">
                    {slots.map((t) => <button key={t} type="button" className={`vqsf-slot ${chosen === t ? 'on' : ''}`} aria-pressed={chosen === t} onClick={() => setTime(t)}>{label(t)}</button>)}
                </div>
            ) : <p className="vqsf-reserve-none">{dayIdx === 0 ? 'No more tables can be booked today — try tomorrow.' : 'We are closed on this day.'}</p>}

            <div className="vqsf-reserve-row">
                <div>
                    <div className="vqsf-reserve-h"><Users size={16} />Guests</div>
                    <span className="vqsf-step vqsf-step--lg">
                        <button type="button" aria-label="Fewer guests" disabled={party <= 1} onClick={() => setParty((p) => p - 1)}><Minus size={15} strokeWidth={2.4} /></button>
                        <span aria-live="polite">{party}</span>
                        <button type="button" aria-label="More guests" disabled={party >= 30} onClick={() => setParty((p) => p + 1)}><Plus size={15} strokeWidth={2.4} /></button>
                    </span>
                </div>
                {party >= 12 && store.phone && <p className="vqsf-hint" style={{ alignSelf: 'end' }}>Large group? <a href={`tel:${store.phone}`}>Call us</a> and we will set the room.</p>}
            </div>

            <div className="vqsf-reserve-fields">
                <label className="vqsf-lbl"><span>Name</span><input className="vqsf-input" value={form.customer_name} onChange={set('customer_name')} autoComplete="name" required maxLength={120} /></label>
                <label className="vqsf-lbl"><span>Phone</span><input className="vqsf-input" value={form.customer_phone} onChange={set('customer_phone')} inputMode="tel" autoComplete="tel" required maxLength={40} /></label>
            </div>
            <label className="vqsf-lbl"><span>Anything we should know? (optional)</span><input className="vqsf-input" value={form.note} onChange={set('note')} maxLength={300} placeholder="Birthday, high chair, window seat…" /></label>
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.company_site} onChange={set('company_site')} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />

            {err && <p className="vqsf-err" role="alert">{err}</p>}
            {preview && <p className="vqsf-hint">Preview — table requests work once the store is published.</p>}
            <button type="submit" className="vqsf-btn vqsf-btn--accent vqsf-btn--block" style={{ marginTop: 18 }} disabled={!ok}>
                {busy ? 'Sending…' : chosen !== null ? `Request a table · ${label(chosen)}` : 'Pick a time'}
            </button>
            <p className="vqsf-fine">{store.name} confirms every booking{store.phone ? <> — or call <a href={`tel:${store.phone}`}><Phone size={11} style={{ verticalAlign: '-1px' }} /> {store.phone}</a></> : ''}.</p>
        </form>
    );
}
