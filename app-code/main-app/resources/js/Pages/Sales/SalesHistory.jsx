import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency, formatDate, formatTime } from '@/Utils/format';
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
 Filter
} from 'lucide-react';
import SellModuleTabs from '@/Components/SellModuleTabs';
import PrintService from '@/Utils/PrintService';
import PrintButton from '@/Components/PrintButton';

const AmazonLogo = ({ size = 12 }) => (
 <svg viewBox="0 0 16 16" style={{ width: size, height: size, display: 'block' }}>
 <path fill="#ffffff" d="M10.813 11.968c.157.083.36.074.5-.05l.005.005a90 90 0 0 1 1.623-1.405c.173-.143.143-.372.006-.563l-.125-.17c-.345-.465-.673-.906-.673-1.791v-3.3l.001-.335c.008-1.265.014-2.421-.933-3.305C10.404.274 9.06 0 8.03 0 6.017 0 3.77.75 3.296 3.24c-.047.264.143.404.316.443l2.054.22c.19-.009.33-.196.366-.387.176-.857.896-1.271 1.703-1.271.435 0 .929.16 1.188.55.264.39.26.91.257 1.376v.432q-.3.033-.621.065c-1.113.114-2.397.246-3.36.67C3.873 5.91 2.94 7.08 2.94 8.798c0 2.2 1.387 3.298 3.168 3.298 1.506 0 2.328-.354 3.489-1.54l.167.246c.274.405.456.675 1.047 1.166ZM6.03 8.431C6.03 6.627 7.647 6.3 9.177 6.3v.57c.001.776.002 1.434-.396 2.133-.336.595-.87.961-1.465.961-.812 0-1.286-.619-1.286-1.533" />
 <path fill="#FF9900" d="M.435 12.174c2.629 1.603 6.698 4.084 13.183.997.28-.116.475.078.199.431C13.538 13.96 11.312 16 7.57 16 3.832 16 .968 13.446.094 12.386c-.24-.275.036-.4.199-.299z" />
 <path fill="#FF9900" d="M13.828 11.943c.567-.07 1.468-.027 1.645.204.135.176-.004.966-.233 1.533-.23.563-.572.961-.762 1.115s-.333.094-.23-.137c.105-.23.684-1.663.455-1.963-.213-.278-1.177-.177-1.625-.13l-.09.009q-.142.013-.233.024c-.193.021-.245.027-.274-.032-.074-.209.779-.556 1.347-.623" />
 </svg>
);

const TikTokLogo = ({ size = 12 }) => (
 <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: 'block' }}>
 <path fill="#69C9D0" transform="translate(-0.6, -0.3)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
 <path fill="#EE1D52" transform="translate(0.6, 0.3)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
 <path fill="#ffffff" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z"/>
 </svg>
);

const EbayLogo = ({ size = 12 }) => {
 const scale = size / 28;
 const width = 44 * scale;
 const height = 18 * scale;
 return (
 <svg viewBox="0 0 1000 400.75" style={{ width, height, display: 'block' }}>
 <path fill="#f12c2d" d="m 199.63633,185.86602 c -1.94427,-46.87735 -35.77951,-64.41973 -71.94139,-64.41973 -38.99421,0 -70.12667,19.7327 -75.58026,64.41973 z M 51.034408,219.1909 c 2.704332,45.48365 34.069782,72.38437 77.197532,72.38437 29.88033,0 56.45979,-12.17498 65.35948,-38.66041 h 51.68424 c -10.05205,53.73979 -67.15384,71.98058 -116.303,71.98058 C 39.606424,324.89544 0,275.67889 0,209.30653 0,136.24203 40.965642,88.12194 129.78809,88.12194 c 70.69867,0 122.49992,36.99926 122.49992,117.75572 v 13.31324 z" />
 <path fill="#0968f6" d="m 380.83181,290.6235 c 46.57228,0 78.44078,-33.52181 78.44078,-84.10854 0,-50.58203 -31.8685,-84.10854 -78.44078,-84.10854 -46.31058,0 -78.44392,33.52651 -78.44392,84.10854 0,50.58673 32.13334,84.10854 78.44392,84.10854 z M 252.2854,0 h 50.10249 l -0.005,125.87707 c 24.55682,-29.25975 58.38892,-37.75513 91.68976,-37.75513 55.83503,0 117.85132,37.6773 117.85132,119.02875 0,68.12232 -49.32155,117.74475 -118.78114,117.74475 -36.35726,0 -70.58062,-13.04265 -91.68663,-38.88294 0,10.32107 -0.57618,20.72364 -1.70503,30.56413 h -49.17162 c 0.85513,-15.90944 1.70555,-35.7184 1.70555,-51.74693 z" />
 <path fill="#ffbc13" d="m 633.07803,212.53323 c -45.43873,1.48929 -73.6715,9.689 -73.6715,39.61897 0,19.37591 15.44713,40.38162 54.66334,40.38162 52.57698,0 80.64259,-28.65902 80.64259,-75.66331 l 0.003,-5.16994 c -18.43302,0 -41.16414,0.16089 -61.63704,0.83266 z m 111.75103,62.10248 c 0,14.58313 0.42155,28.9782 1.69406,41.94092 h -46.61408 c -1.24325,-10.67368 -1.6972,-21.27945 -1.6972,-31.56656 -25.20195,30.97941 -55.17735,39.88537 -96.76149,39.88537 -61.67674,0 -94.70072,-32.59982 -94.70072,-70.30689 0,-54.61215 44.91583,-73.86739 122.89013,-75.65391 21.32332,-0.48686 45.27419,-0.55894 65.07531,-0.55894 l -0.003,-5.33606 c 0,-36.56098 -23.44364,-51.59335 -64.06765,-51.59335 -30.15876,0 -52.38579,12.48057 -54.6764,34.0468 h -52.65168 c 5.57217,-53.77165 62.06643,-67.37115 111.74005,-67.37115 59.50837,0 109.77228,21.17288 109.77228,84.11481 z" />
 <path fill="#93c822" d="M 1000,96.45747 845.05541,400.75099 H 788.94926 L 833.49578,316.25589 716.89033,96.45747 h 58.6266 l 85.80469,171.73057 85.56283,-171.73057 z" />
 </svg>
 );
};

export default function SalesIndex({ sales, filters, stats }) {
 const { auth, flash, store, vensynq_enabled } = usePage().props;
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
 const [showMobileSearch, setShowMobileSearch] = useState(false);
 const [showMobileFilters, setShowMobileFilters] = useState(false);
 const [isStatsExpanded, setIsStatsExpanded] = useState(false);

 const [tableColumns, setTableColumns] = useState([
 { key: 'date', label: 'Date', width: '12%' },
 { key: 'reference', label: 'Invoice No', width: '15%' },
 { key: 'party_name', label: 'Party Name', width: '15%' },
 { key: 'transaction', label: 'Transaction', width: '10%', className: 'hidden md:table-cell' },
 { key: 'payment_method', label: 'Payment Type', width: '10%', className: 'hidden md:table-cell' },
 { key: 'amount', label: 'Amount', width: '10%' },
 { key: 'balance', label: 'Balance', width: '10%', className: 'hidden md:table-cell' },
 { key: 'due_date', label: 'Due Date', width: '8%', className: 'hidden md:table-cell' },
 { key: 'status', label: 'Status', width: '10%' },
 { key: 'actions', label: 'Actions', width: '10%', frozen: true, className: 'hidden md:table-cell' }
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
 router.visit(route('store.sales.edit', { store_slug: store?.slug, sale: row.id }));
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

 // New Sale Buttons (Creating a space for them while respecting blueprint header)
 // The blueprint asks for a specific Header Area. I will place the buttons below tabs.

 return (
 <OneGlanceLayout title="Sales History" activeMenu="Sell">
 <Head title="Sales History" />

 <div className="flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative">



 <SellModuleTabs activeTab="orders" />

 {/* Mobile Stats Toggle/Summary (Visible below md) */}
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
 {/* Top line: Sales & Txns */}
 <div className="flex items-center gap-2">
 <span className="text-brand-600 dark:text-brand-400">Sale: {formatCurrency(stats?.total_sale || 0, store)}</span>
 <span className="text-neutral-300 dark:text-ink-secondary">|</span>
 <span className="text-blue-600 dark:text-blue-400">Txns: {stats?.transaction_count || 0}</span>
 </div>
 {/* Bottom line: Paid & Due */}
 <div className="flex items-center gap-2">
 <span className="text-emerald-600">Paid: {formatCurrency(stats?.total_paid || 0, store)}</span>
 <span className="text-neutral-300 dark:text-ink-secondary">|</span>
 <span className="text-rose-600">Due: {formatCurrency(stats?.total_unpaid || 0, store)}</span>
 </div>
 </div>
 )}
 </div>

 {/* Stats Cards Section */}
 <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
 <FileText size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Total Sale</p>
 </div>
 <p className="text-base font-bold text-ink">{formatCurrency(stats?.total_sale || 0, store)}</p>
 </div>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
 <CheckSquare size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Paid Amount</p>
 </div>
 <p className="text-base font-bold text-emerald-600">{formatCurrency(stats?.total_paid || 0, store)}</p>
 </div>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
 <Clock size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Unpaid (Due)</p>
 </div>
 <p className="text-base font-bold text-rose-600">{formatCurrency(stats?.total_unpaid || 0, store)}</p>
 </div>
 <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center">
 <div className="flex items-center gap-2">
 <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
 <History size={16} />
 </div>
 <p className="text-xs font-bold text-ink-muted uppercase">Transactions</p>
 </div>
 <p className="text-base font-bold text-ink">{stats?.transaction_count || 0}</p>
 </div>
 </div>

 {/* 1. Header Area - PC / Desktop Layout (Hidden on Mobile) */}
 <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
 {/* Left: Title + Filter Pills */}
 <div className="flex items-center gap-2 flex-wrap">
 <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
 Sales <span className="text-brand-600">Transactions</span>
 </h1>
 <div className="h-4 w-px bg-sunken mx-1"></div>
 <button
 onClick={() => { setActiveFilter('all'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'all', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >All</button>
 <button
 onClick={() => { setActiveFilter('today'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'today', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >Today</button>
 <button
 onClick={() => { setActiveFilter('month'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'month', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'month' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >This Month</button>
 <button
 onClick={() => { setActiveFilter('year'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'year', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'year' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >This Year</button>
 <button
 onClick={() => setActiveFilter('custom')}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-brand text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 >Custom</button>
 {/* Custom Date Range - Inline */}
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
 onChange={handleSearch}
 onKeyDown={handleServerSearch}
 placeholder="Search invoice, customer..."
 className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
 />
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
 </div>
 <div className="flex items-center gap-0.5 border-l border-line pl-2">
 <a href={route('store.sales.export', { ...filters, store_slug: store?.slug })} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
 <FileSpreadsheet size={18} />
 </a>
 <Link href={route('store.reports.analytics', { store_slug: store?.slug })} className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Analytics">
 <BarChart3 size={18} />
 </Link>
 <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print" onClick={() => window.print()}>
 <Printer size={18} />
 </button>
 </div>
 </div>
 </div>

 {/* 1. Header Area - Mobile Layout (4 Buttons) */}
 <div className="flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
 <div className="flex items-center justify-between w-full">
 <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
 Sales <span className="text-brand-600">Transactions</span>
 </h1>
 <div className="flex items-center gap-1">
 {/* Button 1: Search Toggle */}
 <button
 onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
 className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 title="Search"
 >
 <Search size={16} />
 </button>
 {/* Button 2: Filter Toggle */}
 <button
 onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
 className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
 title="Filters"
 >
 <Filter size={16} />
 </button>
 {/* Button 3: Spreadsheet/Export */}
 <a
 href={route('store.sales.export', { ...filters, store_slug: store?.slug })}
 className="p-2 bg-sunken text-emerald-600 hover:bg-interactive-hover rounded-lg transition-colors"
 title="Export spreadsheet"
 >
 <FileSpreadsheet size={16} />
 </a>
 {/* Button 4: Graph/Analytics */}
 <Link
 href={route('store.reports.analytics', { store_slug: store?.slug })}
 className="p-2 bg-sunken text-brand-600 hover:bg-interactive-hover rounded-lg transition-colors"
 title="View analytics graph"
 >
 <BarChart3 size={16} />
 </Link>
 </div>
 </div>

 {/* Expandable Search Input on Mobile */}
 {showMobileSearch && (
 <div className="w-full relative mt-1 border-t border-line pt-2">
 <input
 type="text"
 value={searchTerm}
 onChange={handleSearch}
 onKeyDown={handleServerSearch}
 placeholder="Search invoice, customer..."
 className="w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
 />
 <Search className="absolute left-3 top-[65%] -translate-y-1/2 text-ink-muted pointer-events-none" size={14} />
 </div>
 )}

 {/* Expandable Filters Panel on Mobile */}
 {showMobileFilters && (
 <div className="w-full mt-1 border-t border-line pt-2 flex flex-col gap-2">
 <div className="flex flex-wrap gap-1.5">
 <button
 onClick={() => { setActiveFilter('all'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'all', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
 >All</button>
 <button
 onClick={() => { setActiveFilter('today'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'today', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'today' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
 >Today</button>
 <button
 onClick={() => { setActiveFilter('month'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'month', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'month' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
 >This Month</button>
 <button
 onClick={() => { setActiveFilter('year'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'year', from_date: '', to_date: '' }); }}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'year' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
 >This Year</button>
 <button
 onClick={() => setActiveFilter('custom')}
 className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-brand text-white' : 'bg-sunken text-ink-muted'}`}
 >Custom</button>
 </div>
 {activeFilter === 'custom' && (
 <div className="flex items-center gap-1.5 mt-1">
 <input type="date" name="from" value={dateRange.from} onChange={handleDateChange}
 className="px-2 py-1 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-brand-500 flex-1" />
 <span className="text-ink-muted text-xs">→</span>
 <input type="date" name="to" value={dateRange.to} onChange={handleDateChange}
 className="px-2 py-1 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-brand-500 flex-1" />
 </div>
 )}
 </div>
 )}
 </div>

 {/* Bulk Action Bar */}
 {selectedSales.length > 0 && (
 <div className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg mb-2 animate-in slide-in-from-top-2">
 <span className="font-bold text-sm">{selectedSales.length} Selected</span>
 <div className="flex items-center gap-2">
 {isSuperAdmin && (
 <button
 onClick={handleBulkDelete}
 className="px-3 py-1 bg-white text-brand-600 rounded-lg text-xs font-bold hover:bg-interactive-hover transition-colors flex items-center gap-1"
 >
 <Trash2 size={14} /> Delete Selected
 </button>
 )}
 <button
 onClick={() => setSelectedSales([])}
 className="p-1 hover:bg-brand-700 rounded transition-colors"
 >
 <X size={16} />
 </button>
 </div>
 </div>
 )}

 {/* 2. Main Transactions Table */}
 <div className="flex-1 min-h-[calc(100vh-190px)] lg:min-h-0 overflow-auto md:rounded-xl md:border md:border-line md:dark:border-line md:shadow-sm bg-transparent md:bg-white md:dark:bg-app">
 <table className="hidden md:table w-full text-left border-collapse">
 <thead>
 <tr className="bg-app border-b border-line sticky top-0 z-10">
 <th className="p-2 md:p-4 w-8 md:w-10">
 <input
 type="checkbox"
 className="rounded border-line text-brand-600 focus:ring-brand-600"
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
 p-2 md:p-4 text-2xs md:text-xs font-bold text-ink-muted uppercase tracking-wider 
 cursor-pointer select-none hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors
 ${col.className || ''}
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
 {sortedSales.length === 0 ? (
 <tr>
 <td colSpan={tableColumns.length} className="p-12">
 <div className="flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4">
 <FileText size={32} className="text-ink-muted" />
 </div>
 <p className="text-lg font-bold text-ink-secondary mb-1">No sales found</p>
 <p className="text-sm text-ink-muted mb-4">Transactions will appear here once you create your first sale</p>
 <Link
 href={route('store.sales.invoice.create', { store_slug: store?.slug })}
 className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
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
 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer
 ${row.source === 'pos'
 ? 'bg-orange-50/30 dark:bg-orange-900/5 border-l-4 border-orange-500'
 : 'border-l-4 border-transparent hover:border-brand-400'
 }
 ${quickViewSale?.id === row.id ? 'ring-2 ring-brand-500 ring-inset bg-brand-50 dark:bg-brand-900/20' : ''}
`}
 >
 <td className="p-2 md:p-4 w-8 md:w-10 sticky left-0 z-10 bg-surface" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 className="rounded border-line text-brand-600 focus:ring-brand-600"
 checked={selectedSales.includes(row.id)}
 onChange={() => handleSelectRow(row.id)}
 />
 </td>
 {tableColumns.map((col) => (
 <td key={`${row.id}- ${col.key}`} className={`p-2 md:p-4 text-xs md:text-sm text-ink-secondary ${col.className || ''}`}>
 {(() => {
 switch (col.key) {
 case 'date': return <span className="font-medium">{formatDate(row.created_at)}</span>;
 case 'reference':
 return (
 <div className="flex items-center gap-2">
 <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{row.reference_number}</span>
 {row.source === 'pos' && (
 <span className="text-2xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded uppercase">POS</span>
 )}
 {row.is_dropship && (
 <span className="text-2xs font-bold bg-brand-50 border border-brand-100/50 text-brand-600 dark:bg-brand-950/40 dark:border-brand-900/40 dark:text-brand-400 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1.5">
 {row.ecommerce_channel?.platform === 'amazon' && <AmazonLogo size={12} />}
 {row.ecommerce_channel?.platform === 'tiktok' && <TikTokLogo size={12} />}
 {row.ecommerce_channel?.platform === 'ebay' && <EbayLogo size={12} />}
 {vensynq_enabled ? 'VenSynQ • ' : ''}{row.ecommerce_channel?.platform ? (row.ecommerce_channel.platform.toUpperCase()) : 'AMAZON'}
 </span>
 )}
 </div>
 );
 case 'party_name':
 return (
 <div>
 <p className="font-semibold">{row.customer?.name || 'Walk-in'}</p>
 {row.customer?.phone && <p className="text-xs text-ink-muted">{row.customer.phone}</p>}
 </div>
 );
 case 'transaction':
 const isReturn = row.status === 'returned' || (row.reference_number && row.reference_number.startsWith('RET'));
 return isReturn
 ? <span className="text-xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-1 rounded-md">Return</span>
 : <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-md">Sale</span>;
 case 'payment_method': return <span className="uppercase text-xs font-semibold">{row.payment_method || '-'}</span>;
 case 'amount': return <span className="font-bold">{formatCurrency(row.total, store)}</span>;
 case 'balance':
 const paid = parseFloat(row.paid_amount || (row.payment_status === 'paid' ? row.total : 0) || 0);
 const balance = parseFloat(row.total) - paid;
 // Tolerance of 1 for floating point diffs
 if (balance > 1) return <span className="text-red-500 font-bold">{formatCurrency(balance, store)}</span>;
 if (balance < -1) return <span className="text-blue-600 font-bold" title="Overpaid Amount">+{formatCurrency(Math.abs(balance), store)}</span>;
 return <span className="text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Settled</span>;
 case 'due_date': return <span className="text-ink-muted">-</span>;
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
 return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[status] || 'bg-sunken text-ink-secondary'}`}>{status}</span>;
 case 'actions':
 return (
 <div className="flex items-center justify-end gap-2 relative">
 {/* Print */}
 <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); }} className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors">
 <Printer size={16} />
 </button>
 {/* Share */}
 <div className="relative">
 <button onClick={(e) => { e.stopPropagation(); setActiveSharePopup(activeSharePopup === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? 'text-brand-600 bg-sunken' : 'text-ink-muted hover:bg-interactive-hover'}`}>
 <CornerUpRight size={16} />
 </button>
 {activeSharePopup === row.id && (
 <div className="absolute right-0 top-full mt-2 w-40 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm"><Mail size={14} className="text-red-500" /> Email</button>
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm"><MessageCircle size={14} className="text-green-500" /> WhatsApp</button>
 </div>
 )}
 </div>
 {/* More */}
 <div className="relative">
 <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-brand-600 bg-sunken' : 'text-ink-muted hover:bg-interactive-hover'}`}>
 <MoreVertical size={16} />
 </button>
 {activeActionMenu === row.id && (
 <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
 <div className="py-1">
 {/* 1. View/Edit - CONDITIONAL REDIRECT */}
 {row.source === 'pos' ? (
 <a href={route('store.pos', { store_slug: store?.slug }) + '?recall=' + row.id} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <Edit size={14} /> Open in POS
 </a>
 ) : (
 <Link href={route('store.sales.edit', { store_slug: store?.slug, sale: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <Edit size={14} /> View/Edit
 </Link>
 )}

 {/* 2. Convert To Return */}
 <Link href={route('store.sales.show', { store_slug: store?.slug, sale: row.id }) + '?action=return'} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><RefreshCcw size={14} /> Convert To Return</Link>

 {/* 3. Preview Delivery Challan */}
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><Truck size={14} /> Preview Delivery Challan</button>

 {/* 4. Payment History */}
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><History size={14} /> Payment History</button>

 {/* 5. Cancel Invoice */}
 <button onClick={async () => { if (await confirm('Cancel invoice? Stock will be restored.')) router.post(route('store.sales.cancel', { store_slug: store?.slug, sale: row.id })); }} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-red-600"><XCircle size={14} /> Cancel Invoice</button>

 <div className="h-px bg-sunken my-1"></div>

 {/* 6. Delete */}
 {isSuperAdmin && (
 <button
 onClick={() => {
 if (confirm('Are you sure you want to permanently delete this sale? This will restore stock.')) {
 router.delete(route('store.sales.destroy', { store_slug: store?.slug, sale: row.id }), {
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
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><Copy size={14} /> Duplicate</button>

 {/* 8. Open PDF */}
 <a href={route('store.sales.print', { store_slug: store?.slug, sale: row.id })} target="_blank" className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><FileText size={14} /> Open PDF</a>

 {/* 9. Preview */}
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><Eye size={14} /> Preview</button>

 {/* 10. Print */}
 <button onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); setActiveActionMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><Printer size={14} /> Print</button>

 {/* 11. View History */}
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"><Clock size={14} /> View History</button>
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

 {/* Mobile View - Cards List */}
 <div className="md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent">
 {sortedSales.length === 0 ? (
 <div className="bg-surface rounded-xl p-8 text-center border border-line">
 <FileText size={32} className="mx-auto text-ink-muted mb-2" />
 <p className="text-sm font-bold text-ink-secondary">No sales found</p>
 </div>
 ) : (
 sortedSales.map((row) => {
 const isReturn = row.status === 'returned' || (row.reference_number && row.reference_number.startsWith('RET'));
 const isPos = row.source === 'pos';
 const paid = parseFloat(row.paid_amount || (row.payment_status === 'paid' ? row.total : 0) || 0);
 const balance = parseFloat(row.total) - paid;
 return (
 <div
 key={row.id}
 onClick={() => handleRowClick(row)}
 className={`
 p-3 bg-surface rounded-xl border shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-brand-400 transition-colors
 ${quickViewSale?.id === row.id ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/20 dark:bg-brand-900/10' : ''}
 ${isPos ? 'border-orange-200 dark:border-orange-900/40' : 'border-line'}
`}
 >
 {/* Row 1: Party Name (Left), Invoice reference & Date (Right) */}
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-bold text-ink text-sm">
 {row.customer?.name || 'Walk-in'}
 </h3>
 {row.customer?.phone && (
 <p className="text-2xs text-ink-muted font-semibold">{row.customer.phone}</p>
 )}
 </div>
 <div className="text-right">
 <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block">
 {row.reference_number}
 </span>
 <span className="text-2xs text-ink-muted font-semibold block mt-0.5">
 {formatDate(row.created_at)}
 </span>
 </div>
 </div>

 {/* Row 2: Badges (Transaction type & payment status) */}
 <div className="flex items-center gap-1.5">
 {isReturn ? (
 <span className="text-3xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200/30">
 Return
 </span>
 ) : isPos ? (
 <span className="text-3xs font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200/30">
 POS Sale
 </span>
 ) : (
 <span className="text-3xs font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200/30">
 Sale
 </span>
 )}

 {(() => {
 let status = row.payment_status;
 const pAmt = parseFloat(row.paid_amount || (status === 'paid' ? row.total : 0));
 const tAmt = parseFloat(row.total);
 if (pAmt > tAmt + 1) status = 'overpaid';

 const statusStyles = {
 paid: 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20',
 partial: 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20',
 unpaid: 'bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20',
 overpaid: 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20'
 };
 return (
 <span className={`px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[status] || 'bg-sunken text-ink-secondary'}`}>
 {status}
 </span>
 );
 })()}
 </div>

 {/* Row 3: Totals & Action Icons */}
 <div className="flex items-center justify-between border-t border-line pt-2 mt-1">
 <div className="flex items-center gap-6">
 <div>
 <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Total</span>
 <span className="text-xs font-bold text-ink">
 {formatCurrency(row.total, store)}
 </span>
 </div>
 <div>
 <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Balance</span>
 {balance > 1 ? (
 <span className="text-xs font-bold text-rose-600 dark:text-rose-450">
 {formatCurrency(balance, store)}
 </span>
 ) : balance < -1 ? (
 <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
 +{formatCurrency(Math.abs(balance), store)}
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
 <button
 onClick={() => PrintService.quickPrint(row)}
 className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors"
 title="Print"
 >
 <Printer size={16} />
 </button>
 <div className="relative">
 <button
 onClick={() => setActiveSharePopup(activeSharePopup === row.id ? null : row.id)}
 className={`p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? 'text-brand-600 bg-sunken' : 'text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'}`}
 title="Share"
 >
 <CornerUpRight size={16} />
 </button>
 {activeSharePopup === row.id && (
 <div className="absolute right-0 bottom-full mb-2 w-40 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm">
 <Mail size={14} className="text-red-500" /> Email
 </button>
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm">
 <MessageCircle size={14} className="text-green-500" /> WhatsApp
 </button>
 </div>
 )}
 </div>
 <div className="relative">
 <button
 onClick={() => setActiveActionMenu(activeActionMenu === row.id ? null : row.id)}
 className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-brand-600 bg-sunken' : 'text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'}`}
 >
 <MoreVertical size={16} />
 </button>
 {activeActionMenu === row.id && (
 <div className="absolute right-0 bottom-full mb-2 w-64 bg-surface rounded-xl shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
 <div className="py-1">
 {row.source === 'pos' ? (
 <a href={route('store.pos', { store_slug: store?.slug }) + '?recall=' + row.id} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <Edit size={14} /> Open in POS
 </a>
 ) : (
 <Link href={route('store.sales.edit', { store_slug: store?.slug, sale: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <Edit size={14} /> View/Edit
 </Link>
 )}
 <Link href={route('store.sales.show', { store_slug: store?.slug, sale: row.id }) + '?action=return'} className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <RefreshCcw size={14} /> Convert To Return
 </Link>
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <Truck size={14} /> Preview Delivery Challan
 </button>
 <button className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary">
 <History size={14} /> Payment History
 </button>
 <button
 onClick={async () => { if (await confirm('Cancel invoice? Stock will be restored.')) router.post(route('store.sales.cancel', { store_slug: store?.slug, sale: row.id })); }}
 className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-red-600"
 >
 <XCircle size={14} /> Cancel Invoice
 </button>
 {isSuperAdmin && (
 <button
 onClick={() => {
 if (confirm('Are you sure you want to permanently delete this sale? This will restore stock.')) {
 router.delete(route('store.sales.destroy', { store_slug: store?.slug, sale: row.id }), {
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
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Infinite Scroll Sentinel inside scroll container */}
 <div ref={observerTarget} className="p-4 text-center text-ink-muted text-sm opacity-0 h-4">
 {sales.next_page_url ? 'Loading...' : ''}
 </div>
 </div>
 </div>

 {/* Quick View Modal - Centered Popup */}
 {
 quickViewSale && (
 <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-normal" onClick={() => setQuickViewSale(null)}>
 <div
 className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-line bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 shrink-0">
 <div className="flex flex-wrap items-center gap-3">
 <div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-wider">Invoice Preview</p>
 <h3 className="text-lg sm:text-xl font-bold text-brand-600 truncate">{quickViewSale.reference_number}</h3>
 </div>
 {quickViewSale.source === 'pos' && (
 <span className="text-2xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase shrink-0">POS</span>
 )}
 {(() => {
 const statusStyles = {
 paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
 partial: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
 unpaid: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
 };
 return (
 <span className={`px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[quickViewSale.payment_status] || 'bg-sunken text-ink-secondary'}`}>
 {quickViewSale.payment_status}
 </span>
 );
 })()}
 </div>
 <div className="flex items-center gap-2 justify-end">
 <PrintButton
 sale={quickViewSale}
 label="Print"
 variant="secondary"
 size="sm"
 className="font-bold text-xs"
 />
 <Link
 href={route('store.sales.edit', { store_slug: store?.slug, sale: quickViewSale.id })}
 className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1"
 >
 <Edit size={14} /> Edit Invoice
 </Link>
 <button
 onClick={() => setQuickViewSale(null)}
 className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-auto p-4">
 {/* Top Info Row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
 <div className="bg-app p-3 rounded-xl">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Customer</p>
 <p className="font-bold text-ink text-sm">{quickViewSale.customer?.name || 'Walk-in'}</p>
 {quickViewSale.customer?.phone && (
 <p className="text-xs text-ink-muted">{quickViewSale.customer.phone}</p>
 )}
 </div>
 <div className="bg-app p-3 rounded-xl">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Date & Time</p>
 <p className="font-bold text-ink text-sm">{formatDate(quickViewSale.created_at)}</p>
 <p className="text-xs text-ink-muted">{formatTime(quickViewSale.created_at)}</p>
 </div>
 <div className="bg-app p-3 rounded-xl">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Payment</p>
 <p className="font-bold text-ink text-sm uppercase">{quickViewSale.payment_method || 'Cash'}</p>
 </div>
 <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-xl border border-brand-200 dark:border-brand-800">
 <p className="text-2xs font-bold text-brand-600 uppercase mb-1">Total</p>
 <p className="font-bold text-brand-600 text-lg">{formatCurrency(quickViewSale.total, store)}</p>
 </div>
 </div>

 {/* Items Table */}
 <div className="border border-line rounded-xl overflow-hidden">
 <div className="bg-app px-4 py-2 border-b border-line">
 <p className="text-xs font-bold text-ink-secondary uppercase">
 Items in this Invoice ({quickViewSale.items?.length || 0})
 </p>
 </div>
 {/* Desktop Table View */}
 <div className="hidden sm:block max-h-[300px] overflow-auto">
 <table className="w-full text-sm">
 <thead className="sticky top-0 bg-surface border-b border-line">
 <tr>
 <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">#</th>
 <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">Item Name</th>
 <th className="text-center p-3 text-2xs font-bold text-ink-muted uppercase">
 {quickViewSale.items?.some(i => parseFloat(i.free_quantity || 0) > 0) ? 'Qty + Free' : 'Qty'}
 </th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Rate</th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Discount</th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {quickViewSale.items && quickViewSale.items.length > 0 ? (
 quickViewSale.items.map((item, idx) => (
 <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
 <td className="p-3 text-ink-muted font-mono text-xs">{idx + 1}</td>
 <td className="p-3">
 <p className="font-semibold text-ink">{item.product?.name || item.name || 'Unknown Item'}</p>
 {item.product?.sku && (
 <p className="text-2xs text-ink-muted font-mono">{item.product.sku}</p>
 )}
 </td>
 <td className="p-3 text-center font-bold text-ink-secondary">
 {parseFloat(item.free_quantity || 0) > 0 
 ? `${parseFloat(item.quantity) || 0}+${parseFloat(item.free_quantity) || 0}`
 : parseFloat(item.quantity) || 0
 }
 </td>
 <td className="p-3 text-right text-ink-secondary">{formatCurrency(item.price || item.unit_price || 0, store)}</td>
 <td className="p-3 text-right text-orange-600">
 {(parseFloat(item.discount_amount || item.discount || 0)) > 0 ? `-${formatCurrency(parseFloat(item.discount_amount || item.discount || 0), store)}` : '-'}
 </td>
 <td className="p-3 text-right font-bold text-ink">
 {formatCurrency((item.quantity * (item.price || item.unit_price || 0)) - parseFloat(item.discount_amount || item.discount || 0), store)}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="p-6 text-center text-ink-muted">
 No items data available
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile Stacked List View */}
 <div className="block sm:hidden divide-y divide-line max-h-[300px] overflow-auto">
 {quickViewSale.items && quickViewSale.items.length > 0 ? (
 quickViewSale.items.map((item, idx) => (
 <div key={idx} className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-2">
 <div className="flex items-start justify-between gap-2">
 <div className="flex gap-2 items-start">
 <span className="text-ink-muted font-mono text-xs">{idx + 1}.</span>
 <div>
 <p className="font-semibold text-ink text-xs">{item.product?.name || item.name || 'Unknown Item'}</p>
 {item.product?.sku && (
 <p className="text-2xs text-ink-muted font-mono mt-0.5">{item.product.sku}</p>
 )}
 </div>
 </div>
 <p className="text-xs font-bold text-ink shrink-0">
 {formatCurrency((item.quantity * (item.price || item.unit_price || 0)) - parseFloat(item.discount_amount || item.discount || 0), store)}
 </p>
 </div>
 <div className="grid grid-cols-3 gap-2 text-2xs bg-surface/50 dark:bg-app p-2 rounded-lg border border-line">
 <div>
 <span className="text-ink-muted block uppercase">
 {parseFloat(item.free_quantity || 0) > 0 ? 'Qty + Free' : 'Qty'}
 </span>
 <span className="font-bold text-ink-secondary">
 {parseFloat(item.free_quantity || 0) > 0 
 ? `${parseFloat(item.quantity) || 0}+${parseFloat(item.free_quantity) || 0}`
 : parseFloat(item.quantity) || 0
 }
 </span>
 </div>
 <div>
 <span className="text-ink-muted block uppercase">Rate</span>
 <span className="font-semibold text-ink-secondary">{formatCurrency(item.price || item.unit_price || 0, store)}</span>
 </div>
 <div>
 <span className="text-ink-muted block uppercase">Discount</span>
 <span className="font-semibold text-orange-600">
 {(parseFloat(item.discount_amount || item.discount || 0)) > 0 ? `-${formatCurrency(parseFloat(item.discount_amount || item.discount || 0), store)}` : '-'}
 </span>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-6 text-center text-ink-muted text-xs">
 No items data available
 </div>
 )}
 </div>
 {/* Summary Row */}
 <div className="bg-app px-4 py-3 border-t border-line">
 <div className="flex flex-wrap justify-between sm:justify-end gap-4 sm:gap-8">
 <div className="text-right">
 <p className="text-2xs text-ink-muted uppercase">Subtotal</p>
 <p className="font-bold text-ink-secondary">{formatCurrency(quickViewSale.subtotal_gross || quickViewSale.subtotal || quickViewSale.total, store)}</p>
 </div>
 {parseFloat(quickViewSale.total_item_discounts || 0) > 0 && (
 <div className="text-right">
 <p className="text-2xs text-ink-muted uppercase">Item Discounts</p>
 <p className="font-bold text-orange-600">-{formatCurrency(quickViewSale.total_item_discounts, store)}</p>
 </div>
 )}
 {parseFloat(quickViewSale.global_discount || quickViewSale.discount || 0) > 0 && (
 <div className="text-right">
 <p className="text-2xs text-ink-muted uppercase">Invoice Discount</p>
 <p className="font-bold text-orange-600">-{formatCurrency(quickViewSale.global_discount || quickViewSale.discount, store)}</p>
 </div>
 )}
 {quickViewSale.tax > 0 && (
 <div className="text-right">
 <p className="text-2xs text-ink-muted uppercase">Tax</p>
 <p className="font-bold text-ink-secondary">{formatCurrency(quickViewSale.tax, store)}</p>
 </div>
 )}
 <div className="text-right border-l border-line pl-8">
 <p className="text-2xs text-brand-600 uppercase font-bold">Grand Total</p>
 <p className="font-bold text-lg text-brand-600">{formatCurrency(quickViewSale.total, store)}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Payment Info */}
 <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center p-3 bg-app rounded-xl">
 <div className="flex gap-6 justify-between w-full sm:w-auto">
 <div>
 <p className="text-2xs text-ink-muted uppercase">Paid Amount</p>
 <p className="font-bold text-emerald-600">{formatCurrency(quickViewSale.paid_amount || (quickViewSale.payment_status === 'paid' ? quickViewSale.total : 0), store)}</p>
 </div>
 {(() => {
 const paid = parseFloat(quickViewSale.paid_amount || (quickViewSale.payment_status === 'paid' ? quickViewSale.total : 0));
 const balance = parseFloat(quickViewSale.total) - paid;
 if (balance > 1) {
 return (
 <div>
 <p className="text-2xs text-ink-muted uppercase">Balance Due</p>
 <p className="font-bold text-red-600">{formatCurrency(balance, store)}</p>
 </div>
 );
 }
 return null;
 })()}
 </div>
 <div className="flex gap-2 w-full sm:w-auto justify-end">
 <button
 onClick={() => { /* TODO: WhatsApp share */ }}
 className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
 >
 <MessageCircle size={14} /> Share
 </button>
 <Link
 href={route('store.sales.show', { store_slug: store?.slug, sale: quickViewSale.id }) + '?action=return'}
 className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors flex items-center gap-1"
 >
 <RefreshCcw size={14} /> Return
 </Link>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="p-3 border-t border-line bg-app text-center shrink-0">
 <p className="text-2xs text-ink-muted">Double-click row to edit directly • Press <kbd className="px-1.5 py-0.5 bg-sunken rounded text-ink-secondary font-mono">Esc</kbd> to close</p>
 </div>
 </div>
 </div>
 )
 }
 </OneGlanceLayout >
 );
}
