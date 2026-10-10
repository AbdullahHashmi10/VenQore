import React, { useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Plus, Star } from 'lucide-react';
import { HeartBtn, Pic, Price, Stepper, money, needsChoice, productUrl, savePct } from '@/Components/Storefront/venqore/kit';

/** A small copy of the photo flies into the cart button. Decoration only. */
export function flyToCart(srcEl) {
    try {
        if (!srcEl || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const target = document.querySelector('.vqsf-cartbtn');
        if (!target) return;
        const a = srcEl.getBoundingClientRect(); const b = target.getBoundingClientRect();
        if (!a.width || !b.width) return;
        const ghost = srcEl.cloneNode(true);
        Object.assign(ghost.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: 0, zIndex: 9999, pointerEvents: 'none', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,.35)' });
        document.body.appendChild(ghost);
        const dx = b.left + b.width / 2 - (a.left + a.width / 2); const dy = b.top + b.height / 2 - (a.top + a.height / 2);
        const anim = ghost.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 70}px) scale(.5)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(.06)`, opacity: 0.2 },
        ], { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' });
        anim.onfinish = () => { ghost.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); };
    } catch { /* decoration only */ }
}

/**
 * The product card used on the home page, the shop grid and "you may also like".
 * variant="deal" is the larger daily-deal card with a full-width add button.
 */
export default function ProductCard({ item, store, shop, saved, show = true, canAdd = true, browseOnly = false, variant = 'grid', delay = 0 }) {
    const ref = useRef(null);
    const sym = store.currency_symbol;
    const href = productUrl(store.slug, item.id);
    const out = item.stock === 'out';
    const pct = savePct(item.price, item.was_price);
    const choice = needsChoice(item);
    const inCart = shop ? shop.qtyOf(item.id) : 0;
    const deal = variant === 'deal';
    const restaurant = usePage().props?.template === 'restaurant';
    const add = () => { if (shop.add(item, [], 1)) flyToCart(ref.current?.querySelector('.vqsf-pic')); };
    const flag = pct ? `${pct}% off` : item.featured ? 'Featured' : item.is_new ? 'New' : null;

    let action;
    if (browseOnly) action = <Link href={href} className="vqsf-add" aria-label={`View ${item.name}`}><ArrowUpRight size={16} /></Link>;
    else if (out) action = null;
    else if (choice) action = <Link href={href} className="vqsf-optlink">Options<ArrowUpRight size={13} /></Link>;
    else if (inCart > 0) action = <Stepper value={inCart} max={50} label={item.name} onChange={(q) => shop.nudge(item.id, q - inCart)} />;
    else if (!deal) action = <button type="button" className="vqsf-add" disabled={!canAdd} onClick={add} aria-label={`Add ${item.name} to cart`}><Plus size={16} strokeWidth={2} /></button>;

    return (
        <div data-reveal="" style={{ '--d': `${delay}ms` }}>
            <article ref={ref} className={`vqsf-card ${deal ? 'vqsf-card--deal' : ''} ${out ? 'is-out' : ''}`}>
                <div className="media">
                    <span className="ph" data-parallax="0.04"><Pic src={item.image_url} name={item.name} show={show} /></span>
                    {flag && <span className={`flag ${pct ? '' : 'flag--plain'}`}>{flag}</span>}
                    {deal && pct && <span className="sweep" aria-hidden="true" />}
                    {saved && <HeartBtn on={saved.has(item.id)} name={item.name} onClick={() => saved.toggle(item)} />}
                    {out && <span className="soldout">Sold out</span>}
                </div>
                <div className="body">
                    <div className="meta">
                        {item.featured && <Star size={11} fill="currentColor" strokeWidth={0} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        {item.category && <b>{item.category}</b>}
                        {item.category && <span>·</span>}
                        {out ? <span>Sold out</span> : item.stock === 'low' ? <span className="low">Only {item.left} left</span> : <span>In stock</span>}
                    </div>
                    <h3><Link href={href}>{item.name}</Link></h3>
                    {(item.description || item.unit) && <div className="sub">{item.description || `per ${item.unit}`}</div>}
                    <div className="foot">
                        <Price item={item} sym={sym} />
                        {action}
                    </div>
                    {deal && !browseOnly && !out && !choice && inCart === 0 && (
                        <button type="button" className="vqsf-addwide" disabled={!canAdd} onClick={add}><Plus size={15} strokeWidth={2} />{restaurant ? 'Add to order' : 'Add to cart'}</button>
                    )}
                    {deal && pct && <div style={{ marginTop: 12 }}><div className="vqsf-bar"><i style={{ width: `${Math.min(100, pct * 2)}%` }} /></div><div className="vqsf-barnote">You save {money(Number(item.was_price) - Number(item.price), sym)}</div></div>}
                </div>
            </article>
        </div>
    );
}
