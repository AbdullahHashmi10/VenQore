import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import StoreLayout from '@/Components/Storefront/StoreLayout';
import { Picture, Stepper, productsUrl } from '@/Components/Storefront/parts';
import { Alert, Btn, Field } from '@/Components/Commerce/shop';
import { lineKey, modsKey, useShopCart } from '@/lib/shopCart';
import { cartStore, newKey } from '@/lib/commerce';
import { fmt as money } from '@/Components/Storefront/parts';

export default function Cart({ store, preview, show_images, limits, rating_summary, customer, has_coupons }) {
    const shop = useShopCart(store.slug, limits.max_qty);
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
    const belowMin = quote && minOrder > 0 && (quote.subtotal + quote.tax_total) < minOrder;
    const zoneMissing = fulfilment === 'delivery' && zones.length > 0 && !zone;
    const canSubmit = Boolean(store.accepting_orders && quote && !belowMin && !busy && problems.length === 0 && form.customer_name.trim() && form.customer_phone.trim() && !zoneMissing && payment && (fulfilment === 'pickup' || form.delivery_address.trim()));
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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

    if (browseOnly) {
        return (
            <StoreLayout store={store} shop={shop} ratingSummary={rating_summary} customer={customer} preview={preview} active="cart" title={`Cart · ${store.name}`}>
                <Head title={`Cart — ${store.name}`}><meta name="robots" content="noindex" /></Head>
                <div className="sf-empty"><b>This store does not take online orders.</b><span>Browse the catalogue and contact {store.name} to buy.</span><Link href={productsUrl(store.slug)} className="sf-btn">Browse the catalogue</Link></div>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout store={store} shop={shop} ratingSummary={rating_summary} customer={customer} preview={preview} active="cart" title={`Cart · ${store.name}`}>
            <Head title={`Your cart — ${store.name}`}><meta name="robots" content="noindex" /></Head>
            <Link href={productsUrl(store.slug)} className="sf-back"><ArrowLeft size={16} />Continue shopping</Link>
            <h1 className="sf-pagetitle">Your cart</h1>

            {lines.length === 0 ? (
                <div className="sf-empty"><span className="sf-empty-ic"><ShoppingBag size={28} /></span><b>Your cart is empty.</b><span>Items you add from {store.name} will appear here.</span><Link href={productsUrl(store.slug)} className="sf-btn sf-btn--lg">Start shopping</Link></div>
            ) : (
                <form className="sf-cartlayout" onSubmit={submit}>
                    <section className="sf-cartlines" aria-label="Items in your cart">
                        {problems.length > 0 && (
                            <Alert kind="error">Some items are no longer available:
                                <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>{problems.map((p, i) => <li key={i}>{lines.find((l) => l.item_id === p.item_id)?.name || 'An item'}: {p.message}</li>)}</ul>
                                <span style={{ display: 'block', marginTop: 8 }}><Btn variant="soft" onClick={dropProblems}>Remove them</Btn></span>
                            </Alert>
                        )}
                        <ul>
                            {lines.map((l) => {
                                const q = quote?.items?.find((x) => x.item_id === l.item_id && modsKey(x.mods) === modsKey(l.mods));
                                const [main, ...rest] = (q?.title || l.name || 'Item').split(' — ');
                                return (
                                    <li key={lineKey(l)} className="sf-line">
                                        <Link href={`/shop/${store.slug}/p/${l.item_id}`} className="sf-line-pic"><Picture item={{ id: l.item_id, name: main, image_url: l.image_url }} showImages={show_images} /></Link>
                                        <div className="sf-line-info">
                                            <Link href={`/shop/${store.slug}/p/${l.item_id}`}><b>{main}</b></Link>
                                            {(rest.length > 0 || (l.mods || []).length > 0) && <span className="sf-line-sub">{[...rest, ...(l.mods || []).map((m) => m.name)].join(' · ')}</span>}
                                            <span className="sf-line-rate">{q ? `${money(q.price, sym)} each` : ''}</span>
                                            <div className="sf-line-actions">
                                                <Stepper small value={l.quantity} max={limits.max_qty} label={main} onChange={(v) => shop.setQty(lineKey(l), v)} />
                                                <button type="button" className="sf-link-danger" onClick={() => shop.remove(lineKey(l))}><Trash2 size={14} />Remove</button>
                                            </div>
                                        </div>
                                        <b className="sf-line-total">{q ? money(q.line_total, sym) : '…'}</b>
                                    </li>
                                );
                            })}
                        </ul>
                        <Field label="Note for the business (optional)"><textarea className="sf-input" rows={2} value={form.customer_note} onChange={set('customer_note')} maxLength={500} placeholder="Anything they should know about this order" /></Field>
                    </section>

                    <aside className="sf-checkout" aria-label="Checkout">
                        <h2>Checkout</h2>

                        <fieldset className="sf-group">
                            <legend>How would you like to get it?</legend>
                            <div className="sf-seg">
                                {store.pickup && <label className={fulfilment === 'pickup' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} />Pickup</label>}
                                {store.delivery && <label className={fulfilment === 'delivery' ? 'on' : ''}><input type="radio" name="f" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} />Delivery</label>}
                            </div>
                            {fulfilment === 'delivery' && zones.length > 0 && (
                                <Field label="Delivery area" error={fieldErrors.delivery_zone?.[0]}>
                                    <select className="sf-input" value={zone} onChange={(e) => setZone(e.target.value)} required>
                                        <option value="">Select your area…</option>
                                        {zones.map((z) => <option key={z.name} value={z.name}>{z.name} — {money(z.fee, sym)}{z.min_order > 0 ? ` (min ${money(z.min_order, sym)})` : ''}</option>)}
                                    </select>
                                </Field>
                            )}
                        </fieldset>

                        <fieldset className="sf-group">
                            <legend>Your details</legend>
                            <Field label="Name" error={fieldErrors.customer_name?.[0]}><input className="sf-input" value={form.customer_name} onChange={set('customer_name')} autoComplete="name" required maxLength={150} /></Field>
                            <Field label="Phone" error={fieldErrors.customer_phone?.[0]} hint="So the business can reach you about this order."><input className="sf-input" value={form.customer_phone} onChange={set('customer_phone')} inputMode="tel" autoComplete="tel" required maxLength={40} /></Field>
                            <Field label="Email (optional)" error={fieldErrors.customer_email?.[0]} hint="We email you when the business accepts or updates your order."><input className="sf-input" type="email" value={form.customer_email} onChange={set('customer_email')} autoComplete="email" maxLength={150} /></Field>
                            {fulfilment === 'delivery' && <Field label="Delivery address" error={fieldErrors.delivery_address?.[0]}><textarea className="sf-input" rows={3} value={form.delivery_address} onChange={set('delivery_address')} required maxLength={500} /></Field>}
                            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={form.company_site} onChange={set('company_site')} /></label></div>
                        </fieldset>

                        <fieldset className="sf-group">
                            <legend>Payment</legend>
                            {methods.length === 0 && <p className="sf-err">No payment option is available for this choice.</p>}
                            {methods.map(([k, label]) => <label key={k} className={`sf-radio ${payment === k ? 'on' : ''}`}><input type="radio" name="pm" checked={payment === k} onChange={() => setForm({ ...form, payment_method: k })} />{label}</label>)}
                            {payment === 'bank' && store.payments.bank_instructions && <p className="sf-muted" style={{ whiteSpace: 'pre-line' }}>{store.payments.bank_instructions}</p>}
                        </fieldset>

                        {has_coupons && (
                            <div className="sf-group">
                                <Field label="Coupon code (optional)" error={couponError}>
                                    <span className="sf-couponrow">
                                        <input className="sf-input" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} maxLength={40} placeholder="Enter code" autoCapitalize="characters" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setCouponError(null); setCoupon(couponInput.trim()); } }} />
                                        <Btn variant="soft" onClick={() => { setCouponError(null); setCoupon(couponInput.trim()); }}>Apply</Btn>
                                    </span>
                                </Field>
                            </div>
                        )}

                        {quote && (
                            <dl className="sf-totals">
                                <div><dt>Subtotal</dt><dd>{money(quote.subtotal, sym)}</dd></div>
                                {quote.tax_total > 0 && <div><dt>Tax</dt><dd>{money(quote.tax_total, sym)}</dd></div>}
                                {quote.discount_total > 0 && <div className="save"><dt>You save{quote.promo_name ? ` (${quote.promo_name})` : ''}</dt><dd>−{money(quote.discount_total, sym)}</dd></div>}
                                {quote.delivery_fee > 0 && <div><dt>Delivery{quote.delivery_zone ? ` · ${quote.delivery_zone}` : ''}</dt><dd>{money(quote.delivery_fee, sym)}</dd></div>}
                                <div className="big"><dt>Total</dt><dd>{money(quote.total, sym)}</dd></div>
                            </dl>
                        )}
                        {belowMin && <Alert kind="warn">Add {money(minOrder - (quote.subtotal + quote.tax_total), sym)} more to reach the {money(minOrder, sym)} minimum order.</Alert>}
                        {!store.accepting_orders && !preview && <Alert kind="warn">{store.name} is not taking orders right now.</Alert>}
                        {notice && <Alert kind="error">{notice}</Alert>}
                        <button type="submit" className="sf-btn sf-btn--lg sf-btn--block" disabled={!canSubmit}>{busy ? 'Sending order…' : 'Place order request'}</button>
                        <p className="sf-muted sf-fine">{store.name} confirms availability before accepting your order. You pay as chosen above. Nothing is charged online.</p>
                    </aside>
                </form>
            )}
        </StoreLayout>
    );
}
