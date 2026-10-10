import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, BadgePercent, CalendarCheck, Check, Clock, MapPin, Palette, RefreshCw, Search, ShoppingCart, Sparkles, Star, Store as StoreIcon, Truck } from 'lucide-react';
import { StorePage } from '@/Components/Storefront/venqore/StoreFrame';
import { SectionHead, frame, plural, useRowEnd, useStuck } from '@/Components/Storefront/venqore/kit';
import { initials } from '@/Components/Commerce/shop';
import LocationModal from '@/Components/Commerce/LocationModal';
import { ShopsMap } from '@/Components/Commerce/MarketMap';
import { PhotoSlot, Slideshow } from '@/Components/Storefront/venqore/photos';
import '../../../css/commerce-marketplace.css';

const LOC = 'vqs-loc';
const saved = () => { try { return JSON.parse(localStorage.getItem(LOC) || 'null'); } catch { return null; } };
const save = (v) => { try { localStorage.setItem(LOC, JSON.stringify(v)); } catch { /* storage blocked */ } };
const go = (params) => router.get('/shop', params, { preserveScroll: true });
const money = (n, c) => `${c || 'Rs'} ${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const IMG = '/images/marketplace';
const KIND_IMG = { restaurants: 'cat-restaurants.jpg', groceries: 'cat-groceries.jpg', pharmacy: 'cat-pharmacy.jpg', fashion: 'cat-fashion.jpg', electronics: 'cat-electronics.jpg' };

const INTENTS = [
    ['Restaurants near me', 'restaurants near me'], ['Fastest delivery', 'fastest delivery'], ['Free delivery', 'free delivery'],
    ['Open now', 'open now'], ['Deals & offers', 'deals'], ['Top rated', 'top rated'], ['Groceries', 'groceries near me'], ['Pharmacy', 'pharmacy near me'],
];

/** Optional marketplace photo (.jpg, then the built-in .svg); hidden if neither exists. */
function Photo({ name, alt = '' }) {
    const [step, setStep] = useState(0);
    if (!name || step > 1) return null;
    const file = step === 0 ? name : name.replace(/\.jpg$/, '.svg');
    return <img src={`${IMG}/${file}`} alt={alt} loading="lazy" onError={() => setStep((n) => n + 1)} />;
}

function ShopCard({ s, delay = 0 }) {
    const [logoOk, setLogoOk] = useState(true);
    return (
        <div data-reveal="" style={{ '--d': `${delay}ms`, height: '100%' }}>
            <Link href={s.url || `/shop/${s.slug}`} className="vqsf-shopcard">
                <div className="cv">
                    {s.banner_url ? <img src={s.banner_url} alt="" loading="lazy" /> : <span className="ph" />}
                    <div className="tags">
                        {s.offer && <span className="tag off">{s.offer}</span>}
                        {s.open_now === true && <span className="tag"><span className="vqsf-live" />Open</span>}
                        {s.open_now === false && <span className="tag">Closed</span>}
                        {s.distance_km != null && <span className="tag">{s.distance_km} km</span>}
                    </div>
                </div>
                <div className="bd">
                    <span className="lg">{initials(s.name)}{s.logo_url && logoOk ? <img src={s.logo_url} alt="" loading="lazy" onError={() => setLogoOk(false)} /> : null}</span>
                    <h3>{s.name}</h3>
                    <div className="mt">
                        {s.rating != null && <span><Star size={11} fill="currentColor" strokeWidth={0} style={{ color: 'var(--accent)', verticalAlign: '-1px' }} /> <b>{s.rating}</b> ({s.reviews})</span>}
                        {s.delivery && s.prep_minutes != null && <span><Clock size={11} style={{ verticalAlign: '-1px' }} /> ~{s.prep_minutes} min</span>}
                        {s.delivery && <span className={s.delivery_charge > 0 ? '' : 'st'}>{s.delivery_charge > 0 ? `Delivery ${money(s.delivery_charge, s.currency)}` : 'Free delivery'}</span>}
                        {s.pickup && <span>Pickup</span>}
                    </div>
                    {s.address && s.address.length > 5 && <span className="ad">{s.address}</span>}
                </div>
            </Link>
        </div>
    );
}

function Trend({ p, delay }) {
    return (
        <div data-reveal="" style={{ '--d': `${delay}ms` }}>
            <article className="vqsf-card vqsf-pcard">
                <div className="media">
                    <span className="ph" data-parallax="0.05">
                        <span className={`vqsf-pic ${p.image_url ? 'has-img' : ''}`}>{p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : <span className="ini">{initials(p.name)}</span>}</span>
                    </span>
                    {p.was_price && Number(p.was_price) > Number(p.price) && <span className="flag">{Math.round((1 - p.price / p.was_price) * 100)}% off</span>}
                </div>
                <div className="body">
                    <div className="meta"><StoreIcon size={11} style={{ flexShrink: 0 }} /><b>{p.store}</b>{p.distance_km != null && <><span>·</span><span>{p.distance_km} km</span></>}</div>
                    <h3><Link href={p.url}>{p.name}</Link></h3>
                    {p.sold > 0 && <div className="sub">{p.sold} sold recently</div>}
                    <div className="foot">
                        <div className="vqsf-price"><div className="now">{money(p.price, p.currency)}</div>{p.was_price && <s>{money(p.was_price, p.currency)}</s>}</div>
                        <span className="vqsf-add" aria-hidden="true"><ArrowUpRight size={16} /></span>
                    </div>
                </div>
            </article>
        </div>
    );
}

export default function Directory({ images = {}, can_edit_photos: canEditPhotos = false, edit_photos: editPhotos = null, countries, country, cities, city, me, located, stores, products = [], trending = [], offers = [], nearby = [], map = [], kinds = [], filters = {}, needs_location: needsLocation }) {
    const [q, setQ] = useState(filters.q || '');
    const [modal, setModal] = useState(false);
    const [view, setView] = useState('list');
    const railRef = useRef(null);
    const [barRef, stuck] = useStuck();
    const [rowRef, rowEnd] = useRowEnd();
    const nearRef = useRef(null);
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
    const [bigOffer, ...moreOffers] = offers;

    const nav = [
        { id: 'offers', label: 'Offers', onClick: () => apply({ offers: 1 }) },
        { id: 'open', label: 'Open now', onClick: () => apply({ open: 1 }) },
        { id: 'kinds', label: 'Categories', href: '#categories', onClick: () => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }) },
        { id: 'track', label: 'Track order', href: '/order-lookup' },
    ];

    return (
        <StorePage title="Find shops near you" nav={nav} where={where} onWhere={() => setModal(true)} onSearch={search} searchPlaceholder="Search shops, food, products…"
            searchSuggestions={INTENTS.map(([label, text]) => ({ label, go: () => search(text) }))}>
            <Head><meta name="description" content="Discover local shops and restaurants near you, see today's offers and best sellers, and order directly." /></Head>

            {/* ── hero ── */}
            <section className="vqsf-hero">
                <div className="wrap vqsf-hero-grid">
                    <div>
                        <button type="button" className="vqsf-pill" onClick={() => setModal(true)} data-reveal="">
                            <span className="vqsf-live" /><span>{city ? `${plural(total, 'shop')} live · ${where}` : 'Choose your location'}</span>
                        </button>
                        <h1 data-reveal="" style={{ '--d': '60ms' }}>Everything <span className="serif">local</span>,<br />at your door.</h1>
                        <p className="lede" data-reveal="" style={{ '--d': '120ms' }}>Shops and restaurants near you, today’s offers and what people love most — order straight from the business, delivered or picked up.</p>
                        <form className="vqsf-bigsearch" role="search" onSubmit={(e) => { e.preventDefault(); search(q); }} data-reveal="" style={{ '--d': '180ms' }}>
                            <Search size={19} strokeWidth={1.8} />
                            <input type="search" aria-label="Search shops, food and products" maxLength={80} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pizza, groceries, a phone charger…" />
                            <button type="submit" className="go">Search</button>
                        </form>
                        <div className="vqsf-chips" data-reveal="" style={{ '--d': '240ms' }}>
                            {INTENTS.slice(0, 5).map(([label, text]) => <button key={label} type="button" className="vqsf-chip" onClick={() => search(text)}>{label}</button>)}
                        </div>
                        <div className="vqsf-ctas" data-reveal="" style={{ '--d': '300ms' }}>
                            <a href="#all" className="vqsf-btn vqsf-btn--accent">Browse all shops<ArrowRight size={15} strokeWidth={2} /></a>
                            {offers.length > 0 ? <a href="#offers" className="vqsf-btn vqsf-btn--line">See today’s offers</a> : <button type="button" className="vqsf-btn vqsf-btn--line" onClick={() => setModal(true)}><MapPin size={15} />Change location</button>}
                        </div>
                    </div>
                    <div className="vqsf-collage" data-reveal="" style={{ '--d': '140ms' }}>
                        <div className="vqsf-collage-grid">
                            <div className="vqsf-tile vqsf-tile--a" data-parallax="0.10">{images.hero?.length ? <Slideshow images={images.hero} eager /> : <Photo name="hero.jpg" />}<PhotoSlot slot="hero" max={6} label="Main photos" /></div>
                            <div className="col">
                                <div role="button" tabIndex={0} className="vqsf-tile vqsf-tile--b" data-parallax="-0.07" onClick={() => search('deals')} onKeyDown={(e) => e.key === 'Enter' && search('deals')} aria-label="Deals and offers" style={{ cursor: 'pointer' }}>{images.promo_deals?.[0] ? <img src={images.promo_deals[0]} alt="" /> : <Photo name="promo-1.jpg" />}<PhotoSlot slot="promo_deals" label="Deals tile" /><span className="cap" style={{ opacity: 1, transform: 'none' }}><b>Deals & offers</b><i>→</i></span></div>
                                <div role="button" tabIndex={0} className="vqsf-tile vqsf-tile--c" data-parallax="0.17" onClick={() => search('free delivery')} onKeyDown={(e) => e.key === 'Enter' && search('free delivery')} aria-label="Free delivery" style={{ cursor: 'pointer' }}>{images.promo_delivery?.[0] ? <img src={images.promo_delivery[0]} alt="" /> : <Photo name="promo-2.jpg" />}<PhotoSlot slot="promo_delivery" label="Delivery tile" /><span className="cap" style={{ opacity: 1, transform: 'none' }}><b>Free delivery</b><i>→</i></span></div>
                            </div>
                        </div>
                        <div className="vqsf-float vqsf-float--l"><span className="ic"><StoreIcon size={14} strokeWidth={2} /></span><span><b>{city ? plural(total, 'shop') : 'Local shops'}</b><small>{city ? `in ${city.name}` : 'near you'}</small></span></div>
                        {offers.length > 0 && <div className="vqsf-float vqsf-float--r"><span className="vqsf-live" /><span style={{ fontSize: 12, fontWeight: 600 }}>{plural(offers.length, 'offer')} live now</span></div>}
                    </div>
                </div>
            </section>

            <section className="vqsf-marquee" aria-label="How it works">
                <div className="vqsf-marquee-track">
                    {[0, 1].map((k) => <div key={k} aria-hidden={k === 1}>{['Order straight from the business', 'Delivery or pickup — your choice', 'Cash, pickup or bank transfer', 'Nothing is charged online', 'Live status link for every order', 'Prices set by the shop itself'].map((t) => <span key={t} className="it">{t}</span>)}</div>)}
                </div>
            </section>

            {/* ── categories ── */}
            {kinds.length > 0 && (
                <section className="vqsf-sec vqsf-kinds" id="categories" style={{ paddingBottom: 'clamp(48px,6vw,84px)' }}>
                    <div className="wrap">
                        <SectionHead eyebrow="Explore" title="Shop by category">
                            <button type="button" className="vqsf-round" aria-label="Scroll left" onClick={() => railRef.current?.scrollBy({ left: -480, behavior: 'smooth' })}><ArrowRight size={17} style={{ transform: 'rotate(180deg)' }} /></button>
                            <button type="button" className="vqsf-round" aria-label="Scroll right" onClick={() => railRef.current?.scrollBy({ left: 480, behavior: 'smooth' })}><ArrowRight size={17} /></button>
                        </SectionHead>
                    </div>
                    <div className="vqsf-rail" ref={railRef}>
                        {kinds.map((k) => (
                            <div key={k.key} role="button" tabIndex={0} className="vqsf-cat" onClick={() => apply({ kind: k.key })} onKeyDown={(e) => e.key === 'Enter' && apply({ kind: k.key })} style={{ textAlign: 'left', cursor: 'pointer' }}>
                                <span className="im"><span className="em">{initials(k.label)}</span>{images[`kind_${k.key}`]?.[0] ? <img src={images[`kind_${k.key}`][0]} alt="" /> : <Photo name={KIND_IMG[k.key]} />}{images[`kind_${k.key}`] !== undefined && <PhotoSlot slot={`kind_${k.key}`} label={`${k.label} photo`} />}</span>
                                <span className="lb"><b>{k.label}</b><ArrowRight size={14} strokeWidth={2} /></span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {!city && !modal && (
                <section className="vqsf-sec"><div className="wrap"><div className="vqsf-empty"><span className="ic"><MapPin size={21} /></span><b>Choose your location</b><span>Pick a city or drop a pin to see the shops around you.</span><button type="button" className="vqsf-btn vqsf-btn--md" onClick={() => setModal(true)}>Choose location</button></div></div></section>
            )}

            {city && (
                <>
                    {/* ── offers as collections ── */}
                    {!searching && offers.length > 0 && (
                        <section className="vqsf-sec vqsf-sec--tint" id="offers">
                            <div className="wrap">
                                <div data-reveal="" style={{ maxWidth: 620, marginBottom: 'clamp(28px,4vw,50px)' }}>
                                    <div className="vqsf-eyebrow vqsf-eyebrow--accent">Live in {city.name}</div>
                                    <h2 className="vqsf-h2">Offers going on<br /><span className="serif">right now</span>.</h2>
                                </div>
                                <div className="vqsf-cols">
                                    <div className="wide" data-reveal="">
                                        <Link href={bigOffer.url} className="vqsf-col vqsf-col--big">
                                            <span className="bg bg--grad" data-parallax="0.09" />
                                            <span className="tx"><span className="k">{bigOffer.store}{bigOffer.open_now === false ? ' · closed now' : ''}</span><span className="t">{bigOffer.offer}</span><span className="l">{bigOffer.title}</span><span className="go">See the offer<ArrowRight size={14} /></span></span>
                                        </Link>
                                    </div>
                                    {moreOffers.slice(0, 4).map((o, i) => (
                                        <div key={o.url} data-reveal="" style={{ '--d': `${(i + 1) * 60}ms` }}>
                                            <Link href={o.url} className="vqsf-col"><span className="bg bg--grad" data-parallax="0.06" /><span className="tx"><span className="k">{o.store}{o.open_now === false ? ' · closed now' : ''}</span><span className="t">{o.offer}</span><span className="l">{o.title}</span></span></Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── nearby ── */}
                    {!searching && nearby.length > 0 && (
                        <section className="vqsf-sec" style={{ paddingBottom: 'clamp(40px,5vw,72px)' }}>
                            <div className="wrap">
                                <SectionHead eyebrow="Sorted by distance" title="Closest to you">
                                    <button type="button" className="vqsf-round" aria-label="Scroll left" onClick={() => nearRef.current?.scrollBy({ left: -480, behavior: 'smooth' })}><ArrowRight size={17} style={{ transform: 'rotate(180deg)' }} /></button>
                                    <button type="button" className="vqsf-round" aria-label="Scroll right" onClick={() => nearRef.current?.scrollBy({ left: 480, behavior: 'smooth' })}><ArrowRight size={17} /></button>
                                </SectionHead>
                            </div>
                            <div className="vqsf-hrail" ref={nearRef}>{nearby.map((s, i) => <ShopCard key={s.slug} s={s} delay={Math.min(i, 4) * 60} />)}</div>
                        </section>
                    )}

                    {/* ── best sellers ── */}
                    {!searching && trending.length > 0 && (
                        <section className="vqsf-sec" style={{ paddingTop: nearby.length ? 0 : undefined }}>
                            <div className="wrap">
                                <SectionHead eyebrow="What people are ordering" title="Best sellers" />
                                <div className="vqsf-grid">{trending.map((p, i) => <Trend key={`${p.url}-${i}`} p={p} delay={(i % 4) * 60} />)}</div>
                            </div>
                        </section>
                    )}

                    {/* ── all shops ── */}
                    <section className={`vqsf-sec ${!searching ? 'vqsf-sec--tint' : ''}`} id="all" style={searching ? { paddingTop: 'clamp(40px,5vw,64px)' } : undefined}>
                        <div className="wrap">
                            <SectionHead eyebrow={plural(total, 'shop')} title={searching ? (filters.q ? <>Results for “{filters.text || filters.q}”</> : 'Results') : <>All shops in <span className="serif">{city.name}</span></>}>
                                <label className="vqsf-sort"><span>Sort</span>
                                    <select value={filters.sort} onChange={(e) => apply({ sort: e.target.value })}>
                                        {me && <option value="nearest">Nearest</option>}
                                        <option value="fastest">Fastest delivery</option>
                                        <option value="cheapest">Cheapest delivery</option>
                                        <option value="rating">Top rated</option>
                                        <option value="name">A–Z</option>
                                    </select>
                                </label>
                                <div className="vqsf-viewtog" role="group" aria-label="View">
                                    <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
                                    <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button>
                                </div>
                            </SectionHead>

                            <div ref={barRef} className={`vqsf-toolbar ${stuck ? 'stuck' : ''}`} style={{ marginBottom: 24 }}>
                                <div ref={rowRef} className={`vqsf-catchips ${rowEnd ? 'at-end' : ''}`} role="group" aria-label="Filters">
                                    {[['open', 'Open now'], ['delivery', 'Delivery'], ['pickup', 'Pickup'], ['offers', 'Offers']].map(([k, l]) => <button key={k} type="button" className={`vqsf-catchip ${filters[k] ? 'on' : ''}`} aria-pressed={!!filters[k]} onClick={() => toggle(k)}>{filters[k] && <Check size={13} />}{l}</button>)}
                                    {kinds.map((k) => <button key={k.key} type="button" className={`vqsf-catchip ${filters.kind === k.key ? 'on' : ''}`} aria-pressed={filters.kind === k.key} onClick={() => apply({ kind: filters.kind === k.key ? undefined : k.key })}>{k.label}</button>)}
                                    {searching && <button type="button" className="vqsf-clear" onClick={() => { setQ(''); go(Object.fromEntries(Object.entries(base()).filter(([, v]) => v !== undefined))); }}>Clear filters</button>}
                                </div>
                            </div>

                            {products.length > 0 && (
                                <div style={{ marginBottom: 32 }}>
                                    <div className="vqsf-eyebrow">Products matching “{filters.text || filters.q}”</div>
                                    <div className="vqsf-grid" style={{ '--card-min': '260px' }}>
                                        {products.map((p, i) => <Link key={`${p.url}-${i}`} href={p.url} className="vqsf-match"><span><b>{p.product}</b><small>at {p.store}</small></span><ArrowUpRight size={15} /></Link>)}
                                    </div>
                                </div>
                            )}

                            {view === 'map' && <div className="vqsf-map"><ShopsMap points={map} me={me} center={city.lat ? [city.lat, city.lng] : null} /></div>}
                            {stores && stores.data.length === 0 ? (
                                <div className="vqsf-empty"><span className="ic"><StoreIcon size={21} /></span><b>{searching ? 'No shops match that' : `No shops are live in ${city.name} yet`}</b><span>{searching ? 'Try a different word or clear the filters.' : 'Check back soon, or try another city.'}</span>{!searching && <button type="button" className="vqsf-btn vqsf-btn--md" onClick={() => setModal(true)}>Change city</button>}</div>
                            ) : (
                                <div className="vqsf-grid" style={{ '--card-min': '280px' }}>{stores?.data.map((s, i) => <ShopCard key={s.slug} s={s} delay={(i % 3) * 60} />)}</div>
                            )}
                            {stores && stores.last > 1 && (
                                <div className="vqsf-pager">
                                    <button type="button" className="vqsf-btn vqsf-btn--md vqsf-btn--line" disabled={stores.current <= 1} onClick={() => apply({ page: stores.current - 1 })}>Previous</button>
                                    <span className="pg">Page {stores.current} of {stores.last}</span>
                                    <button type="button" className="vqsf-btn vqsf-btn--md" disabled={stores.current >= stores.last} onClick={() => apply({ page: stores.current + 1 })}>Next<ArrowRight size={14} /></button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── how it works ── */}
                    {!searching && (
                        <section className="vqsf-sec">
                            <div className="wrap">
                                <div data-reveal="" style={{ maxWidth: 560, marginBottom: 'clamp(32px,4.5vw,58px)' }}>
                                    <div className="vqsf-eyebrow">How it works</div>
                                    <h2 className="vqsf-h2">Straight from the<br />shop to you.</h2>
                                </div>
                                <div className="vqsf-reasons">
                                    {[
                                        ['Find a shop nearby', 'Search by what you need or browse by category, distance and delivery time.'],
                                        ['Order from the business', 'Your order goes straight to the shop’s own till — no middleman mark-up.'],
                                        ['Delivery or pickup', 'Choose your area at checkout, or collect it yourself when it is ready.'],
                                        ['Pay the way you like', 'Cash on delivery, pay at pickup or bank transfer. Nothing is charged online.'],
                                        ['Track it live', 'Every order gets a status link, and the shop confirms before anything is packed.'],
                                        ['Rate what you got', 'Reviews come from real customers and help your neighbours choose.'],
                                    ].map(([t, d], i) => (
                                        <div key={t} className="vqsf-reason" data-reveal="" style={{ '--d': `${(i % 3) * 70}ms` }}><div className="no">{String(i + 1).padStart(2, '0')}</div><h3>{t}</h3><p>{d}</p></div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    <section style={{ padding: '0 var(--pad) clamp(64px,9vw,120px)' }}>
                        <div className="vqsf-cta-end" data-reveal="">
                            <h2>Already ordered?<br /><span>Find it with your order number and phone.</span></h2>
                            <div className="acts">
                                <Link href="/order-lookup" className="vqsf-btn"><Truck size={16} />Track an order</Link>
                                <button type="button" className="vqsf-btn vqsf-btn--line" onClick={() => frame.search()}><Search size={15} />Search again</button>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* ── for businesses: join the marketplace ── */}
            <section className="vqsf-sec" id="sell" style={{ paddingTop: city ? 0 : undefined }}>
                <div className="wrap">
                    <div className="vqsf-join" data-reveal="">
                        {images.join?.[0] && <img className="vqsf-join-bg" src={images.join[0]} alt="" loading="lazy" />}
                        <PhotoSlot slot="join" label="Banner photo" place="tr" />
                        <div className="vqsf-join-copy">
                            <div className="vqsf-eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>For shops, restaurants & cafés</div>
                            <h2>Run a business?<br /><span className="serif">Get it listed here.</span></h2>
                            <p>Your VenQore till already knows your products, prices and stock. Switch on the online store and they appear here — no second catalogue to keep up to date, no copying orders by hand.</p>
                            <div className="vqsf-join-acts">
                                <a href="/build-workspace" className="vqsf-btn vqsf-btn--accent"><Sparkles size={16} />Create your store<ArrowRight size={15} /></a>
                                <a href="/pricing" className="vqsf-btn vqsf-btn--ghostdark">See plans</a>
                            </div>
                            <small>The online store and marketplace listing come with VenQore’s paid plans.</small>
                        </div>
                        <ul className="vqsf-join-grid">
                            {[
                                [RefreshCw, 'Stock syncs by itself', 'Sell something at the counter and the online count drops too. Nothing to update twice.'],
                                [ShoppingCart, 'Orders land in your till', 'Online orders arrive as requests you accept — the same screen your staff already use.'],
                                [Palette, 'Your own store page', 'Your logo, colours, hours, banner and a web address you can share anywhere.'],
                                [Truck, 'Delivery and pickup, your way', 'Set delivery areas, fees and minimum orders. Cash on delivery, pay at pickup or bank transfer.'],
                                [BadgePercent, 'Offers that just work', 'Discounts and coupons you run in-store show up online automatically.'],
                                [CalendarCheck, 'Restaurants get more', 'A menu with add-ons and table reservations that go straight to your floor plan.'],
                            ].map(([Ic, t, d]) => (
                                <li key={t}><span className="ic"><Ic size={17} /></span><b>{t}</b><p>{d}</p></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {canEditPhotos && !editPhotos && <a href="/shop?edit=1" className="vqsf-editbar" style={{ width: 'auto', textDecoration: 'none' }}><span className="ic">✎</span><span className="tx" style={{ minWidth: 0 }}><b>Platform admin</b> · Edit marketplace photos</span></a>}
            {modal && <LocationModal cities={cities} country={country} current={city} required={!city} onChoose={choose} onClose={() => setModal(false)} />}
        </StorePage>
    );
}
