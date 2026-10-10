import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
import { StorePage } from '@/Components/Storefront/venqore/StoreFrame';
import ProductCard from '@/Components/Storefront/venqore/ProductCard';
import { money, plural, productsUrl, shopUrl, useRowEnd, useSaved, useStuck } from '@/Components/Storefront/venqore/kit';
import RestaurantMenu from '@/Pages/Storefront/restaurant/RestaurantMenu';
import { useShopCart } from '@/lib/shopCart';

const SORTS = [
    ['featured', 'Featured'],
    ['newest', 'Newest'],
    ['price_asc', 'Price · low to high'],
    ['price_desc', 'Price · high to low'],
    ['name', 'Name A–Z'],
];
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && v !== null && v !== '' && v !== false && !(k === 'sort' && v === 'featured')));

function ShopDefault({ store, preview, show_images: show, limits, rating_summary: rs, customer, items, pagination, categories, filters, bounds, has_offers: hasOffers, catalogue_total: total }) {
    const shop = useShopCart(store.slug, limits.max_qty);
    const saved = useSaved(store.slug);
    const browseOnly = store.customer_mode === 'catalogue';
    const sym = store.currency_symbol;
    const [more, setMore] = useState(false);
    const [barRef, stuck] = useStuck();
    const [rowRef, rowEnd] = useRowEnd();
    const [q, setQ] = useState(filters.q || '');
    const [min, setMin] = useState(filters.min || '');
    const [max, setMax] = useState(filters.max || '');
    useEffect(() => { setQ(filters.q || ''); setMin(filters.min || ''); setMax(filters.max || ''); }, [filters.q, filters.min, filters.max]);

    const base = productsUrl(store.slug);
    const go = (patch, keepScroll = true) => router.get(base, clean({ ...filters, ...patch, page: undefined }), { preserveState: true, preserveScroll: keepScroll, only: ['items', 'pagination', 'filters'] });
    const catName = categories.find((c) => String(c.id) === String(filters.category))?.name;
    const priceOn = !!(filters.min || filters.max);
    const filtered = !!(filters.q || filters.category || priceOn || filters.in_stock || filters.offer);
    const heading = catName || (filters.q ? <>Results for “{filters.q}”</> : filters.offer ? 'On offer' : 'The whole shop');
    const g = store.hours_guidance;
    const status = g?.is_on_break ? { dot: 'warn', t: `On a break${g.opens_at ? ` · back ${g.opens_at}` : ''}` }
        : store.open_now === true ? { dot: '', t: `Open now${g?.closes_at ? ` · closes ${g.closes_at}` : ''}` }
            : store.open_now === false ? { dot: 'off', t: `Closed${g?.opens_at ? ` · opens ${g.opens_at}` : ''}` } : null;

    return (
        <StorePage store={store} shop={shop} saved={saved} customer={customer} ratingSummary={rs} preview={preview} show={show} maxQty={limits.max_qty} active={filters.offer ? 'deals' : 'shop'} title={`${catName ? `${catName} · ` : ''}Shop — ${store.name}`}>
            <Head>
                <meta name="description" content={`Browse everything ${store.name} sells${store.city ? ` in ${store.city}` : ''}.`} />
                {(filters.q || pagination.current > 1 || priceOn || filters.in_stock) && <meta name="robots" content="noindex,follow" />}
            </Head>

            <section className="vqsf-pagehead">
                <div className="orb" data-parallax="0.18" />
                <div className="wrap">
                    <nav className="vqsf-crumbs" aria-label="Breadcrumb">
                        <Link href={shopUrl(store.slug)}>Home</Link><span>/</span>
                        {catName || filters.q ? <><Link href={base}>Shop</Link><span>/</span><span aria-current="page">{catName || 'Search'}</span></> : <span aria-current="page">Shop</span>}
                    </nav>
                    <div className="row">
                        <div>
                            <h1>{heading}</h1>
                            <p>{catName
                                ? `${plural(pagination.total, 'product')} in ${catName} at ${store.name}.`
                                : `Everything ${store.name} sells, in one list. Filter it down, add what you need${store.delivery ? ' and we will bring it over' : ' and collect it from the shop'}${store.prep_minutes ? ` in about ${store.prep_minutes} minutes` : ''}.`}</p>
                        </div>
                        {status && <div className="vqsf-pill" style={{ padding: '8px 16px 8px 10px', fontSize: 12 }}><span className={`vqsf-live ${status.dot ? `vqsf-live--${status.dot}` : ''}`} /><span>{status.t}</span></div>}
                    </div>
                </div>
            </section>

            <section className="vqsf-shop">
                <div className="wrap">
                    <div ref={barRef} className={`vqsf-toolbar ${stuck ? 'stuck' : ''}`}>
                        <div className="r1">
                            <div ref={rowRef} className={`vqsf-catchips ${rowEnd ? 'at-end' : ''}`} role="group" aria-label="Categories">
                                <button type="button" className={`vqsf-catchip ${!filters.category ? 'on' : ''}`} onClick={() => go({ category: undefined })}>All <small>{total}</small></button>
                                {categories.map((c) => <button key={c.id} type="button" className={`vqsf-catchip ${String(filters.category) === String(c.id) ? 'on' : ''}`} onClick={() => go({ category: c.id })}>{c.name} <small>{c.count}</small></button>)}
                            </div>
                            <label className="vqsf-sort">
                                <span>Sort</span>
                                <select value={filters.sort} onChange={(e) => go({ sort: e.target.value })} aria-label="Sort products">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                            </label>
                        </div>
                        <div className="r2">
                            <span className="count">{pagination.total === total ? plural(total, 'product') : `${pagination.total} of ${total} products`}</span>
                            {hasOffers && <button type="button" className={`vqsf-toggle ${filters.offer ? 'on' : ''}`} aria-pressed={!!filters.offer} onClick={() => go({ offer: filters.offer ? undefined : 1 })}><Tag size={12} />On offer only</button>}
                            <button type="button" className={`vqsf-toggle ${filters.in_stock ? 'on' : ''}`} aria-pressed={!!filters.in_stock} onClick={() => go({ in_stock: filters.in_stock ? undefined : 1 })}>In stock</button>
                            <button type="button" className={`vqsf-toggle ${more || priceOn || filters.q ? 'on' : ''}`} aria-expanded={more} onClick={() => setMore((m) => !m)}><SlidersHorizontal size={12} />Search & price</button>
                            {filters.q && <button type="button" className="vqsf-toggle on" onClick={() => go({ q: undefined })}>“{filters.q}”<X size={12} /></button>}
                            {priceOn && <button type="button" className="vqsf-toggle on" onClick={() => go({ min: undefined, max: undefined })}>{filters.min ? money(filters.min, sym) : 'Any'} – {filters.max ? money(filters.max, sym) : 'Any'}<X size={12} /></button>}
                            {filtered && <button type="button" className="vqsf-clear" onClick={() => router.get(base, {}, { preserveScroll: true })}>Clear filters</button>}
                        </div>
                        {more && (
                            <div className="vqsf-filterpop">
                                <form className="vqsf-field" style={{ flex: '1 1 220px' }} onSubmit={(e) => { e.preventDefault(); go({ q: q.trim() || undefined }); }} role="search">
                                    <Search size={14} />
                                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${store.name}`} maxLength={60} aria-label="Search products" />
                                </form>
                                {bounds.max > bounds.min && (
                                    <form style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); go({ min: min || undefined, max: max || undefined }); }}>
                                        <label className="vqsf-field vqsf-field--price"><span className="muted" style={{ fontSize: 12 }}>{sym}</span><input inputMode="decimal" placeholder={`${bounds.min}`} value={min} onChange={(e) => setMin(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Minimum price" /></label>
                                        <span className="muted" style={{ fontSize: 12 }}>to</span>
                                        <label className="vqsf-field vqsf-field--price"><span className="muted" style={{ fontSize: 12 }}>{sym}</span><input inputMode="decimal" placeholder={`${bounds.max}`} value={max} onChange={(e) => setMax(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Maximum price" /></label>
                                        <button type="submit" className="vqsf-btn vqsf-btn--sm">Apply</button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="vqsf-results">
                        {items.length === 0 ? (
                            <div className="vqsf-empty" style={{ padding: '100px 20px' }}>
                                <b style={{ fontSize: 17 }}>{total === 0 ? 'Nothing published yet' : 'Nothing in this aisle yet'}</b>
                                <span>{total === 0 ? `${store.name} has not published products yet.` : 'Try another category, a different word, or clear the filters.'}</span>
                                {filtered && <button type="button" className="vqsf-btn vqsf-btn--md" onClick={() => router.get(base)}>Clear filters</button>}
                            </div>
                        ) : (
                            <div className="vqsf-grid">
                                {items.map((it, i) => <ProductCard key={it.id} item={it} delay={(i % 4) * 50} store={store} shop={shop} saved={saved} show={show} canAdd={store.accepting_orders} browseOnly={browseOnly} />)}
                            </div>
                        )}
                        {pagination.last > 1 && (
                            <div className="vqsf-pager">
                                <button type="button" className="vqsf-btn vqsf-btn--md vqsf-btn--line" disabled={pagination.current <= 1} onClick={() => router.get(base, clean({ ...filters, page: pagination.current - 1 }), { preserveState: true, only: ['items', 'pagination', 'filters'] })}>Previous</button>
                                <span className="pg">Page {pagination.current} of {pagination.last}</span>
                                <button type="button" className="vqsf-btn vqsf-btn--md" disabled={pagination.current >= pagination.last} onClick={() => router.get(base, clean({ ...filters, page: pagination.current + 1 }), { preserveState: true, only: ['items', 'pagination', 'filters'] })}>Next<ArrowRight size={14} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </StorePage>
    );
}

/** Restaurants keep the menu-first template; every other business gets the VenQore storefront. */
export default function Shop(props) {
    return props.template === 'restaurant' ? <RestaurantMenu {...props} /> : <ShopDefault {...props} />;
}
