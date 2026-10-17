import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ChevronRight, Gift, History, Home, Info, LogOut, MapPin, Menu, ReceiptText, Settings, ShoppingBag, Sparkles, Star, Store, X } from 'lucide-react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { money } from '@/lib/commerce';
import '../../../css/vq-app.css';

const LABEL = {
    pending: 'Waiting for the store', confirmed: 'Confirmed', preparing: 'Being prepared', ready: 'Ready',
    out_for_delivery: 'On the way', completed: 'Completed', rejected: 'Declined', cancelled: 'Cancelled', expired: 'Expired',
};
const TONE = { pending: 'warning', confirmed: 'info', preparing: 'info', ready: 'accent', out_for_delivery: 'accent', completed: 'success', rejected: 'danger', cancelled: 'danger', expired: 'neutral' };

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

const Badge = ({ tone = 'neutral', children }) => <span className={`vqa-badge ${tone !== 'neutral' ? `vqa-badge--${tone}` : ''}`}>{children}</span>;
const Eyebrow = ({ children }) => <span className="vqa-eyebrow" style={{ marginBottom: 8 }}>{children}</span>;

function OrderCard({ o }) {
    return (
        <a href={o.status_url} className="vqa-card vqa-spring">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="vqa-num" style={{ fontSize: 12, fontWeight: 700 }}>{o.number}</span>
                <Badge tone={TONE[o.status] || 'neutral'}>{LABEL[o.status] || o.status}</Badge>
            </div>
            <div className="vqa-display" style={{ fontSize: 12.5, marginTop: 4 }}>{o.store}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--vq-text-3)' }}>
                <span>{o.created_at}</span>
                <b className="vqa-num" style={{ fontSize: 12, color: 'var(--vq-text)' }}>{money(o.total, o.currency_symbol)}</b>
            </div>
        </a>
    );
}

function Empty({ title, text, cta }) {
    return (
        <div className="vqa-empty">
            <b>{title}</b>
            <span>{text}</span>
            {cta}
        </div>
    );
}

const Explore = () => <a className="vqa-btn vqa-spring" style={{ marginTop: 8, width: 'auto' }} href="/shop">Explore stores<ArrowRight size={15} /></a>;
const Field = ({ label, value }) => <div className="vqa-field"><span>{label}</span><div>{value}</div></div>;

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
    const go = (id) => { setTab(id); setOpen(false); window.scrollTo?.({ top: 0 }); };
    const signOut = () => {
        try {
            if (window.VQ && window.VQ.postMessage) { window.VQ.postMessage(JSON.stringify({ t: 'signout' })); return; }
        } catch { /* not in the app */ }
        window.location.href = '/logout';
    };
    const initialsOf = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

    return (
        <PublicShell title="My dashboard" bare>
            <Head title="My dashboard"><meta name="robots" content="noindex,nofollow" /></Head>
            <div className="vqa">
                <div className="vqa-col vqa-rise">
                    {/* mesh header: hamburger, back to shops, profile settings, avatar */}
                    <header className="vqa-mesh">
                        <div className="vqa-mesh-top">
                            <button type="button" className="vqa-glassbtn vqa-spring" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={16} /><span>{current.label}</span></button>
                            <button type="button" className="vqa-glassbtn vqa-glassbtn--accent vqa-spring" onClick={() => go('profile')}><Settings size={13} /><span>Profile Settings</span></button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <span className="vqa-avatar">{initialsOf}</span>
                            <div style={{ minWidth: 0 }}>
                                <h1 className="vqa-display">{name}</h1>
                                <p>{email}</p>
                            </div>
                        </div>
                        {tab === 'home' && verified && (
                            <div className="vqa-stats">
                                <div><b>{active.length}</b><span>In progress</span></div>
                                <div><b>{orders.length}</b><span>Orders</span></div>
                                <div><b>{new Set(orders.map((o) => o.store)).size}</b><span>Stores</span></div>
                            </div>
                        )}
                    </header>

                    {open && (
                        <>
                            <div className="vqa-scrim" onClick={() => setOpen(false)} />
                            <aside className="vqa-drawer" role="dialog" aria-modal="true" aria-label="Menu">
                                <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="vqa-display" style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--vq-text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
                                    </div>
                                    <button type="button" className="vqa-iconbtn" aria-label="Close menu" onClick={() => setOpen(false)}><X size={16} /></button>
                                </div>
                                <nav>
                                    {SECTIONS.map((s) => {
                                        const Icon = s.icon;
                                        return (
                                            <button key={s.id} type="button" className={`vqa-nav ${s.id === tab ? 'on' : ''}`} onClick={() => go(s.id)}>
                                                <Icon size={18} /><span className="grow">{s.label}</span>
                                                {s.soon && <Badge>Soon</Badge>}
                                            </button>
                                        );
                                    })}
                                    <a href="/shop" className="vqa-nav"><ShoppingBag size={18} /><span className="grow">Back to shops</span><ChevronRight size={15} /></a>
                                </nav>
                                <div style={{ padding: 12, borderTop: '1px solid var(--vq-line)' }}>
                                    <button type="button" className="vqa-btn vqa-btn--soft" onClick={signOut}><LogOut size={15} />Sign out</button>
                                </div>
                            </aside>
                        </>
                    )}

                    <main className="vqa-body">
                        {!verified && (
                            <Empty title="Confirm your email to see your orders" text={`We show orders only for an email address you have confirmed (${email}).`} />
                        )}

                        {verified && tab === 'home' && (
                            <>
                                <button type="button" onClick={() => go('profile')} className="vqa-card vqa-spring" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', width: '100%', color: 'inherit' }}>
                                    <span className="vqa-iconbtn" style={{ width: 32, height: 32 }}><Settings size={16} /></span>
                                    <span style={{ flex: 1 }}><b style={{ fontSize: 12, display: 'block' }}>Account &amp; Profile Settings</b><span style={{ fontSize: 11, color: 'var(--vq-text-3)' }}>Manage profile, delivery pin, or make your own store</span></span>
                                    <ChevronRight size={16} style={{ color: 'var(--vq-text-3)' }} />
                                </button>
                                <section style={{ display: 'grid', gap: 8 }}>
                                    <Eyebrow>My active &amp; recent orders</Eyebrow>
                                    {active.length > 0 ? active.map((o) => <OrderCard key={o.id} o={o} />) : <Empty title="Nothing in progress" text="Orders you are waiting for show up here." cta={<Explore />} />}
                                </section>
                                {orders.length > 0 && (
                                    <button type="button" onClick={() => go('orders')} className="vqa-card vqa-spring" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', color: 'inherit', fontSize: 12 }}>
                                        <b>See all my orders</b><ArrowRight size={15} />
                                    </button>
                                )}
                            </>
                        )}

                        {verified && tab === 'orders' && (
                            orders.length === 0
                                ? <Empty title="No orders yet" text={`Orders you place with ${email} appear here, from any store.`} cta={<Explore />} />
                                : <div style={{ display: 'grid', gap: 8 }}>{active.map((o) => <OrderCard key={o.id} o={o} />)}{past.map((o) => <OrderCard key={o.id} o={o} />)}</div>
                        )}

                        {verified && tab === 'top' && (
                            topItems.length === 0
                                ? <Empty title="No favourites yet" text="The items you order most will appear here." />
                                : topItems.map((t) => (
                                    <a key={`${t.store}-${t.title}`} href={t.store_url} className="vqa-row vqa-spring">
                                        <div className="tx"><h4>{t.title}</h4><div style={{ fontSize: 10.5, color: 'var(--vq-text-3)' }}>{t.store} · ordered {t.times} time{t.times === 1 ? '' : 's'}</div></div>
                                        <b className="vqa-num" style={{ fontSize: 13, color: 'var(--vq-accent-text)' }}>{money(t.price, t.currency_symbol)}</b>
                                    </a>
                                ))
                        )}

                        {verified && tab === 'addresses' && (
                            addresses.length === 0
                                ? <Empty title="No saved addresses" text="Delivery addresses you have used before are kept here so you never type them twice." />
                                : addresses.map((a) => (
                                    <div key={a.address} className="vqa-row">
                                        <span className="ph" style={{ color: 'var(--vq-accent-text)', background: 'var(--vq-accent-quiet)' }}><MapPin size={18} /></span>
                                        <div className="tx"><h4 style={{ whiteSpace: 'normal' }}>{a.address}</h4><div style={{ fontSize: 10.5, color: 'var(--vq-text-3)' }}>Last used with {a.store}</div></div>
                                    </div>
                                ))
                        )}

                        {tab === 'info' && (
                            <div className="vqa-card" style={{ display: 'grid', gap: 10 }}>
                                <Field label="Name" value={info?.name || name} />
                                <Field label="Email" value={info?.email || email} />
                                <Field label="Phone (from your last order)" value={info?.phone || 'Not added yet'} />
                            </div>
                        )}

                        {verified && tab === 'history' && (
                            past.length === 0
                                ? <Empty title="No history yet" text="Completed and closed orders are listed here." />
                                : <div style={{ display: 'grid', gap: 8 }}>{past.map((o) => <OrderCard key={o.id} o={o} />)}</div>
                        )}

                        {tab === 'loyalty' && (
                            <div className="vqa-card" style={{ display: 'grid', gap: 6 }}>
                                <b style={{ fontSize: 13 }}>Loyalty points</b>
                                <span style={{ fontSize: 11.5, color: 'var(--vq-text-2)' }}>Coming soon: one place to see and spend your points. {loyalty.length > 0 ? 'Your balances so far:' : ''}</span>
                                {loyalty.map((l) => (
                                    <div key={l.store_url} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                                        <a href={l.store_url} style={{ color: 'var(--vq-accent-text)', fontWeight: 600 }}>{l.store}</a><b className="vqa-num">{l.points.toLocaleString()} pts</b>
                                    </div>
                                ))}
                            </div>
                        )}

                        {tab === 'profile' && (
                            <>
                                <div className="vqa-card" style={{ display: 'grid', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="vqa-eyebrow">Personal details</span><Badge tone="success">Verified</Badge></div>
                                    <Field label="Full name" value={name} />
                                    <Field label="Email" value={email} />
                                </div>
                                {/* The only place the app offers to become a store owner. */}
                                <div className="vqa-store-cta">
                                    <span className="tag"><Sparkles size={12} style={{ color: '#FFCD5B' }} />Profile settings · Business upgrade</span>
                                    <h3 className="vqa-display">{hasStore ? 'Your store is active' : 'Create your own store'}</h3>
                                    <p>{hasStore
                                        ? 'Your account already runs a store. Switch to the store side to open your dashboard.'
                                        : 'Turn this account into a store owner: use the VenQore ERP (ledger, POS, inventory) and publish your own storefront on the marketplace.'}</p>
                                    <a href={hasStore ? '/dashboard' : '/new-store'} className="vqa-btn vqa-btn--white vqa-spring">
                                        <Store size={15} style={{ color: '#088975' }} />{hasStore ? 'Switch to my store' : 'Create your own store'}<ArrowRight size={14} />
                                    </a>
                                </div>
                            </>
                        )}

                        <a href="/shop" className="vqa-glassbtn vqa-spring" style={{ alignSelf: 'center', background: 'var(--vq-sunken)', color: 'var(--vq-text-2)' }}><ArrowLeft size={13} />Back to shops</a>
                    </main>
                </div>
            </div>
        </PublicShell>
    );
}
