import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Alert, Badge, Btn, Field, Icon } from '@/Components/Commerce/shop';
import { METHOD_LABEL, PAYMENT_LABEL, STATUS_LABEL, cartStore, money } from '@/lib/commerce';

const STEPS_PICKUP = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
const STEPS_DELIVERY = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed'];

export default function OrderStatus({ order, store, events, transfer_url, cancel_url, reorder_url, history = [], prep_minutes, revision, revision_url }) {
    const [reorderMsg, setReorderMsg] = useState(null);
    const reorder = async () => {
        setReorderMsg(null);
        try {
            const r = await fetch(reorder_url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!r.ok) throw new Error('x');
            const d = await r.json();
            if (!d.lines.length) { setReorderMsg('None of these items are available right now.'); return; }
            // ids and quantities only; prices are re-checked by the server when the cart opens
            cartStore.write({ slug: d.slug, lines: d.lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity })) });
            window.location.href = `/shop/${d.slug}`;
        } catch { setReorderMsg('Could not start a new order. Please open the shop and add the items again.'); }
    };
    const { flash, errors } = usePage().props;
    const [ref, setRef] = useState('');
    const sym = order.currency_symbol;
    const steps = order.fulfilment === 'delivery' ? STEPS_DELIVERY : STEPS_PICKUP;
    const closed = ['rejected', 'cancelled', 'expired'].includes(order.status);
    const idx = steps.indexOf(order.status);

    const kind = { pending: 'warn', confirmed: 'info', preparing: 'info', ready: 'ok', out_for_delivery: 'ok', completed: 'ok' }[order.status] || 'bad';
    const SHORT = { pending: 'Waiting', confirmed: 'Accepted', preparing: 'Preparing', ready: 'Ready', out_for_delivery: 'On the way', completed: 'Done' };

    return (
        <PublicShell title={store.name}>
            <Head title={`Order ${order.number}`}>
                <meta name="robots" content="noindex,nofollow,noarchive" />
            </Head>

            {flash?.success && <span className="vqs-bigcheck" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l8 8 14-16" /></svg></span>}
            <div className="vqs-eyebrow">{store.name}</div>
            <div className="vqs-row" style={{ marginTop: 8, gap: 14 }}>
                <h1 className="vqs-h1" style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Order {order.number}</h1>
                <Badge kind={kind}>{STATUS_LABEL[order.status]}</Badge>
            </div>
            <p className="vqs-muted" style={{ fontSize: 14, margin: '8px 0 0' }}>Placed {order.placed_at}. Save this page&apos;s link — it is the only way to follow this order.</p>

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
                    <a className="vqs-btn vqs-btn--soft" href={`https://wa.me/${String(store.phone).replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi, about my order ${order.number}`)}`} target="_blank" rel="noopener noreferrer">Message {store.name} on WhatsApp</a>
                )}
                {cancel_url && (
                    <Btn variant="soft" onClick={() => { if (window.confirm('Cancel this order?')) router.post(cancel_url, {}, { preserveScroll: true }); }}>Cancel my order</Btn>
                )}
            </div>
            {order.status === 'pending' && <div style={{ marginTop: 16 }}><Alert kind="info">Your order is a request. {store.name} must confirm that the items are available before it is accepted.</Alert></div>}
            {closed && <div style={{ marginTop: 16 }}><Alert kind="error">This order was {order.status === 'expired' ? 'not accepted in time' : order.status}.{order.reason ? ` Reason: ${order.reason}` : ''} {order.payment_status === 'refunded' ? 'The business confirmed your payment has been refunded.' : ['collected', 'transfer_reported'].includes(order.payment_status) ? 'You told us you paid. Please contact the business to get your money back.' : 'You have not been charged.'}</Alert></div>}

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
                                <span>{Number(i.quantity)} × {i.title}</span>
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
                    <h2 className="vqs-h2" style={{ fontSize: 20 }}>Bank transfer</h2>
                    <p style={{ fontSize: 14, whiteSpace: 'pre-line' }}>{store.bank_instructions}</p>
                    {order.payment_status === 'unpaid' ? (
                        <form className="vqs-row" style={{ alignItems: 'flex-end', marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); router.post(transfer_url, { reference: ref }, { preserveScroll: true }); }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <Field label="Transfer reference" error={errors?.reference}>
                                    <input className="vqs-input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction ID / reference" required minLength={3} maxLength={120} />
                                </Field>
                            </div>
                            <Btn type="submit" onClick={() => {}}>I have sent the transfer</Btn>
                        </form>
                    ) : (
                        <p className="vqs-muted" style={{ fontSize: 14 }}>{order.payment_status === 'transfer_reported' ? `Reported with reference ${order.bank_reference}. The business will verify it — this does not mark the order paid.` : null}</p>
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
