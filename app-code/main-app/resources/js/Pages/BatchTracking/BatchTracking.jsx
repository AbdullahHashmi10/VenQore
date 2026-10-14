import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import React, { useState, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs, { useStockNavGroups, ListFilterSelect } from '@/Components/StockModuleTabs';
import MobileStats from '@/Components/MobileStats';
import MobileListHeader from '@/Components/MobileListHeader';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
import { usePage, Head, Link, useForm, router } from '@inertiajs/react';
import { useTermText } from '@/lib/terms';
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
    Clock, Filter } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function BatchTracking({ batches, stats, filters }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const navGroups = useStockNavGroups();
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
        <OneGlanceLayout title="Batch Tracking" activeMenu="Stock" noPadding>
            <Head title="Batch Tracking" />

            <ListPageFrame className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <ListToolbar
                    title="Batch Tracking"
                    navGroups={navGroups}
                    activeId="batch"
                    left={
                        <ListFilterSelect
                            value={statusFilter}
                            onChange={handleStatusFilter}
                            ariaLabel="Status"
                            options={[{ value: 'all', label: 'All batches' }, { value: 'valid', label: 'Valid' }, { value: 'expiring', label: 'Expiring Soon' }, { value: 'expired', label: 'Expired' }]}
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
                                    placeholder="Search batches..."
                                    className="w-full h-10 pl-9 pr-3 text-sm bg-app border border-line rounded-[12px] outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                            </form>
                            <button style={canExportCsv() ? undefined : { display: 'none' }} className="h-10 w-10 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-[12px] text-emerald-600" title="Export" onClick={() => exportRowsToCsv('batches', [{label:'Batch #',get:r=>r.batch_number},{label:'Product',get:r=>r.product?.name},{label:'Quantity',get:r=>r.current_quantity},{label:'Manufactured',get:r=>r.manufacturing_date},{label:'Expiry',get:r=>r.expiry_date}], filteredBatches)}>
                                <Download size={16} />
                            </button>
                            <button onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center hover:bg-interactive-hover rounded-[12px] text-ink-muted hover:text-ink transition-colors" title="Print">
                                <Printer size={16} />
                            </button>
                        </>
                    }
                />
                <ListStatCards cards={[
                    { label: 'Total Batches', value: stats?.total_batches || 0, icon: Package, icon_tone: 'bg-brand-50 text-brand-600' },
                    { label: 'Expiring Soon', value: stats?.expiring_soon || 0, icon: Clock, icon_tone: 'bg-amber-50 text-amber-600', value_tone: 'text-amber-600' },
                    { label: 'Expired', value: stats?.expired || 0, icon: AlertTriangle, icon_tone: 'bg-rose-50 text-rose-600', value_tone: 'text-rose-600' },
                    { label: 'Total Qty', value: Number(stats?.total_quantity || 0).toLocaleString(), icon: Package, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
                ]} />
                <div className="md:hidden"><StockModuleTabs activeTab="batch" /></div>

                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Batch Tracking"
                    filters={[{ key: 'status', icon: Filter, label: 'Batch status', value: statusFilter, onChange: handleStatusFilter, options: [{ id: 'all', label: 'All batches' }, { id: 'valid', label: 'Valid' }, { id: 'expiring', label: 'Expiring Soon' }, { id: 'expired', label: 'Expired' }] }]}
                    search={{ event: true,  value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') handleSearch(e); }, placeholder: 'Search batches...' }}
                    actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
                />
                <MobileStats bp="md" hero={1} items={[
                    { label: 'Total Batches', value: stats?.total_batches || 0, tone: 'brand', icon: Package },
                    { label: 'Expiring Soon', value: stats?.expiring_soon || 0, tone: 'amber', icon: Clock },
                    { label: 'Expired', value: stats?.expired || 0, tone: 'rose', icon: AlertTriangle },
                    { label: 'Total Qty', value: Number(stats?.total_quantity || 0).toLocaleString(), tone: 'emerald', icon: Package }
                ]} />

                {/* Main Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
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
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    {tt('Product')}
                                </th>
                                <th
                                    onClick={() => handleSort('quantity')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover text-right"
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Quantity <SortIcon columnKey="quantity" />
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
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
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
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
                                    <td colSpan={6} className="p-5 sm:p-12">
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
