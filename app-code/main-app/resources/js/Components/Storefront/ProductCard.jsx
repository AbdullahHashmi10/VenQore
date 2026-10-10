import React, { useRef } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { flyToCart, useTilt } from '@/Components/Storefront/fx';
import { Picture, PriceTag, Stepper, needsChoice, productUrl, savePct } from '@/Components/Storefront/parts';

/**
 * The one product card used on the home page, the shop page and "you may also like".
 * `shop` is the object from useShopCart; `mode` says whether this store takes orders at all.
 */
export default function ProductCard({ item, store, shop, showImages = true, canAdd = true, browseOnly = false, index = 0 }) {
    const sym = store.currency_symbol;
    const href = productUrl(store.slug, item.id);
    const out = item.stock === 'out';
    const pct = savePct(item.price, item.was_price);
    const choice = needsChoice(item);
    const inCart = shop ? shop.qtyOf(item.id) : 0;
    const ref = useRef(null);
    useTilt(ref);
    const addQuick = () => { if (shop.add(item, [], 1)) flyToCart(ref.current?.querySelector('.sf-pic')); };

    return (
        <article ref={ref} className={`sf-card ${out ? 'is-out' : ''}`} style={{ '--i': Math.min(index, 11) }}>
            <span className="sf-glare" aria-hidden="true" />
            <Link href={href} className="sf-card-media" aria-label={`View ${item.name}`}>
                <Picture item={item} showImages={showImages} />
                <span className="sf-flags">
                    {pct ? <em className="sf-flag sf-flag--offer">−{pct}%</em> : item.featured ? <em className="sf-flag">Featured</em> : item.is_new ? <em className="sf-flag sf-flag--new">New</em> : null}
                </span>
                {out && <span className="sf-soldout">Sold out</span>}
                {!out && item.stock === 'low' && <span className="sf-low">Only {item.left} left</span>}
            </Link>
            <div className="sf-card-body">
                {item.category && <span className="sf-card-cat">{item.category}</span>}
                <h3 className="sf-card-name"><Link href={href}>{item.name}</Link></h3>
                {item.description && <p className="sf-card-desc">{item.description}</p>}
                <div className="sf-card-foot">
                    <div className="sf-card-priceblock">
                        <PriceTag item={item} sym={sym} />
                    </div>
                    {browseOnly ? (
                        <Link href={href} className="sf-round" aria-label={`View ${item.name}`}><ArrowUpRight size={18} /></Link>
                    ) : choice ? (
                        <Link href={href} className="sf-btn sf-btn--sm sf-btn--soft" aria-disabled={out}>{out ? 'Sold out' : 'Options'}<ArrowUpRight size={15} /></Link>
                    ) : inCart > 0 ? (
                        <Stepper small value={inCart} max={50} label={item.name} onChange={(q) => shop.nudge(item.id, q - inCart)} />
                    ) : (
                        <button type="button" className="sf-round" disabled={!canAdd || out} onClick={addQuick} aria-label={`Add ${item.name} to cart`}>
                            <Plus size={19} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
