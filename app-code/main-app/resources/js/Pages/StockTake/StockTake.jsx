import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import React, { useState, useMemo } from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import StockModuleTabs, { useStockNavGroups, ListFilterSelect } from '@/Components/StockModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
import {
    ClipboardCheck,
    Search,
    Plus,
    Download,
    Eye,
    CheckCircle,
    AlertTriangle,
    Package,
    Warehouse,
    Calendar,
    ArrowUpDown,
    Save,
    Printer,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

export default function StockTakeIndex({ stockTakes = [], warehouses = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [warehouseFilter, setWarehouseFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const { showConfirm } = useAlert();
    const { store } = usePage().props;
    const navGroups = useStockNavGroups();

    // Filter stock takes
    const filteredStockTakes = useMemo(() => {
        let result = stockTakes.filter(item => {
            const matchesSearch = !searchTerm ||
                item.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesWarehouse = warehouseFilter === 'all' || item.warehouse_id === parseInt(warehouseFilter);

            return matchesSearch && matchesStatus && matchesWarehouse;
        });

        // Apply sorting
        result.sort((a, b) => {
            let valA, valB;
            switch (sortConfig.key) {
                case 'reference':
                    valA = a.reference_number || '';
                    valB = b.reference_number || '';
                    break;
                case 'date':
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
                    break;
                case 'items':
                    valA = a.items_counted || 0;
                    valB = b.items_counted || 0;
                    break;
                default:
                    valA = a[sortConfig.key];
                    valB = b[sortConfig.key];
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [stockTakes, searchTerm, statusFilter, warehouseFilter, sortConfig]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: stockTakes.length,
            inProgress: stockTakes.filter(s => s.status === 'in_progress').length,
            completed: stockTakes.filter(s => s.status === 'completed').length,
            withVariance: stockTakes.filter(s => s.has_variance || s.variance_items > 0).length
        };
    }, [stockTakes]);

    const getStatusBadge = (status) => {
        const styles = {
            draft: { bg: 'bg-sunken', text: 'text-ink-secondary' },
            in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
            completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
            cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
        };
        return styles[status] || styles.draft;
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
            ? <ChevronUp size={14} className="text-emerald-500" />
            : <ChevronDown size={14} className="text-emerald-500" />;
    };

    return (
        <OneGlanceLayout title="Stock Take / Audit" activeMenu="Stock" noPadding>
            <Head title="Stock Take" />

            <ListPageFrame className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <ListToolbar
                    title="Stock Audit"
                    navGroups={navGroups}
                    activeId="audit"
                    left={
                        <>
                            <ListFilterSelect
                                value={statusFilter}
                                onChange={setStatusFilter}
                                ariaLabel="Status"
                                options={[{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]}
                            />
                            {warehouses.length > 0 && (
                                <ListFilterSelect
                                    value={warehouseFilter}
                                    onChange={setWarehouseFilter}
                                    ariaLabel="Warehouse"
                                    options={[{ value: 'all', label: 'All Warehouses' }, ...warehouses.map((wh) => ({ value: String(wh.id), label: wh.name }))]}
                                />
                            )}
                        </>
                    }
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search audits...' }}
                    actions={
                        <>
                            <button style={canExportCsv() ? undefined : { display: 'none' }} className="h-10 w-10 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-[12px] text-emerald-600" title="Export" onClick={() => exportRowsToCsv('stock-takes', [{label:'Reference',get:r=>r.reference_number||`ST-${r.id}`},{label:'Warehouse',get:r=>r.warehouse?.name||'All Warehouses'},{label:'Date',get:r=>r.created_at},{label:'Items Counted',get:r=>r.items_counted||0},{label:'Variance Items',get:r=>r.variance_items||0},{label:'Status',get:r=>r.status}], filteredStockTakes)}>
                                <Download size={16} />
                            </button>
                            <button onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center hover:bg-interactive-hover rounded-[12px] text-ink-muted hover:text-ink transition-colors" title="Print">
                                <Printer size={16} />
                            </button>
                            <ListAddButton icon={Plus} href={route('store.stock-takes.create', { store_slug: store.slug })}>New Stock Take</ListAddButton>
                        </>
                    }
                />
                <ListStatCards cards={[
                    { label: 'Total Audits', value: stats.total, icon: ClipboardCheck, icon_tone: 'bg-sunken text-ink-secondary' },
                    { label: 'In Progress', value: stats.inProgress, icon: ArrowUpDown, icon_tone: 'bg-blue-50 text-blue-600', value_tone: 'text-blue-600' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'With Variance', value: stats.withVariance, icon: AlertTriangle, icon_tone: 'bg-amber-50 text-amber-600', value_tone: 'text-amber-600' },
                ]} />

                {/* Stats Row - Compact Single Line */}
<MobileListHeader
                    title="Stock Audit"
                    navGroups={navGroups}
                    activeId="audit"
                    filter={{
                        active: statusFilter !== 'all' || (warehouses.length > 0 && warehouseFilter !== 'all'),
                        sections: [
                            { label: 'Status', value: statusFilter, options: [{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }], onSelect: setStatusFilter },
                            ...(warehouses.length > 0 ? [{ label: 'Warehouse', value: warehouseFilter, options: [{ value: 'all', label: 'All Warehouses' }, ...warehouses.map((wh) => ({ value: String(wh.id), label: wh.name }))], onSelect: setWarehouseFilter }] : []),
                        ],
                    }}
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search audits...' }}
                    actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
                    add={{ href: route('store.stock-takes.create', { store_slug: store.slug }), label: 'New Stock Take' }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Audits', value: stats.total, tone: 'ink', icon: ClipboardCheck },
                    { label: 'In Progress', value: stats.inProgress, tone: 'blue', icon: ArrowUpDown },
                    { label: 'Completed', value: stats.completed, tone: 'emerald', icon: CheckCircle },
                    { label: 'With Variance', value: stats.withVariance, tone: 'amber', icon: AlertTriangle },
                ]} />

                {/* Header Bar - Title + Filter Pills + Search */}

                {/* Main Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th
                                    onClick={() => handleSort('reference')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Reference # <SortIcon columnKey="reference" />
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Warehouse
                                </th>
                                <th
                                    onClick={() => handleSort('date')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Date <SortIcon columnKey="date" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('items')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Items <SortIcon columnKey="items" />
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
                                    Variance
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Counted By
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
                                    Status
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filteredStockTakes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-5 sm:p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                <ClipboardCheck size={28} className="text-ink-muted" />
                                            </div>
                                            <p className="text-base font-bold text-ink-secondary mb-1">No stock takes found</p>
                                            <p className="text-sm text-ink-muted mb-3">Start a new stock take to audit your inventory</p>
                                            <Link
                                                href={route('store.stock-takes.create', { store_slug: store.slug })}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm"
                                            >
                                                <Plus size={16} />
                                                Start Stock Take
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStockTakes.map((stockTake) => {
                                    const statusStyle = getStatusBadge(stockTake.status);
                                    const hasVariance = stockTake.variance_items > 0 || stockTake.has_variance;

                                    return (
                                        <tr
                                            key={stockTake.id}
                                            className={`
                                                hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer
                                                ${stockTake.status === 'in_progress' ? 'border-l-4 border-blue-500' :
                                                    stockTake.status === 'completed' ? 'border-l-4 border-emerald-500' :
                                                        stockTake.status === 'cancelled' ? 'border-l-4 border-red-500' :
                                                            hasVariance ? 'border-l-4 border-amber-500' :
                                                                'border-l-4 border-transparent'}
`}
                                            onClick={() => router.visit(route('store.stock-takes.show', stockTake.id))}
                                        >
                                            <td className="p-3">
                                                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                    {stockTake.reference_number || `ST-${stockTake.id}`}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Warehouse size={14} className="text-ink-muted" />
                                                    <span className="font-medium text-sm text-ink-secondary">
                                                        {stockTake.warehouse?.name || 'All Warehouses'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-ink-secondary">
                                                {new Date(stockTake.created_at).toLocaleDateString('en-PK', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sunken rounded text-xs font-bold">
                                                    <Package size={12} />
                                                    {stockTake.items_counted || 0}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {hasVariance ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-2xs font-bold">
                                                        <AlertTriangle size={10} />
                                                        {stockTake.variance_items || 'Yes'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-2xs font-bold">
                                                        <CheckCircle size={10} />
                                                        None
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-ink-secondary">
                                                {stockTake.user?.name || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {stockTake.status?.replace('_', ' ') || 'draft'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('store.stock-takes.show', stockTake.id)}
                                                        className="p-1.5 text-ink-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    {stockTake.status === 'in_progress' && (
                                                        <Link
                                                            href={route('store.stock-takes.show', stockTake.id)}
                                                            className="p-1.5 text-ink-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                        >
                                                            <Save size={16} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
