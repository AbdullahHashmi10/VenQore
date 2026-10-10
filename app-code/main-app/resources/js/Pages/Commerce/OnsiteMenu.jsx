import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Bell, Check, ClipboardList, Clock, Languages, Plus, Receipt, Search, ShoppingBag, X } from 'lucide-react';
import '../../../css/storefront.css';
import { useCommerceShell } from '@/Components/Commerce/PublicShell';
import DishRow from '@/Components/Storefront/DishRow';
import { Picture, Stepper, accentFor, fmt as money } from '@/Components/Storefront/parts';
import { StoreMark } from '@/Components/Storefront/StoreLayout';
import { cartStore, newKey } from '@/lib/commerce';
import { modsDelta, useShopCart } from '@/lib/shopCart';
import { TEXT } from '@/lib/onsiteText';

const THEME_KEY = 'vqs-theme';
const LANG_KEY = 'vq-onsite-lang';
const readTheme = () => { try { const v = localStorage.getItem(THEME_KEY); if (v === 'light' || v === 'dark') return v; } catch { /* storage blocked */ } return null; };
const deviceTheme = () => (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const SIX_HOURS = 6 * 60 * 60 * 1000;

/**
 * The QR menu a guest opens from a table or counter code.
 * One page, whole menu grouped by section, a sheet per dish (options, add-ons, a request for the kitchen),
 * an order sheet, and a "My orders" sheet with live status, Call a waiter and Request the bill.
 * Prices are only ever shown from the server's items; the server re-prices the order when it is sent.
 */
export default function OnsiteMenu({ store, preview, items, categories = [], filters = {}, show_images = true, limits, onsite }) {
    useCommerceShell();
    const scope = `${store.slug}:${onsite.channel}:${onsite.token || 'counter'}`;
    // A bag left over from the online store (or another table) must not leak into this order.
    useState(() => { const c = cartStore.read(); if (c.slug && c.slug !== scope) cartStore.clear(); return null; });
    const shop = useShopCart(scope, limits.max_qty);
    const sym = store.currency_symbol;
    const isTable = onsite.channel === 'table_qr';
    const style = store.catalogue_theme || 'visual-grid';

    const [theme] = useState(() => readTheme() || deviceTheme());
    // The business picks one extra language (any); the guest switches between English and it.
    const altInfo = store.alt_lang || null;
    const hasAlt = !!altInfo && items.some((i) => i.name_alt);
    const [lang, setLang] = useState(() => { try { return localStorage.getItem(LANG_KEY) === 'alt' ? 'alt' : 'en'; } catch { return 'en'; } });
    const alt = hasAlt && lang === 'alt';
    const code = alt ? altInfo.code : 'en';
    const T = { ...TEXT.en, ...(TEXT[code] || {}) };          // words we have not translated fall back to English
    const rtl = alt && !!altInfo.rtl;
    const switchLang = () => { const n = alt ? 'en' : 'alt'; setLang(n); try { localStorage.setItem(LANG_KEY, n); } catch { /* ignore */ } };

    const [q, setQ] = useState(filters.q || '');
    const [current, setCurrent] = useState(null);
    const [sheet, setSheet] = useState(null);          // null | 'dish' | 'cart' | 'orders'
    const [dish, setDish] = useState(null);
    const [toast, setToast] = useState(null);
    const pillsRef = useRef(null);

    useEffect(() => {
        const on = (e) => { setToast(e.detail); setTimeout(() => setToast(null), 2200); };
        window.addEventListener('vqs-toast', on);
        return () => window.removeEventListener('vqs-toast', on);
    }, []);
    const say = (text) => { try { window.dispatchEvent(new CustomEvent('vqs-toast', { detail: text })); } catch { /* ignore */ } };

    // ── the menu, filtered locally (the whole menu is on the page) ──
    const needle = q.trim().toLowerCase();
    const visible = useMemo(() => (needle
        ? items.filter((i) => `${i.name} ${i.name_alt || ''} ${i.description || ''}`.toLowerCase().includes(needle))
        : items), [items, needle]);
    const groups = useMemo(() => {
        const by = new Map();
        visible.forEach((it) => { const k = it.category ? (categories.find((c) => c.name === it.category)?.id ?? it.category) : '_none'; if (!by.has(k)) by.set(k, { id: k, name: it.category || T.menu, items: [] }); by.get(k).items.push(it); });
        const ordered = categories.filter((c) => by.has(c.id)).map((c) => by.get(c.id));
        if (by.has('_none')) ordered.push(by.get('_none'));
        return ordered;
    }, [visible, categories, T.menu]);

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined' || groups.length < 2) return undefined;
        const seen = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
            const v = [...seen.entries()].filter(([, t]) => t !== null).sort((a, b) => a[1] - b[1])[0];
            if (v) setCurrent(v[0].replace('os-cat-', ''));
        }, { rootMargin: '-96px 0px -60% 0px', threshold: 0 });
        groups.forEach((g) => { const el = document.getElementById(`os-cat-${g.id}`); if (el) io.observe(el); });
        return () => io.disconnect();
    }, [groups]);
    useEffect(() => {
        const el = pillsRef.current?.querySelector('[aria-current="true"]');
        if (el && pillsRef.current) pillsRef.current.scrollTo({ left: el.offsetLeft - 40, behavior: 'smooth' });
    }, [current]);
    const jump = (id) => { document.getElementById(`os-cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setCurrent(String(id)); };

    // ── prices for the bag (display only; the server prices the order) ──
    const priceOf = useMemo(() => {
        const map = new Map();
        items.forEach((i) => { map.set(i.id, Number(i.price)); (i.options || []).forEach((o) => map.set(o.id, Number(o.price))); });
        return (line) => (map.get(line.item_id) ?? 0) + modsDelta(line.mods);
    }, [items]);
    const lines = shop.cart.lines;
    const total = lines.reduce((n, l) => n + priceOf(l) * l.quantity, 0);
    const accepting = store.accepting_orders && !preview;
    const holdText = preview ? 'Preview only: ordering is switched off.' : (store.onsite_hold || T.held);

    // ── dish sheet ──
    const openDish = useCallback((item) => { setDish(item); setSheet('dish'); }, []);

    // ── sending ──
    const [form, setForm] = useState({ name: '', note: '' });
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState(null);
    const [offline, setOffline] = useState(false);
    const attempt = useRef({ sig: '', key: '' });
    const ordersKey = `vq-onsite-orders:${scope}`;
    const [orders, setOrders] = useState(() => {
        try { return (JSON.parse(localStorage.getItem(ordersKey) || '[]') || []).filter((o) => Date.now() - o.at < SIX_HOURS); } catch { return []; }
    });
    const saveOrders = (list) => { setOrders(list); try { localStorage.setItem(ordersKey, JSON.stringify(list.slice(0, 8))); } catch { /* ignore */ } };

    const canSend = accepting && lines.length > 0 && !busy && (isTable || form.name.trim());
    const send = useCallback(async (e) => {
        e?.preventDefault();
        if (!canSend) return;
        setBusy(true); setProblem(null); setOffline(false);
        const payload = {
            table_token: onsite.token || null,
            customer_name: form.name || null,
            customer_note: form.note || null,
            items: lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, mods: (l.mods || []).map((m) => m.id), notes: l.notes || null })),
        };
        const sig = JSON.stringify(payload);
        if (attempt.current.sig !== sig) attempt.current = { sig, key: newKey() };
        try {
            const r = await axios.post(onsite.submit_url, { ...payload, idempotency_key: attempt.current.key });
            shop.clear();
            saveOrders([{ number: r.data.order_number, at: Date.now() }, ...orders.filter((o) => o.number !== r.data.order_number)]);
            setForm((f) => ({ ...f, note: '' }));
            attempt.current = { sig: '', key: '' };
            setSheet('orders');
        } catch (err) {
            if (!err.response) { setOffline(true); } else { setProblem(err.response.data?.message || 'We could not send your order. Please ask a member of staff.'); }
        } finally { setBusy(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSend, form, lines, onsite, orders, shop]);

    // The same order is safely re-sent (same key) when the connection comes back.
    const sendRef = useRef(send);
    sendRef.current = send;
    useEffect(() => {
        if (!offline) return undefined;
        const back = () => sendRef.current();
        window.addEventListener('online', back);
        return () => window.removeEventListener('online', back);
    }, [offline]);

    // ── "My orders": live status, call waiter, bill ──
    const [statuses, setStatuses] = useState({});
    const [calling, setCalling] = useState(null);
    useEffect(() => {
        if (sheet !== 'orders' || orders.length === 0) return undefined;
        let stop = false;
        const pull = async () => {
            for (const o of orders.slice(0, 4)) {
                try {
                    const r = await axios.get(`/catalogue/${store.slug}/order/${o.number}`, { headers: { Accept: 'application/json' } });
                    if (!stop) setStatuses((s) => ({ ...s, [o.number]: r.data }));
                } catch { /* stay on what we had */ }
            }
        };
        pull();
        const t = setInterval(pull, 10000);
        return () => { stop = true; clearInterval(t); };
    }, [sheet, orders, store.slug]);
    const call = async (kind) => {
        setCalling(kind);
        try {
            const r = await axios.post(`/catalogue/${store.slug}/call`, { table_token: onsite.token, kind });
            say(r.data.message);
            setStatuses((s) => { const first = orders[0]?.number; return first && s[first] ? { ...s, [first]: { ...s[first], call: { kind, at: new Date().toISOString() } } } : s; });
        } catch (err) { say(err.response?.data?.message || 'Please ask a member of staff.'); } finally { setCalling(null); }
    };
    const activeCall = Object.values(statuses).map((s) => s.call).find(Boolean);

    // keep the page quiet if the browser can cache the menu (see public/onsite-sw.js)
    useEffect(() => {
        if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/onsite-sw.js', { scope: '/catalogue/' }).catch(() => {});
    }, []);

    useEffect(() => {
        document.body.style.overflow = sheet ? 'hidden' : '';
        const esc = (e) => { if (e.key === 'Escape') setSheet(null); };
        window.addEventListener('keydown', esc);
        return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
    }, [sheet]);

    const hero = store.banner_url ? { background: `linear-gradient(180deg, rgb(8 10 12 / .35), rgb(8 10 12 / .85)), center / cover no-repeat url("${store.banner_url}")` } : {};
    const empty = items.length === 0;

    return (
        <div className="vqs-shop" data-theme={theme}>
            <Head title={`${store.name} — ${isTable ? onsite.label : T.orderAtCounter}`}>
                <meta name="robots" content="noindex,nofollow" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            </Head>
            <main className="vqs-wrap vqs-main">
                <div className={`sf sf--onsite sf--os-${style}`} style={accentFor(store.slug)} dir={rtl ? 'rtl' : undefined} lang={alt ? altInfo.code : undefined}>
                    <header className="sf-os-head" style={hero}>
                        <div className="sf-os-head-row">
                            <StoreMark store={store} size="md" />
                            <div className="sf-os-head-text">
                                <h1>{store.name}</h1>
                                {store.description && <p>{store.description}</p>}
                            </div>
                            {hasAlt && <button type="button" className="sf-os-lang" onClick={switchLang}><Languages size={15} />{alt ? 'English' : altInfo.label}</button>}
                        </div>
                        <ul className="sf-os-chips">
                            <li className="sf-os-where">{isTable ? T.orderingFor(onsite.label) : T.orderAtCounter}</li>
                            {store.prep_minutes && <li><Clock size={13} />{T.prep(store.prep_minutes)}</li>}
                            {(accepting && store.closed_by_hours === false) && <li className="ok"><Check size={13} />{T.open}</li>}
                        </ul>
                    </header>

                    {!accepting && !empty && <div className="sf-os-hold" role="status">{holdText}</div>}
                    {offline && <div className="sf-os-hold sf-os-hold--warn" role="status">{T.offline}</div>}

                    <div className="sf-os-tools">
                        <label className="sf-os-find"><Search size={16} aria-hidden="true" />
                            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} aria-label={T.search} maxLength={60} />
                            {q && <button type="button" aria-label={T.close} onClick={() => setQ('')}><X size={15} /></button>}
                        </label>
                        {orders.length > 0 && <button type="button" className="sf-os-mine" onClick={() => setSheet('orders')}><ClipboardList size={16} />{T.myOrders}<b>{orders.length}</b></button>}
                    </div>

                    {groups.length > 1 && (
                        <nav className="sf-r-bar sf-os-bar" aria-label={T.menu}>
                            <div className="sf-r-pills sf-r-pills--bar" ref={pillsRef}>
                                {groups.map((g) => <button key={g.id} type="button" aria-current={String(current ?? groups[0].id) === String(g.id) ? 'true' : undefined} onClick={() => jump(g.id)}>{g.name}<small>{g.items.length}</small></button>)}
                            </div>
                        </nav>
                    )}

                    {empty ? <div className="sf-empty"><b>{T.menuEmpty}</b></div> : groups.length === 0 ? <div className="sf-empty"><b>{T.noMatch}</b></div> : groups.map((g) => (
                        <section key={g.id} id={`os-cat-${g.id}`} className="sf-r-section" aria-label={g.name}>
                            <header className="sf-r-grouphead"><h2>{g.name}</h2><span className="sf-muted">{g.items.length}</span></header>
                            <div className="sf-r-dishes sf-os-dishes">
                                {g.items.map((it) => <DishRow key={it.id} item={it} store={store} shop={shop} alt={alt} code={code} rtl={rtl} showImages={show_images && style !== 'editorial-ledger'} canAdd={accepting} onOpen={openDish} />)}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {lines.length > 0 && sheet === null && (
                <button type="button" className="sf-os-bar-cta" onClick={() => setSheet('cart')} style={accentFor(store.slug)}>
                    <ShoppingBag size={18} /><b>{T.viewOrder}</b><span>{T.items(shop.count)} · {money(total, sym)}</span>
                </button>
            )}
            {lines.length === 0 && orders.length > 0 && sheet === null && (
                <button type="button" className="sf-os-bar-cta sf-os-bar-cta--quiet" onClick={() => setSheet('orders')} style={accentFor(store.slug)}>
                    <ClipboardList size={18} /><b>{T.myOrders}</b>
                </button>
            )}

            {sheet && <button type="button" className="sf-os-scrim" aria-label={T.close} onClick={() => setSheet(null)} />}

            {sheet === 'dish' && dish && (
                <DishSheet key={dish.id} item={dish} T={T} alt={alt} rtl={rtl} sym={sym} accepting={accepting} showImages={show_images && style !== 'editorial-ledger'} maxQty={limits.max_qty}
                    onClose={() => setSheet(null)}
                    onAdd={(cur, mods, qty, note) => { shop.add({ id: cur.id, name: dish.name, label: cur.label, image_url: cur.image_url, quiet: true }, mods, qty, note); say(`${dish.name} +${qty}`); setSheet(null); }} accent={accentFor(store.slug)} />
            )}

            {sheet === 'cart' && (
                <section className="sf-os-sheet" role="dialog" aria-modal="true" aria-label={T.yourOrder} style={accentFor(store.slug)} dir={rtl ? 'rtl' : undefined}>
                    <header><h2>{T.yourOrder}</h2><button type="button" className="sf-iconbtn" aria-label={T.close} onClick={() => setSheet(null)}><X size={18} /></button></header>
                    <div className="sf-os-sheet-body">
                        {lines.length === 0 ? <p className="sf-muted">{T.empty}</p> : (
                            <ul className="sf-os-lines">
                                {lines.map((l) => <CartLine key={l.key} line={l} T={T} sym={sym} unit={priceOf(l)} shop={shop} />)}
                            </ul>
                        )}
                        <form onSubmit={send} className="sf-os-form">
                            <label>{isTable ? T.yourNameOpt : T.yourName}
                                <input className="sf-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required={!isTable} maxLength={120} />
                            </label>
                            <label>{T.noteForStaff}
                                <textarea className="sf-input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={500} />
                            </label>
                            <div className="sf-os-total"><span>{T.total}</span><b>{money(total, sym)}</b></div>
                            <p className="sf-os-fine">{T.finalNote}</p>
                            {!accepting && <p className="sf-os-problem">{holdText}</p>}
                            {problem && <p className="sf-os-problem" role="alert">{problem}</p>}
                            {offline && <p className="sf-os-problem" role="alert">{T.offline}</p>}
                            <button type="submit" className="sf-btn sf-btn--lg sf-btn--block" disabled={!canSend}>{busy ? T.sending : T.send(isTable ? onsite.label : T.counter)}</button>
                        </form>
                    </div>
                </section>
            )}

            {sheet === 'orders' && (
                <section className="sf-os-sheet" role="dialog" aria-modal="true" aria-label={T.myOrders} style={accentFor(store.slug)} dir={rtl ? 'rtl' : undefined}>
                    <header><h2>{T.myOrders}</h2><button type="button" className="sf-iconbtn" aria-label={T.close} onClick={() => setSheet(null)}><X size={18} /></button></header>
                    <div className="sf-os-sheet-body">
                        {orders.length === 0 && <p className="sf-muted">{T.empty}</p>}
                        {orders.map((o) => <OrderCard key={o.number} order={o} status={statuses[o.number]} T={T} />)}
                        {isTable && (
                            <div className="sf-os-help">
                                {activeCall && <p className="sf-os-called"><Bell size={15} />{activeCall.kind === 'bill' ? T.billAsked : T.waiterAsked}</p>}
                                <div>
                                    <button type="button" className="sf-btn sf-btn--ghost" disabled={!!calling} onClick={() => call('waiter')}><Bell size={16} />{T.callWaiter}</button>
                                    <button type="button" className="sf-btn sf-btn--ghost" disabled={!!calling} onClick={() => call('bill')}><Receipt size={16} />{T.requestBill}</button>
                                </div>
                            </div>
                        )}
                        <button type="button" className="sf-btn sf-btn--lg sf-btn--block" onClick={() => setSheet(null)}>{T.orderMore}</button>
                    </div>
                </section>
            )}

            {toast && <div className="sf-os-toast" role="status"><Check size={15} />{toast}</div>}
        </div>
    );
}

function CartLine({ line, T, sym, unit, shop }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(line.notes || '');
    const commit = () => { setEditing(false); if ((line.notes || '') !== text.trim()) shop.setNote(line.key, text); };
    return (
        <li className="sf-os-line">
            {line.image_url && <img src={line.image_url} alt="" loading="lazy" />}
            <div className="sf-os-line-main">
                <b>{line.name}</b>
                {(line.mods || []).length > 0 && <span className="sf-muted">{line.mods.map((m) => m.name).join(', ')}</span>}
                {editing ? (
                    <input className="sf-input sf-os-note-in" autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} placeholder={T.notePlaceholder} maxLength={200} />
                ) : line.notes ? (
                    <button type="button" className="sf-os-note" onClick={() => setEditing(true)}>“{line.notes}”</button>
                ) : (
                    <button type="button" className="sf-os-note sf-os-note--add" onClick={() => setEditing(true)}>{T.addNote}</button>
                )}
            </div>
            <div className="sf-os-line-side">
                <span>{money(unit * line.quantity, sym)}</span>
                <Stepper small value={line.quantity} max={50} label={line.name} onChange={(n) => shop.setQty(line.key, n)} />
            </div>
        </li>
    );
}

function OrderCard({ order, status, T }) {
    const label = { waiting: T.waiting, kitchen: T.kitchen, done: T.done, changed: T.changed };
    const st = status?.status;
    return (
        <article className={`sf-os-order sf-os-order--${st || 'loading'}`}>
            <header>
                <div><small>{T.reference}</small><b>{order.number}</b></div>
                {st && <span className="sf-os-state">{label[st]}</span>}
            </header>
            {status?.lines?.length > 0 && (
                <ul>
                    {status.lines.map((l, i) => (
                        <li key={i}><span>{l.qty} × {l.name}{l.mods.length > 0 ? ` (${l.mods.join(', ')})` : ''}{l.notes ? ` — “${l.notes}”` : ''}</span><em className={`is-${l.state}`}>{label[l.state === 'done' ? 'done' : l.state] || ''}</em></li>
                    ))}
                </ul>
            )}
            {status?.removed_lines?.length > 0 ? status.removed_lines.map((g, i) => <p key={i} className="sf-os-problem">{T.removedLine(g.name, g.reason)}</p>) : (status && status.removed > 0 && <p className="sf-os-problem">{T.removedHelp(status.removed)}</p>)}
            {st === 'changed' && <p className="sf-os-problem">{T.changedHelp}</p>}
        </article>
    );
}

function DishSheet({ item, T, alt, rtl, sym, accepting, showImages, maxQty, onClose, onAdd, accent }) {
    const options = item.options || [];
    const hasOptions = options.length > 1;
    const [optId, setOptId] = useState(() => (options.find((o) => o.stock !== 'out') || options[0])?.id);
    const cur = useMemo(() => {
        if (!hasOptions) return { id: item.id, label: null, price: item.price, was_price: item.was_price, stock: item.stock, left: item.left, image_url: item.image_url, addons: item.addons || [] };
        const o = options.find((x) => String(x.id) === String(optId)) || options[0];
        return { id: o.id, label: o.label, price: o.price, was_price: o.was_price, stock: o.stock, left: o.left, image_url: o.image_url || item.image_url, addons: o.addons || [] };
    }, [hasOptions, options, optId, item]);
    const [picked, setPicked] = useState(() => { const s = {}; (cur.addons || []).forEach((g) => { s[g.id] = g.options.filter((o) => o.is_default).map((o) => o.id); }); return s; });
    const [seen, setSeen] = useState(String(cur.id));
    if (seen !== String(cur.id)) { const s = {}; cur.addons.forEach((g) => { s[g.id] = g.options.filter((o) => o.is_default).map((o) => o.id); }); setPicked(s); setSeen(String(cur.id)); }
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState('');
    const chosen = cur.addons.flatMap((g) => g.options.filter((o) => (picked[g.id] || []).includes(o.id)));
    const missing = cur.addons.filter((g) => (picked[g.id] || []).length < Math.max(g.min_select || 0, g.required ? 1 : 0));
    const unit = Number(cur.price) + modsDelta(chosen);
    const out = cur.stock === 'out';
    const title = alt && item.name_alt ? item.name_alt : item.name;
    const toggle = (g, o) => setPicked((c) => {
        const now = c[g.id] || [];
        if (g.max_select === 1) return { ...c, [g.id]: now.includes(o.id) ? (g.required ? now : []) : [o.id] };
        if (now.includes(o.id)) return { ...c, [g.id]: now.filter((x) => x !== o.id) };
        if (g.max_select > 0 && now.length >= g.max_select) return c;
        return { ...c, [g.id]: [...now, o.id] };
    });
    const canAdd = accepting && !out && missing.length === 0;

    return (
        <section className="sf-os-sheet sf-os-sheet--dish" role="dialog" aria-modal="true" aria-label={title} style={accent} dir={rtl ? 'rtl' : undefined}>
            <header><h2>{title}</h2><button type="button" className="sf-iconbtn" aria-label={T.close} onClick={onClose}><X size={18} /></button></header>
            <div className="sf-os-sheet-body">
                {showImages && cur.image_url && <div className="sf-os-dishphoto"><Picture item={{ ...item, image_url: cur.image_url }} showImages eager /></div>}
                {item.description && <p className="sf-os-desc">{item.description}</p>}
                {(item.tags || []).length > 0 && <p className="sf-os-tags">{item.tags.map((t) => <span key={t}>{T.tags[t] || t}</span>)}</p>}
                {item.allergens && <p className="sf-os-allergen"><b>{T.allergens}:</b> {item.allergens}</p>}
                <p className="sf-os-price"><b>{money(unit, sym)}</b>{cur.was_price && <s>{money(cur.was_price, sym)}</s>}</p>
                {out ? <p className="sf-stock sf-stock--out">{T.soldOut}</p> : cur.stock === 'low' ? <p className="sf-stock sf-stock--low">{T.onlyLeft(cur.left)}</p> : null}
                {hasOptions && (
                    <fieldset className="sf-opts"><legend>{T.chooseOne}</legend>
                        <div>{options.map((o) => <button type="button" key={o.id} className={String(o.id) === String(optId) ? 'on' : ''} disabled={o.stock === 'out'} aria-pressed={String(o.id) === String(optId)} onClick={() => setOptId(o.id)}>{o.label}{o.stock === 'out' ? ` · ${T.soldOut}` : ''}</button>)}</div>
                    </fieldset>
                )}
                {cur.addons.map((g) => (
                    <fieldset key={g.id} className="sf-addons">
                        <legend>{g.name}<small>{g.required || g.min_select > 0 ? T.required : T.optional}{g.max_select > 1 ? ` · ${T.upTo(g.max_select)}` : ''}</small></legend>
                        {g.options.map((o) => {
                            const on = (picked[g.id] || []).includes(o.id);
                            return (
                                <label key={o.id} className={on ? 'on' : ''}>
                                    <input type={g.max_select === 1 ? 'radio' : 'checkbox'} name={`g${g.id}`} checked={on} onChange={() => toggle(g, o)} />
                                    <span className="sf-addon-box">{on && <Check size={13} strokeWidth={3} />}</span>
                                    <span className="sf-addon-name">{o.name}</span>
                                    {Number(o.price_delta) !== 0 && <span className="sf-addon-price">{Number(o.price_delta) > 0 ? '+' : '−'}{money(Math.abs(o.price_delta), sym)}</span>}
                                </label>
                            );
                        })}
                    </fieldset>
                ))}
                <label className="sf-os-notefield">{T.noteLabel}
                    <input className="sf-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={T.notePlaceholder} maxLength={200} />
                </label>
            </div>
            <footer className="sf-os-sheet-foot">
                <Stepper value={qty} min={1} max={maxQty} label={title} onChange={setQty} />
                <button type="button" className="sf-btn sf-btn--lg" disabled={!canAdd} onClick={() => onAdd(cur, chosen.map((o) => ({ id: o.id, name: o.name, price_delta: o.price_delta })), qty, note)}>
                    <Plus size={17} />{T.addToOrder} · {money(unit * qty, sym)}
                </button>
            </footer>
        </section>
    );
}
