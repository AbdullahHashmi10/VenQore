import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
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

 const [showMobileSearch, setShowMobileSearch] = useState(false);
 const [showMobileFilters, setShowMobileFilters] = useState(false);
 const [isStatsExpanded, setIsStatsExpanded] = useState(false);
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
 }, { preserveState: true, preserveScroll: true, replace: true });
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

 const applyFilterType = (type) => {
 setActiveFilter(type);
 applyFilters({ filter: type });
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

 const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

 return (
 <OneGlanceLayout title="Returns History" activeMenu="Sell">
 <Head title="Returns History" />
 <div className="flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative">
 <SellModuleTabs activeTab="returns" />

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
 <span className="text-brand-600 dark:text-brand-400">Total: {stats?.total_returns || 0}</span>
 <span className="text-neutral-300 dark:text-ink-secondary">|</span>
 <span className="text-emerald-600">Refunded: {formatCurrency(stats?.total_refunded || 0)}</span>
 </div>
 </div>
 )}
 </div>

 {/* Stats Cards Section */}
 <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
 <RefreshCcw size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Total Returns</p>
 </div>
 <p className="text-base font-bold text-ink">{stats?.total_returns || 0}</p>
 </div>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
 <History size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">This Month</p>
 </div>
 <p className="text-base font-bold text-amber-600">{stats?.this_month || 0}</p>
 </div>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
 <Package size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Items Returned</p>
 </div>
 <p className="text-base font-bold text-ink">{stats?.items_returned || 0}</p>
 </div>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
 <CheckSquare size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Total Refunded</p>
 </div>
 <p className="text-base font-bold text-emerald-600">{formatCurrency(stats?.total_refunded || 0)}</p>
 </div>
 </div>

 {/* PC / Desktop Header Area (Hidden on Mobile) */}
 <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
 {/* Left: Title + Filter Pills */}
 <div className="flex items-center gap-2 flex-wrap">
 <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
 Returns <span className="text-brand-600">History</span>
 </h1>
 <div className="h-4 w-px bg-sunken mx-1"></div>
 <button
 onClick={() => { setActiveFilter('all'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'all', start_date: '', end_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >All</button>
 <button
 onClick={() => { setActiveFilter('today'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'today', start_date: '', end_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >Today</button>
 <button
 onClick={() => setActiveFilter('custom')}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-brand text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >Custom</button>
 {/* Custom Date Range */}
 {activeFilter === 'custom' && (
 <div className="flex items-center gap-1.5 ml-1">
 <input type="date" name="from" value={dateRange.from} onChange={handleDateChange}
 className="px-2 py-0.5 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-brand-500" />
 <span className="text-ink-muted text-xs">→</span>
 <input type="date" name="to" value={dateRange.to} onChange={handleDateChange}
 className="px-2 py-0.5 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-brand-500" />
 </div>
 )}
 </div>

 {/* Right: Search + Actions */}
 <div className="flex items-center gap-2">
 <div className="w-64 relative">
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyDown={handleServerSearch}
 placeholder="Search returns..."
 className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
 />
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
 </div>
 <div className="flex items-center gap-2 border-l border-line pl-2">
 <Link
 href={route('store.returns.create', { store_slug: store.slug })}
 className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95"
 >
 <Plus size={18} />
 <span className="text-sm font-bold hidden sm:inline">New Return</span>
 </Link>
 <button className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print" onClick={() => window.print()}>
 <Printer size={18} />
 </button>
 </div>
 </div>
 </div>

 {/* Mobile Layout Header Area */}
 <div className="flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
 <div className="flex items-center justify-between w-full">
 <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
 Returns History
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
 <ChevronDown size={16} />
 </button>
 <Link
 href={route('store.returns.create', { store_slug: store.slug })}
 className="p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors"
 title="New Return"
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
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyDown={handleServerSearch}
 placeholder="Search returns..."
 className="w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
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
 </div>
 </div>
 )}
 </div> {/* Main Table */}
 <div className="flex-1 overflow-auto md:rounded-xl md:border md:border-line md:dark:border-line md:shadow-sm bg-transparent md:bg-white md:dark:bg-app">
 <table className="hidden md:table w-full text-left border-collapse">
 <thead>
 <tr className="bg-app border-b border-line sticky top-0 z-10">
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
 cursor-pointer select-none hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors
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
 <tbody className="divide-y divide-line">
 {sortedReturns.length === 0 ? (
 <tr>
 <td colSpan={tableColumns.length} className="p-12">
 <div className="flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4">
 <RefreshCcw size={32} className="text-ink-muted" />
 </div>
 <p className="text-lg font-bold text-ink-secondary mb-1">No returns found</p>
 <p className="text-sm text-ink-muted mb-4">Returns will appear here exactly when they happen</p>
 <Link
 href={route('store.returns.create', { store_slug: store.slug })}
 className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
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
 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-brand-400
`}
 >
 {tableColumns.map((col) => (
 <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-ink-secondary">
 {(() => {
 switch (col.key) {
 case 'date': return <span className="font-medium">{formatDate(row.created_at)}</span>;
 case 'reference':
 return (
 <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{row.reference_number || `RET-${row.id}`}</span>
 );
 case 'customer':
 return (
 <div>
 <p className="font-semibold">{row.customer?.name || 'Walk-in'}</p>
 {row.customer?.phone && <p className="text-xs text-ink-muted">{row.customer.phone}</p>}
 </div>
 );
 case 'items': return <span className="font-bold">{row.items?.length || 0}</span>;
 case 'amount': return <span className="font-bold text-emerald-600">{formatCurrency(row.total)}</span>;
 case 'method': return <span className="uppercase text-xs font-semibold">{row.payment_method || '-'}</span>;
 case 'status':
 return <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-secondary">{row.status}</span>;
 case 'actions':
 return (
 <div className="flex items-center justify-end gap-2 relative">
 <div className="relative">
 <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-brand-600 bg-sunken' : 'text-ink-muted hover:bg-interactive-hover'}`}>
 <MoreVertical size={16} />
 </button>
 {activeActionMenu === row.id && (
 <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
 <div className="py-1">
 <Link href={route("store.sales.show", [store.slug, row.id])} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <Eye size={14} /> View Details
 </Link>
 <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); setActiveActionMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
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

 {/* Mobile View - Cards List */}
 <div className="md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent">
 {sortedReturns.length === 0 ? (
 <div className="bg-surface rounded-xl p-8 text-center border border-line">
 <RefreshCcw size={32} className="mx-auto text-ink-muted mb-2" />
 <p className="text-sm font-bold text-ink-secondary">No returns found</p>
 </div>
 ) : (
 sortedReturns.map((row) => (
 <div
 key={row.id}
 onClick={() => setQuickViewReturn(row)}
 className="bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer"
 >
 <div className="flex justify-between items-start">
 <div>
 <span className="font-mono text-xs text-brand-600 dark:text-brand-400 font-bold">{row.reference_number || `RET-${row.id}`}</span>
 <p className="text-2xs text-ink-muted mt-0.5">{formatDate(row.created_at)}</p>
 </div>
 <span className="px-2 py-0.5 rounded-md text-2xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-secondary">
 {row.status}
 </span>
 </div>

 <div className="flex justify-between items-center border-t border-b border-line py-2.5">
 <div>
 <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Customer</p>
 <p className="text-sm font-bold text-ink mt-0.5">{row.customer?.name || 'Walk-in'}</p>
 </div>
 <div className="text-right">
 <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Refund Amount</p>
 <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(row.total)}</p>
 </div>
 </div>

 <div className="flex justify-between items-center text-xs">
 <div>
 Items: <span className="font-bold">{row.items?.length || 0}</span> • Method: <span className="uppercase font-bold">{row.payment_method || '-'}</span>
 </div>
 <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
 <button
 onClick={() => PrintService.quickPrint(row)}
 className="p-1.5 bg-app rounded-lg text-ink-muted hover:text-brand-600 transition-colors border border-line"
 >
 <Printer size={14} />
 </button>
 <Link
 href={route("store.sales.show", [store.slug, row.id])}
 className="px-3 py-1.5 bg-app border border-line rounded-lg font-bold text-ink-secondary hover:bg-interactive-hover transition-colors"
 >
 View
 </Link>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Infinite Scroll Sentinel */}
 <div ref={observerTarget} className="p-4 text-center text-ink-muted text-sm border-t border-line opacity-0">
 {nextPageUrl ? 'Loading...' : (sortedReturns.length > 0 ? 'End of list' : '')}
 </div>
 </div>
 </div>
 {/* Quick View Modal */}
 {quickViewReturn && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-normal" onClick={() => setQuickViewReturn(null)}>
 <div
 className="quick-view-modal w-full max-w-2xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between p-4 border-b border-line bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 shrink-0">
 <div>
 <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Return Details</p>
 <h3 className="text-xl font-bold text-brand-600">{quickViewReturn.reference_number || `RET-${quickViewReturn.id}`}</h3>
 </div>
 <button
 onClick={() => setQuickViewReturn(null)}
 className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors"
 >
 <X size={18} />
 </button>
 </div>
 <div className="p-6 overflow-auto">
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div className="p-4 bg-app rounded-xl">
 <p className="text-xs font-bold text-ink-muted uppercase mb-1">Customer</p>
 <p className="font-bold text-ink">{quickViewReturn.customer?.name || 'Walk-in'}</p>
 <p className="text-sm text-ink-muted">{quickViewReturn.customer?.phone}</p>
 </div>
 <div className="p-4 bg-app rounded-xl">
 <p className="text-xs font-bold text-ink-muted uppercase mb-1">Refund Amount</p>
 <p className="font-bold text-emerald-600 text-lg">{formatCurrency(quickViewReturn.total)}</p>
 <p className="text-sm text-ink-muted uppercase">{quickViewReturn.payment_method || 'Cash'}</p>
 </div>
 </div>

 <h4 className="font-bold text-ink mb-3">Returned Items</h4>
 <div className="border border-line rounded-xl overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-app border-b border-line">
 <tr>
 <th className="px-4 py-2 text-left text-xs font-bold text-ink-muted uppercase">Item</th>
 <th className="px-4 py-2 text-center text-xs font-bold text-ink-muted uppercase">Qty</th>
 <th className="px-4 py-2 text-right text-xs font-bold text-ink-muted uppercase">Price</th>
 <th className="px-4 py-2 text-right text-xs font-bold text-ink-muted uppercase">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {quickViewReturn.items?.map((item, idx) => (
 <tr key={idx}>
 <td className="px-4 py-3 font-medium text-ink-secondary">{item.product?.name || item.name}</td>
 <td className="px-4 py-3 text-center text-ink-secondary">{item.quantity}</td>
 <td className="px-4 py-3 text-right text-ink-secondary">{formatCurrency(item.price || item.unit_price || 0)}</td>
 <td className="px-4 py-3 text-right font-bold text-ink">{formatCurrency((item.price || 0) * item.quantity)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mt-6 flex justify-end gap-3">
 <button
 onClick={() => PrintService.quickPrint(quickViewReturn)}
 className="px-4 py-2 bg-sunken text-ink-secondary font-bold rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center gap-2"
 >
 <Printer size={16} /> Print Receipt
 </button>
 <Link
 href={route("store.sales.show", [store.slug, quickViewReturn.id])}
 className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
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
