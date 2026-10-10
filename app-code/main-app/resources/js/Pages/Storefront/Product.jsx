import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Check, Clock, ShieldCheck, Store as StoreIcon, Truck } from 'lucide-react';
import { StorePage } from '@/Components/Storefront/venqore/StoreFrame';
import ProductCard, { flyToCart } from '@/Components/Storefront/venqore/ProductCard';
import { HeartBtn, Pic, SectionHead, SeeAll, Stepper, cartUrl, frame, money, productsUrl, savePct, shopUrl, useSaved } from '@/Components/Storefront/venqore/kit';
import { ProductStage } from '@/Components/Storefront/fx';
import { useShopCart, modsDelta } from '@/lib/shopCart';

function ProductDefault({ store, preview, show_images: show, limits, rating_summary: rs, customer, item, selected_option: selectedOption, related, template }) {
    const restaurant = template === 'restaurant';
    const shop = useShopCart(store.slug, limits.max_qty);
    const saved = useSaved(store.slug);
    const browseOnly = store.customer_mode === 'catalogue';
    const sym = store.currency_symbol;
    const options = item.options || [];
    const hasOptions = options.length > 1;
    const [optId, setOptId] = useState(() => (selectedOption && options.some((o) => String(o.id) === String(selectedOption)) ? selectedOption : (options.find((o) => o.stock !== 'out') || options[0])?.id));
    const cur = useMemo(() => {
        if (!hasOptions) return { id: item.id, label: null, price: item.price, was_price: item.was_price, stock: item.stock, left: item.left, image_url: item.image_url, addons: item.addons || [] };
        const o = options.find((x) => String(x.id) === String(optId)) || options[0];
        return { id: o.id, label: o.label, price: o.price, was_price: o.was_price, stock: o.stock, left: o.left, image_url: o.image_url || item.image_url, addons: o.addons || [] };
    }, [hasOptions, options, optId, item]);

    const [picked, setPicked] = useState({});
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [seenKey, setSeenKey] = useState(null);
    if (seenKey !== String(cur.id)) {
        const start = {};
        cur.addons.forEach((g) => { start[g.id] = g.options.filter((o) => o.is_default).map((o) => o.id); });
        setPicked(start); setSeenKey(String(cur.id)); setAdded(false);
    }

    const chosen = cur.addons.flatMap((g) => g.options.filter((o) => (picked[g.id] || []).includes(o.id)));
    const missing = cur.addons.filter((g) => (picked[g.id] || []).length < Math.max(g.min_select || 0, g.required ? 1 : 0));
    const unit = Number(cur.price) + modsDelta(chosen);
    const out = cur.stock === 'out';
    const canBuy = !browseOnly && store.accepting_orders && !out && missing.length === 0;
    const pct = savePct(cur.price, cur.was_price);

    const toggle = (g, o) => setPicked((c) => {
        const now = c[g.id] || [];
        if (g.max_select === 1) return { ...c, [g.id]: now.includes(o.id) ? (g.required ? now : []) : [o.id] };
        if (now.includes(o.id)) return { ...c, [g.id]: now.filter((x) => x !== o.id) };
        if (g.max_select > 0 && now.length >= g.max_select) return c;
        return { ...c, [g.id]: [...now, o.id] };
    });
    const addToCart = (thenGo) => {
        const ok = shop.add({ id: cur.id, name: item.name, label: cur.label, image_url: cur.image_url }, chosen.map((o) => ({ id: o.id, name: o.name, price_delta: o.price_delta })), qty);
        if (!ok) return;
        if (thenGo) { router.visit(cartUrl(store.slug)); return; }
        flyToCart(document.querySelector('.vqsf-pdp-frame .vqsf-pic'));
        setAdded(true);
    };
    const buyLabel = out ? 'Sold out' : !store.accepting_orders ? 'Not taking orders' : missing.length ? `Choose ${missing[0].name}` : `${restaurant ? 'Add to order' : 'Add to cart'} · ${money(unit * qty, sym)}`;

    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Product', name: item.name, description: item.description || undefined,
        image: item.image_url ? [item.image_url] : undefined, category: item.category || undefined,
        offers: { '@type': 'Offer', priceCurrency: store.currency_code, price: Number(cur.price).toFixed(2), availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: typeof window !== 'undefined' ? window.location.href : undefined, seller: { '@type': 'Organization', name: store.name } },
    };

    return (
        <StorePage store={store} shop={shop} saved={saved} customer={customer} ratingSummary={rs} preview={preview} show={show} maxQty={limits.max_qty} active="shop" sticky={!browseOnly} title={`${item.name} — ${store.name}`}>
            <Head>
                <meta name="description" content={(item.description || `Order ${item.name} from ${store.name}.`).slice(0, 155)} />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>

            <section className="vqsf-pagehead" style={{ paddingBottom: 0 }}>
                <div className="orb" data-parallax="0.18" />
                <div className="wrap">
                    <nav className="vqsf-crumbs" aria-label="Breadcrumb" style={{ marginBottom: 0 }}>
                        <Link href={shopUrl(store.slug)}>Home</Link><span>/</span>
                        <Link href={productsUrl(store.slug)}>{restaurant ? 'Menu' : 'Shop'}</Link><span>/</span>
                        {item.category && <><Link href={productsUrl(store.slug, { category: item.category_id })}>{item.category}</Link><span>/</span></>}
                        <span aria-current="page">{item.name}</span>
                    </nav>
                </div>
            </section>

            <div className="wrap">
                <div className="vqsf-pdp">
                    <div className="vqsf-pdp-media" data-reveal="">
                        <div className="vqsf-pdp-frame">
                            <ProductStage imageUrl={show ? cur.image_url : null} name={item.name}>
                                <Pic src={cur.image_url} name={item.name} show={show} eager />
                            </ProductStage>
                            {pct && <span className="flag">Save {pct}%</span>}
                            <HeartBtn on={saved.has(item.id)} name={item.name} onClick={() => saved.toggle(item)} />
                        </div>
                    </div>

                    <div className="vqsf-pdp-info" data-reveal="" style={{ '--d': '80ms' }}>
                        {item.category && <Link href={productsUrl(store.slug, { category: item.category_id })} className="vqsf-eyebrow vqsf-eyebrow--accent" style={{ display: 'inline-block', margin: 0 }}>{item.category}</Link>}
                        <h1>{item.name}</h1>
                        <div className="vqsf-pdp-price">
                            <b>{money(unit, sym)}</b>
                            {cur.was_price && <s>{money(cur.was_price, sym)}</s>}
                            {item.unit && <small>per {item.unit}</small>}
                        </div>
                        {out ? <p className="vqsf-stock vqsf-stock--out"><span className="vqsf-live vqsf-live--off" />Sold out right now</p>
                            : cur.stock === 'low' ? <p className="vqsf-stock vqsf-stock--low"><span className="vqsf-live vqsf-live--warn" />Only {cur.left} left</p>
                                : <p className="vqsf-stock"><span className="vqsf-live" />In stock{store.prep_minutes ? ` · ready in ~${store.prep_minutes} min` : ''}</p>}

                        {hasOptions && (
                            <div className="vqsf-pdp-block">
                                <fieldset>
                                    <legend>Choose one</legend>
                                    <div className="vqsf-opts">
                                        {options.map((o) => <button type="button" key={o.id} className={String(o.id) === String(optId) ? 'on' : ''} disabled={o.stock === 'out'} aria-pressed={String(o.id) === String(optId)} onClick={() => setOptId(o.id)}>{o.label}{o.stock === 'out' ? ' · sold out' : ''}</button>)}
                                    </div>
                                </fieldset>
                            </div>
                        )}

                        {!browseOnly && cur.addons.map((g) => (
                            <div key={g.id} className="vqsf-pdp-block">
                                <fieldset>
                                    <legend>{g.name}<small>{g.required || g.min_select > 0 ? 'Required' : 'Optional'}{g.max_select > 1 ? ` · up to ${g.max_select}` : ''}</small></legend>
                                    <div className="vqsf-addons">
                                        {g.options.map((o) => {
                                            const on = (picked[g.id] || []).includes(o.id);
                                            return (
                                                <label key={o.id} className={on ? 'on' : ''}>
                                                    <input type={g.max_select === 1 ? 'radio' : 'checkbox'} name={`g${g.id}`} checked={on} onChange={() => toggle(g, o)} />
                                                    <span className="box" aria-hidden="true">{on && <Check size={13} strokeWidth={3} />}</span>
                                                    <span className="nm">{o.name}</span>
                                                    {Number(o.price_delta) !== 0 && <span className="pr">{Number(o.price_delta) > 0 ? '+' : '−'}{money(Math.abs(o.price_delta), sym)}</span>}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            </div>
                        ))}

                        {browseOnly ? (
                            <div className="vqsf-buy">{store.phone ? <a className="vqsf-btn" href={`tel:${store.phone}`}>Call to order</a> : <p className="muted">Contact {store.name} to ask about this item.</p>}</div>
                        ) : (
                            <div className="vqsf-buy">
                                <Stepper large value={qty} onChange={(v) => setQty(Math.max(1, Math.min(limits.max_qty, v)))} min={1} max={limits.max_qty} label={item.name} />
                                <button type="button" className="vqsf-btn" disabled={!canBuy} onClick={() => addToCart(false)}>{buyLabel}</button>
                                <button type="button" className="vqsf-btn vqsf-btn--line" style={{ flex: '0 0 auto', minWidth: 0 }} disabled={!canBuy} onClick={() => addToCart(true)}>Buy now</button>
                            </div>
                        )}
                        {added && <p className="vqsf-added"><span className="ic"><Check size={13} strokeWidth={2.6} /></span>Added to your cart. <button type="button" className="vqsf-textlink" style={{ padding: 0, color: 'var(--accent)', textDecoration: 'underline' }} onClick={frame.cart}>View cart</button> or <Link href={productsUrl(store.slug)}>keep shopping</Link>.</p>}

                        {item.description && (
                            <div className="vqsf-pdp-block"><h2>About this product</h2><p className="vqsf-desc">{item.description}</p></div>
                        )}

                        <div className="vqsf-pdp-block">
                            <h2>Getting it</h2>
                            <ul className="vqsf-assure">
                                {store.pickup && <li><StoreIcon size={18} /><span><b>Pickup</b>Collect from {store.address || store.name}.</span></li>}
                                {store.delivery && <li><Truck size={18} /><span><b>Delivery</b>{(store.delivery_zones || []).length ? 'Choose your area at checkout.' : Number(store.delivery_charge) > 0 ? `Delivery charge ${money(store.delivery_charge, sym)}.` : 'Free delivery.'}</span></li>}
                                {store.prep_minutes && <li><Clock size={18} /><span><b>Preparation</b>Usually about {store.prep_minutes} minutes.</span></li>}
                                {!browseOnly && <li><ShieldCheck size={18} /><span><b>Confirmed by {store.name}</b>They check availability before accepting. Nothing is charged online.</span></li>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <section className="vqsf-sec vqsf-sec--tint">
                    <div className="wrap">
                        <SectionHead eyebrow="Keep looking" title="You may also like">
                            <SeeAll href={productsUrl(store.slug, item.category_id ? { category: item.category_id } : {})}>{item.category ? `More in ${item.category}` : 'View the whole shop'}</SeeAll>
                        </SectionHead>
                        <div className="vqsf-grid">{related.map((it, i) => <ProductCard key={it.id} item={it} delay={i * 60} store={store} shop={shop} saved={saved} show={show} canAdd={store.accepting_orders} browseOnly={browseOnly} />)}</div>
                    </div>
                </section>
            )}

            {!browseOnly && (
                <div className="vqsf-stickybuy">
                    <span className="tx"><small>{item.name}{cur.label ? ` · ${cur.label}` : ''}</small><b>{money(unit * qty, sym)}</b></span>
                    <button type="button" className="vqsf-btn vqsf-btn--md" disabled={!canBuy} onClick={() => addToCart(false)}>{out ? 'Sold out' : missing.length ? 'Choose options' : 'Add to cart'}<ArrowRight size={14} /></button>
                </div>
            )}
        </StorePage>
    );
}

/** One product page for every store; restaurants get kitchen wording. */
export default function Product(props) {
    return <ProductDefault {...props} />;
}
