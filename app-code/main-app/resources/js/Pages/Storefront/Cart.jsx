import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Package, ShieldCheck, ShoppingCart, Store as StoreIcon, Trash2, Truck } from 'lucide-react';
import { StorePage } from '@/Components/Storefront/venqore/StoreFrame';
import { Pic, Stepper, money, productUrl, productsUrl, shopUrl, useSaved } from '@/Components/Storefront/venqore/kit';
import { lineKey, modsKey, useShopCart } from '@/lib/shopCart';
import { cartStore, newKey } from '@/lib/commerce';

function Field({ label, error, hint, children }) {
    return (
        <label className="vqsf-lbl">
            <span>{label}</span>
            {children}
            {hint && !error && <small className="vqsf-hint">{hint}</small>}
            {error && <small className="vqsf-err" role="alert">{error}</small>}
        </label>
    );
}
function Warn({ kind = 'warn', children }) {
    return <div className={`vqsf-note vqsf-note--${kind}`} role={kind === 'bad' ? 'alert' : 'status'} style={{ marginTop: 12, boxShadow: 'none' }}><span className="ic"><AlertTriangle size={14} /></span><span className="tx">{children}</span></div>;
}

function CartDefault({ store, preview, show_images: show, limits, rating_summary: rs, customer, has_coupons: hasCoupons, template }) {
    const restaurant = template === 'restaurant';
    const shop = useShopCart(store.slug, limits.max_qty);
    const saved = useSaved(store.slug);
    const { cart } = shop;
    const browseOnly = store.customer_mode === 'catalogue';
    const sym = store.currency_symbol;
    const zones = store.delivery_zones || [];

    const [fulfilment, setFulfilment] = useState(store.pickup ? 'pickup' : 'delivery');
    const [zone, setZone] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [couponError, setCouponError] = useState(null);
    const [quote, setQuote] = useState(null);
    const [problems, setProblems] = useState([]);
    const [notice, setNotice] = useState(null);
    const [busy, setBusy] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [openedAt] = useState(() => Date.now());
    const attempt = useRef({ sig: '', key: '' });
    const [form, setForm] = useState({ customer_name: customer?.name || '', customer_phone: customer?.phone || '', customer_email: customer?.email || '', company_site: '', delivery_address: '', customer_note: '', payment_method: '' });

    const methods = useMemo(() => {
        const m = [];
        if (fulfilment === 'delivery' && store.payments.cod) m.push(['cod', 'Cash on delivery']);
        if (fulfilment === 'pickup' && store.payments.pickup) m.push(['pickup', 'Pay at pickup']);
        if (store.payments.bank) m.push(['bank', 'Bank transfer']);
        return m;
    }, [fulfilment, store.payments]);
    const payment = methods.some(([k]) => k === form.payment_method) ? form.payment_method : (methods[0]?.[0] || '');
    const lines = cart.lines;
    const items = lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, mods: (l.mods || []).map((m) => m.id) }));

    // The server prices the cart; the browser never does.
    useEffect(() => {
        if (lines.length === 0) { setQuote(null); setProblems([]); return undefined; }
        const t = setTimeout(() => {
            axios.post(`/shop/${store.slug}/quote`, { items, fulfilment, delivery_zone: fulfilment === 'delivery' && zone ? zone : undefined, coupon: coupon || undefined })
                .then((r) => { setQuote(r.data); setProblems([]); setCouponError(null); })
                .catch((e) => {
                    const d = e.response?.data;
                    if (d?.reason === 'cart_changed') { setProblems(d.problems || []); setQuote(null); }
                    else if (d?.reason === 'invalid_coupon') { setCouponError(d.message); setCoupon(''); }
                    else setNotice(d?.message || 'Could not price your cart. Please try again.');
                });
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(items), fulfilment, store.slug, zone, coupon]);

    const minOrder = Number(quote?.min_order ?? store.min_order_amount ?? 0);
    const reached = quote ? quote.subtotal + quote.tax_total : 0;
    const belowMin = quote && minOrder > 0 && reached < minOrder;
    const zoneMissing = fulfilment === 'delivery' && zones.length > 0 && !zone;
    const canSubmit = Boolean(store.accepting_orders && quote && !belowMin && !busy && problems.length === 0 && form.customer_name.trim() && form.customer_phone.trim() && !zoneMissing && payment && (fulfilment === 'pickup' || form.delivery_address.trim()));
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const applyCoupon = () => { setCouponError(null); setCoupon(couponInput.trim()); };

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true); setNotice(null); setFieldErrors({});
        const payload = {
            fulfilment, payment_method: payment, customer_name: form.customer_name, customer_phone: form.customer_phone, customer_email: form.customer_email || null, company_site: form.company_site, opened_at: openedAt,
            delivery_address: fulfilment === 'delivery' ? form.delivery_address : null, delivery_zone: fulfilment === 'delivery' && zone ? zone : null, coupon: coupon || null, customer_note: form.customer_note || null,
            items, expected_total: quote.total,
        };
        const sig = JSON.stringify(payload); // the same order retried keeps its key, so it is never placed twice
        if (attempt.current.sig !== sig) attempt.current = { sig, key: newKey() };
        try {
            const r = await axios.post(`/shop/${store.slug}/checkout`, { ...payload, idempotency_key: attempt.current.key });
            cartStore.clear();
            window.location.href = r.data.status_url;
        } catch (err) {
            const d = err.response?.data;
            if (err.response?.status === 422 && d?.errors) setFieldErrors(d.errors);
            if (d?.reason === 'quote_changed') { setQuote(d.quote); setNotice('Prices changed while you were checking out. Please review the new total and confirm again.'); }
            else if (d?.reason === 'cart_changed') setProblems(d.problems || []);
            else setNotice(d?.message || 'We could not place your order. Please try again. You will not be charged twice.');
        } finally { setBusy(false); }
    };
    const dropProblems = () => shop.persist(lines.filter((l) => !problems.some((p) => p.item_id === l.item_id)));

    const page = (body) => (
        <StorePage store={store} shop={shop} saved={saved} customer={customer} ratingSummary={rs} preview={preview} show={show} maxQty={limits.max_qty} active="cart" title={`Your cart — ${store.name}`}>
            <Head><meta name="robots" content="noindex" /></Head>
            <section className="vqsf-pagehead">
                <div className="orb" data-parallax="0.18" />
                <div className="wrap">
                    <nav className="vqsf-crumbs" aria-label="Breadcrumb"><Link href={shopUrl(store.slug)}>Home</Link><span>/</span><span aria-current="page">Cart</span></nav>
                    <div className="row">
                        <div><h1>Your <span className="serif">{restaurant ? 'order' : 'cart'}</span></h1>{lines.length > 0 && <p>{lines.reduce((n, l) => n + l.quantity, 0)} item{lines.reduce((n, l) => n + l.quantity, 0) === 1 ? '' : 's'} from {store.name}. Check the details and send your order — they confirm it before anything is packed.</p>}</div>
                        <Link href={productsUrl(store.slug)} className="vqsf-back"><ArrowLeft size={15} />Continue shopping</Link>
                    </div>
                </div>
            </section>
            <div className="wrap">{body}</div>
        </StorePage>
    );

    if (browseOnly) {
        return page(<div className="vqsf-empty"><span className="ic"><StoreIcon size={21} /></span><b>This store does not take online orders</b><span>Browse the catalogue and contact {store.name} to buy.</span><Link href={productsUrl(store.slug)} className="vqsf-btn vqsf-btn--md">Browse the catalogue</Link></div>);
    }
    if (lines.length === 0) {
        return page(<div className="vqsf-empty" style={{ padding: '90px 20px 120px' }}><span className="ic"><ShoppingCart size={21} strokeWidth={1.6} /></span><b>Your cart is empty</b><span>Items you add from {store.name} will appear here.</span><Link href={productsUrl(store.slug)} className="vqsf-btn vqsf-btn--md">Start shopping</Link></div>);
    }

    return page(
        <form className="vqsf-cart" onSubmit={submit}>
            <div>
                <section className="vqsf-box" aria-label="Items in your cart" data-reveal="">
                    <h2>Items</h2>
                    {problems.length > 0 && (
                        <Warn kind="bad">Some items are no longer available:
                            <ul style={{ margin: '6px 0 8px 18px', listStyle: 'disc' }}>{problems.map((p, i) => <li key={i}>{lines.find((l) => l.item_id === p.item_id)?.name || 'An item'}: {p.message}</li>)}</ul>
                            <button type="button" className="vqsf-btn vqsf-btn--sm vqsf-btn--soft" onClick={dropProblems}>Remove them</button>
                        </Warn>
                    )}
                    {lines.map((l) => {
                        const q = quote?.items?.find((x) => x.item_id === l.item_id && modsKey(x.mods) === modsKey(l.mods));
                        const [main, ...rest] = (q?.title || l.name || 'Item').split(' — ');
                        const sub = [...rest, ...(l.mods || []).map((m) => m.name), l.notes].filter(Boolean).join(' · ');
                        return (
                            <div key={lineKey(l)} className="vqsf-line" style={{ padding: '16px 0' }}>
                                <Link href={productUrl(store.slug, l.item_id)} className="im" style={{ width: 76, height: 76, borderRadius: 18 }}><Pic src={l.image_url} name={main} show={show} /></Link>
                                <div className="tx">
                                    <Link href={productUrl(store.slug, l.item_id)}>{main}</Link>
                                    <small>{sub || (q ? `${money(q.price, sym)} each` : ' ')}</small>
                                    <div className="row">
                                        <Stepper value={l.quantity} max={limits.max_qty} label={main} onChange={(v) => shop.setQty(lineKey(l), v)} />
                                        <button type="button" className="rm" onClick={() => shop.remove(lineKey(l))}><Trash2 size={12} />Remove</button>
                                        <span className="tot">{q ? money(q.line_total, sym) : '…'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <Field label="Note for the business (optional)"><textarea className="vqsf-input" rows={2} value={form.customer_note} onChange={set('customer_note')} maxLength={500} placeholder="Anything they should know about this order" /></Field>
                </section>

                <section className="vqsf-box" data-reveal="">
                    <h2>Your details</h2>
                    <Field label="Name" error={fieldErrors.customer_name?.[0]}><input className="vqsf-input" value={form.customer_name} onChange={set('customer_name')} autoComplete="name" required maxLength={150} /></Field>
                    <Field label="Phone" error={fieldErrors.customer_phone?.[0]} hint="So the business can reach you about this order."><input className="vqsf-input" value={form.customer_phone} onChange={set('customer_phone')} inputMode="tel" autoComplete="tel" required maxLength={40} /></Field>
                    <Field label="Email (optional)" error={fieldErrors.customer_email?.[0]} hint="We email you when the business accepts or updates your order."><input className="vqsf-input" type="email" value={form.customer_email} onChange={set('customer_email')} autoComplete="email" maxLength={150} /></Field>
                    {fulfilment === 'delivery' && <Field label="Delivery address" error={fieldErrors.delivery_address?.[0]}><textarea className="vqsf-input" rows={3} value={form.delivery_address} onChange={set('delivery_address')} required maxLength={500} /></Field>}
                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={form.company_site} onChange={set('company_site')} /></label></div>
                </section>
            </div>

            <aside className="vqsf-checkout" aria-label="Checkout">
                <div className="vqsf-box" data-reveal="" style={{ '--d': '80ms' }}>
                    <h2>Checkout</h2>
                    {(store.pickup || store.delivery) && (
                        <fieldset className="vqsf-group">
                            <legend>How would you like it?</legend>
                            <div className="vqsf-seg">
                                {store.pickup && <label className={fulfilment === 'pickup' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} /><StoreIcon size={15} />Pickup</label>}
                                {store.delivery && <label className={fulfilment === 'delivery' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} /><Truck size={15} />Delivery</label>}
                            </div>
                            {fulfilment === 'delivery' && zones.length > 0 && (
                                <Field label="Delivery area" error={fieldErrors.delivery_zone?.[0]}>
                                    <select className="vqsf-input" value={zone} onChange={(e) => setZone(e.target.value)} required>
                                        <option value="">Select your area…</option>
                                        {zones.map((z) => <option key={z.name} value={z.name}>{z.name} — {money(z.fee, sym)}{z.min_order > 0 ? ` (min ${money(z.min_order, sym)})` : ''}</option>)}
                                    </select>
                                </Field>
                            )}
                            {fulfilment === 'pickup' && (store.address || store.city) && <small className="vqsf-hint" style={{ marginTop: 10 }}>Collect from {[store.address, store.city].filter(Boolean).join(', ')}.</small>}
                        </fieldset>
                    )}

                    <fieldset className="vqsf-group">
                        <legend>Payment</legend>
                        {methods.length === 0 && <p className="vqsf-err">No payment option is available for this choice.</p>}
                        {methods.map(([k, label]) => <label key={k} className={`vqsf-radio ${payment === k ? 'on' : ''}`}><input type="radio" name="pm" checked={payment === k} onChange={() => setForm({ ...form, payment_method: k })} />{label}</label>)}
                        {payment === 'bank' && store.payments.bank_instructions && <p className="vqsf-hint" style={{ whiteSpace: 'pre-line', marginTop: 10 }}>{store.payments.bank_instructions}</p>}
                    </fieldset>

                    {hasCoupons && (
                        <div className="vqsf-group">
                            <Field label="Coupon code (optional)" error={couponError}>
                                <span className="vqsf-couponrow">
                                    <input className="vqsf-input" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} maxLength={40} placeholder="Enter code" autoCapitalize="characters" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} />
                                    <button type="button" className="vqsf-btn vqsf-btn--soft vqsf-btn--md" onClick={applyCoupon}>Apply</button>
                                </span>
                            </Field>
                            {coupon && quote && !couponError && <small className="vqsf-hint" style={{ color: 'var(--accent)', fontWeight: 600 }}>Code {coupon.toUpperCase()} applied.</small>}
                        </div>
                    )}

                    {minOrder > 0 && quote && (
                        <div style={{ marginBottom: 18 }}>
                            <div className="vqsf-bar"><i style={{ width: `${Math.min(100, (reached / minOrder) * 100)}%` }} /></div>
                            <div className="vqsf-barnote">{belowMin ? `Add ${money(minOrder - reached, sym)} more to reach the ${money(minOrder, sym)} minimum order.` : `Minimum order of ${money(minOrder, sym)} reached.`}</div>
                        </div>
                    )}

                    {quote ? (
                        <div>
                            <div className="vqsf-sum"><span>Subtotal</span><span>{money(quote.subtotal, sym)}</span></div>
                            {quote.tax_total > 0 && <div className="vqsf-sum"><span>Tax</span><span>{money(quote.tax_total, sym)}</span></div>}
                            {quote.discount_total > 0 && <div className="vqsf-sum save"><span>You save{quote.promo_name ? ` · ${quote.promo_name}` : ''}</span><span>−{money(quote.discount_total, sym)}</span></div>}
                            {fulfilment === 'delivery' && <div className="vqsf-sum"><span>Delivery{quote.delivery_zone ? ` · ${quote.delivery_zone}` : ''}</span><span>{quote.delivery_fee > 0 ? money(quote.delivery_fee, sym) : zoneMissing ? 'Choose area' : 'Free'}</span></div>}
                            <div className="vqsf-sum big"><span>Total</span><span>{money(quote.total, sym)}</span></div>
                        </div>
                    ) : problems.length === 0 && <div className="vqsf-sum"><span>Working out your total…</span><span /></div>}

                    {!store.accepting_orders && !preview && <Warn>{store.name} is not taking orders right now.</Warn>}
                    {notice && <Warn kind="bad">{notice}</Warn>}
                    <button type="submit" className="vqsf-btn vqsf-btn--block" style={{ marginTop: 18 }} disabled={!canSubmit}><Package size={16} />{busy ? 'Sending order…' : quote ? `Place order · ${money(quote.total, sym)}` : 'Place order request'}</button>
                    <p className="vqsf-fine"><ShieldCheck size={12} style={{ verticalAlign: '-2px' }} /> {store.name} confirms availability before accepting your order. You pay as chosen above — nothing is charged online.</p>
                </div>
            </aside>
        </form>,
    );
}

/** One checkout for every store; restaurants get kitchen wording. */
export default function Cart(props) {
    return <CartDefault {...props} />;
}
