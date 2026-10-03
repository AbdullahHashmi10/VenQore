import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, Field, Pill, inputCls } from '@/Components/Commerce/ui';

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

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title="Offers and coupons" />
            <h1 className="text-2xl font-bold text-ink mb-4">Online Store</h1>
            <StoreTabs active="promotions" urls={urls} status={store.status} />

            <Card className="space-y-2 mb-4">
                <h2 className="font-semibold">How offers work</h2>
                <ul className="text-sm text-ink-muted list-disc ml-5 space-y-1">
                    <li>Offers take a percentage off your online price for a date range ({store.timezone} time). Customers see the lower price in your catalogue.</li>
                    <li>An offer with a code is a coupon: the customer types it at checkout. A coupon replaces automatic offers for that order.</li>
                    <li>Otherwise each item gets the best automatic offer that applies to it. A category offer wins a tie against a store-wide one.</li>
                    <li>Items are never discounted below cost unless you approved selling them below cost. Existing orders keep the price they were placed at.</li>
                </ul>
            </Card>

            <div className="flex justify-end mb-3"><Button onClick={() => setForm({ ...blank })}>New offer</Button></div>
            {Object.keys(errors || {}).length > 0 && !form && <div className="mb-3"><Alert kind="error">{Object.values(errors)[0]}</Alert></div>}

            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full text-sm">
                    <thead className="text-left text-ink-muted"><tr><th className="p-3">Offer</th><th className="p-3">Discount</th><th className="p-3">When</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                        {promotions.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-muted">No offers yet.</td></tr>}
                        {promotions.map((p) => (
                            <tr key={p.id} className="border-t border-line align-top">
                                <td className="p-3"><div className="font-medium text-ink">{p.name}</div><div className="text-xs text-ink-muted">{p.code ? `Code ${p.code} · used ${p.uses}${p.max_uses ? ` of ${p.max_uses}` : ''}` : 'Automatic'}</div></td>
                                <td className="p-3">{p.kind === 'amount' ? `${store.currency_symbol} ${p.amount} off` : `${p.percent}% off`}<div className="text-xs text-ink-muted">{p.scope === 'category' ? `Category: ${p.category_name || '—'}` : 'Whole store'}{p.min_order > 0 ? ` · min ${store.currency_symbol} ${p.min_order}` : ''}</div></td>
                                <td className="p-3 text-xs text-ink-muted">{fmtLocal(p.starts_at)}<br />to {fmtLocal(p.ends_at)}</td>
                                <td className="p-3"><Pill tone={STATE[p.state][1]}>{STATE[p.state][0]}</Pill></td>
                                <td className="p-3 text-right space-x-3 whitespace-nowrap">
                                    <button type="button" className="underline" onClick={() => setForm({ ...p, code: p.code || '', category_id: p.category_id || '', max_uses: p.max_uses || '', starts_at: p.starts_at || '', ends_at: p.ends_at || '' })}>Edit</button>
                                    <button type="button" className="underline" onClick={() => router.post(urls.toggle.replace('__ID__', p.id), {}, { preserveScroll: true })}>{p.is_active ? 'Switch off' : 'Switch on'}</button>
                                    <button type="button" className="underline text-red-700" onClick={() => { if (window.confirm('Delete this offer? Past orders keep their prices.')) router.delete(urls.destroy.replace('__ID__', p.id), { preserveScroll: true }); }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {form && (
                <dialog open className="fixed inset-0 z-50 m-0 h-full w-full max-w-none max-h-none bg-black/40 flex items-center justify-center p-4 text-inherit" aria-modal="true" aria-label="Offer">
                    <form onSubmit={save} className="bg-surface rounded-2xl p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
                        <h2 className="font-bold text-lg">{form.id ? 'Edit offer' : 'New offer'}</h2>
                        <Field label="Name customers see" error={errors.name}><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Type" error={errors.kind}><select className={inputCls} value={form.kind} onChange={(e) => set('kind', e.target.value)}><option value="percent">Percent off</option><option value="amount">Fixed amount off the order</option></select></Field>
                            {form.kind === 'amount'
                                ? <Field label={`Amount off (${store.currency_symbol})`} error={errors.amount} hint="Shared across the items it applies to."><input type="number" min="1" step="0.01" className={inputCls} value={form.amount} onChange={(e) => set('amount', e.target.value)} required /></Field>
                                : <Field label="Percent off" error={errors.percent}><input type="number" min="1" max="90" step="0.01" className={inputCls} value={form.percent} onChange={(e) => set('percent', e.target.value)} required /></Field>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Coupon code (optional)" error={errors.code} hint="Leave empty for an automatic offer."><input className={inputCls} value={form.code} onChange={(e) => set('code', e.target.value)} maxLength={40} /></Field>
                        </div>
                        <Field label="Applies to" error={errors.category_id}>
                            <select className={inputCls} value={form.scope} onChange={(e) => set('scope', e.target.value)}><option value="store">Whole store</option><option value="category">One category</option></select>
                        </Field>
                        {form.scope === 'category' && (
                            <Field label="Category"><select className={inputCls} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required><option value="">Choose…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={`Starts (${store.timezone})`} error={errors.starts_at}><input type="datetime-local" className={inputCls} value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></Field>
                            <Field label="Ends" error={errors.ends_at}><input type="datetime-local" className={inputCls} value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Minimum order (0 = none)"><input type="number" min="0" step="0.01" className={inputCls} value={form.min_order} onChange={(e) => set('min_order', e.target.value)} /></Field>
                            {form.code && <Field label="Max uses (optional)"><input type="number" min="1" className={inputCls} value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} /></Field>}
                        </div>
                        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button><Button type="submit">Save offer</Button></div>
                    </form>
                </dialog>
            )}
        </OneGlanceLayout>
    );
}
