import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import React, { useState, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import StockModuleTabs, { useStockNavGroups, ListFilterSelect } from '@/Components/StockModuleTabs';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
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
import { useTermText } from '@/lib/terms';

export default function SerialTracking({ serials, stats, filters }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const navGroups = useStockNavGroups();
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
        <OneGlanceLayout title="Serial Tracking" activeMenu="Stock" noPadding>
            <Head title="Serial Tracking" />

            <ListPageFrame className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <ListToolbar
                    title="Serial Tracking"
                    navGroups={navGroups}
                    activeId="serial"
                    left={
                        <ListFilterSelect
                            value={statusFilter}
                            onChange={handleStatusFilter}
                            ariaLabel="Status"
                            options={[{ value: 'all', label: 'All serials' }, { value: 'available', label: 'Available' }, { value: 'sold', label: 'Sold' }, { value: 'returned', label: 'Returned' }]}
                        />
                    }
                    actions={
                        <>
                            <form onSubmit={handleSearch} className="relative w-64 lg:w-72">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search serials..."
                                    className="w-full h-10 pl-9 pr-3 text-sm bg-app border border-line rounded-[12px] outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </form>
                            <button style={canExportCsv() ? undefined : { display: 'none' }} className="h-10 w-10 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-[12px] text-emerald-600" title="Export" onClick={() => exportRowsToCsv('serials', [{label:'Serial #',get:r=>r.serial_number},{label:'Product',get:r=>r.product?.name},{label:'Warehouse',get:r=>r.warehouse?.name},{label:'Status',get:r=>r.status},{label:'Created',get:r=>r.created_at}], (serials?.data||[]))}>
                                <Download size={16} />
                            </button>
                            <button onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center hover:bg-interactive-hover rounded-[12px] text-ink-muted hover:text-ink transition-colors" title="Print">
                                <Printer size={16} />
                            </button>
                        </>
                    }
                />
                <ListStatCards cards={[
                    { label: 'Total Serials', value: stats?.total_serials || 0, icon: Barcode, icon_tone: 'bg-brand-50 text-brand-600' },
                    { label: 'In Stock', value: stats?.in_stock || 0, icon: CheckCircle, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'Sold', value: stats?.sold || 0, icon: ShoppingCart, icon_tone: 'bg-blue-50 text-blue-600', value_tone: 'text-blue-600' },
                    { label: 'Returned', value: stats?.returned || 0, icon: CornerDownLeft, icon_tone: 'bg-amber-50 text-amber-600', value_tone: 'text-amber-600' },
                ]} />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <MobileListHeader
                    title="Serial Tracking"
                    navGroups={navGroups}
                    activeId="serial"
                    filter={{
                        active: statusFilter !== 'all',
                        sections: [{ label: 'Status', value: statusFilter, options: [{ value: 'all', label: 'All serials' }, { value: 'available', label: 'Available' }, { value: 'sold', label: 'Sold' }, { value: 'returned', label: 'Returned' }], onSelect: handleStatusFilter }],
                    }}
                    search={{ value: searchTerm, onChange: setSearchTerm, onKeyDown: (e) => { if (e.key === 'Enter') handleSearch(e); }, placeholder: 'Search serials...' }}
                    actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Serials', value: stats?.total_serials || 0, tone: 'brand', icon: Barcode },
                    { label: 'In Stock', value: stats?.in_stock || 0, tone: 'emerald', icon: CheckCircle },
                    { label: 'Sold', value: stats?.sold || 0, tone: 'blue', icon: ShoppingCart },
                    { label: 'Returned', value: stats?.returned || 0, tone: 'amber', icon: CornerDownLeft },
                ]} />

                {/* Header Bar - Title + Filter Pills + Search */}

                {/* Main Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
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
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    {tt('Product')}
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
                                    Status
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
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
                                    <td colSpan={5} className="p-5 sm:p-12">
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
