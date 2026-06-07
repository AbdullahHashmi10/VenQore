import React, { useState, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import { usePage, Head, Link, useForm, router } from '@inertiajs/react';
import {
    Barcode,
    Search,
    CheckCircle,
    XCircle,
    ShoppingCart,
    CornerDownLeft,
    Clock,
    Download,
    Printer,
    ChevronUp,
    ChevronDown,
    Package
} from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function SerialTracking({ serials, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [sortConfig, setSortConfig] = useState({ key: 'serial', direction: 'asc' });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('store.serials.index', { store_slug: store.slug }), {
            search: searchTerm,
            status: statusFilter === 'all' ? '' : statusFilter
        }, { preserveState: true });
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        router.get(route('store.serials.index', { store_slug: store.slug }), {
            search: searchTerm,
            status: status === 'all' ? '' : status
        }, { preserveState: true, preserveScroll: true });
    };

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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'available':
                return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle, label: 'Available' };
            case 'sold':
                return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: ShoppingCart, label: 'Sold' };
            case 'returned':
                return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: CornerDownLeft, label: 'Returned' };
            default:
                return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', icon: Clock, label: status };
        }
    };

    return (
        <OneGlanceLayout title="Serial Tracking" activeMenu="Stock">
            <Head title="Serial Tracking" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="serial" />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Barcode size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Serials</p>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{stats?.total_serials || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">In Stock</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{stats?.in_stock || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ShoppingCart size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Sold</p>
                        </div>
                        <p className="text-lg font-black text-blue-600">{stats?.sold || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <CornerDownLeft size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Returned</p>
                        </div>
                        <p className="text-lg font-black text-amber-600">{stats?.returned || 0}</p>
                    </div>
                </div>

                {/* Header Bar - Title + Filter Pills + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Serial <span className="text-indigo-600">Tracking</span>
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
                            onClick={() => handleStatusFilter('available')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'available'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Available</button>
                        <button
                            onClick={() => handleStatusFilter('sold')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'sold'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Sold</button>
                        <button
                            onClick={() => handleStatusFilter('returned')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'returned'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Returned</button>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search serials..."
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
                                    onClick={() => handleSort('serial')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-1">
                                        Serial # <SortIcon columnKey="serial" />
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    Status
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Location
                                </th>
                                <th
                                    onClick={() => handleSort('date')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-1">
                                        Created <SortIcon columnKey="date" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {serials?.data?.length > 0 ? (
                                serials.data.map((serial) => {
                                    const statusStyle = getStatusStyle(serial.status);
                                    const StatusIcon = statusStyle.icon;

                                    return (
                                        <tr
                                            key={serial.id}
                                            className={`
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all
                                                ${serial.status === 'available' ? 'border-l-4 border-emerald-500' :
                                                    serial.status === 'sold' ? 'border-l-4 border-blue-500' :
                                                        serial.status === 'returned' ? 'border-l-4 border-amber-500' :
                                                            'border-l-4 border-transparent'}
                                            `}
                                        >
                                            <td className="p-3">
                                                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                                    {serial.serial_number}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-medium text-sm text-slate-800 dark:text-white">{serial.product?.name}</p>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                    <StatusIcon size={10} />
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-slate-500">
                                                {serial.warehouse?.name || '-'}
                                            </td>
                                            <td className="p-3 text-sm text-slate-500">
                                                {new Date(serial.created_at).toLocaleDateString('en-PK', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                <Barcode size={28} className="text-slate-400" />
                                            </div>
                                            <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No serials found</p>
                                            <p className="text-sm text-slate-500">No serial numbers match your search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Compact */}
                {serials?.links && serials.links.length > 3 && (
                    <div className="shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-3 py-2">
                        <Pagination links={serials.links} />
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
