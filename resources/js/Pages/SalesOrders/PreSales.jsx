import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
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
    Plus,
    ChevronDown,
    CornerUpRight,
    CheckSquare,
    Edit,
    Truck,
    XCircle,
    Clock,
    ShoppingBag,
    ShoppingCart
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import SellModuleTabs from '@/Components/SellModuleTabs';
import SmartCombobox from '@/Components/SmartCombobox';

export default function PreOrders({ orders, filters: rawFilters, stats }) {
    const { store } = usePage().props;
    const filters = (rawFilters && !Array.isArray(rawFilters)) ? rawFilters : {};

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
            const response = await axios.get(nextPageUrl, {
                params: {
                    search: searchTerm,
                    filter: activeFilter,
                    from_date: dateRange.from,
                    to_date: dateRange.to
                },
                headers: { 'Accept': 'application/json' }
            });
            const newItems = response.data.data;
            setAllOrders(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data.next_page_url);
        } catch (error) {
            console.error("Failed to load more orders:", error);
        } finally {
            isLoading.current = false;
        }
    }, [nextPageUrl]);

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

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [activeFilter, setActiveFilter] = useState(filters?.filter || 'all');
    const [dateRange, setDateRange] = useState({
        from: filters?.from_date || '',
        to: filters?.to_date || ''
    });

    // Alert context
    const { showConfirm } = useAlert();

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '12%' },
        { key: 'order_number', label: 'Order No', width: '15%' },
        { key: 'party_name', label: 'Party Name', width: '15%' },
        { key: 'transaction', label: 'Transaction', width: '10%' },
        { key: 'total_amount', label: 'Amount', width: '10%' },
        { key: 'balance', label: 'Balance', width: '10%' },
        { key: 'due_date', label: 'Due Date', width: '10%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '8%', frozen: true }
    ]);

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [activeSharePopup, setActiveSharePopup] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Quick View Modal State
    const [quickViewItem, setQuickViewItem] = useState(null);
    const [clickTimeout, setClickTimeout] = useState(null);

    // Handle Click Outside (Existing logic)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest('.quick-view-modal')) return;
            setActiveActionMenu(null);
            setActiveSharePopup(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && quickViewItem) setQuickViewItem(null);
            if (e.key === 'Enter') applyServerFilters({ search: searchTerm }); // Global enter search
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [quickViewItem, searchTerm]);

    // Handle row click
    const handleRowClick = useCallback((row) => {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
            router.visit(route('store.sales.orders.show', { store_slug: store?.slug, order: row.id }));
        } else {
            const timeout = setTimeout(() => {
                setQuickViewItem(row);
                setClickTimeout(null);
            }, 250);
            setClickTimeout(timeout);
        }
    }, [clickTimeout]);

    // Server Search Application
    const applyServerFilters = (newParams) => {
        router.get(route('store.pre-sales.index', { store_slug: store?.slug }), {
            search: searchTerm,
            filter: activeFilter,
            from_date: dateRange.from,
            to_date: dateRange.to,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (val) => {
        setSearchTerm(val);
    };

    const handleServerSearch = (item) => {
        const val = item ? item.order_number : searchTerm;
        applyServerFilters({ search: val });
    };

    const applyFilterType = (type) => {
        setActiveFilter(type);
        applyServerFilters({ filter: type });
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newRange = { ...dateRange, [name]: value };
        setDateRange(newRange);
        if (newRange.from && newRange.to) {
            applyServerFilters({ from_date: newRange.from, to_date: newRange.to });
        }
    };

    // Sorting (Client Side on Loaded Data)
    const sortedData = useMemo(() => {
        let items = [...allOrders];
        return items.sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
            const valA = resolveValue(a, sortConfig.key);
            const valB = resolveValue(b, sortConfig.key);
            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
        });
    }, [allOrders, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    function resolveValue(item, key) {
        switch (key) {
            case 'date': return item.created_at;
            case 'order_number': return item.order_number;
            case 'party_name': return item.customer?.name || 'Walk-in';
            case 'total_amount': return parseFloat(item.total_amount);
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

    // Formatters
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <OneGlanceLayout title="Pre-Orders" activeMenu="Sell">
            <Head title="Pre-Orders" />
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <SellModuleTabs activeTab="pre-sales" />

                {/* Stats Cards - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <ShoppingBag size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.order_count || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Confirmed</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{stats?.confirmed_count || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{stats?.pending_count || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <History size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Value</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(stats?.total_orders || 0, store)}</p>
                    </div>
                </div>

                {/* Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Pre-<span className="text-indigo-600">Orders</span>
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
                            onClick={() => applyFilterType('confirmed')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Confirmed</button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-52">
                            <SmartCombobox
                                items={allOrders}
                                value={searchTerm}
                                onQueryChange={handleSearch}
                                onSelect={(item) => { handleServerSearch(item); }}
                                placeholder="Search orders..."
                                displayKey="order_number"
                                filterKey="order_number"
                                inputClassName="py-1.5 text-xs h-9"
                            />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link href={route('store.pre-sales.create', { store_slug: store?.slug })} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors">
                                <Plus size={14} /> New Pre-Order
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Orders Table */}
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
                                                <ShoppingBag size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No pre-orders found</p>
                                            <p className="text-sm text-slate-500 mb-4">Create your first pre-order to get started</p>
                                            <Link
                                                href={route('store.pre-sales.create', { store_slug: store?.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Create Pre-Order
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
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
                                                        case 'date': return <span className="font-medium">{formatDate(row.created_at)}</span>;
                                                        case 'order_number': return <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.order_number}</span>;
                                                        case 'party_name':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold">{row.customer?.name || 'Walk-in'}</p>
                                                                    {row.customer?.phone && <p className="text-xs text-slate-400">{row.customer.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'transaction': return <span className="text-xs font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded-md">Pre-Order</span>;
                                                        case 'total_amount': return <span className="font-bold">{formatCurrency(row.total_amount, store)}</span>;
                                                        case 'balance':
                                                            const paid = parseFloat(row.paid_amount || 0);
                                                            const balance = parseFloat(row.total_amount) - paid;
                                                            if (balance > 1) return <span className="text-red-500 font-bold">{formatCurrency(balance, store)}</span>;
                                                            if (balance < -1) return <span className="text-blue-600 font-bold" title="Overpaid Amount">+{formatCurrency(Math.abs(balance), store)}</span>;
                                                            return <span className="text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Settled</span>;
                                                        case 'due_date': return <span className="text-slate-400">{row.due_date ? formatDate(row.due_date) : '-'}</span>;
                                                        case 'status':
                                                            let status = row.status || 'pending';
                                                            const statusStyles = {
                                                                confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                                                pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                                                cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                                                                converted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                            };
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative" onClick={(e) => e.stopPropagation()}>
                                                                    <a href={route("store.sales.print", [store.slug, row.id])} target="_blank" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                                                                        <Printer size={16} />
                                                                    </a>
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-indigo-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    <Link href={route('store.sales.orders.show', { store_slug: store?.slug, order: row.id })} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Edit size={14} /> View/Edit</Link>
                                                                                     <button onClick={async () => {
                                                                                        // Rule 3: Smart Check
                                                                                        try {
                                                                                            const items = row.items || [];
                                                                                            let isStockAvailable = true;
                                                                                            for (const item of items) {
                                                                                                const res = await axios.get(route("store.inventory.search", {
                                                                                                    store_slug: store.slug
                                                                                                }), { params: { query: item.product?.sku || item.product?.name } });
                                                                                                const prod = res.data?.find(p => p.id === item.product_id);
                                                                                                if (prod && (prod.available_stock || 0) < item.quantity) {
                                                                                                    isStockAvailable = false;
                                                                                                    break;
                                                                                                }
                                                                                            }

                                                                                            if (isStockAvailable) {
                                                                                                showConfirm?.({
                                                                                                    title: 'Convert Sale?',
                                                                                                    message: 'Convert this pre-order to a sale? Stock will be deducted.',
                                                                                                    type: 'warning',
                                                                                                    confirmLabel: 'Convert',
                                                                                                    onConfirm: () => router.post(route('store.pre-sales.convert', { store_slug: store?.slug, order: row.id }))
                                                                                                });
                                                                                            } else {
                                                                                                showConfirm?.({
                                                                                                    title: 'Stock Not Available',
                                                                                                    message: 'Stock not available. Confirm backorder delivery or cancel?',
                                                                                                    type: 'error',
                                                                                                    confirmLabel: 'Confirm Backorder',
                                                                                                    onConfirm: () => router.post(route('store.pre-sales.convert', { store_slug: store?.slug, order: row.id }))
                                                                                                });
                                                                                            }
                                                                                        } catch (err) {
                                                                                            // Fallback if check fails
                                                                                                    router.post(route('store.pre-sales.convert', { store_slug: store?.slug, order: row.id }));
                                                                                        }
                                                                                    }} className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm text-emerald-600"><ShoppingCart size={14} /> Convert To Sale</button>
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Truck size={14} /> Delivery Challan</button>
                                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                                    <button onClick={() => {
                                                                                        showConfirm?.({
                                                                                            title: 'Cancel Order?',
                                                                                            message: 'Are you sure you want to cancel this order?',
                                                                                            type: 'error',
                                                                                            confirmLabel: 'Cancel Order',
                                                                                            onConfirm: () => router.post(route('store.sales-orders.cancel', { store_slug: store?.slug, salesOrder: row.id }))
                                                                                        });
                                                                                    }} className="w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600"><XCircle size={14} /> Cancel Order</button>
                                                                                     <button onClick={() => { showConfirm?.({ title: 'Delete Pre-Sale?', message: 'Are you sure you want to delete this order? It will be moved to the Recycle Bin.', type: 'error', confirmLabel: 'Delete', onConfirm: () => router.delete(route('store.pre-sales.destroy', { store_slug: store?.slug, order: row.id }), { onSuccess: () => setAllOrders(prev => prev.filter(o => o.id !== row.id)) }) }); }} className="w-full text-left px-3 py-2 hover:bg-red-100 rounded dark:hover:bg-red-900/30 flex items-center gap-2 text-sm text-red-700 dark:text-red-400 font-bold"><Trash2 size={14} /> Delete</button>
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
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pre-Order Preview</p>
                                    <h3 className="text-xl font-black text-indigo-600">{quickViewItem.order_number}</h3>
                                </div>
                                {(() => {
                                    const statusStyles = {
                                        confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                        cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                                        converted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                    };
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[quickViewItem.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {quickViewItem.status}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={route('store.sales-orders.print', { store_slug: store?.slug, salesOrder: quickViewItem.id })}
                                    target="_blank"
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                    <Printer size={14} /> Print
                                </a>
                                <Link
                                    href={route('store.sales.orders.show', { store_slug: store?.slug, order: quickViewItem.id })}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                >
                                    <Edit size={14} /> Edit Order
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{quickViewItem.customer?.name || 'Walk-in'}</p>
                                    {quickViewItem.customer?.phone && (
                                        <p className="text-xs text-slate-500">{quickViewItem.customer.phone}</p>
                                    )}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Order Date</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewItem.created_at)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewItem.due_date) || 'Not set'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Total</p>
                                    <p className="font-black text-indigo-600 text-lg">{formatCurrency(quickViewItem.total_amount, store)}</p>
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
                                    <div className="flex justify-end gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase">Paid</p>
                                            <p className="font-bold text-emerald-600">{formatCurrency(quickViewItem.paid_amount || 0, store)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase">Balance</p>
                                            <p className="font-bold text-red-600">{formatCurrency((quickViewItem.total_amount || 0) - (quickViewItem.paid_amount || 0), store)}</p>
                                        </div>
                                        <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-8">
                                            <p className="text-[10px] text-indigo-600 uppercase font-bold">Grand Total</p>
                                            <p className="font-black text-lg text-indigo-600">{formatCurrency(quickViewItem.total_amount, store)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {quickViewItem.status !== 'converted' && quickViewItem.status !== 'cancelled' && (
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        onClick={async () => {
                                            // Rule 3: Smart Check
                                            try {
                                                const items = quickViewItem.items || [];
                                                let isStockAvailable = true;
                                                for (const item of items) {
                                                    const res = await axios.get(route("store.inventory.search", {
                                                        store_slug: store.slug
                                                    }), { params: { query: item.product?.sku || item.product?.name } });
                                                    const prod = res.data?.find(p => p.id === item.product_id);
                                                    if (prod && (prod.available_stock || 0) < item.quantity) {
                                                        isStockAvailable = false;
                                                        break;
                                                    }
                                                }

                                                setQuickViewItem(null);
                                                if (isStockAvailable) {
                                                    showConfirm?.({
                                                        title: 'Convert to Sale?',
                                                        message: 'Convert this pre-order to a sale? Stock will be deducted.',
                                                        type: 'warning',
                                                        confirmLabel: 'Convert',
                                                        onConfirm: () => router.post(route('store.pre-sales.convert', { store_slug: store?.slug, order: quickViewItem.id }))
                                                    });
                                                } else {
                                                    showConfirm?.({
                                                        title: 'Stock Not Available',
                                                        message: 'Stock not available. Confirm backorder delivery or cancel?',
                                                        type: 'error',
                                                        confirmLabel: 'Confirm Backorder',
                                                        onConfirm: () => router.post(route('store.pre-sales.convert', { store_slug: store?.slug, order: quickViewItem.id }))
                                                    });
                                                }
                                            } catch (err) {
                                                setQuickViewItem(null);
                                                router.post(route('store.pre-sales.convert', { store_slug: store?.slug, order: quickViewItem.id }));
                                            }
                                        }}
                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                    >
                                        <ShoppingCart size={16} /> Convert to Sale
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0">
                            <p className="text-[10px] text-slate-400">Double-click row to view/edit • Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">Esc</kbd> to close</p>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
