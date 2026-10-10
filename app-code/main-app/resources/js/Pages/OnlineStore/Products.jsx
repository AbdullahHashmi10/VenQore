import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Pill, StatCard, inputCls } from '@/Components/Commerce/ui';
import Checkbox from '@/Components/Checkbox';
import PremiumSelect from '@/Components/PremiumSelect';
import { getCurrencySymbol } from '@/Utils/format';
import { money } from '@/lib/commerce';
import { ShieldCheck, Package, Store, Sparkles, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown, Search, ChevronDown, Settings2 } from 'lucide-react';

/** Renders a popup on the page body so no header, clock or assistant bar can sit above it. */
const Overlay = ({ children }) => (typeof document === 'undefined' ? null : createPortal(children, document.body));

const MenuItem = ({ children, onClick, disabled }) => (
    <button type="button" role="menuitem" disabled={disabled} onClick={onClick}
        className="w-full text-left px-3 py-2 text-ink hover:bg-interactive-hover disabled:opacity-40 disabled:cursor-not-allowed">{children}</button>
);

export default function Products({ alt_lang = null, store, products: pageProducts, pagination, filters, skipped, urls, stats = { total: 0, published: 0, backorder: 0 } }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    // Pages are appended as you scroll (infinite scroll); page 1 (new search/sort/filter) replaces the list.
    const [products, setProducts] = useState(pageProducts);
    const [loadingMore, setLoadingMore] = useState(false);
    const [allMatching, setAllMatching] = useState(false);
    const sentinel = useRef(null);
    useEffect(() => {
        setProducts((prev) => {
            if (pagination.current <= 1) return pageProducts;
            const seen = new Set(prev.map((x) => x.id));
            return [...prev, ...pageProducts.filter((x) => !seen.has(x.id))];
        });
        setLoadingMore(false);
    }, [pageProducts]);
    useEffect(() => { setAllMatching(false); }, [filters.q, filters.filter]);
    const hasMore = pagination.current < pagination.last;
    useEffect(() => {
        const el = sentinel.current;
        if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loadingMore) {
                setLoadingMore(true);
                router.get(urls.products, { ...filters, page: pagination.current + 1 }, {
                    preserveScroll: true, preserveState: true, replace: true, only: ['products', 'pagination'],
                    onError: () => setLoadingMore(false),
                });
            }
        }, { rootMargin: '600px' });
        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, loadingMore, pagination.current, filters.q, filters.filter, filters.sort, filters.dir]);

    const sortBy = (key) => router.get(urls.products, { ...filters, sort: key, dir: filters.sort === key && filters.dir === 'asc' ? 'desc' : 'asc', page: 1 }, { preserveScroll: true, preserveState: true });
    const SortTh = ({ k, children, right }) => {
        const on = filters.sort === k;
        const Icon = !on ? ArrowUpDown : filters.dir === 'desc' ? ArrowDown : ArrowUp;
        return (
            <th className={`p-3.5 ${right ? 'text-right' : ''}`} aria-sort={on ? (filters.dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
                <button type="button" onClick={() => sortBy(k)} className={`inline-flex items-center gap-1 font-semibold hover:text-ink ${on ? 'text-ink' : ''}`}>
                    {children}<Icon className={`w-3.5 h-3.5 ${on ? '' : 'opacity-40'}`} aria-hidden="true" />
                </button>
            </th>
        );
    };
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

    const selCount = allMatching ? pagination.total : sel.length;
    const bulk = (action, extra = {}) =>
        router.post(urls.products_bulk, allMatching
            ? { select_all: true, q: filters.q || '', filter: filters.filter || 'all', action, ...extra }
            : { ids: sel, action, ...extra },
        { preserveScroll: true, onStart: () => setMenuOpen(false), onSuccess: () => { setSel([]); setAllMatching(false); setBulkReserveOpen(false); go({ page: 1 }); } });

    const saveEdit = () => {
        router.post(urls.products_bulk, {
            ids: [edit.id],
            action: 'update',
            override_price: edit.override_price === '' ? null : edit.override_price,
            clear_override: edit.override_price === '' || edit.override_price == null,
            public_name: edit.public_name || '',
            public_name_ur: edit.public_name_ur || '',
            diet_tags: edit.diet_tags || [],
            allergens: edit.allergens || '',
            show_online: edit.show_online !== false,
            show_onsite: edit.show_onsite !== false,
            public_description: edit.public_description || '',
            allow_below_cost: !!edit.allow_below_cost,
            sell_without_stock: !!edit.sell_without_stock,
            option_group: edit.option_group || '',
            option_label: edit.option_group ? (edit.option_label || '') : '',
            offline_reserve_qty: edit.offline_reserve === '' ? 0 : edit.offline_reserve,
            online_stock_limit: edit.online_stock_limit === '' ? null : edit.online_stock_limit,
        }, { preserveScroll: true, onSuccess: () => { setEdit(null); go({ page: 1 }); } });
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title="Online products" />
            <div className="flex flex-col min-h-full min-w-0 gap-6">
                <StoreTabs active="products" urls={urls} status={store.status} />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Package} tone="brand" label="Products" hint="in your catalogue" value={stats.total.toLocaleString()} href={urls.products} />
                    <StatCard icon={Store} tone="emerald" label="Live online" hint="customers can order" value={stats.published.toLocaleString()} href={`${urls.products}?filter=published`} valueClass="text-emerald-600" />
                    <StatCard icon={SlidersHorizontal} tone="amber" label="Not published" hint="hidden from the shop" value={Math.max(0, stats.total - stats.published).toLocaleString()} href={`${urls.products}?filter=unpublished`} />
                    <StatCard icon={Sparkles} tone="sky" label="Sell without stock" hint="source on order" value={stats.backorder.toLocaleString()} />
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

                {/* Search, filter and actions */}
                <div className="flex flex-wrap items-center gap-3 bg-surface border border-line rounded-2xl shadow-sm p-3">
                    <form onSubmit={(e) => { e.preventDefault(); go({ q, page: 1 }); }} className="flex gap-2 flex-1 min-w-[220px] max-w-xl">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true" />
                            <input className={`${inputCls} !pl-9`} placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
                        </div>
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

                    <div className="ml-auto flex items-center gap-2">
                        {selCount > 0 && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                                {selCount} selected
                            </span>
                        )}
                        <Button disabled={!selCount} onClick={() => bulk('publish')}>Publish</Button>
                        <div className="relative">
                            <Button variant="secondary" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
                                Actions <ChevronDown size={14} aria-hidden="true" />
                            </Button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div role="menu" className="absolute right-0 mt-2 w-64 z-50 rounded-2xl border border-line bg-surface shadow-lg py-1.5 text-sm max-h-[70vh] overflow-y-auto">
                                        <div className="px-3 pt-1 pb-1 text-3xs font-bold uppercase text-ink-muted">Select</div>
                                        <MenuItem onClick={() => { handleSelectAllToggle(!allSelected); setAllMatching(false); }}>{allSelected ? 'Deselect page' : `Select all on page (${selectableIds.length})`}</MenuItem>
                                        {pagination.total > selectableIds.length && (
                                            <MenuItem onClick={() => { setAllMatching(!allMatching); setSel([]); }}>{allMatching ? 'Clear selection' : `Select all ${pagination.total.toLocaleString()} matching`}</MenuItem>
                                        )}
                                        <div className="my-1 border-t border-line" />
                                        <div className="px-3 pt-1 pb-1 text-3xs font-bold uppercase text-ink-muted">Apply to selected</div>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('publish')}>Publish</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('unpublish')}>Unpublish</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('channels', { sell_without_stock: true })}>Sell without stock</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('channels', { sell_without_stock: false })}>Stop selling without stock</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => { setMenuOpen(false); setBulkReserveOpen(true); }}>Reserve for offline…</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('feature')}>Feature</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('unfeature')}>Unfeature</MenuItem>
                                        <div className="my-1 border-t border-line" />
                                        <div className="px-3 pt-1 pb-1 text-3xs font-bold uppercase text-ink-muted">Where it shows</div>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('channels', { show_online: true, show_onsite: true })}>Show everywhere</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('channels', { show_online: false, show_onsite: true })}>QR menu only</MenuItem>
                                        <MenuItem disabled={!selCount} onClick={() => bulk('channels', { show_online: true, show_onsite: false })}>Online only</MenuItem>
                                    </div>
                                </>
                            )}
                        </div>
                        <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Products page settings" title="Settings"
                            className="h-10 w-10 grid place-items-center rounded-xl border border-line bg-surface text-ink-secondary hover:text-ink hover:bg-interactive-hover">
                            <Settings2 size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {settingsOpen && (
                    <Overlay>
                        <div className="fixed inset-0 z-[200] grid place-items-center p-6 bg-black/40" role="dialog" aria-modal="true" aria-label="Products settings" onClick={() => setSettingsOpen(false)}>
                            <div className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-xl p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-wrap items-center justify-between gap-y-2">
                                    <h2 className="text-base font-bold text-ink">Products settings</h2>
                                    <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink"><X size={18} /></button>
                                </div>
                                <div className="text-sm text-ink-muted flex flex-col gap-2">
                                    <p>Default online price: <strong className="text-ink">{store.pricing_mode === 'same' ? 'Same as regular' : `${store.pricing_mode} ${Number(store.pricing_percent)}%`}</strong>. A fixed online price on a product overrides it.</p>
                                    <p>Store currency: <strong className="text-ink">{sym}</strong></p>
                                    <p>Sorting: <strong className="text-ink">{filters.sort || 'name'} ({filters.dir === 'desc' ? 'Z to A / high to low' : 'A to Z / low to high'})</strong></p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-line">
                                    <Button variant="secondary" onClick={() => { setSettingsOpen(false); go({ sort: 'name', dir: 'asc', page: 1 }); }}>Reset sorting</Button>
                                    {urls.settings && <Button variant="secondary" onClick={() => router.visit(urls.settings)}>Store settings</Button>}
                                    {urls.promotions && <Button variant="secondary" onClick={() => router.visit(urls.promotions)}>Offers</Button>}
                                </div>
                            </div>
                        </div>
                    </Overlay>
                )}

                {/* Mobile Select All & List */}
                <div className="md:hidden flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 p-3 bg-surface border border-line rounded-xl shadow-xs">
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

                            {p.made_to_order ? (
                                <div className="p-2.5 bg-sunken rounded-xl text-center text-xs text-ink-secondary"><b>Not tracked</b> · made to order, always available</div>
                            ) : (
                                <>
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
                                    <div className={`font-bold ${p.online_available != null && Number(p.online_available) <= 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {p.online_available ?? '—'}
                                    </div>
                                </div>
                            </div>
                                </>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1 border-t border-line text-xs">
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
                                <SortTh k="name">Product</SortTh>
                                <SortTh k="price" right>Regular</SortTh>
                                <th className="p-3.5 text-right">Online price</th>
                                <th className="p-3.5 text-right">In Inventory</th>
                                <th className="p-3.5 text-right">Offline Reserve</th>
                                <th className="p-3.5 text-right">Online Available</th>
                                <SortTh k="published">Status</SortTh>
                                <th className="p-3.5 text-right"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-4 sm:p-8 text-center text-ink-muted">
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
                                    {p.made_to_order ? (
                                        <td colSpan={3} className="p-3.5 pt-4 text-center">
                                            <span className="text-xs font-semibold text-ink-secondary">Not tracked</span>
                                            <span className="block text-2xs text-ink-muted">Made to order: always available</span>
                                        </td>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                    {/* Status Column */}
                                    <td className="p-3.5 pt-4">
                                        {p.sell_without_stock && (
                                            <div className="mb-1"><Pill tone="bg-sky-100 text-sky-800">Sells without stock</Pill></div>
                                        )}
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

                <div ref={sentinel} className="py-4 text-center text-xs text-ink-muted" aria-live="polite">
                    {hasMore ? (loadingMore ? 'Loading more products…' : 'Scroll for more') : `Showing all ${products.length} of ${pagination.total} products`}
                </div>

                {/* Bulk Offline Reserve Modal */}
                {bulkReserveOpen && (
                    <Overlay><dialog
                        open
                        className="fixed inset-0 m-0 h-full w-full max-w-none max-h-none bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-inherit"
                        style={{ zIndex: 100000 }}
                        aria-modal="true"
                    >
                        <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-y-2">
                                <div className="flex items-center gap-2">
                                    <Store size={18} className="text-brand-600" />
                                    <h2 className="font-bold text-lg text-ink">Reserve Offline Stock</h2>
                                </div>
                                <button type="button" className="text-ink-muted hover:text-ink" onClick={() => setBulkReserveOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed">
                                Set how many units to keep reserved for walk-in shop customers across the <strong className="text-ink">{selCount} selected products</strong>. Online orders will only be able to purchase remaining inventory.
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
                                    Apply to {selCount} items
                                </Button>
                            </div>
                        </div>
                    </dialog></Overlay>
                )}

                {/* Edit Product Modal */}
                {edit && (
                    <Overlay><dialog
                        open
                        className="fixed inset-0 m-0 h-full w-full max-w-none max-h-none bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-inherit"
                        style={{ zIndex: 100000 }}
                        aria-modal="true"
                        aria-label={`Edit ${edit.name}`}
                    >
                        <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-y-2 pb-2 border-b border-line">
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

                            {/* INVENTORY ALLOCATION & OFFLINE RESERVE SECTION: only for items whose stock is tracked */}
                            {edit.made_to_order ? (
                                <div className="rounded-xl border border-line p-3.5 bg-sunken/40 text-xs text-ink-secondary">
                                    <b className="text-ink">Inventory tracking is off</b> for this item, so it is made to order and always available. There is no stock, reserve or limit to set.
                                </div>
                            ) : (
                                                        <div className="rounded-xl border border-line p-3.5 space-y-3 bg-sunken/40">
                                <div className="flex flex-wrap items-center justify-between gap-y-2">
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
                                <div className="p-2.5 rounded-lg bg-surface border border-line flex flex-wrap items-center justify-between gap-y-2 text-xs">
                                    <span className="text-ink-secondary">Available for online orders:</span>
                                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {Math.max(0, (Number(edit.physical_stock) || 0) - (Number(edit.offline_reserve) || 0))} units
                                    </span>
                                </div>
                            </div>
                            )}

                            <label className="block text-sm font-semibold text-ink">
                                Public name (optional)
                                <input
                                    className={inputCls + ' mt-1'}
                                    value={edit.public_name || ''}
                                    placeholder={edit.name}
                                    onChange={(e) => setEdit({ ...edit, public_name: e.target.value })}
                                />
                            </label>

                            {alt_lang && (
                                <label className="block text-sm font-semibold text-ink">
                                    Name in {alt_lang.label} (optional)
                                    <input
                                        className={inputCls + ' mt-1'}
                                        dir={alt_lang.rtl ? 'rtl' : undefined}
                                        value={edit.public_name_ur || ''}
                                        onChange={(e) => setEdit({ ...edit, public_name_ur: e.target.value })}
                                    />
                                    <span className="mt-1 block text-xs font-normal text-ink-muted">Shown on the QR menu when a guest switches to {alt_lang.label}. Change the language in QR Menu &amp; Catalogue.</span>
                                </label>
                            )}

                            <div className="rounded-xl border border-line p-3 space-y-2">
                                <div className="text-sm font-semibold text-ink">Dietary tags (shown on the QR menu)</div>
                                <div className="flex flex-wrap gap-2">
                                    {[['veg', 'Vegetarian'], ['vegan', 'Vegan'], ['halal', 'Halal'], ['spicy', 'Spicy'], ['gluten_free', 'Gluten free'], ['contains_nuts', 'Contains nuts'], ['contains_dairy', 'Contains dairy']].map(([k, label]) => {
                                        const on = (edit.diet_tags || []).includes(k);
                                        return <button type="button" key={k} aria-pressed={on} onClick={() => setEdit({ ...edit, diet_tags: on ? edit.diet_tags.filter((x) => x !== k) : [...(edit.diet_tags || []), k] })} className={`rounded-full border px-3 py-1 text-xs font-bold ${on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-muted'}`}>{label}</button>;
                                    })}
                                </div>
                                <input className={inputCls} maxLength={190} value={edit.allergens || ''} placeholder="Allergen note, e.g. made with sesame" onChange={(e) => setEdit({ ...edit, allergens: e.target.value })} />
                            </div>

                            <div className="rounded-xl border border-line p-3 space-y-2">
                                <div className="text-sm font-semibold text-ink">Where this item appears</div>
                                <label className="flex items-center gap-2 text-sm text-ink">
                                    <input type="checkbox" checked={edit.show_online !== false} onChange={(e) => setEdit({ ...edit, show_online: e.target.checked })} />
                                    Online store
                                </label>
                                <label className="flex items-center gap-2 text-sm text-ink">
                                    <input type="checkbox" checked={edit.show_onsite !== false} onChange={(e) => setEdit({ ...edit, show_onsite: e.target.checked })} />
                                    QR menu (tables and counter)
                                </label>
                            </div>

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

                            <div className="pt-1">
                                <Checkbox
                                    checked={!!edit.sell_without_stock}
                                    label="Keep selling online even when out of stock (I will source it for the customer)"
                                    onChange={(checked) => setEdit({ ...edit, sell_without_stock: checked })}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-line">
                                <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
                                <Button onClick={saveEdit}>Save changes</Button>
                            </div>
                        </div>
                    </dialog></Overlay>
                )}
            </div>
        </OneGlanceLayout>
    );
}
