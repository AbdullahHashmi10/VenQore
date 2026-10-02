import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Alert, Button, Card, StatusPill, inputCls } from '@/Components/Commerce/ui';
import { METHOD_LABEL, PAYMENT_LABEL, STATUS_LABEL, money } from '@/lib/commerce';

export default function OrderShow({ order, lines, events, sale, urls }) {
    const { errors, flash } = usePage().props;
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const sym = order.currency_symbol;
    const act = (url, data = {}) => { setBusy(true); router.post(url, { version: order.version, ...data }, { preserveScroll: true, onFinish: () => setBusy(false) }); };
    const handover = order.fulfilment === 'delivery' ? 'out_for_delivery' : 'ready';
    const open = ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
    const shortage = lines.some((l) => l.available !== null && l.available < l.quantity);

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title={`Online order ${order.public_number}`} />
            <Link href={urls.back} className="text-sm text-ink-muted underline">← Online orders</Link>
            <div className="flex flex-wrap items-center gap-3 mt-2 mb-4">
                <h1 className="text-2xl font-bold text-ink">{order.public_number}</h1><StatusPill status={order.status} />
            </div>
            {flash?.success && <div className="mb-3"><Alert kind="success">{flash.success}</Alert></div>}
            {errors?.order && <div className="mb-3"><Alert kind="error">{errors.order}</Alert></div>}

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h2 className="font-semibold mb-3">Items</h2>
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-ink-muted"><th className="py-1">Item</th><th className="text-right">Qty</th><th className="text-right">Online price</th><th className="text-right">Total</th>{order.status === 'pending' && <th className="text-right">In stock</th>}</tr></thead>
                            <tbody>
                                {lines.map((l, i) => (
                                    <tr key={i} className="border-t border-line">
                                        <td className="py-2">{l.title}<div className="text-xs text-ink-muted">{l.rule === 'fixed_override' ? 'fixed online price' : l.rule === 'percent' ? `${l.rule_percent > 0 ? '+' : ''}${l.rule_percent}% on ${money(l.base_price, sym)}` : 'regular price'}</div></td>
                                        <td className="text-right tabular-nums">{l.quantity}</td><td className="text-right tabular-nums">{money(l.online_price, sym)}</td><td className="text-right tabular-nums">{money(l.line_total, sym)}</td>
                                        {order.status === 'pending' && <td className={`text-right tabular-nums ${l.available !== null && l.available < l.quantity ? 'text-red-600 font-semibold' : ''}`}>{l.available ?? '—'}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <dl className="mt-3 text-sm space-y-1 text-right">
                            <div><dt className="inline text-ink-muted">Subtotal </dt><dd className="inline tabular-nums">{money(order.subtotal, sym)}</dd></div>
                            {Number(order.tax_total) > 0 && <div><dt className="inline text-ink-muted">Tax </dt><dd className="inline tabular-nums">{money(order.tax_total, sym)}</dd></div>}
                            {Number(order.delivery_fee) > 0 && <div><dt className="inline text-ink-muted">Delivery </dt><dd className="inline tabular-nums">{money(order.delivery_fee, sym)}</dd></div>}
                            <div className="text-base font-bold"><dt className="inline">Total </dt><dd className="inline tabular-nums">{money(order.total, sym)}</dd></div>
                        </dl>
                    </Card>

                    <Card className="space-y-3">
                        <h2 className="font-semibold">Actions</h2>
                        {order.status === 'pending' && (
                            <>
                                {shortage && <Alert kind="warn">Stock looks short for at least one line. Accepting will re-check and may be refused.</Alert>}
                                <p className="text-xs text-ink-muted">Accepting re-checks live stock and holds it for this order. {order.accept_by && `Accept by ${order.accept_by}.`}</p>
                                <div className="flex flex-wrap gap-2 items-end">
                                    <Button disabled={busy} onClick={() => act(urls.accept)}>Accept order</Button>
                                    <input className={inputCls + ' !w-64'} placeholder="Reason (to decline)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Decline reason" />
                                    <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => act(urls.reject, { reason })}>Decline</Button>
                                </div>
                            </>
                        )}
                        {open && (
                            <div className="flex flex-wrap gap-2">
                                {order.status === 'confirmed' && <Button disabled={busy} variant="secondary" onClick={() => act(urls.advance, { to: 'preparing' })}>Start preparing</Button>}
                                {['confirmed', 'preparing'].includes(order.status) && <Button disabled={busy} variant="secondary" onClick={() => act(urls.advance, { to: handover })}>{order.fulfilment === 'delivery' ? 'Out for delivery' : 'Ready for pickup'}</Button>}
                                {['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && ['unpaid', 'transfer_reported'].includes(order.payment_status) && order.payment_method === 'bank' &&
                                    <Button disabled={busy} variant="secondary" onClick={() => act(urls.collect)}>Mark transfer verified (paid)</Button>}
                            </div>
                        )}
                        {['ready', 'out_for_delivery'].includes(order.status) && (
                            <div className="border-t border-line pt-3 space-y-2">
                                <p className="text-sm">Hand over &amp; complete posts <strong>one sale</strong> and reduces stock.</p>
                                <div className="flex flex-wrap gap-2">
                                    {order.payment_status === 'collected'
                                        ? <Button disabled={busy} onClick={() => act(urls.complete, {})}>Complete (already paid)</Button>
                                        : <>
                                            <Button disabled={busy} onClick={() => act(urls.complete, { collect_now: true })}>Complete — money received now</Button>
                                            <Button disabled={busy} variant="secondary" onClick={() => act(urls.complete, { collect_now: false })}>Complete — customer owes (receivable)</Button>
                                        </>}
                                </div>
                                {order.payment_status !== 'collected' && <p className="text-xs text-ink-muted">Cash on delivery is not income until collected. Choose “customer owes” to record it as a receivable and receive payment later in your normal receivables flow.</p>}
                            </div>
                        )}
                        {open && (
                            <div className="border-t border-line pt-3 flex flex-wrap gap-2 items-end">
                                <input className={inputCls + ' !w-64'} placeholder="Reason to cancel" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Cancel reason" />
                                <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => act(urls.cancel, { reason })}>Cancel order (release stock)</Button>
                            </div>
                        )}
                        {order.status === 'completed' && sale && <p className="text-sm">Posted as sale <strong>{sale.reference_number}</strong> ({money(sale.invoice_total, sym)}, {sale.payment_status}). {urls.sale && <a className="underline" href={urls.sale}>Open sale</a>}</p>}
                        {order.status === 'completed' && order.payment_status !== 'collected' && urls.receive_payment && <p className="text-sm">Money still owed. <a className="underline font-semibold" href={urls.receive_payment}>Receive payment</a> in Payments; this order shows Paid once the sale is settled.</p>}
                        {['rejected', 'cancelled', 'expired'].includes(order.status) && <p className="text-sm text-ink-muted">{STATUS_LABEL[order.status]}{order.reason ? `: ${order.reason}` : ''}. No sale was posted.</p>}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <h2 className="font-semibold mb-2">Customer</h2>
                        <p className="text-sm">{order.customer_name}</p>
                        <p className="text-sm"><a className="underline" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></p>
                        <p className="text-sm text-ink-muted mt-2">{order.fulfilment === 'delivery' ? 'Delivery to:' : 'Pickup'}</p>
                        {order.delivery_address && <p className="text-sm whitespace-pre-line">{order.delivery_address}</p>}
                        {order.customer_note && <p className="text-sm mt-2 bg-sunken rounded-xl p-2">“{order.customer_note}”</p>}
                    </Card>
                    <Card>
                        <h2 className="font-semibold mb-2">Payment</h2>
                        <p className="text-sm">{METHOD_LABEL[order.payment_method]}</p>
                        <p className="text-sm text-ink-muted">{PAYMENT_LABEL[order.payment_status]}</p>
                        {order.bank_reference && <p className="text-sm mt-1">Customer-reported reference: <strong>{order.bank_reference}</strong> (unverified)</p>}
                    </Card>
                    <Card>
                        <h2 className="font-semibold mb-2">History</h2>
                        <ul className="text-xs space-y-1">
                            {events.map((e, i) => <li key={i}><span className="text-ink-muted">{e.created_at}</span> — {e.to_status ? STATUS_LABEL[e.to_status] : e.type.replace(/_/g, ' ')}{e.note ? ` · ${e.note}` : ''}</li>)}
                        </ul>
                    </Card>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
