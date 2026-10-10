import React, { useRef } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { flyToCart } from '@/Components/Storefront/venqore/ProductCard';
import { HeartBtn, Pic, Price, Stepper, needsChoice, productUrl, savePct } from '@/Components/Storefront/venqore/kit';

const DIET = { veg: 'Veg', vegan: 'Vegan', halal: 'Halal', spicy: 'Spicy', gluten_free: 'Gluten free', contains_nuts: 'Nuts', contains_dairy: 'Dairy' };

/**
 * One dish on a restaurant menu: name, tags and description on the left, the photo on the right with
 * the add button sitting on its corner — how people expect a food menu to read.
 */
export default function Dish({ item, store, shop, saved, show = true, canAdd = true, browseOnly = false, delay = 0 }) {
    const ref = useRef(null);
    const sym = store.currency_symbol;
    const href = productUrl(store.slug, item.id);
    const out = item.stock === 'out';
    const pct = savePct(item.price, item.was_price);
    const choice = needsChoice(item);
    const inCart = shop ? shop.qtyOf(item.id) : 0;
    const photo = show && item.image_url;
    const add = () => { if (shop.add(item, [], 1)) flyToCart(ref.current?.querySelector('.vqsf-pic') || ref.current); };

    let action = null;
    if (!browseOnly && !out) {
        if (choice) action = <Link href={href} className="vqsf-optlink">Customise<ArrowUpRight size={13} /></Link>;
        else if (inCart > 0) action = <Stepper value={inCart} max={50} label={item.name} onChange={(q) => shop.nudge(item.id, q - inCart)} />;
        else action = <button type="button" className="vqsf-add" disabled={!canAdd} onClick={add} aria-label={`Add ${item.name} to your order`}><Plus size={16} strokeWidth={2.2} /></button>;
    }

    return (
        <div data-reveal="" style={{ '--d': `${delay}ms` }}>
            <article ref={ref} className={`vqsf-dish ${out ? 'is-out' : ''} ${photo ? 'has-photo' : ''}`}>
                <div className="tx">
                    <div className="tags">
                        {pct ? <em className="hot">{pct}% off</em> : item.featured ? <em className="hot">Popular</em> : item.is_new ? <em>New</em> : null}
                        {!out && item.stock === 'low' && <em className="low">Only {item.left} left</em>}
                        {out && <em className="out">Sold out</em>}
                        {(item.tags || []).slice(0, 3).map((t) => <em key={t} className={`diet diet--${t}`}>{DIET[t] || t}</em>)}
                    </div>
                    <h3><Link href={href}>{item.name}</Link></h3>
                    {item.description && <p>{item.description}</p>}
                    <div className="ft">
                        <Price item={item} sym={sym} />
                        {!photo && action}
                    </div>
                </div>
                {photo && (
                    <div className="ph">
                        <Link href={href} aria-label={`View ${item.name}`} className="im"><Pic src={item.image_url} name={item.name} show /></Link>
                        {saved && <HeartBtn on={saved.has(item.id)} name={item.name} onClick={() => saved.toggle(item)} />}
                        {action && <span className="act">{action}</span>}
                    </div>
                )}
            </article>
        </div>
    );
}
