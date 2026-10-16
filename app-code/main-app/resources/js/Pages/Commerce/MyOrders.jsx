import React from 'react';
import { Head } from '@inertiajs/react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { money } from '@/lib/commerce';

const LABEL = {
    pending: 'Waiting for the store', confirmed: 'Confirmed', preparing: 'Being prepared', ready: 'Ready',
    out_for_delivery: 'On the way', completed: 'Completed', rejected: 'Declined', cancelled: 'Cancelled', expired: 'Expired',
};

function OrderCard({ o }) {
    return (
        <a href={o.status_url} className="vqs-card vqs-pad" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{o.store}</b>
                <b>{money(o.total, o.currency_symbol)}</b>
            </div>
            <div className="vqs-muted" style={{ fontSize: 14, marginTop: 2 }}>{o.number} · {o.created_at}</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{LABEL[o.status] || o.status}</div>
        </a>
    );
}

/** One customer account across every store: orders and points, found by the verified email. */
export default function MyOrders({ name, email, verified, orders = [], loyalty = [], hasStore }) {
    const active = orders.filter((o) => o.active);
    const past = orders.filter((o) => !o.active);

    return (
        <PublicShell title="My orders">
            <Head title="My orders"><meta name="robots" content="noindex,nofollow" /></Head>
            <div style={{ maxWidth: 560, margin: '16px auto', display: 'grid', gap: 14, padding: '0 4px' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Hi {name}</h1>
                    <p className="vqs-muted" style={{ margin: '4px 0 0' }}>Your orders from every store, in one place.</p>
                </div>

                {!verified && (
                    <div className="vqs-card vqs-pad">
                        <b>Confirm your email to see your orders</b>
                        <p className="vqs-muted" style={{ marginBottom: 0 }}>We show orders only for an email address you have confirmed ({email}).</p>
                    </div>
                )}

                {verified && orders.length === 0 && (
                    <div className="vqs-card vqs-pad">
                        <b>No orders yet</b>
                        <p className="vqs-muted">Orders you place with {email} appear here, from any store.</p>
                        <a className="vqs-btn" href="/shop">Explore stores</a>
                    </div>
                )}

                {active.length > 0 && (
                    <section style={{ display: 'grid', gap: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 16 }}>In progress</h2>
                        {active.map((o) => <OrderCard key={o.id} o={o} />)}
                    </section>
                )}

                {loyalty.length > 0 && (
                    <section className="vqs-card vqs-pad">
                        <h2 style={{ marginTop: 0, fontSize: 16 }}>Your points</h2>
                        {loyalty.map((l) => (
                            <div key={l.store_url} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                <a href={l.store_url}>{l.store}</a><b>{l.points.toLocaleString()} pts</b>
                            </div>
                        ))}
                    </section>
                )}

                {past.length > 0 && (
                    <section style={{ display: 'grid', gap: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 16 }}>Earlier</h2>
                        {past.map((o) => <OrderCard key={o.id} o={o} />)}
                    </section>
                )}

                {!hasStore && (
                    <a href="/new-store" className="vqs-card vqs-pad" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <b>Create your own store</b>
                        <div className="vqs-muted">Sell with VenQore and manage it from the same account.</div>
                    </a>
                )}
            </div>
        </PublicShell>
    );
}
