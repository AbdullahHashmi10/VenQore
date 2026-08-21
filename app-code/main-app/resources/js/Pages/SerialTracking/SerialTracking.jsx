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
    const { store } = usePage().props;
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
            ? <ChevronUp size={14} className="text-brand-500" />
            : <ChevronDown size={14} className="text-brand-500" />;
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
                return { bg: 'bg-sunken', text: 'text-ink-secondary', icon: Clock, label: status };
        }
    };

    return (
        <OneGlanceLayout title="Serial Tracking" activeMenu="Stock">
            <Head title="Serial Tracking" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="serial" />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <Barcode size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Serials</p>
                        </div>
                        <p className="text-lg font-bold text-ink">{stats?.total_serials || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">In Stock</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{stats?.in_stock || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ShoppingCart size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Sold</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">{stats?.sold || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <CornerDownLeft size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Returned</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{stats?.returned || 0}</p>
                    </div>
                </div>

                {/* Header Bar - Title + Filter Pills + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Serial <span className="text-brand-600">Tracking</span>
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
                            onClick={() => handleStatusFilter('available')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'available'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg '
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Available</button>
                        <button
                            onClick={() => handleStatusFilter('sold')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'sold'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg '
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Sold</button>
                        <button
                            onClick={() => handleStatusFilter('returned')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'returned'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg '
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Returned</button>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search serials..."
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
                                    onClick={() => handleSort('serial')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Serial # <SortIcon columnKey="serial" />
                                    </div>
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
                                    Status
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Location
                                </th>
                                <th
                                    onClick={() => handleSort('date')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Created <SortIcon columnKey="date" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {serials?.data?.length > 0 ? (
                                serials.data.map((serial) => {
                                    const statusStyle = getStatusStyle(serial.status);
                                    const StatusIcon = statusStyle.icon;

                                    return (
                                        <tr
                                            key={serial.id}
                                            className={`
                                                hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all
                                                ${serial.status === 'available' ? 'border-l-4 border-emerald-500' :
                                                    serial.status === 'sold' ? 'border-l-4 border-blue-500' :
                                                        serial.status === 'returned' ? 'border-l-4 border-amber-500' :
                                                            'border-l-4 border-transparent'}
`}
                                        >
                                            <td className="p-3">
                                                <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                                                    {serial.serial_number}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-medium text-sm text-ink">{serial.product?.name}</p>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                    <StatusIcon size={10} />
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-ink-muted">
                                                {serial.warehouse?.name || '-'}
                                            </td>
                                            <td className="p-3 text-sm text-ink-muted">
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
                                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                <Barcode size={28} className="text-ink-muted" />
                                            </div>
                                            <p className="text-base font-bold text-ink-secondary mb-1">No serials found</p>
                                            <p className="text-sm text-ink-muted">No serial numbers match your search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Compact */}
                {serials?.links && serials.links.length > 3 && (
                    <div className="shrink-0 bg-surface rounded-xl border border-line shadow-sm px-3 py-2">
                        <Pagination links={serials.links} />
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
