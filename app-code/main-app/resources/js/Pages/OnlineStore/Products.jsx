import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { ListPageFrame, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { Alert, Button, Pill, inputCls } from '@/Components/Commerce/ui';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import Checkbox from '@/Components/Checkbox';
import { getCurrencySymbol } from '@/Utils/format';
import { money } from '@/lib/commerce';
import { ShieldCheck, Package, Store, Sparkles, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Settings2, Pencil } from 'lucide-react';

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
            <th className={`p-4 text-xs font-bold text-ink-muted uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : ''}`} aria-sort={on ? (filters.dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
                <button type="button" onClick={() => sortBy(k)} className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider hover:text-ink ${on ? 'text-ink' : ''}`}>
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

    const filterOptions = [
        { value: 'all', label: 'All products' },
        { value: 'published', label: 'Published online' },
        { value: 'unpublished', label: 'Not published' },
    ];
    const openEdit = (p) => setEdit({ ...p, override_price: p.override_price ?? '' });

    const actionsMenu = (
        <>
            {selCount > 0 && (
                <span className="h-10 inline-flex items-center text-xs font-semibold px-3 rounded-[12px] bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800 whitespace-nowrap">
                    {selCount} selected
                </span>
            )}
            <div className="relative">
                <Button variant="secondary" className="!h-10 !rounded-[12px]" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
                    Actions <ChevronDown size={14} aria-hidden="true" />
                </Button>
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div role="menu" className="absolute right-0 mt-2 w-64 z-50 rounded-[14px] border border-line bg-surface shadow-lg py-1.5 text-sm max-h-[70vh] overflow-y-auto">
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
                className="h-10 w-10 grid place-items-center rounded-[12px] border border-line bg-surface text-ink-secondary hover:text-ink hover:bg-interactive-hover">
                <Settings2 size={18} aria-hidden="true" />
            </button>
        </>
    );

    const th = 'p-4 text-xs font-bold text-ink-muted uppercase tracking-wider whitespace-nowrap';
    const sub = 'text-ink-muted font-normal';

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store" noPadding>
            <Head title="Online products" />
            <ListPageFrame className="flex flex-col gap-6 md:gap-2 min-w-0 bg-app">
                <div className="hidden md:block shrink-0">
                    <StoreTabs
                        active="products"
                        urls={urls}
                        status={store.status}
                        search={{ value: q, onChange: (v) => setQ(v), onKeyDown: (e) => { if (e.key === 'Enter') go({ q, page: 1 }); }, placeholder: 'Search name or SKU' }}
                        left={<ListFilterPill icon={SlidersHorizontal} label="All products" value={filters.filter || 'all'} options={filterOptions} onChange={(val) => go({ filter: val, page: 1 })} />}
                        extraActions={actionsMenu}
                        action={{ label: 'Publish', icon: Store, href: '#', onClick: (e) => { e.preventDefault(); if (selCount) bulk('publish'); } }}
                    />
                </div>
                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Products"
                    activeId="products"
                    navGroups={[{ id: 'store', label: 'Online Store', items: [
                        ['home', 'Overview', urls?.home, Store],
                        ['orders', 'Orders', urls?.orders, Package],
                        ['products', 'Products', urls?.products, Package],
                        ['promotions', 'Offers', urls?.promotions, Sparkles],
                        ['catalogue', 'QR Menu & Catalogue', urls?.catalogue, Package],
                        ['settings', 'Settings', urls?.settings, Settings2],
                    ].filter(([, , href]) => !!href).map(([id, label, href, icon]) => ({ id, label, href, icon })) }]}
                    links={[
                        { label: allSelected ? 'Deselect page' : `Select all on page (${selectableIds.length})`, icon: Package, onClick: () => { handleSelectAllToggle(!allSelected); setAllMatching(false); } },
                        ...(selCount > 0 ? [
                            { label: `Publish (${selCount})`, icon: Store, onClick: () => bulk('publish') },
                            { label: 'Unpublish', icon: X, onClick: () => bulk('unpublish') },
                            { label: 'Sell without stock', icon: Sparkles, onClick: () => bulk('channels', { sell_without_stock: true }) },
                            { label: 'Stop selling without stock', icon: Sparkles, onClick: () => bulk('channels', { sell_without_stock: false }) },
                            { label: 'Reserve for offline…', icon: Package, onClick: () => setBulkReserveOpen(true) },
                            { label: 'Feature', icon: Sparkles, onClick: () => bulk('feature') },
                            { label: 'Unfeature', icon: Sparkles, onClick: () => bulk('unfeature') },
                        ] : []),
                        { label: 'Products settings', icon: Settings2, onClick: () => setSettingsOpen(true) },
                    ]}
                    filter={{
                        active: !!filters.filter && filters.filter !== 'all',
                        sections: [{ label: 'Show', value: filters.filter || 'all', options: [{ value: 'all', label: 'All products' }, { value: 'published', label: 'Published online' }, { value: 'unpublished', label: 'Not published' }], onSelect: (val) => go({ filter: val, page: 1 }) }],
                    }}
                    search={{ value: q, onChange: (v) => setQ(v), onKeyDown: (e) => { if (e.key === 'Enter') go({ q, page: 1 }); }, placeholder: 'Search name or SKU' }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Products', value: stats.total.toLocaleString(), tone: 'brand', icon: Package },
                    { label: 'Live online', value: stats.published.toLocaleString(), tone: 'emerald', icon: Store },
                    { label: 'Not published', value: Math.max(0, stats.total - stats.published).toLocaleString(), tone: 'amber', icon: SlidersHorizontal },
                    { label: 'Sell without stock', value: stats.backorder.toLocaleString(), tone: 'sky', icon: Sparkles },
                ]} />

                <ListStatCards cards={[
                    { label: 'Products', value: stats.total.toLocaleString(), icon: Package, href: `${urls.products}?filter=all` },
                    { label: 'Live online', value: stats.published.toLocaleString(), icon: Store, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600', href: `${urls.products}?filter=published` },
                    { label: 'Not published', value: Math.max(0, stats.total - stats.published).toLocaleString(), icon: SlidersHorizontal, icon_tone: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', href: `${urls.products}?filter=unpublished` },
                    { label: 'Sell without stock', value: stats.backorder.toLocaleString(), icon: Sparkles, icon_tone: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
                ]} />

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

                {settingsOpen && (
                    <Overlay>
                        <div className="fixed inset-0 z-[200] grid place-items-center p-6 bg-black/40" role="dialog" aria-modal="true" aria-label="Products settings" onClick={() => setSettingsOpen(false)}>
                            <div className="w-full max-w-md rounded-[14px] bg-surface border border-line shadow-xl p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
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
                                    {urls.settings && <Button variant="secondary" onClick={() => router.visit(urls.settings)}>Online Store settings</Button>}
                                    {urls.promotions && <Button variant="secondary" onClick={() => router.visit(urls.promotions)}>Offers</Button>}
                                </div>
                            </div>
                        </div>
                    </Overlay>
                )}

                <div className="flex-1 min-h-0 overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm bg-transparent md:bg-surface">
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
                <table className="hidden md:table w-full text-left border-collapse">
                    <thead className="bg-app border-b border-line sticky top-0 z-10">
                        <tr>
                            <th className="p-4 w-12 text-center">
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
                            <th className={`${th} text-right`}>Online price</th>
                            <th className={`${th} text-right`}>In Inventory</th>
                            <th className={`${th} text-right`}>Offline Reserve</th>
                            <th className={`${th} text-right`}>Online Available</th>
                            <SortTh k="published">Status</SortTh>
                            <th className="p-4 w-16 text-right"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {products.length === 0 && (
                            <tr className="h-14">
                                <td colSpan={9} className="p-4 text-sm text-center text-ink-muted">
                                    No products match the filter or search query.
                                </td>
                            </tr>
                        )}
                        {products.map((p) => {
                            const avail = p.online_available == null ? null : Number(p.online_available);
                            return (
                            <tr key={p.id} onClick={() => { if (!p.blocked_reason) openEdit(p); }}
                                className="h-14 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-brand-400">
                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        aria-label={`Select ${p.name}`}
                                        disabled={!!p.blocked_reason}
                                        checked={sel.includes(p.id)}
                                        onChange={() => toggle(p.id)}
                                    />
                                </td>
                                <td className="p-4 text-sm max-w-0 w-[34%]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" loading="lazy" className="h-9 w-9 rounded-[12px] object-cover shrink-0" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-[12px] bg-sunken shrink-0 grid place-items-center text-ink-muted" aria-hidden="true">
                                                <Package size={16} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex items-center gap-2">
                                            <span className="font-medium text-ink truncate" title={p.name}>{p.name}</span>
                                            {p.featured && (
                                                <span className="shrink-0 inline-flex items-center px-1.5 rounded-full text-2xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Featured in your store catalogue">★</span>
                                            )}
                                            <span className="text-xs text-ink-muted truncate shrink-[2]">{p.sku}{!p.has_image && ' · no photo'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-right tabular-nums whitespace-nowrap font-medium text-ink-secondary">
                                    {money(p.regular_price, sym)}
                                </td>
                                <td className="p-4 text-sm text-right tabular-nums whitespace-nowrap" title={p.rule === 'fixed_override' ? 'fixed online price' : p.rule === 'percent' ? 'store pricing rule' : 'regular price'}>
                                    <span className="font-semibold text-ink">{money(p.online_price, sym)}</span>
                                    {p.below_cost && (
                                        <span className="ml-2 text-2xs text-red-600 font-semibold">below cost{p.allow_below_cost ? ' (ok)' : ''}</span>
                                    )}
                                </td>
                                {p.made_to_order ? (
                                    <td colSpan={3} className="p-4 text-sm text-center whitespace-nowrap" title="Made to order: always available">
                                        <span className="text-xs font-semibold text-ink-secondary">Not tracked</span>
                                        <span className={`${sub} text-2xs ml-2`}>made to order</span>
                                    </td>
                                ) : (
                                    <>
                                        <td className="p-4 text-sm text-right tabular-nums whitespace-nowrap">
                                            {p.physical_stock == null ? <span className="text-ink-muted">—</span> : <span className="font-semibold text-ink">{p.physical_stock}</span>}
                                        </td>
                                        <td className="p-4 text-sm text-right tabular-nums whitespace-nowrap">
                                            {Number(p.offline_reserve) > 0
                                                ? <span className="font-semibold text-amber-600 dark:text-amber-400">{p.offline_reserve}</span>
                                                : <span className="text-ink-muted">0</span>}
                                        </td>
                                        <td className="p-4 text-sm text-right tabular-nums whitespace-nowrap" title={p.online_stock_limit != null ? `Cap: ${p.online_stock_limit}` : undefined}>
                                            {avail == null ? (
                                                <span className="text-ink-muted">—</span>
                                            ) : (
                                                <>
                                                    {avail <= 0 && <span className="mr-2 text-2xs font-bold text-rose-600">Sold out</span>}
                                                    {avail > 0 && avail <= 5 && <span className="mr-2 text-2xs font-semibold text-amber-600">Low</span>}
                                                    <span className={`font-bold ${avail <= 0 ? 'text-rose-600' : avail <= 5 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>{p.online_available}</span>
                                                </>
                                            )}
                                        </td>
                                    </>
                                )}
                                <td className="p-4 text-sm whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {p.blocked_reason ? (
                                            <span title={p.blocked_reason}><Pill tone="bg-neutral-200 text-neutral-700">Unavailable</Pill></span>
                                        ) : p.published && p.below_cost && !p.allow_below_cost ? (
                                            <span title="Below cost. Approve in Edit or raise price."><Pill tone="bg-amber-100 text-amber-800">Hidden from shop</Pill></span>
                                        ) : p.published ? (
                                            <Pill tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Live online</Pill>
                                        ) : (
                                            <Pill>Not published</Pill>
                                        )}
                                        {p.sell_without_stock && <Pill tone="bg-sky-100 text-sky-800">No-stock sales</Pill>}
                                    </div>
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    {!p.blocked_reason && (
                                        <button type="button" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} title="Edit"
                                            className="h-8 w-8 inline-grid place-items-center rounded-[12px] border border-line bg-surface text-ink-secondary hover:text-ink hover:bg-interactive-hover">
                                            <Pencil size={14} aria-hidden="true" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div ref={sentinel} className="py-4 text-center text-xs text-ink-muted" aria-live="polite">
                    {hasMore ? (loadingMore ? 'Loading more products…' : 'Scroll for more') : `Showing all ${products.length} of ${pagination.total} products`}
                </div>
                </div>

                {/* Bulk Offline Reserve Modal */}
                {bulkReserveOpen && (
                    <Overlay><dialog
                        open
                        className="fixed inset-0 m-0 h-full w-full max-w-none max-h-none bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 text-inherit"
                        style={{ zIndex: 100000 }}
                        aria-modal="true"
                    >
                        <div className="bg-surface border border-line rounded-[14px] p-6 w-full max-w-md shadow-2xl space-y-4">
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
                        <div className="bg-surface border border-line rounded-[14px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
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
                                    <img src={edit.image_url} alt="" className="w-16 h-16 rounded-[14px] object-cover shrink-0 border border-line" />
                                ) : (
                                    <div className="w-16 h-16 rounded-[14px] bg-sunken shrink-0 grid place-items-center text-ink-muted" aria-hidden="true">
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
                                <div className="rounded-[14px] border border-line p-3.5 bg-sunken/40 text-xs text-ink-secondary">
                                    <b className="text-ink">Inventory tracking is off</b> for this item, so it is made to order and always available. There is no stock, reserve or limit to set.
                                </div>
                            ) : (
                                                        <div className="rounded-[14px] border border-line p-3.5 space-y-3 bg-sunken/40">
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
                                <div className="p-2.5 rounded-[12px] bg-surface border border-line flex flex-wrap items-center justify-between gap-y-2 text-xs">
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

                            <div className="rounded-[14px] border border-line p-3 space-y-2">
                                <div className="text-sm font-semibold text-ink">Dietary tags (shown on the QR menu)</div>
                                <div className="flex flex-wrap gap-2">
                                    {[['veg', 'Vegetarian'], ['vegan', 'Vegan'], ['halal', 'Halal'], ['spicy', 'Spicy'], ['gluten_free', 'Gluten free'], ['contains_nuts', 'Contains nuts'], ['contains_dairy', 'Contains dairy']].map(([k, label]) => {
                                        const on = (edit.diet_tags || []).includes(k);
                                        return <button type="button" key={k} aria-pressed={on} onClick={() => setEdit({ ...edit, diet_tags: on ? edit.diet_tags.filter((x) => x !== k) : [...(edit.diet_tags || []), k] })} className={`rounded-full border px-3 py-1 text-xs font-bold ${on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-muted'}`}>{label}</button>;
                                    })}
                                </div>
                                <input className={inputCls} maxLength={190} value={edit.allergens || ''} placeholder="Allergen note, e.g. made with sesame" onChange={(e) => setEdit({ ...edit, allergens: e.target.value })} />
                            </div>

                            <div className="rounded-[14px] border border-line p-3 space-y-2">
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
                            <div className="rounded-[14px] border border-line p-3 space-y-2">
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
