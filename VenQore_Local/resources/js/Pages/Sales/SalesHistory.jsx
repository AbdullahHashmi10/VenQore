import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
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
    Share2,
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
    Square,
    Edit,
    Truck,
    XCircle,
    Clock,
} from 'lucide-react';
import SellModuleTabs from '@/Components/SellModuleTabs';
import PrintService from '@/Utils/PrintService';
import PrintButton from '@/Components/PrintButton';

export default function SalesIndex({ sales, filters, stats }) {
    const { auth, flash, store } = usePage().props;
    const isSuperAdmin = auth.user?.role === 'platform_admin' || auth.user?.role === 'admin' || auth.user?.role === 'owner';

    // Infinite Scroll State
    const [allSales, setAllSales] = useState(sales.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(sales.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync State
    useEffect(() => {
        if (sales.data && sales.current_page === 1) {
            setAllSales(sales.data);
            setNextPageUrl(sales.next_page_url);
        }
    }, [sales]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllSales(prev => {
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

    // Auto-clear flash messages after 3 seconds
    useEffect(() => {
        if (flash.success || flash.error) {
            const timer = setTimeout(() => {
                // We can't clear props directly, but we can hide local state if we copied it.
                // For now, let Inertia handle it, but we render strictly based on current props.
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Parse URL params for sync
    const params = new URLSearchParams(window.location.search);

    // UI State
    const [searchTerm, setSearchTerm] = useState(params.get('search') || '');
    const [activeFilter, setActiveFilter] = useState(params.get('filter') || 'all');
    const [dateRange, setDateRange] = useState({
        from: params.get('from_date') || '',
        to: params.get('to_date') || ''
    });

    const [sortConfig, setSortConfig] = useState({ 
        key: params.get('sort_by') || 'date', 
        direction: params.get('sort_dir') || 'desc' 
    });

    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [activeSharePopup, setActiveSharePopup] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '12%' },
        { key: 'reference', label: 'Invoice No', width: '15%' },
        { key: 'party_name', label: 'Party Name', width: '15%' },
        { key: 'transaction', label: 'Transaction', width: '10%' },
        { key: 'payment_method', label: 'Payment Type', width: '10%' },
        { key: 'amount', label: 'Amount', width: '10%' },
        { key: 'balance', label: 'Balance', width: '10%' },
        { key: 'due_date', label: 'Due Date', width: '8%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '10%', frozen: true }
    ]);

    // Debounced Search Logic
    const [debouncedSearch] = useMemo(() => {
        let timer;
        return [
            (val) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    applyFilters({ search: val });
                }, 400);
            }
        ];
    }, [sortConfig, activeFilter, dateRange]);

    useEffect(() => {
        if (searchTerm !== (params.get('search') || '')) {
            debouncedSearch(searchTerm);
        }
    }, [searchTerm]);

    // Selection for "Combine" feature
    const [selectedSales, setSelectedSales] = useState([]);

    const applyFilters = (newParams) => {
        router.get(route('store.sales.index', { store_slug: store?.slug }), {
            search: searchTerm,
            filter: activeFilter,
            from_date: dateRange.from,
            to_date: dateRange.to,
            sort_by: sortConfig.key,
            sort_dir: sortConfig.direction,
            ...newParams
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Use raw data from server (already sorted globally)
    const sortedSales = allSales;

    // Sorting
    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
        applyFilters({ sort_by: key, sort_dir: direction });
    };

    // Search Handler
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Server-side search on Enter (Immediate override)
    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchTerm });
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSales(sortedSales.map(s => s.id));
        } else {
            setSelectedSales([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedSales.includes(id)) {
            setSelectedSales(selectedSales.filter(s => s !== id));
        } else {
            setSelectedSales([...selectedSales, id]);
        }
    };

    const handleBulkDelete = () => {
        if (!confirm(`Are you sure you want to permanently delete ${selectedSales.length} sales? This cannot be undone.`)) return;

        router.post(route('store.sales.bulk-destroy', { store_slug: store?.slug }), { ids: selectedSales }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedSales([]);
                setActiveActionMenu(null);
                window.location.reload();
            },
        });
    };

    // Quick View Modal State
    const [quickViewSale, setQuickViewSale] = useState(null);
    const [clickTimeout, setClickTimeout] = useState(null);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && quickViewSale) {
                setQuickViewSale(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [quickViewSale]);

    // Handle row click - single click = quick view, double click = edit
    const handleRowClick = useCallback((row) => {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
            router.visit(route('store.sales.edit', { store_slug: store?.slug, id: row.id }));
        } else {
            const timeout = setTimeout(() => {
                setQuickViewSale(row);
                setClickTimeout(null);
            }, 250);
            setClickTimeout(timeout);
        }
    }, [clickTimeout]);

    const applyFilterType = (type) => {
        setActiveFilter(type);
        applyFilters({ filter: type });
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newRange = { ...dateRange, [name]: value };
        setDateRange(newRange);
        if (newRange.from && newRange.to) {
            applyFilters({ from_date: newRange.from, to_date: newRange.to });
        }
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

    // Formatters
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    // New Sale Buttons (Creating a space for them while respecting blueprint header)
    // The blueprint asks for a specific Header Area. I will place the buttons below tabs.

    return (
        <OneGlanceLayout title="Sales History" activeMenu="Sell">
            <Head title="Sales History" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden relative">



                <SellModuleTabs activeTab="orders" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Sale</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(stats?.total_sale || 0)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Paid Amount</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{formatCurrency(stats?.total_paid || 0)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Unpaid (Due)</p>
                        </div>
                        <p className="text-base font-black text-rose-600">{formatCurrency(stats?.total_unpaid || 0)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <History size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Transactions</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.transaction_count || 0}</p>
                    </div>
                </div>

                {/* 1. Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Sales <span className="text-indigo-600">Transactions</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => { setActiveFilter('all'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'all', from_date: '', to_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => { setActiveFilter('today'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'today', from_date: '', to_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Today</button>
                        <button
                            onClick={() => { setActiveFilter('month'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'month', from_date: '', to_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >This Month</button>
                        <button
                            onClick={() => { setActiveFilter('year'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'year', from_date: '', to_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'year' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >This Year</button>
                        <button
                            onClick={() => setActiveFilter('custom')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Custom</button>
                        {/* Custom Date Range - Inline */}
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
                        <div className="w-64 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                onKeyDown={handleServerSearch}
                                placeholder="Search invoice, customer..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <a href={route('store.sales.export', { ...filters, store_slug: store?.slug })} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <FileSpreadsheet size={18} />
                            </a>
                            <Link href={route('store.reports.analytics', { store_slug: store?.slug })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Analytics">
                                <BarChart3 size={18} />
                            </Link>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedSales.length > 0 && (
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg mb-2 animate-in slide-in-from-top-2">
                        <span className="font-bold text-sm">{selectedSales.length} Selected</span>
                        <div className="flex items-center gap-2">
                            {isSuperAdmin && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={14} /> Delete Selected
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedSales([])}
                                className="p-1 hover:bg-indigo-700 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Main Transactions Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={selectedSales.length === sortedSales.length && sortedSales.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
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
                            {sortedSales.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <FileText size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No sales found</p>
                                            <p className="text-sm text-slate-500 mb-4">Transactions will appear here once you create your first sale</p>
                                            <Link
                                                href={route('store.sales.invoice.create', { store_slug: store?.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Create First Invoice
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedSales.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${row.source === 'pos'
                                                ? 'bg-orange-50/30 dark:bg-orange-900/5 border-l-4 border-orange-500'
                                                : 'border-l-4 border-transparent hover:border-indigo-400'
                                            }
                                            ${quickViewSale?.id === row.id ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                        `}
                                    >
                                        <td className="p-4 w-10 sticky left-0 z-10 bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={selectedSales.includes(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
                                            />
                                        </td>
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}- ${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'date': return <span className="font-medium">{formatDate(row.created_at)}</span>;
                                                        case 'reference':
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.reference_number}</span>
                                                                    {row.source === 'pos' && (
                                                                        <span className="text-[10px] font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded uppercase">POS</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        case 'party_name':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold">{row.customer?.name || 'Walk-in'}</p>
                                                                    {row.customer?.phone && <p className="text-xs text-slate-400">{row.customer.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'transaction':
                                                            const isReturn = row.status === 'returned' || (row.reference_number && row.reference_number.startsWith('RET'));
                                                            return isReturn
                                                                ? <span className="text-xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-1 rounded-md">Return</span>
                                                                : <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-md">Sale</span>;
                                                        case 'payment_method': return <span className="uppercase text-xs font-semibold">{row.payment_method || '-'}</span>;
                                                        case 'amount': return <span className="font-bold">{formatCurrency(row.total)}</span>;
                                                        case 'balance':
                                                            const paid = parseFloat(row.paid_amount || (row.payment_status === 'paid' ? row.total : 0) || 0);
                                                            const balance = parseFloat(row.total) - paid;
                                                            // Tolerance of 1 for floating point diffs
                                                            if (balance > 1) return <span className="text-red-500 font-bold">{formatCurrency(balance)}</span>;
                                                            if (balance < -1) return <span className="text-blue-600 font-bold" title="Overpaid Amount">+{formatCurrency(Math.abs(balance))}</span>;
                                                            return <span className="text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Settled</span>;
                                                        case 'due_date': return <span className="text-slate-400">-</span>;
                                                        case 'status':
                                                            let status = row.payment_status;
                                                            // Check for Overpaid (if data allows)
                                                            const pAmt = parseFloat(row.paid_amount || (status === 'paid' ? row.total : 0));
                                                            const tAmt = parseFloat(row.total);
                                                            if (pAmt > tAmt + 1) status = 'overpaid';

                                                            const statusStyles = {
                                                                paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                                                partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                                                unpaid: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                                                                overpaid: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                            };
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative">
                                                                    {/* Print */}
                                                                    <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                                                                        <Printer size={16} />
                                                                    </button>
                                                                    {/* Share */}
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveSharePopup(activeSharePopup === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? 'text-indigo-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <CornerUpRight size={16} />
                                                                        </button>
                                                                        {activeSharePopup === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in zoom-in-95">
                                                                                <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm"><Mail size={14} className="text-red-500" /> Email</button>
                                                                                <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm"><MessageCircle size={14} className="text-green-500" /> WhatsApp</button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* More */}
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-indigo-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    {/* 1. View/Edit - CONDITIONAL REDIRECT */}
                                                                                    {row.source === 'pos' ? (
                                                                                        <a href={route('store.pos', { store_slug: store?.slug }) + '?recall=' + row.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                                                            <Edit size={14} /> Open in POS
                                                                                        </a>
                                                                                    ) : (
                                                                                        <Link href={route('store.sales.edit', { store_slug: store?.slug, id: row.id })} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                                                            <Edit size={14} /> View/Edit
                                                                                        </Link>
                                                                                    )}

                                                                                    {/* 2. Convert To Return */}
                                                                                    <Link href={route('store.sales.show', { store_slug: store?.slug, id: row.id }) + '?action=return'} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><RefreshCcw size={14} /> Convert To Return</Link>

                                                                                    {/* 3. Preview Delivery Challan */}
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Truck size={14} /> Preview Delivery Challan</button>

                                                                                    {/* 4. Payment History */}
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><History size={14} /> Payment History</button>

                                                                                    {/* 5. Cancel Invoice */}
                                                                                    <button onClick={async () => { if (await confirm('Cancel invoice? Stock will be restored.')) router.post(route('store.sales.cancel', { store_slug: store?.slug, id: row.id })); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-red-600"><XCircle size={14} /> Cancel Invoice</button>

                                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>

                                                                                    {/* 6. Delete */}
                                                                                    {isSuperAdmin && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                if (confirm('Are you sure you want to permanently delete this sale? This will restore stock.')) {
                                                                                                    router.delete(route('store.sales.destroy', { store_slug: store?.slug, id: row.id }), {
                                                                                                        preserveScroll: true,
                                                                                                        onSuccess: () => setActiveActionMenu(null)
                                                                                                    });
                                                                                                }
                                                                                            }}
                                                                                            className="w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600"
                                                                                        >
                                                                                            <Trash2 size={14} /> Delete
                                                                                        </button>
                                                                                    )}

                                                                                    {/* 7. Duplicate */}
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Copy size={14} /> Duplicate</button>

                                                                                    {/* 8. Open PDF */}
                                                                                    <a href={route('store.sales.print', { store_slug: store?.slug, id: row.id })} target="_blank" className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><FileText size={14} /> Open PDF</a>

                                                                                    {/* 9. Preview */}
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Eye size={14} /> Preview</button>

                                                                                    {/* 10. Print */}
                                                                                    <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); setActiveActionMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Printer size={14} /> Print</button>

                                                                                    {/* 11. View History */}
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Clock size={14} /> View History</button>
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
                                        ))
                                        }
                                    </tr >
                                ))
                            )}
                        </tbody >
                    </table>

                    {/* Infinite Scroll Sentinel inside scroll container */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm opacity-0 h-4">
                        {sales.next_page_url ? 'Loading...' : ''}
                    </div>
                </div>
            </div>

            {/* Quick View Modal - Centered Popup */}
            {
                quickViewSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQuickViewSale(null)}>
                        <div
                            className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Preview</p>
                                        <h3 className="text-xl font-black text-indigo-600">{quickViewSale.reference_number}</h3>
                                    </div>
                                    {quickViewSale.source === 'pos' && (
                                        <span className="text-[10px] font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase">POS</span>
                                    )}
                                    {(() => {
                                        const statusStyles = {
                                            paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                            partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                            unpaid: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                        };
                                        return (
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[quickViewSale.payment_status] || 'bg-slate-100 text-slate-700'}`}>
                                                {quickViewSale.payment_status}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <PrintButton
                                        sale={quickViewSale}
                                        label="Print"
                                        variant="secondary"
                                        size="sm"
                                        className="font-bold text-xs"
                                    />
                                    <Link
                                        href={route('store.sales.edit', { store_slug: store?.slug, id: quickViewSale.id })}
                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                    >
                                        <Edit size={14} /> Edit Invoice
                                    </Link>
                                    <button
                                        onClick={() => setQuickViewSale(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-auto p-4">
                                {/* Top Info Row */}
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{quickViewSale.customer?.name || 'Walk-in'}</p>
                                        {quickViewSale.customer?.phone && (
                                            <p className="text-xs text-slate-500">{quickViewSale.customer.phone}</p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date & Time</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewSale.created_at)}</p>
                                        <p className="text-xs text-slate-500">{new Date(quickViewSale.created_at).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm uppercase">{quickViewSale.payment_method || 'Cash'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Total</p>
                                        <p className="font-black text-indigo-600 text-lg">{formatCurrency(quickViewSale.total)}</p>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                            Items in this Invoice ({quickViewSale.items?.length || 0})
                                        </p>
                                    </div>
                                    <div className="max-h-[300px] overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase">#</th>
                                                    <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase">Item Name</th>
                                                    <th className="text-center p-3 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Rate</th>
                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Discount</th>
                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {quickViewSale.items && quickViewSale.items.length > 0 ? (
                                                    quickViewSale.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                            <td className="p-3">
                                                                <p className="font-semibold text-slate-800 dark:text-white">{item.product?.name || item.name || 'Unknown Item'}</p>
                                                                {item.product?.sku && (
                                                                    <p className="text-[10px] text-slate-400 font-mono">{item.product.sku}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                            <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.price || item.unit_price || 0)}</td>
                                                            <td className="p-3 text-right text-orange-600">
                                                                {item.discount ? `-${formatCurrency(item.discount)}` : '-'}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                                                {formatCurrency((item.quantity * (item.price || item.unit_price || 0)) - (item.discount || 0))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="p-6 text-center text-slate-400">
                                                            No items data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Summary Row */}
                                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-end gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase">Subtotal</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(quickViewSale.subtotal || quickViewSale.total)}</p>
                                            </div>
                                            {quickViewSale.discount > 0 && (
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 uppercase">Discount</p>
                                                    <p className="font-bold text-orange-600">-{formatCurrency(quickViewSale.discount)}</p>
                                                </div>
                                            )}
                                            {quickViewSale.tax > 0 && (
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 uppercase">Tax</p>
                                                    <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(quickViewSale.tax)}</p>
                                                </div>
                                            )}
                                            <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-8">
                                                <p className="text-[10px] text-indigo-600 uppercase font-bold">Grand Total</p>
                                                <p className="font-black text-lg text-indigo-600">{formatCurrency(quickViewSale.total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="mt-4 flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Paid Amount</p>
                                            <p className="font-bold text-emerald-600">{formatCurrency(quickViewSale.paid_amount || (quickViewSale.payment_status === 'paid' ? quickViewSale.total : 0))}</p>
                                        </div>
                                        {(() => {
                                            const paid = parseFloat(quickViewSale.paid_amount || (quickViewSale.payment_status === 'paid' ? quickViewSale.total : 0));
                                            const balance = parseFloat(quickViewSale.total) - paid;
                                            if (balance > 1) {
                                                return (
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase">Balance Due</p>
                                                        <p className="font-bold text-red-600">{formatCurrency(balance)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { /* TODO: WhatsApp share */ }}
                                            className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                                        >
                                            <MessageCircle size={14} /> Share
                                        </button>
                                        <Link
                                            href={route('store.sales.show', { store_slug: store?.slug, id: quickViewSale.id }) + '?action=return'}
                                            className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors flex items-center gap-1"
                                        >
                                            <RefreshCcw size={14} /> Return
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0">
                                <p className="text-[10px] text-slate-400">Double-click row to edit directly • Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">Esc</kbd> to close</p>
                            </div>
                        </div>
                    </div>
                )
            }
        </OneGlanceLayout >
    );
}
