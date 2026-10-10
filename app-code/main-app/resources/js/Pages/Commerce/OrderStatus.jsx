import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Alert, Badge, Btn, Field, Icon } from '@/Components/Commerce/shop';
import { METHOD_LABEL, PAYMENT_LABEL, STATUS_LABEL, cartStore, money } from '@/lib/commerce';

/** wa.me needs the country code; a local Pakistani number (leading 0, prices in Rs) gets 92. */
const waNumber = (phone, sym) => {
    const d = String(phone || '').replace(/\D/g, '');
    return d.startsWith('0') && sym === 'Rs' ? `92${d.slice(1)}` : d;
};

const STEPS_PICKUP = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
const STEPS_DELIVERY = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed'];

const formatRemaining = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${minutes}:${String(seconds).padStart(2, '0')}`;
};

function PreparationCountdown({ estimatedReadyAt, prepMinutes, fulfilment }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const remaining = new Date(estimatedReadyAt).getTime() - now;
    const total = Math.max(1, Number(prepMinutes) * 60 * 1000);
    const progress = Math.min(100, Math.max(0, ((total - Math.max(0, remaining)) / total) * 100));
    const destination = fulfilment === 'delivery' ? 'ready to leave the business' : 'ready for pickup';

    return (
        <section className="vqs-card vqs-pad vqs-countdown" aria-live="polite" style={{ marginTop: 16 }}>
            <div className="vqs-between" style={{ gap: 16, alignItems: 'center' }}>
                <div>
                    <div className="vqs-eyebrow"><span className="vqs-live-dot" aria-hidden="true" />The team is working on it</div>
                    <p className="vqs-muted" style={{ margin: '6px 0 0', fontSize: 14 }}>Estimated time until your order is {destination}.</p>
                </div>
                <div className="vqs-countdown-time vqs-num">
                    {remaining > 0 ? formatRemaining(remaining) : 'Any moment'}
                </div>
            </div>
            <div className="vqs-countdown-track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
            </div>
            <p className="vqs-faint" style={{ margin: '8px 0 0', fontSize: 12 }}>
                {remaining > 0 ? `Based on the business’s usual ${prepMinutes}-minute preparation time.` : 'The estimate has passed, but your order is still active. The status above will update as soon as the business moves it forward.'}
            </p>
        </section>
    );
}

export default function OrderStatus({ order, store, events, rider = null, transfer_url, cancel_url, reorder_url, live_url, history = [], prep_minutes, revision, revision_url, rating_summary, customer }) {
    const [reorderMsg, setReorderMsg] = useState(null);
    const reorder = async () => {
        setReorderMsg(null);
        try {
            const r = await fetch(reorder_url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!r.ok) throw new Error('x');
            const d = await r.json();
            if (!d.lines.length) { setReorderMsg('None of these items are available right now.'); return; }
            // ids and quantities only; prices are re-checked by the server when the cart opens
            cartStore.write({ slug: d.slug, lines: d.lines.map((l) => ({ item_id: l.item_id, key: `${l.item_id}|${(l.mods || []).map((m) => m.id).sort((a, b) => a - b).join(',')}`, quantity: l.quantity, mods: l.mods || [], name: l.title })) });
            window.location.href = `/shop/${d.slug}`;
        } catch { setReorderMsg('Could not start a new order. Please open the shop and add the items again.'); }
    };
    const { flash, errors } = usePage().props;
    const [ref, setRef] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [fileErr, setFileErr] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!live_url) return undefined;
        let stopped = false;
        let timer = null;
        let controller = null;

        const schedule = () => {
            if (stopped) return;
            timer = window.setTimeout(check, document.hidden ? 60_000 : 10_000);
        };

        async function check() {
            if (stopped || controller) return;
            controller = new AbortController();
            try {
                const response = await fetch(live_url, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const update = await response.json();
                if (Number(update.version) !== Number(order.version)
                    || update.status !== order.status
                    || update.payment_status !== order.payment_status
                    || update.estimated_ready_at !== order.estimated_ready_at
                    || (update.rider_key ?? null) !== (rider?.key ?? null)) {
                    stopped = true;
                    router.reload({ preserveState: true, preserveScroll: true });
                }
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    // A temporary connection failure is retried on the next check.
                }
            } finally {
                controller = null;
                schedule();
            }
        }

        const onVisibilityChange = () => {
            if (document.hidden || stopped) return;
            if (timer) window.clearTimeout(timer);
            timer = null;
            check();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        schedule();
        return () => {
            stopped = true;
            if (timer) window.clearTimeout(timer);
            controller?.abort();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [live_url, order.estimated_ready_at, order.payment_status, order.status, order.version, rider?.key]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        setFileErr('');
        if (!file) {
            setReceiptFile(null);
            setReceiptPreview(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFileErr('Screenshot file size must be less than 5 MB.');
            return;
        }
        setReceiptFile(file);
        if (file.type.startsWith('image/')) {
            setReceiptPreview(URL.createObjectURL(file));
        } else {
            setReceiptPreview(null);
        }
    };

    const submitTransfer = (e) => {
        e.preventDefault();
        if (!receiptFile) {
            setFileErr('Payment screenshot / receipt is compulsory. Please upload proof of transfer.');
            return;
        }
        if (!ref.trim()) {
            return;
        }
        setUploading(true);
        const form = new FormData();
        form.append('reference', ref.trim());
        form.append('receipt', receiptFile);
        router.post(transfer_url, form, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
            onError: () => setUploading(false),
        });
    };

    const sym = order.currency_symbol;
    const steps = order.fulfilment === 'delivery' ? STEPS_DELIVERY : STEPS_PICKUP;
    const closed = ['rejected', 'cancelled', 'expired'].includes(order.status);
    const idx = steps.indexOf(order.status);

    const kind = { pending: 'warn', confirmed: 'info', preparing: 'info', ready: 'ok', out_for_delivery: 'ok', completed: 'ok' }[order.status] || 'bad';
    const SHORT = { pending: 'Waiting', confirmed: 'Accepted', preparing: 'Preparing', ready: 'Ready', out_for_delivery: 'On the way', completed: 'Done' };

    return (
        <PublicShell title={store.name} storeSlug={store.slug} ratingSummary={rating_summary} customer={customer}>
            <Head title={`Order ${order.number}`}>
                <meta name="robots" content="noindex,nofollow,noarchive" />
            </Head>

            {flash?.success && <span className="vqs-bigcheck" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l8 8 14-16" /></svg></span>}
            <div className="vqs-eyebrow">{store.name}</div>
            <div className="vqs-row" style={{ marginTop: 8, gap: 14 }}>
                <h1 className="vqs-h1" style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Order {order.number}</h1>
                <Badge kind={kind}>{STATUS_LABEL[order.status]}</Badge>
            </div>
            <p className="vqs-muted" style={{ fontSize: 14, margin: '8px 0 0' }}>Placed {order.placed_at}. Bookmark this page. Lost it? Use “Find my order” with your order number and phone.</p>

            {flash?.success && <div style={{ marginTop: 16 }}><Alert kind="success">{flash.success}</Alert></div>}
            {revision?.status === 'proposed' && order.status === 'pending' && (
                <div className="vqs-card vqs-pad vqs-rise" style={{ marginTop: 16, borderColor: 'var(--vq-warning-line)' }}>
                    <h2 className="vqs-h2" style={{ fontSize: 20 }}>{store.name} suggests a change to your order</h2>
                    {revision.note && <p className="vqs-muted" style={{ margin: '6px 0 0', fontSize: 14 }}>&ldquo;{revision.note}&rdquo;</p>}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', fontSize: 14 }}>
                        {revision.summary.map((c, k) => (
                            <li key={k} style={{ padding: '6px 0', borderBottom: '1px solid var(--vq-line-soft)' }}>
                                {c.type === 'removed' && <>Removed: <b>{c.title}</b></>}
                                {c.type === 'reduced' && <><b>{c.title}</b>: {c.from} → {c.to}</>}
                                {c.type === 'substituted' && <><b>{c.title}</b> replaced with <b>{c.with}</b> ({c.to})</>}
                            </li>
                        ))}
                    </ul>
                    <p style={{ margin: '12px 0 0', fontSize: 14 }}>New total: <b className="vqs-num">{money(revision.total, sym)}</b> <span className="vqs-faint">(was {money(revision.previous_total, sym)})</span></p>
                    <div className="vqs-row" style={{ marginTop: 14 }}>
                        <Btn onClick={() => router.post(revision_url, { answer: 'accept' }, { preserveScroll: true })}>Accept the changes</Btn>
                        <Btn variant="soft" onClick={() => router.post(revision_url, { answer: 'decline' }, { preserveScroll: true })}>Decline</Btn>
                    </div>
                    {errors?.revision && <p className="vqs-err" role="alert" style={{ margin: '8px 0 0' }}>{errors.revision}</p>}
                </div>
            )}
            {errors?.cancel && <div style={{ marginTop: 16 }}><Alert kind="error">{errors.cancel}</Alert></div>}
            <div className="vqs-row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                {store.phone && (
                    <a className="vqs-btn vqs-btn--wa" href={`https://wa.me/${waNumber(store.phone, order.currency_symbol)}?text=${encodeURIComponent(`Hi, about my order ${order.number}`)}`} target="_blank" rel="noopener noreferrer">Message {store.name} on WhatsApp</a>
                )}
                {cancel_url && (
                    <Btn variant="soft" className="vqs-btn--danger" onClick={() => { if (window.confirm('Cancel this order?')) router.post(cancel_url, {}, { preserveScroll: true }); }}>Cancel my order</Btn>
                )}
            </div>
            {order.status === 'pending' && <div style={{ marginTop: 16 }}><Alert kind="info">Your order is a request. {store.name} must confirm that the items are available before it is accepted.</Alert></div>}
            {closed && <div style={{ marginTop: 16 }}><Alert kind="error">This order was {order.status === 'expired' ? 'not accepted in time' : order.status}.{order.reason ? ` Reason: ${order.reason}` : ''} {order.payment_status === 'refunded' ? 'The business confirmed your payment has been refunded.' : ['collected', 'transfer_reported'].includes(order.payment_status) ? 'You told us you paid. Please contact the business to get your money back.' : 'You have not been charged.'}</Alert></div>}

            {rider && !closed && (
                <div className="vqs-card vqs-pad" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ width: 56, height: 56, borderRadius: 999, overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--vq-accent-quiet, #e6f4f1)', color: 'var(--vq-accent-text, #0b8f7a)', fontWeight: 800, fontSize: 20 }}>
                        {rider.photo_url ? <img src={rider.photo_url} alt={rider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : rider.name.charAt(0).toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.6 }}>{{ assigned: 'Rider assigned', accepted: 'Rider on the way to the shop', collected: 'Rider has your order', out_for_delivery: 'On the way to you', delivered: 'Delivered' }[rider.stage] || 'Your rider'}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>{rider.name}{rider.vehicle ? <span style={{ fontWeight: 500, fontSize: 13.5, opacity: 0.7 }}> · {rider.vehicle}</span> : null}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            {['assigned', 'collected', 'out_for_delivery', 'delivered'].map((st, i) => {
                                const at = ['assigned', 'accepted', 'collected', 'out_for_delivery', 'delivered'].indexOf(rider.stage);
                                const need = ['assigned', 'accepted', 'collected', 'out_for_delivery', 'delivered'].indexOf(st);
                                return <span key={st} style={{ flex: 1, height: 4, borderRadius: 99, background: at >= need ? 'var(--vq-accent-fill, #0BAA8F)' : 'var(--vq-line, #ddd)' }} />;
                            })}
                        </div>
                    </div>
                    {rider.phone && <a href={`tel:${rider.phone}`} className="vqs-btn" style={{ textDecoration: 'none' }}>{Icon.phone}<span style={{ marginLeft: 6 }}>Call {rider.name}</span></a>}
                </div>
            )}

            {order.estimated_ready_at && ['confirmed', 'preparing'].includes(order.status) && (
                <PreparationCountdown estimatedReadyAt={order.estimated_ready_at} prepMinutes={prep_minutes} fulfilment={order.fulfilment} />
            )}

            {!closed && (
                <div className="vqs-card vqs-pad" style={{ marginTop: 20 }}>
                    <ol className="vqs-steps" aria-label="Order progress">
                        {steps.map((s, i) => (
                            <li key={s} className={`vqs-step ${i < idx || order.status === 'completed' ? 'done' : ''} ${i === idx ? 'now done' : ''}`} aria-current={i === idx ? 'step' : undefined}>
                                <i>{i < idx || order.status === 'completed' ? '✓' : i + 1}</i>{SHORT[s]}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <div className="vqs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', marginTop: 20 }}>
                <div className="vqs-card vqs-pad" style={{ gridColumn: 'span 2' }}>
                    <h2 className="vqs-h2" style={{ fontSize: 20, marginBottom: 8 }}>Items</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {order.items.map((i, k) => (
                            <li key={k} className="vqs-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--vq-line-soft)', fontSize: 14 }}>
                                <span>{Number(i.quantity)} × {i.title}{(i.mods || []).length > 0 && <small style={{ display: 'block', opacity: 0.7 }}>{i.mods.map((m) => m.name).join(', ')}</small>}</span>
                                <span className="vqs-num">{money(i.line_total, sym)}</span>
                            </li>
                        ))}
                    </ul>
                    <dl className="vqs-totals" style={{ margin: '8px 0 0', borderTop: 0 }}>
                        <div className="vqs-between"><dt className="vqs-muted">Subtotal</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(order.subtotal, sym)}</dd></div>
                        {Number(order.tax_total) > 0 && <div className="vqs-between"><dt className="vqs-muted">Tax</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(order.tax_total, sym)}</dd></div>}
                        {Number(order.discount_total) > 0 && <div className="vqs-between"><dt className="vqs-muted">You saved{order.promo_name ? ` (${order.promo_name})` : ''}</dt><dd className="vqs-num vqs-save" style={{ margin: 0 }}>{money(order.discount_total, sym)}</dd></div>}
                        {Number(order.delivery_fee) > 0 && <div className="vqs-between"><dt className="vqs-muted">Delivery{order.delivery_zone ? ` · ${order.delivery_zone}` : ''}</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(order.delivery_fee, sym)}</dd></div>}
                        <div className="vqs-between big" style={{ paddingTop: 8, borderTop: '1px solid var(--vq-line)' }}><dt>Total</dt><dd className="vqs-num" style={{ margin: 0 }}>{money(order.total, sym)}</dd></div>
                    </dl>
                </div>

                <div className="vqs-stack">
                    <div className="vqs-card vqs-pad">
                        <div className="vqs-eyebrow" style={{ marginBottom: 6 }}>{order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</div>
                        {order.fulfilment === 'delivery' && <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-line' }}>{order.delivery_address}</p>}
                        <p className="vqs-muted" style={{ margin: '8px 0 0', fontSize: 14 }}>{METHOD_LABEL[order.payment_method]} · {PAYMENT_LABEL[order.payment_status]}</p>
                        {prep_minutes && !closed && <p className="vqs-muted" style={{ margin: '4px 0 0', fontSize: 14 }}>Usual preparation time: about {prep_minutes} min after the business accepts.</p>}
                        {history.length > 0 && (
                <div className="vqs-card vqs-pad" style={{ marginTop: 20 }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Your other orders here</h2>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6, fontSize: 14 }}>
                        {history.map((h) => (
                            <li key={h.number} className="vqs-row" style={{ justifyContent: 'space-between' }}>
                                <span>{h.number} <span className="vqs-faint">· {h.at}</span></span>
                                <span><Badge kind={h.status === 'completed' ? 'ok' : ['rejected', 'cancelled', 'expired'].includes(h.status) ? 'bad' : 'warn'}>{STATUS_LABEL[h.status] || h.status}</Badge> <b className="vqs-num">{money(h.total, h.symbol)}</b></span>
                            </li>
                        ))}
                    </ul>
                    <p className="vqs-hint" style={{ margin: '8px 0 0' }}>To open one, use “Lost your order link?” with its number and your phone.</p>
                </div>
            )}
            {reorder_url && <div style={{ marginTop: 12 }}><Btn variant="soft" onClick={reorder}>Order these again</Btn>{reorderMsg && <p className="vqs-err" role="alert" style={{ margin: '8px 0 0' }}>{reorderMsg}</p>}</div>}
                    </div>
                    <div className="vqs-card vqs-pad">
                        <div className="vqs-eyebrow" style={{ marginBottom: 6 }}>The business</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{store.name}</p>
                        {store.address && <p className="vqs-muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{store.address}</p>}
                        {store.phone && <p className="vqs-row vqs-num" style={{ margin: '8px 0 0', fontSize: 14, gap: 6 }}>{Icon.phone}<a href={`tel:${store.phone}`}>{store.phone}</a></p>}
                    </div>
                </div>
            </div>

            {store.bank_instructions && order.payment_method === 'bank' && !closed && (
                <div className="vqs-card vqs-pad" style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <h2 className="vqs-h2" style={{ fontSize: 20, margin: 0 }}>Bank transfer payment</h2>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: order.payment_status === 'transfer_reported' ? '#fef3c7' : '#e0e7ff', color: order.payment_status === 'transfer_reported' ? '#92400e' : '#3730a3' }}>
                            {order.payment_status === 'transfer_reported' ? 'Proof submitted · Under verification' : 'Payment required'}
                        </span>
                    </div>

                    <div style={{ background: 'var(--vq-bg-muted, #f8fafc)', border: '1px solid var(--vq-line, #e2e8f0)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--vq-text-muted, #64748b)', marginBottom: 6 }}>
                            Account details & instructions
                        </div>
                        <p style={{ fontSize: 14, whiteSpace: 'pre-line', margin: 0, lineHeight: 1.6, color: 'var(--vq-text, #0f172a)' }}>
                            {store.bank_instructions}
                        </p>
                    </div>

                    {order.payment_status === 'unpaid' ? (
                        <form onSubmit={submitTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                                <div>
                                    <Field label="Transaction reference / ID" error={errors?.reference}>
                                        <input
                                            className="vqs-input"
                                            value={ref}
                                            onChange={(e) => setRef(e.target.value)}
                                            placeholder="e.g. TRX-9823412 or bank ref"
                                            required
                                            minLength={3}
                                            maxLength={120}
                                        />
                                    </Field>
                                </div>

                                <div>
                                    <label htmlFor="commerce-payment-receipt" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--vq-text, #0f172a)' }}>
                                        Payment screenshot / receipt <span style={{ color: '#ef4444' }}>* (Compulsory)</span>
                                    </label>
                                    <label
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            padding: '16px 12px',
                                            border: '2px dashed ' + (fileErr || errors?.receipt ? '#ef4444' : 'var(--vq-line, #cbd5e1)'),
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            background: receiptFile ? 'rgba(16, 185, 129, 0.04)' : 'var(--vq-bg-subtle, #ffffff)',
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        <input
                                            id="commerce-payment-receipt"
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,application/pdf"
                                            style={{ display: 'none' }}
                                            onChange={handleFileChange}
                                        />
                                        {receiptPreview ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <img src={receiptPreview} alt="Receipt preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receiptFile.name}</div>
                                                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>Ready to upload · Click to change</div>
                                                </div>
                                            </div>
                                        ) : receiptFile ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{receiptFile.name}</div>
                                                <div style={{ fontSize: 11, color: '#10b981' }}>PDF ready to upload · Click to change</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--vq-brand, #4f46e5)' }}>
                                                    Click to upload payment screenshot
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--vq-text-muted, #64748b)' }}>
                                                    JPG, PNG, WebP or PDF (max 5 MB)
                                                </div>
                                            </>
                                        )}
                                    </label>
                                    {(fileErr || errors?.receipt) && (
                                        <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>
                                            {fileErr || errors?.receipt}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                <Btn type="submit" disabled={uploading}>
                                    {uploading ? 'Submitting receipt proof…' : 'Submit transfer proof'}
                                </Btn>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 14, color: 'var(--vq-text, #0f172a)' }}>
                                Reference: <strong>{order.bank_reference}</strong>
                            </div>
                            <p className="vqs-muted" style={{ fontSize: 13, margin: 0 }}>
                                Your transfer proof has been recorded. The store owner will verify the payment before fulfilling your order.
                            </p>
                            {order.bank_receipt_url && (
                                <div style={{ marginTop: 6 }}>
                                    <a
                                        href={order.bank_receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'var(--vq-brand, #4f46e5)',
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        View submitted payment proof receipt ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="vqs-card vqs-pad" style={{ marginTop: 20 }}>
                <h2 className="vqs-h2" style={{ fontSize: 20, marginBottom: 8 }}>History</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
                    {events.map((e, k) => (
                        <li key={k} className="vqs-between" style={{ padding: '6px 0' }}><span>{e.to ? STATUS_LABEL[e.to] : e.type.replace(/_/g, ' ')}</span><span className="vqs-faint vqs-num" style={{ fontSize: 13 }}>{e.at}</span></li>
                    ))}
                </ul>
            </div>
        </PublicShell>
    );
}
