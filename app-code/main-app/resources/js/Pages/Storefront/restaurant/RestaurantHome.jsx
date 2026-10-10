import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Bike, CalendarCheck, Clock, MapPin, Phone, Plus, ShoppingBag, Star, Store as StoreIcon, UtensilsCrossed } from 'lucide-react';
import { StorePage, Mark, hoursText, DAYS, DAY_LABEL } from '@/Components/Storefront/venqore/StoreFrame';
import ReserveTable from '@/Components/Storefront/venqore/ReserveTable';
import { flyToCart } from '@/Components/Storefront/venqore/ProductCard';
import { Pic, Stepper, frame, money, needsChoice, plural, productUrl, productsUrl, savePct, useSaved } from '@/Components/Storefront/venqore/kit';
import { useShopCart } from '@/lib/shopCart';
import { initials } from '@/Components/Commerce/shop';
import { PhotoSlot, Slideshow, SlotShow } from '@/Components/Storefront/venqore/photos';

const DIET = { veg: 'V', vegan: 'VG', halal: 'Halal', spicy: 'Spicy', gluten_free: 'GF', contains_nuts: 'Nuts', contains_dairy: 'Dairy' };
const KEY = { veg: 'V vegetarian', vegan: 'VG vegan', gluten_free: 'GF gluten free', halal: 'Halal', spicy: 'Spicy', contains_nuts: 'Contains nuts', contains_dairy: 'Contains dairy' };
const scrollTo = (id) => (e) => { e?.preventDefault?.(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

function statusOf(store) {
    const g = store.hours_guidance;
    if (g?.is_on_break) return { dot: 'warn', text: `On a break${g.opens_at ? ` · back ${g.opens_at}` : ''}` };
    if (store.open_now === true) return { dot: '', text: `Open now${g?.closes_at ? ` · until ${g.closes_at}` : ''}` };
    if (store.open_now === false) return { dot: 'off', text: `Closed${g?.opens_at ? ` · opens ${g.opens_at}` : ''}` };
    return null;
}

/** The add control for one dish: quick add, stepper once in the order, or "choose" when it has options. */
function AddDish({ item, shop, canAdd, browseOnly, from }) {
    if (browseOnly || item.stock === 'out') return null;
    const inCart = shop.qtyOf(item.id);
    if (needsChoice(item)) return <Link href={productUrl(shop.slug, item.id)} className="vqsf-r-add vqsf-r-add--text">Choose<ArrowUpRight size={13} /></Link>;
    if (inCart > 0) return <Stepper value={inCart} max={50} label={item.name} onChange={(q) => shop.nudge(item.id, q - inCart)} />;
    return <button type="button" className="vqsf-r-add" disabled={!canAdd} aria-label={`Add ${item.name} to your order`} onClick={(e) => { if (shop.add(item, [], 1)) flyToCart(from?.() || e.currentTarget); }}><Plus size={15} strokeWidth={2.2} /></button>;
}

/** A line on a printed menu: name · · · · price, the description underneath. */
function MenuLine({ item, store, shop, canAdd, browseOnly }) {
    const sym = store.currency_symbol;
    const out = item.stock === 'out';
    const pct = savePct(item.price, item.was_price);
    const from = (item.options?.length || 0) > 1 && item.price_from != null;
    return (
        <li className={`vqsf-mline ${out ? 'is-out' : ''}`}>
            <div className="top">
                <Link href={productUrl(store.slug, item.id)} className="nm">{item.name}</Link>
                {(item.tags || []).slice(0, 2).map((t) => <i key={t} className={`tg tg--${t}`}>{DIET[t] || t}</i>)}
                {item.featured && !pct && <i className="tg tg--pop">★</i>}
                <span className="dots" aria-hidden="true" />
                <span className="pr">{from && <small>from </small>}{money(item.price_from ?? item.price, sym)}{item.was_price && <s>{money(item.was_price, sym)}</s>}</span>
            </div>
            <div className="bot">
                <p>{out ? 'Finished for today.' : item.description || ' '}</p>
                <AddDish item={item} shop={{ ...shop, slug: store.slug }} canAdd={canAdd} browseOnly={browseOnly} />
            </div>
        </li>
    );
}

/**
 * Restaurant & café home. Laid out the way restaurant sites read: a full-screen photo with the name,
 * order + book always one tap away, the kitchen's story, signature dishes, a real menu with courses,
 * a booking band, guests' words, and how to find us.
 */
export default function RestaurantHome(props) {
    const { store, preview, show_images: show, limits, rating_summary: rs, customer, menu = [], picks, picks_are_featured: featured, on_offer: onOffer, offers, totals, can_reserve: canReserve } = props;
    const shop = useShopCart(store.slug, limits.max_qty);
    const saved = useSaved(store.slug);
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
    const [course, setCourse] = useState(menu[0]?.id);
    const activeCourse = menu.find((c) => c.id === course) || menu[0];

    // Photography: the banner first, then dish photos.
    const dishPhotos = useMemo(() => picks.concat(onOffer, menu.flatMap((m) => m.items)).filter((p, i, a) => show && p.image_url && a.findIndex((x) => x.id === p.id) === i), [picks, onOffer, menu, show]);
    const own = store.images || {};
    const heroImg = own.hero?.[0] || store.banner_url || dishPhotos[0]?.image_url || null;
    const storyImgs = dishPhotos.filter((p) => p.image_url !== heroImg).slice(0, 2);
    const signature = (featured ? picks : dishPhotos).slice(0, 6);
    const reserveImg = dishPhotos[3]?.image_url || dishPhotos[1]?.image_url || heroImg;

    const words = String(store.name || '').trim().split(/\s+/);
    const nameA = words.length > 1 ? words.slice(0, -1).join(' ') : store.name;
    const nameB = words.length > 1 ? words[words.length - 1] : '';

    const info = [
        todayKey && hours && { icon: Clock, k: 'Today', v: hoursText(hours[todayKey]) },
        (store.address || store.city) && { icon: MapPin, k: 'Find us', v: store.address || store.city, href: store.map_url },
        store.phone && { icon: Phone, k: 'Call', v: store.phone, href: `tel:${store.phone}` },
        rs.average && { icon: Star, k: `${plural(rs.count, 'review')}`, v: `${rs.average.toFixed(1)} out of 5`, onClick: frame.rate },
    ].filter(Boolean).slice(0, 4);

    const nav = [
        { id: 'shop', label: 'Menu', href: productsUrl(store.slug) },
        { id: 'dinein', label: 'Dine in', href: '#dinein', onClick: scrollTo('dinein') },
        ...(!browseOnly ? [{ id: 'order', label: 'Order online', href: '#order', onClick: scrollTo('order') }] : []),
        { id: 'visit', label: 'Visit', href: '#visit', onClick: scrollTo('visit') },
    ];

    return (
        <StorePage store={store} shop={shop} saved={saved} customer={customer} ratingSummary={rs} preview={preview} show={show} maxQty={limits.max_qty} active="home" overImage={!!heroImg}
            title={`${store.name}${store.city ? ` — ${store.city}` : ''} · Menu, order online${canReserve ? ' & book a table' : ''}`} nav={nav}>
            <Head><meta name="description" content={store.description || `See the menu and order from ${store.name}${store.city ? ` in ${store.city}` : ''}.`} /></Head>

            {/* ── 1. full-screen hero ── */}
            <section className={`vqsf-rhero ${heroImg ? '' : 'vqsf-rhero--plain'}`} id="top">
                <div className="bg" aria-hidden="true"><SlotShow slot="hero" fallback={heroImg ? [heroImg] : []}>{(imgs) => <Slideshow images={imgs} interval={7000} eager />}</SlotShow></div>
                <PhotoSlot slot="hero" max={6} label="Main photo" place="br" />
                <div className="wrap vqsf-rhero-in">
                    <div className="kick" data-reveal="">
                        {status && <span className="st"><span className={`vqsf-live ${status.dot ? `vqsf-live--${status.dot}` : ''}`} />{status.text}</span>}
                        {store.city && <span>{store.city}</span>}
                    </div>
                    <h1 data-reveal="" style={{ '--d': '80ms' }}>{nameA}{nameB && <> <em>{nameB}</em></>}</h1>
                    {store.description && <p data-reveal="" style={{ '--d': '160ms' }}>{store.description}</p>}
                    <div className="acts" data-reveal="" style={{ '--d': '240ms' }}>
                        <Link href={productsUrl(store.slug)} className="vqsf-btn vqsf-btn--accent">{browseOnly ? 'View the menu' : 'Order online'}<ArrowRight size={15} /></Link>
                        <a href="#dinein" onClick={scrollTo('dinein')} className="vqsf-btn vqsf-btn--glass"><CalendarCheck size={16} />{canReserve ? 'Book a table' : 'Dine in'}</a>
                    </div>
                    {info.length > 0 && (
                        <ul className="bar" data-reveal="" style={{ '--d': '320ms' }}>
                            {info.map((x) => {
                                const Ic = x.icon;
                                const body = <><Ic size={16} /><span><small>{x.k}</small><b>{x.v}</b></span></>;
                                return <li key={x.k}>{x.onClick ? <button type="button" onClick={x.onClick}>{body}</button> : x.href ? <a href={x.href} target={x.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{body}</a> : <span className="row">{body}</span>}</li>;
                            })}
                        </ul>
                    )}
                </div>
                <a href="#story" onClick={scrollTo('story')} className="cue" aria-label="Scroll down"><span /></a>
            </section>

            {totals.products === 0 && (
                <section className="vqsf-sec"><div className="wrap"><div className="vqsf-empty"><b>The menu is on its way</b><span>{store.name} has not published its menu yet{store.phone ? ' — call us to order' : ''}.</span></div></div></section>
            )}

            {/* ── 2. story ── */}
            <section className="vqsf-sec vqsf-rstory" id="story">
                <div className="wrap grid">
                    <div data-reveal="">
                        <div className="vqsf-eyebrow vqsf-eyebrow--accent">Welcome</div>
                        <h2 className="vqsf-rh2">{store.description ? <>Cooked fresh,<br /><em>served with care.</em></> : <>Good food,<br /><em>made the way it should be.</em></>}</h2>
                        <p className="lede">{store.delivery_note || store.description || `${store.name} cooks every order when you place it${store.prep_minutes ? ' — usually ready in about ' + store.prep_minutes + ' minutes' : ''}. Eat in, take it away, or have it brought to your door.`}</p>
                        <dl className="facts">
                            {store.prep_minutes && <div><dt>{store.prep_minutes}<small>min</small></dt><dd>Kitchen to you</dd></div>}
                            {totals.products > 0 && <div><dt>{totals.products}</dt><dd>Dishes on the menu</dd></div>}
                            {rs.average ? <div><dt>{rs.average.toFixed(1)}<small>★</small></dt><dd>From {plural(rs.count, 'guest')}</dd></div> : zones.length ? <div><dt>{zones.length}</dt><dd>Delivery areas</dd></div> : null}
                        </dl>
                    </div>
                    <div className="pics" data-reveal="" style={{ '--d': '100ms' }}>
                        <SlotShow slot="story">{(imgs, mine) => (mine
                            ? imgs.map((u, i) => <div key={u} className={`pic pic--${i}`} data-parallax={i ? '0.08' : '-0.04'}><img src={u} alt="" loading="lazy" /></div>)
                            : storyImgs.length ? storyImgs.map((p, i) => <Link key={p.id} href={productUrl(store.slug, p.id)} className={`pic pic--${i}`} data-parallax={i ? '0.08' : '-0.04'}><img src={p.image_url} alt={p.name} loading="lazy" /><span>{p.name}</span></Link>)
                                : <div className="pic pic--mark"><Mark store={store} size={96} radius={30} /></div>)}</SlotShow>
                        <PhotoSlot slot="story" max={2} label="Welcome photos" slideshow={false} />
                    </div>
                </div>
            </section>

            {/* ── 3. signature dishes ── */}
            {signature.length >= 2 && (
                <section className="vqsf-sec vqsf-sec--tint" style={{ paddingBottom: 'clamp(48px,6vw,90px)' }}>
                    <div className="wrap">
                        <div className="vqsf-sechead" data-reveal="">
                            <div><div className="vqsf-eyebrow vqsf-eyebrow--accent">{featured ? 'Signature dishes' : 'From the kitchen'}</div><h2 className="vqsf-rh2">What guests <em>come back for</em></h2></div>
                            <div className="side"><Link href={productsUrl(store.slug)} className="vqsf-seelink">Full menu<ArrowRight size={15} /></Link></div>
                        </div>
                    </div>
                    <div className="vqsf-rail vqsf-sig">
                        {signature.map((it) => {
                            const pct = savePct(it.price, it.was_price);
                            return (
                                <article key={it.id} className="vqsf-sigcard" data-reveal="">
                                    <Link href={productUrl(store.slug, it.id)} className="im"><Pic src={it.image_url} name={it.name} show={show} />{pct && <span className="fl">{pct}% off</span>}</Link>
                                    <div className="tx">
                                        <h3><Link href={productUrl(store.slug, it.id)}>{it.name}</Link></h3>
                                        {it.description && <p>{it.description}</p>}
                                        <div className="ft"><b>{(it.options?.length || 0) > 1 && it.price_from != null ? 'from ' : ''}{money(it.price_from ?? it.price, sym)}</b><AddDish item={it} shop={{ ...shop, slug: store.slug }} canAdd={canAdd} browseOnly={browseOnly} /></div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── 4. the menu ── */}
            {menu.length > 0 && (
                <section className="vqsf-sec vqsf-rmenu" id="menu">
                    <div className="wrap">
                        <div className="head" data-reveal="">
                            <div className="vqsf-eyebrow vqsf-eyebrow--accent">The menu</div>
                            <h2 className="vqsf-rh2">Our <em>menu</em></h2>
                            {menu.length > 1 && (
                                <div className="tabs" role="tablist" aria-label="Courses">
                                    {menu.map((c) => <button key={c.id} type="button" role="tab" aria-selected={activeCourse?.id === c.id} className={activeCourse?.id === c.id ? 'on' : ''} onClick={() => setCourse(c.id)}>{c.name}</button>)}
                                </div>
                            )}
                        </div>
                        {activeCourse && (
                            <div className="card" role="tabpanel" key={activeCourse.id}>
                                <ul className="lines">{activeCourse.items.map((it) => <MenuLine key={it.id} item={it} store={store} shop={shop} canAdd={canAdd} browseOnly={browseOnly} />)}</ul>
                                <div className="more">
                                    {activeCourse.count > activeCourse.items.length && <Link href={`${productsUrl(store.slug)}#cat-${activeCourse.id}`} className="vqsf-textlink">All {activeCourse.count} in {activeCourse.name}<ArrowRight size={13} style={{ verticalAlign: '-2px', marginLeft: 5 }} /></Link>}
                                    <Link href={productsUrl(store.slug)} className="vqsf-btn vqsf-btn--md">View the full menu<ArrowRight size={15} /></Link>
                                </div>
                                {(() => { const used = [...new Set(menu.flatMap((c) => c.items.flatMap((it) => it.tags || [])))].filter((t) => KEY[t]); return used.length ? <p className="key">{used.map((t) => KEY[t]).join(' · ')}</p> : null; })()}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ── 5. order online ── */}
            {!browseOnly && totals.products > 0 && (
                <section className="vqsf-rorder" id="order">
                    <div className="wrap grid">
                        <div data-reveal="">
                            <div className="vqsf-eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>Order online</div>
                            <h2 className="vqsf-rh2">Eat in, take away<br /><em>or we’ll bring it.</em></h2>
                            <p>Order straight from our kitchen — no middleman. {store.prep_minutes ? `Usually ready in about ${store.prep_minutes} minutes.` : ''} Pay {[store.payments?.cod && 'cash on delivery', store.payments?.pickup && 'when you collect', store.payments?.bank && 'by bank transfer'].filter(Boolean).join(', ') || 'as you prefer'}.</p>
                            {best && <span className="deal"><span className="vqsf-live" />{Math.round(best.percent)}% off · {best.name}</span>}
                        </div>
                        <div className="opts">
                            {store.delivery && (
                                <Link href={productsUrl(store.slug)} className="opt" data-reveal="">
                                    <SlotShow slot="delivery">{(imgs) => (imgs.length ? <span className="ph"><img src={imgs[0]} alt="" loading="lazy" /></span> : null)}</SlotShow>
                                    <PhotoSlot slot="delivery" label="Delivery photo" />
                                    <span className="ic"><Bike size={22} /></span>
                                    <b>Delivery</b>
                                    <span>{zones.length ? `${plural(zones.length, 'area')} · from ${money(minFee, sym)}` : minFee > 0 ? `${money(minFee, sym)} delivery` : 'Free delivery'}{Number(store.min_order_amount) > 0 ? ` · min ${money(store.min_order_amount, sym)}` : ''}</span>
                                    <i>Start your order<ArrowRight size={14} /></i>
                                </Link>
                            )}
                            {store.pickup && (
                                <Link href={productsUrl(store.slug)} className="opt" data-reveal="" style={{ '--d': '80ms' }}>
                                    <SlotShow slot="takeaway">{(imgs) => (imgs.length ? <span className="ph"><img src={imgs[0]} alt="" loading="lazy" /></span> : null)}</SlotShow>
                                    <PhotoSlot slot="takeaway" label="Takeaway photo" />
                                    <span className="ic"><ShoppingBag size={22} /></span>
                                    <b>Takeaway</b>
                                    <span>{store.prep_minutes ? `Ready in ~${store.prep_minutes} min` : 'Collect when ready'} · {store.address ? store.address.split(',')[0] : 'from our counter'}</span>
                                    <i>Order for pickup<ArrowRight size={14} /></i>
                                </Link>
                            )}
                            {/* Dine in: book online when the floor takes requests, otherwise walk in or call */}
                            {canReserve ? (
                                <a href="#dinein" onClick={scrollTo('dinein')} className="opt" data-reveal="" style={{ '--d': '160ms' }}>
                                    <SlotShow slot="dinein">{(imgs) => (imgs.length ? <span className="ph"><img src={imgs[0]} alt="" loading="lazy" /></span> : null)}</SlotShow>
                                    <PhotoSlot slot="dinein" max={3} label="Dine-in photos" />
                                    <span className="ic"><UtensilsCrossed size={22} /></span>
                                    <b>Dine in</b>
                                    <span>Book a table for today or the next two weeks{todayKey && hours ? ` · today ${hoursText(hours[todayKey])}` : ''}</span>
                                    <i>Book a table<ArrowRight size={14} /></i>
                                </a>
                            ) : (
                                <a href="#dinein" onClick={scrollTo('dinein')} className="opt" data-reveal="" style={{ '--d': '160ms' }}>
                                    <SlotShow slot="dinein">{(imgs) => (imgs.length ? <span className="ph"><img src={imgs[0]} alt="" loading="lazy" /></span> : null)}</SlotShow>
                                    <PhotoSlot slot="dinein" max={3} label="Dine-in photos" />
                                    <span className="ic"><UtensilsCrossed size={22} /></span>
                                    <b>Dine in</b>
                                    <span>Walk in and we’ll seat you{todayKey && hours ? ` · today ${hoursText(hours[todayKey])}` : ''}</span>
                                    <i>Plan your visit<ArrowRight size={14} /></i>
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 6. dine in ── */}
            <section className="vqsf-sec vqsf-rbook" id="dinein">
                <div className="wrap grid">
                    <div className="photo" data-reveal="">
                        <SlotShow slot="dinein" fallback={reserveImg ? [reserveImg] : []}>{(imgs) => <Slideshow images={imgs} className="vqsf-show--bg" />}</SlotShow>
                        <PhotoSlot slot="dinein" max={3} label="Dine-in photos" />
                        <div className="cap">
                            <div className="vqsf-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Dine in</div>
                            <h2 className="vqsf-rh2">{canReserve ? <>Save us<br /><em>a table.</em></> : <>Pull up<br /><em>a chair.</em></>}</h2>
                            <p>{canReserve ? 'Birthdays, family dinners or just a quiet meal — tell us when you’re coming and we’ll have your table ready.' : 'Come in and eat with us. Walk in any time we’re open — for big groups, call ahead and we’ll set a table.'}</p>
                            {todayKey && hours && <span className="hrs"><Clock size={14} />Today {hoursText(hours[todayKey])}</span>}
                        </div>
                    </div>
                    <div data-reveal="" style={{ '--d': '80ms' }} id="reserve">
                        {canReserve ? <ReserveTable store={store} preview={preview} customer={customer} /> : (
                            <div className="vqsf-reserve vqsf-walkin">
                                <div className="vqsf-reserve-h"><Clock size={16} />This week</div>
                                {hours ? <ul className="wk">{DAYS.map((d) => <li key={d} className={todayKey === d ? 'today' : ''}><span>{DAY_LABEL[d]}</span><i aria-hidden="true" /><span>{hoursText(hours[d])}</span></li>)}</ul> : <p className="muted">Call us for today’s hours.</p>}
                                {(store.address || store.city) && <p className="addr"><MapPin size={16} />{[store.address, store.city].filter(Boolean).join(', ')}</p>}
                                <div className="acts">
                                    {store.phone && <a href={`tel:${store.phone}`} className="vqsf-btn vqsf-btn--accent"><Phone size={16} />Call to book</a>}
                                    {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer" className="vqsf-btn vqsf-btn--line"><MapPin size={16} />Directions</a>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── 7. guests ── */}
            {reviews.length > 0 && (
                <section className="vqsf-sec vqsf-sec--tint vqsf-rquotes">
                    <div className="wrap">
                        <div className="vqsf-sechead" data-reveal="">
                            <div><div className="vqsf-eyebrow vqsf-eyebrow--accent">{rs.average ? `${rs.average.toFixed(1)} ★ from ${plural(rs.count, 'guest')}` : 'Guests'}</div><h2 className="vqsf-rh2">Kind <em>words</em></h2></div>
                            <div className="side"><button type="button" className="vqsf-seelink" onClick={frame.rate}>{customer?.has_reviewed ? 'Edit your review' : 'Leave a review'}<Star size={14} /></button></div>
                        </div>
                        <div className="qs">
                            {reviews.map((r, i) => (
                                <figure key={r.id} data-reveal="" style={{ '--d': `${i * 80}ms` }}>
                                    <span className="mk" aria-hidden="true">“</span>
                                    <blockquote>{r.review}</blockquote>
                                    <figcaption><span className="av">{initials(r.customer_name)}</span><b>{r.customer_name}</b><span className="st">{'★'.repeat(r.rating)}</span></figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 8. visit ── */}
            <section className="vqsf-sec vqsf-rvisit" id="visit">
                <div className="wrap grid">
                    <div data-reveal="">
                        <div className="vqsf-eyebrow vqsf-eyebrow--accent">Visit</div>
                        <h2 className="vqsf-rh2">{store.address ? <>Find us on<br /><em>{store.address.split(',')[0]}</em></> : <>Come<br /><em>say hello</em></>}</h2>
                        <ul className="vqsf-contact">
                            {(store.address || store.city) && <li><MapPin size={17} />{[store.address, store.city].filter(Boolean).join(', ')}</li>}
                            {store.phone && <li><Phone size={17} /><a href={`tel:${store.phone}`}>{store.phone}</a></li>}
                            {store.pickup && <li><StoreIcon size={17} />Takeaway counter open during kitchen hours</li>}
                        </ul>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
                            {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer" className="vqsf-btn"><MapPin size={16} />Get directions</a>}
                            {canReserve ? <a href="#dinein" onClick={scrollTo('dinein')} className="vqsf-btn vqsf-btn--line"><CalendarCheck size={16} />Book a table</a>
                                : store.phone ? <a href={`tel:${store.phone}`} className="vqsf-btn vqsf-btn--line"><Phone size={16} />Call us</a> : null}
                        </div>
                    </div>
                    <div className="hours" data-reveal="" style={{ '--d': '80ms', position: 'relative' }}>
                        <PhotoSlot slot="visit" label="Restaurant front photo" place="tr" />
                        <SlotShow slot="visit">{(imgs) => (imgs.length ? <div className="vqsf-visitphoto"><img src={imgs[0]} alt="" loading="lazy" /></div> : null)}</SlotShow>
                        <h3>Opening hours</h3>
                        {hours ? <ul>{DAYS.map((d) => <li key={d} className={todayKey === d ? 'today' : ''}><span>{DAY_LABEL[d]}</span><i aria-hidden="true" /><span>{hoursText(hours[d])}</span></li>)}</ul>
                            : <p className="muted">Opening hours are not listed{store.phone ? ' — give us a call' : ''}.</p>}
                    </div>
                </div>
            </section>
        </StorePage>
    );
}
