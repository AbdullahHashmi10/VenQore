import React, { useState, useEffect, useCallback } from 'react';
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
    ShoppingCart
} from 'lucide-react';
import SellModuleTabs from '@/Components/SellModuleTabs';
import SmartCombobox from '@/Components/SmartCombobox';

export default function ProposalsList({ proposals = [], filters = {}, stats = {} }) {
    const { store } = usePage().props;
    // Strictly ensure defaultData is an array
    const resolveData = () => {
        if (!proposals) return [];
        if (Array.isArray(proposals)) return proposals;
        if (proposals.data && Array.isArray(proposals.data)) return proposals.data;
        return [];
    };

    const defaultData = resolveData();
    const [sortedData, setSortedData] = useState(defaultData);

    // Safety check for filters - prevent Array.prototype.filter being passed to useState if filters is []
    const safeFilters = (filters && !Array.isArray(filters)) ? filters : {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [activeFilter, setActiveFilter] = useState(safeFilters.filter || 'all');
    const [dateRange, setDateRange] = useState({
        from: safeFilters.from_date || '',
        to: safeFilters.to_date || ''
    });

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '12%' },
        { key: 'reference', label: 'Proposal No', width: '15%' },
        { key: 'party_name', label: 'Customer', width: '18%' },
        { key: 'items', label: 'Items', width: '8%' },
        { key: 'amount', label: 'Amount', width: '12%' },
        { key: 'valid_until', label: 'Valid Until', width: '10%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '15%', frozen: true }
    ]);

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [activeSharePopup, setActiveSharePopup] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Quick View Modal State
    const [quickViewItem, setQuickViewItem] = useState(null);
    const [clickTimeout, setClickTimeout] = useState(null);

    useEffect(() => {
        setSortedData(defaultData);
    }, [proposals]);

    // Handle Click Outside
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
            router.visit(route('store.proposals.show', { store_slug: store?.slug, proposal: row.id }));
        } else {
            const timeout = setTimeout(() => {
                setQuickViewItem(row);
                setClickTimeout(null);
            }, 250);
            setClickTimeout(timeout);
        }
    }, [clickTimeout]);

    // Search Handler
    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (!term) {
            setSortedData(defaultData);
        } else {
            const lower = term.toLowerCase();
            const filtered = defaultData.filter(item =>
                item.proposal_number?.toLowerCase().includes(lower) ||
                item.customer?.name?.toLowerCase().includes(lower) ||
                String(item.total).includes(lower)
            );
            setSortedData(filtered);
        }
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
            applyFilters({ from_date: newRange.from, to_date: newRange.to });
        }
    };

    const applyFilters = (newParams) => {
        router.get(route('store.proposals.index', { store_slug: store?.slug }), {
            search: searchTerm,
            filter: activeFilter,
            from_date: dateRange.from,
            to_date: dateRange.to,
            ...newParams
        }, { preserveState: true });
    };

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });

        const sorted = [...sortedData].sort((a, b) => {
            const valA = resolveValue(a, key);
            const valB = resolveValue(b, key);
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setSortedData(sorted);
    };

    function resolveValue(item, key) {
        switch (key) {
            case 'date': return item.created_at;
            case 'reference': return item.proposal_number;
            case 'party_name': return item.customer?.name || 'Walk-in';
            case 'amount': return parseFloat(item.total || 0);
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

    // Handle Convert to Sale
    const handleConvertToSale = async (id) => {
        if (await confirm('Convert this proposal to a sale?')) {
            router.post(route('store.proposals.convert', { store_slug: store?.slug, proposal: id }));
        }
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (await confirm('Are you sure you want to delete this proposal?')) {
            router.delete(route('store.proposals.destroy', { store_slug: store?.slug, proposal: id }));
        }
    };

    return (
        <OneGlanceLayout title="Proposals" activeMenu="Sell">
            <Head title="Proposals" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <SellModuleTabs activeTab="proposals" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Proposals</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.total_count || sortedData.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckSquare size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Accepted</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{stats?.accepted_count || 0}</p>
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
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(stats?.total_value || 0, store)}</p>
                    </div>
                </div>

                {/* Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Proposals / <span className="text-indigo-600">Quotations</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => { setActiveFilter('all'); applyFilters({ filter: 'all' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => { setActiveFilter('pending'); applyFilters({ filter: 'pending' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Pending</button>
                        <button
                            onClick={() => { setActiveFilter('accepted'); applyFilters({ filter: 'accepted' }); }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'accepted' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Accepted</button>
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
                        <div className="w-52">
                            <SmartCombobox
                                items={defaultData}
                                value={searchTerm}
                                onQueryChange={(val) => {
                                    setSearchTerm(val);
                                    if (!val) { setSortedData(defaultData); }
                                    else {
                                        const lower = val.toLowerCase();
                                        const filtered = defaultData.filter(item =>
                                            (item.proposal_number?.toLowerCase() || '').includes(lower) ||
                                            (item.customer?.name?.toLowerCase() || '').includes(lower)
                                        );
                                        setSortedData(filtered);
                                    }
                                }}
                                onSelect={(item) => { setSearchTerm(item.proposal_number); setSortedData([item]); }}
                                placeholder="Search..."
                                displayKey="proposal_number"
                                filterKey="proposal_number"
                            />
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link
                                href={route('store.proposals.create', { store_slug: store?.slug })}
                                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <Plus size={18} />
                                <span className="text-sm font-bold hidden sm:inline">New Proposal</span>
                            </Link>
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
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <FileText size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No proposals found</p>
                                            <p className="text-sm text-slate-500 mb-4">Create your first proposal to get started</p>
                                            <Link
                                                href={route('store.proposals.create', { store_slug: store?.slug })}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Create First Proposal
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
                                                        case 'reference': return <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.proposal_number || `PROP-${row.id}`}</span>;
                                                        case 'party_name':
                                                            return (
                                                                <div>
                                                                    <p className="font-semibold">{row.customer?.name || 'Walk-in'}</p>
                                                                    {row.customer?.phone && <p className="text-xs text-slate-400">{row.customer.phone}</p>}
                                                                </div>
                                                            );
                                                        case 'items': return <span className="font-bold">{row.items?.length || 0}</span>;
                                                        case 'amount': return <span className="font-bold">{formatCurrency(row.total, store)}</span>;
                                                        case 'valid_until':
                                                            const isExpired = row.valid_until && new Date(row.valid_until) < new Date();
                                                            return (
                                                                <span className={isExpired ? 'text-red-500' : 'text-slate-500'}>
                                                                    {formatDate(row.valid_until)}
                                                                </span>
                                                            );
                                                        case 'status':
                                                            const statusStyles = {
                                                                pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                                                accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                                                rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                                                                expired: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
                                                                converted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                            };
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[row.status] || 'bg-slate-100 text-slate-700'}`}>{row.status || 'pending'}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2 relative" onClick={(e) => e.stopPropagation()}>
                                                                    <a href={route('store.proposals.print', { store_slug: store?.slug, proposal: row.id })} target="_blank" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                                                                        <Printer size={16} />
                                                                    </a>
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
                                                                    <div className="relative">
                                                                        <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? 'text-indigo-600 bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                                            <MoreVertical size={16} />
                                                                        </button>
                                                                        {activeActionMenu === row.id && (
                                                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95">
                                                                                <div className="py-1">
                                                                                    <Link href={route('store.proposals.show', { store_slug: store?.slug, proposal: row.id })} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Eye size={14} /> View</Link>
                                                                                    {row.status !== 'converted' && (
                                                                                        <button onClick={() => handleConvertToSale(row.id)} className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm text-emerald-600">
                                                                                            <ShoppingCart size={14} /> Convert to Sale
                                                                                        </button>
                                                                                    )}
                                                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><Copy size={14} /> Duplicate</button>
                                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                                    <button onClick={() => handleDelete(row.id)} className="w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600"><Trash2 size={14} /> Delete</button>
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
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proposal Preview</p>
                                    <h3 className="text-xl font-black text-indigo-600">{quickViewItem.proposal_number || `PROP-${quickViewItem.id}`}</h3>
                                </div>
                                {(() => {
                                    const statusStyles = {
                                        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                                        accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                                        rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                    };
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[quickViewItem.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {quickViewItem.status || 'pending'}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={route('store.proposals.print', { store_slug: store?.slug, proposal: quickViewItem.id })}
                                    target="_blank"
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                    <Printer size={14} /> Print
                                </a>
                                <Link
                                    href={route('store.proposals.show', { store_slug: store?.slug, proposal: quickViewItem.id })}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                >
                                    <Edit size={14} /> Edit Proposal
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date Created</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewItem.created_at)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valid Until</p>
                                    <p className={`font-bold text-sm ${quickViewItem.valid_until && new Date(quickViewItem.valid_until) < new Date() ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                        {formatDate(quickViewItem.valid_until) || 'No expiry'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Total</p>
                                    <p className="font-black text-indigo-600 text-lg">{formatCurrency(quickViewItem.total, store)}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                        Items in this Proposal ({quickViewItem.items?.length || 0})
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
                                            <p className="text-[10px] text-slate-400 uppercase">Subtotal</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(quickViewItem.subtotal || quickViewItem.total, store)}</p>
                                        </div>
                                        <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-8">
                                            <p className="text-[10px] text-indigo-600 uppercase font-bold">Grand Total</p>
                                            <p className="font-black text-lg text-indigo-600">{formatCurrency(quickViewItem.total, store)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {quickViewItem.status !== 'converted' && (
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        onClick={() => { setQuickViewItem(null); handleConvertToSale(quickViewItem.id); }}
                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                    >
                                        <ShoppingCart size={16} /> Convert to Sale
                                    </button>
                                    <button
                                        onClick={() => { /* TODO: Convert to Pre-Sale */ }}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCcw size={16} /> Convert to Pre-Sale
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
