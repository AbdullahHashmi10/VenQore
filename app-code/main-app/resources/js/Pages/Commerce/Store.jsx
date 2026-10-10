import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { MapPin, Clock, ShieldCheck, Minus, Plus, Headphones, Laptop, Monitor, Smartphone, Watch, Keyboard, Mouse, Cable, Gamepad2, Package, ArrowUpRight, ShoppingBag } from 'lucide-react';
import '../../../css/catalogue-studio.css';
import PublicShell, { shopToast } from '@/Components/Commerce/PublicShell';
import EditorialMenu from '@/Components/Commerce/EditorialMenu';
import StoreShowcase from '@/Components/Commerce/StoreShowcase';
import { Alert, Badge, Btn, Field, Icon, Pager, initials, tone } from '@/Components/Commerce/shop';
import StoreBadges from '@/Components/Commerce/StoreBadges';
import { DAY_LABEL, cartStore, money, newKey } from '@/lib/commerce';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function ProductIllustration({ item }) {
    const name = `${item.name} ${item.category || ''}`.toLowerCase();
    const Symbol = /watch|wearable/.test(name) ? Watch : /headphone|airpod|audio|earbud/.test(name) ? Headphones : /keyboard/.test(name) ? Keyboard : /mouse/.test(name) ? Mouse : /laptop|macbook|computer/.test(name) ? Laptop : /monitor|display/.test(name) ? Monitor : /phone|tablet|ipad/.test(name) ? Smartphone : /cable|usb|ssd|storage/.test(name) ? Cable : /gaming|playstation|controller/.test(name) ? Gamepad2 : Package;
    return <span className="vqs-product-illustration" aria-hidden="true"><Symbol strokeWidth={1} /><span>No photo available</span></span>;
}

function format12Time(val) {
    if (!val || !val.includes(':')) return '';
    const [hStr, mStr] = val.split(':');
    let h24 = parseInt(hStr, 10);
    const m = (parseInt(mStr, 10) || 0).toString().padStart(2, '0');
    if (isNaN(h24)) return val;
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m} ${period}`;
}

function formatHourRange(h) {
    if (!h || !h.open || !h.close) return 'Closed';
    if (h.open === h.close) return 'Open 24 hours';
    const o = format12Time(h.open);
    const c = format12Time(h.close);
    const [oh, om] = h.open.split(':').map((n) => parseInt(n, 10) || 0);
    const [ch, cm] = h.close.split(':').map((n) => parseInt(n, 10) || 0);
    const isOvernight = (ch * 60 + cm) < (oh * 60 + om);
    let str = isOvernight ? `${o} – ${c} (+1 Day)` : `${o} – ${c}`;
    if (h.break_start && h.break_end) {
        str += ` · Break: ${format12Time(h.break_start)} – ${format12Time(h.break_end)}`;
    }
    return str;
}

export default function Store({ preview, store, items, pagination, limits, categories = [], showcase = null, filters = {}, show_images = true, has_coupons = false, rating_summary, customer, onsite = null }) {
    const catalogueTheme = ['visual-grid', 'editorial-ledger', 'express-rail'].includes(store.catalogue_theme) ? store.catalogue_theme : 'visual-grid';
    const catalogueOnly = store.customer_mode === 'catalogue';
    const onsiteMode = Boolean(onsite);
    const browseOnly = catalogueOnly && !onsiteMode;
    const canAdd = onsiteMode || store.accepting_orders;
    const cartScope = onsiteMode ? `${store.slug}:${onsite.channel}:${onsite.token || 'counter'}` : store.slug;
    const [search, setSearch] = useState(filters.q || '');
    const cataloguePath = onsiteMode
        ? (onsite.channel === 'table_qr' ? `/catalogue/${store.slug}/table/${onsite.token}` : `/catalogue/${store.slug}`)
        : `/shop/${store.slug}`;
    const goCatalogue = (params) => router.get(cataloguePath, { q: filters.q || undefined, category: filters.category || undefined, ...params }, { preserveState: true, preserveScroll: true, only: ['items', 'pagination', 'filters', 'categories', 'showcase', 'onsite'] });
    const sym = store.currency_symbol;
    const [cartRev, setCartRev] = useState(0); // bump to re-read the persisted cart
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cart = useMemo(() => { const c = cartStore.read(); return c.slug === cartScope ? c : { slug: cartScope, lines: [] }; }, [cartScope, cartRev]);
    const [pendingSwitch, setPendingSwitch] = useState(null); // item waiting for "replace cart?" answer
    const [picker, setPicker] = useState(null); // item whose add-ons the customer is choosing
    const [picked, setPicked] = useState({}); // add-on group id -> chosen option ids
    // The same dish with different add-ons is a different cart line.
    const modsKey = (mods) => (mods || []).map((m) => m.id).sort((a, b) => a - b).join(',');
    const kOf = (l) => l.key || l.item_id;
    const modsDelta = (mods) => (mods || []).reduce((n, m) => n + (Number(m.price_delta) || 0), 0);
    const qtyOfItem = (id) => cart.lines.filter((l) => l.item_id === id).reduce((n, l) => n + l.quantity, 0);
    const [quoteRaw, setQuote] = useState(null);
    const [problemsRaw, setProblems] = useState([]);
    const onsiteItems = useMemo(() => items.flatMap((item) => item.options?.length ? item.options.map((option) => ({ ...item, ...option })) : [item]), [items]);
    const onsiteQuote = useMemo(() => {
        if (!onsiteMode || !cart.lines.length) return null;
        const priced = cart.lines.map((line) => {
            const item = onsiteItems.find((candidate) => candidate.id === line.item_id);
            const unit = item ? Number(item.price) + modsDelta(line.mods) : 0;
            return item ? { item_id: line.item_id, title: line.name, mods: line.mods || [], quantity: line.quantity, price: unit, line_total: unit * line.quantity } : null;
        }).filter(Boolean);
        const total = priced.reduce((sum, line) => sum + line.line_total, 0);
        return { items: priced, subtotal: total, tax_total: 0, delivery_fee: 0, discount_total: 0, total };
    }, [onsiteMode, onsiteItems, cart.lines]);
    const quote = cart.lines.length ? (onsiteMode ? onsiteQuote : quoteRaw) : null;
    const problems = cart.lines.length ? problemsRaw : [];
    const [notice, setNotice] = useState(null);
    const [busy, setBusy] = useState(false);
    const [openedAt] = useState(() => Date.now()); // bot check: a person takes more than a few seconds
    const [cartOpen, setCartOpen] = useState(false); // mobile cart sheet
    const [detail, setDetail] = useState(null);       // product detail sheet
    const [fulfilment, setFulfilment] = useState(store.pickup ? 'pickup' : 'delivery');
    const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', company_site: '', delivery_address: '', customer_note: '', payment_method: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [zone, setZone] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [couponError, setCouponError] = useState(null);
    const zones = store.delivery_zones || [];
    const attempt = useRef({ sig: '', key: '' });
    const [opt, setOpt] = useState({});                   // card id -> chosen option id
    const pick = (raw) => {
        if (!raw.options || raw.options.length < 2) return raw;
        const o = raw.options.find((x) => x.id === opt[raw.id]) || raw.options.find((x) => x.stock !== 'out') || raw.options[0];
        return { ...raw, ...o, name: raw.name, label: o.label, key: raw.id, options: raw.options };
    };
    const renderOptions = (it) => (it.options && it.options.length > 1 ? (
        <fieldset className="vqs-opts" aria-label="Choose an option">
            {it.options.map((o) => (
                <button type="button" key={o.id} className={`vqs-opt ${o.id === it.id ? 'on' : ''} ${o.stock === 'out' ? 'out' : ''}`} aria-pressed={o.id === it.id} onClick={() => setOpt((m) => ({ ...m, [it.key]: o.id }))}>{o.label}</button>
            ))}
        </fieldset>
    ) : null);

    useEffect(() => {
        const open = Boolean(cartOpen || detail);
        if (open) {
            document.documentElement.setAttribute('data-vq-modal-open', 'true');
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.removeAttribute('data-vq-modal-open');
            document.body.style.overflow = '';
        }
        const onKey = (e) => { if (e.key === 'Escape') { setCartOpen(false); setDetail(null); } };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.documentElement.removeAttribute('data-vq-modal-open');
            document.body.style.overflow = '';
        };
    }, [cartOpen, detail]);

    const persist = (next) => { cartStore.write(next); setCartRev((r) => r + 1); };

    const methods = useMemo(() => {
        const m = [];
        if (fulfilment === 'delivery' && store.payments.cod) m.push(['cod', 'Cash on delivery']);
        if (fulfilment === 'pickup' && store.payments.pickup) m.push(['pickup', 'Pay at pickup']);
        if (store.payments.bank) m.push(['bank', 'Bank transfer']);
        return m;
    }, [fulfilment, store.payments]);

    const payment = methods.some(([k]) => k === form.payment_method) ? form.payment_method : (methods[0]?.[0] || '');

    // server quote (debounced) — the browser never computes prices
    useEffect(() => {
        if (cart.lines.length === 0 || onsiteMode) return undefined;
        const t = setTimeout(() => {
            axios.post(`/shop/${store.slug}/quote`, { items: cart.lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, mods: (l.mods || []).map((m) => m.id) })), fulfilment, delivery_zone: fulfilment === 'delivery' && zone ? zone : undefined, coupon: coupon || undefined })
                .then((r) => { setQuote(r.data); setProblems([]); setCouponError(null); })
                .catch((e) => {
                    const d = e.response?.data;
                    if (d?.reason === 'cart_changed') { setProblems(d.problems || []); setQuote(null); }
                    else if (d?.reason === 'invalid_coupon') { setCouponError(d.message); setCoupon(''); }
                    else setNotice(d?.message || 'Could not price your cart. Please try again.');
                });
        }, 250);
        return () => clearTimeout(t);
    }, [cart.lines, fulfilment, store.slug, zone, coupon, onsiteMode]);

    const openPicker = (item) => {
        const start = {};
        (item.addons || []).forEach((g) => { start[g.id] = g.options.filter((o) => o.is_default).map((o) => o.id); });
        setPicked(start); setDetail(null); setPicker(item);
    };
    const add = (item) => {
        const cur = cartStore.read();
        if (cur.slug && cur.slug !== cartScope && cur.lines.length > 0) { setPendingSwitch(item); return; }
        if (item.addons?.length) { openPicker(item); return; }
        addLine(item, []);
    };
    const addLine = (item, mods) => {
        const lines = [...cart.lines];
        const key = `${item.id}|${modsKey(mods)}`;
        const ex = lines.find((l) => kOf(l) === key || (!l.key && !mods.length && l.item_id === item.id));
        if (ex) ex.quantity = Math.min(limits.max_qty, ex.quantity + 1);
        else lines.push({ item_id: item.id, key, quantity: 1, mods, name: item.label ? `${item.name} — ${item.label}` : item.name });
        persist({ slug: cartScope, lines });
        shopToast(`${item.name} added to your bag`);
    };
    // A key picks one cart line; a bare item id (from a product card) picks that item's latest line.
    const setQty = (id, q) => {
        let target = cart.lines.findIndex((l) => kOf(l) === id);
        if (target < 0) { for (let i = cart.lines.length - 1; i >= 0; i -= 1) { if (cart.lines[i].item_id === id) { target = i; break; } } }
        const lines = cart.lines.map((l, i) => (i === target ? { ...l, quantity: Math.max(0, Math.min(limits.max_qty, q)) } : l)).filter((l) => l.quantity > 0);
        persist({ slug: cartScope, lines });
    };
    const removeProblems = () => persist({ slug: cartScope, lines: cart.lines.filter((l) => !problems.some((p) => p.item_id === l.item_id)) });

    const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
    const minOrder = Number(quote?.min_order ?? store.min_order_amount ?? 0);
    const zoneMissing = fulfilment === 'delivery' && zones.length > 0 && !zone;
    const belowMin = quote && minOrder > 0 && (quote.subtotal + quote.tax_total) < minOrder;
    const canSubmit = onsiteMode
        ? Boolean(quote && !busy && problems.length === 0 && (onsite.channel === 'table_qr' || form.customer_name.trim()))
        : Boolean(store.accepting_orders && quote && !belowMin && !busy && problems.length === 0 && form.customer_name.trim() && form.customer_phone.trim() && !zoneMissing && payment && (fulfilment === 'pickup' || form.delivery_address.trim()));

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true); setNotice(null); setFieldErrors({});
        if (onsiteMode) {
            const payload = {
                table_token: onsite.token || null,
                customer_name: form.customer_name || null,
                customer_note: form.customer_note || null,
                items: cart.lines.map((line) => ({ item_id: line.item_id, quantity: line.quantity, mods: (line.mods || []).map((m) => m.id) })),
            };
            const sig = JSON.stringify(payload);
            if (attempt.current.sig !== sig) attempt.current = { sig, key: newKey() };
            try {
                const response = await axios.post(onsite.submit_url, { ...payload, idempotency_key: attempt.current.key });
                cartStore.clear(); setCartRev((revision) => revision + 1); setCartOpen(false);
                setNotice({ success: true, text: `${response.data.message} Reference ${response.data.order_number}.` });
                shopToast('Order sent to the POS');
            } catch (err) {
                setNotice(err.response?.data?.message || 'We could not send your order. Please ask a staff member.');
            } finally { setBusy(false); }
            return;
        }
        const payload = {
            fulfilment, payment_method: payment, customer_name: form.customer_name, customer_phone: form.customer_phone, customer_email: form.customer_email || null, company_site: form.company_site, opened_at: openedAt,
            delivery_address: fulfilment === 'delivery' ? form.delivery_address : null, delivery_zone: fulfilment === 'delivery' && zone ? zone : null, coupon: coupon || null, customer_note: form.customer_note || null,
            items: cart.lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, mods: (l.mods || []).map((m) => m.id) })), expected_total: quote.total,
        };
        // same key for a retry of the SAME order; a changed order gets a new key
        const sig = JSON.stringify(payload);
        if (attempt.current.sig !== sig) attempt.current = { sig, key: newKey() };
        try {
            const r = await axios.post(`/shop/${store.slug}/checkout`, { ...payload, idempotency_key: attempt.current.key });
            cartStore.clear();
            window.location.href = r.data.status_url;
        } catch (err) {
            const d = err.response?.data;
            if (err.response?.status === 422 && d?.errors) setFieldErrors(d.errors);
            if (d?.reason === 'quote_changed') { setQuote(d.quote); setNotice('Prices changed while you were checking out. Please review the new total and confirm again.'); }
            else if (d?.reason === 'cart_changed') { setProblems(d.problems || []); }
            else setNotice(d?.message || 'We could not place your order. Please try again — you will not be charged twice.');
        } finally { setBusy(false); }
    };

    const hours = store.opening_hours;
    const t = tone(store.slug);
    const payLabel = [store.payments.cod && 'Cash on delivery', store.payments.pickup && 'Pay at pickup', store.payments.bank && 'Bank transfer'].filter(Boolean).join(' · ');

    return (
        <PublicShell
            title={store.name}
            storeSlug={store.slug}
            ratingSummary={rating_summary}
            customer={customer}
            bag={browseOnly ? undefined : { count, total: quote?.total ?? 0, onClick: () => setCartOpen(true) }}
            catalogueTheme={catalogueTheme}
            catalogueOnly={browseOnly}
            onsite={onsiteMode}
        >
            <Head title={`${store.name}${store.city ? ` — ${store.city}` : ''}`}>
                <meta name="description" content={store.description || `Order from ${store.name}${store.city ? ` in ${store.city}` : ''}.`} />
            </Head>

            {onsiteMode && <div className="vqs-order-context"><span><ShoppingBag size={15} />{onsite.channel === 'table_qr' ? `Ordering for ${onsite.label}` : 'Order at the counter'}</span><span>Browse. Choose. Make it yours.</span></div>}

            {!onsiteMode && <a href="/shop" className="vqs-row" style={{ gap: 6, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{Icon.back}All shops{store.city ? ` in ${store.city}` : ''}</a>}

            {store.announcement && <div style={{ marginBottom: 14 }}><Alert kind="info"><b>{store.announcement}</b></Alert></div>}
            <section className="vqs-card vqs-storehead">
                <div className="vqs-cover" style={store.banner_url ? { background: `center / cover no-repeat url(${store.banner_url}), ${t.bg}` } : { background: t.bg }} />
                <div className="vqs-storebody">
                    <div className="vqs-stack" style={{ flex: '1 1 360px', minWidth: 0, gap: 12 }}>
                        <span className="vqs-mark vqs-mark--lg" style={{ color: t.fg }}>{store.logo_url ? <img src={store.logo_url} alt="" /> : initials(store.name)}</span>
                        <div className="vqs-stack" style={{ gap: 6 }}>
                            <h1 className="vqs-h2" style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}>{store.name}</h1>
                            <StoreBadges badges={store.badges} max={6} size="lg" />
                            {store.description && <p className="vqs-muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.5, maxWidth: '56ch' }}>{store.description}</p>}
                        </div>
                        <div className="vqs-meta">
                            {store.hours_guidance?.is_on_break ? (
                                <Badge kind="warn">
                                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginRight: 6 }} />
                                    On break{store.hours_guidance?.opens_at ? ` · Resumes ${store.hours_guidance.opens_at}` : ''}
                                </Badge>
                            ) : store.open_now === true ? (
                                <Badge kind="ok">
                                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginRight: 6 }} />
                                    Open now{store.hours_guidance?.closes_at ? ` · Closes ${store.hours_guidance.closes_at}` : ''}
                                </Badge>
                            ) : store.open_now === false ? (
                                <Badge>
                                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', marginRight: 6 }} />
                                    Closed now{store.hours_guidance?.opens_at ? ` · Opens ${store.hours_guidance.opens_at}` : ''}
                                </Badge>
                            ) : null}
                            {rating_summary?.average && (
                                <span className="vqs-row" style={{ gap: 4, color: '#F5B32E', fontWeight: 600 }}>
                                    ★ {rating_summary.average.toFixed(1)} <span style={{ color: 'var(--vq-text-3)', fontWeight: 500 }}>({rating_summary.count || 0})</span>
                                </span>
                            )}
                            {(store.address || store.city) && <span className="vqs-row" style={{ gap: 6 }}>{Icon.pin}{[store.address, store.city].filter(Boolean).join(' · ')}</span>}
                            {store.phone && <a className="vqs-row vqs-num" style={{ gap: 6, color: 'inherit' }} href={`tel:${store.phone}`}>{Icon.phone}{store.phone}</a>}
                            {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer">View on map</a>}
                        </div>
                    </div>
                    <div className="vqs-tiles">
                        {!onsiteMode && store.pickup && <div className="vqs-tile"><span className="vqs-eyebrow">Pickup</span><b>Collect in store</b></div>}
                        {!onsiteMode && store.delivery && <div className="vqs-tile"><span className="vqs-eyebrow">Delivery</span><b>{zones.length > 0 ? `${zones.length} area${zones.length === 1 ? '' : 's'} · from ${money(Math.min(...zones.map((z) => z.fee)), sym)}` : Number(store.delivery_charge) > 0 ? money(store.delivery_charge, sym) : 'Free'}</b>{store.delivery_note && <span className="vqs-faint" style={{ fontSize: 12 }}>{store.delivery_note}</span>}</div>}
                        {store.prep_minutes && <div className="vqs-tile"><span className="vqs-eyebrow">Usual prep time</span><b>About {store.prep_minutes} min</b></div>}
                        {!onsiteMode && Number(store.min_order_amount) > 0 && <div className="vqs-tile"><span className="vqs-eyebrow">Minimum order</span><b className="vqs-num">{money(Number(store.min_order_amount), sym)}</b></div>}
                        {!onsiteMode && payLabel && <div className="vqs-tile"><span className="vqs-eyebrow">Payment</span><b>{payLabel}</b></div>}
                    </div>
                    {onsiteMode && (
                        <div className="vqs-local-status">
                            <span><ShoppingBag size={14} />Browse & order in store</span>
                            {store.prep_minutes && <span><i className="wait" />Avg Prep: {store.prep_minutes} mins</span>}
                            <span><ShieldCheck size={14} />Confirmed by our team</span>
                            <b>{onsite.channel === 'table_qr' ? onsite.label : 'Counter ordering'}</b>
                        </div>
                    )}
                </div>
                {hours && (
                    <details style={{ padding: '0 24px 20px', fontSize: 14 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600 }} className="vqs-row">
                            {Icon.clock}<span style={{ marginLeft: 6 }}>Opening hours</span>
                            {store.hours_guidance?.current_time && (
                                <span className="vqs-faint" style={{ fontSize: 12, marginLeft: 'auto', fontWeight: 400 }}>
                                    Store time: {store.hours_guidance.current_time}
                                </span>
                            )}
                        </summary>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', maxWidth: 360 }}>
                            {DAYS.map((d) => {
                                const isToday = store.hours_guidance?.current_day_key === d;
                                return (
                                    <li key={d} className="vqs-between" style={{ padding: '4px 0', fontWeight: isToday ? 600 : 400 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {DAY_LABEL[d]}
                                            {isToday && (
                                                <span style={{ fontSize: 10, background: 'rgba(11, 170, 143, 0.15)', color: '#0baa8f', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                                                    Today
                                                </span>
                                            )}
                                        </span>
                                        <span className="vqs-faint vqs-num" style={{ textAlign: 'right' }}>
                                            {formatHourRange(hours[d])}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </details>
                )}
            </section>

            {preview && <div style={{ marginTop: 16 }}><Alert kind="info">Preview: only you can see this page. Customers cannot see or order from your shop until you publish it.</Alert></div>}
            {!onsiteMode && !catalogueOnly && !preview && !store.accepting_orders && (
                <div style={{ marginTop: 16 }}>
                    <Alert kind="warn">
                        {store.hours_guidance?.is_on_break && !store.orders_during_break
                            ? `This business is currently on break until ${store.hours_guidance.break_info?.resumes_at || store.hours_guidance.opens_at}. Orders will resume after the break.`
                            : store.closed_by_hours
                            ? 'This business is closed right now and is not taking orders outside its opening hours. You can still look around and come back when it opens.'
                            : 'This business is not taking online orders right now. You can still look around.'}
                    </Alert>
                </div>
            )}
            {!browseOnly && pendingSwitch && (
                <div style={{ marginTop: 16 }}><Alert kind="warn">
                    Your cart has items from another business. One shop per order — adding here will replace it.
                    <span className="vqs-row" style={{ marginTop: 10 }}>
                        <Btn onClick={() => { const item = pendingSwitch; setPendingSwitch(null); if (item.addons?.length) { persist({ slug: cartScope, lines: [] }); openPicker(item); } else persist({ slug: cartScope, lines: [{ item_id: item.id, key: `${item.id}|`, quantity: 1, mods: [], name: item.label ? `${item.name} — ${item.label}` : item.name }] }); }}>Replace cart</Btn>
                        <Btn variant="soft" onClick={() => setPendingSwitch(null)}>Keep my other cart</Btn>
                    </span>
                </Alert></div>
            )}

            {!onsiteMode && <StoreShowcase showcase={showcase} sym={sym} canAdd={canAdd} add={(it) => add(pick(it))} onDetail={setDetail} brand={store.brand_color} onCategory={(id) => goCatalogue({ category: id, page: undefined })} />}

            <div className={`vqs-layout ${browseOnly ? 'vqs-layout--catalogue' : ''}`} style={{ marginTop: 24 }}>
                {onsiteMode && catalogueTheme === 'editorial-ledger' ? <EditorialMenu store={store} items={items} categories={categories} filters={filters} pagination={pagination} search={search} setSearch={setSearch} goCatalogue={goCatalogue} showImages={show_images} pick={pick} renderOptions={renderOptions} cart={cart} add={add} setQty={setQty} canAdd={canAdd} onDetail={setDetail} maxQty={limits.max_qty} /> : <section aria-label="Catalogue" className="vqs-catalogue-panel">
                    {onsiteMode && <header className={`vqs-collection-heading vqs-collection-heading--${catalogueTheme}`}><div><span>{catalogueTheme === 'express-rail' ? 'Express service' : catalogueTheme === 'visual-grid' ? 'The collection' : 'The collection'}</span><h2>{catalogueTheme === 'express-rail' ? 'Order in a few taps.' : catalogueTheme === 'visual-grid' ? 'Find your next favourite.' : 'Find your next favourite.'}</h2><p>{catalogueTheme === 'express-rail' ? 'Choose a section, pick a product, and send it straight to the counter.' : `Explore ${store.name}. A closer look is just a tap away.`}</p></div><ArrowUpRight size={36} strokeWidth={1} aria-hidden="true" /></header>}
                    {!onsiteMode && catalogueTheme === 'editorial-ledger' && (
                        <header className="vqs-ledger-masthead">
                            <span>~ Carte du Jour ~</span>
                            <h2>Curated Catalogue Ledger</h2>
                            <p>A considered collection of {store.name}&apos;s signature selections.</p>
                        </header>
                    )}
                    {!onsiteMode && catalogueTheme === 'express-rail' && (
                        <header className="vqs-rail-masthead">
                            <span>Express catalogue</span>
                            <h2>Quick order</h2>
                            <p>Choose a category, add an item, and send your order directly to the counter.</p>
                        </header>
                    )}
                    <div className="vqs-between" style={{ marginBottom: 14, alignItems: 'baseline' }}>
                        <h2 className="vqs-h2">{onsiteMode ? (categories.find((category) => String(category.id) === String(filters.category))?.name || 'All products') : 'Everything we sell'}</h2>
                        <span className="vqs-eyebrow">{pagination.total ?? items.length} item{(pagination.total ?? items.length) === 1 ? '' : 's'}</span>
                    </div>
                    <search><form onSubmit={(e) => { e.preventDefault(); goCatalogue({ q: search.trim() || undefined, page: undefined }); }} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input className="vqs-input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${store.name}`} aria-label="Search this store" maxLength={60} />
                        <Btn type="submit" variant="soft">Search</Btn>
                    </form></search>
                    {categories.length > 0 && (
                        <fieldset className="vqs-chips" aria-label="Categories">
                            <button type="button" className={`vqs-chip ${!filters.category ? 'on' : ''}`} onClick={() => goCatalogue({ category: undefined, page: undefined })}>All</button>
                            {categories.map((c) => (
                                <button type="button" key={c.id} className={`vqs-chip ${filters.category === c.id ? 'on' : ''}`} onClick={() => goCatalogue({ category: c.id, page: undefined })}>{c.name} <span>{c.count}</span></button>
                            ))}
                        </fieldset>
                    )}
                    {items.length === 0 ? (
                        <div className="vqs-card vqs-empty"><span className="ic" aria-hidden="true">⌂</span><span className="vqs-muted" style={{ fontSize: 14 }}>{(filters.q || filters.category) ? 'Nothing matches that search. Try another word or clear the filters.' : 'This business has not published any products yet.'}</span></div>
                    ) : (
                        <ul className={`vqs-prods ${show_images ? '' : 'vqs-noimg'}`} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {items.map((raw, idx) => {
                                const it = pick(raw);
                                const inCart = qtyOfItem(it.id);
                                const pt = tone(it.id);
                                return (
                                    <li key={it.id} className="vqs-rise" data-category={it.category || ''} style={{ '--i': Math.min(idx, 11) }}>
                                        <div className={`vqs-card vqs-prod ${it.stock === 'out' ? 'soldout' : ''}`} style={{ height: '100%' }}>
                                            <button type="button" className="vqs-pimg vqs-reset" style={{ background: pt.bg, color: pt.fg, position: 'relative' }} onClick={() => setDetail(it)} aria-label={`View ${it.name}`}>
                                                {(it.featured || it.was_price) && <span className="vqs-ribbon">{it.was_price ? 'Offer' : 'Featured'}</span>}
                                                {it.stock === 'out' ? <span className="vqs-stock out">Sold out</span> : it.stock === 'low' ? <span className="vqs-stock low">{it.left} left</span> : null}
                                                {!onsiteMode && it.category && <span className="vqs-ptag">{it.category}</span>}
                                                {it.image_url ? <img src={it.image_url} alt="" loading="lazy" /> : onsiteMode ? <ProductIllustration item={it} /> : <span aria-hidden="true">{initials(it.name)}</span>}
                                                <span className="vqs-quick" aria-hidden="true"><span>Quick view</span></span>
                                            </button>
                                            <h3 className="vqs-pname" style={{ margin: 0 }}>{onsiteMode && it.category && <span className="vqs-product-category">{it.category}</span>}<button type="button" className="vqs-reset vqs-linkish" onClick={() => setDetail(it)}>{it.name}</button></h3>
                                            {renderOptions(it)}
                                            {it.description && <p className="vqs-pdesc" style={{ margin: 0 }}>{it.description}</p>}
                                            <div className="vqs-pfoot">
                                                <span><span className="vqs-price">{money(it.price, sym)}</span>{it.was_price && <s className="vqs-was">{money(it.was_price, sym)}</s>}<br /><span className="vqs-unit">/ {it.unit}</span></span>
                                                {browseOnly ? (
                                                    <button type="button" className="vqs-btn vqs-btn--soft" onClick={() => setDetail(it)}>View</button>
                                                ) : inCart > 0 ? (
                                                    <span className="vqs-qty">
                                                        <button type="button" aria-label={`Remove one ${it.name}`} onClick={() => { const last = [...cart.lines].reverse().find((l) => l.item_id === it.id); if (last) setQty(kOf(last), last.quantity - 1); }}>
                                                            <Minus size={13} strokeWidth={2.5} />
                                                        </button>
                                                        <span>{inCart}</span>
                                                        <button type="button" aria-label={`Add one ${it.name}`} onClick={() => add(it)}>
                                                            <Plus size={13} strokeWidth={2.5} />
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <button type="button" className="vqs-btn vqs-btn--round" aria-label={`Add ${it.name} to cart`} disabled={!canAdd || it.stock === 'out'} onClick={() => add(it)}>
                                                        {onsiteMode ? <><Plus size={16} /><span>Add</span></> : catalogueTheme === 'visual-grid' ? '+ Select' : catalogueTheme === 'editorial-ledger' ? `Add to order · ${money(it.price, sym)} →` : '+'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <Pager current={pagination.current} last={pagination.last}
                        onGo={(p) => goCatalogue({ page: p })} />
                </section>}

                {!browseOnly && <aside aria-label="Your cart" className={`vqs-sticky ${cartOpen ? 'open' : ''}`}>
                    <div className="vqs-card vqs-pad vqs-cartcard">
                        <div className="vqs-between" style={{ alignItems: 'baseline' }}>
                            <h2 className="vqs-h2" style={{ fontSize: 22 }}>Your order</h2>
                            <span className="vqs-row" style={{ gap: 12 }}>
                                <span className="vqs-eyebrow">{count} item{count === 1 ? '' : 's'}</span>
                                <button type="button" className="vqs-reset vqs-closex" aria-label="Close cart" onClick={() => setCartOpen(false)}>✕</button>
                            </span>
                        </div>
                        {cart.lines.length === 0 ? (
                            <div className="vqs-empty" style={{ padding: '28px 8px' }}><span className="ic" aria-hidden="true">{Icon.bag}</span><span className="vqs-muted" style={{ fontSize: 14 }}>Items you add from {store.name} appear here.</span></div>
                        ) : (
                            <form onSubmit={submit} className="vqs-stack" style={{ marginTop: 12, gap: 16 }}>
                                {problems.length > 0 && (
                                    <Alert kind="error">
                                        Some items are no longer available:
                                        <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>{problems.map((p, i) => <li key={i}>{cart.lines.find((l) => l.item_id === p.item_id)?.name || 'An item'} — {p.message}</li>)}</ul>
                                        <span style={{ display: 'block', marginTop: 8 }}><Btn variant="soft" onClick={removeProblems}>Remove them</Btn></span>
                                    </Alert>
                                )}
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {cart.lines.map((l) => {
                                        const q = quote?.items?.find((x) => x.item_id === l.item_id && modsKey(x.mods) === modsKey(l.mods));
                                        const fullTitle = q?.title || l.name || 'Item';
                                        const parts = fullTitle.split(' — ');
                                        const mainTitle = parts[0];
                                        const optionLabel = parts.length > 1 ? parts.slice(1).join(' — ') : null;

                                        return (
                                            <li key={kOf(l)} className="vqs-cart-item">
                                                <div className="vqs-cart-item-header">
                                                    <div className="vqs-cart-item-name-block">
                                                        <span className="vqs-cart-item-name" title={mainTitle}>{mainTitle}</span>
                                                        {optionLabel && (
                                                            <span className="vqs-cart-item-badge">
                                                                {optionLabel}
                                                            </span>
                                                        )}
                                                        {(l.mods || []).length > 0 && (
                                                            <span className="vqs-cart-item-badge">
                                                                {(l.mods || []).map((m) => m.name).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="vqs-cart-item-total vqs-num">
                                                        {q ? money(q.line_total, sym) : '…'}
                                                    </span>
                                                </div>
                                                <div className="vqs-cart-item-footer">
                                                    <span className="vqs-cart-item-rate vqs-num">
                                                        {q ? `${money(q.price, sym)} each` : ''}
                                                    </span>
                                                    <div className="vqs-cart-item-stepper">
                                                        <span className="vqs-qty vqs-qty--sm">
                                                            <button
                                                                type="button"
                                                                aria-label={`Decrease quantity of ${mainTitle}`}
                                                                onClick={() => setQty(kOf(l), l.quantity - 1)}
                                                            >
                                                                <Minus size={11} strokeWidth={2.5} />
                                                            </button>
                                                            <span>{l.quantity}</span>
                                                            <button
                                                                type="button"
                                                                aria-label={`Increase quantity of ${mainTitle}`}
                                                                onClick={() => setQty(kOf(l), l.quantity + 1)}
                                                            >
                                                                <Plus size={11} strokeWidth={2.5} />
                                                            </button>
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {!onsiteMode && <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                                    <legend className="vqs-label">How would you like to get it?</legend>
                                    <div className="vqs-seg" style={{ position: 'relative' }}>
                                        {store.pickup && <label className={fulfilment === 'pickup' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} />Pickup</label>}
                                        {store.delivery && <label className={fulfilment === 'delivery' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} />Delivery</label>}
                                    </div>
                                </fieldset>}

                                {!onsiteMode && fulfilment === 'delivery' && zones.length > 0 && (
                                    <Field label="Delivery area" error={fieldErrors.delivery_zone?.[0]} hint={zone ? undefined : 'Choose where we are delivering.'}>
                                        <select className="vqs-select" value={zone} onChange={(e) => setZone(e.target.value)} required>
                                            <option value="">Select your area…</option>
                                            {zones.map((z) => <option key={z.name} value={z.name}>{z.name} — {money(z.fee, sym)}{z.min_order > 0 ? ` (min ${money(z.min_order, sym)})` : ''}</option>)}
                                        </select>
                                    </Field>
                                )}
                                {!onsiteMode && has_coupons && (
                                    <Field label="Coupon code (optional)" error={couponError}>
                                        <span className="vqs-couponrow">
                                            <input className="vqs-input" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} maxLength={40} placeholder="Enter code" autoCapitalize="characters" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setCouponError(null); setCoupon(couponInput.trim()); } }} />
                                            <Btn variant="soft" onClick={() => { setCouponError(null); setCoupon(couponInput.trim()); }}>Apply</Btn>
                                        </span>
                                    </Field>
                                )}
                                <Field label={onsiteMode && onsite.channel === 'table_qr' ? 'Your name (optional)' : 'Your name'} error={fieldErrors.customer_name?.[0]}><input className="vqs-input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} autoComplete="name" required={!onsiteMode || onsite.channel !== 'table_qr'} maxLength={150} /></Field>
                                {!onsiteMode && <Field label="Phone number" error={fieldErrors.customer_phone?.[0]} hint="So the business can reach you about this order."><input className="vqs-input" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} inputMode="tel" autoComplete="tel" required maxLength={40} /></Field>}
                                {!onsiteMode && <Field label="Email (optional)" hint="We will email you when the business accepts or updates your order."><input className="vqs-input" type="email" autoComplete="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} maxLength={150} /></Field>}
                                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={form.company_site} onChange={(e) => setForm({ ...form, company_site: e.target.value })} /></label></div>
                                {!onsiteMode && fulfilment === 'delivery' && <Field label="Delivery address" error={fieldErrors.delivery_address?.[0]}><textarea className="vqs-textarea" rows={3} value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} required maxLength={500} /></Field>}
                                <Field label={onsiteMode ? 'Notes for staff (optional)' : 'Note for the business (optional)'}><textarea className="vqs-textarea" rows={2} value={form.customer_note} onChange={(e) => setForm({ ...form, customer_note: e.target.value })} maxLength={500} /></Field>

                                {!onsiteMode && <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                                    <legend className="vqs-label">Payment</legend>
                                    {methods.length === 0 && <p className="vqs-err">No payment option is available for this choice.</p>}
                                    <div className="vqs-stack" style={{ gap: 8 }}>
                                        {methods.map(([k, label]) => (
                                            <label key={k} className={`vqs-check ${payment === k ? 'on' : ''}`}><input type="radio" name="pm" checked={payment === k} onChange={() => setForm({ ...form, payment_method: k })} />{label}</label>
                                        ))}
                                    </div>
                                    {payment === 'bank' && store.payments.bank_instructions && <p className="vqs-hint" style={{ whiteSpace: 'pre-line' }}>{store.payments.bank_instructions}</p>}
                                </fieldset>}

                                {quote && (
                                    <dl className="vqs-totals" style={{ margin: 0 }}>
                                        <div className="vqs-between"><dt className="vqs-muted">Subtotal</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.subtotal, sym)}</dd></div>
                                        {quote.tax_total > 0 && <div className="vqs-between"><dt className="vqs-muted">Tax</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.tax_total, sym)}</dd></div>}
                                        {quote.discount_total > 0 && <div className="vqs-between"><dt className="vqs-muted">You save{quote.promo_name ? ` (${quote.promo_name})` : ''}</dt><dd className="vqs-num vqs-save" style={{ margin: 0 }}>{money(quote.discount_total, sym)}</dd></div>}
                                        {quote.delivery_fee > 0 && <div className="vqs-between"><dt className="vqs-muted">Delivery{quote.delivery_zone ? ` · ${quote.delivery_zone}` : ''}</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.delivery_fee, sym)}</dd></div>}
                                        <div className="vqs-between big"><dt>Total</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.total, sym)}</dd></div>
                                    </dl>
                                )}
                                {!onsiteMode && belowMin && <Alert kind="warn">Add {money(minOrder - (quote.subtotal + quote.tax_total), sym)} more to reach the {money(minOrder, sym)} minimum order.</Alert>}
                                {notice && <Alert kind={notice?.success ? 'ok' : 'error'}>{notice?.text || notice}</Alert>}
                                <Btn type="submit" size="lg" full disabled={!canSubmit} onClick={() => {}}>{busy ? 'Sending order…' : onsiteMode ? `Send order to ${onsite.channel === 'table_qr' ? onsite.label : 'counter'}` : 'Place order request'}</Btn>
                                <p className="vqs-hint" style={{ margin: 0 }}>{onsiteMode ? 'Staff will review the order in the POS before it is sent to preparation.' : 'The business confirms availability before your order is accepted. You pay as chosen above — nothing is charged online.'}</p>
                            </form>
                        )}
                    </div>
                </aside>}
            </div>

            <section className="vqs-card vqs-hub vqs-rise" style={{ marginTop: 28 }} aria-label="About this business">
                <div>
                    <span className="vqs-hubhead"><MapPin size={14} />Find us</span>
                    <h3>{store.name}</h3>
                    <p>{[store.address, store.city].filter(Boolean).join(', ') || 'Address not listed.'}</p>
                    {store.phone && <p><a href={`tel:${store.phone}`} className="vqs-num">{store.phone}</a></p>}
                    {store.map_url && <p><a href={store.map_url} target="_blank" rel="noopener noreferrer">View on map</a></p>}
                </div>
                <div>
                    <span className="vqs-hubhead"><Clock size={14} />Hours</span>
                    {hours ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13.5 }}>
                            {DAYS.map((d) => <li key={d} className="vqs-between" style={{ padding: '2px 0' }}><span className="vqs-muted">{DAY_LABEL[d]}</span><span className="vqs-num">{hours[d] ? `${hours[d].open}–${hours[d].close}` : 'Closed'}</span></li>)}
                        </ul>
                    ) : <p>Opening hours are not listed.</p>}
                </div>
                <div>
                    <span className="vqs-hubhead"><ShieldCheck size={14} />{browseOnly ? 'How to buy' : 'How ordering works'}</span>
                    {browseOnly ? <p>Browse the catalogue, then contact {store.name} to confirm availability and arrange your purchase.</p> : onsiteMode ? <p>Add items and send the order from this device. Staff will review it in the POS before preparation.</p> : <><p>Add items, choose {store.pickup && store.delivery ? 'pickup or delivery' : store.delivery ? 'delivery' : 'pickup'} and send your order. {store.name} confirms availability before accepting it, and you pay as chosen at checkout.</p><p>You can follow your order on its status page.</p></>}
                </div>
            </section>

            {!browseOnly && count > 0 && (
                <section className="vqs-cartbar" aria-label="Cart summary">
                    <button type="button" className="vqs-btn vqs-btn--lg vqs-btn--full vqs-between" onClick={() => setCartOpen(true)}>
                        <span className="vqs-row" style={{ gap: 10 }}><span className="vqs-cartcount">{count}</span>View cart</span>
                        <span className="vqs-num">{quote ? money(quote.total, sym) : '…'}</span>
                    </button>
                </section>
            )}
            {(cartOpen || detail) && <div className="vqs-scrim" onClick={() => { setCartOpen(false); setDetail(null); }} aria-hidden="true" />}

            {detail && (() => {
                const d = pick(items.find((x) => x.id === (detail.key || detail.id)) || detail);
                const dq = qtyOfItem(d.id);
                const dt = tone(d.id);
                return (
                    <dialog open className="vqs-sheet" aria-modal="true" aria-label={d.name}>
                        <div className="vqs-sheet-in vqs-card">
                            <button type="button" className="vqs-reset vqs-closex vqs-sheet-x" aria-label="Close" onClick={() => setDetail(null)}>✕</button>
                            <div className={`vqs-pimg vqs-detail-img`} style={{ background: dt.bg, color: dt.fg, display: show_images ? undefined : 'none' }}>
                                {d.image_url ? <img src={d.image_url} alt="" /> : onsiteMode ? <ProductIllustration item={d} /> : <span aria-hidden="true">{initials(d.name)}</span>}
                            </div>
                            <div className="vqs-stack" style={{ gap: 8, padding: '4px 4px 0' }}>
                                <span className="vqs-eyebrow">{store.name}</span>
                                <h2 className="vqs-h2" style={{ fontSize: 26 }}>{d.name}</h2>
                                {renderOptions(d)}
                                <div className="vqs-row" style={{ gap: 8, alignItems: 'baseline' }}><span className="vqs-price" style={{ fontSize: 22 }}>{money(d.price, sym)}</span>{d.was_price && <s className="vqs-was">{money(d.was_price, sym)}</s>}<span className="vqs-unit">/ {d.unit}</span></div>
                                {d.description ? <p className="vqs-muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{d.description}</p> : <p className="vqs-faint" style={{ margin: 0, fontSize: 14 }}>No description from the business.</p>}
                                <div className="vqs-row" style={{ marginTop: 8 }}>
                                    {browseOnly ? (
                                        store.phone ? <a className="vqs-btn vqs-btn--lg vqs-btn--full" href={`tel:${store.phone}`}>Call to order</a> : <p className="vqs-muted">Contact the business to ask about this item.</p>
                                    ) : dq > 0 ? (
                                        <>
                                            <span className="vqs-qty">
                                                <button type="button" aria-label={`Remove one ${d.name}`} onClick={() => { const last = [...cart.lines].reverse().find((l) => l.item_id === d.id); if (last) setQty(kOf(last), last.quantity - 1); }}>
                                                    <Minus size={13} strokeWidth={2.5} />
                                                </button>
                                                <span>{dq}</span>
                                                <button type="button" aria-label={`Add one ${d.name}`} onClick={() => add(d)}>
                                                    <Plus size={13} strokeWidth={2.5} />
                                                </button>
                                            </span>
                                            <Btn size="lg" onClick={() => { setDetail(null); setCartOpen(true); }}>View cart</Btn>
                                        </>
                                    ) : (
                                        <Btn size="lg" full disabled={!canAdd || d.stock === 'out'} onClick={() => add(d)}>{d.stock === 'out' ? 'Sold out' : canAdd ? 'Add to cart' : 'Not taking orders'}</Btn>
                                    )}
                                </div>
                            </div>
                        </div>
                    </dialog>
                );
            })()}
            {picker && (() => {
                const groups = picker.addons || [];
                const chosen = groups.flatMap((g) => g.options.filter((o) => (picked[g.id] || []).includes(o.id)));
                const missing = groups.filter((g) => (picked[g.id] || []).length < Math.max(g.min_select || 0, g.required ? 1 : 0));
                const unit = Number(picker.price) + modsDelta(chosen);
                const toggle = (g, o) => setPicked((cur) => {
                    const now = cur[g.id] || [];
                    if (g.max_select === 1) return { ...cur, [g.id]: now.includes(o.id) ? (g.required ? now : []) : [o.id] };
                    if (now.includes(o.id)) return { ...cur, [g.id]: now.filter((x) => x !== o.id) };
                    if (g.max_select > 0 && now.length >= g.max_select) return cur;
                    return { ...cur, [g.id]: [...now, o.id] };
                });
                return (
                    <dialog open className="vqs-sheet" aria-modal="true" aria-label={`Choose options for ${picker.name}`} style={{ zIndex: 60 }}>
                        <div className="vqs-sheet-in vqs-card">
                            <button type="button" className="vqs-reset vqs-closex vqs-sheet-x" aria-label="Close" onClick={() => setPicker(null)}>✕</button>
                            <div className="vqs-stack" style={{ gap: 14, padding: '4px 4px 0' }}>
                                <h2 className="vqs-h2" style={{ fontSize: 22 }}>{picker.name}</h2>
                                {groups.map((g) => (
                                    <fieldset key={g.id} style={{ border: 0, padding: 0, margin: 0 }}>
                                        <legend style={{ fontWeight: 700, marginBottom: 6 }}>
                                            {g.name}
                                            <span className="vqs-faint" style={{ fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                                                {g.required || g.min_select > 0 ? 'Required' : 'Optional'}{g.max_select > 1 ? ` · up to ${g.max_select}` : ''}
                                            </span>
                                        </legend>
                                        {g.options.map((o) => {
                                            const on = (picked[g.id] || []).includes(o.id);
                                            return (
                                                <label key={o.id} className="vqs-row" style={{ justifyContent: 'space-between', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
                                                    <span className="vqs-row" style={{ gap: 8 }}>
                                                        <input type={g.max_select === 1 ? 'radio' : 'checkbox'} name={`g${g.id}`} checked={on} onChange={() => toggle(g, o)} />
                                                        {o.name}
                                                    </span>
                                                    {Number(o.price_delta) !== 0 && <span className="vqs-num vqs-muted">{Number(o.price_delta) > 0 ? '+' : '−'}{money(Math.abs(o.price_delta), sym)}</span>}
                                                </label>
                                            );
                                        })}
                                    </fieldset>
                                ))}
                                <Btn size="lg" full disabled={missing.length > 0}
                                    onClick={() => { const item = picker; setPicker(null); addLine(item, chosen.map((o) => ({ id: o.id, name: o.name, price_delta: o.price_delta }))); }}>
                                    {missing.length ? `Choose ${missing[0].name}` : `Add to cart · ${money(unit, sym)}`}
                                </Btn>
                            </div>
                        </div>
                    </dialog>
                );
            })()}
        </PublicShell>
    );
}
