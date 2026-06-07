import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    FileMinus,
    Search,
    Plus,
    Download,
    Eye,
    Calendar,
    DollarSign,
    User,
    ArrowUpRight,
    Printer,
    MoreVertical,
    FileSpreadsheet,
    History,
    Trash2,
    CheckSquare,
    Clock,
    ShoppingBag,
    ChevronUp,
    ChevronDown,
    X,
    Filter
} from 'lucide-react';
import PurchaseModuleTabs from '@/Components/PurchaseModuleTabs';
import SmartCombobox from '@/Components/SmartCombobox';

export default function DebitNotesIndex({ debitNotes = [], filters = {}, stats = {} }) {
    // State for Infinite Scroll
    const [allNotes, setAllNotes] = useState(() => {
        if (Array.isArray(debitNotes)) return debitNotes;
        return debitNotes?.data || [];
    });
    const [nextPageUrl, setNextPageUrl] = useState(() => debitNotes?.next_page_url || null);
    const [loading, setLoading] = useState(false);

    // Observer Ref
    const observerTarget = React.useRef(null);
    const isLoading = React.useRef(false); // Ref for immediate access in observer

    // Update state when initial prop changes (e.g. filter apply)
    useEffect(() => {
        const newData = Array.isArray(debitNotes) ? debitNotes : (debitNotes?.data || []);
        setAllNotes(newData);
        setNextPageUrl(debitNotes?.next_page_url || null);
    }, [debitNotes]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;

        isLoading.current = true;
        setLoading(true);

        try {
            const response = await axios.get(nextPageUrl, {
                headers: { 'Accept': 'application/json' }
            });

            const newNotes = response.data.data || [];

            setAllNotes(prev => {
                // Prevent duplicates based on ID
                const existingIds = new Set(prev.map(n => n.id));
                const uniqueNew = newNotes.filter(n => !existingIds.has(n.id));
                return [...prev, ...uniqueNew];
            });

            setNextPageUrl(response.data.next_page_url);
        } catch (error) {
            console.error("Failed to fetch more debit notes:", error);
        } finally {
            isLoading.current = false;
            setLoading(false);
        }
    }, [nextPageUrl]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [nextPageUrl, fetchNextPage]);

    // Safer State Init using lazy initialization
    const [searchTerm, setSearchTerm] = useState(() => (filters && filters.search) ? filters.search : '');
    const [activeFilter, setActiveFilter] = useState(() => (filters && filters.filter) ? filters.filter : 'all');
    const [dateRange, setDateRange] = useState(() => ({
        from: (filters && filters.from_date) ? filters.from_date : '',
        to: (filters && filters.to_date) ? filters.to_date : ''
    }));

    // Computed Stats (Defensive)
    const computedStats = {
        total: stats?.total || allNotes.length,
        totalAmount: stats?.totalAmount || allNotes.reduce((sum, n) => sum + parseFloat(n.amount || 0), 0),
        open: stats?.open || allNotes.filter(n => n.status === 'open' || n.status === 'pending').length
    };

    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '15%' },
        { key: 'reference', label: 'Debit Note #', width: '15%' },
        { key: 'supplier', label: 'Supplier', width: '20%' },
        { key: 'amount', label: 'Amount', width: '15%' },
        { key: 'reason', label: 'Reason', width: '20%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '5%', frozen: true }
    ]);

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [quickViewItem, setQuickViewItem] = useState(null);

    // Sync State on Search/Filter
    useEffect(() => {
        setAllNotes(debitNotes?.data || []);
        setNextPageUrl(debitNotes?.next_page_url || null);
    }, [debitNotes]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest('.quick-view-modal')) return;
            setActiveActionMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const applyFilters = (newParams) => {
        router.get(route('store.debit-notes.index', { store_slug: store.slug }), {
            search: searchTerm,
            filter: activeFilter,
            from_date: dateRange.from,
            to_date: dateRange.to,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
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
            case 'reference': return item.reference_number;
            case 'supplier': return item.supplier?.name || '';
            case 'amount': return parseFloat(item.amount || 0);
            case 'status': return item.status;
            default: return item[key];
        }
    }

    // Memoized Sorting with Safety Check
    const sortedData = React.useMemo(() => {
        try {
            if (!Array.isArray(allNotes)) return [];
            return [...allNotes].sort((a, b) => {
                const valA = resolveValue(a, sortConfig.key);
                const valB = resolveValue(b, sortConfig.key);

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } catch (error) {
            console.error("Sorting error:", error);
            return [];
        }
    }, [allNotes, sortConfig]);

    // Sorting Handler
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
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

    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(Math.abs(val));
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <OneGlanceLayout title="Debit Notes" activeMenu="Purchase">
            <Head title="Debit Notes" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <PurchaseModuleTabs activeTab="debit-notes" />

                {/* Stats Cards - Compact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                <FileMinus size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Notes</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{computedStats.total}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Value</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{formatCurrency(computedStats.totalAmount)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ArrowUpRight size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Open Credits</p>
                        </div>
                        <p className="text-base font-black text-blue-600">{computedStats.open}</p>
                    </div>

                    <Link href={route('store.debit-notes.create', { store_slug: store.slug })} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all">
                        <Plus size={18} />
                        <span className="font-bold text-sm">New Debit Note</span>
                    </Link>
                </div>

                {/* Header Area */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0 flex items-center gap-2">
                            Debit <span className="text-red-600">Notes</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => { setActiveFilter('all'); setDateRange({ from: '', to: '' }); applyFilters({ filter: 'all', from_date: '', to_date: '' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => { setActiveFilter('open'); applyFilters({ filter: 'open' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'open' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Open</button>
                        <button
                            onClick={() => { setActiveFilter('used'); applyFilters({ filter: 'used' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'used' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Used</button>

                        <button
                            onClick={() => setActiveFilter('custom')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'custom' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Custom</button>

                        {activeFilter === 'custom' && (
                            <div className="flex items-center gap-1.5 ml-1">
                                <input type="date" name="from" value={dateRange.from} onChange={handleDateChange}
                                    className="px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-red-500" />
                                <span className="text-slate-400 text-xs">→</span>
                                <input type="date" name="to" value={dateRange.to} onChange={handleDateChange}
                                    className="px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-red-500" />
                            </div>
                        )}
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-52">
                            <SmartCombobox
                                items={allNotes}
                                value={searchTerm}
                                onQueryChange={(val) => {
                                    setSearchTerm(val);
                                }}
                                onSelect={(item) => {
                                    setSearchTerm(item.reference_number);
                                    applyFilters({ search: item.reference_number });
                                }}
                                placeholder="Search note..."
                                displayKey="reference_number"
                                filterKey="reference_number"
                            />
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

                {/* Table */}
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
                                            ${draggedColumn === index ? 'opacity-50 border-2 border-dashed border-red-500' : ''}
                                        `}
                                        style={{ width: col.width }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.key !== 'actions' && sortConfig.key === col.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-red-500" /> : <ChevronDown size={14} className="text-red-500" />
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
                                                <FileMinus size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No debit notes found</p>
                                            <Link
                                                href={route('store.debit-notes.create', { store_slug: store.slug })}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2 mt-2"
                                            >
                                                <Plus size={16} /> Create Debit Note
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => setQuickViewItem(row)}
                                        className={`
                                            hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-red-400
                                        `}
                                    >
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'date': return <span className="font-medium">{formatDate(row.date)}</span>;
                                                        case 'reference':
                                                            return <span className="font-mono text-red-600 dark:text-red-400 font-semibold">{row.reference_number || `DN-${row.id}`}</span>;
                                                        case 'supplier':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold">{row.supplier?.name || 'Unknown'}</p>
                                                                    {row.supplier?.phone && <p className="text-xs text-slate-400">{row.supplier.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'amount': return <span className="font-bold text-emerald-600">{formatCurrency(row.amount)}</span>;
                                                        case 'reason': return <span className="text-slate-500 text-xs italic">{row.reason || '-'}</span>;
                                                        case 'status':
                                                            const styles = {
                                                                used: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                                                open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                                                pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                                                cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                                            };
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${styles[row.status] || styles.open}`}>{row.status}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative">
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-red-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    <Link href={route('store.debit-notes.show', row.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                                                        <Eye size={14} /> View Details
                                                                                    </Link>
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
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
                            {/* Infinite Scroll Target */}
                            <tr ref={observerTarget}>
                                <td colSpan={tableColumns.length} className="h-4 p-0"></td>
                            </tr>
                            {loading && (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-400">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold uppercase">Loading more...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick View Modal */}
            {quickViewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQuickViewItem(null)}>
                    <div
                        className="quick-view-modal w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note Details</p>
                                <h3 className="text-xl font-black text-red-600">{quickViewItem.reference_number || `DN-${quickViewItem.id}`}</h3>
                            </div>
                            <button
                                onClick={() => setQuickViewItem(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-auto">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Supplier</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{quickViewItem.supplier?.name || 'Unknown'}</p>
                                    <p className="text-sm text-slate-500">{quickViewItem.supplier?.phone}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Amount</p>
                                    <p className="font-black text-emerald-600 text-lg">{formatCurrency(quickViewItem.amount)}</p>
                                    <p className="text-sm text-slate-500 uppercase">{quickViewItem.status}</p>
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 mb-6">
                                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">Reason</p>
                                <p className="text-slate-700 dark:text-slate-300 italic">{quickViewItem.reason || 'No specific reason provided.'}</p>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                                    <Printer size={16} /> Print Receipt
                                </button>
                                <Link
                                    href={route('store.debit-notes.show', quickViewItem.id)}
                                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
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
