import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, ChevronRight, MapPin, Plus, Search, Truck, User } from 'lucide-react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { initials } from '@/Components/Commerce/shop';
import LocationModal from '@/Components/Commerce/LocationModal';
import { ShopsMap } from '@/Components/Commerce/MarketMap';
import '../../../css/vq-app.css';

const LOC = 'vqs-loc';
const saved = () => { try { return JSON.parse(localStorage.getItem(LOC) || 'null'); } catch { return null; } };
const save = (v) => { try { localStorage.setItem(LOC, JSON.stringify(v)); } catch { /* storage blocked */ } };
const go = (params) => router.get('/shop', params, { preserveScroll: true });
const money = (n, c) => `${c || 'Rs'} ${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const kindLabel = (t) => (t ? String(t).replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Shop');

const INTENTS = [
    ['Fastest delivery', 'fastest delivery'], ['Free delivery', 'free delivery'], ['Deals', 'deals'], ['Top rated', 'top rated'],
];

function Badge({ tone = 'neutral', dot = false, children }) {
    return <span className={`vqa-badge ${tone !== 'neutral' ? `vqa-badge--${tone}` : ''}`}>{dot && <i />}{children}</span>;
}

function ShopCard({ s }) {
    const closed = s.open_now === false;
    const meta = [
        s.distance_km != null ? `${s.distance_km} km` : null,
        s.delivery && s.prep_minutes != null ? `~${s.prep_minutes} min` : null,
        s.delivery ? (s.delivery_charge > 0 ? money(s.delivery_charge, s.currency) : 'Free delivery') : (s.pickup ? 'Pickup' : null),
    ].filter(Boolean).join(' · ') || s.city || '';
    return (
        <Link href={s.url || `/shop/${s.slug}`} className={`vqa-store vqa-spring ${closed ? 'vqa-closed' : ''}`}>
            <div className="r1">
                <Badge tone={closed ? 'neutral' : 'accent'}>{closed ? 'Closed' : kindLabel(s.business_type)}</Badge>
                {s.rating != null && <span className="rate vqa-num">★ {s.rating}</span>}
            </div>
            <h3 className="vqa-display">{s.name}</h3>
            <div className="m vqa-num">{meta}</div>
            {s.offer && <div className="off">{s.offer}</div>}
        </Link>
    );
}

function ProductRow({ p }) {
    return (
        <div className="vqa-row">
            <span className="ph">{p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : initials(p.name)}</span>
            <div className="tx">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge>{p.store}</Badge>
                    {p.distance_km != null && <span className="vqa-num" style={{ fontSize: 10.5, color: 'var(--vq-text-3)' }}>{p.distance_km} km</span>}
                </div>
                <h4><Link href={p.url}>{p.name}</Link></h4>
                <div className="pr">{money(p.price, p.currency)}{p.was_price && Number(p.was_price) > Number(p.price) && <s style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--vq-text-3)', fontWeight: 500 }}>{money(p.was_price, p.currency)}</s>}</div>
            </div>
            <Link href={p.url} className="vqa-add vqa-spring"><Plus size={14} />Add</Link>
        </div>
    );
}

export default function Directory({ country, cities, city, me, located, stores, products = [], trending = [], offers = [], nearby = [], map = [], kinds = [], filters = {}, needs_location: needsLocation }) {
    const [q, setQ] = useState(filters.q || '');
    const [modal, setModal] = useState(false);
    const [view, setView] = useState('list');
    const searching = !!(filters.q || filters.open || filters.delivery || filters.pickup || filters.offers || filters.kind);

    const base = () => ({ country: country?.code, city: city?.slug, lat: me?.lat, lng: me?.lng });
    const apply = (over = {}) => {
        const next = { ...base(), q: q || undefined, open: filters.open ? 1 : undefined, delivery: filters.delivery ? 1 : undefined, pickup: filters.pickup ? 1 : undefined, offers: filters.offers ? 1 : undefined, kind: filters.kind || undefined, sort: undefined, ...over };
        Object.keys(next).forEach((k) => (next[k] === undefined || next[k] === '' || next[k] === false) && delete next[k]);
        go(next);
    };
    const search = (text) => { setQ(text); go(Object.fromEntries(Object.entries({ ...base(), q: text }).filter(([, v]) => v !== undefined && v !== ''))); };
    const choose = ({ lat, lng, city: slug, cityOnly }) => {
        save({ lat: cityOnly ? undefined : lat, lng: cityOnly ? undefined : lng, city: slug, country: country?.code });
        setModal(false);
        go(Object.fromEntries(Object.entries({ country: country?.code, city: slug, lat: cityOnly ? undefined : lat, lng: cityOnly ? undefined : lng, q: q || undefined }).filter(([, v]) => v !== undefined)));
    };
    useEffect(() => {
        if (city || me) { if (me) save({ ...saved(), lat: me.lat, lng: me.lng, city: city?.slug, country: country?.code }); return; }
        const s = saved();
        if (s && (s.city || (s.lat && s.lng))) go(Object.fromEntries(Object.entries({ country: s.country || country?.code, city: s.city, lat: s.lat, lng: s.lng }).filter(([, v]) => v !== undefined && v !== null)));
        else setModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { if (needsLocation) setModal(true); }, [needsLocation]);
    useEffect(() => { setQ(filters.q || ''); }, [filters.q]);

    const where = me ? (located ? `Near you · ${city?.name}` : `Near your pin · ${city?.name}`) : (city ? city.name : 'Choose location');
    const toggle = (k) => apply({ [k]: filters[k] ? undefined : 1 });
    const total = stores?.total ?? 0;

    return (
        <PublicShell title="Find shops near you" bare>
            <Head title="Find shops near you"><meta name="description" content="Discover local shops and restaurants near you, see today's offers and best sellers, and order directly." /></Head>
            <div className="vqa">
                <div className="vqa-col vqa-rise">
                    {/* sticky glass top bar: delivering-to + profile button (no bottom nav on public pages) */}
                    <header className="vqa-bar">
                        <button type="button" className="vqa-where" onClick={() => setModal(true)} aria-label="Change delivery location">
                            <span className="ic"><MapPin size={16} /></span>
                            <span className="t"><span className="vqa-eyebrow">Delivering to<ChevronRight size={12} /></span><b>{where}</b></span>
                        </button>
                        <Link href="/my-orders" className="vqa-profile vqa-spring" aria-label="My profile"><User size={13} /><span>Profile</span></Link>
                    </header>

                    <main className="vqa-body">
                        <form className="vqa-search" role="search" onSubmit={(e) => { e.preventDefault(); search(q); }}>
                            <Search size={16} />
                            <input type="search" aria-label="Search shops, food and products" maxLength={80} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shops, food, products…" />
                            <button type="submit">Search</button>
                        </form>

                        {!city && !modal && (
                            <div className="vqa-empty">
                                <MapPin size={22} style={{ color: 'var(--vq-accent-text)' }} />
                                <b>Choose your location</b>
                                <span>Drop a pin or use GPS to see the shops that deliver to you.</span>
                                <button type="button" className="vqa-btn vqa-spring" style={{ marginTop: 8 }} onClick={() => setModal(true)}>Pin my location<ArrowRight size={16} /></button>
                            </div>
                        )}

                        {city && (
                            <>
                                {!searching && (
                                    <div className="vqa-hero">
                                        <span className="vqa-eyebrow">{city.name}</span>
                                        <h2 className="vqa-display">{total > 0 ? `${total} ${total === 1 ? 'shop' : 'shops'} ready to deliver` : 'Local shops near you'}</h2>
                                        <p>Order straight from the business. Delivery or pickup, and nothing is charged online.</p>
                                    </div>
                                )}

                                <div className="vqa-chips vqa-noscroll" role="group" aria-label="Filters">
                                    {[['open', 'Open now'], ['delivery', 'Delivery'], ['pickup', 'Pickup'], ['offers', 'Offers']].map(([k, l]) => (
                                        <button key={k} type="button" className="vqa-chip vqa-spring" aria-pressed={!!filters[k]} onClick={() => toggle(k)}>{l}</button>
                                    ))}
                                    {kinds.map((k) => (
                                        <button key={k.key} type="button" className="vqa-chip vqa-spring" aria-pressed={filters.kind === k.key} onClick={() => apply({ kind: filters.kind === k.key ? undefined : k.key })}>{k.label}</button>
                                    ))}
                                    {!searching && INTENTS.map(([label, text]) => <button key={label} type="button" className="vqa-chip vqa-spring" aria-pressed={false} onClick={() => search(text)}>{label}</button>)}
                                    {searching && <button type="button" className="vqa-chip vqa-spring" aria-pressed={false} onClick={() => { setQ(''); go(Object.fromEntries(Object.entries(base()).filter(([, v]) => v !== undefined))); }}>Clear filters</button>}
                                </div>

                                {!searching && offers.length > 0 && (
                                    <section className="vqa-sec" id="offers">
                                        <div className="vqa-sech"><span className="vqa-eyebrow">Offers right now</span></div>
                                        <div className="vqa-chips vqa-noscroll" style={{ gap: 8 }}>
                                            {offers.slice(0, 6).map((o) => (
                                                <Link key={o.url} href={o.url} className="vqa-hero vqa-spring" style={{ flex: 'none', width: 230, padding: 14 }}>
                                                    <span className="vqa-eyebrow">{o.store}{o.open_now === false ? ' · closed' : ''}</span>
                                                    <h2 className="vqa-display" style={{ fontSize: 16 }}>{o.offer}</h2>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {!searching && nearby.length > 0 && (
                                    <section className="vqa-sec">
                                        <div className="vqa-sech"><span className="vqa-eyebrow">Closest to you ({nearby.length})</span></div>
                                        <div className="vqa-stores">{nearby.map((s) => <ShopCard key={s.slug} s={s} />)}</div>
                                    </section>
                                )}

                                {!searching && trending.length > 0 && (
                                    <section className="vqa-sec">
                                        <div className="vqa-sech"><span className="vqa-eyebrow">Best sellers</span></div>
                                        {trending.map((p, i) => <ProductRow key={`${p.url}-${i}`} p={p} />)}
                                    </section>
                                )}

                                {products.length > 0 && (
                                    <section className="vqa-sec">
                                        <div className="vqa-sech"><span className="vqa-eyebrow">Products matching “{filters.text || filters.q}”</span></div>
                                        {products.map((p, i) => (
                                            <Link key={`${p.url}-${i}`} href={p.url} className="vqa-row vqa-spring">
                                                <div className="tx"><h4>{p.product}</h4><div className="vqa-num" style={{ fontSize: 10.5, color: 'var(--vq-text-3)' }}>at {p.store}</div></div>
                                                <ChevronRight size={16} style={{ color: 'var(--vq-text-3)' }} />
                                            </Link>
                                        ))}
                                    </section>
                                )}

                                <section className="vqa-sec" id="all">
                                    <div className="vqa-sech">
                                        <span className="vqa-eyebrow">{searching ? (filters.q ? `Results for “${filters.text || filters.q}”` : 'Results') : `All shops in ${city.name}`} ({total})</span>
                                        <button type="button" onClick={() => setView(view === 'list' ? 'map' : 'list')}>{view === 'list' ? 'Map' : 'List'}</button>
                                    </div>
                                    <label style={{ fontSize: 11, color: 'var(--vq-text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>Sort
                                        <select value={filters.sort} onChange={(e) => apply({ sort: e.target.value })} style={{ height: 30, borderRadius: 999, border: '1px solid var(--vq-line)', background: 'var(--vq-surface)', color: 'var(--vq-text)', padding: '0 10px', fontSize: 12 }}>
                                            {me && <option value="nearest">Nearest</option>}
                                            <option value="fastest">Fastest delivery</option>
                                            <option value="cheapest">Cheapest delivery</option>
                                            <option value="rating">Top rated</option>
                                            <option value="name">A–Z</option>
                                        </select>
                                    </label>
                                    {view === 'map' && <div className="vqa-map"><ShopsMap points={map} me={me} center={city.lat ? [city.lat, city.lng] : null} /></div>}
                                    {stores && stores.data.length === 0 ? (
                                        <div className="vqa-empty"><b>{searching ? 'No shops match that' : `No shops are live in ${city.name} yet`}</b><span>{searching ? 'Try another word or clear the filters.' : 'Check back soon, or try another area.'}</span></div>
                                    ) : (
                                        <div className="vqa-stores">{stores?.data.map((s) => <ShopCard key={s.slug} s={s} />)}</div>
                                    )}
                                    {stores && stores.last > 1 && (
                                        <div className="vqa-pager">
                                            <button type="button" disabled={stores.current <= 1} onClick={() => apply({ page: stores.current - 1 })}>Previous</button>
                                            <span>Page {stores.current} of {stores.last}</span>
                                            <button type="button" disabled={stores.current >= stores.last} onClick={() => apply({ page: stores.current + 1 })}>Next</button>
                                        </div>
                                    )}
                                </section>

                                <Link href="/order-lookup" className="vqa-card vqa-spring" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Truck size={18} style={{ color: 'var(--vq-accent-text)' }} />
                                    <div style={{ flex: 1 }}><b style={{ fontSize: 12 }}>Already ordered?</b><div style={{ fontSize: 11, color: 'var(--vq-text-3)' }}>Track it with your order number and phone.</div></div>
                                    <ChevronRight size={16} style={{ color: 'var(--vq-text-3)' }} />
                                </Link>
                            </>
                        )}
                    </main>
                </div>
            </div>
            {modal && <LocationModal cities={cities} country={country} current={city} required={!city} shopCount={city ? total : undefined} onChoose={choose} onClose={() => setModal(false)} />}
        </PublicShell>
    );
}
