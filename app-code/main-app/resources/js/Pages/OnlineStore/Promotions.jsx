import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { BadgePercent, CalendarDays, Info, Pencil, Plus, Power, Ticket, Trash2, Zap } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { ListPageFrame, ListStatCards } from '@/Components/ListShell';
import { Alert, Button, EmptyState, Field, Pill, inputCls } from '@/Components/Commerce/ui';

const STATE = {
    live: ['Live', 'bg-emerald-100 text-emerald-800'], scheduled: ['Scheduled', 'bg-sky-100 text-sky-800'], ended: ['Ended', 'bg-neutral-200 text-neutral-700'],
    off: ['Switched off', 'bg-neutral-200 text-neutral-700'], used_up: ['Fully used', 'bg-amber-100 text-amber-800'],
};
const blank = { id: null, name: '', code: '', kind: 'percent', amount: '', percent: 10, scope: 'store', category_id: '', starts_at: '', ends_at: '', min_order: 0, max_uses: '' };

const fmtLocal = (v) => (v ? v.replace('T', ' ') : 'any time');

export default function Promotions({ store, promotions, categories, urls }) {
    const { errors } = usePage().props;
    const [form, setForm] = useState(null);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const save = (e) => {
        e.preventDefault();
        router.post(urls.save, { ...form, category_id: form.scope === 'category' ? form.category_id : null, max_uses: form.code ? form.max_uses : null }, { preserveScroll: true, onSuccess: () => setForm(null) });
    };

    const count = (st) => promotions.filter((p) => p.state === st).length;
    const cards = [
        { label: 'Offers', value: promotions.length.toLocaleString(), icon: BadgePercent },
        { label: 'Live now', value: count('live').toLocaleString(), icon: Zap, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
        { label: 'Scheduled', value: count('scheduled').toLocaleString(), icon: CalendarDays, icon_tone: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
        { label: 'Ended or off', value: (count('ended') + count('off') + count('used_up')).toLocaleString(), icon: Power, icon_tone: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    ];
    const openEdit = (p) => setForm({ ...p, code: p.code || '', category_id: p.category_id || '', max_uses: p.max_uses || '', starts_at: p.starts_at || '', ends_at: p.ends_at || '' });
    const toggleOffer = (p) => router.post(urls.toggle.replace('__ID__', p.id), {}, { preserveScroll: true });
    const removeOffer = (p) => { if (window.confirm('Delete this offer? Past orders keep their prices.')) router.delete(urls.destroy.replace('__ID__', p.id), { preserveScroll: true }); };
    const discount = (p) => (p.kind === 'amount' ? `${store.currency_symbol} ${Number(p.amount).toLocaleString()}` : `${Number(p.percent)}%`);
    const th = 'p-4 text-xs font-bold text-ink-muted uppercase tracking-wider whitespace-nowrap';
    const ib = 'h-8 w-8 inline-grid place-items-center rounded-[12px] border border-line bg-surface text-ink-secondary hover:text-ink hover:bg-interactive-hover';

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store" noPadding>
            <Head title="Offers and coupons" />
            <ListPageFrame className="flex flex-col min-h-full min-w-0 bg-app p-1.5 gap-1">
            <StoreTabs active="promotions" urls={urls} status={store.status} action={{ label: 'New offer', href: '#', icon: Plus, onClick: (e) => { e.preventDefault(); setForm({ ...blank }); } }} />
            <ListStatCards cards={cards} />

                <details className="group rounded-[14px] border border-line bg-surface px-3 py-2 text-sm shrink-0 shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-ink"><Info size={16} className="text-brand-700" />How offers work<span className="ml-auto text-xs font-normal text-ink-muted group-open:hidden">Show</span></summary>
                    <ul className="mt-2 text-ink-muted list-disc ml-5 space-y-1">
                        <li>An offer takes a percentage or a fixed amount off your online prices for a date range ({store.timezone} time). Customers see the lower price in your catalogue.</li>
                        <li>An offer with a code is a coupon: the customer types it at checkout, and it replaces automatic offers for that order.</li>
                        <li>Otherwise each item gets the best automatic offer that applies. A category offer wins a tie against a store-wide one.</li>
                        <li>Items are never discounted below cost unless you allowed it. Existing orders keep the price they were placed at.</li>
                    </ul>
                </details>

            {Object.keys(errors || {}).length > 0 && !form && <div><Alert kind="error">{Object.values(errors)[0]}</Alert></div>}

            {promotions.length === 0 ? (
                <EmptyState icon={BadgePercent} title="No offers yet" text="Create an automatic sale for a category or the whole store, or a coupon code to share with customers." action={<Button onClick={() => setForm({ ...blank })}><Plus size={16} />Create your first offer</Button>} />
            ) : (
                <div className="flex-1 min-h-0 overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm bg-transparent md:bg-surface">

                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead className="bg-app border-b border-line sticky top-0 z-10">
                            <tr>
                                <th className={th}>Offer</th>
                                <th className={th}>Discount</th>
                                <th className={th}>Code</th>
                                <th className={th}>Applies to</th>
                                <th className={th}>Schedule</th>
                                <th className={`${th} text-right`}>Used</th>
                                <th className={th}>Status</th>
                                <th className="p-4 w-36 text-right"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {promotions.map((p) => (
                                <tr key={p.id} onClick={() => openEdit(p)} className="h-14 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-brand-400">
                                    <td className="p-4 text-sm max-w-0 w-[24%]"><div className="font-semibold text-ink truncate" title={p.name}>{p.name}</div></td>
                                    <td className="p-4 text-sm whitespace-nowrap font-bold text-ink tabular-nums">{discount(p)}<span className="ml-1 text-xs font-normal text-ink-muted">off</span></td>
                                    <td className="p-4 text-sm whitespace-nowrap">
                                        {p.code
                                            ? <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand-400 bg-brand-50 px-2 py-0.5 text-xs font-mono font-bold text-brand-800 dark:bg-brand-900/30 dark:text-brand-200"><Ticket size={12} />{p.code}</span>
                                            : <span className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs font-semibold text-ink-secondary"><Zap size={12} />Automatic</span>}
                                    </td>
                                    <td className="p-4 text-sm max-w-0 w-[20%]"><div className="truncate text-ink-secondary">{p.scope === 'category' ? `Category: ${p.category_name || '—'}` : 'Whole store'}{p.min_order > 0 ? ` · min ${store.currency_symbol} ${p.min_order}` : ''}</div></td>
                                    <td className="p-4 text-sm whitespace-nowrap text-ink-muted">{p.starts_at || p.ends_at ? `${fmtLocal(p.starts_at)} → ${fmtLocal(p.ends_at)}` : 'No end date'}</td>
                                    <td className="p-4 text-sm text-right tabular-nums whitespace-nowrap text-ink-secondary">{p.code ? (p.max_uses ? `${p.uses} / ${p.max_uses}` : p.uses) : '—'}</td>
                                    <td className="p-4 text-sm whitespace-nowrap"><Pill tone={STATE[p.state][1]}>{STATE[p.state][0]}</Pill></td>
                                    <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        <div className="inline-flex items-center gap-2">
                                            <button type="button" className={ib} title="Edit" aria-label={`Edit ${p.name}`} onClick={() => openEdit(p)}><Pencil size={14} aria-hidden="true" /></button>
                                            <button type="button" className={ib} title={p.is_active ? 'Switch off' : 'Switch on'} aria-label={p.is_active ? `Switch off ${p.name}` : `Switch on ${p.name}`} onClick={() => toggleOffer(p)}><Power size={14} aria-hidden="true" /></button>
                                            <button type="button" className={`${ib} !text-red-700`} title="Delete" aria-label={`Delete ${p.name}`} onClick={() => removeOffer(p)}><Trash2 size={14} aria-hidden="true" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <dialog open className="fixed inset-0 z-50 m-0 h-full w-full max-w-none max-h-none bg-black/40 flex items-center justify-center p-4 text-inherit" aria-modal="true" aria-label="Offer">
                    <form onSubmit={save} className="bg-surface rounded-[14px] p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-bold text-lg">{form.id ? 'Edit offer' : 'New offer'}</h2>
                        <Field label="Name customers see" error={errors.name}><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} /></Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Type" error={errors.kind}><select className={inputCls} value={form.kind} onChange={(e) => set('kind', e.target.value)}><option value="percent">Percent off</option><option value="amount">Fixed amount off the order</option></select></Field>
                            {form.kind === 'amount'
                                ? <Field label={`Amount off (${store.currency_symbol})`} error={errors.amount} hint="Shared across the items it applies to."><input type="number" min="1" step="0.01" className={inputCls} value={form.amount} onChange={(e) => set('amount', e.target.value)} required /></Field>
                                : <Field label="Percent off" error={errors.percent}><input type="number" min="1" max="90" step="0.01" className={inputCls} value={form.percent} onChange={(e) => set('percent', e.target.value)} required /></Field>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Coupon code (optional)" error={errors.code} hint="Leave empty for an automatic offer."><input className={inputCls} value={form.code} onChange={(e) => set('code', e.target.value)} maxLength={40} /></Field>
                        </div>
                        <Field label="Applies to" error={errors.category_id}>
                            <select className={inputCls} value={form.scope} onChange={(e) => set('scope', e.target.value)}><option value="store">Whole store</option><option value="category">One category</option></select>
                        </Field>
                        {form.scope === 'category' && (
                            <Field label="Category"><select className={inputCls} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required><option value="">Choose…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <Field label={`Starts (${store.timezone})`} error={errors.starts_at}><input type="datetime-local" className={inputCls} value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></Field>
                            <Field label="Ends" error={errors.ends_at}><input type="datetime-local" className={inputCls} value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Minimum order (0 = none)"><input type="number" min="0" step="0.01" className={inputCls} value={form.min_order} onChange={(e) => set('min_order', e.target.value)} /></Field>
                            {form.code && <Field label="Max uses (optional)"><input type="number" min="1" className={inputCls} value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} /></Field>}
                        </div>
                        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit">Save offer</Button></div>
                    </form>
                </dialog>
            )}
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
