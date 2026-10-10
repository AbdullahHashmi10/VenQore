import React, { useState } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Alert, Btn, Field } from '@/Components/Commerce/shop';

/** Public booking request: pick a service and a time. The business confirms; nothing is promised here. */
export default function Book({ store, services = [], submit_url, min_date }) {
    const [form, setForm] = useState({ customer_name: '', customer_phone: '', service_id: '', date: min_date, time: '10:00', address: '', note: '', company_site: '' });
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const [done, setDone] = useState(null);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const sym = store.currency_symbol || '';

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true); setNotice(null);
        try {
            const r = await axios.post(submit_url, { ...form, service_id: form.service_id || null });
            setDone(r.data);
        } catch (err) {
            const d = err.response?.data;
            setNotice(d?.message || (d?.errors && Object.values(d.errors)[0]?.[0]) || 'We could not send your request. Please try again.');
        } finally { setBusy(false); }
    };

    return (
        <PublicShell title={`Book with ${store.name}`}>
            <Head title={`Book with ${store.name}`}><meta name="robots" content="noindex,nofollow" /></Head>
            <div className="vqs-card vqs-pad" style={{ maxWidth: 520, margin: '24px auto' }}>
                <h1 style={{ marginTop: 0 }}>Book with {store.name}</h1>
                {done ? (
                    <>
                        <Alert kind="success">{done.message}</Alert>
                        <p className="vqs-muted">Your reference is <strong>{done.reference}</strong>. {store.phone ? <>Questions? Call <a href={`tel:${store.phone}`}>{store.phone}</a>.</> : null}</p>
                    </>
                ) : (
                    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
                        <p className="vqs-muted" style={{ margin: 0 }}>Tell us what you need and when. This is a request: we will confirm your time.</p>
                        {services.length > 0 && (
                            <Field label="Service">
                                <select className="vqs-input" value={form.service_id} onChange={set('service_id')}>
                                    <option value="">Not sure / something else</option>
                                    {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price > 0 ? ` - ${sym} ${s.price}` : ''}</option>)}
                                </select>
                            </Field>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Field label="Preferred date"><input className="vqs-input" type="date" min={min_date} value={form.date} onChange={set('date')} required /></Field>
                            <Field label="Preferred time"><input className="vqs-input" type="time" value={form.time} onChange={set('time')} required /></Field>
                        </div>
                        <Field label="Your name"><input className="vqs-input" value={form.customer_name} onChange={set('customer_name')} autoComplete="name" required /></Field>
                        <Field label="Phone number"><input className="vqs-input" value={form.customer_phone} onChange={set('customer_phone')} inputMode="tel" autoComplete="tel" required /></Field>
                        <Field label="Address (if we come to you)"><input className="vqs-input" value={form.address} onChange={set('address')} autoComplete="street-address" /></Field>
                        <Field label="Anything we should know?"><textarea className="vqs-input" rows={3} value={form.note} onChange={set('note')} /></Field>
                        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.company_site} onChange={set('company_site')} style={{ position: 'absolute', left: '-9999px' }} />
                        {notice && <Alert kind="error">{notice}</Alert>}
                        <Btn type="submit" disabled={busy || !form.customer_name || !form.customer_phone}>{busy ? 'Sending…' : 'Request this time'}</Btn>
                    </form>
                )}
            </div>
        </PublicShell>
    );
}
