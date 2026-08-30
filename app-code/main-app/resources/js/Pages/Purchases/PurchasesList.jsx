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
    ShoppingBag,
    Filter
} from 'lucide-react';
import axios from 'axios';
import PurchaseModuleTabs from '@/Components/PurchaseModuleTabs';
import ConfirmModal from '@/Components/ConfirmModal';
import PrintService from '@/Utils/PrintService';
import PrintButton from '@/Components/PrintButton';

export default function PurchasesIndex({ purchases = {}, filters = {}, stats = {} }) {
    const { store, vensynq_enabled } = usePage().props;
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
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);

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
            <div className="flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative">
                <PurchaseModuleTabs activeTab="purchases" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="flex md:hidden items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={16} className={`transition-transform duration-normal ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {!isStatsExpanded && (
                        <div className="flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary">
                            <div className="flex items-center gap-2">
                                <span className="text-brand-600 dark:text-brand-400">Purchase: {renderCurrency(stats?.total_purchase || 0, store)}</span>
                                <span className="text-neutral-300 dark:text-ink-secondary">|</span>
                                <span className="text-blue-600 dark:text-blue-400">Txns: {purchases?.total || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-600">Paid: {renderCurrency(stats?.total_paid || 0, store)}</span>
                                <span className="text-neutral-300 dark:text-ink-secondary">|</span>
                                <span className="text-rose-600">Due: {renderCurrency(stats?.total_due || 0, store)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards Section - Compact Single Line */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <ShoppingBag size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Purchases</p>
                        </div>
                        <p className="text-base font-bold text-ink">{renderCurrency(stats?.total_purchase || 0, store)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Paid Amount</p>
                        </div>
                        <p className="text-base font-bold text-emerald-600">{renderCurrency(stats?.total_paid || 0, store)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Unpaid (Due)</p>
                        </div>
                        <p className="text-base font-bold text-rose-600">{renderCurrency(stats?.total_due || 0, store)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <History size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Transactions</p>
                        </div>
                        <p className="text-base font-bold text-ink">{purchases?.total || sortedPurchases.length || 0}</p>
                    </div>
                </div>

                {/* PC / Desktop Header Area (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Purchase <span className="text-brand-600 dark:text-brand-400">Transactions</span>
                        </h1>
                        <div className="h-4 w-px bg-line mx-1"></div>
                        <button
                            onClick={() => applyFilterType('all')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover'}`}
                        >All</button>
                        <button
                            onClick={() => applyFilterType('today')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover'}`}
                        >Today</button>
                        <button
                            onClick={() => applyFilterType('month')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'month' ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover'}`}
                        >This Month</button>
                        <button
                            onClick={() => setActiveFilter('custom')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover'}`}
                        >Custom</button>
                        {activeFilter === 'custom' && (
                            <div className="flex items-center gap-1.5 ml-1">
                                <input type="date" name="from" value={dateRange.from} onChange={handleDateChange}
                                    className="px-2 py-0.5 text-xs font-semibold bg-sunken border border-line rounded-md text-ink focus:ring-1 focus:ring-brand-500" />
                                <span className="text-ink-muted text-xs">→</span>
                                <input type="date" name="to" value={dateRange.to} onChange={handleDateChange}
                                    className="px-2 py-0.5 text-xs font-semibold bg-sunken border border-line rounded-md text-ink focus:ring-1 focus:ring-brand-500" />
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
                                className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink placeholder:text-ink-muted"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-line pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 transition-colors" title="Export">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button className="p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors" title="Print" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout Header Area */}
                <div className="flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
                            Purchase Transactions
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Filters"
                            >
                                <Filter size={16} />
                            </button>
                            <Link
                                href={route('store.purchases.create', { store_slug: store?.slug })}
                                className="p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors"
                                title="New Purchase"
                            >
                                <Plus size={16} />
                            </Link>
                        </div>
                    </div>

                    {showMobileSearch && (
                        <div className="w-full relative mt-1 border-t border-line pt-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                onKeyDown={handleServerSearch}
                                placeholder="Search purchase #, supplier..."
                                className="w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink placeholder:text-ink-muted"
                            />
                            <Search className="absolute left-3 top-[65%] -translate-y-1/2 text-ink-muted pointer-events-none" size={14} />
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="w-full mt-1 border-t border-line pt-2 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => applyFilterType('all')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                >All</button>
                                <button
                                    onClick={() => applyFilterType('today')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                >Today</button>
                                <button
                                    onClick={() => applyFilterType('month')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'month' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                >Month</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Table / Container */}
                <div className="flex-1 overflow-auto md:rounded-2xl md:border md:border-line md:shadow-sm bg-transparent md:bg-surface">
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-sunken border-b border-line sticky top-0 z-10">
                                {tableColumns.map((col, index) => (
                                    <th
                                        key={col.key}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                                        className={`
                                            p-4 text-xs font-bold text-ink-muted uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-interactive-hover transition-colors
                                            ${draggedColumn === index ? 'opacity-50 border-2 border-dashed border-brand-500' : ''}
                                        `}
                                        style={{ width: col.width }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.key !== 'actions' && sortConfig.key === col.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-500" /> : <ChevronDown size={14} className="text-brand-500" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line bg-surface">
                            {sortedPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4">
                                                <ShoppingBag size={32} className="text-ink-muted" />
                                            </div>
                                            <p className="text-lg font-bold text-ink-secondary mb-1">No purchases found</p>
                                            <p className="text-sm text-ink-muted mb-4">Record your first purchase to get started</p>
                                            <Link
                                                href={route('store.purchases.create', { store_slug: store?.slug })}
                                                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
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
                                            hover:bg-interactive-hover transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-brand-500
                                            ${quickViewItem?.id === row.id ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/30 dark:bg-brand-900/20' : ''}
                                        `}
                                    >
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-ink-secondary">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'date': return <span className="font-medium">{formatDate(row.date || row.created_at)}</span>;
                                                        case 'invoice_number':
                                                             return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{row.invoice_number || row.reference_number || '-'}</span>
                                                                    {vensynq_enabled && row.is_jit && row.approval_status === 'draft' && (
                                                                        <span className="text-2xs font-black bg-amber-50 border border-amber-200/50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                            JIT Draft
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        case 'supplier_name':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold text-ink">{row.supplier?.name || 'Unknown Supplier'}</p>
                                                                    {row.supplier?.phone && <p className="text-xs text-ink-muted">{row.supplier.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'transaction': return <span className="text-xs font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-md">Purchase</span>;
                                                        case 'payment_method': return <span className="uppercase text-xs font-semibold">{row.payment_method || '-'}</span>;
                                                        case 'total':
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-ink">{renderCurrency(row.subtotal || row.total, store)}</span>
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
                                                                    <span className="text-xs text-ink-muted">Paid: <span className="text-emerald-600 font-semibold">{renderCurrency(paid, store)}</span></span>
                                                                    {balance > 1 ? (
                                                                        <span className="text-rose-600 font-bold">Due: {renderCurrency(balance, store)}</span>
                                                                    ) : (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit">Settled</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        case 'status': {
                                                            let paymentStatus = row.payment_status || 'unpaid';
                                                            const isJitDraft = row.is_jit === 1 && row.approval_status === 'draft' && vensynq_enabled;
                                                            const statusStyles = {
                                                                paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                                                partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                                                unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
                                                            };
                                                            return (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className={`px-2 py-1 rounded-md text-2xs font-bold uppercase w-fit ${statusStyles[paymentStatus] || 'bg-sunken text-ink-secondary'}`}>
                                                                        {paymentStatus}
                                                                    </span>
                                                                    {isJitDraft && (
                                                                        <span className="px-2 py-1 rounded-md text-2xs font-bold uppercase w-fit bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                                                            JIT Draft (Unapproved)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        case 'actions':
                                                            const isJitDraft = row.is_jit === 1 && row.approval_status === 'draft' && vensynq_enabled;
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative" onClick={(e) => e.stopPropagation()}>
                                                                    {isJitDraft && (
                                                                        <button 
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation();
                                                                                if(confirm('Approve this JIT draft and finalize the purchase?')) {
                                                                                    router.patch(route('store.vensynq.jit.approve', { store_slug: store?.slug, purchase: row.id }), {}, { preserveScroll: true });
                                                                                }
                                                                            }}
                                                                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm"
                                                                            title="Approve JIT Auto-Draft"
                                                                        >
                                                                            <CheckSquare size={12} /> Approve
                                                                        </button>
                                                                    )}
                                                                    <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); }} className="p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors">
                                                                        <Printer size={16} />
                                                                    </button>
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-brand-600 bg-interactive-hover' : 'text-ink-muted hover:bg-interactive-hover'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    <Link href={route("store.purchases.show", { store_slug: store?.slug, purchase: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary"><Eye size={14} /> View Details</Link>
                                                                                    <Link href={route("store.purchases.edit", { store_slug: store?.slug, purchase: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary"><Edit size={14} /> Edit Purchase</Link>
                                                                                    {['pending', 'partial'].includes(row.workflow_status) && (
                                                                                        <Link href={route("store.purchases.receive", { store_slug: store?.slug, purchase: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-emerald-600"><CheckSquare size={14} /> Receive Goods</Link>
                                                                                    )}
                                                                                    <div className="h-px bg-line my-1"></div>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.id); }}
                                                                                        className="w-full text-left px-3 py-2 hover:bg-rose-500/10 rounded flex items-center gap-2 text-sm text-rose-600"
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

                    {/* Mobile View - Cards List */}
                    <div className="md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent">
                        {sortedPurchases.length === 0 ? (
                            <div className="bg-surface rounded-xl p-8 text-center border border-line">
                                <ShoppingBag size={32} className="mx-auto text-ink-muted mb-2" />
                                <p className="text-sm font-bold text-ink-secondary">No purchases found</p>
                            </div>
                        ) : sortedPurchases.map((row) => {
                                const paid = parseFloat(row.paid || 0);
                                const total = parseFloat(row.total || 0);
                                const balance = row.balance ?? (total - paid);
                                let paymentStatus = row.payment_status || 'unpaid';
                                const isJitDraft = row.is_jit === 1 && row.approval_status === 'draft' && vensynq_enabled;
                                const statusStyles = {
                                    paid: 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20',
                                    partial: 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20',
                                    unpaid: 'bg-rose-100/50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20',
                                };
                                return (
                                    <div
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        className={`
                                            p-3 bg-surface rounded-xl border border-line shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-brand-500 transition-colors
                                            ${quickViewItem?.id === row.id ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/20 dark:bg-brand-900/10' : ''}
                                        `}
                                    >
                                        {/* Row 1: Supplier Name (Left), Invoice Reference & Date (Right) */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-extrabold text-ink text-sm">
                                                    {row.supplier?.name || 'Unknown Supplier'}
                                                </h3>
                                                {row.supplier?.phone && (
                                                    <p className="text-2xs text-ink-muted font-semibold">{row.supplier.phone}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block">
                                                    {row.invoice_number || row.reference_number || '-'}
                                                </span>
                                                <span className="text-2xs text-ink-muted font-semibold block mt-0.5">
                                                    {formatDate(row.date || row.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Row 2: Badges (Transaction type & payment status) */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-3xs font-black uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200/30">
                                                Purchase
                                            </span>
                                            {isJitDraft && (
                                                <span className="text-3xs font-black bg-amber-50 border border-amber-200/50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded uppercase tracking-wide">
                                                    JIT Draft
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[paymentStatus] || 'bg-sunken text-ink-secondary'}`}>
                                                {paymentStatus}
                                            </span>
                                        </div>

                                        {/* Row 3: Totals & Action Icons */}
                                        <div className="flex items-center justify-between border-t border-line pt-2 mt-1">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Total</span>
                                                    <span className="text-xs font-black text-ink">
                                                        {renderCurrency(total, store)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Balance</span>
                                                    {balance > 1 ? (
                                                        <span className="text-xs font-black text-rose-600">
                                                            {renderCurrency(balance, store)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10">
                                                            Settled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                {isJitDraft && (
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation();
                                                            if(confirm('Approve this JIT draft and finalize the purchase?')) {
                                                                router.patch(route('store.vensynq.jit.approve', { store_slug: store?.slug, purchase: row.id }), {}, { preserveScroll: true });
                                                            }
                                                        }}
                                                        className="px-2 py-1 bg-amber-500 text-white text-2xs font-bold rounded flex items-center gap-1 shadow-sm"
                                                        title="Approve JIT Auto-Draft"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => PrintService.quickPrint(row)}
                                                    className="p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors"
                                                    title="Print"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} 
                                                        className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-brand-600 bg-interactive-hover' : 'text-ink-muted hover:bg-interactive-hover'}`}
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {activeActionMenu === row.id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-56 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
                                                            <div className="py-1">
                                                                <Link href={route("store.purchases.show", { store_slug: store?.slug, purchase: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary">
                                                                    <Eye size={14} /> View Details
                                                                </Link>
                                                                <Link href={route("store.purchases.edit", { store_slug: store?.slug, purchase: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary">
                                                                    <Edit size={14} /> Edit Purchase
                                                                </Link>
                                                                <div className="h-px bg-line my-1"></div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.id); }}
                                                                    className="w-full text-left px-3 py-2 hover:bg-rose-500/10 rounded flex items-center gap-2 text-sm text-rose-600"
                                                                >
                                                                    <Trash2 size={14} /> Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="mt-4 p-4 text-center text-ink-muted text-sm opacity-0 h-4">
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
                        className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-line bg-sunken shrink-0">
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Purchase Preview</p>
                                    <h3 className="text-xl font-black text-brand-600 dark:text-brand-400">{quickViewItem.invoice_number || quickViewItem.reference_number}</h3>
                                </div>
                                {(() => {
                                    const statusStyles = {
                                        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                        partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                        unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                    };
                                    const ps = quickViewItem.payment_status || 'unpaid';
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[ps] || 'bg-sunken text-ink-secondary'}`}>
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
                                    href={route('store.purchases.show', { store_slug: store?.slug, purchase: quickViewItem.id })}
                                    className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1"
                                >
                                    <Eye size={14} /> View Details
                                </Link>
                                <button
                                    onClick={() => setQuickViewItem(null)}
                                    className="p-2 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4">
                            {/* Top Info Row */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="bg-sunken p-3 rounded-xl border border-line">
                                    <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Supplier</p>
                                    <p className="font-bold text-ink text-sm">{quickViewItem.supplier?.name || 'Unknown'}</p>
                                    {quickViewItem.supplier?.phone && (
                                        <p className="text-xs text-ink-muted">{quickViewItem.supplier.phone}</p>
                                    )}
                                </div>
                                <div className="bg-sunken p-3 rounded-xl border border-line">
                                    <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Date</p>
                                    <p className="font-bold text-ink text-sm">{formatDate(quickViewItem.date || quickViewItem.created_at)}</p>
                                </div>
                                <div className="bg-sunken p-3 rounded-xl border border-line">
                                    <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Payment</p>
                                    <p className="font-bold text-ink text-sm uppercase">{quickViewItem.payment_method || 'Cash'}</p>
                                </div>
                                <div className="bg-brand-500/10 p-3 rounded-xl border border-brand-500/20">
                                    <p className="text-2xs font-bold text-brand-600 dark:text-brand-400 uppercase mb-1">Total</p>
                                    <p className="font-black text-brand-600 dark:text-brand-400 text-lg">{renderCurrency(quickViewItem.total, store)}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-line rounded-xl overflow-hidden">
                                <div className="bg-sunken px-4 py-2 border-b border-line">
                                    <p className="text-xs font-bold text-ink uppercase">
                                        Items in this Purchase ({quickViewItem.items?.length || 0})
                                    </p>
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-sunken border-b border-line">
                                            <tr>
                                                <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">#</th>
                                                <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">Item Name</th>
                                                <th className="text-center p-3 text-2xs font-bold text-ink-muted uppercase">Qty</th>
                                                <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Rate</th>
                                                <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line bg-surface">
                                            {quickViewItem.items && quickViewItem.items.length > 0 ? (
                                                quickViewItem.items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-interactive-hover transition-colors">
                                                        <td className="p-3 text-ink-muted font-mono text-xs">{idx + 1}</td>
                                                        <td className="p-3">
                                                            <p className="font-semibold text-ink">{item.product?.name || item.name || 'Unknown Item'}</p>
                                                            {item.product?.sku && (
                                                                <p className="text-2xs text-ink-muted font-mono">{item.product.sku}</p>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-ink">{item.quantity}</td>
                                                        <td className="p-3 text-right text-ink-secondary">{renderCurrency(item.price || item.unit_price || 0, store)}</td>
                                                        <td className="p-3 text-right font-bold text-ink">
                                                            {renderCurrency(item.quantity * (item.price || item.unit_price || 0), store)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-6 text-center text-ink-muted">
                                                        No items data available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Summary Row */}
                                <div className="bg-sunken px-4 py-3 border-t border-line">
                                    <div className="flex justify-end gap-6">
                                        <div className="text-right">
                                            <p className="text-2xs text-ink-muted uppercase">Subtotal</p>
                                            <p className="font-bold text-ink">{renderCurrency(quickViewItem.subtotal || quickViewItem.total, store)}</p>
                                        </div>
                                        {quickViewItem.extras > 0 && (
                                            <div className="text-right">
                                                <p className="text-2xs text-amber-600 uppercase">Extras</p>
                                                <p className="font-bold text-amber-600">+{renderCurrency(quickViewItem.extras, store)}</p>
                                            </div>
                                        )}
                                        <div className="text-right border-l border-line pl-6">
                                            <p className="text-2xs text-ink-muted uppercase">Paid</p>
                                            <p className="font-bold text-emerald-600">{renderCurrency(quickViewItem.paid || 0, store)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xs text-ink-muted uppercase">Balance</p>
                                            <p className="font-bold text-rose-600">{renderCurrency(quickViewItem.balance ?? ((quickViewItem.total || 0) - (quickViewItem.paid || 0)), store)}</p>
                                        </div>
                                        <div className="text-right border-l border-line pl-6">
                                            <p className="text-2xs text-brand-600 dark:text-brand-400 uppercase font-bold">Grand Total</p>
                                            <p className="font-black text-lg text-brand-600 dark:text-brand-400">{renderCurrency(quickViewItem.total, store)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-line bg-sunken text-center shrink-0">
                            <p className="text-2xs text-ink-muted">Double-click row to view details • Press <kbd className="px-1.5 py-0.5 bg-app rounded text-ink-secondary font-mono border border-line">Esc</kbd> to close</p>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
};
