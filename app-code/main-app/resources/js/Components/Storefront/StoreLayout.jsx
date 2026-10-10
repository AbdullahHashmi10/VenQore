import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Clock, MapPin, Phone, Mail, Search, ShoppingBag } from 'lucide-react';
import '../../../css/storefront.css';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Alert, Btn, initials, tone } from '@/Components/Commerce/shop';
import StoreBadges from '@/Components/Commerce/StoreBadges';
import { accentFor, cartUrl, productsUrl, shopUrl } from '@/Components/Storefront/parts';
import { useForeignCartNotice } from '@/lib/shopCart';
import { DAY_LABEL } from '@/lib/commerce';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function t12(val) {
    if (!val || !val.includes(':')) return '';
    const [h, m] = val.split(':').map((n) => parseInt(n, 10) || 0);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
export function hoursText(h) {
    if (!h || !h.open || !h.close) return 'Closed';
    if (h.open === h.close) return 'Open 24 hours';
    return `${t12(h.open)} – ${t12(h.close)}`;
}

export function StoreMark({ store, size = 'md' }) {
    const t = tone(store.slug);
    return <span className={`sf-mark sf-mark--${size}`} style={{ color: t.fg, background: store.logo_url ? 'var(--vq-surface)' : t.bg }}>{store.logo_url ? <img src={store.logo_url} alt="" /> : initials(store.name)}</span>;
}

/**
 * The frame every public store page sits in: the shopper's header, this business's own navigation,
 * notices (preview, announcement, closed), and a footer with the business's real details.
 * A future template replaces this component and the four pages; the data stays the same.
 */
export default function StoreLayout({ store, shop, ratingSummary, customer, preview = false, active = 'home', title, children }) {
    const browseOnly = store.customer_mode === 'catalogue';
    const restaurant = usePage().props.template === 'restaurant';
    const [q, setQ] = useState('');
    const foreign = useForeignCartNotice();
    const count = shop?.count ?? 0;
    const hours = store.opening_hours;
    const today = store.hours_guidance?.current_day_key;

    const search = (e) => {
        e.preventDefault();
        router.get(productsUrl(store.slug), { q: q.trim() || undefined });
    };
    const links = [
        { id: 'home', label: 'Home', href: shopUrl(store.slug) },
        { id: 'shop', label: restaurant ? 'Menu' : 'Shop', href: productsUrl(store.slug) },
        { id: 'visit', label: 'Visit us', href: `${shopUrl(store.slug)}#visit` },
    ];

    return (
        <PublicShell
            title={title || store.name}
            storeSlug={store.slug}
            ratingSummary={ratingSummary}
            customer={customer}
            bag={browseOnly ? undefined : { count, total: 0, onClick: () => router.visit(cartUrl(store.slug)) }}
            catalogueTheme="visual-grid"
            catalogueOnly={browseOnly}
        >
            <div className={`sf ${restaurant ? 'sf--r' : ''}`} style={accentFor(store.slug, store.brand_color, store.brand_color_2)}>
                <div className="sf-nav">
                    <Link href={shopUrl(store.slug)} className="sf-nav-brand" aria-label={`${store.name} home`}>
                        <StoreMark store={store} size="sm" />
                        <span>{store.name}</span>
                    </Link>
                    <nav className="sf-nav-links" aria-label="Store">
                        {links.map((l) => <Link key={l.id} href={l.href} className={active === l.id ? 'on' : ''} aria-current={active === l.id ? 'page' : undefined}>{l.label}</Link>)}
                    </nav>
                    <form className="sf-nav-search" onSubmit={search} role="search">
                        <Search size={16} aria-hidden="true" />
                        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={restaurant ? 'Search the menu' : `Search ${store.name}`} aria-label="Search this store" maxLength={60} />
                    </form>
                    {!browseOnly && (
                        <Link href={cartUrl(store.slug)} className={`sf-nav-cart ${active === 'cart' ? 'on' : ''}`} aria-label={`Cart, ${count} items`}>
                            <ShoppingBag size={18} aria-hidden="true" />{count > 0 && <b>{count}</b>}
                        </Link>
                    )}
                </div>

                {preview && <Alert kind="info">Preview: only you can see this store. Customers cannot see or order from it until you publish.</Alert>}
                {store.announcement && <div className="sf-announce"><b>{store.announcement}</b></div>}
                {!preview && !browseOnly && !store.accepting_orders && (
                    <Alert kind="warn">
                        {store.hours_guidance?.is_on_break && !store.orders_during_break
                            ? `${store.name} is on a break${store.hours_guidance?.opens_at ? ` until ${store.hours_guidance.opens_at}` : ''}. You can look around and order when it ends.`
                            : store.closed_by_hours
                                ? `${store.name} is closed right now and takes orders only during opening hours. You can still look around.`
                                : `${store.name} is not taking online orders right now. You can still look around.`}
                    </Alert>
                )}
                {foreign.open && (
                    <Alert kind="warn">
                        Your bag has items from another business. One business per order, so adding this will replace it.
                        <span className="sf-row" style={{ marginTop: 10 }}>
                            <Btn onClick={foreign.replace}>Replace my bag</Btn>
                            <Btn variant="soft" onClick={foreign.keep}>Keep it</Btn>
                        </span>
                    </Alert>
                )}

                {children}

                <footer className="sf-foot" id="visit">
                    <div className="sf-foot-grid">
                        <div className="sf-foot-about">
                            <span className="sf-row" style={{ gap: 12 }}><StoreMark store={store} size="sm" /><b>{store.name}</b></span>
                            {store.description && <p>{store.description}</p>}
                            <StoreBadges badges={store.badges} max={6} />
                        </div>
                        <div>
                            <h4>{restaurant ? 'Order' : 'Shop'}</h4>
                            <ul>
                                <li><Link href={shopUrl(store.slug)}>Home</Link></li>
                                <li><Link href={productsUrl(store.slug)}>{restaurant ? 'Full menu' : 'All products'}</Link></li>
                                {!browseOnly && <li><Link href={cartUrl(store.slug)}>{restaurant ? 'Your order' : 'Your cart'}</Link></li>}
                                {!browseOnly && <li><Link href="/order-lookup">Track an order</Link></li>}
                            </ul>
                        </div>
                        <div>
                            <h4>Find us</h4>
                            <ul className="sf-contact">
                                {(store.address || store.city) && <li><MapPin size={15} />{[store.address, store.city].filter(Boolean).join(', ')}</li>}
                                {store.phone && <li><Phone size={15} /><a href={`tel:${store.phone}`}>{store.phone}</a></li>}
                                {store.email && <li><Mail size={15} /><a href={`mailto:${store.email}`}>{store.email}</a></li>}
                                {store.map_url && <li><a href={store.map_url} target="_blank" rel="noopener noreferrer">Open in maps ↗</a></li>}
                            </ul>
                        </div>
                        <div>
                            <h4><Clock size={14} style={{ verticalAlign: '-2px' }} /> Opening hours</h4>
                            {hours ? (
                                <ul className="sf-hours">
                                    {DAYS.map((d) => <li key={d} className={today === d ? 'today' : ''}><span>{DAY_LABEL[d]}</span><span>{hoursText(hours[d])}</span></li>)}
                                </ul>
                            ) : <p className="sf-muted">Opening hours are not listed.</p>}
                        </div>
                    </div>
                    <div className="sf-foot-base">
                        <span>© {new Date().getFullYear()} {store.name}</span>
                        <span>Orders are requests, confirmed by the business. Prices and stock are set by {store.name}. · <a href="/shop">More local shops on VenQore</a></span>
                    </div>
                </footer>
            </div>
        </PublicShell>
    );
}
