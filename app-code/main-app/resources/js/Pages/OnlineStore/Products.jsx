import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, Pager, Pill, inputCls } from '@/Components/Commerce/ui';
import Checkbox from '@/Components/Checkbox';
import PremiumSelect from '@/Components/PremiumSelect';
import { getCurrencySymbol } from '@/Utils/format';
import { money } from '@/lib/commerce';
import { ShieldCheck, Package, Store, Sparkles, SlidersHorizontal, X } from 'lucide-react';

export default function Products({ store, products, pagination, filters, skipped, urls }) {
    const { errors, settings } = usePage().props;
    const sym = getCurrencySymbol(settings) || store?.currency_symbol || 'Rs.';
    const [sel, setSel] = useState([]);
    const [q, setQ] = useState(filters.q || '');
    const [edit, setEdit] = useState(null); // product being edited
    const [bulkReserveOpen, setBulkReserveOpen] = useState(false);
    const [bulkReserveQty, setBulkReserveQty] = useState('');

    const go = (params) => router.get(urls.products, { ...filters, ...params }, { preserveScroll: true, preserveState: true });
    const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    const selectableProducts = products.filter((p) => !p.blocked_reason);
    const selectableIds = selectableProducts.map((p) => p.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => sel.includes(id));
    const someSelected = sel.length > 0 && !allSelected;

    const handleSelectAllToggle = (isChecked) => {
        if (isChecked) {
            setSel((prev) => Array.from(new Set([...prev, ...selectableIds])));
        } else {
            setSel((prev) => prev.filter((id) => !selectableIds.includes(id)));
        }
    };

    const bulk = (action, extra = {}) =>
        router.post(urls.products_bulk, { ids: sel, action, ...extra }, { preserveScroll: true, onSuccess: () => { setSel([]); setBulkReserveOpen(false); } });

    const saveEdit = () => {
        router.post(urls.products_bulk, {
            ids: [edit.id],
            action: 'update',
            override_price: edit.override_price === '' ? null : edit.override_price,
            clear_override: edit.override_price === '' || edit.override_price == null,
            public_name: edit.public_name || '',
            public_description: edit.public_description || '',
            allow_below_cost: !!edit.allow_below_cost,
            option_group: edit.option_group || '',
            option_label: edit.option_group ? (edit.option_label || '') : '',
            offline_reserve_qty: edit.offline_reserve === '' ? 0 : edit.offline_reserve,
            online_stock_limit: edit.online_stock_limit === '' ? null : edit.online_stock_limit,
        }, { preserveScroll: true, onSuccess: () => setEdit(null) });
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title="Online products" />
            <div className="flex flex-col min-h-full min-w-0 gap-6">
                <StoreTabs active="products" urls={urls} status={store.status} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-ink-muted">
                    <p>
                        Default online price: <strong className="text-ink">{store.pricing_mode === 'same' ? 'Same as regular' : `${store.pricing_mode} ${Number(store.pricing_percent)}%`}</strong>.
                        A fixed online price on a product overrides it.
                    </p>
                    <div className="text-xs text-ink-secondary bg-surface px-3 py-1.5 rounded-xl border border-line shadow-xs">
                        Store Currency: <strong className="text-ink">{sym}</strong>
                    </div>
                </div>

                {errors?.ids && <Alert kind="error">{errors.ids}</Alert>}
                {skipped?.length > 0 && (
                    <Alert kind="warn">
                        Not published:
                        <ul className="list-disc ml-5 mt-1">
                            {skipped.map((s, i) => (
                                <li key={i}><strong>{s.name || s.id}</strong> — {s.reason}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                {/* Filter and Actions Bar */}
                <Card className="flex flex-wrap items-center gap-3 !py-3">
                    <form onSubmit={(e) => { e.preventDefault(); go({ q, page: 1 }); }} className="flex gap-2 w-full sm:w-auto">
                        <input
                            className={inputCls}
                            placeholder="Search name or SKU"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            aria-label="Search products"
                        />
                        <Button type="submit" variant="secondary" onClick={() => {}}>Search</Button>
                    </form>

                    <div className="w-full sm:w-52">
                        <PremiumSelect
                            options={[
                                { value: 'all', label: 'All products' },
                                { value: 'published', label: 'Published online' },
                                { value: 'unpublished', label: 'Not published' },
                            ]}
                            value={filters.filter || 'all'}
                            onChange={(val) => go({ filter: val, page: 1 })}
                            searchable={false}
                        />
                    </div>

                    <span className="w-full lg:w-auto lg:ml-auto flex flex-wrap items-center gap-2">
                        {sel.length > 0 && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                                {sel.length} selected
                            </span>
                        )}
                        <Button
                            variant="secondary"
                            onClick={() => handleSelectAllToggle(!allSelected)}
                        >
                            {allSelected ? 'Deselect page' : `Select all on page (${selectableIds.length})`}
                        </Button>
                        <Button disabled={!sel.length} onClick={() => bulk('publish')}>
                            Publish ({sel.length})
                        </Button>
                        <Button variant="secondary" disabled={!sel.length} onClick={() => bulk('unpublish')}>
                            Unpublish
                        </Button>
                        <Button variant="secondary" disabled={!sel.length} onClick={() => setBulkReserveOpen(true)}>
                            Reserve for offline…
                        </Button>
                        <Button variant="secondary" disabled={!sel.length} onClick={() => bulk('feature')}>
                            Feature
                        </Button>
                        <Button variant="secondary" disabled={!sel.length} onClick={() => bulk('unfeature')}>
                            Unfeature
                        </Button>
                    </span>
                </Card>

                {/* Mobile Select All & List */}
                <div className="md:hidden flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-surface border border-line rounded-xl shadow-xs">
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            label={`Select all on page (${selectableIds.length})`}
                            onChange={handleSelectAllToggle}
                        />
                        {sel.length > 0 && (
                            <button
                                type="button"
                                className="text-xs font-semibold text-ink-muted hover:text-ink"
                                onClick={() => setSel([])}
                            >
                                Clear ({sel.length})
                            </button>
                        )}
                    </div>

                    {products.length === 0 && (
                        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">
                            No products match.
                        </div>
                    )}

                    {products.map((p) => (
                        <div key={p.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Checkbox
                                        aria-label={`Select ${p.name}`}
                                        disabled={!!p.blocked_reason}
                                        checked={sel.includes(p.id)}
                                        onChange={() => toggle(p.id)}
                                    />
                                </div>
                                {p.image_url ? (
                                    <img src={p.image_url} alt="" loading="lazy" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-sunken shrink-0 grid place-items-center text-ink-muted" aria-hidden="true">
                                        <Package size={20} />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="font-semibold text-ink leading-tight">
                                            {p.name}
                                            {p.featured && <span className="ml-1 text-xs text-amber-700 dark:text-amber-400 font-bold">★</span>}
                                        </div>
                                        <div className="font-bold tabular-nums whitespace-nowrap text-brand-600 dark:text-brand-400">
                                            {money(p.online_price, sym)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-ink-muted mt-0.5">{p.sku}</div>
                                </div>
                            </div>

                            {/* Stock & Availability Breakdown on Mobile */}
                            <div className="grid grid-cols-3 gap-2 p-2.5 bg-sunken rounded-xl text-center text-xs">
                                <div>
                                    <div className="text-3xs uppercase font-bold text-ink-muted">Inventory</div>
                                    <div className="font-semibold text-ink">{p.physical_stock ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="text-3xs uppercase font-bold text-ink-muted">Offline Reserved</div>
                                    <div className="font-semibold text-amber-600 dark:text-amber-400">{p.offline_reserve ?? 0}</div>
                                </div>
                                <div>
                                    <div className="text-3xs uppercase font-bold text-ink-muted">Online Available</div>
                                    <div className={`font-bold ${Number(p.online_available) <= 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {p.online_available ?? '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-line text-xs">
                                <div>
                                    {p.blocked_reason ? (
                                        <Pill tone="bg-sunken text-ink-secondary">Can&apos;t sell online</Pill>
                                    ) : p.published ? (
                                        <Pill tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Live</Pill>
                                    ) : (
                                        <Pill>Not published</Pill>
                                    )}
                                </div>
                                {!p.blocked_reason && (
                                    <Button
                                        variant="secondary"
                                        className="!py-1 !px-3 text-xs font-semibold"
                                        onClick={() => setEdit({ ...p, override_price: p.override_price ?? '' })}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                            {p.blocked_reason && <p className="text-xs text-ink-muted">{p.blocked_reason}</p>}
                        </div>
                    ))}
                </div>

                {/* Desktop Products Table */}
                <div className="hidden md:block overflow-x-auto bg-surface border border-line rounded-2xl shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-ink-muted border-b border-line bg-sunken/40">
                                <th className="p-3.5 w-10 text-center">
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={someSelected}
                                        aria-label="Select all products on page"
                                        title={allSelected ? "Deselect all" : "Select all on page"}
                                        onChange={handleSelectAllToggle}
                                    />
                                </th>
                                <th className="p-3.5">Product</th>
                                <th className="p-3.5 text-right">Regular</th>
                                <th className="p-3.5 text-right">Online price</th>
                                <th className="p-3.5 text-right">In Inventory</th>
                                <th className="p-3.5 text-right">Offline Reserve</th>
                                <th className="p-3.5 text-right">Online Available</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 text-right"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-ink-muted">
                                        No products match the filter or search query.
                                    </td>
                                </tr>
                            )}
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-interactive-hover transition-colors align-top">
                                    <td className="p-3.5 text-center pt-4">
                                        <Checkbox
                                            aria-label={`Select ${p.name}`}
                                            disabled={!!p.blocked_reason}
                                            checked={sel.includes(p.id)}
                                            onChange={() => toggle(p.id)}
                                        />
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-3">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt="" loading="lazy" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-sunken shrink-0 grid place-items-center text-ink-muted" aria-hidden="true">
                                                    <Package size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-ink flex items-center gap-1.5">
                                                    <span>{p.name}</span>
                                                    {p.featured && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Featured in your store catalogue">
                                                            ★ Featured
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-ink-muted">
                                                    {p.sku}{!p.has_image && ' · no photo'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-right tabular-nums pt-4 font-medium text-ink-secondary">
                                        {money(p.regular_price, sym)}
                                    </td>
                                    <td className="p-3.5 text-right tabular-nums pt-4">
                                        <div className="font-semibold text-ink">{money(p.online_price, sym)}</div>
                                        <div className="text-2xs text-ink-muted">
                                            {p.rule === 'fixed_override' ? 'fixed online price' : p.rule === 'percent' ? 'store pricing rule' : 'regular price'}
                                        </div>
                                        {p.below_cost && (
                                            <div className="text-2xs text-red-600 font-semibold">
                                                below cost{p.allow_below_cost ? ' (approved)' : ''}
                                            </div>
                                        )}
                                    </td>
                                    {/* In Inventory Column */}
                                    <td className="p-3.5 text-right tabular-nums pt-4">
                                        {p.physical_stock == null ? (
                                            <span className="text-ink-muted">—</span>
                                        ) : (
                                            <div>
                                                <span className="font-semibold text-ink">{p.physical_stock}</span>
                                                <span className="text-3xs text-ink-muted block">in warehouse</span>
                                            </div>
                                        )}
                                    </td>
                                    {/* Offline Reserve Column */}
                                    <td className="p-3.5 text-right tabular-nums pt-4">
                                        {Number(p.offline_reserve) > 0 ? (
                                            <div>
                                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                    {p.offline_reserve}
                                                </span>
                                                <span className="text-3xs text-ink-muted block">kept for shop</span>
                                            </div>
                                        ) : (
                                            <span className="text-ink-muted">0</span>
                                        )}
                                    </td>
                                    {/* Online Available Column */}
                                    <td className="p-3.5 text-right tabular-nums pt-4">
                                        {p.online_available == null ? (
                                            <span className="text-ink-muted">—</span>
                                        ) : (
                                            <div className="inline-flex flex-col items-end">
                                                <span className={`font-bold ${Number(p.online_available) <= 0 ? 'text-rose-600' : Number(p.online_available) <= 5 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {p.online_available}
                                                </span>
                                                {Number(p.online_available) <= 0 ? (
                                                    <span className="text-2xs font-bold text-rose-600">Sold out online</span>
                                                ) : Number(p.online_available) <= 5 ? (
                                                    <span className="text-2xs font-semibold text-amber-600">Low online stock</span>
                                                ) : (
                                                    <span className="text-3xs text-ink-muted">for online orders</span>
                                                )}
                                                {p.online_stock_limit != null && (
                                                    <span className="text-3xs text-ink-muted">(cap: {p.online_stock_limit})</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {/* Status Column */}
                                    <td className="p-3.5 pt-4">
                                        {p.blocked_reason ? (
                                            <span title={p.blocked_reason}>
                                                <Pill tone="bg-neutral-200 text-neutral-700">Unavailable</Pill>
                                                <div className="text-2xs text-ink-muted mt-1 max-w-44 leading-tight">{p.blocked_reason}</div>
                                            </span>
                                        ) : p.published && p.below_cost && !p.allow_below_cost ? (
                                            <span>
                                                <Pill tone="bg-amber-100 text-amber-800">Hidden from shop</Pill>
                                                <div className="text-2xs text-ink-muted mt-1 max-w-44 leading-tight">Below cost. Approve in Edit or raise price.</div>
                                            </span>
                                        ) : p.published ? (
                                            <Pill tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Live online</Pill>
                                        ) : (
                                            <Pill>Not published</Pill>
                                        )}
                                    </td>
                                    {/* Actions */}
                                    <td className="p-3.5 text-right pt-3.5">
                                        {!p.blocked_reason && (
                                            <Button
                                                variant="secondary"
                                                className="!py-1.5 !px-3 text-xs font-semibold"
                                                onClick={() => setEdit({ ...p, override_price: p.override_price ?? '' })}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pager current={pagination.current} last={pagination.last} onGo={(p) => go({ page: p })} />

                {/* Bulk Offline Reserve Modal */}
                {bulkReserveOpen && (
                    <dialog
                        open
                        className="fixed inset-0 z-50 m-0 h-full w-full max-w-none max-h-none bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-inherit"
                        aria-modal="true"
                    >
                        <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Store size={18} className="text-brand-600" />
                                    <h2 className="font-bold text-lg text-ink">Reserve Offline Stock</h2>
                                </div>
                                <button type="button" className="text-ink-muted hover:text-ink" onClick={() => setBulkReserveOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed">
                                Set how many units to keep reserved for walk-in shop customers across the <strong className="text-ink">{sel.length} selected products</strong>. Online orders will only be able to purchase remaining inventory.
                            </p>
                            <label className="block text-sm font-semibold text-ink">
                                Quantity reserved for offline shop
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className={inputCls + ' mt-1'}
                                    placeholder="e.g. 5"
                                    value={bulkReserveQty}
                                    onChange={(e) => setBulkReserveQty(e.target.value)}
                                    autoFocus
                                />
                                <span className="text-xs text-ink-muted mt-1 block">
                                    Leave at 0 to make all available inventory sellable online.
                                </span>
                            </label>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="secondary" onClick={() => setBulkReserveOpen(false)}>Cancel</Button>
                                <Button onClick={() => bulk('set_reserve', { offline_reserve_qty: bulkReserveQty })}>
                                    Apply to {sel.length} items
                                </Button>
                            </div>
                        </div>
                    </dialog>
                )}

                {/* Edit Product Modal */}
                {edit && (
                    <dialog
                        open
                        className="fixed inset-0 z-50 m-0 h-full w-full max-w-none max-h-none bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-inherit"
                        aria-modal="true"
                        aria-label={`Edit ${edit.name}`}
                    >
                        <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                            <div className="flex items-center justify-between pb-2 border-b border-line">
                                <div>
                                    <h2 className="font-bold text-lg text-ink leading-tight">{edit.name}</h2>
                                    <div className="text-xs text-ink-muted">SKU: {edit.sku}</div>
                                </div>
                                <button type="button" className="text-ink-muted hover:text-ink" onClick={() => setEdit(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Product Image */}
                            <div className="flex items-center gap-3">
                                {edit.image_url ? (
                                    <img src={edit.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-line" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-sunken shrink-0 grid place-items-center text-ink-muted" aria-hidden="true">
                                        <Package size={22} />
                                    </div>
                                )}
                                <div className="text-sm space-y-1">
                                    <div className="font-semibold text-ink">Online photo</div>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        aria-label="Upload online photo"
                                        className="text-xs"
                                        onChange={(e) => {
                                            const f = e.target.files[0];
                                            if (f) router.post(urls.products_photo.replace('__ID__', edit.id), { photo: f }, { forceFormData: true, preserveScroll: true, onSuccess: () => setEdit(null) });
                                        }}
                                    />
                                    {edit.has_custom_image && (
                                        <button
                                            type="button"
                                            className="text-xs text-rose-600 hover:underline block"
                                            onClick={() => router.post(urls.products_photo.replace('__ID__', edit.id), { remove: true }, { preserveScroll: true, onSuccess: () => setEdit(null) })}
                                        >
                                            Remove online photo (use default product photo)
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* INVENTORY ALLOCATION & OFFLINE RESERVE SECTION */}
                            <div className="rounded-xl border border-line p-3.5 space-y-3 bg-sunken/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Store size={16} className="text-brand-600 dark:text-brand-400" />
                                        <span className="text-sm font-bold text-ink">Inventory & Offline Reservation</span>
                                    </div>
                                    <span className="text-xs text-ink-muted">
                                        Warehouse stock: <strong className="text-ink">{edit.physical_stock ?? 0}</strong>
                                    </span>
                                </div>
                                <p className="text-xs text-ink-muted leading-relaxed">
                                    Specify how many units to keep reserved exclusively for your offline shop and walk-in customers.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block text-xs font-semibold text-ink">
                                        Keep reserved for offline shop
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className={inputCls + ' mt-1'}
                                            placeholder="0"
                                            value={edit.offline_reserve ?? ''}
                                            onChange={(e) => setEdit({ ...edit, offline_reserve: e.target.value })}
                                        />
                                        <span className="text-3xs text-ink-muted mt-1 block">Walk-in reservation</span>
                                    </label>
                                    <label className="block text-xs font-semibold text-ink">
                                        Online stock limit (optional)
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className={inputCls + ' mt-1'}
                                            placeholder="No limit"
                                            value={edit.online_stock_limit ?? ''}
                                            onChange={(e) => setEdit({ ...edit, online_stock_limit: e.target.value })}
                                        />
                                        <span className="text-3xs text-ink-muted mt-1 block">Max units published</span>
                                    </label>
                                </div>
                                <div className="p-2.5 rounded-lg bg-surface border border-line flex items-center justify-between text-xs">
                                    <span className="text-ink-secondary">Available for online orders:</span>
                                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {Math.max(0, (Number(edit.physical_stock) || 0) - (Number(edit.offline_reserve) || 0))} units
                                    </span>
                                </div>
                            </div>

                            <label className="block text-sm font-semibold text-ink">
                                Public name (optional)
                                <input
                                    className={inputCls + ' mt-1'}
                                    value={edit.public_name || ''}
                                    placeholder={edit.name}
                                    onChange={(e) => setEdit({ ...edit, public_name: e.target.value })}
                                />
                            </label>

                            <label className="block text-sm font-semibold text-ink">
                                Public description (optional)
                                <textarea
                                    className={inputCls + ' mt-1'}
                                    rows={2}
                                    value={edit.public_description || ''}
                                    onChange={(e) => setEdit({ ...edit, public_description: e.target.value })}
                                />
                            </label>

                            {/* Sizes, Colours & Options */}
                            <div className="rounded-xl border border-line p-3 space-y-2">
                                <div className="text-sm font-semibold text-ink">Sizes, colours and grouped options</div>
                                <p className="text-xs text-ink-muted">
                                    Give each size or colour its own product (its own stock and price), then assign them the same group name.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block text-xs font-medium text-ink">
                                        Group name
                                        <input
                                            className={inputCls + ' mt-1'}
                                            placeholder="e.g. Cotton T-shirt"
                                            maxLength={60}
                                            value={edit.option_group || ''}
                                            onChange={(e) => setEdit({ ...edit, option_group: e.target.value })}
                                        />
                                    </label>
                                    <label className="block text-xs font-medium text-ink">
                                        Option label
                                        <input
                                            className={inputCls + ' mt-1'}
                                            placeholder="e.g. Large / Red"
                                            maxLength={60}
                                            disabled={!edit.option_group}
                                            value={edit.option_label || ''}
                                            onChange={(e) => setEdit({ ...edit, option_label: e.target.value })}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Fixed online price */}
                            <label className="block text-sm font-semibold text-ink">
                                Fixed online price ({sym})
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Leave empty to use store default"
                                    className={inputCls + ' mt-1'}
                                    value={edit.override_price}
                                    onChange={(e) => setEdit({ ...edit, override_price: e.target.value })}
                                />
                                <span className="text-xs text-ink-muted mt-1 block">
                                    Regular price: {money(edit.regular_price, sym)}
                                </span>
                            </label>

                            {/* Below Cost Approval Checkbox (V6 Checkbox) */}
                            <div className="pt-1">
                                <Checkbox
                                    checked={!!edit.allow_below_cost}
                                    label="I approve selling this product online below cost"
                                    onChange={(checked) => setEdit({ ...edit, allow_below_cost: checked })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-line">
                                <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
                                <Button onClick={saveEdit}>Save changes</Button>
                            </div>
                        </div>
                    </dialog>
                )}
            </div>
        </OneGlanceLayout>
    );
}
