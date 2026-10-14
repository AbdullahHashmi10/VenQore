import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import { Search, BarChart3, FileSpreadsheet, Printer, MoreVertical, Mail, MessageCircle, Eye, RefreshCcw, FileText, History, Trash2, Copy, X, ChevronUp, ChevronDown, CornerUpRight, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Download, ChevronLeft, ChevronRight, Filter, Check, Plus } from 'lucide-react';
import MobileStats from '@/Components/MobileStats';

export default function TransactionsIndex({ transactions = { data: [], current_page: 1, last_page: 1, total: 0, next_page_url: null }, stats = {}, store }) {
    const { settings } = usePage().props;
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

    const handleExportCsv = () => exportRowsToCsv('transactions', [
        { label: 'Date', get: (r) => r.date },
        { label: 'Invoice No', get: (r) => r.reference },
        { label: 'Party', get: (r) => r.party?.name },
        { label: 'Type', get: (r) => r.type },
        { label: 'Amount', get: (r) => r.amount },
        { label: 'Balance', get: (r) => r.balance_due },
        { label: 'Status', get: (r) => r.payment_status },
    ], processData);

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
            ? <ChevronUp size={14} className="text-brand-500" />
            : <ChevronDown size={14} className="text-brand-500" />;
    };

    const getTypeConfig = (type) => {
        const configs = {
            sale: { label: 'Sale', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            purchase: { label: 'Purchase', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown },
            expense: { label: 'Expense', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle },
            payment_in: { label: 'Received', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', icon: ArrowDownCircle },
            payment_out: { label: 'Paid', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', icon: ArrowUpCircle },
            return: { label: 'Return', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: CornerUpRight }
        };
        return configs[type] || { label: type, color: 'bg-neutral-100 text-ink-secondary', icon: FileText };
    };


    const navGroups = useMoneyNavGroups();
    const typePills = [['all', 'All'], ['sale', 'Sales'], ['purchase', 'Purchases']];

    return (
        <OneGlanceLayout title="Transactions" activeMenu="Money" noPadding>
            <Head title="Transactions" />

            <div className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden md:contents">
              <ListPageFrame className="max-md:contents">
                {/* ── Desktop header: two rows ── */}
                <ListToolbar
                    title="Transactions"
                    navGroups={navGroups}
                    activeId="all"
                    left={(
                        <div className="flex items-center gap-1.5">
                            {typePills.map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTypeFilter(key)}
                                    className={`h-10 px-3 rounded-[12px] border text-sm font-semibold transition-colors ${typeFilter === key ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400' : 'border-line bg-app text-ink hover:bg-interactive-hover'}`}
                                >{label}</button>
                            ))}
                        </div>
                    )}
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search ref or party…' }}
                    actions={(
                        <>
                            <button style={canExportCsv() ? undefined : { display: 'none' }} type="button" onClick={handleExportCsv} className="h-10 w-10 flex items-center justify-center rounded-[12px] border border-line bg-app text-emerald-600 hover:bg-interactive-hover" title="Export"><Download size={16} /></button>
                            <button type="button" className="h-10 w-10 flex items-center justify-center rounded-[12px] border border-line bg-app text-ink-muted hover:text-ink hover:bg-interactive-hover" title="Print" onClick={() => PrintService.printPage()}><Printer size={16} /></button>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Count', value: stats.count || 0, icon: FileText, icon_tone: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' },
                    { label: 'Total Sales', value: formatCurrency(stats.total_debit || 0, store), icon: TrendingUp, icon_tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Received', value: formatCurrency(stats.total_credit || 0, store), icon: ArrowDownCircle, icon_tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value_tone: 'text-blue-600' },
                    { label: 'Unpaid / Due', value: formatCurrency(stats.total_balance_due || 0, store), icon: ArrowUpCircle, icon_tone: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', value_tone: 'text-red-600' },
                ]} />

                {/* Phone / existing header (hidden on md+) */}
                <div className="contents md:hidden">
                <MoneyModuleTabs activeTab="all" />

               {/* Mobile header (phone only) */}
 <div className="md:hidden relative z-40 shrink-0 bg-surface border border-line rounded-[14px] shadow-sm">
 {showMobileFilters && <div className="fixed inset-0 z-30" onClick={() => setShowMobileFilters(false)} aria-hidden="true" />}
 <div className="relative z-40 h-12 flex items-center gap-1 px-1.5">
 <div className="min-w-0 flex-1 pl-2">
 <span className="text-[15px] font-bold text-ink tracking-tight truncate block">Transactions</span>
 </div>
 <div>
 <button type="button" onClick={() => setShowMobileFilters(!showMobileFilters)} aria-haspopup="listbox" aria-expanded={showMobileFilters} aria-label="Filter"
 className={`h-9 px-2 rounded-[10px] border flex items-center gap-1 transition-colors ${typeFilter !== 'all' ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-line bg-app text-ink-secondary'}`}>
 <Filter size={16} />
 <ChevronDown size={14} className={`transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
 </button>
 {showMobileFilters && (
 <div role="listbox" className="absolute left-0 right-0 top-full mt-1 max-h-[60vh] overflow-y-auto bg-surface border border-line rounded-[12px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
 {[['all', 'All'], ['sale', 'Sales'], ['purchase', 'Purchases']].map(([key, label]) => (
 <button key={key} type="button" role="option" aria-selected={typeFilter === key} onClick={() => { setTypeFilter(key); setShowMobileFilters(false); }}
 className={`w-full h-10 px-3 rounded-[8px] text-sm text-left flex items-center justify-between gap-2 ${typeFilter === key ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-interactive-hover'}`}>
 <span className="truncate">{label}</span>
 {typeFilter === key && <Check size={15} className="shrink-0" />}
 </button>
 ))}
 </div>
 )}
 </div>
 <button type="button" onClick={() => setShowMobileSearch(!showMobileSearch)} aria-label="Search"
 className={`h-9 w-9 rounded-[10px] flex items-center justify-center transition-colors ${showMobileSearch || searchTerm ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-app text-ink-secondary'}`}>
 <Search size={17} />
 </button>
 <button type="button" onClick={() => PrintService.printPage()} aria-label="Print" className="h-9 w-9 rounded-[10px] bg-app text-ink-secondary flex items-center justify-center"><Printer size={17} /></button>
 
 </div>
 {showMobileSearch && (
 <div className="px-1.5 pb-1.5 -mt-0.5">
 <div className="relative">
 <input autoFocus type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder='Search ref or party...'
 className="w-full h-10 pl-9 pr-3 text-sm bg-app border border-line rounded-[10px] text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={15} />
 </div>
 </div>
 )}
 </div>

 <MobileStats bp="md" hero={3} items={[
 { label: 'Count', value: stats.count || 0, tone: 'brand', icon: FileText },
 { label: 'Total Sales', value: formatCurrency(stats.total_debit || 0, store), tone: 'emerald', icon: TrendingUp },
 { label: 'Received', value: formatCurrency(stats.total_credit || 0, store), tone: 'blue', icon: ArrowDownCircle },
 { label: 'Unpaid / Due', value: formatCurrency(stats.total_balance_due || 0, store), tone: 'red', icon: ArrowUpCircle }
 ]} />


                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app border-b border-line sticky top-0 z-10">
                                    {tableColumns.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className={`sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover ${col.align === 'right' ? 'text-right' : ''}`}
                                            style={{ width: col.width }}
                                        >
                                            <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                                {col.label} <SortIcon columnKey={col.key} />
                                            </div>
                                        </th>
                                    ))}
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right w-[10%]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {processData.length > 0 ? (
                                    processData.map((row) => {
                                        const typeConfig = getTypeConfig(row.type);
                                        const Icon = typeConfig.icon;

                                        return (
                                            <tr key={row.id + '-' + row.type} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group">
                                                <td className="p-3">
                                                    <span className="text-xs font-medium text-ink-secondary whitespace-nowrap">
                                                        {formatDate(row.date)}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                                                        {row.reference}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        <p className="text-xs font-bold text-ink truncate max-w-[180px]">
                                                            {row.party?.name || 'Walk-in Customer'}
                                                        </p>
                                                        {row.party?.phone && <p className="text-2xs text-ink-muted">{row.party.phone}</p>}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-2xs font-bold uppercase ${typeConfig.color}`}>
                                                        <Icon size={10} />
                                                        {typeConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className="text-xs font-mono font-bold text-ink">
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
                                                            row.payment_status === 'unpaid' ? 'text-red-600' : 'text-ink-muted'
                                                        }`}>
                                                        {row.payment_status || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right text-ink-muted">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600" 
                                                            title="Print"
                                                            onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row, null, settings); }}
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveActionMenu(activeActionMenu === row.id ? null : row.id)}
                                                                className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-ink-secondary"
                                                            >
                                                                <MoreVertical size={14} />
                                                            </button>
                                                            {activeActionMenu === row.id && (
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
                                                                    <button className="w-full text-left px-2 py-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-xs font-medium flex items-center gap-2 text-ink-secondary">
                                                                        <Eye size={12} /> View Details
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row, null, settings); setActiveActionMenu(null); }}
                                                                        className="w-full text-left px-2 py-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded text-xs font-medium flex items-center gap-2 text-ink-secondary"
                                                                    >
                                                                        <FileText size={12} /> Print / Invoice
                                                                    </button>
                                                                    <div className="h-px bg-sunken my-1"></div>
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
                                        <td colSpan={tableColumns.length + 1} className="p-5 sm:p-12 text-center text-ink-muted">
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
                    <div className="block sm:hidden divide-y divide-line animate-in fade-in duration-normal">
                        {processData.length > 0 ? (
                            processData.map((row) => {
                                const typeConfig = getTypeConfig(row.type);
                                const Icon = typeConfig.icon;

                                return (
                                    <div key={row.id + '-' + row.type} className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                                            <span className="text-2xs text-ink-muted font-medium font-mono">
                                                {formatDate(row.date)}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-3xs font-bold uppercase ${typeConfig.color}`}>
                                                <Icon size={8} />
                                                {typeConfig.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-ink break-all">
                                                Ref: <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{row.reference}</span>
                                            </p>
                                            <p className="text-xs font-semibold text-ink-secondary mt-0.5">
                                                {row.party?.name || 'Walk-in Customer'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-y-2 text-1xs pt-1.5 border-t border-dashed border-line mt-1">
                                            <div className="flex gap-2">
                                                <span className="text-ink font-mono font-bold">Amt: {formatCurrency(row.amount, store)}</span>
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
                                                    className="p-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded text-ink-muted relative"
                                                >
                                                    <MoreVertical size={12} />
                                                    {activeActionMenu === row.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-36 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95">
                                                            <button className="w-full text-left px-2 py-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded text-2xs font-medium flex items-center gap-1.5 text-ink-secondary">
                                                                <Eye size={10} /> View Details
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); PrintService.quickPrint(row); setActiveActionMenu(null); }}
                                                                className="w-full text-left px-2 py-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded text-2xs font-medium flex items-center gap-1.5 text-ink-secondary"
                                                            >
                                                                <FileText size={10} /> Print / Invoice
                                                            </button>
                                                            <div className="h-px bg-sunken my-0.5"></div>
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
                            <div className="p-5 sm:p-12 text-center text-ink-muted text-xs">
                                <FileText size={20} className="mx-auto mb-1.5 opacity-50" />
                                No transactions found
                            </div>
                        )}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-ink-muted text-sm border-t border-line opacity-0">
                        {nextPageUrl ? 'Loading...' : (allTransactions.length > 0 ? 'End of list' : '')}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-y-2 px-2 bg-surface py-2 rounded-xl md:rounded-[14px] border border-line shrink-0">
                    <div className="text-xs text-ink-muted font-medium">
                        Showing {allTransactions.length} of {transactions.total} records (Filtered: {processData.length})
                    </div>
                </div>
              </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
