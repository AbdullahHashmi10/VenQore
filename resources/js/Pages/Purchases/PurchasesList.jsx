import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
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
    Edit,
    Clock,
    ShoppingBag
} from 'lucide-react';
import axios from 'axios';
import PurchaseModuleTabs from '@/Components/PurchaseModuleTabs';
import ConfirmModal from '@/Components/ConfirmModal';
import PrintService from '@/Utils/PrintService';
import PrintButton from '@/Components/PrintButton';

export default function PurchasesIndex({ purchases = {}, filters = {}, stats = {} }) {
    const { store } = usePage().props;
    // Infinite Scroll State
    const [allPurchases, setAllPurchases] = useState(purchases.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(purchases.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync state when props change
    useEffect(() => {
        if (purchases.data && purchases.current_page === 1) {
            setAllPurchases(purchases.data);
            setNextPageUrl(purchases.next_page_url);
        }
    }, [purchases]);

    // Parse URL params for sync
    const params = new URLSearchParams(window.location.search);

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
        { key: 'invoice_number', label: 'Invoice No', width: '15%' },
        { key: 'supplier_name', label: 'Supplier Name', width: '20%' },
        { key: 'transaction', label: 'Type', width: '10%' },
        { key: 'payment_method', label: 'Payment Type', width: '10%' },
        { key: 'total', label: 'Amount', width: '10%' },
        { key: 'balance', label: 'Balance', width: '10%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '10%', frozen: true }
    ]);

    // Use raw data from server (already sorted globally)
    const sortedPurchases = allPurchases;

    // Formatters
    const renderCurrency = (val) => (val < 0 ? '-' : '') + (window.amdSettings?.currency_symbol || 'Rs') + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val) || 0);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    // Apply Filters
    const applyFilters = useCallback((newParams) => {
        router.get(route('store.purchases.index', { store_slug: store?.slug }), {
            search: searchTerm,
            filter: activeFilter,
            from_date: dateRange.from,
            to_date: dateRange.to,
            sort_by: sortConfig.key,
            sort_dir: sortConfig.direction,
            ...newParams
        }, { preserveState: true, preserveScroll: true, replace: true });
    }, [store?.slug, searchTerm, activeFilter, dateRange, sortConfig]);

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
    }, [applyFilters]);

    useEffect(() => {
        if (searchTerm !== (params.get('search') || '')) {
            debouncedSearch(searchTerm);
        }
    }, [searchTerm, debouncedSearch, params]);

    // Fetch Next Page (Inertia handles this via re-render, but for infinite scroll we use raw json)
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllPurchases(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data.next_page_url);
        } catch (error) { console.error(error); } finally { isLoading.current = false; }
    }, [nextPageUrl]);

    // Intersection Observer
    useEffect(() => {
        const target = observerTarget.current;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
        }, { threshold: 0.1, rootMargin: '800px' });
        if (target) observer.observe(target);
        return () => { if (target) observer.unobserve(target); };
    }, [nextPageUrl, fetchNextPage]);

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

    // Selection & Modal States
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [quickViewItem, setQuickViewItem] = useState(null);
    const [clickTimeout, setClickTimeout] = useState(null);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest('.quick-view-modal')) return;
            setActiveActionMenu(null);
            setActiveSharePopup(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Keyboard Handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && quickViewItem) {
                setQuickViewItem(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [quickViewItem]);

    // Handle row click - single click = quick view, double click = edit
    const handleRowClick = useCallback((row) => {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
            router.visit(route('store.purchases.edit', { store_slug: store?.slug, purchase: row.id }));
        } else {
            const timeout = setTimeout(() => {
                setQuickViewItem(row);
                setClickTimeout(null);
            }, 250);
            setClickTimeout(timeout);
        }
    }, [clickTimeout, store?.slug]);

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

    function resolveValue(item, key) {
        switch (key) {
            case 'date': return item.date;
            case 'invoice_number': return item.invoice_number;
            case 'supplier_name': return item.supplier?.name || 'Unknown';
            case 'total': return parseFloat(item.total || 0);
            case 'status': return item.status;
            default: return item[key];
        }
    }

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

    // Handlers
    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(route('store.purchases.destroy', { store_slug: store?.slug, purchase: itemToDelete }), {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveActionMenu(null);
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }
            });
        }
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setShowDeleteModal(true);
        setActiveActionMenu(null);
    };

    return (
        <OneGlanceLayout title="Purchases History" activeMenu="Purchase">
            <Head title="Purchases History" />
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <PurchaseModuleTabs activeTab="purchases" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <ShoppingBag size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Purchases</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{renderCurrency(stats?.total_purchase || 0, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Paid Amount</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{renderCurrency(stats?.total_paid || 0, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Unpaid (Due)</p>
                        </div>
                        <p className="text-base font-black text-rose-600">{renderCurrency(stats?.total_due || 0, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <History size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Transactions</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{purchases?.total || sortedPurchases.length || 0}</p>
                    </div>
                </div>

                {/* Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Purchase <span className="text-indigo-600">Transactions</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => applyFilterType('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => applyFilterType('today')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Today</button>
                        <button
                            onClick={() => applyFilterType('month')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >This Month</button>
                        <button
                            onClick={() => setActiveFilter('custom')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Custom</button>
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
                                placeholder="Search purchase #, supplier..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print" onClick={() => window.print()}>
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
                            {sortedPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <ShoppingBag size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No purchases found</p>
                                            <p className="text-sm text-slate-500 mb-4">Record your first purchase to get started</p>
                                            <Link
                                                href={route('store.purchases.create', { store_slug: store?.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Create First Purchase
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedPurchases.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-indigo-400
                                            ${quickViewItem?.id === row.id ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                        `}
                                    >
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'date': return <span className="font-medium">{formatDate(row.date || row.created_at)}</span>;
                                                        case 'invoice_number':
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.invoice_number || row.reference_number || '-'}</span>
                                                                </div>
                                                            );
                                                        case 'supplier_name':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold">{row.supplier?.name || 'Unknown Supplier'}</p>
                                                                    {row.supplier?.phone && <p className="text-xs text-slate-400">{row.supplier.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'transaction': return <span className="text-xs font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-md">Purchase</span>;
                                                        case 'payment_method': return <span className="uppercase text-xs font-semibold">{row.payment_method || '-'}</span>;
                                                        case 'total':
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold">{renderCurrency(row.subtotal || row.total, store)}</span>
                                                                    {row.extras > 0 && (
                                                                        <span className="text-xs text-amber-600 dark:text-amber-400">+{renderCurrency(row.extras, store)} extras</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        case 'balance': {
                                                            const paid = parseFloat(row.paid || 0);
                                                            const total = parseFloat(row.total || 0);
                                                            const balance = row.balance ?? (total - paid);
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-slate-500">Paid: <span className="text-emerald-600 font-semibold">{renderCurrency(paid, store)}</span></span>
                                                                    {balance > 1 ? (
                                                                        <span className="text-red-500 font-bold">Due: {renderCurrency(balance, store)}</span>
                                                                    ) : (
                                                                        <span className="text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit">Settled</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        case 'status': {
                                                            // Use payment_status instead of status
                                                            let paymentStatus = row.payment_status || 'unpaid';
                                                            const statusStyles = {
                                                                paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                                                partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                                                unpaid: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                                                            };
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[paymentStatus] || 'bg-slate-100 text-slate-700'}`}>{paymentStatus}</span>;
                                                        }
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative" onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                                                                        <Printer size={16} />
                                                                    </button>
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-indigo-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    <Link href={route("store.purchases.edit", [store.slug, row.id])} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Edit size={14} /> View Details</Link>
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><History size={14} /> Payment History</button>
                                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.id); }}
                                                                                        className="w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600"
                                                                                    >
                                                                                        <Trash2 size={14} /> Delete
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
                    <div ref={observerTarget} className="mt-4 p-4 text-center text-slate-400 text-sm opacity-0 h-4">
                        {nextPageUrl ? 'Loading...' : ''}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    show={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Delete Purchase"
                    message="Are you sure you want to delete this purchase? This action cannot be undone and will restore stock items."
                    confirmLabel="Delete Purchase"
                    isDangerous={true}
                />
            </div>
            {/* Quick View Modal - Centered Popup */}
            {quickViewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQuickViewItem(null)}>
                    <div
                        className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Preview</p>
                                    <h3 className="text-xl font-black text-indigo-600">{quickViewItem.invoice_number || quickViewItem.reference_number}</h3>
                                </div>
                                {(() => {
                                    const statusStyles = {
                                        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                        partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                        unpaid: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                    };
                                    const ps = quickViewItem.payment_status || 'unpaid';
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[ps] || 'bg-slate-100 text-slate-700'}`}>
                                            {ps}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2">
                                <PrintButton
                                    sale={quickViewItem}
                                    label="Print"
                                    variant="secondary"
                                    size="sm"
                                    className="font-bold text-xs"
                                />
                                <Link
                                    href={route('store.purchases.edit', { store_slug: store?.slug, purchase: quickViewItem.id })}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                >
                                    <Edit size={14} /> View Details
                                </Link>
                                <button
                                    onClick={() => setQuickViewItem(null)}
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Supplier</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{quickViewItem.supplier?.name || 'Unknown'}</p>
                                    {quickViewItem.supplier?.phone && (
                                        <p className="text-xs text-slate-500">{quickViewItem.supplier.phone}</p>
                                    )}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewItem.date || quickViewItem.created_at)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm uppercase">{quickViewItem.payment_method || 'Cash'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Total</p>
                                    <p className="font-black text-indigo-600 text-lg">{renderCurrency(quickViewItem.total, store)}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                        Items in this Purchase ({quickViewItem.items?.length || 0})
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
                                                <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {quickViewItem.items && quickViewItem.items.length > 0 ? (
                                                quickViewItem.items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                        <td className="p-3">
                                                            <p className="font-semibold text-slate-800 dark:text-white">{item.product?.name || item.name || 'Unknown Item'}</p>
                                                            {item.product?.sku && (
                                                                <p className="text-[10px] text-slate-400 font-mono">{item.product.sku}</p>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                        <td className="p-3 text-right text-slate-600 dark:text-slate-400">{renderCurrency(item.price || item.unit_price || 0, store)}</td>
                                                        <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                                            {renderCurrency(item.quantity * (item.price || item.unit_price || 0), store)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-6 text-center text-slate-400">
                                                        No items data available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Summary Row */}
                                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-end gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase">Subtotal</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{renderCurrency(quickViewItem.subtotal || quickViewItem.total, store)}</p>
                                        </div>
                                        {quickViewItem.extras > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-amber-600 uppercase">Extras</p>
                                                <p className="font-bold text-amber-600">+{renderCurrency(quickViewItem.extras, store)}</p>
                                            </div>
                                        )}
                                        <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-6">
                                            <p className="text-[10px] text-slate-400 uppercase">Paid</p>
                                            <p className="font-bold text-emerald-600">{renderCurrency(quickViewItem.paid || 0, store)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase">Balance</p>
                                            <p className="font-bold text-red-600">{renderCurrency(quickViewItem.balance ?? ((quickViewItem.total || 0) - (quickViewItem.paid || 0)), store)}</p>
                                        </div>
                                        <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-6">
                                            <p className="text-[10px] text-indigo-600 uppercase font-bold">Grand Total</p>
                                            <p className="font-black text-lg text-indigo-600">{renderCurrency(quickViewItem.total, store)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0">
                            <p className="text-[10px] text-slate-400">Double-click row to view details • Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">Esc</kbd> to close</p>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
