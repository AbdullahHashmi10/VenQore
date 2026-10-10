import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, CalendarCheck, Search, ShoppingCart, Tag, X } from 'lucide-react';
import { StorePage } from '@/Components/Storefront/venqore/StoreFrame';
import Dish from '@/Components/Storefront/venqore/Dish';
import { frame, money, plural, productsUrl, shopUrl, useRowEnd, useSaved, useStuck } from '@/Components/Storefront/venqore/kit';
import { useShopCart } from '@/lib/shopCart';

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false));

/**
 * Restaurant & café template, menu: every dish on one page, grouped by course, with a sticky course bar
 * that follows you down the page and a floating "your order" button.
 */
export default function RestaurantMenu({ store, preview, show_images: show, limits, rating_summary: rs, customer, items, categories, filters, has_offers: hasOffers, catalogue_total: total, can_reserve: canReserve }) {
    const shop = useShopCart(store.slug, limits.max_qty);
    const saved = useSaved(store.slug);
    const browseOnly = store.customer_mode === 'catalogue';
    const canAdd = store.accepting_orders && !browseOnly;
    const [q, setQ] = useState(filters.q || '');
    const [current, setCurrent] = useState(null);
    const [barRef, stuck] = useStuck();
    const [rowRef, rowEnd] = useRowEnd();
    const pillRefs = useRef({});
    useEffect(() => { setQ(filters.q || ''); }, [filters.q]);

    const groups = useMemo(() => {
        const by = new Map();
        items.forEach((it) => { const k = it.category_id || '_none'; if (!by.has(k)) by.set(k, []); by.get(k).push(it); });
        const out = categories.filter((c) => by.has(c.id)).map((c) => ({ id: c.id, name: c.name, items: by.get(c.id) }));
        if (by.has('_none')) out.push({ id: '_none', name: categories.length ? 'More' : 'Menu', items: by.get('_none') });
        return out;
    }, [items, categories]);

    const base = productsUrl(store.slug);
    const go = (patch) => router.get(base, clean({ ...filters, ...patch, sort: undefined }), { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters'] });

    // Highlight the course being read and keep its pill in view.
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined' || groups.length < 2) return undefined;
        const seen = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
            const v = [...seen.entries()].filter(([, t]) => t !== null).sort((a, b) => a[1] - b[1])[0];
            if (v) setCurrent(v[0].replace('cat-', ''));
        }, { rootMargin: '-180px 0px -55% 0px', threshold: 0 });
        groups.forEach((g) => { const el = document.getElementById(`cat-${g.id}`); if (el) io.observe(el); });
        return () => io.disconnect();
    }, [groups]);
    useEffect(() => {
        const el = current && pillRefs.current[current];
        const row = rowRef.current;
        if (el && row) row.scrollTo({ left: el.offsetLeft - 24, behavior: 'smooth' });
    }, [current, rowRef]);
    useEffect(() => {
        const h = window.location.hash;
        if (h.startsWith('#cat-')) setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView({ block: 'start' }), 120);
    }, []);
    const jump = (id) => { document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setCurrent(String(id)); };

    const catName = categories.find((c) => String(c.id) === String(filters.category))?.name;
    const narrowed = !!(filters.q || filters.category || filters.offer || filters.in_stock);
    const shown = items.length;
    const active = String(current ?? groups[0]?.id);

    return (
        <StorePage store={store} shop={shop} saved={saved} customer={customer} ratingSummary={rs} preview={preview} show={show} maxQty={limits.max_qty} active="shop"
            title={`Menu — ${store.name}${store.city ? `, ${store.city}` : ''}`}
            nav={[
                { id: 'shop', label: 'Menu', href: base },
                ...(canReserve ? [{ id: 'reserve', label: 'Book a table', href: `${shopUrl(store.slug)}#reserve` }] : []),
                ...(hasOffers ? [{ id: 'deals', label: 'Deals', href: productsUrl(store.slug, { offer: 1 }) }] : []),
                { id: 'visit', label: 'Find us', href: `${shopUrl(store.slug)}#visit` },
            ]}>
            <Head>
                <meta name="description" content={`The full menu from ${store.name}${store.city ? ` in ${store.city}` : ''}. Order online for ${[store.pickup && 'takeaway', store.delivery && 'delivery'].filter(Boolean).join(' or ') || 'pickup'}.`} />
                {narrowed && <meta name="robots" content="noindex,follow" />}
            </Head>

            <section className="vqsf-pagehead">
                <div className="orb" data-parallax="0.18" />
                <div className="wrap">
                    <nav className="vqsf-crumbs" aria-label="Breadcrumb"><Link href={shopUrl(store.slug)}>Home</Link><span>/</span><span aria-current="page">Menu</span></nav>
                    <div className="row">
                        <div>
                            <h1>The <span className="serif">menu</span></h1>
                            <p>{plural(total, 'dish', 'dishes')}{narrowed ? ` · showing ${shown}` : ''}. {browseOnly ? 'Prices are set by the kitchen.' : `Add what you like — ${[store.pickup && 'takeaway', store.delivery && 'delivery'].filter(Boolean).join(' or ') || 'pickup'}${store.prep_minutes ? `, ready in about ${store.prep_minutes} minutes` : ''}.`}</p>
                        </div>
                        {canReserve && <Link href={`${shopUrl(store.slug)}#reserve`} className="vqsf-btn vqsf-btn--md vqsf-btn--line"><CalendarCheck size={15} />Book a table</Link>}
                    </div>
                </div>
            </section>

            <section className="vqsf-shop">
                <div className="wrap">
                    <div ref={barRef} className={`vqsf-toolbar ${stuck ? 'stuck' : ''}`}>
                        <div className="r1">
                            {groups.length > 1 && !catName ? (
                                <div ref={rowRef} className={`vqsf-catchips ${rowEnd ? 'at-end' : ''}`} role="group" aria-label="Courses">
                                    {groups.map((g) => <button key={g.id} ref={(el) => { pillRefs.current[String(g.id)] = el; }} type="button" className={`vqsf-catchip ${active === String(g.id) ? 'on' : ''}`} aria-current={active === String(g.id) ? 'true' : undefined} onClick={() => jump(g.id)}>{g.name}<small>{g.items.length}</small></button>)}
                                </div>
                            ) : <div style={{ flex: 1 }} ref={rowRef} />}
                            <form className="vqsf-field vqsf-menufind" role="search" onSubmit={(e) => { e.preventDefault(); go({ q: q.trim() || undefined }); }}>
                                <Search size={14} />
                                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the menu" aria-label="Search the menu" maxLength={60} />
                                {q && <button type="button" aria-label="Clear search" onClick={() => { setQ(''); go({ q: undefined }); }} style={{ display: 'grid', color: 'var(--ink-3)' }}><X size={14} /></button>}
                            </form>
                        </div>
                        <div className="r2">
                            {hasOffers && <button type="button" className={`vqsf-toggle ${filters.offer ? 'on' : ''}`} aria-pressed={!!filters.offer} onClick={() => go({ offer: filters.offer ? undefined : 1 })}><Tag size={12} />Deals</button>}
                            <button type="button" className={`vqsf-toggle ${filters.in_stock ? 'on' : ''}`} aria-pressed={!!filters.in_stock} onClick={() => go({ in_stock: filters.in_stock ? undefined : 1 })}>Available now</button>
                            {catName && <button type="button" className="vqsf-toggle on" onClick={() => go({ category: undefined })}>{catName}<X size={12} /></button>}
                            {narrowed && <button type="button" className="vqsf-clear" onClick={() => router.get(base, {}, { preserveScroll: true })}>Show the full menu</button>}
                        </div>
                    </div>

                    {groups.length === 0 ? (
                        <div className="vqsf-empty" style={{ padding: '100px 20px' }}>
                            <b style={{ fontSize: 17 }}>{total === 0 ? 'The menu is on its way' : 'Nothing matches'}</b>
                            <span>{total === 0 ? `${store.name} has not published its menu yet.` : 'Try another word, or clear a filter.'}</span>
                            {narrowed && <button type="button" className="vqsf-btn vqsf-btn--md" onClick={() => router.get(base)}>Show the full menu</button>}
                        </div>
                    ) : groups.map((g) => (
                        <section key={g.id} id={`cat-${g.id}`} className="vqsf-course" aria-label={g.name}>
                            <div className="vqsf-course-h"><h2>{g.name}</h2><span className="muted num">{g.items.length}</span></div>
                            <div className="vqsf-dishes">{g.items.map((it, i) => <Dish key={it.id} item={it} delay={(i % 2) * 50} store={store} shop={shop} saved={saved} show={show} canAdd={canAdd} browseOnly={browseOnly} />)}</div>
                        </section>
                    ))}
                </div>
            </section>

            {!browseOnly && shop.count > 0 && (
                <button type="button" className="vqsf-orderpill" onClick={frame.cart}>
                    <span className="ic"><ShoppingCart size={17} /></span>
                    <span className="tx"><b>View your order</b><small>{plural(shop.count, 'item')}</small></span>
                    <ArrowRight size={16} />
                </button>
            )}
        </StorePage>
    );
}
