import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Alert, Button, Card, StatusPill, inputCls } from '@/Components/Commerce/ui';
import { METHOD_LABEL, PAYMENT_LABEL, STATUS_LABEL, money } from '@/lib/commerce';

/** wa.me needs the country code; a leading 0 is only expanded for Pakistan (Rs), otherwise the number is used as typed. */
const waNumber = (phone, sym) => {
    const d = String(phone || '').replace(/\D/g, '');
    return d.startsWith('0') && sym === 'Rs' ? `92${d.slice(1)}` : d;
};

export default function OrderShow({ order, lines, events, sale, urls, substitutes = [], party_matches = [] }) {
    const { errors, flash } = usePage().props;
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [partyId, setPartyId] = useState('');
    const [refunded, setRefunded] = useState(false);
    const owes = ['collected', 'transfer_reported'].includes(order.payment_status);
    const [rev, setRev] = useState(null); // { note, rows: { [lineId]: { action, quantity, listing_id } } }
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
                                {order.revision_status === 'proposed' && <Alert kind="info">You proposed changes. The customer must accept or decline them before you can accept this order.</Alert>}
                                {order.revision_status === 'declined' && <Alert kind="warn">The customer declined your proposed changes. You can accept the original order or decline it.</Alert>}
                                {order.revision_status === 'accepted' && <Alert kind="success">The customer accepted the changes. The lines above are the updated order.</Alert>}
                                <div className="flex flex-wrap gap-2 items-end">
                                    <Button disabled={busy || order.revision_status === 'proposed'} onClick={() => act(urls.accept)}>Accept order</Button>
                                    {order.revision_status !== 'proposed' && <Button variant="secondary" disabled={busy} onClick={() => setRev(rev ? null : { note: '', rows: {} })}>{rev ? 'Close changes' : 'Propose changes'}</Button>}
                                    {owes && <label className="flex items-center gap-2 text-sm w-full"><input type="checkbox" checked={refunded} onChange={(e) => setRefunded(e.target.checked)} />Refund confirmed — the customer's money {order.payment_status === 'collected' ? 'was collected and has been returned' : 'transfer has been returned or never arrived'}</label>}
                                    <input className={inputCls + ' !w-64'} placeholder="Reason (to decline)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Decline reason" />
                                    <Button variant="secondary" disabled={busy} onClick={() => { if (window.confirm('Block this phone number from ordering?')) act(urls.block, {}); }}>Block number</Button>
                                    <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => act(urls.reject, { reason, refund_confirmed: refunded })}>Decline</Button>
                                </div>
                            </>
                        )}
                        {order.status === 'pending' && rev && (
                            <div className="rounded-xl border border-line p-3 space-y-3">
                                <p className="text-xs text-ink-muted">Short on something? Lower a quantity, remove a line or offer a substitute. Nothing changes until the customer agrees on their status page. Kept lines keep their price; a substitute is priced at today&apos;s online price.</p>
                                {lines.map((l) => {
                                    const r = rev.rows[l.id] || { action: '' };
                                    const setRow = (patch) => setRev({ ...rev, rows: { ...rev.rows, [l.id]: { ...r, ...patch } } });
                                    return (
                                        <div key={l.id} className="flex flex-wrap items-center gap-2 text-sm">
                                            <span className="w-56 truncate">{l.quantity} × {l.title}</span>
                                            <select className={inputCls + ' !w-44'} aria-label={`Change for ${l.title}`} value={r.action} onChange={(e) => setRow({ action: e.target.value, quantity: '', listing_id: '' })}>
                                                <option value="">No change</option><option value="qty">Reduce quantity</option><option value="remove">Remove</option><option value="substitute">Substitute</option>
                                            </select>
                                            {(r.action === 'qty' || r.action === 'substitute') && <input type="number" min="0.0001" step="any" className={inputCls + ' !w-24'} aria-label="New quantity" placeholder={r.action === 'qty' ? 'New qty' : String(l.quantity)} value={r.quantity || ''} onChange={(e) => setRow({ quantity: e.target.value })} />}
                                            {r.action === 'substitute' && (
                                                <select className={inputCls + ' !w-56'} aria-label="Substitute item" value={r.listing_id || ''} onChange={(e) => setRow({ listing_id: e.target.value })}>
                                                    <option value="">Choose item…</option>{substitutes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                                <input className={inputCls} placeholder="Note to the customer (optional)" maxLength={255} value={rev.note} onChange={(e) => setRev({ ...rev, note: e.target.value })} aria-label="Note to the customer" />
                                <Button disabled={busy || !Object.values(rev.rows).some((x) => x.action)} onClick={() => act(urls.revise, { note: rev.note, changes: Object.entries(rev.rows).filter(([, x]) => x.action).map(([item, x]) => ({ item, action: x.action, quantity: x.quantity === '' ? undefined : x.quantity, listing_id: x.listing_id || undefined })) })}>Send to customer</Button>
                            </div>
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
                                {(party_matches || []).length > 0 && (
                                    <label className="block text-sm">
                                        <span className="text-ink-secondary">Customer record for the sale</span>
                                        <select className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                                            <option value="">Create a new online customer</option>
                                            {party_matches.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
                                        </select>
                                    </label>
                                )}
                                <p className="text-sm">Hand over &amp; complete posts <strong>one sale</strong> and reduces stock.</p>
                                <div className="flex flex-wrap gap-2">
                                    {order.payment_status === 'collected'
                                        ? <Button disabled={busy} onClick={() => act(urls.complete, { party_id: partyId || undefined })}>Complete (already paid)</Button>
                                        : <>
                                            <Button disabled={busy} onClick={() => act(urls.complete, { collect_now: true, party_id: partyId || undefined })}>Complete — money received now</Button>
                                            <Button disabled={busy} variant="secondary" onClick={() => act(urls.complete, { collect_now: false, party_id: partyId || undefined })}>Complete — customer owes (receivable)</Button>
                                        </>}
                                </div>
                                {order.payment_status !== 'collected' && <p className="text-xs text-ink-muted">Cash on delivery is not income until collected. Choose “customer owes” to record it as a receivable and receive payment later in your normal receivables flow.</p>}
                            </div>
                        )}
                        {open && (
                            <div className="border-t border-line pt-3 flex flex-wrap gap-2 items-end">
                                {owes && <label className="flex items-center gap-2 text-sm w-full"><input type="checkbox" checked={refunded} onChange={(e) => setRefunded(e.target.checked)} />Refund confirmed — the customer's money has been returned</label>}
                                <input className={inputCls + ' !w-64'} placeholder="Reason to cancel" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Cancel reason" />
                                <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => act(urls.cancel, { reason, refund_confirmed: refunded })}>Cancel order (release stock)</Button>
                            </div>
                        )}
                        {order.status === 'completed' && sale && <p className="text-sm">Posted as sale <strong>{sale.reference_number}</strong> ({money(sale.invoice_total, sym)}, {sale.payment_status}). {urls.sale && <a className="underline" href={urls.sale}>Open sale</a>}</p>}
                        {order.status === 'completed' && urls.print_receipt && <p className="text-sm"><a className="underline font-semibold" href={urls.print_receipt} target="_blank" rel="noopener noreferrer">Print receipt</a> using your normal receipt settings.</p>}
                        {order.status === 'completed' && order.payment_status !== 'collected' && urls.receive_payment && <p className="text-sm">Money still owed. <a className="underline font-semibold" href={urls.receive_payment}>Receive payment</a> in Payments; this order shows Paid once the sale is settled.</p>}
                        {['rejected', 'cancelled', 'expired'].includes(order.status) && <p className="text-sm text-ink-muted">{STATUS_LABEL[order.status]}{order.reason ? `: ${order.reason}` : ''}. No sale was posted.</p>}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <h2 className="font-semibold mb-2">Customer</h2>
                        <p className="text-sm">{order.customer_name}</p>
                        <p className="text-sm flex flex-wrap gap-3"><a className="underline" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                            <a className="underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNumber(order.customer_phone, order.currency_symbol)}?text=${encodeURIComponent(`Hi ${order.customer_name}, about your order ${order.public_number}: `)}`}>WhatsApp the customer</a></p>
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
