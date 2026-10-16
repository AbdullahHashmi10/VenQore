import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bike, CheckCircle2, ChevronRight, Copy, Inbox, Truck, Users } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { ListPageFrame, ListStatCards } from '@/Components/ListShell';
import { Alert, EmptyState, StatusPill } from '@/Components/Commerce/ui';
import { money } from '@/lib/commerce';

const D_LABEL = { assigned: 'Assigned', accepted: 'Accepted', collected: 'Collected', out_for_delivery: 'On the way', delivered: 'Delivered', failed: 'Failed', returned: 'Returned' };
const D_TONE = {
    assigned: 'bg-sky-100 text-sky-800', accepted: 'bg-sky-100 text-sky-800', collected: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-violet-100 text-violet-800', delivered: 'bg-emerald-100 text-emerald-800', failed: 'bg-rose-100 text-rose-800', returned: 'bg-neutral-200 text-neutral-800',
};

/** What the customer sees about this rider on their order page. All optional. */
function RiderProfile({ r }) {
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState(r.phone || '');
    const [vehicle, setVehicle] = useState(r.vehicle || '');
    const [photo, setPhoto] = useState(null);
    const [busy, setBusy] = useState(false);
    const save = (extra = {}) => {
        setBusy(true);
        router.post(r.profile_url, { phone, vehicle, ...(photo ? { photo } : {}), ...extra }, { forceFormData: true, preserveScroll: true, onFinish: () => { setBusy(false); setPhoto(null); } });
    };
    if (!open) return <button type="button" className="basis-full text-left text-xs font-semibold text-brand-600 hover:underline" onClick={() => setOpen(true)}>{r.photo_url || r.phone || r.vehicle ? 'Edit what customers see' : 'Add photo, phone & vehicle for customers'}</button>;
    return (
        <div className="basis-full grid gap-2 rounded-[12px] bg-sunken p-2.5 text-xs">
            <p className="text-ink-muted">Shown to the customer on their order page while this rider brings it. All optional.</p>
            <label className="flex items-center gap-2"><span className="w-14 text-ink-muted">Photo</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="min-w-0 flex-1" />{r.photo_url && <button type="button" className="text-rose-600 font-semibold" onClick={() => save({ remove_photo: 1 })}>Remove</button>}</label>
            <label className="flex items-center gap-2"><span className="w-14 text-ink-muted">Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} inputMode="tel" placeholder="Customer can call this number" className="min-w-0 flex-1 rounded-[12px] border border-line bg-surface px-2 py-1" /></label>
            <label className="flex items-center gap-2"><span className="w-14 text-ink-muted">Vehicle</span><input value={vehicle} onChange={(e) => setVehicle(e.target.value)} maxLength={80} placeholder="e.g. Red Honda 125 · LEB-1234" className="min-w-0 flex-1 rounded-[12px] border border-line bg-surface px-2 py-1" /></label>
            <div className="flex gap-2"><button type="button" disabled={busy} className="rounded-[12px] bg-brand-500 px-3 py-1 font-semibold text-white disabled:opacity-50" onClick={() => save()}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="rounded-[12px] border border-line px-3 py-1 font-semibold" onClick={() => setOpen(false)}>Close</button></div>
        </div>
    );
}

export default function Deliveries({ riders = [], members = [], orders = [], urls, can = {}, riderLink = null, riderWhatsapp = null }) {
    const { errors = {}, flash = {} } = usePage().props;
    const [pick, setPick] = useState({});
    const [copied, setCopied] = useState(false);

    const assign = (orderId) => {
        const rider = pick[orderId];
        if (!rider) return;
        router.post(urls.assign, { order_id: orderId, rider_id: rider }, { preserveScroll: true });
    };
    const post = (url, data = {}) => router.post(url, data, { preserveScroll: true });
    const base = urls.orders.replace(/\/orders$/, '');

    const needRider = orders.filter((o) => !o.delivery_id || o.delivery_status === 'failed' || o.delivery_status === 'returned');
    const moving = orders.filter((o) => o.delivery_id && ['assigned', 'accepted', 'collected', 'out_for_delivery'].includes(o.delivery_status));
    const delivered = orders.filter((o) => o.delivery_status === 'delivered');

    const rows = [...needRider.map((o) => ['Needs a rider', o]), ...moving.map((o) => ['With riders', o]), ...delivered.map((o) => ['Delivered', o])];

    const Row = ({ o, children }) => (
        <li className="rounded-[14px] border border-line bg-surface px-3 py-2.5 shadow-sm flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="min-w-0">
                    <Link href={o.order_url} className="font-semibold text-ink hover:underline">{o.customer_name}</Link>
                    <span className="text-sm text-ink-muted"> · {o.public_number} · {o.created_at_local}</span>
                </div>
                <div className="flex items-center gap-2">
                    <StatusPill status={o.order_status} />
                    {o.delivery_status && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${D_TONE[o.delivery_status]}`}>{D_LABEL[o.delivery_status]}</span>}
                    <b className="tabular-nums">{money(o.total, o.currency_symbol)}</b>
                </div>
            </div>
            <p className="text-sm text-ink-muted">{o.delivery_address || 'No address'} · {o.customer_phone}{o.payment_method === 'cod' && o.payment_status === 'unpaid' ? ' · Cash on delivery' : ''}</p>
            {o.fail_reason && <p className="text-sm text-rose-700">Failed: {o.fail_reason}</p>}
            {children}
        </li>
    );

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store" noPadding>
            <Head title="Deliveries" />
            <ListPageFrame className="min-w-0 bg-app max-md:flex max-md:flex-col max-md:min-h-full max-md:gap-2 max-md:p-1.5">
                <StoreTabs active="deliveries" urls={urls} />
                <ListStatCards cards={[
                    { label: 'Riders', value: riders.length, icon: Users },
                    { label: 'Needs a rider', value: needRider.length, icon: Inbox, icon_tone: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', value_tone: 'text-amber-600' },
                    { label: 'With riders', value: moving.length, icon: Truck, icon_tone: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400', value_tone: 'text-sky-600' },
                    { label: 'Delivered recently', value: delivered.length, icon: CheckCircle2, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                ]} />
<div className="flex flex-col gap-2 md:flex-1 md:min-h-0 md:overflow-auto">
                {(errors.delivery || flash.success) && <Alert kind={errors.delivery ? 'error' : 'success'}>{errors.delivery || flash.success}</Alert>}

                {riderWhatsapp && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <span><b>{riderWhatsapp.rider || 'The rider'}</b> has been given this order. You can also message them on WhatsApp; nothing is sent until you press send there.</span>
                        <a href={riderWhatsapp.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-[12px] bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Send to rider on WhatsApp</a>
                    </div>
                )}

                {riderLink && (
                    <div className="rounded-[14px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                        <b>Rider link (shown once):</b> send it to the rider. Anyone with this link can act as this rider.
                        <div className="mt-2 flex items-center gap-2">
                            <input readOnly value={riderLink.url} className="w-full rounded-[12px] border border-line bg-white px-2 py-1 text-xs" onFocus={(e) => e.target.select()} />
                            <button type="button" className="inline-flex items-center gap-1 rounded-[12px] border border-line bg-white px-2 py-1 text-xs font-semibold"
                                onClick={() => { navigator.clipboard?.writeText(riderLink.url); setCopied(true); }}><Copy size={12} />{copied ? 'Copied' : 'Copy'}</button>
                        </div>
                    </div>
                )}

                <section aria-label="Riders" className="rounded-[14px] border border-line bg-surface p-3">
                    <h2 className="font-bold text-ink flex items-center gap-2"><Bike size={18} />Riders</h2>
                    {riders.length === 0 ? (
                        <p className="text-sm text-ink-muted mt-1">No riders yet. Mark a staff member as a rider in Restaurant &gt; Riders.</p>
                    ) : (
                        <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {riders.map((r) => (
                                <li key={r.id} className="rounded-[14px] border border-line p-2.5 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-sunken text-sm font-bold text-ink-muted">{r.photo_url ? <img src={r.photo_url} alt="" className="h-full w-full object-cover" /> : r.name.charAt(0).toUpperCase()}</span>
                                        <div>
                                        <b className="text-ink">{r.name}</b>
                                        <p className="text-xs text-ink-muted">{r.active} active · cash with rider {money(r.cash_outstanding, 'Rs')}</p>
                                        </div>
                                    </div>
                                    {can.manage && <button type="button" className="rounded-[12px] border border-line px-2 py-1 text-xs font-semibold hover:bg-sunken" onClick={() => post(r.link_url)}>New link</button>}
                                    {can.manage && <RiderProfile r={r} />}
                                    {can.manage && (
                                        <div className="basis-full text-xs">
                                            <label className="text-ink-muted" htmlFor={`login-${r.id}`}>Sign-in</label>{' '}
                                            <select id={`login-${r.id}`} className="rounded-[12px] border border-line bg-surface px-1.5 py-1" value={r.login ? 'linked' : (pick[`login-${r.id}`] || '')}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    if (v === 'linked') return;
                                                    if (v === '') { post(r.account_url, { user_id: '' }); return; }
                                                    setPick({ ...pick, [`login-${r.id}`]: v });
                                                    post(r.account_url, { user_id: v });
                                                }}>
                                                {r.login ? <option value="linked">{r.login.name} ({r.login.email})</option> : <option value="">Link a staff login…</option>}
                                                {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                                                {r.login && <option value="">Remove login</option>}
                                            </select>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <h2 className="md:hidden font-bold text-ink mt-1">Needs a rider ({needRider.length})</h2>
                {needRider.length === 0 ? <div className="md:hidden"><EmptyState icon={Inbox} title="No deliveries waiting" text="Accepted delivery orders without a rider appear here." /></div> : (
                    <ul className="md:hidden flex flex-col gap-2">
                        {needRider.map((o) => (
                            <Row key={o.order_id} o={o}>
                                {can.manage && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <select aria-label="Choose rider" className="rounded-[12px] border border-line bg-surface px-2 py-1 text-sm" value={pick[o.order_id] || ''} onChange={(e) => setPick({ ...pick, [o.order_id]: e.target.value })}>
                                            <option value="">Choose rider</option>
                                            {riders.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.active})</option>)}
                                        </select>
                                        <button type="button" disabled={!pick[o.order_id]} className="rounded-[12px] bg-brand-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50" onClick={() => assign(o.order_id)}>
                                            {o.delivery_id ? 'Reassign' : 'Assign'}
                                        </button>
                                        {o.delivery_status === 'failed' && <button type="button" className="rounded-[12px] border border-line px-3 py-1 text-sm font-semibold" onClick={() => post(`${base}/deliveries/${o.delivery_id}/returned`)}>Goods are back at the store</button>}
                                    </div>
                                )}
                            </Row>
                        ))}
                    </ul>
                )}

                <h2 className="md:hidden font-bold text-ink mt-1">With riders ({moving.length})</h2>
                {moving.length > 0 && (
                    <ul className="md:hidden flex flex-col gap-2">
                        {moving.map((o) => (
                            <Row key={o.order_id} o={o}>
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span>Rider: <b>{o.rider_name}</b></span>
                                    {can.manage && o.delivery_status !== 'out_for_delivery' && (
                                        <>
                                            <select aria-label="Change rider" className="rounded-[12px] border border-line bg-surface px-2 py-1" value={pick[o.order_id] || ''} onChange={(e) => setPick({ ...pick, [o.order_id]: e.target.value })}>
                                                <option value="">Change rider…</option>
                                                {riders.filter((r) => r.id !== o.rider_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                            <button type="button" disabled={!pick[o.order_id]} className="rounded-[12px] border border-line px-2 py-1 font-semibold disabled:opacity-50" onClick={() => assign(o.order_id)}>Reassign</button>
                                        </>
                                    )}
                                </div>
                            </Row>
                        ))}
                    </ul>
                )}

                <h2 className="md:hidden font-bold text-ink mt-1">Delivered recently ({delivered.length})</h2>
                {delivered.length > 0 && (
                    <ul className="md:hidden flex flex-col gap-2">
                        {delivered.map((o) => (
                            <Row key={o.order_id} o={o}>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span>Rider: <b>{o.rider_name}</b></span>
                                    {Number(o.cash_expected) > 0 && (
                                        <span>
                                            Cash {money(o.cash_collected ?? 0, o.currency_symbol)} of {money(o.cash_expected, o.currency_symbol)}
                                            {o.cash_acknowledged_at ? ' · received by manager' : ' · with rider'}
                                        </span>
                                    )}
                                    {can.cash && Number(o.cash_expected) > 0 && !o.cash_acknowledged_at && (
                                        <button type="button" className="rounded-[12px] bg-emerald-600 px-3 py-1 font-semibold text-white" onClick={() => post(`${base}/deliveries/${o.delivery_id}/ack-cash`)}>Cash received</button>
                                    )}
                                    {o.order_status !== 'completed' && <Link href={o.order_url} className="font-semibold text-brand-700 underline">Complete the order</Link>}
                                </div>
                            </Row>
                        ))}
                    </ul>
                )}
                <div className="hidden md:block rounded-[14px] border border-line shadow-sm bg-surface overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line">
                                {['Order #', 'Customer', 'Stage', 'Address', 'Status', 'Rider / action', 'Total', ''].map((c, i) => <th key={i} className={`p-4 text-xs font-bold text-ink-muted uppercase tracking-wider whitespace-nowrap ${c === 'Total' ? 'text-right' : ''}`}>{c}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {rows.length === 0 ? (
                                <tr><td colSpan={8} className="p-5 sm:p-12">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4"><Inbox size={32} className="text-ink-muted" /></div>
                                        <p className="text-lg font-bold text-ink-secondary mb-1">No deliveries waiting</p>
                                        <p className="text-sm text-ink-muted">Accepted delivery orders without a rider appear here.</p>
                                    </div>
                                </td></tr>
                            ) : rows.map(([stage, o]) => (
                                <tr key={`${stage}-${o.order_id}`} onClick={() => router.visit(o.order_url)}
                                    className={`h-14 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer border-l-4 hover:border-brand-400 ${stage === 'Needs a rider' ? 'border-l-amber-400' : 'border-transparent'}`}>
                                    <td className="p-4 text-sm whitespace-nowrap"><span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{o.public_number}</span></td>
                                    <td className="p-4 text-sm text-ink font-semibold max-w-[180px] truncate whitespace-nowrap">{o.customer_name}</td>
                                    <td className="p-4 text-sm text-ink-secondary whitespace-nowrap">{stage}</td>
                                    <td className="p-4 text-sm text-ink-secondary max-w-[240px] truncate whitespace-nowrap" title={o.delivery_address || ''}>{o.delivery_address || 'No address'}{o.payment_method === 'cod' && o.payment_status === 'unpaid' ? ' · COD' : ''}</td>
                                    <td className="p-4 text-sm whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5"><StatusPill status={o.order_status} />{o.delivery_status && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${D_TONE[o.delivery_status]}`}>{D_LABEL[o.delivery_status]}</span>}</span>
                                    </td>
                                    <td className="p-4 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        {stage === 'Needs a rider' && can.manage ? (
                                            <span className="inline-flex items-center gap-2">
                                                <select aria-label="Choose rider" className="h-9 rounded-[12px] border border-line bg-surface px-2 text-sm" value={pick[o.order_id] || ''} onChange={(e) => setPick({ ...pick, [o.order_id]: e.target.value })}>
                                                    <option value="">Choose rider</option>
                                                    {riders.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.active})</option>)}
                                                </select>
                                                <button type="button" disabled={!pick[o.order_id]} className="h-9 rounded-[12px] bg-brand-600 px-3 text-sm font-semibold text-white disabled:opacity-50" onClick={() => assign(o.order_id)}>{o.delivery_id ? 'Reassign' : 'Assign'}</button>
                                                {o.delivery_status === 'failed' && <button type="button" className="h-9 rounded-[12px] border border-line px-3 text-sm font-semibold" onClick={() => post(`${base}/deliveries/${o.delivery_id}/returned`)}>Goods are back</button>}
                                            </span>
                                        ) : stage === 'With riders' ? (
                                            <span className="inline-flex items-center gap-2">
                                                <span>Rider: <b>{o.rider_name}</b></span>
                                                {can.manage && o.delivery_status !== 'out_for_delivery' && (
                                                    <>
                                                        <select aria-label="Change rider" className="h-9 rounded-[12px] border border-line bg-surface px-2 text-sm" value={pick[o.order_id] || ''} onChange={(e) => setPick({ ...pick, [o.order_id]: e.target.value })}>
                                                            <option value="">Change rider…</option>
                                                            {riders.filter((r) => r.id !== o.rider_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                        </select>
                                                        <button type="button" disabled={!pick[o.order_id]} className="h-9 rounded-[12px] border border-line px-3 text-sm font-semibold disabled:opacity-50" onClick={() => assign(o.order_id)}>Reassign</button>
                                                    </>
                                                )}
                                            </span>
                                        ) : stage === 'Delivered' ? (
                                            <span className="inline-flex items-center gap-2">
                                                <span>Rider: <b>{o.rider_name}</b>{Number(o.cash_expected) > 0 ? ` · Cash ${money(o.cash_collected ?? 0, o.currency_symbol)}/${money(o.cash_expected, o.currency_symbol)}${o.cash_acknowledged_at ? ' · received' : ' · with rider'}` : ''}</span>
                                                {can.cash && Number(o.cash_expected) > 0 && !o.cash_acknowledged_at && (
                                                    <button type="button" className="h-9 rounded-[12px] bg-emerald-600 px-3 text-sm font-semibold text-white" onClick={() => post(`${base}/deliveries/${o.delivery_id}/ack-cash`)}>Cash received</button>
                                                )}
                                                {o.order_status !== 'completed' && <Link href={o.order_url} className="font-semibold text-brand-700 underline">Complete the order</Link>}
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-ink tabular-nums text-right whitespace-nowrap">{money(o.total, o.currency_symbol)}</td>
                                    <td className="p-4 w-8"><ChevronRight size={16} className="text-ink-muted" aria-hidden="true" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
</div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
