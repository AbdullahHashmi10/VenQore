import React, { useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Bike, CalendarClock, Check, Clock, Mail, MapPin, Package, Phone, Search, ShieldCheck, ShoppingCart, Star, Store as StoreIcon, Tag, Truck, Wallet } from 'lucide-react';
import { StorePage, Mark, hoursText, DAYS, DAY_LABEL } from '@/Components/Storefront/venqore/StoreFrame';
import ProductCard, { flyToCart } from '@/Components/Storefront/venqore/ProductCard';
import { Headline, Pic, SectionHead, SeeAll, Stars, frame, money, needsChoice, plural, productUrl, productsUrl, useSaved } from '@/Components/Storefront/venqore/kit';
import RestaurantHome from '@/Pages/Storefront/restaurant/RestaurantHome';
import { useShopCart } from '@/lib/shopCart';
import { initials } from '@/Components/Commerce/shop';
import { PhotoSlot, Slideshow, SlotShow } from '@/Components/Storefront/venqore/photos';

function statusOf(store) {
    const g = store.hours_guidance;
    if (g?.is_on_break) return { dot: 'warn', text: `On a break${g.opens_at ? ` · back ${g.opens_at}` : ''}` };
    if (store.open_now === true) return { dot: '', text: `Open now${g?.closes_at ? ` · closes ${g.closes_at}` : ''}` };
    if (store.open_now === false) return { dot: 'off', text: `Closed${g?.opens_at ? ` · opens ${g.opens_at}` : ''}` };
    return null;
}

/** Counts down to an offer's end (only shown when the offer really ends within two days). */
function Countdown({ endsAt }) {
    const end = new Date(String(endsAt).replace(' ', 'T')).getTime();
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
    const left = Math.max(0, end - now);
    if (!end || Number.isNaN(end) || left <= 0 || left > 48 * 3600e3) return null;
    const p = (n) => String(n).padStart(2, '0');
    const h = Math.floor(left / 3600e3); const m = Math.floor((left % 3600e3) / 60e3); const s = Math.floor((left % 60e3) / 1e3);
    return (
        <div className="vqsf-count" aria-label={`Offer ends in ${h} hours ${m} minutes`}>
            <small>Offer ends in</small>
            <div className="d"><span>{p(h)}</span><i>:</i><span>{p(m)}</span><i>:</i><span className="s">{p(s)}</span></div>
        </div>
    );
}

function HomeDefault(props) {
    const { store, preview, show_images: show, limits, rating_summary: rs, customer, picks, picks_are_featured: featured, new_arrivals: fresh, on_offer: onOffer, categories, offers, totals } = props;
    const shop = useShopCart(store.slug, limits.max_qty);
    const saved = useSaved(store.slug);
    const railRef = useRef(null);
    const basketRef = useRef(null);
    const browseOnly = store.customer_mode === 'catalogue';
    const canAdd = store.accepting_orders && !browseOnly;
    const sym = store.currency_symbol;
    const zones = store.delivery_zones || [];
    const status = statusOf(store);
    const todayKey = store.hours_guidance?.current_day_key;
    const hours = store.opening_hours;
    const best = offers.length ? offers.reduce((a, b) => (b.percent > a.percent ? b : a)) : null;
    const reviews = (rs.reviews || []).filter((r) => r.review).slice(0, 3);
    const minFee = zones.length ? Math.min(...zones.map((z) => Number(z.fee))) : Number(store.delivery_charge || 0);
    const payWords = [store.payments?.cod && 'cash on delivery', store.payments?.pickup && 'pay at pickup', store.payments?.bank && 'bank transfer'].filter(Boolean);
    const card = (variant) => (it, i) => <ProductCard key={it.id} item={it} variant={variant} delay={(i % 4) * 60} store={store} shop={shop} saved={saved} show={show} canAdd={canAdd} browseOnly={browseOnly} />;

    // Hero collage: the banner first, then product photos.
    const ownHero = (store.images?.hero || []).map((u, k) => ({ id: `own-${k}`, src: u, name: store.name }));
    const photos = [
        ...ownHero,
        ...(store.banner_url ? [{ id: 'banner', src: store.banner_url, name: store.name }] : []),
        ...picks.concat(onOffer).filter((p) => p.image_url && show).map((p) => ({ id: p.id, src: p.image_url, name: p.name, price: money(p.price_from ?? p.price, sym), href: productUrl(store.slug, p.id) })),
    ].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, 3);

    // A ready basket: simple, in-stock picks that can be added in one tap.
    const basket = picks.filter((p) => !needsChoice(p) && p.stock !== 'out').slice(0, 6);
    const basketTotal = basket.reduce((n, p) => n + Number(p.price), 0);
    const addBasket = () => {
        let ok = true;
        basket.forEach((p, i) => { if (ok) ok = shop.add({ ...p, quiet: i < basket.length - 1 }, [], 1); });
        if (ok) flyToCart(basketRef.current);
    };

    const chips = [
        store.delivery && (minFee > 0 ? `Delivery from ${money(minFee, sym)}` : 'Free delivery'),
        store.pickup && 'Pickup in store',
        Number(store.min_order_amount) > 0 && `Minimum order ${money(store.min_order_amount, sym)}`,
        payWords.length > 0 && payWords[0].replace(/^./, (c) => c.toUpperCase()),
    ].filter(Boolean);

    const strip = [
        store.prep_minutes && `Ready in about ${store.prep_minutes} minutes`,
        store.delivery && (zones.length ? `Delivering to ${plural(zones.length, 'area')}` : 'Delivery available'),
        store.pickup && 'Collect it yourself, no queue',
        payWords.length > 0 && `Pay by ${payWords.join(', ')}`,
        'Nothing is charged online',
        `Every order confirmed by ${store.name}`,
        rs.average && `Rated ${rs.average.toFixed(1)} by ${plural(rs.count, 'customer')}`,
        totals.products > 0 && `${totals.products} products to choose from`,
        ...(store.badges || []).map((b) => b.label || b.name).filter(Boolean),
    ].filter(Boolean);

    // Collections: running offers first, then categories that have a photo.
    const tiles = [
        ...offers.map((o) => ({ key: `o-${o.name}`, kicker: 'Offer', title: o.name, line: `${Math.round(o.percent)}% off${o.min_order > 0 ? ` on orders over ${money(o.min_order, sym)}` : ''}.`, pct: Math.round(o.percent), href: productsUrl(store.slug, { offer: 1 }) })),
        ...categories.filter((c) => c.image_url && show).map((c) => ({ key: `c-${c.id}`, kicker: 'Aisle', title: c.name, line: `${plural(c.count, 'item')} in this aisle.`, img: c.image_url, href: productsUrl(store.slug, { category: c.id }) })),
    ].slice(0, 5);

    const reasons = [
        { t: 'Shelf price, not app price', d: `Prices are set by ${store.name} itself. What you see is what you pay.` },
        store.delivery && { t: zones.length ? `Delivery to ${plural(zones.length, 'area')}` : 'Delivered to your door', d: zones.length ? `Pick your area at checkout — fees start at ${money(minFee, sym)}.` : minFee > 0 ? `A flat ${money(minFee, sym)} delivery charge.` : 'Delivery is free.' },
        store.pickup && { t: 'Or collect it yourself', d: `Order ahead and pick it up from ${store.address || store.name}.` },
        payWords.length > 0 && { t: 'Pay the way you like', d: `${payWords.join(', ').replace(/^./, (c) => c.toUpperCase())}. Nothing is charged online.` },
        { t: 'Confirmed before it is packed', d: `${store.name} checks every item is available before accepting your order.` },
        store.prep_minutes && { t: `Ready in ~${store.prep_minutes} minutes`, d: 'Usual preparation time once your order is accepted.' },
        { t: 'Track every order', d: 'Get a live status link the moment you order — and sign in to see your history.' },
    ].filter(Boolean).slice(0, 7);

    const last = customer?.orders?.[0];
    const stage = last ? ({ pending: 0, accepted: 1, preparing: 1, ready: 2, out_for_delivery: 2, completed: 3, delivered: 3 }[last.status] ?? 1) : 1;

    return (
        <StorePage store={store} shop={shop} saved={saved} customer={customer} ratingSummary={rs} preview={preview} show={show} maxQty={limits.max_qty} active="home" title={`${store.name}${store.city ? ` — ${store.city}` : ''}`}>
            <Head><meta name="description" content={store.description || `Order from ${store.name}${store.city ? ` in ${store.city}` : ''}.`} /></Head>

            {/* ── hero ── */}
            <section className="vqsf-hero" id="top">
                <div className="wrap vqsf-hero-grid">
                    <div>
                        {status && (
                            <div className="vqsf-pill" data-reveal="">
                                <span className={`vqsf-live ${status.dot ? `vqsf-live--${status.dot}` : ''}`} />
                                <span>{status.text}{store.prep_minutes && store.open_now ? ` · ~${store.prep_minutes} min` : ''}</span>
                            </div>
                        )}
                        <h1 data-reveal="" style={{ '--d': '60ms' }}><Headline text={store.name} /></h1>
                        {store.description && <p className="lede" data-reveal="" style={{ '--d': '120ms' }}>{store.description}</p>}
                        {totals.products > 0 && (
                            <button type="button" className="vqsf-bigsearch" onClick={() => frame.search()} data-reveal="" style={{ '--d': '180ms' }}>
                                <Search size={19} strokeWidth={1.8} />
                                <span className="ph">{categories.slice(0, 3).map((c) => c.name).join(', ') || `Search ${totals.products} products`}…</span>
                                <span className="go">Search</span>
                            </button>
                        )}
                        {chips.length > 0 && <div className="vqsf-chips" data-reveal="" style={{ '--d': '240ms' }}>{chips.map((c) => <span key={c} className="vqsf-chip"><Check size={12} strokeWidth={2.4} />{c}</span>)}</div>}
                        <div className="vqsf-ctas" data-reveal="" style={{ '--d': '300ms' }}>
                            <Link href={productsUrl(store.slug)} className="vqsf-btn vqsf-btn--accent">{browseOnly ? 'Browse the catalogue' : 'Shop everything'}<ArrowRight size={15} strokeWidth={2} /></Link>
                            {onOffer.length > 0 ? <a href="#deals" className="vqsf-btn vqsf-btn--line">See today’s deals</a>
                                : store.phone ? <a href={`tel:${store.phone}`} className="vqsf-btn vqsf-btn--line"><Phone size={15} />Call us</a> : null}
                        </div>
                    </div>

                    <div className="vqsf-collage" data-reveal="" style={{ '--d': '140ms' }}>
                        <PhotoSlot slot="hero" max={6} label="Hero photos" place="tr" />
                        {photos.length >= 3 ? (
                            <div className="vqsf-collage-grid">
                                <Tile p={photos[0]} cls="vqsf-tile--a" plx="0.10" />
                                <div className="col"><Tile p={photos[1]} cls="vqsf-tile--b" plx="-0.07" /><Tile p={photos[2]} cls="vqsf-tile--c" plx="0.17" /></div>
                            </div>
                        ) : photos.length >= 1 ? (
                            <Tile p={photos[0]} cls="vqsf-tile--wide" plx="0.08" />
                        ) : (
                            <div className="vqsf-today">
                                <Mark store={store} size={58} radius={19} />
                                <div className="vqsf-eyebrow" style={{ margin: 0 }}>Today</div>
                                <div className="big">{todayKey && hours ? hoursText(hours[todayKey]) : 'Hours not listed'}</div>
                                {(store.address || store.city) && <p><MapPin size={16} />{[store.address, store.city].filter(Boolean).join(', ')}</p>}
                                {store.phone && <p><Phone size={16} />{store.phone}</p>}
                                {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer" className="vqsf-btn vqsf-btn--sm vqsf-btn--line" style={{ justifySelf: 'start' }}>Get directions<ArrowRight size={14} /></a>}
                            </div>
                        )}
                        {photos.length > 0 && store.prep_minutes && (
                            <div className="vqsf-float vqsf-float--l"><span className="ic"><Clock size={14} strokeWidth={2} /></span><span><b>{store.prep_minutes} minutes</b><small>{store.delivery ? 'to your gate' : 'to be ready'}</small></span></div>
                        )}
                        {photos.length > 0 && (rs.average ? (
                            <button type="button" className="vqsf-float vqsf-float--r" onClick={frame.rate}><Star size={13} fill="currentColor" strokeWidth={0} style={{ color: 'var(--accent)' }} /><span style={{ fontSize: 12, fontWeight: 700 }}>{rs.average.toFixed(1)} · {plural(rs.count, 'review')}</span></button>
                        ) : best ? (
                            <div className="vqsf-float vqsf-float--r"><span className="vqsf-live" /><span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round(best.percent)}% off · {best.name}</span></div>
                        ) : null)}
                    </div>
                </div>
            </section>

            {/* ── marquee ── */}
            {strip.length >= 3 && (
                <section className="vqsf-marquee" aria-label="About ordering">
                    <div className="vqsf-marquee-track">
                        {[0, 1].map((k) => <div key={k} aria-hidden={k === 1}>{strip.map((t) => <span key={t} className="it">{t}</span>)}</div>)}
                    </div>
                </section>
            )}

            {totals.products === 0 && (
                <section className="vqsf-sec"><div className="wrap"><div className="vqsf-empty"><span className="ic"><Package size={21} /></span><b>Products are on their way</b><span>{store.name} has not published anything yet. Please check back soon{store.phone ? ' or call them' : ''}.</span></div></div></section>
            )}

            {/* ── deals ── */}
            {onOffer.length > 0 && (
                <section className="vqsf-sec" id="deals" style={{ paddingBottom: 'clamp(56px,7vw,96px)' }}>
                    <div className="wrap">
                        <SectionHead eyebrow={best ? best.name : 'On offer now'} accent title="Today’s deals">
                            {best?.ends_at ? <Countdown endsAt={best.ends_at} /> : null}
                            <SeeAll href={productsUrl(store.slug, { offer: 1 })}>All offers</SeeAll>
                        </SectionHead>
                        <div className="vqsf-grid vqsf-grid--deals">{onOffer.slice(0, 4).map(card('deal'))}</div>
                    </div>
                </section>
            )}

            {/* ── ready basket ── */}
            {canAdd && basket.length >= 3 && (
                <section className="vqsf-sec vqsf-sec--deep">
                    <div className="vqsf-glow" data-parallax="0.06" />
                    <div className="wrap vqsf-basket">
                        <div data-reveal="">
                            <div className="vqsf-eyebrow">{featured ? 'Our picks' : 'Quick basket'}</div>
                            <h2 className="vqsf-h2" style={{ lineHeight: 0.98 }}>The favourites,<br /><span className="serif">in one tap</span>.</h2>
                            <p className="vqsf-lede">{plural(basket.length, 'thing')} people buy from {store.name} most, already in one basket. Add the lot — then change it however you like.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 'clamp(24px,3.4vw,34px)' }}>
                                <button type="button" ref={basketRef} className="vqsf-btn" onClick={addBasket}><ShoppingCart size={16} strokeWidth={2} />Add all · {money(basketTotal, sym)}</button>
                                <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Final price confirmed at checkout</span>
                            </div>
                        </div>
                        <div className="vqsf-mini-grid">
                            {basket.map((p, i) => (
                                <div key={p.id} data-reveal="" style={{ '--d': `${i * 50}ms` }}>
                                    <Link href={productUrl(store.slug, p.id)} className="vqsf-mini" data-parallax={[0.04, -0.03, 0.06, -0.05, 0.03, -0.04][i]}>
                                        <div className="im"><Pic src={p.image_url} name={p.name} show={show} /></div>
                                        <div className="tx"><b>{p.name}</b><small>{money(p.price, sym)}</small></div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── categories ── */}
            {categories.length > 1 && (
                <section className="vqsf-sec" id="categories" style={{ paddingBottom: 'clamp(48px,6vw,84px)' }}>
                    <div className="wrap">
                        <SectionHead eyebrow="Aisles" title="Shop by category">
                            <Link href={productsUrl(store.slug)} className="vqsf-textlink">All {categories.length} aisles</Link>
                            <button type="button" className="vqsf-round" aria-label="Scroll left" onClick={() => railRef.current?.scrollBy({ left: -480, behavior: 'smooth' })}><ArrowRight size={17} style={{ transform: 'rotate(180deg)' }} /></button>
                            <button type="button" className="vqsf-round" aria-label="Scroll right" onClick={() => railRef.current?.scrollBy({ left: 480, behavior: 'smooth' })}><ArrowRight size={17} /></button>
                        </SectionHead>
                    </div>
                    <div className="vqsf-rail" ref={railRef}>
                        {categories.map((c) => (
                            <Link key={c.id} href={productsUrl(store.slug, { category: c.id })} className="vqsf-cat">
                                <span className="im"><Pic src={c.image_url} name={c.name} show={show} /></span>
                                <span className="lb"><span style={{ minWidth: 0 }}><b>{c.name}</b><small>{plural(c.count, 'item')}</small></span><ArrowRight size={14} strokeWidth={2} /></span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── collections ── */}
            {tiles.length >= 2 && (
                <section className="vqsf-sec vqsf-sec--tint" id="collections">
                    <div className="wrap">
                        <div data-reveal="" style={{ maxWidth: 620, marginBottom: 'clamp(28px,4vw,50px)' }}>
                            <div className="vqsf-eyebrow">{offers.length ? 'Offers & aisles' : 'Collections'}</div>
                            <h2 className="vqsf-h2">Picked out<br /><span className="serif">for you</span>.</h2>
                            <p className="vqsf-lede">{offers.length ? `${plural(offers.length, 'offer')} running right now, and the aisles worth a look.` : `The aisles at ${store.name} worth a look.`}</p>
                        </div>
                        <div className="vqsf-cols">
                            {tiles.map((t, i) => (
                                <div key={t.key} className={i === 0 ? 'wide' : ''} data-reveal="" style={{ '--d': `${i * 60}ms` }}>
                                    <Link href={t.href} className={`vqsf-col ${i === 0 ? 'vqsf-col--big' : ''}`}>
                                        <span className={`bg ${t.img ? '' : 'bg--grad'}`} data-parallax={i === 0 ? '0.09' : '0.06'}>{t.img && <img src={t.img} alt="" loading="lazy" />}</span>
                                        {t.pct ? <span className="big-pct">−{t.pct}%</span> : null}
                                        <span className="tx">
                                            <span className="k">{t.kicker}</span>
                                            <span className="t">{t.title}</span>
                                            <span className="l">{t.line}</span>
                                            {i === 0 && <span className="go">{t.pct ? 'Shop the offer' : 'Explore'}<ArrowRight size={14} /></span>}
                                        </span>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── popular ── */}
            {picks.length > 0 && (
                <section className="vqsf-sec">
                    <div className="wrap">
                        <SectionHead eyebrow={featured ? 'Our picks' : 'From the shop'} title={featured ? 'Popular right now' : 'What we sell'}>
                            <SeeAll href={productsUrl(store.slug)}>View the whole shop</SeeAll>
                        </SectionHead>
                        <div className="vqsf-grid">{picks.map(card('grid'))}</div>
                    </div>
                </section>
            )}

            {/* ── new ── */}
            {fresh.length > 0 && (
                <section className="vqsf-sec" style={{ paddingTop: 0 }}>
                    <div className="wrap">
                        <SectionHead eyebrow="Just in" title="New arrivals"><SeeAll href={productsUrl(store.slug, { sort: 'newest' })}>See what’s new</SeeAll></SectionHead>
                        <div className="vqsf-grid">{fresh.map(card('grid'))}</div>
                    </div>
                </section>
            )}

            {/* ── reasons ── */}
            {!browseOnly && totals.products > 0 && (
                <section className="vqsf-sec vqsf-sec--tint">
                    <div className="wrap">
                        <div data-reveal="" style={{ maxWidth: 560, marginBottom: 'clamp(32px,4.5vw,58px)' }}>
                            <div className="vqsf-eyebrow">Why order here</div>
                            <h2 className="vqsf-h2">{reasons.length === 7 ? 'Seven' : ['', '', 'Two', 'Three', 'Four', 'Five', 'Six'][reasons.length]} reasons the<br />cart stays here.</h2>
                        </div>
                        <div className="vqsf-reasons">
                            {reasons.map((r, i) => (
                                <div key={r.t} className="vqsf-reason" data-reveal="" style={{ '--d': `${(i % 3) * 70}ms` }}>
                                    <div className="no">{String(i + 1).padStart(2, '0')}</div>
                                    <h3>{r.t}</h3>
                                    <p>{r.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── delivery / pickup ── */}
            {!browseOnly && (store.delivery || store.pickup) && (
                <section className="vqsf-sec" id="delivery" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="vqsf-orb" data-parallax="0.05" />
                    <div className="wrap vqsf-deliv">
                        <div data-reveal="">
                            <div className="vqsf-eyebrow">{store.delivery ? 'Delivery' : 'Pickup'}</div>
                            <h2 className="vqsf-h2" style={{ lineHeight: 0.98 }}>
                                {store.prep_minutes ? <>Ready in<br /><span className="serif">{store.prep_minutes} minutes</span>.</> : store.delivery ? <>Brought<br /><span className="serif">to your door</span>.</> : <>Ready<br /><span className="serif">when you are</span>.</>}
                            </h2>
                            <p className="vqsf-lede" style={{ maxWidth: 440 }}>
                                {store.delivery_note || (store.delivery
                                    ? `${store.name} packs your order as soon as it is accepted${store.pickup ? ' — or collect it yourself from the shop' : ''}. You will get a live status link the moment you order.`
                                    : `Order ahead and collect from ${store.address || store.name}. We will have it ready.`)}
                            </p>

                            {last ? (
                                <a href={last.status_url} className="vqsf-track">
                                    <div className="row">
                                        <span className="av"><Bike size={18} /></span>
                                        <div style={{ flex: 1, minWidth: 0 }}><div className="t1">Your order #{last.number}</div><div className="t2">{last.created_at} · {money(last.total, last.currency_symbol || sym)}</div></div>
                                        <span className="eta"><small style={{ textTransform: 'capitalize' }}>{String(last.status).replace(/_/g, ' ')}</small></span>
                                    </div>
                                    <div className="bar"><i style={{ width: `${[14, 45, 75, 100][stage]}%` }} /></div>
                                    <div className="steps"><span className={stage >= 0 ? 'on' : ''}>Placed</span><span className={stage >= 1 ? 'on' : ''}>Preparing</span><span className={stage >= 3 ? 'on' : ''}>{last.fulfilment === 'pickup' ? 'Collected' : 'Delivered'}</span></div>
                                </a>
                            ) : (
                                <Link href="/order-lookup" className="vqsf-track">
                                    <div className="row">
                                        <span className="av"><Package size={18} /></span>
                                        <div style={{ flex: 1, minWidth: 0 }}><div className="t1">Track any order live</div><div className="t2">Every order gets its own status page</div></div>
                                        <ArrowRight size={16} style={{ color: 'var(--ink-3)' }} />
                                    </div>
                                    <div className="bar"><i className="anim" /></div>
                                    <div className="steps"><span>Placed</span><span>Preparing</span><span>{store.delivery ? 'At your gate' : 'Ready'}</span></div>
                                </Link>
                            )}

                            {(zones.length > 0 || store.pickup) && (
                                <ul className="vqsf-zones">
                                    {store.pickup && <li><span><em>Pickup · {store.address || store.city || 'in store'}</em></span><span>Free</span></li>}
                                    {zones.slice(0, 7).map((z) => <li key={z.name}><span><em>{z.name}</em></span><span>{Number(z.fee) > 0 ? money(z.fee, sym) : 'Free'}{Number(z.min_order) > 0 ? ` · min ${money(z.min_order, sym)}` : ''}</span></li>)}
                                    {zones.length === 0 && store.delivery && <li><span><em>Delivery</em></span><span>{minFee > 0 ? money(minFee, sym) : 'Free'}</span></li>}
                                </ul>
                            )}
                        </div>
                        <div data-reveal="" style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
                            <PhotoSlot slot="delivery" label="Delivery photo" />
                            <SlotShow slot="delivery">{(imgs) => (imgs.length ? <div className="vqsf-delphoto"><img src={imgs[0]} alt="" loading="lazy" /><span className="tag"><Truck size={14} />{zones.length ? `Delivering to ${plural(zones.length, 'area')}` : 'We deliver'}</span></div> : (
                            <div className="vqsf-rings" data-parallax="-0.05">
                                <div className="r r0" /><div className="r r1" /><div className="r r2" /><div className="r r3" /><div className="r r4" />
                                <div className="o o1"><i /></div><div className="o o2"><i /></div><div className="o o3"><i /></div>
                                <div className="c"><Mark store={store} size={58} radius={19} /><small>{store.address || store.city || store.name}</small></div>
                                {zones.slice(0, 4).map((z) => <span key={z.name} className="lbl">{z.name}</span>)}
                            </div>
                            ))}</SlotShow>
                        </div>
                    </div>
                </section>
            )}

            {/* ── reviews ── */}
            {reviews.length > 0 && (
                <section className="vqsf-sec vqsf-sec--tint">
                    <div className="wrap">
                        <SectionHead eyebrow={rs.average ? `${rs.average.toFixed(1)} ★ · ${plural(rs.count, 'review')}` : 'Customers'} title="What customers say">
                            <button type="button" className="vqsf-seelink" onClick={frame.rate}>{customer?.has_reviewed ? 'Edit your review' : 'Write a review'}<Star size={14} /></button>
                        </SectionHead>
                        <div className="vqsf-revs">
                            {reviews.map((r, i) => (
                                <div key={r.id} data-reveal="" style={{ '--d': `${i * 80}ms` }}>
                                    <figure className="vqsf-rev">
                                        <Stars value={r.rating} />
                                        <blockquote>{r.review}</blockquote>
                                        <figcaption><span className="av">{initials(r.customer_name)}</span><span><b>{r.customer_name}</b><small>{r.is_verified ? 'Verified order' : 'Customer'}{r.created_at ? ` · ${String(r.created_at).split(' ')[0]}` : ''}</small></span></figcaption>
                                    </figure>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── visit ── */}
            <section className="vqsf-sec" id="visit" style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)' }}>
                <div className="vqsf-panel" data-reveal="">
                    <div className="vqsf-panel-grid">
                        <div>
                            <div className="vqsf-eyebrow">Visit us</div>
                            <h2>{store.address ? <>Find us on<br />{store.address.split(',')[0]}.</> : <>Come say<br />hello.</>}</h2>
                            <ul className="vqsf-contact">
                                {(store.address || store.city) && <li><MapPin size={17} />{[store.address, store.city].filter(Boolean).join(', ')}</li>}
                                {store.phone && <li><Phone size={17} /><a href={`tel:${store.phone}`}>{store.phone}</a></li>}
                                {store.email && <li><Mail size={17} /><a href={`mailto:${store.email}`}>{store.email}</a></li>}
                                {store.prep_minutes && <li><Clock size={17} />Orders are usually ready in about {store.prep_minutes} minutes.</li>}
                            </ul>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
                                {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer" className="vqsf-btn"><MapPin size={16} />Get directions</a>}
                                {store.phone && <a href={`tel:${store.phone}`} className="vqsf-btn vqsf-btn--line"><Phone size={16} />Call</a>}
                            </div>
                        </div>
                        <div style={{ background: 'var(--surface)', position: 'relative' }}>
                            <PhotoSlot slot="visit" label="Shop front photo" place="tr" />
                            <SlotShow slot="visit">{(imgs) => (imgs.length ? <div className="vqsf-visitphoto"><img src={imgs[0]} alt="" loading="lazy" /></div> : null)}</SlotShow>
                            <div className="vqsf-eyebrow" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CalendarClock size={13} />Opening hours</div>
                            {hours ? (
                                <ul className="vqsf-hours">{DAYS.map((d) => <li key={d} className={todayKey === d ? 'today' : ''}><span>{DAY_LABEL[d]}{todayKey === d ? ' · today' : ''}</span><span>{hoursText(hours[d])}</span></li>)}</ul>
                            ) : <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>Opening hours are not listed.</p>}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── closing ── */}
            {totals.products > 0 && (
                <section style={{ padding: '0 var(--pad) clamp(64px,9vw,120px)' }}>
                    <div className="vqsf-cta-end" data-reveal="">
                        <h2>{browseOnly ? 'Seen something you like?' : 'Ready when you are.'}<br /><span>{customer ? `Welcome back, ${customer.name.split(' ')[0]}.` : browseOnly ? `Get in touch with ${store.name} to buy.` : 'Sign in once and your orders follow you.'}</span></h2>
                        <div className="acts">
                            <Link href={productsUrl(store.slug)} className="vqsf-btn">{browseOnly ? 'Browse the catalogue' : 'Start shopping'}<ArrowRight size={15} /></Link>
                            {!browseOnly && <button type="button" className="vqsf-btn vqsf-btn--line" onClick={frame.account}>{customer ? 'Your orders' : 'Sign in'}</button>}
                        </div>
                        <p><ShieldCheck size={12} style={{ verticalAlign: '-2px' }} /> Orders are requests, confirmed by {store.name}. Nothing is charged online.</p>
                    </div>
                </section>
            )}
        </StorePage>
    );
}

function Tile({ p, cls, plx }) {
    const inner = (
        <>
            <img src={p.src} alt={p.name} loading="eager" />
            {p.price && <span className="cap"><b>{p.name}</b><i>{p.price}</i></span>}
        </>
    );
    return p.href
        ? <Link href={p.href} className={`vqsf-tile ${cls}`} data-parallax={plx}>{inner}</Link>
        : <div className={`vqsf-tile ${cls}`} data-parallax={plx}>{inner}</div>;
}

/** Restaurants keep the menu-first template; every other business gets the VenQore storefront. */
export default function Home(props) {
    return props.template === 'restaurant' ? <RestaurantHome {...props} /> : <HomeDefault {...props} />;
}
