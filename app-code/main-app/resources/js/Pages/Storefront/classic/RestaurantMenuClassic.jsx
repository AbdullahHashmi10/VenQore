import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, ShoppingBag, X } from 'lucide-react';
import StoreLayout from '@/Components/Storefront/StoreLayout';
import DishRow from '@/Components/Storefront/DishRow';
import { Crumbs, cartUrl, productsUrl, shopUrl } from '@/Components/Storefront/parts';
import { useShopCart } from '@/lib/shopCart';

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false));

/**
 * Restaurant template, menu: every dish on one page, grouped by section, with a sticky section bar that
 * follows you down the page. Same data as the shop page; nothing here is paginated.
 */
export default function RestaurantMenu({ store, preview, show_images, limits, rating_summary, customer, items, categories, filters, has_offers, catalogue_total }) {
    const shop = useShopCart(store.slug, limits.max_qty);
    const browseOnly = store.customer_mode === 'catalogue';
    const [q, setQ] = useState(filters.q || '');
    const [current, setCurrent] = useState(null);
    const pillsRef = useRef(null);
    useEffect(() => { setQ(filters.q || ''); }, [filters.q]);

    // Group by section in the order the sections are listed; dishes with no section go last under "More".
    const groups = useMemo(() => {
        const by = new Map();
        items.forEach((it) => { const k = it.category_id || '_none'; if (!by.has(k)) by.set(k, []); by.get(k).push(it); });
        const out = categories.filter((c) => by.has(c.id)).map((c) => ({ id: c.id, name: c.name, items: by.get(c.id) }));
        if (by.has('_none')) out.push({ id: '_none', name: categories.length ? 'More' : 'Menu', items: by.get('_none') });
        return out;
    }, [items, categories]);

    const go = (patch) => router.get(productsUrl(store.slug).split('?')[0], clean({ ...filters, ...patch }), { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters'] });

    // Highlight the section being read, and keep its pill in view.
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined' || groups.length < 2) return undefined;
        const seen = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
            const visible = [...seen.entries()].filter(([, t]) => t !== null).sort((a, b) => a[1] - b[1])[0];
            if (visible) setCurrent(visible[0].replace('cat-', ''));
        }, { rootMargin: '-96px 0px -60% 0px', threshold: 0 });
        groups.forEach((g) => { const el = document.getElementById(`cat-${g.id}`); if (el) io.observe(el); });
        return () => io.disconnect();
    }, [groups]);
    useEffect(() => {
        const el = pillsRef.current?.querySelector('[aria-current="true"]');
        if (el && pillsRef.current) pillsRef.current.scrollTo({ left: el.offsetLeft - 40, behavior: 'smooth' });
    }, [current]);
    // A link like /products#cat-12 from the home page should land on that section.
    useEffect(() => {
        const h = window.location.hash;
        if (h.startsWith('#cat-')) setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView({ block: 'start' }), 80);
    }, []);
    const jump = (id) => { document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setCurrent(String(id)); };

    const catName = categories.find((c) => String(c.id) === String(filters.category))?.name;
    const narrowed = !!(filters.q || filters.category || filters.offer || filters.in_stock);
    const total = items.length;

    return (
        <StoreLayout store={store} shop={shop} ratingSummary={rating_summary} customer={customer} preview={preview} active="shop" title={`Menu · ${store.name}`}>
            <Head title={`Menu — ${store.name}${store.city ? `, ${store.city}` : ''}`}>
                <meta name="description" content={`The full menu from ${store.name}${store.city ? ` in ${store.city}` : ''}. Order online for ${store.pickup ? 'takeaway' : ''}${store.pickup && store.delivery ? ' or ' : ''}${store.delivery ? 'delivery' : ''}.`} />
                {narrowed && <meta name="robots" content="noindex,follow" />}
            </Head>
            <Crumbs trail={[{ label: store.name, href: shopUrl(store.slug) }, { label: 'Menu' }]} />

            <div className="sf-r-menuhead">
                <div><h1>Menu</h1><span className="sf-muted">{catalogue_total} dish{catalogue_total === 1 ? '' : 'es'}{narrowed ? ` · showing ${total}` : ''}</span></div>
                <form className="sf-r-find" role="search" onSubmit={(e) => { e.preventDefault(); go({ q: q.trim() || undefined }); }}>
                    <Search size={16} aria-hidden="true" />
                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the menu" aria-label="Search the menu" maxLength={60} />
                    {q && <button type="button" className="sf-iconbtn" aria-label="Clear search" onClick={() => { setQ(''); go({ q: undefined }); }}><X size={15} /></button>}
                </form>
                <div className="sf-r-toggles">
                    {has_offers && <button type="button" className={`sf-chip ${filters.offer ? 'on' : ''}`} aria-pressed={!!filters.offer} onClick={() => go({ offer: filters.offer ? undefined : true })}>Deals</button>}
                    <button type="button" className={`sf-chip ${filters.in_stock ? 'on' : ''}`} aria-pressed={!!filters.in_stock} onClick={() => go({ in_stock: filters.in_stock ? undefined : true })}>Available now</button>
                </div>
            </div>

            {catName && (
                <div className="sf-r-note">Showing only <b>{catName}</b>. <button type="button" onClick={() => go({ category: undefined })}>Show the full menu</button></div>
            )}

            {groups.length > 1 && !catName && (
                <nav className="sf-r-bar" aria-label="Menu sections">
                    <div className="sf-r-pills sf-r-pills--bar" ref={pillsRef}>
                        {groups.map((g) => <button key={g.id} type="button" aria-current={String(current ?? groups[0].id) === String(g.id) ? 'true' : undefined} onClick={() => jump(g.id)}>{g.name}<small>{g.items.length}</small></button>)}
                    </div>
                </nav>
            )}

            {groups.length === 0 ? (
                <div className="sf-empty">
                    <b>{catalogue_total === 0 ? 'The menu is on its way.' : 'Nothing matches.'}</b>
                    <span>{catalogue_total === 0 ? `${store.name} has not published its menu yet.` : 'Try another word, or clear a filter.'}</span>
                    {narrowed && <button type="button" className="sf-btn" onClick={() => router.get(productsUrl(store.slug).split('?')[0])}>Show the full menu</button>}
                </div>
            ) : groups.map((g) => (
                <section key={g.id} id={`cat-${g.id}`} className="sf-r-section" aria-label={g.name}>
                    <header className="sf-r-grouphead"><h2>{g.name}</h2><span className="sf-muted">{g.items.length}</span></header>
                    <div className="sf-r-dishes">
                        {g.items.map((it) => <DishRow key={it.id} item={it} store={store} shop={shop} showImages={show_images} canAdd={store.accepting_orders} browseOnly={browseOnly} />)}
                    </div>
                </section>
            ))}

            {!browseOnly && shop.count > 0 && (
                <Link href={cartUrl(store.slug)} className="sf-r-bag"><ShoppingBag size={18} /><b>View your order</b><span>{shop.count} item{shop.count === 1 ? '' : 's'}</span></Link>
            )}
        </StoreLayout>
    );
}
