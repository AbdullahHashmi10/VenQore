import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Alert, Btn, Field } from '@/Components/Commerce/shop';

/** Lost status link: order number + the phone used at checkout opens the order again. */
export default function OrderLookup() {
    const f = useForm({ number: '', phone: '' });
    return (
        <PublicShell title="Find my order">
            <Head title="Find my order"><meta name="robots" content="noindex,nofollow" /></Head>
            <div className="vqs-card vqs-pad" style={{ maxWidth: 480, margin: '24px auto' }}>
                <h1 style={{ marginTop: 0 }}>Find my order</h1>
                <p className="vqs-muted">Enter the order number from your confirmation (like VQ-ABC-1234) and the phone number you ordered with.</p>
                <form onSubmit={(e) => { e.preventDefault(); f.post('/order-lookup'); }} style={{ display: 'grid', gap: 12 }}>
                    <Field label="Order number"><input className="vqs-input" value={f.data.number} onChange={(e) => f.setData('number', e.target.value)} autoComplete="off" /></Field>
                    <Field label="Phone number"><input className="vqs-input" value={f.data.phone} onChange={(e) => f.setData('phone', e.target.value)} inputMode="tel" autoComplete="tel" /></Field>
                    {f.errors.number && <Alert kind="error">{f.errors.number}</Alert>}
                    <Btn type="submit" disabled={f.processing || !f.data.number || !f.data.phone}>Show my order</Btn>
                </form>
            </div>
        </PublicShell>
    );
}
