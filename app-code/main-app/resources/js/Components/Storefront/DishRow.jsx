import React, { useRef } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { flyToCart } from '@/Components/Storefront/fx';
import { Picture, PriceTag, Stepper, needsChoice, productUrl, savePct } from '@/Components/Storefront/parts';

const DIET = {
    en: { veg: 'Veg', vegan: 'Vegan', halal: 'Halal', spicy: 'Spicy', gluten_free: 'Gluten free', contains_nuts: 'Nuts', contains_dairy: 'Dairy' },
    ur: { veg: 'سبزی', vegan: 'ویگن', halal: 'حلال', spicy: 'تیز', gluten_free: 'گلوٹن فری', contains_nuts: 'میوے', contains_dairy: 'ڈیری' },
};

/**
 * One dish on a menu: text on the left, photo on the right with the add button sitting on its corner,
 * the way people expect a food menu to read. Used by the restaurant template's home and menu pages.
 */
export default function DishRow({ item, store, shop, showImages = true, canAdd = true, browseOnly = false, onOpen = null, alt = false, code = 'en', rtl = false }) {
    const sym = store.currency_symbol;
    const href = productUrl(store.slug, item.id);
    const out = item.stock === 'out';
    const pct = savePct(item.price, item.was_price);
    const choice = needsChoice(item);
    const inCart = shop ? shop.qtyOf(item.id) : 0;
    const ref = useRef(null);
    const photo = showImages && item.image_url;
    const addQuick = () => { if (shop.add(item, [], 1)) flyToCart(ref.current?.querySelector('.sf-pic')); };

    const title = alt && item.name_alt ? item.name_alt : item.name;
    const optLabel = out ? (code === 'ur' ? 'ختم' : 'Sold out') : (code === 'ur' ? 'منتخب کریں' : 'Customise');
    // On the QR menu a dish opens a sheet (options, notes) instead of a page of its own.
    const open = onOpen ? () => onOpen(item) : null;
    const action = browseOnly ? null : choice ? (
        open
            ? <button type="button" className="sf-dish-opt" disabled={out} onClick={open}>{optLabel}<ArrowUpRight size={14} /></button>
            : <Link href={href} className="sf-dish-opt" aria-disabled={out}>{optLabel}<ArrowUpRight size={14} /></Link>
    ) : inCart > 0 ? (
        <Stepper small value={inCart} max={50} label={item.name} onChange={(q) => shop.nudge(item.id, q - inCart)} />
    ) : (
        <button type="button" className="sf-round sf-round--sm" disabled={!canAdd || out} onClick={addQuick} aria-label={`Add ${item.name} to cart`}><Plus size={18} strokeWidth={2.6} /></button>
    );

    return (
        <article ref={ref} className={`sf-dish ${out ? 'is-out' : ''} ${photo ? 'has-photo' : ''}`}>
            <div className="sf-dish-text">
                <div className="sf-dish-tags">
                    {pct ? <em className="sf-flag sf-flag--offer">−{pct}%</em> : item.featured ? <em className="sf-flag">Popular</em> : item.is_new ? <em className="sf-flag sf-flag--new">New</em> : null}
                    {!out && item.stock === 'low' && <em className="sf-flag sf-flag--low">Only {item.left} left</em>}
                    {out && <em className="sf-flag sf-flag--out">Sold out</em>}
                    {(item.tags || []).slice(0, 3).map((t) => <em key={t} className={`sf-flag sf-flag--diet sf-flag--${t}`}>{(DIET[code] || DIET.en)[t] || t}</em>)}
                </div>
                <h3 dir={alt && item.name_alt && rtl ? 'rtl' : undefined}>{open ? <button type="button" className="sf-dish-title" onClick={open}>{title}</button> : <Link href={href}>{title}</Link>}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="sf-dish-foot">
                    <PriceTag item={item} sym={sym} />
                    {!photo && action}
                </div>
            </div>
            {photo && (
                <div className="sf-dish-media">
                    {open
                        ? <button type="button" className="sf-dish-photo" aria-label={`View ${item.name}`} onClick={open}><Picture item={item} showImages /></button>
                        : <Link href={href} aria-label={`View ${item.name}`}><Picture item={item} showImages /></Link>}
                    <span className="sf-dish-action">{action}</span>
                </div>
            )}
        </article>
    );
}
