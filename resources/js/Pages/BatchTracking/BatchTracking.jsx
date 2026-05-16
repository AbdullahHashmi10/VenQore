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
            ? <ChevronUp size={14} className="text-indigo-500" />
            : <ChevronDown size={14} className="text-indigo-500" />;
    };

    return (
        <OneGlanceLayout title="Batch Tracking" activeMenu="Stock">
            <Head title="Batch Tracking" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="batch" />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Batches</p>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{stats?.total_batches || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Expiring Soon</p>
                        </div>
                        <p className="text-lg font-black text-amber-600">{stats?.expiring_soon || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Expired</p>
                        </div>
                        <p className="text-lg font-black text-rose-600">{stats?.expired || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Qty</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{Number(stats?.total_quantity || 0).toLocaleString()}</p>
                    </div>
                </div>

                {/* Header Bar - Title + Filter Pills + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Batch <span className="text-indigo-600">Tracking</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => handleStatusFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >All</button>
                        <button
                            onClick={() => handleStatusFilter('valid')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'valid'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Valid</button>
                        <button
                            onClick={() => handleStatusFilter('expiring')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'expiring'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Expiring Soon</button>
                        <button
                            onClick={() => handleStatusFilter('expired')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'expired'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Expired</button>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search batches..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
                            />
                        </form>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th
                                    onClick={() => handleSort('batch')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-1">
                                        Batch # <SortIcon columnKey="batch" />
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Product
                                </th>
                                <th
                                    onClick={() => handleSort('quantity')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-right"
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Quantity <SortIcon columnKey="quantity" />
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Mfg Date
                                </th>
                                <th
                                    onClick={() => handleSort('expiry')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-1">
                                        Exp Date <SortIcon columnKey="expiry" />
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all
                                                ${isExpired ? 'bg-red-50/30 dark:bg-red-900/5 border-l-4 border-red-500' :
                                                    isExpiring ? 'bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-amber-500' :
                                                        'border-l-4 border-transparent'}
                                            `}
                                        >
                                            <td className="p-3">
                                                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                                    {batch.batch_number}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium text-sm text-slate-800 dark:text-white">{batch.product?.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{batch.product?.code || batch.product?.sku}</p>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-bold text-sm text-slate-800 dark:text-white">
                                                    {Number(batch.current_quantity).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-slate-500">
                                                {batch.manufacturing_date || '-'}
                                            </td>
                                            <td className={`p-3 text-sm font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-slate-500'}`}>
                                                {batch.expiry_date || '-'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {isExpired ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                        <XCircle size={10} /> Expired
                                                    </span>
                                                ) : isExpiring ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                        <Clock size={10} /> Expiring
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
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
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                <Package size={28} className="text-slate-400" />
                                            </div>
                                            <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No batches found</p>
                                            <p className="text-sm text-slate-500">No batch records match your search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Compact */}
                {batches?.links && batches.links.length > 3 && (
                    <div className="shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-3 py-2">
                        <Pagination links={batches.links} />
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
