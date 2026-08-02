import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
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
    ChevronDown,
    CornerUpRight,
    TrendingUp,
    TrendingDown,
    ArrowUpCircle,
    ArrowDownCircle,
    Download,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';

export default function TransactionsIndex({ transactions = { data: [], current_page: 1, last_page: 1, total: 0, next_page_url: null }, stats = {}, store }) {
    // Infinite Scroll State
    const [allTransactions, setAllTransactions] = useState(transactions.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(transactions.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Mobile responsiveness toggle states
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Sync State
    useEffect(() => {
        if (transactions.data && transactions.current_page === 1) {
            setAllTransactions(transactions.data);
            setNextPageUrl(transactions.next_page_url);
        }
    }, [transactions]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllTransactions(prev => {
                const existingIds = new Set(prev.map(t => `${t.id}-${t.type}`));
                const uniqueNew = newItems.filter(t => !existingIds.has(`${t.id}-${t.type}`));
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

    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '12%' },
        { key: 'reference', label: 'Invoice No', width: '12%' },
        { key: 'party_name', label: 'Party Name', width: '18%' },
        { key: 'type', label: 'Type', width: '10%' },
        { key: 'amount', label: 'Amount', width: '12%', align: 'right' },
        { key: 'balance_due', label: 'Balance', width: '12%', align: 'right' },
        { key: 'payment_status', label: 'Status', width: '10%' }
    ]);

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [activeSharePopup, setActiveSharePopup] = useState(null);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Sorting & Filtering
    const processData = useMemo(() => {
        let result = [...allTransactions];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                (item.reference && item.reference.toLowerCase().includes(term)) ||
                (item.party?.name && item.party.name.toLowerCase().includes(term)) ||
                String(item.amount).includes(term)
            );
        }

        if (typeFilter !== 'all') {
            result = result.filter(item => item.type === typeFilter);
        }

        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'party_name') {
                valA = a.party?.name || '';
                valB = b.party?.name || '';
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allTransactions, searchTerm, sortConfig, typeFilter]);

    useEffect(() => {
        const handleClickOutside = () => {
            setActiveActionMenu(null);
            setActiveSharePopup(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-indigo-500" />
            : <ChevronDown size={14} className="text-indigo-500" />;
    };

    const getTypeConfig = (type) => {
        const configs = {
            sale: { label: 'Sale', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            purchase: { label: 'Purchase', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown },
            expense: { label: 'Expense', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle },
            payment_in: { label: 'Received', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', icon: ArrowDownCircle },
            payment_out: { label: 'Paid', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', icon: ArrowUpCircle },
            return: { label: 'Return', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: CornerUpRight }
        };
        return configs[type] || { label: type, color: 'bg-slate-100 text-slate-700', icon: FileText };
    };


    return (
        <OneGlanceLayout title="Transactions" activeMenu="Money">
            <Head title="Transactions" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="all" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="sm:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1 text-2xs font-bold text-slate-500 uppercase shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {!isStatsExpanded && (
                        <div className="text-2xs font-bold text-slate-500 truncate">
                            <span className="text-emerald-600">Sales: {formatCurrency(stats.total_debit || 0, store)}</span>
                            <span className="mx-1">|</span>
                            <span className="text-red-600 dark:text-red-400">Due: {formatCurrency(stats.total_balance_due || 0, store)}</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden sm:grid'}`}>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                <FileText size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Count</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-none mt-1 sm:mt-0">{stats.count || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                                <TrendingUp size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Total Sales</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-emerald-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_debit || 0, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                <ArrowDownCircle size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Received</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-blue-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_credit || 0, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                                <ArrowUpCircle size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Unpaid / Due</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-red-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_balance_due || 0, store)}</p>
                    </div>
                </div>

                {/* Mobile Toolbar (sm:hidden) */}
                <div className="sm:hidden flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center justify-between px-3 py-2">
                        <h1 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            Transactions <span className="text-indigo-600">History</span>
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileSearch ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Search"
                            >
                                <Search size={14} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileFilters ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Filter Type"
                            >
                                <Filter size={14} />
                            </button>
                            <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-0.5 gap-0.5">
                                <button className="p-1 text-emerald-600" title="Export">
                                    <Download size={14} />
                                </button>
                                <button className="p-1 text-slate-500" title="Print">
                                    <Printer size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Expandable Mobile Search */}
                    {showMobileSearch && (
                        <div className="px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200">
                            <div className="relative w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search ref or party..."
                                    className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                            </div>
                        </div>
                    )}

                    {/* Expandable Mobile Filters panel */}
                    {showMobileFilters && (
                        <div className="px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200">
                            <div className="flex items-center gap-1.5">
                                <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Type:</span>
                                <div className="flex bg-slate-100 dark:bg-slate-850 rounded-lg p-1 gap-1 flex-1">
                                    <button
                                        onClick={() => { setTypeFilter('all'); setShowMobileFilters(false); }}
                                        className={`flex-1 text-center py-1 rounded text-3xs font-bold uppercase transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                    >All</button>
                                    <button
                                        onClick={() => { setTypeFilter('sale'); setShowMobileFilters(false); }}
                                        className={`flex-1 text-center py-1 rounded text-3xs font-bold uppercase transition-all ${typeFilter === 'sale' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                    >Sales</button>
                                    <button
                                        onClick={() => { setTypeFilter('purchase'); setShowMobileFilters(false); }}
                                        className={`flex-1 text-center py-1 rounded text-3xs font-bold uppercase transition-all ${typeFilter === 'purchase' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                    >Purchases</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Header Bar (sm:flex, hidden on mobile) */}
                <div className="hidden sm:flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Type Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Transaction <span className="text-indigo-600">History</span>
                        </h1>
                        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${typeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => setTypeFilter('sale')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${typeFilter === 'sale' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Sales</button>
                        <button
                            onClick={() => setTypeFilter('purchase')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${typeFilter === 'purchase' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Purchases</button>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search ref or party..."
                                className="pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
                            />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={14} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print">
                                <Printer size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                    {tableColumns.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className={`p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${col.align === 'right' ? 'text-right' : ''}`}
                                            style={{ width: col.width }}
                                        >
                                            <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                                {col.label} <SortIcon columnKey={col.key} />
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-[10%]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {processData.length > 0 ? (
                                    processData.map((row) => {
                                        const typeConfig = getTypeConfig(row.type);
                                        const Icon = typeConfig.icon;

                                        return (
                                            <tr key={row.id + '-' + row.type} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group">
                                                <td className="p-3">
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                        {formatDate(row.date)}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        {row.reference}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                                                            {row.party?.name || 'Walk-in Customer'}
                                                        </p>
                                                        {row.party?.phone && <p className="text-2xs text-slate-400">{row.party.phone}</p>}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-2xs font-bold uppercase ${typeConfig.color}`}>
                                                        <Icon size={10} />
                                                        {typeConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                                                        {formatCurrency(row.amount, store)}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {row.balance_due > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                                                            {formatCurrency(row.balance_due, store)}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-2xs font-bold uppercase">
                                                            Settled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`text-2xs font-bold uppercase ${row.payment_status === 'paid' ? 'text-emerald-600' :
                                                        row.payment_status === 'partial' ? 'text-amber-600' :
                                                            row.payment_status === 'unpaid' ? 'text-red-600' : 'text-slate-500'
                                                        }`}>
                                                        {row.payment_status || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right text-slate-500">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600" title="Print">
                                                            <Printer size={14} />
                                                        </button>
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveActionMenu(activeActionMenu === row.id ? null : row.id)}
                                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700"
                                                            >
                                                                <MoreVertical size={14} />
                                                            </button>
                                                            {activeActionMenu === row.id && (
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-950 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-50 animate-in zoom-in-95">
                                                                    <button className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded text-xs font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                                        <Eye size={12} /> View Details
                                                                    </button>
                                                                    <button className="w-full text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded text-xs font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                                        <FileText size={12} /> PDF Invoice
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                                                                    <button className="w-full text-left px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs font-medium flex items-center gap-2 text-red-600">
                                                                        <Trash2 size={12} /> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={tableColumns.length + 1} className="p-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText size={24} className="opacity-50" />
                                                <p className="text-sm font-medium">No transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Stacked Cards List View */}
                    <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-200">
                        {processData.length > 0 ? (
                            processData.map((row) => {
                                const typeConfig = getTypeConfig(row.type);
                                const Icon = typeConfig.icon;

                                return (
                                    <div key={row.id + '-' + row.type} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/10 flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xs text-slate-500 font-medium font-mono">
                                                {formatDate(row.date)}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase ${typeConfig.color}`}>
                                                <Icon size={8} />
                                                {typeConfig.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-slate-850 dark:text-white break-all">
                                                Ref: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{row.reference}</span>
                                            </p>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                                {row.party?.name || 'Walk-in Customer'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-1xs pt-1.5 border-t border-dashed border-slate-150 dark:border-slate-800 mt-1">
                                            <div className="flex gap-2">
                                                <span className="text-slate-800 dark:text-white font-mono font-bold">Amt: {formatCurrency(row.amount, store)}</span>
                                                {row.balance_due > 0 && (
                                                    <span className="text-red-600 dark:text-red-400 font-mono font-bold">Due: {formatCurrency(row.balance_due, store)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-3xs font-bold uppercase ${row.payment_status === 'paid' ? 'text-emerald-600' :
                                                    row.payment_status === 'partial' ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                    {row.payment_status || '-'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 relative"
                                                >
                                                    <MoreVertical size={12} />
                                                    {activeActionMenu === row.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-950 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-50 animate-in zoom-in-95">
                                                            <button className="w-full text-left px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded text-2xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                                <Eye size={10} /> View Details
                                                            </button>
                                                            <button className="w-full text-left px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded text-2xs font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                                <FileText size={10} /> PDF Invoice
                                                            </button>
                                                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5"></div>
                                                            <button className="w-full text-left px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-2xs font-medium flex items-center gap-1.5 text-red-600">
                                                                    <Trash2 size={10} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-xs">
                                <FileText size={20} className="mx-auto mb-1.5 opacity-50" />
                                No transactions found
                            </div>
                        )}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0">
                        {nextPageUrl ? 'Loading...' : (allTransactions.length > 0 ? 'End of list' : '')}
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 bg-white dark:bg-slate-900 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="text-xs text-slate-400 font-medium">
                        Showing {allTransactions.length} of {transactions.total} records (Filtered: {processData.length})
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
