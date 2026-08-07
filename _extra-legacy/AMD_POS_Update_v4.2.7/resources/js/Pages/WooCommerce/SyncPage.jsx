import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    RefreshCw, CheckCircle, AlertTriangle, Clock, EyeOff, Plus,
    ChevronRight, ArrowUpRight, ArrowDownLeft, Search, Filter,
    Download, Upload, Zap, XCircle, ChevronDown, Package,
    MoreHorizontal, History, Unlink, Link2, Settings,
    ArrowRight, CheckCheck, Globe, ShoppingCart
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig = {
    synced:   { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',  icon: CheckCircle,    label: 'Synced' },
    conflict: { color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',     icon: AlertTriangle,  label: 'Conflict' },
    pending:  { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',           icon: Clock,          label: 'Pending' },
    staged:   { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',        icon: Clock,          label: 'Staged' },
    ignored:  { color: 'text-slate-400 bg-slate-50 dark:bg-slate-800',           icon: EyeOff,         label: 'Ignored' },
};

function StatusBadge({ status }) {
    const cfg  = statusConfig[status] ?? statusConfig.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
            <Icon size={10} />
            {cfg.label}
        </span>
    );
}

// ─── Sync Stats Bar ───────────────────────────────────────────────────────────

function StatsBar({ stats, filter, onFilter }) {
    const tabs = [
        { key: 'all',       label: 'All',       count: null },
        { key: 'synced',    label: 'Synced',    count: stats.synced,    color: 'text-emerald-600' },
        { key: 'conflict',  label: 'Conflicts', count: stats.conflicts, color: 'text-orange-600' },
        { key: 'staged',    label: 'Staged',    count: stats.staged,    color: 'text-amber-600' },
        { key: 'ignored',   label: 'Ignored',   count: stats.ignored,   color: 'text-slate-400' },
    ];

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filter === tab.key
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                        <span className={`text-xs font-bold ${filter === tab.key ? '' : (tab.color ?? '')}`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

// ─── Staged Queue Row ─────────────────────────────────────────────────────────

function StagedQueueRow({ entry, connectionId, storeSlug }) {
    const [acting, setActing] = useState(false);
    const isFromWoo = entry.direction === 'from_woo';

    const handleApprove = () => {
        setActing(true);
        router.post(route('store.woo.connections.approve', { store_slug: storeSlug, connection: connectionId }), {
            queue_ids: [entry.id],
        }, { onFinish: () => setActing(false) });
    };

    const handleIgnore = () => {
        router.post(route('store.woo.connections.ignore', { store_slug: storeSlug, connection: connectionId }), {
            queue_id: entry.id,
        });
    };

    const wooProduct  = isFromWoo ? entry.payload : null;
    const venqoreData = !isFromWoo ? entry.payload : null;

    return (
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            {/* VenQore Side */}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-violet-500" />
                </div>
                {isFromWoo ? (
                    <div className="text-sm text-slate-400 italic">— not in VenQore yet —</div>
                ) : (
                    <div>
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">{venqoreData?.name ?? 'Unknown'}</div>
                        <div className="text-xs text-slate-400 font-mono">SKU: {venqoreData?.sku ?? '—'}</div>
                    </div>
                )}
            </div>

            {/* WooCommerce Side */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart size={14} className="text-blue-500" />
                    </div>
                    {!isFromWoo ? (
                        <div className="text-sm text-slate-400 italic">— not on WooCommerce yet —</div>
                    ) : (
                        <div>
                            <div className="font-semibold text-sm text-slate-800 dark:text-white">{wooProduct?.name ?? 'Unknown'}</div>
                            <div className="text-xs text-slate-400 font-mono">SKU: {wooProduct?.sku ?? '—'}</div>
                            {wooProduct?.regular_price && (
                                <div className="text-xs text-slate-500">${wooProduct.regular_price}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={handleApprove}
                        disabled={acting}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                        {isFromWoo ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {isFromWoo ? 'Pull' : 'Push'}
                    </button>
                    <button
                        onClick={handleIgnore}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Ignore"
                    >
                        <XCircle size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Linked Product Row ───────────────────────────────────────────────────────

function LinkedProductRow({ link, connectionId, storeSlug }) {
    const [expanded, setExpanded]   = useState(false);
    const [acting, setActing]       = useState(false);

    const product = link.product;
    const isConflict = link.sync_status === 'conflict';
    const conflictData = link.conflict_data ?? {};

    const handlePush = () => {
        setActing(true);
        router.post(route('store.woo.connections.push', { store_slug: storeSlug, connection: connectionId }), {
            link_id: link.id,
        }, { onFinish: () => setActing(false) });
    };

    const handlePull = () => {
        setActing(true);
        router.post(route('store.woo.connections.pull', { store_slug: storeSlug, connection: connectionId }), {
            link_id: link.id,
        }, { onFinish: () => setActing(false) });
    };

    const handleResolve = (side) => {
        setActing(true);
        router.post(route('store.woo.connections.resolve', { store_slug: storeSlug, connection: connectionId }), {
            link_id:    link.id,
            resolution: side,
        }, { onFinish: () => setActing(false) });
    };

    const handleIgnore = () => {
        router.post(route('store.woo.connections.ignore', { store_slug: storeSlug, connection: connectionId }), {
            link_id: link.id,
        });
    };

    return (
        <div className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${isConflict ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
            <div className="grid grid-cols-2 gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {/* VenQore side */}
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-violet-500" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-800 dark:text-white truncate">{product?.name ?? '—'}</span>
                            <StatusBadge status={link.sync_status} />
                        </div>
                        <div className="text-xs text-slate-400 font-mono">SKU: {link.sku}</div>
                        {product?.price && (
                            <div className="text-xs text-slate-500 mt-0.5">
                                Price: <span className={isConflict && conflictData?.venqore?.price !== conflictData?.woocommerce?.price ? 'text-orange-600 font-bold' : ''}>${product.price}</span>
                                {product.stock_quantity !== undefined && ` · Stock: ${product.stock_quantity}`}
                            </div>
                        )}
                        {isConflict && conflictData?.venqore && (
                            <button
                                onClick={() => handleResolve('venqore')}
                                disabled={acting}
                                className="mt-1.5 px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                Use VenQore ✓
                            </button>
                        )}
                    </div>
                </div>

                {/* WooCommerce side */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart size={14} className="text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm text-slate-800 dark:text-white truncate">{product?.name ?? '—'}</div>
                            <div className="text-xs text-slate-400">Woo ID: #{link.woo_product_id}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                {link.last_synced_at
                                    ? `Synced: ${new Date(link.last_synced_at).toLocaleDateString()}`
                                    : 'Not yet synced'}
                            </div>
                            {isConflict && conflictData?.woocommerce && (
                                <button
                                    onClick={() => handleResolve('woocommerce')}
                                    disabled={acting}
                                    className="mt-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                    Use WooCommerce ✓
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {!isConflict && (
                            <>
                                <button
                                    onClick={handlePush}
                                    disabled={acting}
                                    title="Push VenQore → WooCommerce"
                                    className="p-1.5 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <ArrowUpRight size={14} />
                                </button>
                                <button
                                    onClick={handlePull}
                                    disabled={acting}
                                    title="Pull WooCommerce → VenQore"
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <ArrowDownLeft size={14} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleIgnore}
                            title="Unlink / Ignore"
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <EyeOff size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SyncPage({
    connection,
    links,
    staged_queue = [],
    stats,
    filter,
    search: initialSearch,
    store_slug,
}) {
    const [search, setSearch]   = useState(initialSearch ?? '');
    const [bulking, setBulking] = useState(false);
    const [scanning, setScanning] = useState(false);
    const { showAlert }         = useAlert();

    const handleFilterChange = (newFilter) => {
        router.get(route('store.woo.connections.sync', { store_slug, connection: connection.id }), {
            filter: newFilter,
            search,
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('store.woo.connections.sync', { store_slug, connection: connection.id }), {
            filter,
            search,
        }, { preserveState: true, replace: true });
    };

    const handleApproveAll = () => {
        setBulking(true);
        router.post(route('store.woo.connections.approve', { store_slug, connection: connection.id }), {
            approve_all: true,
        }, {
            onSuccess: () => showAlert({ title: 'All staged items approved and queued.', type: 'success' }),
            onFinish: () => setBulking(false),
        });
    };

    const statusIcon = connection.status === 'active'
        ? <CheckCircle size={13} className="text-emerald-500" />
        : <AlertTriangle size={13} className="text-amber-500" />;

    const totalStaged = staged_queue.length + (stats.staged ?? 0);

    const handleScan = () => {
        setScanning(true);
        router.post(route('store.woo.connections.scan', { store_slug, connection: connection.id }), {}, {
            onSuccess: () => showAlert({ title: 'Scan complete!', type: 'success' }),
            onFinish: () => setScanning(false)
        });
    };

    return (
        <OneGlanceLayout title="WooCommerce Sync" activeMenu="Marketing">
            <Head title={`Sync — ${connection.name} — VenQore`} />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Link href={route('store.woo.connections.index', { store_slug })} className="hover:text-violet-500">
                                WooCommerce
                            </Link>
                            <ChevronRight size={13} />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{connection.name}</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Sync Page
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                connection.status === 'active'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                            }`}>
                                {statusIcon}
                                {connection.status === 'active' ? 'Connected' : 'Pending'}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {connection.last_synced_at
                                ? `Last sync: ${new Date(connection.last_synced_at).toLocaleString()}`
                                : 'Never synced'
                            }
                            {' · '}Priority: <span className="font-semibold capitalize">{connection.priority_source}</span>
                            {' · '}
                            {connection.site_url ? (
                                <a href={connection.site_url} target="_blank" rel="noreferrer" className="text-violet-500 hover:underline">
                                    {connection.site_url.replace(/^https?:\/\//, '')} ↗
                                </a>
                            ) : (
                                <span className="text-slate-400 italic">Site URL not configured</span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
                            {scanning ? 'Scanning...' : 'Scan & Map Products'}
                        </button>

                        {totalStaged > 0 && (
                            <button
                                onClick={handleApproveAll}
                                disabled={bulking}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                <CheckCheck size={14} />
                                Approve All Staged ({totalStaged})
                            </button>
                        )}
                        <Link
                            href={route('store.woo.connections.setup', { store_slug, connection: connection.id })}
                            className="p-2 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
                        >
                            <Settings size={16} />
                        </Link>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <StatsBar stats={stats} filter={filter ?? 'all'} onFilter={handleFilterChange} />

                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or SKU…"
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 w-56"
                            />
                        </div>
                        <button type="submit" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-200 transition-colors">
                            Go
                        </button>
                    </form>
                </div>

                {/* Staged Queue (new products not yet linked) */}
                {staged_queue.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-amber-600" />
                                <span className="font-bold text-slate-800 dark:text-white text-sm">
                                    Staging Queue — {staged_queue.length} new product{staged_queue.length !== 1 ? 's' : ''} need review
                                </span>
                            </div>
                            <button
                                onClick={handleApproveAll}
                                disabled={bulking}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                <CheckCheck size={12} />
                                Approve All
                            </button>
                        </div>

                        {/* Column Headers */}
                        <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-amber-100/60 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Package size={11} /> VenQore
                            </div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingCart size={11} /> WooCommerce
                            </div>
                        </div>

                        {staged_queue.map(entry => (
                            <StagedQueueRow
                                key={entry.id}
                                entry={entry}
                                connectionId={connection.id}
                                storeSlug={store_slug}
                            />
                        ))}
                    </div>
                )}

                {/* Linked Products Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {/* Column Headers */}
                    <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Package size={11} /> VenQore Product
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingCart size={11} /> WooCommerce Product
                        </div>
                    </div>

                    {links.data?.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <Package size={28} className="mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No products found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
                            {filter !== 'all' && (
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className="mt-2 text-violet-500 text-sm hover:underline"
                                >
                                    Show all
                                </button>
                            )}
                        </div>
                    )}

                    {links.data?.map(link => (
                        <LinkedProductRow
                            key={link.id}
                            link={link}
                            connectionId={connection.id}
                            storeSlug={store_slug}
                        />
                    ))}

                    {/* Pagination */}
                    {links.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-400">
                                Showing {links.from}–{links.to} of {links.total} products
                            </span>
                            <div className="flex items-center gap-2">
                                {links.prev_page_url && (
                                    <Link
                                        href={links.prev_page_url}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                                    >
                                        ← Prev
                                    </Link>
                                )}
                                {links.next_page_url && (
                                    <Link
                                        href={links.next_page_url}
                                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors"
                                    >
                                        Next →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Conflict highlight hint */}
                {stats.conflicts > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                        <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-slate-800 dark:text-white text-sm">
                                {stats.conflicts} product{stats.conflicts !== 1 ? 's' : ''} have conflicts.
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-sm ml-1">
                                Both sides changed since last sync. Choose which version to keep.
                            </span>
                            <button
                                onClick={() => handleFilterChange('conflict')}
                                className="block mt-1.5 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:underline"
                            >
                                Filter to conflicts only →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}

