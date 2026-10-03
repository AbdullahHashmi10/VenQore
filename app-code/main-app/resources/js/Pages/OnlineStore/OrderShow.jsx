import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Bike, CreditCard, History, MessageCircle, Package, Phone, Store as StoreIcon, User, Zap, Eye, ExternalLink, X, Check, UserPlus, Link2, AlertCircle, CheckCircle2 } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, CardTitle, StatusPill, inputCls } from '@/Components/Commerce/ui';
import { METHOD_LABEL, PAYMENT_LABEL, STATUS_LABEL, money } from '@/lib/commerce';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';

/** wa.me needs the country code; a leading 0 is only expanded for Pakistan (Rs), otherwise the number is used as typed. */
const STEPS = { pickup: ['pending', 'confirmed', 'preparing', 'ready', 'completed'], delivery: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed'] };
const STEP_LABEL = { pending: 'Placed', confirmed: 'Accepted', preparing: 'Preparing', ready: 'Ready', out_for_delivery: 'On the way', completed: 'Completed' };

function Stepper({ status, fulfilment }) {
    const steps = STEPS[fulfilment === 'delivery' ? 'delivery' : 'pickup'];
    const idx = steps.indexOf(status);
    if (idx < 0) return null;
    return (
        <ol className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }} aria-label="Order progress">
            {steps.map((st, i) => {
                const done = i < idx || status === 'completed';
                const now = i === idx && status !== 'completed';
                return (
                    <li key={st} aria-current={now ? 'step' : undefined} className="min-w-0">
                        <span className={`block h-1.5 rounded-full ${done ? 'bg-brand-600' : now ? 'bg-brand-400 animate-pulse' : 'bg-sunken'}`} />
                        <span className={`mt-1.5 block truncate text-xs ${done || now ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{STEP_LABEL[st]}</span>
                    </li>
                );
            })}
        </ol>
    );
}

const waNumber = (phone, sym) => {
    const d = String(phone || '').replace(/\D/g, '');
    return d.startsWith('0') && sym === 'Rs' ? `92${d.slice(1)}` : d;
};

export default function OrderShow({ order, lines, events, sale, urls, substitutes = [], party_matches = [] }) {
    const { errors } = usePage().props;
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [refunded, setRefunded] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    
    // Customer assignment state
    const [customerMode, setCustomerMode] = useState(party_matches && party_matches.length > 0 ? 'link' : 'new'); // 'new' | 'link'
    const [selectedCustomer, setSelectedCustomer] = useState(party_matches && party_matches.length > 0 ? party_matches[0] : null);
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: order.customer_name || '',
        phone: order.customer_phone || '',
        address: order.delivery_address || '',
    });
    const [completeModal, setCompleteModal] = useState({
        isOpen: false,
        collectNow: false,
        isAlreadyPaid: false,
    });

    const owes = ['collected', 'transfer_reported'].includes(order.payment_status);
    const [rev, setRev] = useState(null); // { note, rows: { [lineId]: { action, quantity, listing_id } } }
    const sym = order.currency_symbol;
    const act = (url, data = {}) => { setBusy(true); router.post(url, { version: order.version, ...data }, { preserveScroll: true, onFinish: () => { setBusy(false); setCompleteModal({ isOpen: false, collectNow: false, isAlreadyPaid: false }); } }); };
    const handover = order.fulfilment === 'delivery' ? 'out_for_delivery' : 'ready';
    const open = ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
    const shortage = lines.some((l) => l.available !== null && l.available < l.quantity);

    const handleConfirmComplete = () => {
        const payload = {
            collect_now: completeModal.collectNow,
        };
        if (customerMode === 'link' && selectedCustomer?.id) {
            payload.party_id = selectedCustomer.id;
        } else {
            payload.new_customer = {
                name: newCustomerForm.name.trim() || order.customer_name || 'Online Customer',
                phone: newCustomerForm.phone.trim() || order.customer_phone || '',
                address: newCustomerForm.address.trim() || order.delivery_address || '',
            };
        }
        act(urls.complete, payload);
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title={`Online order ${order.public_number}`} />
            <div className="flex flex-col min-h-full min-w-0 bg-app p-1 md:p-2 gap-1">
            <StoreTabs active="orders" urls={urls} />
            <section className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                <Link href={urls.back} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft size={14} />All orders</Link>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${order.fulfilment === 'delivery' ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'}`}>
                            {order.fulfilment === 'delivery' ? <Bike size={20} /> : <StoreIcon size={20} />}
                        </span>
                        <div>
                            <h2 className="text-2xl font-bold text-ink leading-tight">{order.public_number}</h2>
                            <p className="text-sm text-ink-muted">{order.customer_name} · {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} · {METHOD_LABEL[order.payment_method]}</p>
                        </div>
                        <StatusPill status={order.status} />
                    </div>
                    <div className="sm:text-right">
                        <div className="text-xs text-ink-muted">Order total</div>
                        <div className="text-2xl font-bold tabular-nums text-ink">{money(order.total, sym)}</div>
                    </div>
                </div>
                <Stepper status={order.status} fulfilment={order.fulfilment} />
            </section>
            {errors?.order && <Alert kind="error">{errors.order}</Alert>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 [&>*]:min-w-0">
                <div className="lg:col-span-2 flex flex-col gap-1">
                    <Card>
                        <div className="mb-3"><CardTitle icon={Package} title="Items" sub={`${lines.length} line${lines.length === 1 ? '' : 's'}`} /></div>
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
                        <CardTitle icon={Zap} tone="amber" title="Next step" />
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
                                {['confirmed', 'preparing'].includes(order.status) && <Button disabled={busy} onClick={() => act(urls.advance, { to: handover })}>{order.fulfilment === 'delivery' ? 'Out for delivery' : 'Ready for pickup'}</Button>}
                                {['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && ['unpaid', 'transfer_reported'].includes(order.payment_status) && order.payment_method === 'bank' &&
                                    <Button disabled={busy} variant="secondary" onClick={() => act(urls.collect)}>Mark transfer verified (paid)</Button>}
                            </div>
                        )}
                        {['ready', 'out_for_delivery'].includes(order.status) && (
                            <div className="border-t border-line pt-3 space-y-3">
                                <div className="p-3 rounded-xl bg-surface-2/60 border border-line flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-ink-secondary flex items-center gap-1.5">
                                            <User size={14} className="text-brand-600" />
                                            Target Customer Account
                                        </span>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${customerMode === 'link' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                                            {customerMode === 'link' ? 'Linked Existing Customer' : 'New Customer Profile'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-ink flex items-center justify-between">
                                        <div>
                                            {customerMode === 'link' && selectedCustomer
                                                ? `${selectedCustomer.name} (${selectedCustomer.phone || 'No phone'})`
                                                : `${newCustomerForm.name || order.customer_name || 'Online Customer'} (${newCustomerForm.phone || order.customer_phone || 'No phone'})`}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm">Hand over &amp; complete posts <strong>one sale</strong> and reduces stock.</p>
                                <div className="flex flex-wrap gap-2">
                                    {order.payment_status === 'collected'
                                        ? <Button disabled={busy} onClick={() => setCompleteModal({ isOpen: true, collectNow: false, isAlreadyPaid: true })}>Complete (already paid)</Button>
                                        : <>
                                            <Button disabled={busy} onClick={() => setCompleteModal({ isOpen: true, collectNow: true, isAlreadyPaid: false })}>Complete — money received now</Button>
                                            <Button disabled={busy} variant="secondary" onClick={() => setCompleteModal({ isOpen: true, collectNow: false, isAlreadyPaid: false })}>Complete — customer owes (receivable)</Button>
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
                        {order.status === 'completed' && sale && <p className="text-sm">Posted as sale <strong>{sale.reference_number}</strong> ({money(sale.invoice_total, sym)}, {sale.payment_status}). {urls.sale && <a className="underline font-semibold" href={urls.sale}>Open invoice / sale</a>}</p>}
                        {order.status === 'completed' && urls.print_receipt && <p className="text-sm"><a className="underline font-semibold" href={urls.print_receipt} target="_blank" rel="noopener noreferrer">Print receipt</a> using your normal receipt settings.</p>}
                        {order.status === 'completed' && order.payment_status !== 'collected' && urls.receive_payment && <p className="text-sm">Money still owed. <a className="underline font-semibold" href={urls.receive_payment}>Receive payment</a> in Payments; this order shows Paid once the sale is settled.</p>}
                        {['rejected', 'cancelled', 'expired'].includes(order.status) && <p className="text-sm text-ink-muted">{STATUS_LABEL[order.status]}{order.reason ? `: ${order.reason}` : ''}. No sale was posted.</p>}
                    </Card>
                </div>

                <div className="flex flex-col gap-1">
                    <Card>
                        <CardTitle icon={User} tone="violet" title={order.customer_name} sub={order.customer_phone} />
                        <p className="mt-3 grid grid-cols-2 gap-2 text-sm"><a className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 font-semibold hover:border-brand-300" href={`tel:${order.customer_phone}`}><Phone size={14} />Call</a>
                            <a className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNumber(order.customer_phone, order.currency_symbol)}?text=${encodeURIComponent(`Hi ${order.customer_name}, about your order ${order.public_number}: `)}`}><MessageCircle size={14} />WhatsApp</a></p>
                        <p className="text-sm text-ink-muted mt-2">{order.fulfilment === 'delivery' ? 'Delivery to:' : 'Pickup'}</p>
                        {order.delivery_address && <p className="text-sm whitespace-pre-line">{order.delivery_address}</p>}
                        {order.customer_note && <p className="text-sm mt-2 bg-sunken rounded-xl p-2">“{order.customer_note}”</p>}
                    </Card>
                    <Card>
                        <div className="mb-2"><CardTitle icon={CreditCard} tone="emerald" title="Payment" /></div>
                        <p className="text-sm font-semibold text-ink">{METHOD_LABEL[order.payment_method]}</p>
                        <p className="text-sm text-ink-muted">{PAYMENT_LABEL[order.payment_status]}</p>
                        {order.bank_reference && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-amber-900 dark:text-amber-200">Customer Transfer Ref:</span>
                                    <span className="font-mono bg-white dark:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-700/60 text-[11px] font-bold text-amber-900 dark:text-amber-100">
                                        {order.bank_reference}
                                    </span>
                                </div>
                                <div className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                                    Verify funds in your bank before marking payment as collected.
                                </div>
                                {order.bank_receipt_url && (
                                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowReceipt(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all"
                                        >
                                            <Eye size={13} />
                                            View Transfer Receipt
                                        </button>
                                        <a
                                            href={order.bank_receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-amber-800 dark:text-amber-300 underline font-medium hover:text-amber-950"
                                        >
                                            <ExternalLink size={12} />
                                            Open link
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                    <Card>
                        <div className="mb-3"><CardTitle icon={History} tone="slate" title="History" /></div>
                        <ol className="relative ml-1.5 border-l border-line">
                            {events.map((e, i) => (
                                <li key={i} className="relative pl-5 pb-3 last:pb-0">
                                    <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${i === events.length - 1 ? 'bg-brand-600' : 'bg-ink-muted/40'}`} aria-hidden="true" />
                                    <div className="text-sm font-medium text-ink">{e.to_status ? STATUS_LABEL[e.to_status] : e.type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}</div>
                                    <div className="text-xs text-ink-muted">{e.created_at}{e.note ? ` · ${e.note}` : ''}</div>
                                </li>
                            ))}
                        </ol>
                    </Card>
                </div>
            </div>
            </div>

            {showReceipt && order.bank_receipt_url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowReceipt(false)}
                >
                    <div
                        className="relative max-w-3xl w-full max-h-[90vh] bg-surface rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-line bg-surface-2/60">
                            <div>
                                <h3 className="font-bold text-ink text-base">Payment Screenshot Proof</h3>
                                <p className="text-xs text-ink-muted">
                                    Order #{order.public_number} · Ref: <span className="font-mono font-semibold">{order.bank_reference}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={order.bank_receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-surface border border-line hover:bg-interactive-hover text-ink text-xs inline-flex items-center gap-1 font-medium transition-colors"
                                >
                                    <ExternalLink size={13} /> Open full size
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setShowReceipt(false)}
                                    className="p-1.5 rounded-lg hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 overflow-auto flex items-center justify-center bg-neutral-900/5 min-h-[320px]">
                            {order.bank_receipt_url.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={order.bank_receipt_url} title="Receipt PDF" className="w-full h-[650px] rounded-lg border border-line" />
                            ) : (
                                <img
                                    src={order.bank_receipt_url}
                                    alt="Payment transfer proof screenshot"
                                    className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md border border-line"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Confirmation & Completion Modal */}
            {completeModal.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setCompleteModal({ isOpen: false, collectNow: false, isAlreadyPaid: false })}
                >
                    <div
                        className="relative max-w-lg w-full bg-surface rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-line bg-surface-2/60">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    completeModal.isAlreadyPaid 
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                        : completeModal.collectNow
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}>
                                    <User size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-ink text-base">
                                        {completeModal.isAlreadyPaid 
                                            ? 'Complete Order (Already Paid)'
                                            : completeModal.collectNow
                                                ? 'Complete Order — Money Received'
                                                : 'Add to Customer Account (Receivable)'}
                                    </h3>
                                    <p className="text-xs text-ink-muted">
                                        Order #{order.public_number} · Total: <span className="font-semibold text-ink">{money(order.total, sym)}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCompleteModal({ isOpen: false, collectNow: false, isAlreadyPaid: false })}
                                className="p-1.5 rounded-lg hover:bg-interactive-hover text-ink-secondary hover:text-ink transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh]">
                            {/* Financial Notice */}
                            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                                completeModal.isAlreadyPaid
                                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-200'
                                    : completeModal.collectNow
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                            }`}>
                                <div className="font-bold mb-0.5 flex items-center gap-1.5">
                                    <CreditCard size={14} />
                                    {completeModal.isAlreadyPaid 
                                        ? 'Bank Transfer Payment Verified'
                                        : completeModal.collectNow
                                            ? 'Cash Payment Received at Handover'
                                            : 'Payment Pending — Customer Ledger Receivable'}
                                </div>
                                {completeModal.isAlreadyPaid
                                    ? `This order will be posted as a paid sale under the customer's account.`
                                    : completeModal.collectNow
                                        ? `Sale will be marked as paid and ${money(order.total, sym)} logged into cash drawer.`
                                        : `Sale will be posted on credit. A receivable balance of ${money(order.total, sym)} will be added to the selected customer's ledger.`}
                            </div>

                            {/* Customer Mode Tabs */}
                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                                    Which customer should this transaction be assigned to?
                                </label>
                                <div className="grid grid-cols-2 p-1 bg-surface-2/80 rounded-xl border border-line gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setCustomerMode('new')}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                            customerMode === 'new'
                                                ? 'bg-surface text-ink shadow-sm'
                                                : 'text-ink-secondary hover:text-ink'
                                        }`}
                                    >
                                        <UserPlus size={14} />
                                        Create New Customer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomerMode('link')}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                            customerMode === 'link'
                                                ? 'bg-surface text-ink shadow-sm'
                                                : 'text-ink-secondary hover:text-ink'
                                        }`}
                                    >
                                        <Link2 size={14} />
                                        Link Existing Customer
                                    </button>
                                </div>
                            </div>

                            {/* Mode 1: Create New Customer Form */}
                            {customerMode === 'new' && (
                                <div className="space-y-3 p-3.5 bg-surface-2/40 rounded-xl border border-line animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-ink">Online Order Customer Details</span>
                                        <span className="text-[11px] text-ink-muted">Pre-filled from order</span>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium text-ink-muted mb-1">Customer Name *</label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            placeholder="Enter customer name"
                                            value={newCustomerForm.name}
                                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium text-ink-muted mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            placeholder="Enter phone number"
                                            value={newCustomerForm.phone}
                                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium text-ink-muted mb-1">Delivery / Billing Address</label>
                                        <textarea
                                            rows={2}
                                            className={inputCls}
                                            placeholder="Customer address"
                                            value={newCustomerForm.address}
                                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                        />
                                    </div>

                                    {party_matches && party_matches.length > 0 && (
                                        <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2">
                                            <AlertCircle size={15} className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                                            <div>
                                                <span>We found <strong>{party_matches.length} existing customer(s)</strong> with matching phone. </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomerMode('link');
                                                        setSelectedCustomer(party_matches[0]);
                                                    }}
                                                    className="underline font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 ml-1"
                                                >
                                                    Link to {party_matches[0].name}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mode 2: Link Existing Customer */}
                            {customerMode === 'link' && (
                                <div className="space-y-3 p-3.5 bg-surface-2/40 rounded-xl border border-line animate-in fade-in duration-150">
                                    <div className="text-xs font-semibold text-ink">
                                        Search and select from your existing customer directory:
                                    </div>

                                    {/* Suggested Matches */}
                                    {party_matches && party_matches.length > 0 && (
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-medium text-ink-muted">Phone Match Suggestions:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {party_matches.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => setSelectedCustomer(m)}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                                            selectedCustomer?.id === m.id
                                                                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                                                                : 'bg-surface border-line hover:border-brand-300 text-ink'
                                                        }`}
                                                    >
                                                        {selectedCustomer?.id === m.id && <Check size={12} className="text-brand-600" />}
                                                        {m.name} ({m.phone})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Async Combobox */}
                                    <div>
                                        <label className="block text-[11px] font-medium text-ink-muted mb-1">Search Customer Directory</label>
                                        <AsyncPartyCombobox
                                            type="customer"
                                            placeholder="Type name or phone number..."
                                            selectedItem={selectedCustomer}
                                            onSelect={(item) => setSelectedCustomer(item)}
                                        />
                                    </div>

                                    {selectedCustomer ? (
                                        <div className="p-3 rounded-lg bg-surface border border-brand-300/80 dark:border-brand-700/80 shadow-sm flex items-start justify-between gap-3">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 size={15} className="text-brand-600" />
                                                    <span className="font-bold text-ink text-sm">{selectedCustomer.name}</span>
                                                </div>
                                                <p className="text-xs text-ink-muted">{selectedCustomer.phone || 'No phone recorded'}</p>
                                                {selectedCustomer.address && (
                                                    <p className="text-xs text-ink-secondary truncate max-w-xs">{selectedCustomer.address}</p>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                                                Selected
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                                            Please select an existing customer from the dropdown above, or switch to "Create New Customer".
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary Confirmation Banner */}
                            <div className="p-3 rounded-xl bg-surface border border-line flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">Attributed Customer</span>
                                    <span className="font-bold text-ink text-sm">
                                        {customerMode === 'link' 
                                            ? (selectedCustomer?.name || 'None selected')
                                            : (newCustomerForm.name.trim() || order.customer_name || 'Online Customer')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">Total Amount</span>
                                    <span className="font-bold text-brand-600 text-sm tabular-nums">
                                        {money(order.total, sym)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-line bg-surface-2/40 flex items-center justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setCompleteModal({ isOpen: false, collectNow: false, isAlreadyPaid: false })}
                                disabled={busy}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={busy || (customerMode === 'link' && !selectedCustomer?.id) || (customerMode === 'new' && !newCustomerForm.name.trim())}
                                onClick={handleConfirmComplete}
                            >
                                {busy ? 'Completing...' : (
                                    completeModal.isAlreadyPaid 
                                        ? 'Confirm & Complete' 
                                        : completeModal.collectNow 
                                            ? 'Confirm & Mark Paid' 
                                            : 'Confirm & Post Receivable'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
