import React, { useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Clock, Flame, MapPin, Phone, Star, Store as StoreIcon, Truck, Wallet } from 'lucide-react';
import StoreLayout, { StoreMark, hoursText } from '@/Components/Storefront/StoreLayout';
import ProductCard from '@/Components/Storefront/ProductCard';
import DishRow from '@/Components/Storefront/DishRow';
import StoreBadges from '@/Components/Commerce/StoreBadges';
import { SectionHead, fmt as money, productUrl, productsUrl } from '@/Components/Storefront/parts';
import { Badge } from '@/Components/Commerce/shop';
import { useShopCart } from '@/lib/shopCart';
import { HeroScene, Reveal } from '@/Components/Storefront/fx';

function Status({ store }) {
    const g = store.hours_guidance;
    if (g?.is_on_break) return <Badge kind="warn">On break{g.opens_at ? ` · back ${g.opens_at}` : ''}</Badge>;
    if (store.open_now === true) return <Badge kind="ok">Open now{g?.closes_at ? ` · kitchen open until ${g.closes_at}` : ''}</Badge>;
    if (store.open_now === false) return <Badge>Closed{g?.opens_at ? ` · opens ${g.opens_at}` : ''}</Badge>;
    return null;
}

/** Restaurant template, home: a menu you can order from straight away, not a shop window. */
export default function RestaurantHome({ store, preview, show_images, limits, rating_summary, customer, menu, picks, picks_are_featured, on_offer, offers, totals }) {
    const shop = useShopCart(store.slug, limits.max_qty);
    const heroRef = useRef(null);
    const artRef = useRef(null);
    const [live3d, setLive3d] = useState(false);
    const browseOnly = store.customer_mode === 'catalogue';
    const sym = store.currency_symbol;
    const zones = store.delivery_zones || [];
    const hero = store.banner_url
        ? { background: `linear-gradient(100deg, rgb(8 5 3 / .92) 10%, rgb(8 5 3 / .6) 58%, rgb(8 5 3 / .3)), center / cover no-repeat url("${store.banner_url}")` }
        : {};
    const art = picks.filter((p) => p.image_url).slice(0, 3);
    const todayKey = store.hours_guidance?.current_day_key;
    const todayHours = todayKey && store.opening_hours ? hoursText(store.opening_hours[todayKey]) : null;
    const best = offers.length ? offers.reduce((a, b) => (b.percent > a.percent ? b : a)) : null;
    const reviews = (rating_summary.reviews || []).filter((r) => r.review).slice(0, 3);
    const dish = (it) => <DishRow key={it.id} item={it} store={store} shop={shop} showImages={show_images} canAdd={store.accepting_orders} browseOnly={browseOnly} />;
    const delivery = zones.length ? `from ${money(Math.min(...zones.map((z) => z.fee)), sym)}` : Number(store.delivery_charge) > 0 ? money(store.delivery_charge, sym) : 'free';
    const menuUrl = (id) => productsUrl(store.slug) + (id && id !== '_none' ? `#cat-${id}` : '');

    return (
        <StoreLayout store={store} shop={shop} ratingSummary={rating_summary} customer={customer} preview={preview} active="home">
            <Head title={`${store.name}${store.city ? ` — ${store.city}` : ''} · Menu & online ordering`}>
                <meta name="description" content={store.description || `See the menu and order from ${store.name}${store.city ? ` in ${store.city}` : ''}.`} />
            </Head>

            <section ref={heroRef} className={`sf-hero sf-hero--r ${live3d ? 'sf-hero--3d' : ''}`} style={hero}>
                <span className="sf-hero-glow" aria-hidden="true" />
                <div className="sf-hero-in">
                    <div className="sf-hero-top">
                        <StoreMark store={store} size="lg" />
                        <Status store={store} />
                    </div>
                    <span className="sf-r-kicker">{browseOnly ? 'Our menu' : 'Order online'}{store.city ? ` · ${store.city}` : ''}</span>
                    <h1>{store.name}</h1>
                    {store.description && <p className="sf-hero-lede">{store.description}</p>}
                    <StoreBadges badges={store.badges} max={6} size="lg" />
                    <div className="sf-hero-cta">
                        <Link href={productsUrl(store.slug)} className="sf-btn sf-btn--lg">{browseOnly ? 'See the menu' : 'Order now'} <ArrowRight size={18} /></Link>
                        {store.phone && <a href={`tel:${store.phone}`} className="sf-btn sf-btn--glass sf-btn--lg"><Phone size={16} />Call us</a>}
                    </div>
                    <ul className="sf-hero-meta">
                        {rating_summary.average && <li><Star size={15} fill="currentColor" /><b>{rating_summary.average.toFixed(1)}</b> ({rating_summary.count})</li>}
                        {(store.city || store.address) && <li><MapPin size={15} />{store.address || store.city}</li>}
                        {store.prep_minutes && <li><Clock size={15} />Ready in about {store.prep_minutes} min</li>}
                    </ul>
                </div>
                {art.length >= 2 && (
                    <HeroScene heroRef={heroRef} artRef={artRef} onActive={setLive3d} hrefFor={(it) => productUrl(store.slug, it.id)}
                        items={art.map((it) => ({ id: it.id, name: it.name, image_url: it.image_url, priceLabel: money(it.price_from ?? it.price, sym) }))} />
                )}
                {art.length >= 2 ? (
                    <div className="sf-art" ref={artRef}>
                        {art.map((it, i) => (
                            <Link key={it.id} href={productUrl(store.slug, it.id)} className={`sf-art-card sf-art-${i + 1}`}>
                                <img src={it.image_url} alt={it.name} loading="eager" />
                                <span><b>{it.name}</b><i>{money(it.price_from ?? it.price, sym)}</i></span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <aside className="sf-today" aria-label="Today">
                        <span className="sf-eyebrow">Kitchen today</span>
                        <b>{todayHours || 'Hours not listed'}</b>
                        {(store.address || store.city) && <p><MapPin size={15} />{[store.address, store.city].filter(Boolean).join(', ')}</p>}
                        {store.phone && <p><Phone size={15} />{store.phone}</p>}
                        {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer">Get directions <ArrowRight size={14} /></a>}
                    </aside>
                )}
            </section>

            {/* How you can get your food, from their real settings */}
            {!browseOnly && (
                <section className="sf-facts sf-facts--r" aria-label="Ordering details">
                    {store.pickup && <div><span className="sf-fact-ic"><StoreIcon size={18} /></span><span>Takeaway</span><b>{store.prep_minutes ? `Ready in ~${store.prep_minutes} min` : 'Collect from us'}</b></div>}
                    {store.delivery && <div><span className="sf-fact-ic"><Truck size={18} /></span><span>Delivery</span><b>{delivery.charAt(0).toUpperCase() + delivery.slice(1)}</b></div>}
                    {Number(store.min_order_amount) > 0 && <div><span className="sf-fact-ic"><Wallet size={18} /></span><span>Minimum order</span><b>{money(store.min_order_amount, sym)}</b></div>}
                    {todayHours && <div><span className="sf-fact-ic"><Clock size={18} /></span><span>Today</span><b>{todayHours}</b></div>}
                </section>
            )}

            {best && (
                <Link href={productsUrl(store.slug, { offer: 1 })} className="sf-offer">
                    <span className="sf-offer-tag">Deal</span>
                    <b>{best.name}</b>
                    <span>{best.percent}% off{offers.length > 1 ? ` · ${offers.length} deals running` : ''}</span>
                    <span className="sf-offer-go">See the deals <ArrowRight size={15} /></span>
                </Link>
            )}

            {picks_are_featured && picks.length > 0 && (
                <Reveal as="section" className="sf-section">
                    <SectionHead eyebrow="Most loved" title="Popular right now" href={productsUrl(store.slug)} linkText="Full menu" />
                    <div className="sf-r-rail">{picks.map((it, i) => <ProductCard key={it.id} item={it} index={i} store={store} shop={shop} showImages={show_images} canAdd={store.accepting_orders} browseOnly={browseOnly} />)}</div>
                </Reveal>
            )}

            {menu.length > 0 && (
                <Reveal as="section" className="sf-section sf-r-menu">
                    <SectionHead eyebrow="The menu" title="Start with what you fancy" href={productsUrl(store.slug)} linkText="Full menu" />
                    {menu.length > 1 && (
                        <nav className="sf-r-pills" aria-label="Menu sections">
                            {menu.map((c) => <Link key={c.id} href={menuUrl(c.id)}>{c.name}<small>{c.count}</small></Link>)}
                        </nav>
                    )}
                    {menu.map((c) => (
                        <div key={c.id} className="sf-r-group">
                            <header className="sf-r-grouphead">
                                <h3>{c.name}</h3>
                                {c.count > c.items.length && <Link href={menuUrl(c.id)}>See all {c.count} <ArrowRight size={14} /></Link>}
                            </header>
                            <div className="sf-r-dishes">{c.items.map(dish)}</div>
                        </div>
                    ))}
                    <div className="sf-r-more"><Link href={productsUrl(store.slug)} className="sf-btn sf-btn--ghost">Open the full menu ({totals.products}) <ArrowRight size={16} /></Link></div>
                </Reveal>
            )}

            {on_offer.length > 0 && (
                <Reveal as="section" className="sf-section">
                    <SectionHead eyebrow="Save" title="Deals on the menu" href={productsUrl(store.slug, { offer: 1 })} linkText="All deals" />
                    <div className="sf-r-dishes">{on_offer.slice(0, 4).map(dish)}</div>
                </Reveal>
            )}

            {totals.products === 0 && <div className="sf-empty"><b>The menu is on its way.</b><span>{store.name} has not published its menu yet. Please check back soon{store.phone ? ' or call them' : ''}.</span></div>}

            {!browseOnly && totals.products > 0 && (
                <Reveal as="section" className="sf-section">
                    <SectionHead eyebrow="Ordering" title="From our kitchen to you" />
                    <ol className="sf-steps sf-steps--three">
                        <li><em aria-hidden="true">1</em><span className="sf-step-ic"><Flame size={20} /></span><b>Choose your dishes</b><p>Add what you like and customise it. Required choices are marked.</p></li>
                        <li><em aria-hidden="true">2</em><span className="sf-step-ic"><Clock size={20} /></span><b>We confirm and cook</b><p>{store.name} accepts your order{store.prep_minutes ? `, usually ready in about ${store.prep_minutes} minutes` : ''}. You can follow it live.</p></li>
                        <li><em aria-hidden="true">3</em><span className="sf-step-ic">{store.delivery && !store.pickup ? <Truck size={20} /> : <StoreIcon size={20} />}</span><b>{store.pickup && store.delivery ? 'Collect or get it delivered' : store.delivery ? 'Delivered to you' : 'Collect when ready'}</b><p>{[store.payments.cod && 'Cash on delivery', store.payments.pickup && 'pay at pickup', store.payments.bank && 'bank transfer'].filter(Boolean).join(', ').replace(/^./, (c) => c.toUpperCase())}. Nothing is charged online.</p></li>
                    </ol>
                </Reveal>
            )}

            {reviews.length > 0 && (
                <Reveal as="section" className="sf-section">
                    <SectionHead eyebrow="Guests say" title={`${rating_summary.average ? rating_summary.average.toFixed(1) : ''} ★ from ${rating_summary.count} review${rating_summary.count === 1 ? '' : 's'}`} />
                    <div className="sf-reviews">
                        {reviews.map((r) => (
                            <figure key={r.id}>
                                <span className="sf-stars" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}<i>{'★'.repeat(5 - r.rating)}</i></span>
                                <blockquote>{r.review}</blockquote>
                                <figcaption><b>{r.customer_name}</b>{r.is_verified && <small>Verified order</small>}</figcaption>
                            </figure>
                        ))}
                    </div>
                </Reveal>
            )}

            {totals.products > 0 && (
                <Reveal as="section" className="sf-closing">
                    <div><h2>Hungry yet?</h2><p>{browseOnly ? `Have a look at everything ${store.name} serves, then get in touch to order.` : `Order from ${store.name} in a couple of minutes.`}</p></div>
                    <Link href={productsUrl(store.slug)} className="sf-btn sf-btn--lg">{browseOnly ? 'See the menu' : 'Order now'} <ArrowRight size={18} /></Link>
                </Reveal>
            )}
        </StoreLayout>
    );
}
