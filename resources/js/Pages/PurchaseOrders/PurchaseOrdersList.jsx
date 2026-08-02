import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Plus,
    ShoppingCart,
    Search,
    Eye,
    Calendar,
    FileSpreadsheet,
    Printer,
    MoreVertical,
    Edit,
    Trash2,
    X,
    ChevronUp,
    ChevronDown,
    CheckSquare,
    Clock,
    History,
    Package,
    Filter
} from 'lucide-react';
import PurchaseModuleTabs from '@/Components/PurchaseModuleTabs';
import axios from 'axios';

export default function PurchaseOrdersIndex({ orders = {}, stats = {} }) {
    const { store } = usePage().props;
    // Infinite Scroll State
    const [allOrders, setAllOrders] = useState(orders.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(orders.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync State
    useEffect(() => {
        if (orders.data && orders.current_page === 1) {
            setAllOrders(orders.data);
            setNextPageUrl(orders.next_page_url);
        }
    }, [orders]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllOrders(prev => {
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

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    // Quick View Modal State
    const [quickViewItem, setQuickViewItem] = useState(null);
    const [clickTimeout, setClickTimeout] = useState(null);

    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);

    // Columns Configuration
    const tableColumns = [
        { key: 'date', label: 'Date', width: '15%' },
        { key: 'reference', label: 'Reference No', width: '18%' },
        { key: 'supplier', label: 'Supplier', width: '22%' },
        { key: 'items', label: 'Items', width: '8%' },
        { key: 'total', label: 'Total', width: '12%' },
        { key: 'status', label: 'Status', width: '12%' },
        { key: 'actions', label: 'Actions', width: '13%' }
    ];

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest('.quick-view-modal')) return;
            setActiveActionMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Keyboard shortcuts
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
            router.visit(route('store.purchase-orders.show', row.id));
        } else {
            const timeout = setTimeout(() => {
                setQuickViewItem(row);
                setClickTimeout(null);
            }, 250);
            setClickTimeout(timeout);
        }
    }, [clickTimeout]);

    // Helper to resolve values for sorting
    function resolveValue(item, key) {
        switch (key) {
            case 'date': return item.order_date;
            case 'reference': return item.reference_number;
            case 'supplier': return item.supplier?.name || 'Unknown Supplier';
            case 'total': return parseFloat(item.total_amount || 0);
            case 'status': return item.status;
            default: return item[key];
        }
    }

    const sortedOrders = useMemo(() => {
        const data = Array.isArray(allOrders) ? allOrders : [];
        return [...data].sort((a, b) => {
            let valA = resolveValue(a, sortConfig.key);
            let valB = resolveValue(b, sortConfig.key);

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allOrders, sortConfig]);

    // Handle Search
    const applyFilters = (newParams) => {
        router.get(route('store.purchase-orders.index', { store_slug: store.slug }), {
            search: searchTerm,
            filter: activeFilter,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
    };

    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchTerm });
        }
    };

    // Filter by status
    const handleFilterChange = (status) => {
        setActiveFilter(status);
        applyFilters({ filter: status });
    };

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Formatters
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    // Calculate stats from data (use server stats if possible, or local)
    // For now using passed stats prop which is safer for big data
    const totalOrders = stats.total_orders || allOrders.length;
    const pendingOrders = stats.pending_orders || allOrders.filter(o => o.status === 'pending' || o.status === 'ordered').length;
    const receivedOrders = stats.received_orders || allOrders.filter(o => o.status === 'received').length;
    const totalValue = stats.total_value || allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    return (
        <OneGlanceLayout title="Pre-Purchases" activeMenu="Purchase">
            <Head title="Pre-Purchases" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <PurchaseModuleTabs activeTab="pre-purchases" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="flex md:hidden items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase text-left shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {!isStatsExpanded && (
                        <div className="flex flex-col gap-1 items-end text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-600 dark:text-indigo-400">Total: {formatCurrency(totalValue, store)}</span>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <span className="text-blue-600 dark:text-blue-400">Txns: {totalOrders}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards Section - Compact Single Line */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <ShoppingCart size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{totalOrders}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{pendingOrders}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Received</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{receivedOrders}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <History size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Value</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(totalValue, store)}</p>
                    </div>
                </div>

                {/* PC / Desktop Header Area (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Purchase <span className="text-purple-600">Orders</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => handleFilterChange('pending')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Pending</button>
                        <button
                            onClick={() => handleFilterChange('ordered')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'ordered' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Ordered</button>
                        <button
                            onClick={() => handleFilterChange('received')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'received' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Received</button>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-64 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder="Search purchase orders..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow outline-none"
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

                {/* Mobile Layout Header Area */}
                <div className="flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            Pre-Purchases
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Filters"
                            >
                                <Filter size={16} />
                            </button>
                            <Link
                                href={route('store.purchase-orders.create', { store_slug: store.slug })}
                                className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                                title="New Purchase Order"
                            >
                                <Plus size={16} />
                            </Link>
                        </div>
                    </div>

                    {showMobileSearch && (
                        <div className="w-full relative mt-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder="Search purchase orders..."
                                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow outline-none text-slate-800 dark:text-white"
                            />
                            <Search className="absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >All</button>
                                <button
                                    onClick={() => handleFilterChange('pending')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >Pending</button>
                                <button
                                    onClick={() => handleFilterChange('ordered')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'ordered' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >Ordered</button>
                                <button
                                    onClick={() => handleFilterChange('received')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'received' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >Received</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Table Container */}
                <div className="flex-1 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900">
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                {tableColumns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                                        className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                            {sortedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <ShoppingCart size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No purchase orders found</p>
                                            <p className="text-sm text-slate-500 mb-4">Create your first purchase order to get started</p>
                                            <Link
                                                href={route('store.purchase-orders.create', { store_slug: store.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Create Purchase Order
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedOrders.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-purple-400
                                            ${quickViewItem?.id === row.id ? 'ring-2 ring-purple-500 ring-inset bg-purple-50 dark:bg-purple-900/20' : ''}
                                        `}
                                    >
                                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="font-medium">{formatDate(row.order_date)}</span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{row.reference_number}</span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                            <p className="font-semibold">{row.supplier?.name || 'Unknown Supplier'}</p>
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="font-bold">{row.items?.length || 0}</span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(row.total_amount, store)}</span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {(() => {
                                                const statusStyles = {
                                                    received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                                    ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
                                                    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                                    cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                };
                                                return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[row.status] || 'bg-slate-100 text-slate-700'}`}>{row.status}</span>;
                                            })()}
                                        </td>
                                        <td className="p-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {row.status !== 'received' && (
                                                    <Link
                                                        href={route('store.purchase-orders.edit', row.id)}
                                                        className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-600 transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                )}
                                                <Link
                                                    href={route('store.purchase-orders.show', row.id)}
                                                    className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-indigo-600 transition-colors"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile View - Cards List */}
                    <div className="md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent">
                        {sortedOrders.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
                                <ShoppingCart size={32} className="mx-auto text-slate-400 mb-2" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-350">No purchase orders found</p>
                            </div>
                        ) : (
                            sortedOrders.map((row) => {
                                const statusStyles = {
                                    received: 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20',
                                    ordered: 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20',
                                    pending: 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20',
                                    cancelled: 'bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20'
                                };
                                return (
                                    <div
                                        key={row.id}
                                        onClick={() => handleRowClick(row)}
                                        className={`
                                            p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-indigo-400 transition-colors
                                            ${quickViewItem?.id === row.id ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20 dark:bg-indigo-900/10' : ''}
                                        `}
                                    >
                                        {/* Row 1: Supplier Name (Left), Invoice Reference & Date (Right) */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                                                    {row.supplier?.name || 'Unknown Supplier'}
                                                </h3>
                                                {row.supplier?.phone && (
                                                    <p className="text-2xs text-slate-400 font-semibold">{row.supplier.phone}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                                                    {row.reference_number || '-'}
                                                </span>
                                                <span className="text-2xs text-slate-400 font-semibold block mt-0.5">
                                                    {formatDate(row.order_date || row.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Row 2: Badges (Transaction type & status) */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-3xs font-black uppercase bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200/30">
                                                Pre-Purchase
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[row.status] || 'bg-slate-100 text-slate-700'}`}>
                                                {row.status}
                                            </span>
                                        </div>

                                        {/* Row 3: Totals & Action Icons */}
                                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Total</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(row.total_amount, store)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-3xs text-slate-400 font-bold uppercase block tracking-wider">Items</span>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-350">
                                                        {row.items?.length || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                {row.status !== 'received' && (
                                                    <Link
                                                        href={route('store.purchase-orders.edit', row.id)}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-amber-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                )}
                                                <Link
                                                    href={route('store.purchase-orders.show', row.id)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0">
                        {nextPageUrl ? 'Loading...' : (sortedOrders.length > 0 ? 'End of list' : '')}
                    </div>
                </div>
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
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Order</p>
                                    <h3 className="text-xl font-black text-purple-600">{quickViewItem.reference_number}</h3>
                                </div>
                                {(() => {
                                    const statusStyles = {
                                        received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                        ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
                                        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                    };
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[quickViewItem.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {quickViewItem.status}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                                    <Printer size={14} /> Print
                                </button>
                                <Link
                                    href={route('store.purchase-orders.show', quickViewItem.id)}
                                    className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                                >
                                    <Eye size={14} /> View Details
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
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-2xs font-bold text-slate-400 uppercase mb-1">Supplier</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{quickViewItem.supplier?.name || 'Unknown'}</p>
                                    {quickViewItem.supplier?.phone && (
                                        <p className="text-xs text-slate-500">{quickViewItem.supplier.phone}</p>
                                    )}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-2xs font-bold text-slate-400 uppercase mb-1">Order Date</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewItem.order_date)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <p className="text-2xs font-bold text-purple-600 uppercase mb-1">Total</p>
                                    <p className="font-black text-purple-600 text-lg">{formatCurrency(quickViewItem.total_amount, store)}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                        Items in this Order ({quickViewItem.items?.length || 0})
                                    </p>
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="text-left p-3 text-2xs font-bold text-slate-400 uppercase">#</th>
                                                <th className="text-left p-3 text-2xs font-bold text-slate-400 uppercase">Item Name</th>
                                                <th className="text-center p-3 text-2xs font-bold text-slate-400 uppercase">Qty</th>
                                                <th className="text-right p-3 text-2xs font-bold text-slate-400 uppercase">Rate</th>
                                                <th className="text-right p-3 text-2xs font-bold text-slate-400 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {quickViewItem.items && quickViewItem.items.length > 0 ? (
                                                quickViewItem.items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                        <td className="p-3">
                                                            <p className="font-semibold text-slate-800 dark:text-white">{item.product?.name || item.name || 'Unknown Item'}</p>
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                        <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.price || item.unit_price || 0, store)}</td>
                                                        <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                                            {formatCurrency(item.quantity * (item.price || item.unit_price || 0), store)}
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
                                    <div className="flex justify-end">
                                        <div className="text-right">
                                            <p className="text-2xs text-purple-600 uppercase font-bold">Grand Total</p>
                                            <p className="font-black text-lg text-purple-600">{formatCurrency(quickViewItem.total_amount, store)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Convert to Purchase Button */}
                            {quickViewItem.status !== 'received' && (
                                <div className="mt-4 flex justify-center">
                                    <Link
                                        href={route('store.purchase-orders.receive', quickViewItem.id)}
                                        method="post"
                                        as="button"
                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 w-full justify-center"
                                    >
                                        <Package size={16} /> Receive Stock
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0">
                            <p className="text-2xs text-slate-400">Double-click row to view details • Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">Esc</kbd> to close</p>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
