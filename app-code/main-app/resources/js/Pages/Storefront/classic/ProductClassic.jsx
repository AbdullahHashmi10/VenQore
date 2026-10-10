import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Check, Clock, ShieldCheck, Store as StoreIcon, Truck } from 'lucide-react';
import StoreLayout from '@/Components/Storefront/StoreLayout';
import ProductCard from '@/Components/Storefront/ProductCard';
import { Crumbs, Picture, SectionHead, Stepper, cartUrl, productsUrl, savePct, shopUrl } from '@/Components/Storefront/parts';
import { useShopCart, modsDelta } from '@/lib/shopCart';
import { ProductStage, flyToCart } from '@/Components/Storefront/fx';
import { fmt as money } from '@/Components/Storefront/parts';

export default function Product({ store, preview, show_images, limits, rating_summary, customer, item, selected_option, related }) {
    const shop = useShopCart(store.slug, limits.max_qty);
    const browseOnly = store.customer_mode === 'catalogue';
    const sym = store.currency_symbol;
    const options = item.options || [];
    const hasOptions = options.length > 1;
    const [optId, setOptId] = useState(() => (selected_option && options.some((o) => String(o.id) === String(selected_option)) ? selected_option : (options.find((o) => o.stock !== 'out') || options[0])?.id));
    const cur = useMemo(() => {
        if (!hasOptions) return { id: item.id, label: null, price: item.price, was_price: item.was_price, stock: item.stock, left: item.left, image_url: item.image_url, addons: item.addons || [] };
        const o = options.find((x) => String(x.id) === String(optId)) || options[0];
        return { id: o.id, label: o.label, price: o.price, was_price: o.was_price, stock: o.stock, left: o.left, image_url: o.image_url || item.image_url, addons: o.addons || [] };
    }, [hasOptions, options, optId, item]);

    const [picked, setPicked] = useState({});
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    // add-on defaults reset whenever the chosen variant changes
    const resetKey = String(cur.id);
    const [seenKey, setSeenKey] = useState(null);
    if (seenKey !== resetKey) {
        const start = {};
        cur.addons.forEach((g) => { start[g.id] = g.options.filter((o) => o.is_default).map((o) => o.id); });
        setPicked(start); setSeenKey(resetKey); setAdded(false);
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
        if (!thenGo) flyToCart(document.querySelector('.sf-stage-fallback .sf-pic'));
        if (thenGo) router.visit(cartUrl(store.slug)); else setAdded(true);
    };

    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Product', name: item.name, description: item.description || undefined,
        image: item.image_url ? [item.image_url] : undefined, category: item.category || undefined,
        offers: { '@type': 'Offer', priceCurrency: store.currency_code, price: Number(cur.price).toFixed(2), availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: typeof window !== 'undefined' ? window.location.href : undefined, seller: { '@type': 'Organization', name: store.name } },
    };

    return (
        <StoreLayout store={store} shop={shop} ratingSummary={rating_summary} customer={customer} preview={preview} active="shop" title={`${item.name} · ${store.name}`}>
            <Head title={`${item.name} — ${store.name}`}>
                <meta name="description" content={(item.description || `Order ${item.name} from ${store.name}.`).slice(0, 155)} />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>
            <Crumbs trail={[
                { label: store.name, href: shopUrl(store.slug) },
                { label: 'Shop', href: productsUrl(store.slug) },
                ...(item.category ? [{ label: item.category, href: productsUrl(store.slug, { category: item.category_id }) }] : []),
                { label: item.name },
            ]} />

            <div className="sf-pdp">
                <div className="sf-pdp-media">
                    <ProductStage imageUrl={show_images ? cur.image_url : null} name={item.name}>
                        <Picture item={{ ...item, image_url: cur.image_url }} showImages={show_images} className="sf-pic--xl" eager />
                    </ProductStage>
                    {pct && <em className="sf-flag sf-flag--offer sf-pdp-flag">Save {pct}%</em>}
                </div>

                <div className="sf-pdp-info">
                    {item.category && <Link href={productsUrl(store.slug, { category: item.category_id })} className="sf-card-cat">{item.category}</Link>}
                    <h1>{item.name}</h1>
                    <div className="sf-pdp-price">
                        <b>{money(unit, sym)}</b>
                        {cur.was_price && <s>{money(cur.was_price, sym)}</s>}
                        <span className="sf-unit">per {item.unit}</span>
                    </div>
                    {out ? <p className="sf-stock sf-stock--out">Sold out right now</p> : cur.stock === 'low' ? <p className="sf-stock sf-stock--low">Only {cur.left} left</p> : null}

                    {hasOptions && (
                        <fieldset className="sf-opts">
                            <legend>Choose one</legend>
                            <div>
                                {options.map((o) => <button type="button" key={o.id} className={String(o.id) === String(optId) ? 'on' : ''} disabled={o.stock === 'out'} aria-pressed={String(o.id) === String(optId)} onClick={() => setOptId(o.id)}>{o.label}{o.stock === 'out' ? ' · sold out' : ''}</button>)}
                            </div>
                        </fieldset>
                    )}

                    {!browseOnly && cur.addons.map((g) => (
                        <fieldset key={g.id} className="sf-addons">
                            <legend>{g.name}<small>{g.required || g.min_select > 0 ? 'Required' : 'Optional'}{g.max_select > 1 ? ` · up to ${g.max_select}` : ''}</small></legend>
                            {g.options.map((o) => {
                                const on = (picked[g.id] || []).includes(o.id);
                                return (
                                    <label key={o.id} className={on ? 'on' : ''}>
                                        <input type={g.max_select === 1 ? 'radio' : 'checkbox'} name={`g${g.id}`} checked={on} onChange={() => toggle(g, o)} />
                                        <span className="sf-addon-box" aria-hidden="true">{on && <Check size={13} strokeWidth={3} />}</span>
                                        <span className="sf-addon-name">{o.name}</span>
                                        {Number(o.price_delta) !== 0 && <span className="sf-addon-price">{Number(o.price_delta) > 0 ? '+' : '−'}{money(Math.abs(o.price_delta), sym)}</span>}
                                    </label>
                                );
                            })}
                        </fieldset>
                    ))}

                    {browseOnly ? (
                        <div className="sf-buy">{store.phone ? <a className="sf-btn sf-btn--lg" href={`tel:${store.phone}`}>Call to order</a> : <p className="sf-muted">Contact {store.name} to ask about this item.</p>}</div>
                    ) : (
                        <div className="sf-buy">
                            <Stepper value={qty} onChange={(v) => setQty(Math.max(1, Math.min(limits.max_qty, v)))} min={1} max={limits.max_qty} label={item.name} />
                            <button type="button" className="sf-btn sf-btn--lg sf-buy-main" disabled={!canBuy} onClick={() => addToCart(false)}>
                                {out ? 'Sold out' : !store.accepting_orders ? 'Not taking orders' : missing.length ? `Choose ${missing[0].name}` : `Add to cart · ${money(unit * qty, sym)}`}
                            </button>
                            <button type="button" className="sf-btn sf-btn--ghost sf-btn--lg" disabled={!canBuy} onClick={() => addToCart(true)}>Buy now</button>
                        </div>
                    )}
                    {added && <p className="sf-added"><Check size={16} /> Added to your bag. <Link href={cartUrl(store.slug)}>View cart</Link> or <Link href={productsUrl(store.slug)}>keep shopping</Link>.</p>}

                    {item.description && <div className="sf-pdp-desc"><h2>About this product</h2><p>{item.description}</p></div>}

                    <ul className="sf-assure">
                        {store.pickup && <li><StoreIcon size={18} /><span><b>Pickup</b>Collect from {store.address || store.name}.</span></li>}
                        {store.delivery && <li><Truck size={18} /><span><b>Delivery</b>{(store.delivery_zones || []).length ? 'Choose your area at checkout.' : Number(store.delivery_charge) > 0 ? `Delivery charge ${money(store.delivery_charge, sym)}.` : 'Free delivery.'}</span></li>}
                        {store.prep_minutes && <li><Clock size={18} /><span><b>Preparation</b>Usually about {store.prep_minutes} minutes.</span></li>}
                        {!browseOnly && <li><ShieldCheck size={18} /><span><b>Confirmed by {store.name}</b>They check availability before accepting. Nothing is charged online.</span></li>}
                    </ul>
                </div>
            </div>

            {related.length > 0 && (
                <section className="sf-section">
                    <SectionHead eyebrow="Keep looking" title="You may also like" href={productsUrl(store.slug, item.category_id ? { category: item.category_id } : {})} />
                    <div className="sf-grid">{related.map((it, i) => <ProductCard key={it.id} item={it} index={i} store={store} shop={shop} showImages={show_images} canAdd={store.accepting_orders} browseOnly={browseOnly} />)}</div>
                </section>
            )}

            {!browseOnly && (
                <div className="sf-stickybuy" aria-hidden={!canBuy && !out}>
                    <div><small>{item.name}</small><b>{money(unit * qty, sym)}</b></div>
                    <button type="button" className="sf-btn" disabled={!canBuy} onClick={() => addToCart(false)}>{out ? 'Sold out' : missing.length ? 'Choose options' : 'Add to cart'}</button>
                </div>
            )}
        </StoreLayout>
    );
}
