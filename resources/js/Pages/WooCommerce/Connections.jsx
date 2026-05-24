import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Plus, Trash2, Settings, Zap, Globe, CheckCircle,
    AlertTriangle, Clock, ShoppingCart, ChevronRight,
    ExternalLink, RefreshCw, Package
} from 'lucide-react';

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const cfg = {
        active:  { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle, label: 'Active' },
        pending: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',       icon: Clock,        label: 'Pending' },
        paused:  { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',         icon: AlertTriangle, label: 'Paused' },
    }[status] ?? { color: 'text-slate-400 bg-slate-100', icon: Clock, label: status };

    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
            <Icon size={10} /> {cfg.label}
        </span>
    );
}

// ─── Add Connection Modal ──────────────────────────────────────────────────────

function AddConnectionModal({ storeSlug, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        name:            '',
        priority_source: 'venqore',
        site_url:        '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('store.woo.connections.store', { store_slug: storeSlug }), {
            onSuccess: onClose,
        });
    };

    const handleUrlBlur = () => {
        if (!data.site_url) return;
        let url = data.site_url.trim();
        if (url && !/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            setData('site_url', url);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white">Add WooCommerce Connection</h2>
                        <p className="text-xs text-slate-400 mt-0.5">$10/month per connection, billed to your store.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">×</button>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Connection Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="e.g. My WordPress Store"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            required
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">WordPress Site URL (Optional)</label>
                        <input
                            type="text"
                            value={data.site_url}
                            onChange={e => setData('site_url', e.target.value)}
                            onBlur={handleUrlBlur}
                            placeholder="https://my-wordpress-store.com"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Recommended. Allows triggering instant remote handshakes directly from the POS.</p>
                        {errors.site_url && <p className="text-xs text-red-500 mt-1">{errors.site_url}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Conflict Priority</label>
                        <select
                            value={data.priority_source}
                            onChange={e => setData('priority_source', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="venqore">VenQore wins (recommended)</option>
                            <option value="woocommerce">WooCommerce wins</option>
                            <option value="manual">Manual — review each conflict</option>
                        </select>
                    </div>

                    <div className="pt-2 flex gap-2 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Creating…' : 'Create & Proceed'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Connection Card ───────────────────────────────────────────────────────────

function ConnectionCard({ connection, storeSlug }) {
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('store.woo.connections.destroy', { store_slug: storeSlug, connection: connection.id }), {
            onFinish: () => {
                setDeleting(false);
                setShowConfirm(false);
            },
        });
    };

    const isActive   = connection.status === 'active';
    const synced     = connection.product_links_count ?? 0;
    const staged     = connection.staged_count ?? 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all group relative">
            {/* Custom Premium Deletion Confirmation Overlay */}
            {showConfirm && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200">
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-3 animate-bounce">
                        <AlertTriangle size={20} />
                    </div>
                    <h4 className="text-white font-bold text-sm">Delete Connection?</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[210px] leading-relaxed">
                        This permanently disconnects "{connection.name}" and purges all live sync metadata.
                    </p>
                    <div className="flex items-center gap-2 mt-4 w-full px-2">
                        <button
                            type="button"
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`h-1.5 w-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'bg-amber-400'}`} />

            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                            <ShoppingCart size={18} className={isActive ? 'text-violet-500' : 'text-amber-500'} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{connection.name}</h3>
                            {connection.site_url ? (
                                <a
                                    href={connection.site_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-slate-400 hover:text-violet-500 flex items-center gap-1"
                                >
                                    {connection.site_url.replace(/^https?:\/\//, '')}
                                    <ExternalLink size={10} />
                                </a>
                            ) : (
                                <span className="text-xs text-amber-500 flex items-center gap-1">
                                    <Clock size={10} /> Setup pending
                                </span>
                            )}
                        </div>
                    </div>
                    <StatusBadge status={connection.status} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { label: 'Synced',   value: synced,  color: 'text-emerald-600' },
                        { label: 'Staged',   value: staged,  color: 'text-amber-600' },
                        { label: 'Priority', value: connection.priority_source, color: 'text-violet-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                            <div className={`font-bold text-sm ${stat.color} capitalize`}>{stat.value}</div>
                            <div className="text-xs text-slate-400">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        href={route('store.woo.connections.sync', { store_slug: storeSlug, connection: connection.id })}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                        <Zap size={13} />
                        Sync Page
                    </Link>
                    {connection.status === 'pending' && (
                        <Link
                            href={route('store.woo.connections.setup', { store_slug: storeSlug, connection: connection.id })}
                            className="flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                            Setup
                        </Link>
                    )}
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Connections({ connections = [], store_slug }) {
    const [showAdd, setShowAdd] = useState(false);

    return (
        <OneGlanceLayout title="WooCommerce Sync" activeMenu="Marketing">
            <Head title="WooCommerce Sync — VenQore" />

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ShoppingCart size={22} className="text-violet-500" />
                            WooCommerce Sync
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Bidirectional product sync between VenQore and your WooCommerce stores. $10/month per connection.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Add Connection
                    </button>
                </div>

                {/* Empty State */}
                {connections.length === 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart size={28} className="text-violet-400" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2">No WooCommerce connections yet</h3>
                        <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                            Connect your WooCommerce store to sync products, prices, and stock automatically — in both directions.
                        </p>
                        <button
                            onClick={() => setShowAdd(true)}
                            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                            <Plus size={14} className="inline mr-2" />
                            Add Your First Connection
                        </button>
                    </div>
                )}

                {/* Connection Cards */}
                {connections.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {connections.map(conn => (
                            <ConnectionCard key={conn.id} connection={conn} storeSlug={store_slug} />
                        ))}
                    </div>
                )}

                {/* How it works */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3">How it works</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { step: '1', title: 'Add Connection', desc: 'Create a connection in VenQore and download your customized WordPress plugin.' },
                            { step: '2', title: 'Install & Activate', desc: 'Upload the plugin zip to WordPress. Activation triggers the secure handshake automatically.' },
                            { step: '3', title: 'Synchronize', desc: 'Products, prices, and stock counts sync in real-time between VenQore and WooCommerce.' },
                        ].map(item => (
                            <div key={item.step} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{item.title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAdd && <AddConnectionModal storeSlug={store_slug} onClose={() => setShowAdd(false)} />}
        </OneGlanceLayout>
    );
}
