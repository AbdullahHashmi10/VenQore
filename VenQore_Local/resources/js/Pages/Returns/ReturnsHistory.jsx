import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Plus,
    Search,
    BarChart3,
    FileSpreadsheet,
    Printer,
    MoreVertical,
    Mail,
    MessageCircle,
    Eye,
    RefreshCcw,
    FileText,
    History,
    Trash2,
    Copy,
    X,
    ChevronUp,
    ChevronDown,
    CornerUpRight,
    CheckSquare,
    Clock,
    Package,
    ArrowLeft
} from 'lucide-react';
import SellModuleTabs from '@/Components/SellModuleTabs';
import axios from 'axios';
import PrintService from '@/Utils/PrintService';
import PrintButton from '@/Components/PrintButton';

export default function ReturnsHistory({ returns = {}, filters = {}, stats = {} }) {
    const {
        store
    } = usePage().props;

    // Infinite Scroll State
    const [allReturns, setAllReturns] = useState(returns.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(returns.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync State
    useEffect(() => {
        if (returns.data && returns.current_page === 1) {
            setAllReturns(returns.data);
            setNextPageUrl(returns.next_page_url);
        }
    }, [returns]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllReturns(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data.next_page_url);
        } catch (error) { console.error(error); } finally { isLoading.current = false; }
    }, [nextPageUrl]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
        }, { threshold: 0.1, rootMargin: '800px' });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
    }, [nextPageUrl, fetchNextPage]);

    const [searchTerm, setSearchTerm] = useState(() => (filters && filters.search) ? filters.search : '');
    const [activeFilter, setActiveFilter] = useState(() => (filters && filters.filter) ? filters.filter : 'all');

    const [dateRange, setDateRange] = useState(() => ({
        from: (filters && filters.start_date) ? filters.start_date : '',
        to: (filters && filters.end_date) ? filters.end_date : ''
    }));

    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '12%' },
        { key: 'reference', label: 'Return #', width: '15%' },
        { key: 'customer', label: 'Customer', width: '20%' },
        { key: 'items', label: 'Items', width: '10%' },
        { key: 'amount', label: 'Refund Amount', width: '15%' },
        { key: 'method', label: 'Method', width: '10%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '8%', frozen: true }
    ]);

    // Helper to resolve values for sorting
    const resolveValue = (item, key) => {
        switch (key) {
            case 'date': return item.created_at;
            case 'reference': return item.reference_number;
            case 'customer': return item.customer?.name || 'Walk-in';
            case 'items': return item.items?.length || 0;
            case 'amount': return parseFloat(item.total);
            case 'status': return item.status;
            default: return item[key];
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const sortedReturns = useMemo(() => {
        const data = Array.isArray(allReturns) ? allReturns : [];
        return [...data].sort((a, b) => {
            let valA = resolveValue(a, sortConfig.key);
            let valB = resolveValue(b, sortConfig.key);

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allReturns, sortConfig]);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Quick View Modal
    const [quickViewReturn, setQuickViewReturn] = useState(null);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest('.quick-view-modal')) return;
            setActiveActionMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle Search
    const applyFilters = (newParams) => {
        router.get(route('store.returns-history.index', { store_slug: store.slug }), {
            search: searchTerm, // Use current state or passed param
            filter: activeFilter,
            start_date: dateRange.from,
            end_date: dateRange.to,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
    };

    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchTerm });
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newRange = { ...dateRange, [name]: value };
        setDateRange(newRange);
        if (newRange.from && newRange.to) {
            applyFilters({ start_date: newRange.from, end_date: newRange.to });
        }
    };

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Drag & Drop (Columns)
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

    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(Math.abs(val));
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <OneGlanceLayout title="Returns History" activeMenu="Sell">
            <Head title="Returns History" />
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <SellModuleTabs activeTab="returns" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <RefreshCcw size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Returns</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.total_returns || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <History size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">This Month</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{stats?.this_month || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Items Returned</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.items_returned || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Refunded</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{formatCurrency(stats?.total_refunded || 0)}</p>
                    </div>
                </div>

                {/* Header Area */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Returns <span className="text-indigo-600">History</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => { setActiveFilter('all'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'all', start_date: '', end_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => { setActiveFilter('today'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'today', start_date: '', end_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Today</button>
                        <button
                            onClick={() => setActiveFilter('custom')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Custom</button>
                        {/* Custom Date Range */}
                        {activeFilter === 'custom' && (
                            <div className="flex items-center gap-1.5 ml-1">
                                <input type="date" name="from" value={dateRange.from} onChange={handleDateChange}
                                    className="px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500" />
                                <span className="text-slate-400 text-xs">→</span>
                                <input type="date" name="to" value={dateRange.to} onChange={handleDateChange}
                                    className="px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        )}
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-52">
                            <div className="w-64 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleServerSearch}
                                    placeholder="Search returns..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link
                                href={route('store.returns.create', { store_slug: store.slug })}
                                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <Plus size={18} />
                                <span className="text-sm font-bold hidden sm:inline">New Return</span>
                            </Link>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
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
                            {sortedReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <RefreshCcw size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No returns found</p>
                                            <p className="text-sm text-slate-500 mb-4">Returns will appear here exactly when they happen</p>
                                            <Link
                                                href={route('store.returns.create', { store_slug: store.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Create First Return
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedReturns.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => setQuickViewReturn(row)}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-indigo-400
                                        `}
                                    >
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'date': return <span className="font-medium">{formatDate(row.created_at)}</span>;
                                                        case 'reference':
                                                            return (
                                                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.reference_number || `RET-${row.id}`}</span>
                                                            );
                                                        case 'customer':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold">{row.customer?.name || 'Walk-in'}</p>
                                                                    {row.customer?.phone && <p className="text-xs text-slate-400">{row.customer.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'items': return <span className="font-bold">{row.items?.length || 0}</span>;
                                                        case 'amount': return <span className="font-bold text-emerald-600">{formatCurrency(row.total)}</span>;
                                                        case 'method': return <span className="uppercase text-xs font-semibold">{row.payment_method || '-'}</span>;
                                                        case 'status':
                                                            return <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{row.status}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative">
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-indigo-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    <Link href={route("store.sales.show", [store.slug, row.id])} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                                                        <Eye size={14} /> View Details
                                                                                    </Link>
                                                                                    <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); setActiveActionMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                                                        <Printer size={14} /> Print
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
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
                        </tbody>
                    </table>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0">
                        {nextPageUrl ? 'Loading...' : (sortedReturns.length > 0 ? 'End of list' : '')}
                    </div>
                </div>
            </div>
            {/* Quick View Modal */}
            {quickViewReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQuickViewReturn(null)}>
                    <div
                        className="quick-view-modal w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Return Details</p>
                                <h3 className="text-xl font-black text-indigo-600">{quickViewReturn.reference_number || `RET-${quickViewReturn.id}`}</h3>
                            </div>
                            <button
                                onClick={() => setQuickViewReturn(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-auto">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Customer</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{quickViewReturn.customer?.name || 'Walk-in'}</p>
                                    <p className="text-sm text-slate-500">{quickViewReturn.customer?.phone}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Refund Amount</p>
                                    <p className="font-black text-emerald-600 text-lg">{formatCurrency(quickViewReturn.total)}</p>
                                    <p className="text-sm text-slate-500 uppercase">{quickViewReturn.payment_method || 'Cash'}</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-900 dark:text-white mb-3">Returned Items</h4>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Item</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase">Qty</th>
                                            <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">Price</th>
                                            <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {quickViewReturn.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{item.product?.name || item.name}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.price || item.unit_price || 0)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-white">{formatCurrency((item.price || 0) * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => PrintService.quickPrint(quickViewReturn)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                >
                                    <Printer size={16} /> Print Receipt
                                </button>
                                <Link
                                    href={route("store.sales.show", [store.slug, quickViewReturn.id])}
                                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <Eye size={16} /> View Full Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
