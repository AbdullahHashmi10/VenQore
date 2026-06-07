import React, { useState, useMemo } from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
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
            draft: { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-400' },
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
        <OneGlanceLayout title="Stock Take / Audit" activeMenu="Stock">
            <Head title="Stock Take" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="audit" />

                {/* Stats Row - Compact Single Line */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3 px-3 py-1">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                <ClipboardCheck size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Audits</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-3 px-3 py-1">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ArrowUpDown size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
                                <p className="text-sm font-black text-blue-600">{stats.inProgress}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-3 px-3 py-1">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
                                <p className="text-sm font-black text-emerald-600">{stats.completed}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-3 px-3 py-1">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">With Variance</p>
                                <p className="text-sm font-black text-amber-600">{stats.withVariance}</p>
                            </div>
                        </div>
                    </div>

                    {/* New Audit Button */}
                    <Link
                        href={route('store.stock-takes.create', { store_slug: store.slug })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-bold text-xs shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={14} />
                        New Stock Take
                    </Link>
                </div>

                {/* Header Bar - Title + Filter Pills + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Stock <span className="text-emerald-600">Audit</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'all'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >All</button>
                        <button
                            onClick={() => setStatusFilter('draft')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'draft'
                                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Draft</button>
                        <button
                            onClick={() => setStatusFilter('in_progress')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'in_progress'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >In Progress</button>
                        <button
                            onClick={() => setStatusFilter('completed')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'completed'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Completed</button>
                        <button
                            onClick={() => setStatusFilter('cancelled')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === 'cancelled'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Cancelled</button>

                        {/* Warehouse Filter */}
                        {warehouses.length > 0 && (
                            <>
                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <select
                                    value={warehouseFilter}
                                    onChange={(e) => setWarehouseFilter(e.target.value)}
                                    className="px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="all">All Warehouses</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 outline-none w-44"
                            />
                        </div>
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
                                    onClick={() => handleSort('reference')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-1">
                                        Reference # <SortIcon columnKey="reference" />
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Warehouse
                                </th>
                                <th
                                    onClick={() => handleSort('date')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-1">
                                        Date <SortIcon columnKey="date" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('items')}
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Items <SortIcon columnKey="items" />
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    Variance
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Counted By
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    Status
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStockTakes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                <ClipboardCheck size={28} className="text-slate-400" />
                                            </div>
                                            <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No stock takes found</p>
                                            <p className="text-sm text-slate-500 mb-3">Start a new stock take to audit your inventory</p>
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
                                                    <Warehouse size={14} className="text-slate-400" />
                                                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                        {stockTake.warehouse?.name || 'All Warehouses'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(stockTake.created_at).toLocaleDateString('en-PK', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold">
                                                    <Package size={12} />
                                                    {stockTake.items_counted || 0}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {hasVariance ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] font-bold">
                                                        <AlertTriangle size={10} />
                                                        {stockTake.variance_items || 'Yes'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">
                                                        <CheckCircle size={10} />
                                                        None
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                                                {stockTake.user?.name || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {stockTake.status?.replace('_', ' ') || 'draft'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('store.stock-takes.show', stockTake.id)}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    {stockTake.status === 'in_progress' && (
                                                        <Link
                                                            href={route('store.stock-takes.show', stockTake.id)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
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
            </div>
        </OneGlanceLayout>
    );
}
