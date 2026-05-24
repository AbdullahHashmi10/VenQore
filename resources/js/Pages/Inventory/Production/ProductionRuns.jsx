import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import { formatCurrency as globalFormatCurrency } from '@/Utils/format';

import SmartCombobox from '@/Components/SmartCombobox';
import {
    Factory,
    Plus,
    Play,
    CheckCircle,
    Clock,
    AlertTriangle as AlertTriangleIcon,
    Package,
    Search,
    BarChart3,
    FileSpreadsheet,
    Printer,
    ChevronUp,
    ChevronDown,
    Trash2,
    Eye,
    Edit
} from 'lucide-react';

export default function ProductionRunsIndex({ productionRuns = {}, stats = {}, filters = {} }) {
    const { store } = usePage().props;
    // Infinite Scroll State
    const [allRuns, setAllRuns] = useState(productionRuns.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(productionRuns.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync State
    useEffect(() => {
        if (productionRuns.data && productionRuns.current_page === 1) {
            setAllRuns(productionRuns.data);
            setNextPageUrl(productionRuns.next_page_url);
        }
    }, [productionRuns]);

    const [searchTerm, setSearchTerm] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [activeFilter, setActiveFilter] = useState(typeof filters?.filter === 'string' ? filters.filter : 'all');

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, {
                params: { search: searchTerm, filter: activeFilter },
                headers: { 'Accept': 'application/json' }
            });
            const newItems = response.data.data || [];
            setAllRuns(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data.next_page_url);
        } catch (error) {
            console.error("Failed to load more runs:", error);
        } finally {
            isLoading.current = false;
        }
    }, [nextPageUrl, searchTerm, activeFilter]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) {
                fetchNextPage();
            }
        }, { threshold: 0.1, rootMargin: '800px' });

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
    }, [nextPageUrl, fetchNextPage]);

    // Sort Config
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'run_number', label: 'Run #', width: '10%' },
        { key: 'date', label: 'Date', width: '12%' },
        { key: 'product', label: 'Product', width: '25%' },
        { key: 'quantity', label: 'Quantity', width: '12%' },
        { key: 'status', label: 'Status', width: '12%' },
        { key: 'ingredients', label: 'Ingredients', width: '12%' },
        { key: 'cost', label: 'Total Cost', width: '12%' },
        { key: 'actions', label: 'Actions', width: '5%', frozen: true }
    ]);

    // Formatters

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

    // Server Search Application
    const applyServerFilters = (newParams) => {
        router.get(route('store.production.index', { store_slug: store?.slug }), {
            search: searchTerm,
            filter: activeFilter,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleServerSearch = (item) => {
        const val = item ? (item.run_number || item.product?.name) : searchTerm;
        applyServerFilters({ search: val });
    };

    const applyFilter = (type) => {
        setActiveFilter(type);
        applyServerFilters({ filter: type });
    };

    // Client Side Sorting
    const sortedData = (() => {
        let items = [...allRuns];
        return items.sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Resolve special keys
            if (sortConfig.key === 'product') { valA = a.product?.name; valB = b.product?.name; }
            if (sortConfig.key === 'date') { valA = a.created_at; valB = b.created_at; }
            if (sortConfig.key === 'ingredients') { valA = a.ingredients_used; valB = b.ingredients_used; }

            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
        });
    })();

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Drag & Drop
    const handleDragStart = (e, index) => setDraggedColumn(index);
    const handleDragOver = (e, index) => e.preventDefault();
    const handleDrop = (e, dropIndex) => {
        if (draggedColumn === null) return;
        const newCols = [...tableColumns];
        const draggedItem = newCols[draggedColumn];
        newCols.splice(draggedColumn, 1);
        newCols.splice(dropIndex, 0, draggedItem);
        setTableColumns(newCols);
        setDraggedColumn(null);
    };

    return (
        <OneGlanceLayout title="Production Runs" activeMenu="Stock">
            <Head title="Production Runs" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="production" />


                {/* Stats Cards - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Play size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Active Runs</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.in_progress || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Completed Today</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{stats.completed_today || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Factory size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Runs</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.month_count || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Cost (Month)</p>
                        </div>
                        <p className="text-base font-black text-indigo-600">{formatCurrency(stats.month_cost)}</p>
                    </div>
                </div>

                {/* Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0 flex items-center gap-2">
                            <Factory size={20} className="text-indigo-600" />
                            Production <span className="text-indigo-600">Runs</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => applyFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => applyFilter('today')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Today</button>
                        <button
                            onClick={() => applyFilter('active')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >In Progress</button>
                        <button
                            onClick={() => applyFilter('failed')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'failed' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Failed</button>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-52">
                            <SmartCombobox
                                items={allRuns}
                                value={searchTerm}
                                onQueryChange={handleSearch}
                                onSelect={handleServerSearch}
                                onKeyDown={(e) => e.key === 'Enter' && handleServerSearch()}
                                placeholder="Search run or product..."
                                displayKey="run_number"
                                filterKey="run_number"
                                inputClassName="py-1.5 text-xs h-9"
                            />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link href={route('store.production.create', { store_slug: store?.slug })} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors">
                                <Plus size={14} /> New Run
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                {tableColumns.map((col, index) => (
                                    <th
                                        key={col.key}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                                        className={`
                                            p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                            ${draggedColumn === index ? 'opacity-50 border-2 border-dashed border-indigo-500' : ''}
                                        `}
                                        style={{ width: col.width }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.key !== 'actions' && sortConfig.key === col.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <Factory size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No production runs found</p>
                                            <p className="text-sm text-slate-500 mb-4">Start manufacturing by creating your first production run</p>
                                            <Link
                                                href={route('store.production.create', { store_slug: store?.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> New Production Run
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => router.visit(route('store.production.show', { store_slug: store?.slug, production: row.id }))}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${row.status === 'in_progress' ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}
                                        `}
                                    >
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'run_number':
                                                            return <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.run_number}</span>;
                                                        case 'date':
                                                            return <span className="font-medium">{formatDate(row.created_at)}</span>;
                                                        case 'product':
                                                            return (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                                        <Package size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-800 dark:text-white">{row.product?.name || 'Unknown'}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono">{row.product?.sku}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        case 'quantity':
                                                            return <span className="font-bold">{row.quantity} {row.product?.unit}</span>;
                                                        case 'status':
                                                            const statuses = {
                                                                pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
                                                                in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
                                                                completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
                                                                failed: { label: 'Failed', color: 'bg-red-100 text-red-700' }
                                                            };
                                                            const s = statuses[row.status] || statuses.pending;
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${s.color}`}>{s.label}</span>;
                                                        case 'ingredients':
                                                            return <span className="text-slate-500">{row.ingredients_used || 0} items</span>;
                                                        case 'cost':
                                                            return <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(row.cost)}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Link
                                                                        href={route('store.production.edit', { store_slug: store?.slug, production: row.id })}
                                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <Edit size={16} />
                                                                    </Link>
                                                                </div>
                                                            );
                                                        default: return <span>-</span>;
                                                    }
                                                })()}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                            {/* Infinite Scroll Trigger */}
                            <tr ref={observerTarget} className="h-4">
                                <td colSpan={tableColumns.length} className="text-center p-2">
                                    {isLoading.current && <span className="text-xs text-slate-400">Loading more...</span>}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
