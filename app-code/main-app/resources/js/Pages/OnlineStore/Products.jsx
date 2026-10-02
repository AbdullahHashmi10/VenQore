import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, Pager, Pill, inputCls } from '@/Components/Commerce/ui';
import { money } from '@/lib/commerce';

export default function Products({ store, products, pagination, filters, skipped, urls }) {
    const { errors } = usePage().props;
    const sym = store.currency_symbol;
    const [sel, setSel] = useState([]);
    const [q, setQ] = useState(filters.q || '');
    const [edit, setEdit] = useState(null); // product being edited
    const go = (params) => router.get(urls.products, { ...filters, ...params }, { preserveScroll: true, preserveState: true });
    const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const allIds = products.filter((p) => !p.blocked_reason).map((p) => p.id);
    const bulk = (action, extra = {}) => router.post(urls.products_bulk, { ids: sel, action, ...extra }, { preserveScroll: true, onSuccess: () => setSel([]) });

    const saveEdit = () => {
        router.post(urls.products_bulk, {
            ids: [edit.id], action: edit.published ? 'update' : 'update',
            override_price: edit.override_price === '' ? null : edit.override_price, clear_override: edit.override_price === '' || edit.override_price == null,
            public_name: edit.public_name || '', public_description: edit.public_description || '', allow_below_cost: !!edit.allow_below_cost,
        }, { preserveScroll: true, onSuccess: () => setEdit(null) });
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title="Online products" />
            <h1 className="text-2xl font-bold text-ink mb-4">Online Store</h1>
            <StoreTabs active="products" urls={urls} status={store.status} />
            <p className="text-sm text-ink-muted mb-3">
                Default online price: {store.pricing_mode === 'same' ? 'same as regular' : `${store.pricing_mode} ${Number(store.pricing_percent)}%`}. A fixed online price on a product overrides it. Change the default in Store settings.
            </p>
            {errors?.ids && <Alert kind="error">{errors.ids}</Alert>}
            {skipped?.length > 0 && (
                <div className="mb-4"><Alert kind="warn">Not published:
                    <ul className="list-disc ml-5 mt-1">{skipped.map((s, i) => <li key={i}><strong>{s.name || s.id}</strong> — {s.reason}</li>)}</ul>
                </Alert></div>
            )}

            <Card className="mb-4 flex flex-wrap items-center gap-3">
                <form onSubmit={(e) => { e.preventDefault(); go({ q, page: 1 }); }} className="flex gap-2">
                    <input className={inputCls} placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
                    <Button type="submit" variant="secondary" onClick={() => {}}>Search</Button>
                </form>
                <select className={inputCls + ' !w-auto'} value={filters.filter} onChange={(e) => go({ filter: e.target.value, page: 1 })} aria-label="Filter">
                    <option value="all">All products</option><option value="published">Published online</option><option value="unpublished">Not published</option>
                </select>
                <span className="ml-auto flex gap-2">
                    <Button variant="secondary" onClick={() => setSel(sel.length ? [] : allIds)}>{sel.length ? 'Clear selection' : 'Select all publishable'}</Button>
                    <Button disabled={!sel.length} onClick={() => bulk('publish')}>Publish ({sel.length})</Button>
                    <Button variant="secondary" disabled={!sel.length} onClick={() => bulk('unpublish')}>Unpublish</Button>
                </span>
            </Card>

            <div className="overflow-x-auto bg-surface border border-line rounded-2xl">
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-ink-muted border-b border-line">
                        <th className="p-3 w-8"><span className="sr-only">Select</span></th><th className="p-3">Product</th><th className="p-3 text-right">Regular</th>
                        <th className="p-3 text-right">Online price</th><th className="p-3 text-right">Available</th><th className="p-3">Status</th><th className="p-3" />
                    </tr></thead>
                    <tbody>
                        {products.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink-muted">No products match.</td></tr>}
                        {products.map((p) => (
                            <tr key={p.id} className="border-b border-line last:border-0 align-top">
                                <td className="p-3"><input type="checkbox" aria-label={`Select ${p.name}`} disabled={!!p.blocked_reason} checked={sel.includes(p.id)} onChange={() => toggle(p.id)} /></td>
                                <td className="p-3"><div className="font-medium text-ink">{p.name}</div><div className="text-xs text-ink-muted">{p.sku}{!p.has_image && ' · no photo'}</div></td>
                                <td className="p-3 text-right tabular-nums">{money(p.regular_price, sym)}</td>
                                <td className="p-3 text-right tabular-nums">{money(p.online_price, sym)}
                                    <div className="text-xs text-ink-muted">{p.rule === 'fixed_override' ? 'fixed' : p.rule === 'percent' ? 'default rule' : 'regular'}</div>
                                    {p.below_cost && <div className="text-xs text-red-600">below cost{p.allow_below_cost ? ' (allowed)' : ''}</div>}</td>
                                <td className="p-3 text-right tabular-nums">{p.available ?? '—'}</td>
                                <td className="p-3">{p.blocked_reason ? <span title={p.blocked_reason}><Pill tone="bg-neutral-200 text-neutral-700">Unavailable</Pill><div className="text-xs text-ink-muted mt-1 max-w-56">{p.blocked_reason}</div></span> : p.published && p.below_cost && !p.allow_below_cost ? <span><Pill tone="bg-amber-100 text-amber-800">Hidden from customers</Pill><div className="text-xs text-ink-muted mt-1 max-w-56">Priced below cost. Open Edit and approve it, or raise the price.</div></span> : p.published ? <Pill tone="bg-emerald-100 text-emerald-800">Live</Pill> : <Pill>Not published</Pill>}</td>
                                <td className="p-3 text-right">{!p.blocked_reason && <Button variant="ghost" onClick={() => setEdit({ ...p, override_price: p.override_price ?? '' })}>Edit</Button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pager current={pagination.current} last={pagination.last} onGo={(p) => go({ page: p })} />

            {edit && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Edit ${edit.name}`}>
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h2 className="font-bold text-lg">{edit.name}</h2>
                        <label className="block text-sm">Public name (optional)<input className={inputCls} value={edit.public_name || ''} onChange={(e) => setEdit({ ...edit, public_name: e.target.value })} /></label>
                        <label className="block text-sm">Public description (optional)<textarea className={inputCls} rows={3} value={edit.public_description || ''} onChange={(e) => setEdit({ ...edit, public_description: e.target.value })} /></label>
                        <label className="block text-sm">Fixed online price (leave empty to use the default rule)
                            <input type="number" min="0" step="0.01" className={inputCls} value={edit.override_price} onChange={(e) => setEdit({ ...edit, override_price: e.target.value })} /></label>
                        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={!!edit.allow_below_cost} onChange={(e) => setEdit({ ...edit, allow_below_cost: e.target.checked })} />I approve selling this product online below cost</label>
                        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={saveEdit}>Save</Button></div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
