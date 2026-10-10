import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, ArrowUpRight, Check, Heart, Info, LayoutGrid, MapPin, Moon, Plus, Search, ShoppingCart, Sparkles, Sun, Trash2, User, X } from 'lucide-react';
import PublicShell, { ShellThemeContext } from '@/Components/Commerce/PublicShell';
import { useForeignCartNotice, lineKey, modsKey } from '@/lib/shopCart';
import { DAY_LABEL } from '@/lib/commerce';
import { initials } from '@/Components/Commerce/shop';
import { Pic, Stepper, brandTokens, cartUrl, money, productUrl, productsUrl, shopUrl } from '@/Components/Storefront/venqore/kit';
import { EditPhotosBar, PhotosProvider } from '@/Components/Storefront/venqore/photos';
import '../../../../css/venqore-storefront.css';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const t12 = (v) => { if (!v || !v.includes(':')) return ''; const [h, m] = v.split(':').map((n) => parseInt(n, 10) || 0); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
export const hoursText = (h) => (!h || !h.open || !h.close ? 'Closed' : h.open === h.close ? 'Open 24 hours' : `${t12(h.open)} – ${t12(h.close)}`);
export { DAYS };

/** Store logo, or its initials on ink. */
export function Mark({ store, size = 30, radius = 9 }) {
    return (
        <span className="vqsf-mark" style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.36) }}>
            {store.logo_url ? <img src={store.logo_url} alt="" /> : initials(store.name)}
        </span>
    );
}

/** Reveal-on-scroll and parallax for every [data-reveal] / [data-parallax] inside the frame. */
function useMotion(rootRef, key) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const io = typeof IntersectionObserver !== 'undefined' && !reduced
            ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 })
            : null;
        let plx = [];
        const scan = () => {
            root.querySelectorAll('[data-reveal]:not(.in):not([data-seen])').forEach((el) => {
                el.setAttribute('data-seen', '');
                if (io) io.observe(el); else el.classList.add('in');
            });
            // parallax only where there is room for it: wide screens, motion allowed
            plx = reduced || window.innerWidth < 720 ? [] : Array.from(root.querySelectorAll('[data-parallax]'));
            if (!plx.length) root.querySelectorAll('[data-parallax]').forEach((el) => { el.style.transform = ''; });
        };
        let raf = 0;
        const tick = () => {
            raf = 0;
            const vh = window.innerHeight;
            plx.forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) return;
                const f = parseFloat(el.getAttribute('data-parallax')) || 0;
                const off = (r.top + r.height / 2 - vh / 2) * f;
                el.style.transform = `translate3d(0, ${(-off).toFixed(1)}px, 0)`;
            });
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
        scan(); tick();
        let pending = 0;
        const mo = new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan(); tick(); }); });
        mo.observe(root, { childList: true, subtree: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { io?.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); cancelAnimationFrame(pending); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, [rootRef, key]);
}

const RECENT = 'vqsf-recent';
const readRecent = () => { try { const v = JSON.parse(localStorage.getItem(RECENT) || '[]'); return Array.isArray(v) ? v.slice(0, 6) : []; } catch { return []; } };
const pushRecent = (q) => { try { localStorage.setItem(RECENT, JSON.stringify([q, ...readRecent().filter((x) => x !== q)].slice(0, 6))); } catch { /* ignore */ } };

/** ⌘K search. In a store it searches that store's products live; on the directory it searches shops. */
function SearchOverlay({ open, onClose, store, initial, suggestions, onSubmit, placeholder }) {
    const page = usePage();
    const [q, setQ] = useState('');
    const [hits, setHits] = useState(null);
    const [busy, setBusy] = useState(false);
    const [recent, setRecent] = useState([]);
    const [sel, setSel] = useState(-1);
    const input = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        setQ(initial || ''); setRecent(readRecent()); setSel(-1);
        const t = setTimeout(() => input.current?.focus(), 60);
        return () => clearTimeout(t);
    }, [open, initial]);
    useEffect(() => {
        if (!open || !store) return undefined;
        const term = q.trim();
        if (term.length < 2) { setHits(null); return undefined; }
        setBusy(true);
        const t = setTimeout(() => {
            axios.get(productsUrl(store.slug, { q: term }), { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': page.version || '', 'X-Inertia-Partial-Component': 'Storefront/Shop', 'X-Inertia-Partial-Data': 'items,pagination', 'X-Requested-With': 'XMLHttpRequest' } })
                .then((r) => { setHits({ items: (r.data?.props?.items || []).slice(0, 8), total: r.data?.props?.pagination?.total ?? 0 }); setSel(-1); })
                .catch(() => setHits({ items: [], total: 0, failed: true }))
                .finally(() => setBusy(false));
        }, 220);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, open, store?.slug]);

    const submit = (term = q) => {
        const v = String(term || '').trim();
        if (v) pushRecent(v);
        onClose();
        onSubmit(v);
    };
    const key = (e) => {
        const list = hits?.items || [];
        if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(-1, s - 1)); }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (sel >= 0 && list[sel]) { onClose(); router.visit(productUrl(store.slug, list[sel].id)); } else submit();
        }
    };
    const sym = store?.currency_symbol;
    const hasQuery = q.trim().length >= 2;

    return (
        <div className={`vqsf-search ${open ? 'on' : ''}`} aria-hidden={!open} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="vqsf-search-panel" role="dialog" aria-modal="true" aria-label="Search">
                <div className="vqsf-search-top">
                    <Search size={19} strokeWidth={1.8} />
                    <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder={placeholder} aria-label="Search" maxLength={80} tabIndex={open ? 0 : -1} />
                    <button type="button" className="vqsf-esc" onClick={onClose} tabIndex={open ? 0 : -1}>ESC</button>
                </div>
                <div className="vqsf-search-body">
                    {store && hasQuery ? (
                        <div>
                            <div className="vqsf-search-h">{busy ? 'Searching…' : hits ? `${hits.total} product${hits.total === 1 ? '' : 's'}` : 'Products'}</div>
                            {(hits?.items || []).map((it, i) => (
                                <Link key={it.id} href={productUrl(store.slug, it.id)} onClick={onClose} className={`vqsf-hit ${sel === i ? 'on' : ''}`}>
                                    <span className="im"><Pic src={it.image_url} name={it.name} /></span>
                                    <span className="tx"><b>{it.name}</b><small>{[it.category, it.stock === 'out' ? 'Sold out' : it.stock === 'low' ? `Only ${it.left} left` : null].filter(Boolean).join(' · ') || 'View product'}</small></span>
                                    <span className="pr">{money(it.price_from ?? it.price, sym)}</span>
                                    <span className="go"><ArrowUpRight size={13} strokeWidth={2.2} /></span>
                                </Link>
                            ))}
                            {hits && hits.items.length === 0 && !busy && <div className="vqsf-search-empty">{hits.failed ? 'Search is not available right now. Press Enter to search the shop.' : `Nothing matched “${q.trim()}”. Try another word.`}</div>}
                            {hits && hits.total > hits.items.length && <button type="button" className="vqsf-hit" onClick={() => submit()}><span className="n"><Search size={13} /></span><span className="tx"><b>See all {hits.total} results</b></span></button>}
                        </div>
                    ) : (
                        <div>
                            {recent.length > 0 && (
                                <>
                                    <div className="vqsf-search-h">Recent</div>
                                    <div className="vqsf-recent">{recent.map((r) => <button key={r} type="button" onClick={() => (store ? setQ(r) : submit(r))}>{r}</button>)}</div>
                                </>
                            )}
                            {suggestions.length > 0 && <div className="vqsf-search-h">{store ? 'Browse' : 'Popular searches'}</div>}
                            {suggestions.map((s, i) => (
                                <button key={s.label} type="button" className="vqsf-hit" onClick={() => { onClose(); s.go(); }}>
                                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="tx"><b style={{ fontWeight: 500 }}>{s.label}</b>{s.hint && <small>{s.hint}</small>}</span>
                                    <ArrowUpRight size={14} style={{ color: 'var(--ink-3)' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="vqsf-search-foot">
                    <span><b>↵</b> search</span><span><b>↑↓</b> choose</span><span><b>esc</b> close</span>
                    <span className="r">{store ? store.name : 'VenQore shops'}</span>
                </div>
            </div>
        </div>
    );
}

/** Cart + saved drawer. Prices always come from the server quote. */
function Drawer({ open, tab, setTab, onClose, store, shop, saved, show, maxQty }) {
    const sym = store.currency_symbol;
    const lines = shop.cart.lines;
    const [quote, setQuote] = useState(null);
    const items = lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, mods: (l.mods || []).map((m) => m.id) }));
    const sig = JSON.stringify(items);
    useEffect(() => {
        if (!open || lines.length === 0) { if (lines.length === 0) setQuote(null); return undefined; }
        const t = setTimeout(() => {
            axios.post(`/shop/${store.slug}/quote`, { items, fulfilment: store.pickup ? 'pickup' : 'delivery' })
                .then((r) => setQuote(r.data)).catch(() => setQuote(null));
        }, 200);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig, open, store.slug]);

    const min = Number(store.min_order_amount || 0);
    const sub = quote ? quote.subtotal + (quote.tax_total || 0) : 0;
    const pct = min > 0 ? Math.min(100, (sub / min) * 100) : 100;
    const isCart = tab === 'cart';
    const browseOnly = store.customer_mode === 'catalogue';

    return (
        <aside className={`vqsf-drawer ${open ? 'on' : ''}`} aria-label={isCart ? 'Cart' : 'Saved items'} aria-hidden={!open}>
            <div className="vqsf-drawer-top">
                {!browseOnly && <button type="button" className={`vqsf-tab ${isCart ? 'on' : ''}`} onClick={() => setTab('cart')}>Cart · {shop.count}</button>}
                <button type="button" className={`vqsf-tab ${!isCart ? 'on' : ''}`} onClick={() => setTab('saved')}>Saved · {saved.count}</button>
                <button type="button" className="vqsf-ib" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Close"><X size={17} strokeWidth={1.9} /></button>
            </div>
            <div className="vqsf-drawer-body">
                {isCart && lines.map((l) => {
                    const q = quote?.items?.find((x) => x.item_id === l.item_id && modsKey(x.mods) === modsKey(l.mods));
                    const [main, ...rest] = (q?.title || l.name || 'Item').split(' — ');
                    const subline = [...rest, ...(l.mods || []).map((m) => m.name), l.notes].filter(Boolean).join(' · ');
                    return (
                        <div key={lineKey(l)} className="vqsf-line">
                            <Link href={productUrl(store.slug, l.item_id)} className="im" onClick={onClose}><Pic src={l.image_url} name={main} show={show} /></Link>
                            <div className="tx">
                                <Link href={productUrl(store.slug, l.item_id)} onClick={onClose}>{main}</Link>
                                <small>{subline || (q ? `${money(q.price, sym)} each` : ' ')}</small>
                                <div className="row">
                                    <Stepper value={l.quantity} max={maxQty} label={main} onChange={(v) => shop.setQty(lineKey(l), v)} />
                                    <button type="button" className="rm" onClick={() => shop.remove(lineKey(l))}><Trash2 size={12} />Remove</button>
                                    <span className="tot">{q ? money(q.line_total, sym) : '…'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {!isCart && saved.list.map((s) => (
                    <div key={s.id} className="vqsf-line">
                        <Link href={productUrl(store.slug, s.id)} className="im" onClick={onClose}><Pic src={s.image_url} name={s.name} show={show} /></Link>
                        <div className="tx">
                            <Link href={productUrl(store.slug, s.id)} onClick={onClose}>{s.name}</Link>
                            <small>{s.out ? 'Sold out' : s.was_price ? `Was ${money(s.was_price, sym)}` : ' '}</small>
                            <div className="row">
                                {browseOnly || s.out ? <span /> : s.choice
                                    ? <Link href={productUrl(store.slug, s.id)} className="vqsf-optlink" onClick={onClose}>Choose options</Link>
                                    : <button type="button" className="vqsf-optlink" disabled={!store.accepting_orders} onClick={() => { if (shop.add({ id: s.id, name: s.name, image_url: s.image_url }, [], 1)) saved.remove(s.id); }}>Add to cart</button>}
                                <button type="button" className="rm" onClick={() => saved.remove(s.id)}><X size={12} />Remove</button>
                                <span className="tot">{money(s.price, sym)}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {((isCart && lines.length === 0) || (!isCart && saved.count === 0)) && (
                    <div className="vqsf-empty">
                        <span className="ic">{isCart ? <ShoppingCart size={21} strokeWidth={1.6} /> : <Heart size={21} strokeWidth={1.6} />}</span>
                        <b>{isCart ? 'Your cart is empty' : 'Nothing saved yet'}</b>
                        <span>{isCart ? `Add something from ${store.name} and it will wait here.` : 'Tap the heart on any product to keep it for later.'}</span>
                        <Link href={productsUrl(store.slug)} className="vqsf-btn vqsf-btn--md" onClick={onClose}>Browse the shop</Link>
                    </div>
                )}
            </div>
            {isCart && lines.length > 0 && (
                <div className="vqsf-drawer-foot">
                    {min > 0 && <><div className="vqsf-bar"><i style={{ width: `${pct}%` }} /></div><div className="note">{quote && sub < min ? `Add ${money(min - sub, sym)} more to reach the ${money(min, sym)} minimum order.` : `Minimum order of ${money(min, sym)} reached.`}</div></>}
                    <div className="vqsf-sum"><span>Subtotal</span><span>{quote ? money(quote.subtotal, sym) : '…'}</span></div>
                    {quote?.tax_total > 0 && <div className="vqsf-sum"><span>Tax</span><span>{money(quote.tax_total, sym)}</span></div>}
                    {quote?.discount_total > 0 && <div className="vqsf-sum save"><span>You save{quote.promo_name ? ` · ${quote.promo_name}` : ''}</span><span>−{money(quote.discount_total, sym)}</span></div>}
                    <div className="vqsf-sum"><span>{store.delivery ? 'Delivery' : 'Pickup'}</span><span>{store.delivery ? 'At checkout' : 'Free'}</span></div>
                    <div className="vqsf-sum big"><span>Total</span><span>{quote ? money(quote.total, sym) : '…'}</span></div>
                    <Link href={cartUrl(store.slug)} className="vqsf-btn vqsf-btn--block" style={{ marginTop: 16 }} onClick={onClose}>Checkout{store.prep_minutes ? ` · ready in ~${store.prep_minutes} min` : ''}</Link>
                </div>
            )}
        </aside>
    );
}

function Toasts() {
    const [list, setList] = useState([]);
    useEffect(() => {
        const on = (e) => {
            const id = Date.now() + Math.random();
            setList((t) => [...t.slice(-1), { id, text: e.detail, out: false }]);
            setTimeout(() => setList((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2200);
            setTimeout(() => setList((t) => t.filter((x) => x.id !== id)), 2550);
        };
        window.addEventListener('vqs-toast', on);
        return () => window.removeEventListener('vqs-toast', on);
    }, []);
    return list.map((t) => <div key={t.id} className={`vqsf-toast ${t.out ? 'out' : ''}`} role="status"><div><span className="ic"><Check size={13} strokeWidth={2.6} /></span><span>{t.text}</span></div></div>);
}

function Note({ kind = 'info', children, actions }) {
    const Ic = kind === 'info' ? Info : AlertTriangle;
    return <div className={`vqsf-note vqsf-note--${kind}`} role={kind === 'bad' ? 'alert' : 'status'}><span className="ic"><Ic size={14} /></span><span className="tx">{children}</span>{actions && <span className="acts">{actions}</span>}</div>;
}

/**
 * The frame every VenQore store page sits in: floating pill nav, ⌘K search, cart/saved drawer,
 * notices, footer, toasts, reveal + parallax. `store` is omitted on the /shop directory.
 */
export default function StoreFrame({ store = null, shop = null, saved = null, customer = null, ratingSummary = null, preview = false, active = 'home', title, show = true, maxQty = 50, nav = null, searchSuggestions = [], onSearch, searchPlaceholder, where, onWhere, sticky = false, cta = null, overImage = false, children }) {
    const rootRef = useRef(null);
    const page = usePage();
    const { theme, toggle } = useContext(ShellThemeContext);
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchSeed, setSearchSeed] = useState('');
    const [drawer, setDrawer] = useState(null);
    const foreign = useForeignCartNotice();
    const browseOnly = store?.customer_mode === 'catalogue';
    const restaurant = page.props.template === 'restaurant';
    useMotion(rootRef, page.url);

    useEffect(() => {
        const f = () => setScrolled(window.scrollY > 12);
        f(); window.addEventListener('scroll', f, { passive: true });
        return () => window.removeEventListener('scroll', f);
    }, []);
    const closeAll = () => { setSearchOpen(false); setDrawer(null); };
    useEffect(() => {
        const key = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setDrawer(null); setSearchSeed(''); setSearchOpen(true); }
            if (e.key === 'Escape') closeAll();
        };
        const open = (e) => {
            const d = e.detail || {};
            if (d.what === 'search') { setDrawer(null); setSearchSeed(d.q || ''); setSearchOpen(true); }
            if (d.what === 'cart' || d.what === 'saved') { setSearchOpen(false); setDrawer(d.what); }
        };
        window.addEventListener('keydown', key); window.addEventListener('vqsf-open', open);
        return () => { window.removeEventListener('keydown', key); window.removeEventListener('vqsf-open', open); };
    }, []);
    useEffect(() => {
        const lock = searchOpen || drawer;
        document.documentElement.style.overflowY = lock ? 'hidden' : 'auto';
        return () => { document.documentElement.style.overflowY = 'auto'; };
    }, [searchOpen, drawer]);
    useEffect(() => { closeAll(); }, [page.url]);

    const tokens = useMemo(() => brandTokens(store?.slug || 'venqore', store ? store.brand_color : '#0B8F7A'), [store?.slug, store?.brand_color]);
    const nameParts = (store?.name || 'VenQore').trim().split(/\s+/);
    const w1 = store ? nameParts[0] : 'VenQore';
    const w2 = store ? nameParts.slice(1).join(' ') : 'Shops';

    const links = nav || (store ? [
        { id: 'shop', label: restaurant ? 'Menu' : 'Shop', href: productsUrl(store.slug) },
        ...(page.props.on_offer?.length || page.props.has_offers ? [{ id: 'deals', label: 'Deals', href: productsUrl(store.slug, { offer: 1 }) }] : []),
        { id: 'cats', label: 'Categories', href: `${shopUrl(store.slug)}#categories` },
        ...(store.delivery ? [{ id: 'delivery', label: 'Delivery', href: `${shopUrl(store.slug)}#delivery` }] : []),
        { id: 'visit', label: 'Visit us', href: `${shopUrl(store.slug)}#visit` },
    ] : []);

    const suggestions = searchSuggestions.length ? searchSuggestions : (store ? (page.props.categories || []).slice(0, 6).map((c) => ({ label: c.name, hint: `${c.count} item${c.count === 1 ? '' : 's'}`, go: () => router.visit(productsUrl(store.slug, { category: c.id })) })) : []);
    const submitSearch = onSearch || ((q) => router.get(productsUrl(store.slug), q ? { q } : {}));

    const notices = [];
    if (preview) notices.push(<Note key="p">Preview — only you can see this store. Customers cannot see or order from it until you publish.</Note>);
    if (store?.announcement) notices.push(<Note key="a"><b>{store.announcement}</b></Note>);
    if (store && !preview && !browseOnly && !store.accepting_orders) {
        notices.push(<Note key="c" kind="warn">{store.hours_guidance?.is_on_break && !store.orders_during_break
            ? `${store.name} is on a break${store.hours_guidance?.opens_at ? ` until ${store.hours_guidance.opens_at}` : ''}. You can look around and order when it ends.`
            : store.closed_by_hours ? `${store.name} is closed right now and takes orders only during opening hours. You can still look around.`
                : `${store.name} is not taking online orders right now. You can still look around.`}</Note>);
    }
    if (foreign.open) notices.push(<Note key="f" kind="warn" actions={<><button type="button" className="vqsf-btn vqsf-btn--sm" onClick={foreign.replace}>Replace my cart</button><button type="button" className="vqsf-btn vqsf-btn--sm vqsf-btn--line" onClick={foreign.keep}>Keep it</button></>}>Your cart has items from another business. One business per order, so adding this will replace it.</Note>);

    const hours = store?.opening_hours;
    const today = store?.hours_guidance?.current_day_key;

    return (
        <div ref={rootRef} className={`vqsf ${restaurant ? 'vqsf--r' : ''} ${notices.length ? 'vqsf-has-notices' : ''} ${sticky ? 'vqsf-has-sticky' : ''}`} style={tokens} data-theme={theme}>
            <Head title={title}>
                <link rel="preconnect" href="https://api.fontshare.com" />
                <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=gambetta@400,401,500,501,600&display=swap" />
            </Head>

            <header className="vqsf-head">
                <nav className={`vqsf-nav ${scrolled ? 'is-scrolled' : ''} ${overImage && !scrolled && !notices.length ? 'on-image' : ''}`} aria-label="Main">
                    <Link href={store ? shopUrl(store.slug) : '/shop'} className="vqsf-brand" aria-label={`${store?.name || 'VenQore'} home`}>
                        {store?.logo_url ? <img src={store.logo_url} alt="" /> : !store ? <img src="/v6/assets/logo.png" alt="" /> : null}
                        <span className="nm"><span className="w1">{w1}</span>{w2 && <span className="w2">{w2}</span>}</span>
                    </Link>
                    {links.length > 0 && (
                        <div className="vqsf-links">
                            {links.map((l) => (l.onClick
                                ? <a key={l.id} href={l.href || '#'} onClick={(e) => { e.preventDefault(); l.onClick(); }}>{l.label}</a>
                                : <Link key={l.id} href={l.href} className={active === l.id ? 'on' : ''} aria-current={active === l.id ? 'page' : undefined}>{l.label}</Link>))}
                        </div>
                    )}
                    <button type="button" className="vqsf-searchbtn" onClick={() => { setSearchSeed(''); setSearchOpen(true); }} aria-label="Search">
                        <Search size={16} strokeWidth={1.8} />
                        <span>{searchPlaceholder || (store ? `Search ${store.name}…` : 'Search shops, food, products…')}</span>
                        <kbd className="hide-sm">⌘K</kbd>
                    </button>
                    {(where || store?.city) && (
                        <button type="button" className="vqsf-where" onClick={onWhere || (() => { window.location.hash = 'visit'; })}>
                            <MapPin size={15} strokeWidth={1.7} /><span>{where || store.city}</span>
                        </button>
                    )}
                    <div className="vqsf-acts">
                        {(() => {
                            // The way out: storefronts link to the marketplace, the marketplace to "create your store".
                            const c = cta || (store ? { label: 'All shops', href: '/shop', icon: 'grid', tone: 'line' } : { label: 'Create your store', href: '/build-workspace', icon: 'spark', tone: 'accent' });
                            const Ic = c.icon === 'spark' ? Sparkles : LayoutGrid;
                            return <a href={c.href} className={`vqsf-navcta vqsf-navcta--${c.tone}`} title={c.label}><Ic size={15} strokeWidth={2} /><span>{c.label}</span></a>;
                        })()}
                        <button type="button" className="vqsf-ib" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}</button>
                        {store && (
                            <button type="button" className="vqsf-acct" onClick={() => window.dispatchEvent(new CustomEvent('vqs-header-open', { detail: 'account' }))} aria-label={customer ? `Signed in as ${customer.name}` : 'Sign in'}>
                                {customer ? <span className="av">{customer.name?.charAt(0).toUpperCase()}</span> : <span className="av"><User size={13} /></span>}
                                <span className="nm">{customer ? customer.name.split(' ')[0] : 'Sign in'}</span>
                            </button>
                        )}
                        {store && saved && (
                            <button type="button" className="vqsf-ib opt" onClick={() => setDrawer('saved')} aria-label={`Saved items, ${saved.count}`}>
                                <Heart size={17} strokeWidth={1.7} />{saved.count > 0 && <span className="dot">{saved.count}</span>}
                            </button>
                        )}
                        {store && shop && !browseOnly && (
                            <button type="button" className="vqsf-cartbtn" onClick={() => setDrawer('cart')} aria-label={`Cart, ${shop.count} items`}>
                                <ShoppingCart size={16} strokeWidth={1.8} /><b>{shop.count}</b>
                            </button>
                        )}
                    </div>
                </nav>
            </header>

            {notices.length > 0 && <div className="vqsf-notices">{notices}</div>}

            <main>{children}</main>
            <EditPhotosBar />

            {store ? (
                <footer className="vqsf-foot" id="visit-foot">
                    <div className="vqsf-foot-grid">
                        <div className="about">
                            <div className="vqsf-brand" style={{ gap: 9 }}><span className="w1" style={{ fontSize: 22 }}>{w1}</span>{w2 && <span className="w2">{w2}</span>}</div>
                            {store.description && <p>{store.description}</p>}
                            {(store.address || store.city) && <div className="addr">{[store.address, store.city].filter(Boolean).join(', ')}{today && hours ? <><br />Today · {hoursText(hours[today])}</> : null}</div>}
                        </div>
                        <div>
                            <h4>{restaurant ? 'Order' : 'Shop'}</h4>
                            <ul>
                                <li><Link href={shopUrl(store.slug)}>Home</Link></li>
                                <li><Link href={productsUrl(store.slug)}>{restaurant ? 'Full menu' : 'All products'}</Link></li>
                                {(page.props.has_offers || page.props.on_offer?.length > 0) && <li><Link href={productsUrl(store.slug, { offer: 1 })}>On offer</Link></li>}
                                <li><Link href={productsUrl(store.slug, { sort: 'newest' })}>New arrivals</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Your orders</h4>
                            <ul>
                                {!browseOnly && <li><Link href={cartUrl(store.slug)}>Your cart</Link></li>}
                                <li><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('vqs-header-open', { detail: 'account' }))}>{customer ? 'Order history' : 'Sign in'}</button></li>
                                {!browseOnly && <li><Link href="/order-lookup">Track an order</Link></li>}
                                <li><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('vqs-header-open', { detail: 'rating' }))}>Rate this store</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Contact</h4>
                            <ul>
                                {store.phone && <li><a href={`tel:${store.phone}`}>{store.phone}</a></li>}
                                {store.email && <li><a href={`mailto:${store.email}`}>{store.email}</a></li>}
                                {store.map_url && <li><a href={store.map_url} target="_blank" rel="noopener noreferrer">Open in maps ↗</a></li>}
                                <li><Link href={`${shopUrl(store.slug)}#visit`}>Opening hours</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="vqsf-foot-base">
                        <span>© {new Date().getFullYear()} {store.name}. Orders are requests, confirmed by the business.</span>
                        <span style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}><Link href="/shop">More local shops</Link><Link href="/order-lookup">Lost your order link?</Link><a href="/">Powered by VenQore</a></span>
                    </div>
                </footer>
            ) : (
                <footer className="vqsf-foot">
                    <div className="vqsf-foot-grid">
                        <div className="about">
                            <div className="vqsf-brand" style={{ gap: 9 }}><span className="w1" style={{ fontSize: 22 }}>VenQore</span><span className="w2">Shops</span></div>
                            <p>Local shops and restaurants near you — order directly from the business, delivered or picked up.</p>
                        </div>
                        <div><h4>Shop</h4><ul><li><Link href="/shop">All shops</Link></li><li><Link href="/shop?offers=1">Offers</Link></li><li><Link href="/shop?open=1">Open now</Link></li></ul></div>
                        <div><h4>Orders</h4><ul><li><Link href="/order-lookup">Track an order</Link></li></ul></div>
                        <div><h4>Businesses</h4><ul><li><a href="/">Sell on VenQore</a></li><li><a href="/login">Business sign in</a></li></ul></div>
                    </div>
                    <div className="vqsf-foot-base"><span>© {new Date().getFullYear()} VenQore. Prices and availability are set by each business.</span></div>
                </footer>
            )}

            <div className={`vqsf-scrim ${searchOpen || drawer ? 'on' : ''}`} onClick={closeAll} aria-hidden="true" />
            <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} store={store} initial={searchSeed} suggestions={suggestions} onSubmit={submitSearch}
                placeholder={store ? (restaurant ? 'Search the menu…' : `Search ${store.name}…`) : 'Search shops, food and products…'} />
            {store && shop && saved && <Drawer open={!!drawer} tab={drawer || 'cart'} setTab={setDrawer} onClose={() => setDrawer(null)} store={store} shop={shop} saved={saved} show={show} maxQty={maxQty} />}
            <Toasts />
        </div>
    );
}

/** Wrap a page in the public shell (theme, account modals, scroll ownership) and the frame. */
export function StorePage(props) {
    const { store, ratingSummary, customer, title } = props;
    const page = usePage();
    return (
        <PublicShell bare headless={!!store} title={title || store?.name} storeSlug={store?.slug} ratingSummary={ratingSummary} customer={customer} catalogueOnly={store?.customer_mode === 'catalogue'}>
            <PhotosProvider images={store?.images || page.props.images || {}} edit={page.props.edit_photos || null}>
                <StoreFrame {...props} />
            </PhotosProvider>
        </PublicShell>
    );
}

export { DAY_LABEL };
