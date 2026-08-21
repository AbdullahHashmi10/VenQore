import React, { useState, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import { usePage, Head, Link, useForm, router } from '@inertiajs/react';
import {
    Package,
    Search,
    Calendar,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Download,
    Printer,
    ChevronUp,
    ChevronDown,
    Clock
} from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function BatchTracking({ batches, stats, filters }) {
    const { store } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'batch', direction: 'asc' });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('store.batches.index', { store_slug: store.slug }), { search: searchTerm }, { preserveState: true });
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        // Client-side filtering for now
    };

    // Client-side filtering
    const filteredBatches = useMemo(() => {
        if (!batches?.data) return [];
        let result = [...batches.data];

        if (statusFilter === 'expired') {
            result = result.filter(b => new Date(b.expiry_date) < new Date());
        } else if (statusFilter === 'expiring') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            result = result.filter(b => {
                const expDate = new Date(b.expiry_date);
                return expDate >= new Date() && expDate <= thirtyDaysFromNow;
            });
        } else if (statusFilter === 'valid') {
            result = result.filter(b => new Date(b.expiry_date) >= new Date());
        }

        return result;
    }, [batches?.data, statusFilter]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-brand-500" />
            : <ChevronDown size={14} className="text-brand-500" />;
    };

    return (
        <OneGlanceLayout title="Batch Tracking" activeMenu="Stock">
            <Head title="Batch Tracking" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="batch" />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Batches</p>
                        </div>
                        <p className="text-lg font-bold text-ink">{stats?.total_batches || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Expiring Soon</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{stats?.expiring_soon || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Expired</p>
                        </div>
                        <p className="text-lg font-bold text-rose-600">{stats?.expired || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Qty</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{Number(stats?.total_quantity || 0).toLocaleString()}</p>
                    </div>
                </div>

                {/* Header Bar - Title + Filter Pills + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Batch <span className="text-brand-600">Tracking</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        <button
                            onClick={() => handleStatusFilter('all')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'all'
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >All</button>
                        <button
                            onClick={() => handleStatusFilter('valid')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'valid'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg '
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Valid</button>
                        <button
                            onClick={() => handleStatusFilter('expiring')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'expiring'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg '
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Expiring Soon</button>
                        <button
                            onClick={() => handleStatusFilter('expired')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'expired'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg '
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Expired</button>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search batches..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-44"
                            />
                        </form>
                        <div className="flex items-center gap-0.5 border-l border-line pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th
                                    onClick={() => handleSort('batch')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Batch # <SortIcon columnKey="batch" />
                                    </div>
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Product
                                </th>
                                <th
                                    onClick={() => handleSort('quantity')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover text-right"
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Quantity <SortIcon columnKey="quantity" />
                                    </div>
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Mfg Date
                                </th>
                                <th
                                    onClick={() => handleSort('expiry')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Exp Date <SortIcon columnKey="expiry" />
                                    </div>
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filteredBatches.length > 0 ? (
                                filteredBatches.map((batch) => {
                                    const expDate = new Date(batch.expiry_date);
                                    const now = new Date();
                                    const thirtyDays = new Date();
                                    thirtyDays.setDate(thirtyDays.getDate() + 30);

                                    const isExpired = expDate < now;
                                    const isExpiring = !isExpired && expDate <= thirtyDays;

                                    return (
                                        <tr
                                            key={batch.id}
                                            className={`
                                                hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all
                                                ${isExpired ? 'bg-red-50/30 dark:bg-red-900/5 border-l-4 border-red-500' :
                                                    isExpiring ? 'bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-amber-500' :
                                                        'border-l-4 border-transparent'}
`}
                                        >
                                            <td className="p-3">
                                                <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                                                    {batch.batch_number}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium text-sm text-ink">{batch.product?.name}</p>
                                                    <p className="text-2xs text-ink-muted font-mono">{batch.product?.code || batch.product?.sku}</p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-bold text-sm text-ink">
                                                    {Number(batch.current_quantity).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-ink-muted">
                                                {batch.manufacturing_date || '-'}
                                            </td>
                                            <td className={`p-3 text-sm font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-ink-muted'}`}>
                                                {batch.expiry_date || '-'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {isExpired ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                        <XCircle size={10} /> Expired
                                                    </span>
                                                ) : isExpiring ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                        <Clock size={10} /> Expiring
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle size={10} /> Valid
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                <Package size={28} className="text-ink-muted" />
                                            </div>
                                            <p className="text-base font-bold text-ink-secondary mb-1">No batches found</p>
                                            <p className="text-sm text-ink-muted">No batch records match your search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Compact */}
                {batches?.links && batches.links.length > 3 && (
                    <div className="shrink-0 bg-surface rounded-xl border border-line shadow-sm px-3 py-2">
                        <Pagination links={batches.links} />
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
