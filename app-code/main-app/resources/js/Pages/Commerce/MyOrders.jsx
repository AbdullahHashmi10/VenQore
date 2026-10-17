import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ArrowRight, ChevronRight, Gift, History, Home, Info, MapPin, Menu, ReceiptText, Settings, Star, Store, X, LogOut, ShoppingBag } from 'lucide-react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { money } from '@/lib/commerce';

const LABEL = {
    pending: 'Waiting for the store', confirmed: 'Confirmed', preparing: 'Being prepared', ready: 'Ready',
    out_for_delivery: 'On the way', completed: 'Completed', rejected: 'Declined', cancelled: 'Cancelled', expired: 'Expired',
};

const SECTIONS = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'My orders', icon: ReceiptText },
    { id: 'top', label: 'Most ordered', icon: Star },
    { id: 'addresses', label: 'Saved addresses', icon: MapPin },
    { id: 'info', label: 'My information', icon: Info },
    { id: 'history', label: 'History', icon: History },
    { id: 'loyalty', label: 'Loyalty points', icon: Gift, soon: true },
    { id: 'profile', label: 'Profile settings', icon: Settings },
];

const card = { display: 'block', textDecoration: 'none', color: 'inherit' };

function OrderCard({ o }) {
    return (
        <a href={o.status_url} className="vqs-card vqs-pad" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{o.store}</b>
                <b>{money(o.total, o.currency_symbol)}</b>
            </div>
            <div className="vqs-muted" style={{ fontSize: 14, marginTop: 2 }}>{o.number} · {o.created_at}</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{LABEL[o.status] || o.status}</div>
        </a>
    );
}

function Empty({ title, text, cta }) {
    return (
        <div className="vqs-card vqs-pad">
            <b>{title}</b>
            <p className="vqs-muted" style={{ marginBottom: cta ? 12 : 0 }}>{text}</p>
            {cta}
        </div>
    );
}

/** The customer's own dashboard: orders, most-ordered items, saved addresses and profile, across every store. */
export default function MyOrders({ name, email, verified, orders = [], loyalty = [], topItems = [], addresses = [], info = null, hasStore }) {
    const initial = (() => {
        try { const t = new URLSearchParams(window.location.search).get('tab'); return SECTIONS.some((s) => s.id === t) ? t : 'home'; } catch { return 'home'; }
    })();
    const [tab, setTab] = useState(initial);
    const [open, setOpen] = useState(false);
    const active = orders.filter((o) => o.active);
    const past = orders.filter((o) => !o.active);
    const current = SECTIONS.find((s) => s.id === tab) || SECTIONS[0];
    const go = (id) => { setTab(id); setOpen(false); };
    const signOut = () => {
        try {
            if (window.VQ && window.VQ.postMessage) { window.VQ.postMessage(JSON.stringify({ t: 'signout' })); return; }
        } catch { /* not in the app */ }
        window.location.href = '/logout';
    };

    return (
        <PublicShell title="My dashboard" bare>
            <Head title="My dashboard"><meta name="robots" content="noindex,nofollow" /></Head>

            {/* top bar: hamburger + current section */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--vqs-surface, #fff)', borderBottom: '1px solid var(--vqs-line, #d3dcd7)' }}>
                <button type="button" aria-label="Open menu" onClick={() => setOpen(true)}
                    style={{ width: 42, height: 42, borderRadius: 12, border: '1px solid var(--vqs-line, #d3dcd7)', background: 'transparent', display: 'grid', placeItems: 'center' }}>
                    <Menu size={20} />
                </button>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>{current.label}</div>
                    <div className="vqs-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                </div>
            </div>

            {/* drawer */}
            {open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} role="dialog" aria-modal="true" aria-label="Menu">
                    <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(13,20,18,.5)' }} />
                    <aside style={{ position: 'relative', width: '84vw', maxWidth: 320, height: '100%', background: 'var(--vqs-surface, #fff)', display: 'flex', flexDirection: 'column', boxShadow: '8px 0 32px rgba(0,0,0,.25)' }}>
                        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                <div className="vqs-muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
                            </div>
                            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--vqs-line, #d3dcd7)', background: 'transparent', display: 'grid', placeItems: 'center' }}><X size={18} /></button>
                        </div>
                        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px', display: 'grid', gap: 4, alignContent: 'start' }}>
                            {SECTIONS.map((s) => {
                                const Icon = s.icon;
                                const on = s.id === tab;
                                return (
                                    <button key={s.id} type="button" onClick={() => go(s.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '0 12px', borderRadius: 14, border: 0, textAlign: 'left', fontWeight: 700, fontSize: 15,
                                            background: on ? 'var(--vqs-accent-quiet, #e6fbf5)' : 'transparent', color: on ? 'var(--vqs-accent-text, #076b5e)' : 'inherit' }}>
                                        <Icon size={19} />
                                        <span style={{ flex: 1 }}>{s.label}</span>
                                        {s.soon && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'var(--vqs-sunken, #e6ece8)' }}>Coming soon</span>}
                                    </button>
                                );
                            })}
                            <a href="/shop" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '0 12px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', color: 'inherit' }}>
                                <ShoppingBag size={19} /><span style={{ flex: 1 }}>Browse stores</span><ChevronRight size={16} />
                            </a>
                        </nav>
                        <div style={{ padding: 12, borderTop: '1px solid var(--vqs-line, #d3dcd7)' }}>
                            <button type="button" onClick={signOut} style={{ width: '100%', minHeight: 46, borderRadius: 999, border: '1px solid var(--vqs-line, #d3dcd7)', background: 'transparent', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#c4443a' }}>
                                <LogOut size={17} />Sign out
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            <div style={{ maxWidth: 560, margin: '14px auto', display: 'grid', gap: 14, padding: '0 12px 28px' }}>
                {!verified && (
                    <Empty title="Confirm your email to see your orders" text={`We show orders only for an email address you have confirmed (${email}).`} />
                )}

                {verified && tab === 'home' && (
                    <>
                        <div className="vqs-card vqs-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                            <div><b style={{ fontSize: 22 }}>{active.length}</b><div className="vqs-muted" style={{ fontSize: 12 }}>In progress</div></div>
                            <div><b style={{ fontSize: 22 }}>{orders.length}</b><div className="vqs-muted" style={{ fontSize: 12 }}>Orders</div></div>
                            <div><b style={{ fontSize: 22 }}>{new Set(orders.map((o) => o.store)).size}</b><div className="vqs-muted" style={{ fontSize: 12 }}>Stores</div></div>
                        </div>
                        {active.length > 0 ? (
                            <section style={{ display: 'grid', gap: 10 }}>
                                <h2 style={{ margin: 0, fontSize: 16 }}>In progress</h2>
                                {active.map((o) => <OrderCard key={o.id} o={o} />)}
                            </section>
                        ) : (
                            <Empty title="Nothing in progress" text="Orders you are waiting for show up here." cta={<a className="vqs-btn" href="/shop">Explore stores</a>} />
                        )}
                        {orders.length > 0 && (
                            <button type="button" onClick={() => go('orders')} className="vqs-card vqs-pad" style={{ ...card, textAlign: 'left', border: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <b>See all my orders</b><ArrowRight size={16} />
                            </button>
                        )}
                    </>
                )}

                {verified && tab === 'orders' && (
                    orders.length === 0
                        ? <Empty title="No orders yet" text={`Orders you place with ${email} appear here, from any store.`} cta={<a className="vqs-btn" href="/shop">Explore stores</a>} />
                        : <>{active.map((o) => <OrderCard key={o.id} o={o} />)}{past.map((o) => <OrderCard key={o.id} o={o} />)}</>
                )}

                {verified && tab === 'top' && (
                    topItems.length === 0
                        ? <Empty title="No favourites yet" text="The items you order most will appear here." />
                        : topItems.map((t) => (
                            <a key={`${t.store}-${t.title}`} href={t.store_url} className="vqs-card vqs-pad" style={card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b>{t.title}</b><b>{money(t.price, t.currency_symbol)}</b></div>
                                <div className="vqs-muted" style={{ fontSize: 13, marginTop: 2 }}>{t.store} · ordered {t.times} time{t.times === 1 ? '' : 's'}</div>
                            </a>
                        ))
                )}

                {verified && tab === 'addresses' && (
                    addresses.length === 0
                        ? <Empty title="No saved addresses" text="Delivery addresses you have used before are kept here so you never type them twice." />
                        : addresses.map((a) => (
                            <div key={a.address} className="vqs-card vqs-pad" style={{ display: 'flex', gap: 10 }}>
                                <MapPin size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div><b>{a.address}</b><div className="vqs-muted" style={{ fontSize: 13 }}>Last used with {a.store}</div></div>
                            </div>
                        ))
                )}

                {tab === 'info' && (
                    <div className="vqs-card vqs-pad" style={{ display: 'grid', gap: 10 }}>
                        <div><div className="vqs-muted" style={{ fontSize: 12 }}>Name</div><b>{info?.name || name}</b></div>
                        <div><div className="vqs-muted" style={{ fontSize: 12 }}>Email</div><b>{info?.email || email}</b></div>
                        <div><div className="vqs-muted" style={{ fontSize: 12 }}>Phone (from your last order)</div><b>{info?.phone || 'Not added yet'}</b></div>
                    </div>
                )}

                {verified && tab === 'history' && (
                    past.length === 0
                        ? <Empty title="No history yet" text="Completed and closed orders are listed here." />
                        : past.map((o) => <OrderCard key={o.id} o={o} />)
                )}

                {tab === 'loyalty' && (
                    <div className="vqs-card vqs-pad">
                        <b>Loyalty points</b>
                        <p className="vqs-muted">Coming soon: one place to see and spend your points. {loyalty.length > 0 ? 'Your balances so far:' : ''}</p>
                        {loyalty.map((l) => (
                            <div key={l.store_url} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                <a href={l.store_url}>{l.store}</a><b>{l.points.toLocaleString()} pts</b>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'profile' && (
                    <>
                        <div className="vqs-card vqs-pad" style={{ display: 'grid', gap: 10 }}>
                            <b>Your account</b>
                            <div><div className="vqs-muted" style={{ fontSize: 12 }}>Name</div>{name}</div>
                            <div><div className="vqs-muted" style={{ fontSize: 12 }}>Email</div>{email}</div>
                        </div>
                        {/* The only place the app offers to become a store owner. */}
                        <div className="vqs-card vqs-pad" style={{ background: 'linear-gradient(160deg,#062421,#0a5049)', color: '#fff', borderRadius: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, opacity: .85 }}><Store size={14} /> BUSINESS</div>
                            <h3 style={{ margin: '8px 0 4px', fontSize: 19 }}>{hasStore ? 'Open your store' : 'Create your own store'}</h3>
                            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, opacity: .88 }}>
                                {hasStore
                                    ? 'Your account already runs a store. Switch to the store side to open your dashboard.'
                                    : 'Turn this account into a store owner: use the VenQore ERP and publish your own storefront on the marketplace.'}
                            </p>
                            <a href={hasStore ? '/dashboard' : '/new-store'} style={{ marginTop: 14, minHeight: 46, borderRadius: 999, background: '#fff', color: '#062421', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                                {hasStore ? 'Switch to my store' : 'Create your own store'} <ArrowRight size={16} />
                            </a>
                        </div>
                    </>
                )}
            </div>
        </PublicShell>
    );
}
