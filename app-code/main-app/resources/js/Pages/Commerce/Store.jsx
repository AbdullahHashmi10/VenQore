import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Alert, Badge, Btn, Field, Icon, Pager, initials, tone } from '@/Components/Commerce/shop';
import { DAY_LABEL, cartStore, money, newKey } from '@/lib/commerce';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function Store({ store, items, pagination, limits }) {
    const sym = store.currency_symbol;
    const [cart, setCart] = useState({ slug: store.slug, lines: [] });
    const [pendingSwitch, setPendingSwitch] = useState(null); // item waiting for "replace cart?" answer
    const [quote, setQuote] = useState(null);
    const [problems, setProblems] = useState([]);
    const [notice, setNotice] = useState(null);
    const [busy, setBusy] = useState(false);
    const [cartOpen, setCartOpen] = useState(false); // mobile cart sheet
    const [detail, setDetail] = useState(null);       // product detail sheet
    const [fulfilment, setFulfilment] = useState(store.pickup ? 'pickup' : 'delivery');
    const [form, setForm] = useState({ customer_name: '', customer_phone: '', delivery_address: '', customer_note: '', payment_method: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const attempt = useRef({ sig: '', key: '' });
    const names = useRef({}); // item_id -> name for lines not on the current catalogue page
    items.forEach((i) => { names.current[i.id] = i.name; });

    // hydrate cart (single business per cart)
    useEffect(() => {
        const c = cartStore.read();
        if (c.slug === store.slug) setCart(c);
    }, [store.slug]);

    useEffect(() => {
        const open = cartOpen || detail;
        document.body.style.overflow = open ? 'hidden' : '';
        const onKey = (e) => { if (e.key === 'Escape') { setCartOpen(false); setDetail(null); } };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [cartOpen, detail]);

    const persist = (next) => { setCart(next); cartStore.write(next); };

    const methods = useMemo(() => {
        const m = [];
        if (fulfilment === 'delivery' && store.payments.cod) m.push(['cod', 'Cash on delivery']);
        if (fulfilment === 'pickup' && store.payments.pickup) m.push(['pickup', 'Pay at pickup']);
        if (store.payments.bank) m.push(['bank', 'Bank transfer']);
        return m;
    }, [fulfilment, store.payments]);

    useEffect(() => {
        if (!methods.find(([k]) => k === form.payment_method)) {
            setForm((f) => ({ ...f, payment_method: methods[0]?.[0] || '' }));
        }
    }, [methods]); // eslint-disable-line react-hooks/exhaustive-deps

    // server quote (debounced) — the browser never computes prices
    useEffect(() => {
        if (cart.lines.length === 0) { setQuote(null); setProblems([]); return undefined; }
        const t = setTimeout(() => {
            axios.post(`/shop/${store.slug}/quote`, { items: cart.lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity })), fulfilment })
                .then((r) => { setQuote(r.data); setProblems([]); })
                .catch((e) => {
                    const d = e.response?.data;
                    if (d?.reason === 'cart_changed') { setProblems(d.problems || []); setQuote(null); }
                    else setNotice(d?.message || 'Could not price your cart. Please try again.');
                });
        }, 250);
        return () => clearTimeout(t);
    }, [cart.lines, fulfilment, store.slug]);

    const add = (item) => {
        const cur = cartStore.read();
        if (cur.slug && cur.slug !== store.slug && cur.lines.length > 0) { setPendingSwitch(item); return; }
        const lines = [...cart.lines];
        const ex = lines.find((l) => l.item_id === item.id);
        if (ex) ex.quantity = Math.min(limits.max_qty, ex.quantity + 1); else lines.push({ item_id: item.id, quantity: 1 });
        persist({ slug: store.slug, lines });
    };
    const setQty = (id, q) => {
        const lines = cart.lines.map((l) => (l.item_id === id ? { ...l, quantity: Math.max(0, Math.min(limits.max_qty, q)) } : l)).filter((l) => l.quantity > 0);
        persist({ slug: store.slug, lines });
    };
    const removeProblems = () => persist({ slug: store.slug, lines: cart.lines.filter((l) => !problems.some((p) => p.item_id === l.item_id)) });

    const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
    const minOrder = Number(store.min_order_amount || 0);
    const belowMin = quote && minOrder > 0 && (quote.subtotal + quote.tax_total) < minOrder;
    const canSubmit = store.accepting_orders && quote && !belowMin && !busy && problems.length === 0 && form.customer_name.trim() && form.customer_phone.trim() && form.payment_method && (fulfilment === 'pickup' || form.delivery_address.trim());

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true); setNotice(null); setFieldErrors({});
        const payload = {
            fulfilment, payment_method: form.payment_method, customer_name: form.customer_name, customer_phone: form.customer_phone,
            delivery_address: fulfilment === 'delivery' ? form.delivery_address : null, customer_note: form.customer_note || null,
            items: cart.lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity })), expected_total: quote.total,
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
        <PublicShell title={store.name}>
            <Head title={`${store.name}${store.city ? ` — ${store.city}` : ''}`}>
                <meta name="description" content={store.description || `Order from ${store.name}${store.city ? ` in ${store.city}` : ''}.`} />
            </Head>

            <a href="/shop" className="vqs-row" style={{ gap: 6, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{Icon.back}All shops{store.city ? ` in ${store.city}` : ''}</a>

            <section className="vqs-card vqs-storehead">
                <div className="vqs-cover" style={{ background: t.bg }} />
                <div className="vqs-storebody">
                    <div className="vqs-stack" style={{ flex: '1 1 360px', minWidth: 0, gap: 12 }}>
                        <span className="vqs-mark vqs-mark--lg" style={{ color: t.fg }}>{store.logo_url ? <img src={store.logo_url} alt="" /> : initials(store.name)}</span>
                        <div className="vqs-stack" style={{ gap: 6 }}>
                            <h1 className="vqs-h2" style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}>{store.name}</h1>
                            {store.description && <p className="vqs-muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.5, maxWidth: '56ch' }}>{store.description}</p>}
                        </div>
                        <div className="vqs-meta">
                            {store.open_now === true && <Badge kind="ok">Open now</Badge>}
                            {store.open_now === false && <Badge>Closed now</Badge>}
                            {(store.address || store.city) && <span className="vqs-row" style={{ gap: 6 }}>{Icon.pin}{[store.address, store.city].filter(Boolean).join(' · ')}</span>}
                            {store.phone && <a className="vqs-row vqs-num" style={{ gap: 6, color: 'inherit' }} href={`tel:${store.phone}`}>{Icon.phone}{store.phone}</a>}
                            {store.map_url && <a href={store.map_url} target="_blank" rel="noopener noreferrer">View on map</a>}
                        </div>
                    </div>
                    <div className="vqs-tiles">
                        {store.pickup && <div className="vqs-tile"><span className="vqs-eyebrow">Pickup</span><b>Collect in store</b></div>}
                        {store.delivery && <div className="vqs-tile"><span className="vqs-eyebrow">Delivery</span><b>{Number(store.delivery_charge) > 0 ? money(store.delivery_charge, sym) : 'Free'}</b>{store.delivery_note && <span className="vqs-faint" style={{ fontSize: 12 }}>{store.delivery_note}</span>}</div>}
                        {minOrder > 0 && <div className="vqs-tile"><span className="vqs-eyebrow">Minimum order</span><b className="vqs-num">{money(minOrder, sym)}</b></div>}
                        {payLabel && <div className="vqs-tile"><span className="vqs-eyebrow">Payment</span><b>{payLabel}</b></div>}
                    </div>
                </div>
                {hours && (
                    <details style={{ padding: '0 24px 20px', fontSize: 14 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600 }} className="vqs-row">{Icon.clock}<span style={{ marginLeft: 6 }}>Opening hours</span></summary>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', maxWidth: 320 }}>
                            {DAYS.map((d) => <li key={d} className="vqs-between" style={{ padding: '3px 0' }}><span>{DAY_LABEL[d]}</span><span className="vqs-faint vqs-num">{hours[d] ? `${hours[d].open}–${hours[d].close}` : 'Closed'}</span></li>)}
                        </ul>
                    </details>
                )}
            </section>

            {!store.accepting_orders && <div style={{ marginTop: 16 }}><Alert kind="warn">This business is not taking online orders right now. You can still look around.</Alert></div>}
            {pendingSwitch && (
                <div style={{ marginTop: 16 }}><Alert kind="warn">
                    Your cart has items from another business. One shop per order — adding here will replace it.
                    <span className="vqs-row" style={{ marginTop: 10 }}>
                        <Btn onClick={() => { persist({ slug: store.slug, lines: [{ item_id: pendingSwitch.id, quantity: 1 }] }); setPendingSwitch(null); }}>Replace cart</Btn>
                        <Btn variant="soft" onClick={() => setPendingSwitch(null)}>Keep my other cart</Btn>
                    </span>
                </Alert></div>
            )}

            <div className="vqs-layout" style={{ marginTop: 24 }}>
                <section aria-label="Catalogue">
                    <div className="vqs-between" style={{ marginBottom: 14, alignItems: 'baseline' }}>
                        <h2 className="vqs-h2">Everything we sell</h2>
                        <span className="vqs-eyebrow">{pagination.total ?? items.length} item{(pagination.total ?? items.length) === 1 ? '' : 's'}</span>
                    </div>
                    {items.length === 0 ? (
                        <div className="vqs-card vqs-empty"><span className="ic" aria-hidden="true">⌂</span><span className="vqs-muted" style={{ fontSize: 14 }}>This business has not published any products yet.</span></div>
                    ) : (
                        <ul className="vqs-prods" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {items.map((it) => {
                                const inCart = cart.lines.find((l) => l.item_id === it.id)?.quantity || 0;
                                const pt = tone(it.id);
                                return (
                                    <li key={it.id}>
                                        <div className="vqs-card vqs-prod" style={{ height: '100%' }}>
                                            <button type="button" className="vqs-pimg vqs-reset" style={{ background: pt.bg, color: pt.fg }} onClick={() => setDetail(it)} aria-label={`View ${it.name}`}>
                                                {it.image_url ? <img src={it.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">{initials(it.name)}</span>}
                                            </button>
                                            <h3 className="vqs-pname" style={{ margin: 0 }}><button type="button" className="vqs-reset vqs-linkish" onClick={() => setDetail(it)}>{it.name}</button></h3>
                                            {it.description && <p className="vqs-pdesc" style={{ margin: 0 }}>{it.description}</p>}
                                            <div className="vqs-pfoot">
                                                <span><span className="vqs-price">{money(it.price, sym)}</span><br /><span className="vqs-unit">/ {it.unit}</span></span>
                                                {inCart > 0 ? (
                                                    <span className="vqs-qty">
                                                        <button type="button" aria-label={`Remove one ${it.name}`} onClick={() => setQty(it.id, inCart - 1)}>−</button>
                                                        <span>{inCart}</span>
                                                        <button type="button" aria-label={`Add one ${it.name}`} onClick={() => add(it)}>+</button>
                                                    </span>
                                                ) : (
                                                    <button type="button" className="vqs-btn vqs-btn--round" aria-label={`Add ${it.name} to cart`} disabled={!store.accepting_orders} onClick={() => add(it)}>+</button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <Pager current={pagination.current} last={pagination.last}
                        onGo={(p) => router.get(`/shop/${store.slug}`, { page: p }, { preserveState: true, preserveScroll: false, only: ['items', 'pagination'] })} />
                </section>

                <aside aria-label="Your cart" className={`vqs-sticky ${cartOpen ? 'open' : ''}`}>
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
                                        <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>{problems.map((p, i) => <li key={i}>{names.current[p.item_id] || 'An item'} — {p.message}</li>)}</ul>
                                        <span style={{ display: 'block', marginTop: 8 }}><Btn variant="soft" onClick={removeProblems}>Remove them</Btn></span>
                                    </Alert>
                                )}
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {cart.lines.map((l) => {
                                        const q = quote?.items?.find((x) => x.item_id === l.item_id);
                                        return (
                                            <li key={l.item_id} className="vqs-line">
                                                <span style={{ minWidth: 0 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q?.title || names.current[l.item_id] || 'Item'}</span>
                                                    {q && <span className="vqs-faint vqs-num" style={{ fontSize: 12 }}>{money(q.price, sym)} each</span>}</span>
                                                <span className="vqs-qty vqs-qty--sm">
                                                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.item_id, l.quantity - 1)}>−</button>
                                                    <span>{l.quantity}</span>
                                                    <button type="button" aria-label="Increase quantity" onClick={() => setQty(l.item_id, l.quantity + 1)}>+</button>
                                                </span>
                                                <span className="vqs-num" style={{ minWidth: 76, textAlign: 'right' }}>{q ? money(q.line_total, sym) : '…'}</span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                                    <legend className="vqs-label">How would you like to get it?</legend>
                                    <div className="vqs-seg" style={{ position: 'relative' }}>
                                        {store.pickup && <label className={fulfilment === 'pickup' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} />Pickup</label>}
                                        {store.delivery && <label className={fulfilment === 'delivery' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} />Delivery</label>}
                                    </div>
                                </fieldset>

                                <Field label="Your name" error={fieldErrors.customer_name?.[0]}><input className="vqs-input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} autoComplete="name" required maxLength={150} /></Field>
                                <Field label="Phone number" error={fieldErrors.customer_phone?.[0]} hint="So the business can reach you about this order."><input className="vqs-input" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} inputMode="tel" autoComplete="tel" required maxLength={40} /></Field>
                                {fulfilment === 'delivery' && <Field label="Delivery address" error={fieldErrors.delivery_address?.[0]}><textarea className="vqs-textarea" rows={3} value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} required maxLength={500} /></Field>}
                                <Field label="Note for the business (optional)"><textarea className="vqs-textarea" rows={2} value={form.customer_note} onChange={(e) => setForm({ ...form, customer_note: e.target.value })} maxLength={500} /></Field>

                                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                                    <legend className="vqs-label">Payment</legend>
                                    {methods.length === 0 && <p className="vqs-err">No payment option is available for this choice.</p>}
                                    <div className="vqs-stack" style={{ gap: 8 }}>
                                        {methods.map(([k, label]) => (
                                            <label key={k} className={`vqs-check ${form.payment_method === k ? 'on' : ''}`}><input type="radio" name="pm" checked={form.payment_method === k} onChange={() => setForm({ ...form, payment_method: k })} />{label}</label>
                                        ))}
                                    </div>
                                    {form.payment_method === 'bank' && store.payments.bank_instructions && <p className="vqs-hint" style={{ whiteSpace: 'pre-line' }}>{store.payments.bank_instructions}</p>}
                                </fieldset>

                                {quote && (
                                    <dl className="vqs-totals" style={{ margin: 0 }}>
                                        <div className="vqs-between"><dt className="vqs-muted">Subtotal</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.subtotal, sym)}</dd></div>
                                        {quote.tax_total > 0 && <div className="vqs-between"><dt className="vqs-muted">Tax</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.tax_total, sym)}</dd></div>}
                                        {quote.delivery_fee > 0 && <div className="vqs-between"><dt className="vqs-muted">Delivery</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.delivery_fee, sym)}</dd></div>}
                                        <div className="vqs-between big"><dt>Total</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(quote.total, sym)}</dd></div>
                                    </dl>
                                )}
                                {belowMin && <Alert kind="warn">Add {money(minOrder - (quote.subtotal + quote.tax_total), sym)} more to reach the {money(minOrder, sym)} minimum order.</Alert>}
                                {notice && <Alert kind="error">{notice}</Alert>}
                                <Btn type="submit" size="lg" full disabled={!canSubmit} onClick={() => {}}>{busy ? 'Placing order…' : 'Place order request'}</Btn>
                                <p className="vqs-hint" style={{ margin: 0 }}>The business confirms availability before your order is accepted. You pay as chosen above — nothing is charged online.</p>
                            </form>
                        )}
                    </div>
                </aside>
            </div>

            {count > 0 && (
                <div className="vqs-cartbar" role="region" aria-label="Cart summary">
                    <button type="button" className="vqs-btn vqs-btn--lg vqs-btn--full vqs-between" onClick={() => setCartOpen(true)}>
                        <span className="vqs-row" style={{ gap: 10 }}><span className="vqs-cartcount">{count}</span>View cart</span>
                        <span className="vqs-num">{quote ? money(quote.total, sym) : '…'}</span>
                    </button>
                </div>
            )}
            {(cartOpen || detail) && <div className="vqs-scrim" onClick={() => { setCartOpen(false); setDetail(null); }} aria-hidden="true" />}

            {detail && (() => {
                const dq = cart.lines.find((l) => l.item_id === detail.id)?.quantity || 0;
                const dt = tone(detail.id);
                return (
                    <div className="vqs-sheet" role="dialog" aria-modal="true" aria-label={detail.name}>
                        <div className="vqs-sheet-in vqs-card">
                            <button type="button" className="vqs-reset vqs-closex vqs-sheet-x" aria-label="Close" onClick={() => setDetail(null)}>✕</button>
                            <div className="vqs-pimg vqs-detail-img" style={{ background: dt.bg, color: dt.fg }}>
                                {detail.image_url ? <img src={detail.image_url} alt="" /> : <span aria-hidden="true">{initials(detail.name)}</span>}
                            </div>
                            <div className="vqs-stack" style={{ gap: 8, padding: '4px 4px 0' }}>
                                <span className="vqs-eyebrow">{store.name}</span>
                                <h2 className="vqs-h2" style={{ fontSize: 26 }}>{detail.name}</h2>
                                <div className="vqs-row" style={{ gap: 8, alignItems: 'baseline' }}><span className="vqs-price" style={{ fontSize: 22 }}>{money(detail.price, sym)}</span><span className="vqs-unit">/ {detail.unit}</span></div>
                                {detail.description ? <p className="vqs-muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{detail.description}</p> : <p className="vqs-faint" style={{ margin: 0, fontSize: 14 }}>No description from the business.</p>}
                                <div className="vqs-row" style={{ marginTop: 8 }}>
                                    {dq > 0 ? (
                                        <>
                                            <span className="vqs-qty">
                                                <button type="button" aria-label={`Remove one ${detail.name}`} onClick={() => setQty(detail.id, dq - 1)}>−</button>
                                                <span>{dq}</span>
                                                <button type="button" aria-label={`Add one ${detail.name}`} onClick={() => add(detail)}>+</button>
                                            </span>
                                            <Btn size="lg" onClick={() => { setDetail(null); setCartOpen(true); }}>View cart</Btn>
                                        </>
                                    ) : (
                                        <Btn size="lg" full disabled={!store.accepting_orders} onClick={() => add(detail)}>{store.accepting_orders ? 'Add to cart' : 'Not taking orders'}</Btn>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </PublicShell>
    );
}
